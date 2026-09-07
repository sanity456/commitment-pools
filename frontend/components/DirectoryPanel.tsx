"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { productApi } from "../lib/client";
import { product } from "../lib/product";
import { nextStep, formatDeadline } from "../lib/reminders";
import { freshWalletCredit } from "../lib/credit-guidance";
import { formatGen, shortAddress } from "../lib/genlayer";
import { errorMessage, type Protocol } from "../lib/useProtocol";
type Coverage = {
  indexed: number;
  total: number;
  complete: boolean;
  membershipPending: number;
  updatedAt: number;
};
type Result = {
  items: Record<string, unknown>[];
  total: number;
  offset: number;
  coverage: Coverage;
};
function participantOf(r: Record<string, unknown>) {
  const viewer = r.viewer as
    { role: string; data: Record<string, unknown> } | undefined;
  return viewer?.role === "participant" ? viewer.data : null;
}
export function DirectoryPanel({
  protocol,
  onOpen,
  onlyMine = false,
}: {
  protocol: Protocol;
  onOpen: (id: string) => void;
  onlyMine?: boolean;
}) {
  const [draft, setDraft] = useState(""),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [mine, setMine] = useState(onlyMine);
  const [offset, setOffset] = useState(0),
    [result, setResult] = useState<Result | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [working, setWorking] = useState(false);
  const [indexRevision, setIndexRevision] = useState(0);
  const requests = useRef({ version: 0 });
  const load = useCallback(async () => {
    const version = ++requests.current.version;
    if (!protocol.session?.signedIn || (mine && !protocol.wallet)) {
      setResult(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      q: query,
      status,
      offset: String(offset),
    });
    if (mine) params.set("wallet", protocol.wallet);
    try {
      const next = await productApi<Result>("directory?" + params);
      if (version === requests.current.version) setResult(next);
    } catch (failure) {
      if (version === requests.current.version) {
        setResult(null);
        setError(errorMessage(failure));
      }
    } finally {
      if (version === requests.current.version) setLoading(false);
    }
  }, [
    query,
    status,
    offset,
    mine,
    protocol.wallet,
    protocol.session?.signedIn,
  ]);
  useEffect(() => {
    const requestState = requests.current;
    const task = window.setTimeout(() => {
      void load();
    }, 0);
    return () => {
      requestState.version++;
      window.clearTimeout(task);
    };
  }, [load, protocol.revision, indexRevision]);
  useEffect(() => {
    if (!protocol.session?.signedIn) return;
    let stopped = false;
    void productApi("directory/sync", {})
      .then(() => {
        if (!stopped) setIndexRevision((value) => value + 1);
      })
      .catch((e) => {
        if (!stopped) setError(errorMessage(e));
      });
    return () => {
      stopped = true;
    };
    // One bounded indexing pass on entry, not on every filter keystroke.
  }, [protocol.session?.signedIn]);
  async function sync() {
    setWorking(true);
    setError("");
    try {
      await productApi("directory/sync", {});
      setIndexRevision((value) => value + 1);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setWorking(false);
    }
  }
  const statuses =
    product.id === "commitment-pools"
      ? ["forming", "active", "refunding", "settled", "cancelled"]
      : [
          "awaiting_acceptance",
          "awaiting_funding",
          "funded",
          "awaiting_response",
          "evidence",
          "ready_for_resolution",
          "resolution_stalled",
          "resolved",
          "cancelled",
        ];
  const signedIn = Boolean(protocol.session?.signedIn);
  const canBrowse = signedIn && (!mine || Boolean(protocol.wallet));
  const visibleResult = canBrowse && !loading ? result : null;
  const credit = freshWalletCredit(protocol);
  return (
    <div className="product-stack">
      <div className="product-toolbar">
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            {onlyMine ? "My pools" : "Explore pools"}
          </h2>
        </div>
        {signedIn && (
          <button
            className="product-button-secondary"
            disabled={working || loading || !signedIn}
            onClick={() => void sync()}
          >
            {working ? "Refreshing index…" : "Refresh directory"}
          </button>
        )}
      </div>
      {canBrowse && (
        <form
          className="product-filter-grid"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(draft);
            setOffset(0);
            setError("");
            setIndexRevision((value) => value + 1);
          }}
        >
          <label className="product-field">
            <span>Search title or ID</span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={120}
              placeholder={onlyMine ? "Search your pools" : "Search pools"}
            />
          </label>
          <label className="product-field">
            <span>Stage</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setOffset(0);
              }}
            >
              <option value="">Every stage</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <button
            className="product-button self-end"
            type="submit"
            disabled={loading}
          >
            Search
          </button>
        </form>
      )}
      {!onlyMine && signedIn && (
        <label className="product-check">
          <input
            type="checkbox"
            disabled={!protocol.wallet}
            checked={mine}
            onChange={(e) => {
              setMine(e.target.checked);
              setOffset(0);
            }}
          />
          <span>Only my pools</span>
        </label>
      )}
      {!canBrowse && (
        <div className="product-panel">
          <h3 className="text-lg font-bold">
            {onlyMine
              ? "Sign in to see your pools"
              : "Sign in to explore pools"}
          </h3>
          <p className="product-muted">
            Use your wallet. Signing in does not move funds.
          </p>
          <button
            className="product-button mt-4"
            disabled={Boolean(protocol.busy)}
            onClick={() => void protocol.connect()}
          >
            Sign in with wallet
          </button>
        </div>
      )}
      {error && (
        <div role="alert" className="product-error">
          <p>{error}</p>
          <button
            className="product-text-button"
            disabled={loading || !canBrowse}
            onClick={() => setIndexRevision((value) => value + 1)}
          >
            Retry loading pools
          </button>
        </div>
      )}
      {canBrowse && loading && (
        <p className="product-muted" role="status">
          Loading pools…
        </p>
      )}
      {visibleResult && (
        <div>
          <p className="product-muted">
            {visibleResult.total} matching{" "}
            {visibleResult.total === 1 ? "pool" : "pools"}
          </p>
          {!visibleResult.coverage.complete && (
            <p className="product-muted">
              Some pools are not indexed yet. Refresh the directory or open a
              shared pool ID.
            </p>
          )}
          <details className="directory-details">
            <summary>Directory details</summary>
            <p className="product-muted">
              Indexed {visibleResult.coverage.indexed}/
              {visibleResult.coverage.total}. Results reflect the last refresh,
              not every transaction. Test pools are{" "}
              {protocol.session?.preferences.includeFixtures
                ? "included"
                : "hidden"}
              ; change this in Help & settings.
            </p>
          </details>
        </div>
      )}
      {visibleResult && !visibleResult.items.length && (
        <div className="product-panel">
          <h3 className="text-lg font-bold">No matching pools</h3>
          <p className="product-muted">
            Try another filter, refresh the index, or open an invitation by its
            ID.
          </p>
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleResult?.items.map((r) => {
          const guide = nextStep(
            r,
            protocol.wallet,
            protocol.now,
            participantOf(r),
            credit,
          );
          return (
            <article
              className="product-panel directory-card"
              key={String(r.id)}
            >
              <span className="product-state">
                {String(r.status).replaceAll("_", " ")}
              </span>
              <h3 className="mt-4 text-xl font-black break-words">
                {String(r.title)}
              </h3>
              <p className="product-muted break-all">{String(r.id)}</p>
              <p className="mt-4 font-bold">
                {formatGen(String(r.stake_wei ?? r.amount_wei ?? "0"))} GEN{" "}
                <span className="product-muted">
                  {product.id === "commitment-pools"
                    ? "per participant"
                    : "test escrow"}
                </span>
              </p>
              {product.id === "commitment-pools" ? (
                <p className="product-muted">
                  {String(r.participant_count ?? 0)}/
                  {String(r.max_players ?? 0)} participants ·{" "}
                  {String(r.rounds_required ?? 0)} rounds ·{" "}
                  {String(r.verification_mode ?? "").replaceAll("_", " ")}
                </p>
              ) : (
                <p className="product-muted">
                  A {shortAddress(String(r.party_a ?? ""))} · B{" "}
                  {shortAddress(String(r.party_b ?? ""))}
                </p>
              )}
              {onlyMine && (
                <div className="mt-4">
                  <h4 className="font-bold text-sm">{guide.title}</h4>
                  <p className="product-muted">{guide.detail}</p>
                  {guide.deadline > 0 && (
                    <p className="product-muted">
                      {formatDeadline(
                        guide.deadline,
                        protocol.session?.preferences.timezone ?? "UTC",
                      )}
                    </p>
                  )}
                </div>
              )}
              <button
                className="product-button-secondary mt-5 w-full"
                onClick={() => onOpen(String(r.id))}
              >
                Open pool →
              </button>
            </article>
          );
        })}
      </div>
      {visibleResult && visibleResult.total > 24 && (
        <div className="product-toolbar">
          <button
            className="product-button-secondary"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - 24))}
          >
            Previous
          </button>
          <p className="product-muted">
            {offset + 1}–{Math.min(offset + 24, visibleResult.total)} of{" "}
            {visibleResult.total}
          </p>
          <button
            className="product-button-secondary"
            disabled={offset + 24 >= visibleResult.total}
            onClick={() => setOffset(offset + 24)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
