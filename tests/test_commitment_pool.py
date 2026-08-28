"""Fast direct-mode tests for CommitmentPool.

Web and LLM calls are mocked; no network is used. Run from the repo root:
``pytest commitment-pools/tests -q``
"""

import json
from pathlib import Path

import pytest


CONTRACT_PATH = str(
    Path(__file__).resolve().parents[1] / "contracts" / "commitment_pool.py"
)
DIRECT_TEST_SDK_VERSION = "v0.2.16"
FEE_BPS = 500
STAKE = 1_000
DESCRIPTION = "Meditate every morning"
RULES = "RULESET-ZEN: Proof must describe a completed meditation session of at least ten minutes on the same day."
JOIN_WINDOW = 86_400
ACTIVITY_WINDOW = 7 * 86_400

T0 = "2026-01-01T00:00:00+00:00"
T_AFTER_JOIN = "2026-01-02T00:00:01+00:00"
T_SETTLE = "2026-01-09T00:00:01+00:00"


def addr_text(account) -> str:
    if isinstance(account, (bytes, bytearray)):
        return "0x" + bytes(account).hex()
    return str(account)


@pytest.fixture()
def pool(direct_deploy, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    direct_vm.warp(T0)
    return direct_deploy(
        CONTRACT_PATH, FEE_BPS, sdk_version=DIRECT_TEST_SDK_VERSION
    )


def make_commitment(
    pool, direct_vm, sender, cid="c-1", stake=STAKE, rounds=1, cap=10, **overrides
):
    values = {
        "commitment_id": cid,
        "description": DESCRIPTION,
        "rules": RULES,
        "stake_atto": stake,
        "rounds_required": rounds,
        "max_players": cap,
        "join_window_seconds": JOIN_WINDOW,
        "activity_seconds": ACTIVITY_WINDOW,
    }
    values.update(overrides)
    direct_vm.sender = sender
    result = pool.create_commitment(**values)
    return result


def join(pool, direct_vm, sender, cid="c-1", stake=STAKE):
    direct_vm.sender = sender
    direct_vm.value = stake
    try:
        return pool.join(cid)
    finally:
        direct_vm.value = 0


def mock_verdict(direct_vm, verdict, confidence=90, reasoning="ok"):
    direct_vm.clear_mocks()
    direct_vm.mock_llm(
        r"(?s).*habit-commitment check-in.*",
        json.dumps(
            {"verdict": verdict, "confidence": confidence, "reasoning": reasoning}
        ),
    )


def test_config_and_fee_guard(pool, direct_vm, direct_alice, direct_bob):
    config = pool.get_config()
    assert config["owner"].lower() == addr_text(direct_alice).lower()
    assert int(config["fee_bps"]) == FEE_BPS

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Owner-only method"):
        pool.set_fee_bps(100)

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("cannot exceed"):
        pool.set_fee_bps(5000)
    pool.set_fee_bps(250)
    assert int(pool.get_config()["fee_bps"]) == 250


def test_create_commitment_stores_terms(pool, direct_vm, direct_alice):
    result = make_commitment(pool, direct_vm, direct_alice)
    record = pool.get_commitment("c-1")

    assert result["status"] == "open"
    assert record["description"] == DESCRIPTION
    assert record["rules"] == RULES
    assert record["status"] == "open"
    assert int(record["stake_atto"]) == STAKE
    assert record["creator"].lower() == addr_text(direct_alice).lower()
    assert int(record["join_deadline"]) == 1767225600 + JOIN_WINDOW
    assert (
        int(record["settle_not_before"])
        == 1767225600 + JOIN_WINDOW + ACTIVITY_WINDOW
    )
    assert pool.can_join("c-1") is True
    assert pool.can_settle("c-1") is False


def test_create_commitment_validation(pool, direct_vm, direct_alice, direct_bob):
    make_commitment(pool, direct_vm, direct_alice)
    with direct_vm.expect_revert("Duplicate commitment id"):
        make_commitment(pool, direct_vm, direct_bob)
    with direct_vm.expect_revert("Stake must be greater than zero"):
        make_commitment(pool, direct_vm, direct_alice, cid="bad", stake=0)
    with direct_vm.expect_revert("Rounds must be between"):
        make_commitment(pool, direct_vm, direct_alice, cid="bad", rounds=0)
    with direct_vm.expect_revert("Max players must be between"):
        make_commitment(pool, direct_vm, direct_alice, cid="bad", cap=201)
    with direct_vm.expect_revert("Join window must be between"):
        make_commitment(
            pool, direct_vm, direct_alice, cid="bad", join_window_seconds=0
        )
    assert pool.list_commitments(0, 10)["total"] == 1


def test_join_escrows_exact_stake(pool, direct_vm, direct_alice, direct_bob, direct_charlie):
    make_commitment(pool, direct_vm, direct_alice, cap=2)

    with direct_vm.expect_revert("Exact stake required"):
        join(pool, direct_vm, direct_bob, stake=STAKE + 1)

    joined = join(pool, direct_vm, direct_bob)
    assert joined["players"] == 1
    assert join(pool, direct_vm, direct_charlie)["players"] == 2

    with direct_vm.expect_revert("Already joined"):
        join(pool, direct_vm, direct_bob)
    with direct_vm.expect_revert("Commitment is full"):
        join(pool, direct_vm, direct_alice)

    participants = pool.list_participants("c-1")
    assert len(participants) == 2
    assert all(int(p["stake_atto"]) == STAKE for p in participants)


def test_join_after_deadline_rejected(pool, direct_vm, direct_alice, direct_bob):
    make_commitment(pool, direct_vm, direct_alice)
    direct_vm.warp(T_AFTER_JOIN)
    with direct_vm.expect_revert("Joining window has closed"):
        join(pool, direct_vm, direct_bob)
    assert pool.can_join("c-1") is False


def test_checkin_pass_completes_commitment(pool, direct_vm, direct_alice, direct_bob):
    make_commitment(pool, direct_vm, direct_alice, rounds=2)
    join(pool, direct_vm, direct_bob)
    direct_vm.warp(T_AFTER_JOIN)
    mock_verdict(direct_vm, "pass")

    first = pool.submit_checkin("c-1", "Sat for fifteen minutes after waking up.")
    assert first["verdict"] == "pass"
    assert first["rounds_passed"] == 1
    assert first["player_status"] == "active"

    second = pool.submit_checkin("c-1", "Completed another ten minute session.")
    assert second["player_status"] == "success"
    assert pool.get_participant("c-1", str(direct_bob))["status"] == "success"

    checkin = pool.get_checkin("c-1", str(direct_bob), 1)
    assert checkin["verdict"] == "pass"
    assert checkin["reasoning_provenance"] == "leader_output_non_authoritative"

    with direct_vm.expect_revert("does not allow check-ins"):
        pool.submit_checkin("c-1", "Extra round should be rejected")


def test_checkin_fail_eliminates_player(pool, direct_vm, direct_alice, direct_bob):
    make_commitment(pool, direct_vm, direct_alice, rounds=1)
    join(pool, direct_vm, direct_bob)
    direct_vm.warp(T_AFTER_JOIN)
    mock_verdict(direct_vm, "fail", reasoning="No session described")

    result = pool.submit_checkin("c-1", "I did not meditate today.")
    assert result["verdict"] == "fail"
    assert result["player_status"] == "failed"

    with direct_vm.expect_revert("does not allow check-ins"):
        pool.submit_checkin("c-1", "Trying again anyway")


def test_checkin_unclear_is_retriable(pool, direct_vm, direct_alice, direct_bob):
    make_commitment(pool, direct_vm, direct_alice, rounds=1)
    join(pool, direct_vm, direct_bob)
    direct_vm.warp(T_AFTER_JOIN)

    mock_verdict(direct_vm, "unclear")
    unclear = pool.submit_checkin("c-1", "Vague description.")
    assert unclear["verdict"] == "unclear"
    assert unclear["retriable"] is True
    assert unclear["rounds_passed"] == 0
    assert pool.get_participant("c-1", str(direct_bob))["status"] == "active"

    mock_verdict(direct_vm, "pass")
    retried = pool.submit_checkin("c-1", "Ten calm minutes at sunrise.")
    assert retried["verdict"] == "pass"
    assert retried["rounds_passed"] == 1


def test_checkin_guards(pool, direct_vm, direct_alice, direct_bob):
    make_commitment(pool, direct_vm, direct_alice)
    join(pool, direct_vm, direct_bob)

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Not a participant"):
        pool.submit_checkin("c-1", "I am not even in this pool")

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("must not be empty"):
        pool.submit_checkin("c-1", "   ")

    direct_vm.warp(T_SETTLE)
    with direct_vm.expect_revert("Activity window has closed"):
        pool.submit_checkin("c-1", "Too late")


def test_settle_blocked_until_deadline_or_all_terminal(
    pool, direct_vm, direct_alice, direct_bob
):
    make_commitment(pool, direct_vm, direct_alice)
    join(pool, direct_vm, direct_bob)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Settlement opens at the deadline"):
        pool.settle("c-1")

    direct_vm.sender = direct_bob
    direct_vm.warp(T_AFTER_JOIN)
    mock_verdict(direct_vm, "pass")
    pool.submit_checkin("c-1", "Ten quiet minutes this morning.")

    settled = pool.settle("c-1")
    assert settled["winners"] and settled["losers"] == []


def test_settle_mixed_pool_splits_pot(
    pool, direct_vm, direct_alice, direct_bob, direct_charlie
):
    make_commitment(pool, direct_vm, direct_alice)
    join(pool, direct_vm, direct_bob)
    join(pool, direct_vm, direct_charlie)
    direct_vm.warp(T_AFTER_JOIN)
    mock_verdict(direct_vm, "pass")
    direct_vm.sender = direct_bob
    pool.submit_checkin("c-1", "Morning sit complete.")
    direct_vm.sender = direct_charlie
    mock_verdict(direct_vm, "fail", reasoning="Proof admits skipping")
    pool.submit_checkin("c-1", "Skipped today entirely.")

    settled = pool.settle("c-1")
    assert len(settled["winners"]) == 1
    assert settled["losers"]
    assert int(settled["pot_atto"]) == STAKE
    assert int(settled["fee_atto"]) == 50
    assert int(settled["share_per_winner_atto"]) == 950

    winner_credit = int(pool.get_credit(addr_text(direct_bob))["credit_atto"])
    owner_credit = int(pool.get_credit(addr_text(direct_alice))["credit_atto"])
    assert winner_credit == STAKE + 950
    assert owner_credit == 50
    assert winner_credit + owner_credit == 2 * STAKE

    record = pool.get_commitment("c-1")
    assert record["status"] == "settled"
    assert record["winner_count"] == 1
    assert record["loser_count"] == 1
    with direct_vm.expect_revert("Commitment already closed"):
        pool.settle("c-1")


def test_settle_all_fail_forfeits_to_owner(
    pool, direct_vm, direct_alice, direct_bob, direct_charlie
):
    make_commitment(pool, direct_vm, direct_alice)
    join(pool, direct_vm, direct_bob)
    join(pool, direct_vm, direct_charlie)
    direct_vm.warp(T_AFTER_JOIN)
    mock_verdict(direct_vm, "fail")
    direct_vm.sender = direct_bob
    pool.submit_checkin("c-1", "Missed it.")
    direct_vm.sender = direct_charlie
    pool.submit_checkin("c-1", "Missed it too.")

    settled = pool.settle("c-1")
    assert int(settled["pot_atto"]) == 2 * STAKE
    owner_credit = int(pool.get_credit(addr_text(direct_alice))["credit_atto"])
    assert owner_credit == 2 * STAKE
    assert int(pool.get_stats()["fees_collected_atto"]) >= 0


def test_inactive_players_force_failed_at_deadline(
    pool, direct_vm, direct_alice, direct_bob, direct_charlie
):
    make_commitment(pool, direct_vm, direct_alice)
    join(pool, direct_vm, direct_bob)
    join(pool, direct_vm, direct_charlie)
    direct_vm.warp(T_AFTER_JOIN)
    mock_verdict(direct_vm, "pass")
    direct_vm.sender = direct_bob
    pool.submit_checkin("c-1", "Done before sunrise.")

    assert pool.can_settle("c-1") is False
    direct_vm.warp(T_SETTLE)
    assert pool.can_settle("c-1") is True

    settled = pool.settle("c-1")
    assert len(settled["winners"]) == 1
    inactive = pool.get_participant("c-1", str(direct_charlie))
    assert inactive["status"] == "failed"


def test_cancel_rules(pool, direct_vm, direct_alice, direct_bob):
    make_commitment(pool, direct_vm, direct_alice)

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only the commitment creator"):
        pool.cancel_commitment("c-1")

    direct_vm.sender = direct_alice
    join(pool, direct_vm, direct_bob)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Cannot cancel after players have staked"):
        pool.cancel_commitment("c-1")

    make_commitment(pool, direct_vm, direct_alice, cid="empty")
    cancelled = pool.cancel_commitment("empty")
    assert cancelled["status"] == "cancelled"
    with direct_vm.expect_revert("Only open commitments"):
        pool.cancel_commitment("empty")


def test_withdraw_credits(pool, direct_vm, direct_alice, direct_bob, direct_charlie):
    make_commitment(pool, direct_vm, direct_alice)
    join(pool, direct_vm, direct_bob)
    join(pool, direct_vm, direct_charlie)
    direct_vm.warp(T_AFTER_JOIN)
    mock_verdict(direct_vm, "pass")
    direct_vm.sender = direct_bob
    pool.submit_checkin("c-1", "Fifteen minutes of stillness.")
    direct_vm.sender = direct_charlie
    mock_verdict(direct_vm, "fail")
    pool.submit_checkin("c-1", "Forgot entirely.")

    settled_result = pool.settle("c-1")
    assert int(settled_result["share_per_winner_atto"]) == 950

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("No credits available"):
        pool.withdraw()

    direct_vm.sender = direct_bob
    withdrawn = pool.withdraw()
    assert int(withdrawn["withdrawn_atto"]) == STAKE + 950
    assert int(pool.get_credit(str(direct_bob))["credit_atto"]) == 0
    with direct_vm.expect_revert("No credits available"):
        pool.withdraw()


def test_list_and_stats(pool, direct_vm, direct_alice, direct_bob):
    make_commitment(pool, direct_vm, direct_alice, cid="a")
    make_commitment(pool, direct_vm, direct_alice, cid="b")

    listing = pool.list_commitments(0, 10)
    assert listing["total"] == 2
    assert [item["id"] for item in listing["items"]] == ["a", "b"]

    page = pool.list_commitments(1, 1)
    assert [item["id"] for item in page["items"]] == ["b"]

    join(pool, direct_vm, direct_bob, cid="a")
    stats = pool.get_stats()
    assert stats["commitments_created"] == 2
    assert stats["joins"] == 1
