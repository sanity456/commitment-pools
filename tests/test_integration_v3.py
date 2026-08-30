"""Opt-in full-consensus smoke test for CommitmentPoolV3."""

import os
import time

import pytest

from gltest import create_accounts, get_contract_factory, get_gl_client
from gltest.assertions import tx_execution_succeeded
from gltest.contracts import Contract
from gltest.utils import extract_contract_address


pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.getenv("RUN_GENLAYER_V3_INTEGRATION") != "1",
        reason="Set RUN_GENLAYER_V3_INTEGRATION=1 with GenLayer Studio running",
    ),
]


def deploy_with_schema_retry(factory, wallet):
    receipt = factory.deploy_contract_tx(
        account=wallet,
        args=[500],
        consensus_max_rotations=5,
    )
    assert tx_execution_succeeded(receipt)
    address = extract_contract_address(receipt)
    for attempt in range(20):
        try:
            schema = get_gl_client().get_contract_schema(address)
            return Contract.new(address, schema, account=wallet)
        except Exception:
            if attempt == 19:
                raise
            time.sleep(3)


def test_commitment_pool_v3_full_consensus_creation():
    wallet = create_accounts(1)[0]
    contract = deploy_with_schema_retry(get_contract_factory("CommitmentPoolV3"), wallet)
    config = contract.get_config().call()
    assert config["protocol_version"] == 3
    assert config["max_source_bytes"] == 6000
    assert config["owner"].lower() == wallet.address.lower()
    assert config["fee_bps"] == 500
    pool_id = f"integration-{wallet.address[-8:].lower()}"
    receipt = contract.create_pool(
        args=[
            pool_id,
            "Integration focus block",
            "Complete one thirty-minute focus block.",
            "A clear same-day statement must confirm the block.",
            "self_attested",
            1000,
            1,
            2,
            10,
            24 * 3600,
            24 * 3600,
        ]
    ).transact(consensus_max_rotations=5)
    assert tx_execution_succeeded(receipt)
    record = contract.get_pool(args=[pool_id]).call()
    assert record["status"] == "forming"
    assert record["fee_bps"] == 500
    assert record["terms_hash"]
