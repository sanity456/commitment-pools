"""Opt-in native-value compatibility check against an existing Studionet v2 deployment.
Creates one clearly labeled, empty-capable diagnostic pool; never funds accounts.
Use a fresh ephemeral signer and a 1-wei test stake only.
"""
import os
import time
import pytest
from gltest import create_accounts, get_gl_client
from gltest.assertions import tx_execution_succeeded
from gltest.types import TransactionStatus

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(os.getenv("RUN_STUDIONET_VALUE_PROBE") != "1", reason="Opt-in existing-deployment value probe"),
]

def test_studionet_native_value_join():
    client = get_gl_client()
    assert client.chain_id == 61999, "This diagnostic must only run on Studionet"
    address = os.environ["COMMITMENT_POOL_V2_ADDRESS"]
    account = create_accounts(1)[0]
    existing_pool = os.getenv("STUDIONET_VALUE_PROBE_POOL_ID")
    pool_id = existing_pool or "value-probe-" + str(int(time.time()))
    def execute(method, args, value=0):
        tx = client.write_contract(address=address, function_name=method, args=args, account=account,
            value=value, leader_only=False, consensus_max_rotations=5)
        print(f"{method} transaction: {tx if isinstance(tx, str) else tx.hex()}", flush=True)
        receipt = client.wait_for_transaction_receipt(tx, status=TransactionStatus.ACCEPTED,
            retries=150, interval=3000)
        assert tx_execution_succeeded(receipt)
        return receipt
    print(f"Probe account: {account.address}; balance: {client.get_balance(account.address)} wei", flush=True)
    print(f"Probe pool: {pool_id}", flush=True)
    if not existing_pool:
        execute("create_pool", [pool_id, "Studionet native-value compatibility check",
            "Automated diagnostic. Do not join this pool.",
            "This pool exists only to verify a one-wei native stake; no real commitment.",
            "self_attested", 1, 1, 2, 2, 3600, 3600])
    else:
        pool = client.read_contract(address=address, function_name="get_pool", args=[pool_id])
        assert pool["stake_wei"] == "1" and pool["title"] == "Studionet native-value compatibility check"
    execute("join", [pool_id], value=1)
    participant = client.read_contract(address=address, function_name="get_participant",
        args=[pool_id, account.address])
    assert participant["stake_wei"] == "1"
