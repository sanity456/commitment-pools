"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  contractAddress,
  formatGen,
  isLiveConfigured,
  parseGen,
  readContract,
  shortAddress,
} from "../lib/genlayer";
import {
  normalizeParticipant,
  normalizePool,
  poolActions,
  record,
  roundState,
  type Participant,
  type Pool,
} from "../lib/lifecycle";
import { errorMessage, useProtocol, type Protocol } from "../lib/useProtocol";
import { EvidenceCapture } from "./EvidenceCapture";
import { BrandLockup } from "./Brand";
import { ActivityPanel } from "./ActivityPanel";
import { DirectoryPanel } from "./DirectoryPanel";
import { RecordTools, SessionStrip } from "./RecordTools";
import { HelpPanel } from "./HelpPanel";
import { OwnerDesk } from "./OwnerDesk";
import { PublishReview, type PublishDraft } from "./PublishReview";
import { templates } from "../lib/templates";
import { formationSeconds } from "../lib/pool-input";
import { freshWalletCredit } from "../lib/credit-guidance";
import {
  detailIsFresh,
  poolReviewKey,
  workspaceIdentity,
} from "../lib/workspace-review";

type Tab =
  "explore" | "mine" | "mywork" | "create" | "activity" | "help" | "owner";
type Detail = {
  key: string;
  revision: number;
  pool: Pool;
  participants: Participant[];
  canSettle: boolean;
  attempt: Record<string, unknown> | null;
};
const tabs: [Tab, string][] = [
  ["explore", "Explore"],
  ["mine", "Pool workspace"],
  ["mywork", "My work"],
  ["create", "Create"],
  ["activity", "Activity"],
  ["help", "Help & settings"],
  ["owner", "Owner"],
];
const shell = "mx-auto max-w-[1420px] px-5 sm:px-10 lg:px-14";
function label(value: string) {
  return value.replaceAll("_", " ");
}
function date(value: number) {
  return value
    ? new Date(value * 1000).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not scheduled";
}
function Field({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field-label">
      <span>{title}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Metric({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="surface-card p-5">
      <p className="eyebrow">{title}</p>
      <p className="mt-3 break-words text-3xl font-black tracking-tight">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted">{note}</p>
    </div>
  );
}
function Empty({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card p-8">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">{children}</p>
    </div>
  );
}

export default function ProductHome({
  initialId = "",
}: {
  initialId?: string;
}) {
  const protocol = useProtocol("list_pools");
  return (
    <ProductWorkspace
      key={workspaceIdentity(protocol.session)}
      protocol={protocol}
      initialId={initialId}
    />
  );
}
function ProductWorkspace({
  protocol,
  initialId,
}: {
  protocol: Protocol;
  initialId: string;
}) {
  const router = useRouter();
  const {
    wallet,
    stats,
    config,
    busy,
    ready,
    now,
    notice,
    setNotice,
    transact,
  } = protocol;
  const currentCredit = freshWalletCredit(protocol);
  const [tab, setActiveTab] = useState<Tab>(initialId ? "mine" : "explore");
  function setTab(next: Tab) {
    setActiveTab(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const [selectedId, setSelectedId] = useState(initialId);
  const [supportContext, setSupportContext] = useState({ hash: "", id: "" });
  const [draft, setDraft] = useState<PublishDraft | null>(null);
  const [templateIndex, setTemplateIndex] = useState(0);
  const template = templates[templateIndex];
  function support(hash: string, id: string) {
    setSupportContext({ hash, id });
    setTab("help");
  }
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [reviewedKey, setReviewedKey] = useState<string | null>(null);
  const [evidenceKey, setEvidenceKey] = useState<string | null>(null);
  const pools = useMemo(
    () =>
      protocol.items
        .map(normalizePool)
        .filter(
          (p) =>
            protocol.session?.preferences.includeFixtures ||
            !/^(lifecycle-|value-probe-|verified-source-)/.test(p.id),
        ),
    [protocol.items, protocol.session?.preferences],
  );
  const poolId = selectedId || detail?.key || pools[0]?.id || "";
  const selected = detail?.key === poolId ? detail : null;
  const detailFresh = detailIsFresh(
    detail,
    poolId,
    protocol.revision,
    detailError,
  );
  const pool = selected?.pool;
  const me =
    selected?.participants.find(
      (p) => p.address.toLowerCase() === wallet.toLowerCase(),
    ) ?? null;
  const actions = pool
    ? poolActions(
        pool,
        me,
        wallet,
        now,
        Boolean(selected?.canSettle) || now >= pool.activity_ends_at,
      )
    : null;
  const round = pool ? roundState(pool, me, now) : null;
  const reviewKey = poolReviewKey(pool, me);
  const acceptedTerms = reviewedKey === reviewKey;
  const evidenceReviewed = evidenceKey === reviewKey;
  function onEvidenceReview(reviewed: boolean) {
    setEvidenceKey(reviewed ? reviewKey : null);
  }
  const owner = String(config?.owner ?? "");
  const isOwner = Boolean(
    wallet && owner && wallet.toLowerCase() === owner.toLowerCase(),
  );
  const disabled = Boolean(busy) || !ready;
  const poolDisabled = disabled || !detailFresh;
  const pendingFeeAt = Number(config?.pending_fee_effective_at ?? 0);

  useEffect(() => {
    let cancelled = false;
    const task = window.setTimeout(async () => {
      setDetailError("");
      if (!poolId || !isLiveConfigured || !protocol.session?.signedIn) return;
      try {
        const [poolRaw, playersRaw, settleRaw] = await Promise.all([
          readContract("get_pool", [poolId]),
          readContract("list_participants", [poolId, 0, 50]),
          readContract("can_settle", [poolId]),
        ]);
        const players = record(playersRaw);
        const participants = Array.isArray(players.items)
          ? players.items.map(normalizeParticipant)
          : [];
        if (Number(players.total ?? 0) > 50) {
          const second = record(
            await readContract("list_participants", [poolId, 50, 50]),
          );
          if (Array.isArray(second.items))
            participants.push(...second.items.map(normalizeParticipant));
        }
        const mine = participants.find(
          (p) => p.address.toLowerCase() === wallet.toLowerCase(),
        );
        let attempt: Record<string, unknown> | null = null;
        if (mine?.last_attempt_id) {
          const parts = mine.last_attempt_id.split(":");
          attempt = record(
            await readContract("get_attempt", [
              poolId,
              wallet,
              Number(parts.at(-2)),
              Number(parts.at(-1)),
            ]),
          );
        }
        if (!cancelled)
          setDetail({
            key: poolId,
            revision: protocol.revision,
            pool: normalizePool(poolRaw),
            participants,
            canSettle: settleRaw === true,
            attempt,
          });
      } catch (failure) {
        if (!cancelled) setDetailError(errorMessage(failure));
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(task);
    };
  }, [poolId, wallet, protocol.revision, protocol.session?.signedIn]);

  function openPool(id: string) {
    if (!id) return;
    router.push("/pools/" + encodeURIComponent(id));
    setSelectedId(id);
    setReviewedKey(null);
    setEvidenceKey(null);
    setTab("mine");
  }
  async function createPool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const id =
        String(data.get("pool_id") ?? "").trim() ||
        "pool-" + crypto.randomUUID().slice(0, 12);
      const minimum = Number(data.get("min_players"));
      const maximum = Number(data.get("max_players"));
      if (minimum > maximum)
        throw new Error("Minimum cohort cannot exceed maximum cohort.");
      const stake = parseGen(String(data.get("stake")));
      if (stake <= 0n) throw new Error("Stake must be greater than zero.");
      const joinLength = String(data.get("join_length") ?? "");
      const joinUnit = String(data.get("join_unit") ?? "");
      const joinWindow = formationSeconds(joinLength, joinUnit);
      const args = [
        id,
        String(data.get("title")).trim(),
        String(data.get("description")),
        String(data.get("rules")),
        String(data.get("verification_mode")),
        stake,
        Number(data.get("rounds")),
        minimum,
        maximum,
        joinWindow,
        Number(data.get("round_hours")) * 3600,
      ];
      setDraft({
        id,
        args,
        fields: [
          ["Pool ID", id],
          ["Title", String(data.get("title"))],
          ["Promise", String(data.get("description"))],
          ["Pass / fail rules", String(data.get("rules"))],
          [
            "Verification policy",
            String(data.get("verification_mode")).replaceAll("_", " "),
          ],
          ["Stake per participant", formatGen(stake.toString()) + " GEN"],
          ["Cohort", minimum + " minimum / " + maximum + " maximum"],
          [
            "Schedule",
            data.get("rounds") +
              " rounds · " +
              data.get("round_hours") +
              " hours each · formation ends " +
              joinLength +
              " " +
              joinUnit +
              " after creation",
          ],
          [
            "Forfeiture fee",
            Number(config?.fee_bps ?? 0) / 100 + "% · snapshotted at creation",
          ],
          [
            "Failure consequences",
            "Missed or failed rounds forfeit stake. If all fail, stakes are returned minus the fee; underfilled formation returns full refund credit.",
          ],
        ],
      });
    } catch (failure) {
      setNotice({ kind: "error", text: errorMessage(failure) });
    }
  }
  async function publishPool() {
    if (!draft) return;
    if (await transact("Create pool", "create_pool", draft.args)) {
      const id = draft.id;
      setDraft(null);
      openPool(id);
    }
  }
  async function checkIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pool || !actions?.submit || poolDisabled) return;
    const data = new FormData(event.currentTarget);
    try {
      const digest = String(data.get("digest") ?? "").trim();
      if (
        pool.verification_mode === "source_verified" &&
        (!evidenceReviewed || !/^[0-9a-f]{64}$/i.test(digest))
      )
        throw new Error(
          "Capture and review the public source before submitting a source-verified proof.",
        );
      await transact("Submit check-in", "submit_checkin", [
        pool.id,
        String(data.get("proof")),
        String(data.get("evidence_url") ?? ""),
        digest,
        crypto.randomUUID(),
      ]);
    } catch (failure) {
      setNotice({ kind: "error", text: errorMessage(failure) });
    }
  }

  return (
    <main
      id="main-content"
      className="min-h-screen bg-background text-foreground"
    >
      <nav
        aria-label="Main navigation"
        className="sticky top-0 z-40 border-b border-line bg-background/95 backdrop-blur-xl"
      >
        <div
          className={
            shell + " flex flex-wrap items-center justify-between gap-4 py-4"
          }
        >
          <button
            className="min-w-0 rounded-lg text-left"
            aria-label="Commitment Pools — Explore"
            onClick={() => setTab("explore")}
          >
            <BrandLockup />
          </button>
          <div className="hidden rounded-full bg-surface p-1 text-sm 2xl:flex">
            {tabs.map(([id, title]) => (
              <button
                key={id}
                aria-current={tab === id ? "page" : undefined}
                className={"nav-pill " + (tab === id ? "nav-pill-active" : "")}
                onClick={() => setTab(id)}
              >
                {title}
              </button>
            ))}
          </div>
          <button
            className="wallet-button"
            disabled={Boolean(busy)}
            onClick={() => void protocol.connect()}
          >
            {wallet ? shortAddress(wallet) : "Sign in with wallet"}
          </button>
        </div>
        <div className={shell + " flex gap-2 overflow-x-auto pb-3 2xl:hidden"}>
          {tabs.map(([id, title]) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              className={
                "mobile-tab " + (tab === id ? "mobile-tab-active" : "")
              }
              onClick={() => setTab(id)}
            >
              {title}
            </button>
          ))}
        </div>
      </nav>
      <div className={shell + " pt-4"}>
        <div className="mode-strip mode-live">
          <strong>Studionet · sandbox</strong>
          <span>
            {isLiveConfigured
              ? shortAddress(contractAddress) +
                " · finalized contract data · test GEN only"
              : "Contract not configured. Transactions are disabled."}
          </span>
          <button
            className="ml-auto underline"
            onClick={protocol.refresh}
            disabled={protocol.loading || Boolean(busy)}
          >
            {protocol.loading ? "Loading…" : "Refresh"}
          </button>
        </div>
        {(protocol.session?.signedIn ||
          (protocol.sessionError &&
            protocol.sessionError !== "Sign in to continue.")) && (
          <SessionStrip protocol={protocol} />
        )}
        {protocol.error && (
          <div className="notice notice-error" role="alert">
            <span>!</span>
            <p>
              {protocol.error} Previously loaded data may be stale; actions are
              disabled.
            </p>
            <button aria-label="Retry loading" onClick={protocol.refresh}>
              ↻
            </button>
          </div>
        )}
        {notice && (
          <div
            className={"notice notice-" + notice.kind}
            role={notice.kind === "error" ? "alert" : "status"}
          >
            <span>{notice.kind === "success" ? "✓" : "!"}</span>
            <div>
              <p>{notice.text}</p>
              {notice.hash && (
                <code className="mt-2 block break-all text-[11px]">
                  {notice.hash}
                </code>
              )}
            </div>
            <button
              aria-label="Dismiss message"
              onClick={() => setNotice(null)}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {tab === "explore" && (
        <>
          <section className={shell + " pool-intro"}>
            <div className="min-w-0">
              <h1 className="pool-intro-title">
                Put <span className="text-gold">weight</span> behind your word.
              </h1>
              <p className="mt-4 text-base leading-7 text-muted">
                Stake test GEN, follow the schedule, and prove each round.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="primary-button"
                  onClick={() => setTab("create")}
                >
                  Create a pool
                </button>
                <button
                  className="secondary-button"
                  onClick={() => setTab("mine")}
                >
                  Open a pool by ID
                </button>
              </div>
            </div>
            <div className="pool-intro-brand">
              <BrandLockup featured />
            </div>
          </section>
          <section
            id="pools"
            className={shell + " pb-10"}
            aria-label="Pool directory"
          >
            <DirectoryPanel protocol={protocol} onOpen={openPool} />
          </section>
          <section className={shell + " pb-12"}>
            <details className="pool-primer">
              <summary>How pools work</summary>
              <ol className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  [
                    "01",
                    "Review the terms",
                    "See your exact stake, deadline, proof policy, and failure consequences.",
                  ],
                  [
                    "02",
                    "Form the cohort",
                    "If the minimum is missed, participants can claim full refund credit.",
                  ],
                  [
                    "03",
                    "Prove each round",
                    "Submit within the scheduled window. Unclear results allow up to three attempts.",
                  ],
                  [
                    "04",
                    "Settle & withdraw",
                    "Winners share forfeited stakes after the snapshotted fee. If all fail, everyone receives a refund minus that fee.",
                  ],
                ].map(([step, title, description]) => (
                  <li key={step} className="flex gap-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold text-xs font-black text-on-gold">
                      {step}
                    </span>
                    <div>
                      <h2 className="text-sm font-black">{title}</h2>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </details>
          </section>
        </>
      )}

      {tab === "mine" && (
        <section className={shell + " py-10"}>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow">Participant workspace</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight">
                Pool workspace
              </h1>
              <p className="mt-3 text-sm text-muted">
                Your terms, rounds and credit in one place.
              </p>
            </div>
            <div className="w-full sm:w-80">
              <Field title="Choose a pool">
                <select
                  value={poolId}
                  onChange={(e) => openPool(e.target.value)}
                >
                  <option value="" disabled>
                    Select a pool
                  </option>
                  {pools.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
          <form
            className="mt-5 flex max-w-xl gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              openPool(
                String(new FormData(e.currentTarget).get("lookup")).trim(),
              );
            }}
          >
            <div className="min-w-0 flex-1">
              <Field title="Open a pool by ID">
                <input
                  name="lookup"
                  required
                  maxLength={80}
                  placeholder="Pool ID from your invitation"
                />
              </Field>
            </div>
            <button className="secondary-button self-end" type="submit">
              Open
            </button>
          </form>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-5">
            <div>
              <p className="eyebrow">Your available credit · all pools</p>
              <p className="mt-2 text-xl font-black">
                {wallet
                  ? protocol.creditError
                    ? "Unavailable"
                    : currentCredit === null
                      ? "Checking credit…"
                      : formatGen(currentCredit) + " GEN"
                  : "Sign in to view"}
              </p>
              {protocol.creditError && (
                <p className="mt-2 text-xs text-danger">
                  Credit unavailable: {protocol.creditError}
                </p>
              )}
              <p className="mt-2 text-xs text-muted">
                {currentCredit === "0"
                  ? "No credit to withdraw. Check payout delivery in Activity."
                  : "Check payout delivery in Activity after withdrawing."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="secondary-button"
                onClick={() => setTab("activity")}
              >
                View Activity
              </button>
              <button
                className="primary-button"
                disabled={
                  disabled || currentCredit === null || currentCredit === "0"
                }
                onClick={() => void transact("Withdraw credit", "withdraw")}
              >
                Withdraw credit
              </button>
            </div>
          </div>
          {detailError && (
            <div className="mt-6" role="alert">
              <Empty title="Pool could not be loaded">{detailError}</Empty>
            </div>
          )}
          {pool && !detailFresh && !detailError && (
            <p className="mt-5 text-sm text-muted" role="status">
              Refreshing pool state. Actions will unlock when checks finish.
            </p>
          )}
          {!protocol.session?.signedIn ? (
            <div className="product-panel mt-6">
              <h2 className="text-xl font-black">Sign in to open a pool</h2>
              <p className="product-muted">
                Use your wallet to load the terms and your progress.
              </p>
              <button
                className="product-button mt-4"
                disabled={Boolean(busy)}
                onClick={() => void protocol.connect()}
              >
                Sign in with wallet
              </button>
            </div>
          ) : !pool && !detailError ? (
            <div className="mt-6">
              <Empty title={poolId ? "Loading pool…" : "No pool selected"}>
                {poolId
                  ? "Checking immutable terms and participant state."
                  : "Create a pool or open an invitation ID to get started."}
              </Empty>
            </div>
          ) : pool ? (
            <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1.15fr_.85fr]">
              <div className="space-y-6">
                <article className="surface-card p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="eyebrow break-all">{pool.id}</span>
                    <span className="status-chip">{label(pool.status)}</span>
                  </div>
                  <h2 className="mt-4 text-3xl font-black tracking-tight">
                    {pool.title}
                  </h2>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted">
                    {pool.description}
                  </p>
                  <h3 className="mt-6 text-sm font-black">
                    The rules you are accepting
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-raised p-4 text-sm leading-7">
                    {pool.rules}
                  </p>
                  <dl className="mt-6 grid grid-cols-2 gap-5 text-sm">
                    {[
                      ["Stake", formatGen(pool.stake_wei) + " GEN"],
                      ["Verification", label(pool.verification_mode)],
                      [
                        "Cohort",
                        pool.participant_count +
                          " joined · minimum " +
                          pool.min_players +
                          " · max " +
                          pool.max_players,
                      ],
                      [
                        "Schedule",
                        pool.rounds_required +
                          " rounds · " +
                          pool.round_window_seconds / 3600 +
                          " hours each",
                      ],
                      ["Join deadline", date(pool.join_deadline)],
                      ["Activity starts", date(pool.activity_starts_at)],
                      ["Activity ends", date(pool.activity_ends_at)],
                      ["Fee on forfeitures", pool.fee_bps / 100 + "%"],
                    ].map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-xs text-muted">{key}</dt>
                        <dd className="mt-1 font-bold">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-6 text-xs leading-6 text-muted">
                    Failed or missed rounds forfeit stake to successful
                    participants, minus fees. If all fail, stakes return minus
                    fees. Missed minimums or expired activation windows return
                    full refund credit. Source-verified proof must match the
                    validator-rendered page; self-attestation is not independent
                    verification.
                  </p>
                  <details className="mt-5 text-xs">
                    <summary className="cursor-pointer font-bold">
                      Immutable terms hash & authority
                    </summary>
                    <p className="mt-3 break-all font-mono">
                      {pool.terms_hash}
                    </p>
                    <p className="mt-2 break-all">Creator: {pool.creator}</p>
                    <p className="mt-2 break-all">
                      Fee recipient: {pool.fee_recipient}
                    </p>
                  </details>
                  {actions?.join && (
                    <div className="mt-6 border-t border-line pt-5">
                      <label className="flex items-start gap-3 text-xs leading-6">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={acceptedTerms}
                          disabled={poolDisabled}
                          onChange={(e) =>
                            setReviewedKey(e.target.checked ? reviewKey : null)
                          }
                        />
                        <span>
                          I have reviewed the rules, schedule, refund policy and
                          exact {formatGen(pool.stake_wei)} GEN stake. This is a
                          Studionet test commitment.
                        </span>
                      </label>
                      <button
                        className="primary-button mt-4"
                        disabled={poolDisabled || !acceptedTerms}
                        onClick={() =>
                          void transact(
                            "Join pool",
                            "join",
                            [pool.id],
                            BigInt(pool.stake_wei),
                          )
                        }
                      >
                        Confirm terms & stake {formatGen(pool.stake_wei)} GEN
                      </button>
                    </div>
                  )}
                  {!wallet && (
                    <button
                      className="primary-button mt-6"
                      disabled={Boolean(busy)}
                      onClick={() => void protocol.connect()}
                    >
                      Connect wallet to participate
                    </button>
                  )}
                  <div className="mt-5 flex flex-wrap gap-3">
                    {actions?.activate && (
                      <button
                        className="primary-button"
                        disabled={poolDisabled}
                        onClick={() =>
                          void transact("Activate pool", "activate_pool", [
                            pool.id,
                          ])
                        }
                      >
                        Activate or enable refunds
                      </button>
                    )}
                    {actions?.cancel && (
                      <button
                        className="secondary-button"
                        disabled={poolDisabled}
                        onClick={() =>
                          void transact(
                            "Cancel empty pool",
                            "cancel_empty_pool",
                            [pool.id],
                          )
                        }
                      >
                        Cancel empty pool
                      </button>
                    )}
                    {actions?.refund && (
                      <button
                        className="primary-button"
                        disabled={poolDisabled}
                        onClick={() =>
                          void transact(
                            "Claim formation refund",
                            "claim_formation_refund",
                            [pool.id],
                          )
                        }
                      >
                        Claim full refund credit
                      </button>
                    )}
                    {actions?.settle && (
                      <button
                        className="primary-button"
                        disabled={poolDisabled}
                        onClick={() =>
                          void transact("Settle pool", "settle", [pool.id])
                        }
                      >
                        Settle & allocate credits
                      </button>
                    )}
                  </div>
                  {pool.activation_failure && (
                    <p className="mt-4 text-xs text-danger">
                      Activation outcome: {label(pool.activation_failure)}
                    </p>
                  )}
                  {pool.status === "settled" && (
                    <p className="mt-4 text-sm">
                      {pool.winner_count} successful · {pool.loser_count} failed
                      · {formatGen(pool.fee_wei)} GEN fee. Allocations are
                      recorded at settlement; check your current wallet credit
                      above.
                    </p>
                  )}
                </article>
                <article className="surface-card p-6">
                  <h3 className="text-xl font-black">Cohort activity</h3>
                  {!selected?.participants.length ? (
                    <p className="mt-4 text-sm text-muted">
                      No participants have joined.
                    </p>
                  ) : (
                    <ul className="mt-5 divide-y divide-line">
                      {selected.participants.map((player) => {
                        const missed =
                          player.status === "active" &&
                          pool.status === "active" &&
                          now >= roundState(pool, player, now).closesAt;
                        return (
                          <li
                            key={player.address}
                            className="flex flex-wrap items-center justify-between gap-3 py-4"
                          >
                            <div>
                              <p className="text-xs font-bold">
                                {shortAddress(player.address)}
                                {player.address.toLowerCase() ===
                                wallet.toLowerCase()
                                  ? " · you"
                                  : ""}
                              </p>
                              <p className="mt-1 text-xs text-muted">
                                {player.rounds_passed}/{pool.rounds_required}{" "}
                                rounds passed · {label(player.status)}
                              </p>
                            </div>
                            {missed && wallet && (
                              <button
                                className="small-primary"
                                disabled={poolDisabled}
                                onClick={() =>
                                  void transact(
                                    "Mark missed round",
                                    "mark_missed_round",
                                    [pool.id, player.address],
                                  )
                                }
                              >
                                Record missed deadline
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </article>
              </div>
              <aside className="space-y-6">
                <RecordTools
                  key={pool.id + "|" + wallet}
                  record={pool as unknown as Record<string, unknown>}
                  participant={me as unknown as Record<string, unknown> | null}
                  protocol={protocol}
                  fresh={detailFresh}
                  onSupport={support}
                />
                <article className="theme-inset rounded-[28px] p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted">
                    Your position
                  </p>
                  <h2 className="mt-3 text-3xl font-black">
                    {me
                      ? label(me.status)
                      : wallet
                        ? "Not a participant"
                        : "Wallet not connected"}
                  </h2>
                  {me && round && (
                    <>
                      <p className="mt-5">
                        {me.rounds_passed}/{pool.rounds_required} rounds passed
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-raised">
                        <div
                          className="h-full bg-gold"
                          style={{
                            width:
                              (me.rounds_passed / pool.rounds_required) * 100 +
                              "%",
                          }}
                        />
                      </div>
                      {me.status === "active" && (
                        <div className="mt-5 text-sm leading-7">
                          <p>Next round: {round.number}</p>
                          <p>Opens: {date(round.opensAt)}</p>
                          <p>Closes: {date(round.closesAt)}</p>
                          <p>Attempts used: {round.attempts}/3</p>
                        </div>
                      )}
                      <p className="mt-5 text-sm">
                        Settlement credit: {formatGen(me.settlement_credit_wei)}{" "}
                        GEN
                      </p>
                    </>
                  )}
                </article>
                {actions?.submit && (
                  <form
                    key={pool.id + "|" + round?.number}
                    className="surface-card space-y-5 p-6"
                    onSubmit={checkIn}
                  >
                    <div>
                      <p className="eyebrow">Round {round?.number}</p>
                      <h3 className="mt-2 text-xl font-black">
                        Submit your proof
                      </h3>
                    </div>
                    <Field title="What did you complete?">
                      <textarea
                        name="proof"
                        required
                        maxLength={2500}
                        rows={5}
                        disabled={poolDisabled}
                        placeholder="Describe the action, date, and how it meets the rules."
                      />
                    </Field>
                    {pool.verification_mode === "source_verified" ? (
                      <EvidenceCapture
                        key={pool.id + "|" + wallet}
                        protocol={protocol}
                        urlName="evidence_url"
                        disabled={poolDisabled}
                        reviewContext={reviewKey}
                        onReviewChange={onEvidenceReview}
                      />
                    ) : (
                      <Field title="Evidence URL (optional; not independently verified)">
                        <input
                          name="evidence_url"
                          type="url"
                          pattern="https://.+"
                          maxLength={2048}
                          placeholder="https://…"
                        />
                      </Field>
                    )}
                    <p className="text-xs leading-5 text-muted">
                      Submit well before the deadline; consensus can take
                      several minutes. Proof and public evidence must not
                      contain private information.
                    </p>
                    <button
                      className="primary-button w-full"
                      disabled={
                        poolDisabled ||
                        (pool.verification_mode === "source_verified" &&
                          !evidenceReviewed)
                      }
                    >
                      Submit round {round?.number} proof
                    </button>
                  </form>
                )}
                {me && !actions?.submit && pool.status === "active" && (
                  <Empty title="Check-in is not available">
                    {me.status !== "active"
                      ? "Your participant status is terminal. Settlement becomes available when all participants are terminal or the activity ends."
                      : "The next round is not open, its deadline passed, or its three-attempt limit was reached. Check the schedule above."}
                  </Empty>
                )}
                {selected?.attempt && (
                  <article className="surface-card p-6">
                    <p className="eyebrow">Latest recorded attempt</p>
                    <div className="mt-3 flex items-center justify-between">
                      <h3 className="text-lg font-black">
                        Round {String(selected.attempt.round)} · attempt{" "}
                        {String(selected.attempt.attempt)}
                      </h3>
                      <span className="status-chip">
                        {String(selected.attempt.verdict)}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted">
                      {String(selected.attempt.reasoning ?? "")}
                    </p>
                    <p className="mt-3 text-xs text-muted">
                      Leader explanation is not an independent audit. The
                      recorded verdict and evidence digest are the consensus
                      fields.
                    </p>
                    <details className="mt-4 text-xs">
                      <summary>Evidence digest</summary>
                      <code className="mt-2 block break-all">
                        {String(
                          selected.attempt.observed_evidence_digest ||
                            "No external source digest",
                        )}
                      </code>
                    </details>
                  </article>
                )}
              </aside>
            </div>
          ) : null}
        </section>
      )}

      {tab === "create" && (
        <section
          className={shell + " grid gap-8 py-12 lg:grid-cols-[1fr_340px]"}
        >
          <div>
            <p className="eyebrow">Creator workflow</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Create a pool
            </h1>
            <div className="product-template mt-7">
              <label className="product-field">
                <span>Start from a template</span>
                <select
                  value={templateIndex}
                  onChange={(e) => setTemplateIndex(Number(e.target.value))}
                >
                  {templates.map((t, i) => (
                    <option key={t.id} value={i}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="product-muted">
                Changing templates replaces unsaved form fields. Review and
                tailor the promise.
              </p>
            </div>
            <form
              key={template.id}
              onSubmit={createPool}
              className="surface-card mt-8 space-y-5 p-6 sm:p-8"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field title="Pool title">
                  <input
                    name="title"
                    required
                    maxLength={120}
                    placeholder="30 mornings of movement"
                    defaultValue={template.title}
                  />
                </Field>
                <Field title="Pool ID" hint="Optional; generated if blank.">
                  <input name="pool_id" maxLength={80} placeholder="move-30" />
                </Field>
              </div>
              <Field title="Plain-language promise">
                <textarea
                  name="description"
                  required
                  maxLength={500}
                  rows={3}
                  defaultValue={template.summary}
                />
              </Field>
              <Field
                title="Pass / fail rules"
                hint="Define one measurable action, accepted evidence, and clear failure conditions."
              >
                <textarea
                  name="rules"
                  required
                  maxLength={2500}
                  rows={5}
                  defaultValue={template.rules}
                />
              </Field>
              <Field title="Verification policy">
                <select
                  name="verification_mode"
                  defaultValue={template.verification}
                >
                  <option value="self_attested">
                    Self-attested — participant statement only
                  </option>
                  <option value="source_verified">
                    Source-verified — public HTTPS source + digest
                  </option>
                </select>
              </Field>
              <div className="grid gap-5 sm:grid-cols-3">
                <Field title="Test stake (GEN)">
                  <input
                    name="stake"
                    inputMode="decimal"
                    required
                    pattern="[0-9]+([.][0-9]{1,18})?"
                    defaultValue="0.001"
                  />
                </Field>
                <Field title="Rounds">
                  <input
                    name="rounds"
                    type="number"
                    min="1"
                    max="60"
                    required
                    defaultValue="7"
                  />
                </Field>
                <Field title="Round length (hours)">
                  <input
                    name="round_hours"
                    type="number"
                    min="1"
                    max="744"
                    required
                    defaultValue="24"
                  />
                </Field>
                <Field title="Minimum cohort">
                  <input
                    name="min_players"
                    type="number"
                    min="2"
                    max="100"
                    required
                    defaultValue="2"
                  />
                </Field>
                <Field title="Maximum cohort">
                  <input
                    name="max_players"
                    type="number"
                    min="2"
                    max="100"
                    required
                    defaultValue="10"
                  />
                </Field>
                <fieldset className="field-label">
                  <legend>Formation window</legend>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input
                      aria-label="Formation length"
                      name="join_length"
                      type="number"
                      min="1"
                      max="129600"
                      step="1"
                      required
                      defaultValue="3"
                    />
                    <select
                      name="join_unit"
                      aria-label="Formation unit"
                      defaultValue="days"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </fieldset>
              </div>
              <p className="text-xs leading-6 text-muted">
                Creation publishes terms without moving funds. Stakes and
                deadlines stay fixed. Rounds start at the formation deadline;
                activate promptly.
              </p>
              <button className="primary-button" disabled={disabled}>
                {busy === "Create pool"
                  ? "Waiting for finality…"
                  : "Review pool before publishing"}
              </button>
              {!protocol.session?.signedIn && (
                <p className="text-sm text-muted" role="status">
                  Sign in with your wallet to review and publish.
                </p>
              )}
            </form>
          </div>
          <aside className="space-y-5 lg:pt-24">
            <article className="theme-gold-panel rounded-[28px] p-6">
              <p className="eyebrow">Studionet first</p>
              <h2 className="mt-3 text-2xl font-black">
                Before you invite a cohort
              </h2>
              <p className="mt-4 text-sm leading-7">
                Use test GEN only. Check wallet funding and payout delivery on
                Studionet before inviting participants.
              </p>
            </article>
            <article className="surface-card p-6">
              <h3 className="font-black">Creator checklist</h3>
              <ul className="check-list mt-5">
                <li>One measurable action per round</li>
                <li>Enough time for validator consensus</li>
                <li>Public evidence available without login</li>
                <li>Failure consequences stated up front</li>
                <li>No personal or confidential evidence</li>
              </ul>
            </article>
            <p className="p-4 text-xs leading-6 text-muted">
              Creators cannot edit published terms, judge check-ins, seize
              stakes, or cancel after a participant joins.
            </p>
          </aside>
        </section>
      )}

      {tab === "owner" && (
        <section className={shell + " py-12"}>
          <p className="eyebrow">Protocol operations</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Owner console
          </h1>
          <p className="mt-5 break-words text-sm text-muted" role="status">
            {!protocol.session?.signedIn
              ? "Sign in to view protocol data. Owner controls require separate verification."
              : owner
                ? (isOwner
                    ? "Connected as contract owner · "
                    : "Read-only unless connected as owner · ") + owner
                : protocol.error
                  ? "Contract authority is unavailable. Refresh to try again."
                  : "Loading contract authority…"}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              title="Pools created"
              value={stats ? String(stats.pools_created ?? 0) : "—"}
              note="From this deployed contract"
            />
            <Metric
              title="Total joins"
              value={stats ? String(stats.joins ?? 0) : "—"}
              note="Finalized participant entries"
            />
            <Metric
              title="Fees accrued"
              value={
                stats
                  ? formatGen(String(stats.fees_accrued_wei ?? 0)) + " GEN"
                  : "—"
              }
              note="Applied to forfeited stakes only"
            />
            <Metric
              title="Payouts emitted"
              value={stats ? String(stats.payouts_emitted ?? 0) : "—"}
              note="Delivery must be checked separately"
            />
          </div>
          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            <form
              className="surface-card p-7"
              onSubmit={(event) => {
                event.preventDefault();
                void transact("Schedule fee", "schedule_fee_bps", [
                  Number(new FormData(event.currentTarget).get("fee_bps")),
                ]);
              }}
            >
              <p className="eyebrow">Future fee schedule</p>
              <h2 className="mt-3 text-2xl font-black">
                Current fee: {config ? Number(config.fee_bps) / 100 + "%" : "—"}
              </h2>
              <div className="mt-6">
                <Field
                  title="New fee (basis points)"
                  hint="100 basis points = 1%. Maximum 1,000 / 10%."
                >
                  <input
                    name="fee_bps"
                    type="number"
                    min="0"
                    max="1000"
                    required
                    defaultValue="500"
                    disabled={!isOwner}
                  />
                </Field>
              </div>
              <button
                className="primary-button mt-5"
                disabled={disabled || !isOwner}
              >
                Schedule with 24h delay
              </button>
              <p className="mt-5 text-sm text-muted">
                {!config
                  ? "Sign in and refresh to view scheduled changes."
                  : pendingFeeAt
                    ? "Scheduled: " +
                      Number(config?.pending_fee_bps) / 100 +
                      "% · can apply after " +
                      date(pendingFeeAt)
                    : "No fee change is scheduled."}
              </p>
              <button
                className="secondary-button mt-4"
                type="button"
                disabled={
                  disabled || !wallet || !pendingFeeAt || now < pendingFeeAt
                }
                onClick={() =>
                  void transact("Apply scheduled fee", "apply_scheduled_fee")
                }
              >
                Apply matured change
              </button>
              <p className="mt-3 text-xs text-muted">
                Anyone may apply a matured fee. Existing pools retain their
                original fee.
              </p>
            </form>
            <article className="rounded-[28px] theme-inset p-7">
              <p className="text-xs uppercase tracking-widest text-muted">
                Bounded authority
              </p>
              <h2 className="mt-3 text-3xl font-black">
                The owner cannot choose who wins.
              </h2>
              <ul className="mt-6 space-y-4 text-sm leading-7 text-muted">
                <li>Fees are snapshotted when each pool is created.</li>
                <li>
                  Proof verdicts, participation, and immutable terms are not
                  owner-editable.
                </li>
                <li>
                  Settlement conserves the pool’s accounted stake across
                  participants and fees.
                </li>
                <li>
                  Private support, index coverage and payout exceptions are
                  available in the operator workspace below.
                </li>
              </ul>
            </article>
          </div>
          <OwnerDesk protocol={protocol} onOpen={openPool} />
        </section>
      )}

      {tab === "mywork" && (
        <section className={shell + " py-12"}>
          <DirectoryPanel protocol={protocol} onOpen={openPool} onlyMine />
        </section>
      )}
      {tab === "activity" && (
        <section className={shell + " py-12"}>
          <ActivityPanel
            protocol={protocol}
            onOpen={openPool}
            onSupport={support}
          />
        </section>
      )}
      {tab === "help" && (
        <section className={shell + " py-12"}>
          <HelpPanel
            key={supportContext.hash + "|" + supportContext.id}
            protocol={protocol}
            context={supportContext}
          />
        </section>
      )}
      {draft && (
        <PublishReview
          draft={draft}
          busy={Boolean(busy)}
          error={notice?.kind === "error" ? notice.text : undefined}
          onClose={() => setDraft(null)}
          onConfirm={publishPool}
        />
      )}
      <footer className="border-t border-line">
        <div
          className={
            shell +
            " flex flex-wrap justify-between gap-3 py-8 text-xs text-muted"
          }
        >
          <p>Commitment Pools · independent GenLayer product</p>
          <p>Studionet sandbox · test funds only · evidence is public</p>
        </div>
      </footer>
    </main>
  );
}
