"""Exact release boundaries derived from stored GenVM timestamps, never host time."""
from datetime import datetime, timezone
import json

import pytest

from test_commitment_pool_v3 import (
    pool_v3, create_pool, join, mock_verdict, submit, addr,
)


def warp_stored(direct_vm, timestamp):
    direct_vm.warp(datetime.fromtimestamp(timestamp, timezone.utc).isoformat())


def emit_evidence(case, stored, inputs, timestamps, output, expected_reasons):
    """Visible in the dedicated Ubuntu -s step; includes no signer material."""
    created_at = int(datetime.fromisoformat(stored["created_at"]).timestamp())
    print(json.dumps({
        "case": case,
        "scope": "direct-mode; network and model mocked; not human wallet evidence",
        "creation_input": {
            "pool_id": stored["id"],
            **{key: stored[key] for key in (
                "title", "description", "rules", "verification_mode", "stake_wei",
                "rounds_required", "min_players", "max_players", "round_window_seconds",
            )},
            "join_window_seconds": stored["join_deadline"] - created_at,
            "constructor_fee_bps": stored["fee_bps"],
        },
        "stored_chain_state": stored,
        "inputs": inputs,
        "chain_timestamps": timestamps,
        "observed_payload": output,
        "asserted_expected_reasons": expected_reasons,
    }, sort_keys=True))


@pytest.mark.parametrize("offset", [-1, 0, 1])
def test_formation_boundary_uses_stored_deadline(
    pool_v3, direct_vm, direct_alice, direct_bob, direct_charlie, offset,
):
    create_pool(pool_v3, direct_vm, direct_alice)
    join(pool_v3, direct_vm, direct_bob)
    join(pool_v3, direct_vm, direct_charlie)
    stored = pool_v3.get_pool("pool-1")
    warp_stored(direct_vm, stored["join_deadline"] + offset)
    assert pool_v3.can_join("pool-1") is (offset < 0)
    if offset < 0:
        with direct_vm.expect_revert("Formation remains open"):
            pool_v3.activate_pool("pool-1")
    else:
        with direct_vm.expect_revert("Join window has closed"):
            join(pool_v3, direct_vm, direct_alice)
        assert pool_v3.activate_pool("pool-1")["status"] == "active"
    assert pool_v3.get_pool("pool-1")["terms_hash"] == stored["terms_hash"]
    emit_evidence(
        f"formation_boundary_{offset:+d}", stored,
        {"method": "activate_pool", "args": ["pool-1"], "value_wei": "0"},
        {"formation_check": stored["join_deadline"] + offset},
        pool_v3.get_pool("pool-1"),
        ["[EXPECTED] Formation remains open"] if offset < 0
        else ["[EXPECTED] Join window has closed"],
    )


def test_round_close_is_exclusive_and_next_round_open_is_inclusive(
    pool_v3, direct_vm, direct_alice, direct_bob, direct_charlie,
):
    create_pool(pool_v3, direct_vm, direct_alice, rounds_required=2)
    join(pool_v3, direct_vm, direct_bob)
    join(pool_v3, direct_vm, direct_charlie)
    stored = pool_v3.get_pool("pool-1")
    warp_stored(direct_vm, stored["activity_starts_at"])
    pool_v3.activate_pool("pool-1")
    first = pool_v3.get_round("pool-1", 1)
    second = pool_v3.get_round("pool-1", 2)
    assert first["closes_at"] == second["opens_at"]
    warp_stored(direct_vm, first["closes_at"] - 1)
    mock_verdict(direct_vm)
    assert submit(pool_v3, direct_vm, direct_bob, "round-1")["rounds_passed"] == 1
    with direct_vm.expect_revert("Round 2 opens at"):
        submit(pool_v3, direct_vm, direct_bob, "round-2")
    warp_stored(direct_vm, first["closes_at"])
    with direct_vm.expect_revert("Round 1 has closed"):
        submit(pool_v3, direct_vm, direct_charlie, "too-late")
    assert submit(pool_v3, direct_vm, direct_bob, "round-2")["participant_status"] == "success"
    attempt = pool_v3.get_attempt("pool-1", addr(direct_bob), 2, 1)
    assert int(datetime.fromisoformat(attempt["submitted_at"]).timestamp()) == second["opens_at"]
    emit_evidence(
        "round_boundary", stored,
        {"method": "submit_checkin", "args": ["pool-1", "Done", "", "", "round-2"],
         "sender": addr(direct_bob), "value_wei": "0",
         "mock_model": {"verdict": "pass", "confidence": 90, "reasoning": "Rules met"}},
        {"round_1_last_second": first["closes_at"] - 1,
         "round_2_first_second": second["opens_at"]},
        {"first_round": first, "second_round": second, "second_attempt": attempt},
        ["[EXPECTED] Round 2 opens at", "[EXPECTED] Round 1 has closed"],
    )


@pytest.mark.parametrize("broken_model", [False, True])
def test_fixed_activity_deadline_always_allows_deterministic_settlement(
    pool_v3, direct_vm, direct_alice, direct_bob, direct_charlie, broken_model,
):
    create_pool(pool_v3, direct_vm, direct_alice)
    join(pool_v3, direct_vm, direct_bob)
    join(pool_v3, direct_vm, direct_charlie)
    stored = pool_v3.get_pool("pool-1")
    warp_stored(direct_vm, stored["activity_starts_at"])
    pool_v3.activate_pool("pool-1")
    if broken_model:
        for offset in [1, 60, 120]:
            warp_stored(direct_vm, stored["activity_starts_at"] + offset)
            direct_vm.clear_mocks()
            direct_vm.mock_llm(r"(?s).*", json.dumps({"verdict": "invalid-verdict"}))
            with direct_vm.expect_revert("Invalid verdict value"):
                submit(pool_v3, direct_vm, direct_bob, "reusable-after-error")
            assert pool_v3.get_participant("pool-1", addr(direct_bob))["last_attempt_id"] == ""
            assert pool_v3.get_pool("pool-1")["activity_ends_at"] == stored["activity_ends_at"]
    warp_stored(direct_vm, stored["activity_ends_at"] - 1)
    assert pool_v3.can_settle("pool-1") is False
    with direct_vm.expect_revert("Settlement requires"):
        pool_v3.settle("pool-1")
    warp_stored(direct_vm, stored["activity_ends_at"])
    assert pool_v3.can_settle("pool-1") is True
    with direct_vm.expect_revert("has closed"):
        submit(pool_v3, direct_vm, direct_bob, "expired")
    result = pool_v3.settle("pool-1")
    assert result == {
        "pool_id": "pool-1", "winner_count": 0, "loser_count": 2,
        "forfeited_pot_wei": "2000", "fee_wei": "100", "share_wei": "950",
        "all_fail_refund": True, "conservation_wei": "2000",
    }
    assert pool_v3.get_credit(addr(direct_bob))["credit_wei"] == "950"
    assert pool_v3.get_credit(addr(direct_charlie))["credit_wei"] == "950"
    assert pool_v3.get_credit(addr(direct_alice))["credit_wei"] == "100"
    with direct_vm.expect_revert("Pool is not active"):
        pool_v3.settle("pool-1")
    emit_evidence(
        "settlement_with_model_errors" if broken_model else "settlement_without_checkins",
        stored,
        {"method": "settle", "args": ["pool-1"], "value_wei": "0",
         "invalid_model_payload": {"verdict": "invalid-verdict"} if broken_model else None,
         "retry_args": ["pool-1", "Done", "", "", "reusable-after-error"] if broken_model else []},
        {"model_retries": [stored["activity_starts_at"] + offset for offset in [1, 60, 120]] if broken_model else [],
         "settlement_before_deadline": stored["activity_ends_at"] - 1,
         "settlement_at_deadline": stored["activity_ends_at"]},
        result,
        ["[EXPECTED] Settlement requires", "[EXPECTED] Pool is not active"]
        + (["[LLM_ERROR] Invalid verdict value"] if broken_model else []),
    )
