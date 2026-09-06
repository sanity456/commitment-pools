"""Binding metadata for the pinned GLSim integration harness, not a mock VM."""

from gltest.assertions import tx_execution_succeeded
from gltest.contracts import Contract
from gltest.utils import extract_contract_address


# GLSim 0.29.2 executes this runner but its schema extractor does not recognize
# the runner's public-method markers. Contract.new uses only method names and
# readonly flags to bind SDK calls. The simulator still executes the real source
# and calldata through five validators; no result or receipt is substituted.
INTEGRATION_SCHEMA = {
    "ctor": {"params": ["u256"], "kwparams": {}},
    "methods": {
        "create_pool": {
            "params": ["string"] * 5 + ["u256"] * 6,
            "kwparams": {}, "ret": "dict", "readonly": False,
        },
        "get_pool": {
            "params": ["string"], "kwparams": {}, "ret": "dict", "readonly": True,
        },
        "get_config": {
            "params": [], "kwparams": {}, "ret": "dict", "readonly": True,
        },
    },
}


def deploy_for_integration(factory, wallet):
    receipt = factory.deploy_contract_tx(
        account=wallet, args=[500], consensus_max_rotations=5,
    )
    assert tx_execution_succeeded(receipt), receipt
    address = extract_contract_address(receipt)
    return Contract.new(address, INTEGRATION_SCHEMA, account=wallet)
