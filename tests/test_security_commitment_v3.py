"""Security regressions: passing means the v3 defense holds, not an exploit."""
import hashlib
import json
import re
from pathlib import Path

import pytest

from test_commitment_pool_v3 import (
    pool_v3, create_pool, join, activate, addr, DIRECT_TEST_SDK_VERSION,
)

ROOT = Path(__file__).resolve().parents[1]
URLS = json.loads((ROOT / "tests/fixtures/evidence-urls.json").read_text())
URL = "https://evidence.example.com/complete-source"
TAIL = "CRITICAL_APPENDIX: the material requirements are NOT met."


def digest(value):
    return hashlib.sha256(re.sub(r"\s+", " ", value).strip().encode()).hexdigest()


@pytest.fixture
def active(pool_v3, direct_vm, direct_alice, direct_bob, direct_charlie):
    create_pool(pool_v3, direct_vm, direct_alice, verification_mode="source_verified")
    join(pool_v3, direct_vm, direct_bob)
    join(pool_v3, direct_vm, direct_charlie)
    activate(pool_v3, direct_vm, direct_alice)
    direct_vm.sender = direct_bob
    return pool_v3


@pytest.fixture
def helper(direct_deploy, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    direct_vm.value = 0
    return direct_deploy(str(ROOT / "contracts/evidence_capture_v3.py"), "0x" + "11" * 20,
                         sdk_version=DIRECT_TEST_SDK_VERSION)


@pytest.mark.parametrize("body", ["x" * 6001, "é" * 3001, "x" * 8800 + TAIL])
def test_oversize_source_is_rejected_without_spending_attempt(active, direct_vm, direct_bob, body):
    direct_vm.mock_web(re.escape(URL), {"status": 200, "body": body})
    direct_vm.mock_llm(r"(?s).*", json.dumps({"verdict": "pass", "confidence": 100, "reasoning": "Must not run"}))
    with direct_vm.expect_revert("exceeds 6000 UTF-8 bytes"):
        active.submit_checkin("pool-1", "Complete", URL, digest(body), "oversize")
    assert active.get_participant("pool-1", addr(direct_bob))["rounds_passed"] == 0
    direct_vm.clear_mocks()
    direct_vm.mock_web(re.escape(URL), {"status": 200, "body": "Complete approved receipt"})
    direct_vm.mock_llm(r"(?s).*", json.dumps({"verdict": "pass", "confidence": 100, "reasoning": "Complete source"}))
    active.submit_checkin("pool-1", "Complete", URL, digest("Complete approved receipt"), "oversize")
    assert active.get_attempt("pool-1", addr(direct_bob), 1, 1)["verdict"] == "pass"


def test_entire_supported_source_including_appendix_reaches_model(active, direct_vm, direct_bob):
    body = "x" * (6000 - len(TAIL)) + TAIL
    direct_vm.mock_web(re.escape(URL), {"status": 200, "body": body})
    direct_vm.mock_llm(r"(?s)^.*CRITICAL_APPENDIX.*$", json.dumps({"verdict": "fail", "confidence": 100, "reasoning": "The appendix contradicts the claim"}))
    result = active.submit_checkin("pool-1", "Complete", URL, digest(body), "complete-source")
    assert result["verdict"] == "fail"
    assert active.get_attempt("pool-1", addr(direct_bob), 1, 1)["observed_evidence_digest"] == digest(body)


@pytest.mark.parametrize("body", ["x" * 6001, "é" * 3001, "x" * 8800 + TAIL])
def test_capture_uses_the_same_complete_source_limit(helper, direct_vm, body):
    direct_vm.mock_web(re.escape(URL), {"status": 200, "body": body})
    with direct_vm.expect_revert("exceeds 6000 UTF-8 bytes"):
        helper.capture(URL, "oversize")
    assert helper.get_config()["captures"] == 0
    assert helper.get_config()["max_source_bytes"] == 6000


def test_capture_accepts_exact_utf8_byte_boundary(helper, direct_vm):
    body = "é" * 3000
    direct_vm.mock_web(re.escape(URL), {"status": 200, "body": body})
    result = helper.capture(URL, "boundary")
    assert result["text"] == body
    assert result["byte_length"] == 6000
    assert result["digest"] == digest(body)
    assert helper.get_config()["protocol_version"] == 3


@pytest.mark.parametrize("url", URLS["invalid"])
def test_core_rejects_unsafe_urls_before_evidence_fetch(active, direct_vm, url):
    with direct_vm.expect_revert("[EXPECTED]"):
        active.submit_checkin("pool-1", "Complete", url, "0" * 64, "bad-url")


@pytest.mark.parametrize("url", URLS["invalid"])
def test_helper_rejects_the_same_unsafe_urls(helper, direct_vm, url):
    with direct_vm.expect_revert("[EXPECTED]"):
        helper.capture(url, "bad-url")


@pytest.mark.parametrize("url", URLS["valid"])
def test_supported_public_urls_remain_usable(active, direct_vm, url):
    direct_vm.mock_web(re.escape(url), {"status": 200, "body": "Complete receipt"})
    direct_vm.mock_llm(r"(?s).*", json.dumps({"verdict": "pass", "confidence": 100, "reasoning": "Complete source"}))
    assert active.submit_checkin("pool-1", "Complete", url, digest("Complete receipt"), "valid-url")["verdict"] == "pass"


def test_security_terms_are_snapshotted(active):
    terms = active.get_pool("pool-1")
    assert terms["protocol_version"] == 3
    assert terms["max_source_bytes"] == 6000
    assert terms["evidence_policy"] == "complete_verified_source_no_truncation"
    assert active.get_config()["protocol_version"] == 3
