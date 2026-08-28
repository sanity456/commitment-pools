"""Direct-mode safety and lifecycle tests for CommitmentPoolV2.

Network and model calls are mocked. These tests exercise formation, immutable
fee snapshots, scheduled rounds, bounded retries, refunds, conservation, and
payout-emission accounting.
"""

import hashlib
import json
from pathlib import Path

import pytest


CONTRACT_PATH = str(
    Path(__file__).resolve().parents[1] / "contracts" / "commitment_pool_v2.py"
)
DIRECT_TEST_SDK_VERSION = "v0.2.16"

FEE_BPS = 500
STAKE = 1_000
JOIN_WINDOW = 24 * 3600
ROUND_WINDOW = 24 * 3600
TITLE = "Thirty focused minutes"
DESCRIPTION = "Complete one distraction-free focus block each day."
RULES = "Pass only when the submission clearly confirms a thirty-minute focus block."

T0 = "2026-01-01T00:00:00+00:00"
T_ACTIVE = "2026-01-02T00:00:01+00:00"
T_ROUND_TWO = "2026-01-03T00:00:01+00:00"


def addr(account) -> str:
    if isinstance(account, str):
        return account.lower()
    raw = account.as_bytes if hasattr(account, "as_bytes") else bytes(account)
    return "0x" + bytes(raw).hex()


@pytest.fixture()
def pool_v2(direct_deploy, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    direct_vm.value = 0
    direct_vm.warp(T0)
    return direct_deploy(CONTRACT_PATH, FEE_BPS, sdk_version=DIRECT_TEST_SDK_VERSION)


def create_pool(pool_v2, direct_vm, creator, pool_id="pool-1", **overrides):
    values = {
        "pool_id": pool_id,
        "title": TITLE,
        "description": DESCRIPTION,
        "rules": RULES,
        "verification_mode": "self_attested",
        "stake_wei": STAKE,
        "rounds_required": 1,
        "min_players": 2,
        "max_players": 10,
        "join_window_seconds": JOIN_WINDOW,
        "round_window_seconds": ROUND_WINDOW,
    }
    values.update(overrides)
    direct_vm.sender = creator
    return pool_v2.create_pool(**values)


def join(pool_v2, direct_vm, player, pool_id="pool-1", stake=STAKE):
    direct_vm.sender = player
    direct_vm.value = stake
    try:
        return pool_v2.join(pool_id)
    finally:
        direct_vm.value = 0


def activate(pool_v2, direct_vm, sender, pool_id="pool-1"):
    direct_vm.warp(T_ACTIVE)
    direct_vm.sender = sender
    return pool_v2.activate_pool(pool_id)


def mock_verdict(direct_vm, verdict="pass", confidence=90, reasoning="Rules met"):
    direct_vm.clear_mocks()
    direct_vm.mock_llm(
        r"(?s).*verify one scheduled commitment check-in.*",
        json.dumps(
            {
                "verdict": verdict,
                "confidence": confidence,
                "reasoning": reasoning,
            }
        ),
    )


def submit(pool_v2, direct_vm, player, nonce, pool_id="pool-1", proof="Done"):
    direct_vm.sender = player
    return pool_v2.submit_checkin(pool_id, proof, "", "", nonce)


def test_create_pool_snapshots_terms_and_fee(pool_v2, direct_vm, direct_alice):
    created = create_pool(pool_v2, direct_vm, direct_alice)
    record = pool_v2.get_pool("pool-1")

    assert created["status"] == "forming"
    assert record["creator"].lower() == addr(direct_alice)
    assert record["fee_recipient"].lower() == addr(direct_alice)
    assert record["fee_bps"] == FEE_BPS
    assert record["all_fail_policy"] == "refund_minus_fee"
    assert len(record["terms_hash"]) == 64
    assert record["activity_starts_at"] == record["join_deadline"]
    assert record["activity_ends_at"] == record["join_deadline"] + ROUND_WINDOW
    assert pool_v2.can_join("pool-1") is True


def test_create_pool_rejects_unsafe_terms(pool_v2, direct_vm, direct_alice):
    with direct_vm.expect_revert("2 <= min <= max"):
        create_pool(pool_v2, direct_vm, direct_alice, min_players=1)
    with direct_vm.expect_revert("Rounds must be between"):
        create_pool(pool_v2, direct_vm, direct_alice, rounds_required=0)
    with direct_vm.expect_revert("Verification mode"):
        create_pool(pool_v2, direct_vm, direct_alice, verification_mode="magic")
    with direct_vm.expect_revert("Round window must be between"):
        create_pool(pool_v2, direct_vm, direct_alice, round_window_seconds=60)


def test_fee_change_is_owner_only_delayed_and_future_only(
    pool_v2, direct_vm, direct_alice, direct_bob
):
    create_pool(pool_v2, direct_vm, direct_alice, pool_id="old-terms")

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Owner-only"):
        pool_v2.schedule_fee_bps(250)

    direct_vm.sender = direct_alice
    scheduled = pool_v2.schedule_fee_bps(250)
    assert scheduled["pending_fee_bps"] == 250
    with direct_vm.expect_revert("timelocked"):
        pool_v2.apply_scheduled_fee()

    direct_vm.warp(T_ACTIVE)
    applied = pool_v2.apply_scheduled_fee()
    assert applied["fee_bps"] == 250
    create_pool(pool_v2, direct_vm, direct_alice, pool_id="new-terms")

    assert pool_v2.get_pool("old-terms")["fee_bps"] == FEE_BPS
    assert pool_v2.get_pool("new-terms")["fee_bps"] == 250


def test_join_requires_exact_stake_and_formation_activation(
    pool_v2, direct_vm, direct_alice, direct_bob, direct_charlie
):
    create_pool(pool_v2, direct_vm, direct_alice, max_players=2)
    with direct_vm.expect_revert("Exact stake required"):
        join(pool_v2, direct_vm, direct_bob, stake=STAKE + 1)

    join(pool_v2, direct_vm, direct_bob)
    join(pool_v2, direct_vm, direct_charlie)
    with direct_vm.expect_revert("Already joined"):
        join(pool_v2, direct_vm, direct_bob)

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Formation remains open"):
        pool_v2.activate_pool("pool-1")

    activated = activate(pool_v2, direct_vm, direct_alice)
    assert activated["status"] == "active"
    assert pool_v2.can_join("pool-1") is False


def test_underfilled_pool_refunds_every_stake(
    pool_v2, direct_vm, direct_alice, direct_bob
):
    create_pool(pool_v2, direct_vm, direct_alice, min_players=2)
    join(pool_v2, direct_vm, direct_bob)
    result = activate(pool_v2, direct_vm, direct_alice)
    assert result["status"] == "refunding"

    direct_vm.sender = direct_bob
    refunded = pool_v2.claim_formation_refund("pool-1")
    assert refunded["credit_wei"] == str(STAKE)
    assert refunded["status"] == "cancelled"
    assert pool_v2.get_credit(addr(direct_bob))["credit_wei"] == str(STAKE)
    with direct_vm.expect_revert("not refunding"):
        pool_v2.claim_formation_refund("pool-1")


def test_late_activation_refunds_instead_of_forcing_missed_rounds(
    pool_v2, direct_vm, direct_alice, direct_bob, direct_charlie
):
    create_pool(pool_v2, direct_vm, direct_alice)
    join(pool_v2, direct_vm, direct_bob)
    join(pool_v2, direct_vm, direct_charlie)
    direct_vm.warp(T_ROUND_TWO)
    direct_vm.sender = direct_alice

    result = pool_v2.activate_pool("pool-1")
    assert result["status"] == "refunding"
    assert pool_v2.get_pool("pool-1")["activation_failure"] == "activation_grace_elapsed"

    direct_vm.sender = direct_bob
    assert pool_v2.claim_formation_refund("pool-1")["credit_wei"] == str(STAKE)
    direct_vm.sender = direct_charlie
    assert pool_v2.claim_formation_refund("pool-1")["status"] == "cancelled"


def test_scheduled_rounds_do_not_allow_early_or_late_recovery(
    pool_v2, direct_vm, direct_alice, direct_bob, direct_charlie
):
    create_pool(pool_v2, direct_vm, direct_alice, rounds_required=2)
    join(pool_v2, direct_vm, direct_bob)
    join(pool_v2, direct_vm, direct_charlie)

    direct_vm.sender = direct_bob
    mock_verdict(direct_vm)
    with direct_vm.expect_revert("not active"):
        pool_v2.submit_checkin("pool-1", "Done", "", "", "early")

    activate(pool_v2, direct_vm, direct_alice)
    direct_vm.sender = direct_bob
    first = pool_v2.submit_checkin("pool-1", "Done", "", "", "r1")
    assert first["round"] == 1
    with direct_vm.expect_revert("opens at"):
        pool_v2.submit_checkin("pool-1", "Done again", "", "", "r2-early")

    direct_vm.warp(T_ROUND_TWO)
    second = pool_v2.submit_checkin("pool-1", "Done again", "", "", "r2")
    assert second["participant_status"] == "success"

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("Round 1 has closed"):
        pool_v2.submit_checkin("pool-1", "Too late", "", "", "late")
    missed = pool_v2.mark_missed_round("pool-1", addr(direct_charlie))
    assert missed["status"] == "failed"


def test_unclear_attempts_are_bounded_and_nonces_are_unique(
    pool_v2, direct_vm, direct_alice, direct_bob, direct_charlie
):
    create_pool(pool_v2, direct_vm, direct_alice)
    join(pool_v2, direct_vm, direct_bob)
    join(pool_v2, direct_vm, direct_charlie)
    activate(pool_v2, direct_vm, direct_alice)
    mock_verdict(direct_vm, "unclear", confidence=0)

    direct_vm.sender = direct_bob
    first = pool_v2.submit_checkin("pool-1", "Maybe", "", "", "attempt-1")
    assert first["retriable"] is True
    with direct_vm.expect_revert("nonce already used"):
        pool_v2.submit_checkin("pool-1", "Maybe", "", "", "attempt-1")
    pool_v2.submit_checkin("pool-1", "Maybe", "", "", "attempt-2")
    last = pool_v2.submit_checkin("pool-1", "Maybe", "", "", "attempt-3")
    assert last["retriable"] is False
    with direct_vm.expect_revert("attempt limit"):
        pool_v2.submit_checkin("pool-1", "Maybe", "", "", "attempt-4")


def test_source_verified_digest_mismatch_is_unclear(
    pool_v2, direct_vm, direct_alice, direct_bob, direct_charlie
):
    create_pool(
        pool_v2,
        direct_vm,
        direct_alice,
        verification_mode="source_verified",
    )
    join(pool_v2, direct_vm, direct_bob)
    join(pool_v2, direct_vm, direct_charlie)
    activate(pool_v2, direct_vm, direct_alice)
    mock_verdict(direct_vm, "pass")
    direct_vm.mock_web(
        r"https://proofs\.example\.com/focus-1",
        {"status": 200, "body": "Focus session completed at 09:00."},
    )

    direct_vm.sender = direct_bob
    result = pool_v2.submit_checkin(
        "pool-1",
        "Completed the focus block.",
        "https://proofs.example.com/focus-1",
        "0" * 64,
        "digest-mismatch",
    )
    assert result["verdict"] == "unclear"
    assert result["retriable"] is True


def test_mixed_result_conserves_value_and_uses_fee_snapshot(
    pool_v2, direct_vm, direct_alice, direct_bob, direct_charlie
):
    create_pool(pool_v2, direct_vm, direct_alice)
    join(pool_v2, direct_vm, direct_bob)
    join(pool_v2, direct_vm, direct_charlie)
    activate(pool_v2, direct_vm, direct_alice)

    mock_verdict(direct_vm, "pass")
    submit(pool_v2, direct_vm, direct_bob, "winner")
    mock_verdict(direct_vm, "fail", reasoning="Submission contradicts the rule")
    submit(pool_v2, direct_vm, direct_charlie, "loser", proof="Skipped")

    settled = pool_v2.settle("pool-1")
    assert settled["winner_count"] == 1
    assert settled["loser_count"] == 1
    assert settled["fee_wei"] == "50"
    assert settled["share_wei"] == "950"
    assert settled["conservation_wei"] == str(2 * STAKE)
    assert pool_v2.get_credit(addr(direct_bob))["credit_wei"] == "1950"
    assert pool_v2.get_credit(addr(direct_alice))["credit_wei"] == "50"


def test_all_fail_refunds_minus_fee_instead_of_owner_windfall(
    pool_v2, direct_vm, direct_alice, direct_bob, direct_charlie
):
    create_pool(pool_v2, direct_vm, direct_alice)
    join(pool_v2, direct_vm, direct_bob)
    join(pool_v2, direct_vm, direct_charlie)
    activate(pool_v2, direct_vm, direct_alice)
    mock_verdict(direct_vm, "fail")
    submit(pool_v2, direct_vm, direct_bob, "fail-b")
    submit(pool_v2, direct_vm, direct_charlie, "fail-c")

    settled = pool_v2.settle("pool-1")
    assert settled["all_fail_refund"] is True
    assert settled["fee_wei"] == "100"
    assert settled["share_wei"] == "950"
    assert pool_v2.get_credit(addr(direct_bob))["credit_wei"] == "950"
    assert pool_v2.get_credit(addr(direct_charlie))["credit_wei"] == "950"
    assert pool_v2.get_credit(addr(direct_alice))["credit_wei"] == "100"


def test_withdraw_records_emission_without_claiming_delivery(
    pool_v2, direct_vm, direct_alice, direct_bob
):
    create_pool(pool_v2, direct_vm, direct_alice)
    join(pool_v2, direct_vm, direct_bob)
    activate(pool_v2, direct_vm, direct_alice)
    direct_vm.sender = direct_bob
    pool_v2.claim_formation_refund("pool-1")

    payout = pool_v2.withdraw()
    assert payout["amount_wei"] == str(STAKE)
    assert payout["status"] == "emitted_for_finalization"
    assert "not confirmation" in payout["delivery_note"]
    assert pool_v2.get_payout(payout["id"])["recipient"] == addr(direct_bob)
    assert pool_v2.get_credit(addr(direct_bob))["credit_wei"] == "0"


def test_lists_are_paginated_and_attempts_are_append_only(
    pool_v2, direct_vm, direct_alice, direct_bob, direct_charlie
):
    create_pool(pool_v2, direct_vm, direct_alice, pool_id="a")
    create_pool(pool_v2, direct_vm, direct_alice, pool_id="b")
    page = pool_v2.list_pools(1, 1)
    assert page["total"] == 2
    assert [item["id"] for item in page["items"]] == ["b"]

    join(pool_v2, direct_vm, direct_bob, pool_id="a")
    join(pool_v2, direct_vm, direct_charlie, pool_id="a")
    activate(pool_v2, direct_vm, direct_alice, pool_id="a")
    mock_verdict(direct_vm, "unclear")
    direct_vm.sender = direct_bob
    pool_v2.submit_checkin("a", "Unsure", "", "", "a-1")
    attempt = pool_v2.get_attempt("a", addr(direct_bob), 1, 1)
    assert attempt["verdict"] == "unclear"
    assert attempt["reasoning_provenance"] == "leader_output_non_authoritative"
    assert len(attempt["proof_digest"]) == hashlib.sha256().digest_size * 2


@pytest.mark.parametrize("stake", [1, 3, 19, 20, 101, 999, 10**18 + 1])
def test_three_player_dust_conservation(pool_v2, direct_vm, direct_alice, direct_bob, direct_charlie, stake):
    create_pool(pool_v2, direct_vm, direct_alice, stake_wei=stake)
    for player in [direct_alice, direct_bob, direct_charlie]:
        join(pool_v2, direct_vm, player, stake=stake)
    activate(pool_v2, direct_vm, direct_alice)
    mock_verdict(direct_vm, "pass")
    submit(pool_v2, direct_vm, direct_bob, "winner-b")
    submit(pool_v2, direct_vm, direct_charlie, "winner-c")
    mock_verdict(direct_vm, "fail")
    submit(pool_v2, direct_vm, direct_alice, "loser-a")
    settled = pool_v2.settle("pool-1")
    fee = stake * FEE_BPS // 10_000
    share, dust = divmod(stake - fee, 2)
    assert settled["conservation_wei"] == str(stake * 3)
    assert pool_v2.get_credit(addr(direct_bob))["credit_wei"] == str(stake + share)
    assert pool_v2.get_credit(addr(direct_charlie))["credit_wei"] == str(stake + share)
    assert pool_v2.get_credit(addr(direct_alice))["credit_wei"] == str(fee + dust)


def test_maximum_cohort_paginates_without_dropping_participants(pool_v2, direct_vm, direct_alice):
    from genlayer.py.types import Address
    create_pool(pool_v2, direct_vm, direct_alice, stake_wei=1, max_players=100)
    players = [Address((index + 1).to_bytes(20, "big")) for index in range(100)]
    for player in players:
        join(pool_v2, direct_vm, player, stake=1)
    assert pool_v2.get_pool("pool-1")["participant_count"] == 100
    first = pool_v2.list_participants("pool-1", 0, 50)
    second = pool_v2.list_participants("pool-1", 50, 50)
    assert len(first["items"]) == len(second["items"]) == 50
    assert len({item["address"] for item in first["items"] + second["items"]}) == 100
    with direct_vm.expect_revert("full"):
        join(pool_v2, direct_vm, Address((1001).to_bytes(20, "big")), stake=1)


def test_formation_and_round_deadline_edges_are_exclusive(pool_v2, direct_vm, direct_alice, direct_bob, direct_charlie):
    create_pool(pool_v2, direct_vm, direct_alice)
    join(pool_v2, direct_vm, direct_bob)
    join(pool_v2, direct_vm, direct_charlie)
    direct_vm.warp("2026-01-02T00:00:00+00:00")
    with direct_vm.expect_revert("closed"):
        join(pool_v2, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    pool_v2.activate_pool("pool-1")
    direct_vm.warp("2026-01-03T00:00:00+00:00")
    mock_verdict(direct_vm, "pass")
    with direct_vm.expect_revert():
        submit(pool_v2, direct_vm, direct_bob, "too-late")
    assert pool_v2.get_participant("pool-1", addr(direct_bob))["rounds_passed"] == 0
    assert pool_v2.can_settle("pool-1") is True
