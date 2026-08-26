"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  connectWallet,
  contractAddress,
  digestText,
  formatGen,
  isLiveConfigured,
  parseGen,
  readContract,
  shortAddress,
  writeContract,
} from "../lib/genlayer";

type Tab = "explore" | "mine" | "create" | "owner";
type Notice = { kind: "success" | "error" | "info"; text: string } | null;
type Pool = {
  id: string;
  title: string;
  description?: string;
  verification_mode: string;
  stake_wei: string;
  rounds_required: number;
  min_players: number;
  max_players: number;
  participant_count: number;
  status: string;
  join_deadline: number;
  activity_starts_at: number;
  activity_ends_at: number;
  fee_bps: number;
  terms_hash: string;
};

const GEN = 10n ** 18n;
const demoPools: Pool[] = [
  {
    id: "move-30",
    title: "30 mornings of movement",
    description: "Move for at least twenty minutes before 9:00 AM, every day for four weeks.",
    verification_mode: "source_verified",
    stake_wei: String(12n * GEN),
    rounds_required: 28,
    min_players: 8,
    max_players: 24,
    participant_count: 18,
    status: "forming",
    join_deadline: 1788307200,
    activity_starts_at: 1788307200,
    activity_ends_at: 1790726400,
    fee_bps: 250,
    terms_hash: "104d7ac98f8d621f4f68a45b71c7e71d98f398dddc63c704dd31a5e22f55ac82",
  },
  {
    id: "ship-weekly",
    title: "Ship one meaningful thing",
    description: "Publish one finished artifact every Friday for six consecutive weeks.",
    verification_mode: "source_verified",
    stake_wei: String(8n * GEN),
    rounds_required: 6,
    min_players: 4,
    max_players: 12,
    participant_count: 9,
    status: "forming",
    join_deadline: 1788652800,
    activity_starts_at: 1788652800,
    activity_ends_at: 1792281600,
    fee_bps: 250,
    terms_hash: "2b84e1a4ffb0ed617423e3bc2f36faed45be79006313b29010750a0e9ca61ea7",
  },
  {
    id: "deep-work",
    title: "Deep work before noon",
    description: "Complete a focused ninety-minute session before noon on each weekday.",
    verification_mode: "self_attested",
    stake_wei: String(10n * GEN),
    rounds_required: 21,
    min_players: 6,
    max_players: 20,
    participant_count: 19,
    status: "active",
    join_deadline: 1785715200,
    activity_starts_at: 1785715200,
    activity_ends_at: 1788307200,
    fee_bps: 250,
    terms_hash: "66887911dccb0ba2e49c74cdf27bd862b1f1fa345d8f91ea5ce50eb50d3c7d73",
  },
];

const fallbackStats = {
  pools_created: 38,
  pools_activated: 29,
  pools_refunding: 2,
  pools_settled: 17,
  pools_cancelled: 3,
  joins: 412,
  checkins_passed: 2841,
  checkins_failed: 193,
  checkins_unclear: 76,
  fees_accrued_wei: String(184n * GEN),
  payouts_emitted: 211,
};

function asObject(value: unknown): Record<string, unknown> {
  if (value instanceof Map) return Object.fromEntries(value);
  return (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
}

function normalizePool(value: unknown): Pool {
  const item = asObject(value);
  return {
    id: String(item.id ?? ""),
    title: String(item.title ?? "Untitled pool"),
    verification_mode: String(item.verification_mode ?? "self_attested"),
    stake_wei: String(item.stake_wei ?? "0"),
    rounds_required: Number(item.rounds_required ?? 0),
    min_players: Number(item.min_players ?? 0),
    max_players: Number(item.max_players ?? 0),
    participant_count: Number(item.participant_count ?? 0),
    status: String(item.status ?? "forming"),
    join_deadline: Number(item.join_deadline ?? 0),
    activity_starts_at: Number(item.activity_starts_at ?? 0),
    activity_ends_at: Number(item.activity_ends_at ?? 0),
    fee_bps: Number(item.fee_bps ?? 0),
    terms_hash: String(item.terms_hash ?? ""),
  };
}

function dateLabel(timestamp: number) {
  if (!timestamp) return "Not scheduled";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp * 1000));
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="field-label"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="rounded-[22px] border border-[#173c2d]/10 bg-white/70 p-5 shadow-sm"><p className="eyebrow">{label}</p><p className="mt-3 text-3xl font-black tracking-[-.04em]">{value}</p><p className="mt-1 text-xs font-semibold text-[#718078]">{note}</p></div>;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("explore");
  const [wallet, setWallet] = useState("");
  const [pools, setPools] = useState<Pool[]>(demoPools);
  const [stats, setStats] = useState<Record<string, unknown>>(fallbackStats);
  const [config, setConfig] = useState<Record<string, unknown>>({ owner: "0x18b4000000000000000000000000000000009f31", fee_bps: 250, max_fee_bps: 1000, pending_fee_bps: 250, pending_fee_effective_at: 0 });
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState("");
  const [checkinPool, setCheckinPool] = useState("deep-work");

  const loadLive = useCallback(async () => {
    if (!isLiveConfigured) return;
    try {
      const [listingRaw, statsRaw, configRaw] = await Promise.all([
        readContract("list_pools", [0, 50]),
        readContract("get_stats"),
        readContract("get_config"),
      ]);
      const listing = asObject(listingRaw);
      const livePools = Array.isArray(listing.items) ? listing.items.map(normalizePool) : [];
      setPools(livePools);
      setStats(asObject(statsRaw));
      setConfig(asObject(configRaw));
      if (livePools[0]) setCheckinPool(livePools[0].id);
    } catch (error) {
      setNotice({ kind: "error", text: `Live data is unavailable: ${String((error as Error).message ?? error)}` });
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => void loadLive(), 0);
    return () => window.clearTimeout(task);
  }, [loadLive]);
  useEffect(() => {
    const accountChanged = (...args: unknown[]) => setWallet(String((args[0] as string[])?.[0] ?? ""));
    window.ethereum?.on?.("accountsChanged", accountChanged);
    return () => window.ethereum?.removeListener?.("accountsChanged", accountChanged);
  }, []);

  const activePool = useMemo(() => pools.find((pool) => pool.status === "active") ?? pools[0] ?? demoPools[2], [pools]);
  const owner = String(config.owner ?? "");
  const isOwner = Boolean(wallet && owner && wallet.toLowerCase() === owner.toLowerCase());

  async function handleConnect() {
    try {
      setBusy("connect");
      const account = await connectWallet();
      setWallet(account);
      setNotice({ kind: "success", text: `Wallet connected: ${shortAddress(account)}` });
    } catch (error) {
      setNotice({ kind: "error", text: String((error as Error).message ?? error) });
    } finally { setBusy(""); }
  }

  async function ensureWallet() {
    if (wallet) return wallet;
    const account = await connectWallet();
    setWallet(account);
    return account;
  }

  async function transact(label: string, method: string, args: unknown[] = [], value = 0n) {
    try {
      setBusy(label);
      setNotice({ kind: "info", text: `${label}: waiting for wallet approval and validator consensus…` });
      const account = await ensureWallet();
      const hash = await writeContract(account, method, args, value);
      setNotice({ kind: "success", text: `${label} finalized. Transaction ${shortAddress(hash)}.` });
      await loadLive();
    } catch (error) {
      setNotice({ kind: "error", text: String((error as Error).message ?? error) });
    } finally { setBusy(""); }
  }

  async function createPool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") ?? "").trim();
    const id = String(data.get("pool_id") ?? "").trim() || `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)}-${Date.now().toString(36)}`;
    await transact("Create pool", "create_pool", [id, title, String(data.get("description") ?? ""), String(data.get("rules") ?? ""), String(data.get("verification_mode") ?? "self_attested"), parseGen(String(data.get("stake") ?? "0")), Number(data.get("rounds") ?? 1), Number(data.get("min_players") ?? 2), Number(data.get("max_players") ?? 10), Number(data.get("join_days") ?? 7) * 86400, Number(data.get("round_hours") ?? 24) * 3600]);
  }

  async function submitCheckin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const snapshot = String(data.get("snapshot") ?? "");
    const digest = snapshot ? await digestText(snapshot) : String(data.get("digest") ?? "");
    await transact("Submit check-in", "submit_checkin", [String(data.get("pool_id") ?? checkinPool), String(data.get("proof") ?? ""), String(data.get("evidence_url") ?? ""), digest, `web-${Date.now().toString(36)}`]);
  }

  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#142118]">
      <nav className="sticky top-0 z-40 border-b border-[#173c2d]/8 bg-[#f5f1e8]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1420px] items-center justify-between gap-4 px-5 py-4 sm:px-10 lg:px-14">
          <button className="flex items-center gap-3 text-left" onClick={() => setTab("explore")}><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#173c2d] text-sm font-black text-[#dfff72] shadow-lg">CP</span><span><strong className="block text-[15px] tracking-tight">Commitment Pools</strong><small className="block text-[10px] font-bold uppercase tracking-[.16em] text-[#65746b]">Proof over promises</small></span></button>
          <div className="hidden items-center gap-1 rounded-full bg-white/55 p-1 text-sm font-bold md:flex">{(["explore", "mine", "create", "owner"] as Tab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={`nav-pill ${tab === item ? "nav-pill-active" : ""}`}>{item === "mine" ? "My commitments" : item === "create" ? "Create pool" : statusLabel(item)}</button>)}</div>
          <button className="wallet-button" onClick={handleConnect} disabled={busy === "connect"}><span className={`h-2 w-2 rounded-full ${wallet ? "bg-[#dfff72]" : "bg-white/40"}`} />{wallet ? shortAddress(wallet) : busy === "connect" ? "Connecting…" : "Connect wallet"}</button>
        </div>
        <div className="mx-auto flex max-w-[1420px] gap-2 overflow-x-auto px-5 pb-3 md:hidden">{(["explore", "mine", "create", "owner"] as Tab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={`mobile-tab ${tab === item ? "mobile-tab-active" : ""}`}>{item === "mine" ? "Mine" : item === "create" ? "Create" : statusLabel(item)}</button>)}</div>
      </nav>

      <div className="mx-auto max-w-[1420px] px-5 pt-4 sm:px-10 lg:px-14">
        <div className={`mode-strip ${isLiveConfigured ? "mode-live" : "mode-preview"}`}><span className="font-black">{isLiveConfigured ? "Live contract" : "Product preview"}</span><span>{isLiveConfigured ? `${shortAddress(contractAddress)} · finalized writes only` : "Real interface, sample data. Transactions stay blocked until deployment is configured."}</span></div>
        {notice && <div className={`notice notice-${notice.kind}`} role="status"><span>{notice.kind === "success" ? "✓" : notice.kind === "error" ? "!" : "…"}</span><p>{notice.text}</p><button aria-label="Dismiss message" onClick={() => setNotice(null)}>×</button></div>}
      </div>

      {tab === "explore" && <>
        <section className="mx-auto grid max-w-[1420px] gap-8 px-5 pb-14 pt-8 sm:px-10 lg:grid-cols-[1.08fr_.92fr] lg:px-14 lg:pb-20 lg:pt-12">
          <div className="flex flex-col justify-center py-5 lg:py-12"><div className="mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-[#173c2d]/10 bg-white/65 px-3 py-2 text-xs font-bold text-[#365444] shadow-sm"><span className="h-2 w-2 rounded-full bg-[#6d9b2f]" /> Stakes obey the terms signed before anyone joins</div><h1 className="max-w-3xl text-[clamp(3.3rem,7vw,7.35rem)] font-black leading-[.87] tracking-[-.072em] text-[#173c2d]">Put some <span className="text-[#547743]">weight</span><br />behind your word.</h1><p className="mt-8 max-w-xl text-lg leading-8 text-[#53635a]">Join a small cohort, stake on a visible schedule, and prove each round against rules nobody can rewrite after funds move.</p><div className="mt-9 flex flex-wrap gap-3"><button className="primary-button" onClick={() => setTab("create")}>Create a pool <span>↗</span></button><button className="secondary-button" onClick={() => document.getElementById("forming-pools")?.scrollIntoView({ behavior: "smooth" })}>Browse forming pools</button></div><div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-[#6c7a72]"><span>✓ Minimum cohort refunds</span><span>✓ Fee snapshot per pool</span><span>✓ All-fail refunds minus fee</span></div></div>
          <div className="relative min-h-[580px] overflow-hidden rounded-[34px] bg-[#173c2d] p-5 text-white shadow-[0_35px_80px_rgba(23,60,45,.22)] sm:p-7"><div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border-[48px] border-[#dfff72]/10" /><div className="relative flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#b9c8bf]">Your next check-in</p><h2 className="mt-2 text-2xl font-black tracking-tight">{activePool.title}</h2></div><span className="rounded-full bg-[#dfff72] px-3 py-1.5 text-xs font-black text-[#173c2d]">Round 8 / {activePool.rounds_required}</span></div><div className="relative mt-8 rounded-[26px] bg-[#f8f5ed] p-6 text-[#142118] shadow-xl"><div className="flex items-end justify-between"><div><p className="eyebrow">Submit before</p><p className="mt-1 text-3xl font-black tracking-tight">2h 16m</p></div><div className="grid h-20 w-20 place-items-center rounded-full border-[9px] border-[#dfff72] text-sm font-black">38%</div></div><div className="mt-6 grid grid-cols-7 gap-2">{["M","T","W","T","F","S","S"].map((day, index) => <div key={`${day}-${index}`} className="text-center"><div className={`mx-auto h-12 rounded-full ${index < 5 ? "bg-[#173c2d]" : index === 5 ? "bg-[#dfff72]" : "bg-[#e8e4da]"}`} /><span className="mt-2 block text-[10px] font-bold text-[#7c867f]">{day}</span></div>)}</div><button className="mt-6 w-full rounded-2xl bg-[#173c2d] py-4 text-sm font-black text-white" onClick={() => setTab("mine")}>Open check-in workspace</button><p className="mt-3 text-center text-xs font-medium text-[#6f7a73]">{statusLabel(activePool.verification_mode)} · unclear results can retry within the same round</p></div><div className="relative mt-5 grid grid-cols-2 gap-4"><div className="rounded-[22px] bg-white/10 p-5 ring-1 ring-white/10"><p className="text-xs font-bold text-[#b9c8bf]">Your stake</p><p className="mt-2 text-2xl font-black">{formatGen(activePool.stake_wei)} GEN</p><p className="mt-1 text-xs text-[#9fb0a6]">Fee locked at {(activePool.fee_bps / 100).toFixed(2)}%</p></div><div className="rounded-[22px] bg-[#dfff72] p-5 text-[#173c2d]"><p className="text-xs font-bold text-[#466228]">Cohort progress</p><p className="mt-2 text-2xl font-black">84%</p><p className="mt-1 text-xs text-[#526c35]">16 of 19 still active</p></div></div></div>
        </section>
        <section id="forming-pools" className="mx-auto max-w-[1420px] px-5 pb-20 sm:px-10 lg:px-14"><div className="mb-6 flex items-end justify-between"><div><p className="eyebrow">Open formation windows</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Commitments worth keeping</h2></div><p className="hidden text-sm font-semibold text-[#6e7d74] sm:block">Terms are hashed before the first stake.</p></div><div className="grid gap-5 lg:grid-cols-3">{pools.filter((pool) => pool.status === "forming").map((pool, index) => <article key={pool.id} className="pool-card"><div className={`pool-icon ${index % 2 ? "pool-icon-blue" : ""}`}>{index % 2 ? "↗" : "✓"}</div><div className="mt-6 flex items-start justify-between gap-4"><div><span className="status-chip">{statusLabel(pool.verification_mode)}</span><h3 className="mt-3 text-xl font-black tracking-tight">{pool.title}</h3></div><p className="shrink-0 text-xl font-black">{formatGen(pool.stake_wei)} <small className="text-xs text-[#718078]">GEN</small></p></div><p className="mt-3 min-h-12 text-sm leading-6 text-[#68776f]">{pool.description ?? `${pool.rounds_required} scheduled rounds with immutable verification rules.`}</p><div className="pool-facts"><div><strong>{pool.participant_count}/{pool.max_players}</strong><span>joined</span></div><div><strong>{pool.rounds_required}</strong><span>rounds</span></div><div><strong>{dateLabel(pool.join_deadline)}</strong><span>closes</span></div></div><div className="mt-5 flex items-center justify-between gap-3"><span className="truncate font-mono text-[10px] text-[#809087]" title={pool.terms_hash}>Terms {pool.terms_hash.slice(0, 8)}…</span><button className="small-primary" disabled={Boolean(busy)} onClick={() => transact("Join pool", "join", [pool.id], BigInt(pool.stake_wei))}>{busy === "Join pool" ? "Joining…" : "Review & join"}</button></div></article>)}</div></section>
        <section className="bg-[#e7eadf]"><div className="mx-auto max-w-[1420px] px-5 py-20 sm:px-10 lg:px-14"><p className="eyebrow">How the product protects people</p><h2 className="mt-3 max-w-2xl text-4xl font-black tracking-[-.04em]">One clear lifecycle. No surprise rule changes.</h2><div className="mt-10 grid gap-4 md:grid-cols-4">{[["01", "Form", "Creator publishes the exact stake, cohort minimum, schedule, fee, evidence mode, and all-fail policy."],["02", "Activate", "Activity begins only after formation closes. An underfilled cohort moves to full-stake refunds."],["03", "Prove", "Each scheduled round has a bounded retry budget and an append-only evidence record."],["04", "Settle", "Value is conserved into winner credits, participant refunds, and the snapshotted fee—then finalized."]].map(([number, title, copy]) => <article className="rounded-[24px] bg-[#f7f4eb] p-6" key={number}><span className="text-xs font-black text-[#6e7d74]">{number}</span><h3 className="mt-8 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-[#68776f]">{copy}</p></article>)}</div></div></section>
      </>}

      {tab === "mine" && <section className="mx-auto max-w-[1420px] px-5 py-10 sm:px-10 lg:px-14 lg:py-14"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Participant workspace</p><h1 className="mt-2 text-4xl font-black tracking-[-.045em] sm:text-5xl">Keep the promise in front of you.</h1><p className="mt-3 max-w-2xl text-[#64736b]">Only actions available in the current contract state appear here. Payout emission is shown separately from network delivery.</p></div><button className="secondary-button" onClick={() => void transact("Emit withdrawal", "withdraw")}>Emit available withdrawal</button></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Active commitments" value="1" note="1 check-in due today"/><Metric label="Rounds passed" value="7 / 21" note="33% of schedule complete"/><Metric label="At stake" value={`${formatGen(activePool.stake_wei)} GEN`} note={`Fee snapshot ${(activePool.fee_bps / 100).toFixed(2)}%`}/><Metric label="Available credit" value="0 GEN" note="Withdrawal emits a child transfer"/></div>
        <div className="mt-7 grid gap-6 lg:grid-cols-[1.08fr_.92fr]"><form onSubmit={submitCheckin} className="surface-card p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="status-chip">Round window open</span><h2 className="mt-3 text-2xl font-black">Submit this round’s proof</h2><p className="mt-2 text-sm text-[#6a7971]">An unclear result preserves your active status, but consumes one of three attempts.</p></div><div className="rounded-2xl bg-[#173c2d] px-4 py-3 text-right text-white"><small className="block text-[10px] font-bold uppercase tracking-[.12em] text-white/60">Closes in</small><strong className="text-xl">2h 16m</strong></div></div><div className="mt-7 grid gap-5"><Field label="Commitment"><select name="pool_id" value={checkinPool} onChange={(event) => setCheckinPool(event.target.value)}>{pools.map((pool) => <option key={pool.id} value={pool.id}>{pool.title}</option>)}</select></Field><Field label="What did you complete?" hint="Keep this factual. The model treats your text as untrusted evidence, not instructions."><textarea name="proof" required rows={4} placeholder="I completed a 90-minute focus session from 08:10 to 09:40…" /></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Evidence URL" hint="HTTPS public sources only."><input name="evidence_url" type="url" placeholder="https://…" /></Field><Field label="Expected SHA-256 digest" hint="Required for source-verified pools."><input name="digest" pattern="[0-9a-fA-F]{64}" placeholder="64 hexadecimal characters" /></Field></div><Field label="Optional source snapshot" hint="Paste normalized visible source text to calculate its digest locally."><textarea name="snapshot" rows={3} placeholder="Visible source text…" /></Field></div><div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[#173c2d]/10 pt-6"><p className="max-w-md text-xs leading-5 text-[#718078]">Submission records are append-only. A pass advances exactly one scheduled round; a fail ends participation.</p><button className="primary-button" disabled={Boolean(busy)} type="submit">{busy === "Submit check-in" ? "Waiting for consensus…" : "Submit proof"}</button></div></form>
          <div className="grid gap-6"><article className="rounded-[28px] bg-[#173c2d] p-6 text-white sm:p-7"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[.15em] text-[#b8c8be]">Signed terms</p><span className="rounded-full bg-[#dfff72] px-2.5 py-1 text-[10px] font-black text-[#173c2d]">Immutable</span></div><h3 className="mt-5 text-2xl font-black">{activePool.title}</h3><dl className="terms-grid"><div><dt>Schedule</dt><dd>{activePool.rounds_required} rounds</dd></div><div><dt>Verification</dt><dd>{statusLabel(activePool.verification_mode)}</dd></div><div><dt>All fail</dt><dd>Refund minus fee</dd></div><div><dt>Stake</dt><dd>{formatGen(activePool.stake_wei)} GEN</dd></div></dl><div className="mt-6 rounded-2xl bg-white/8 p-4 font-mono text-[11px] text-[#b8c8be] break-all">Terms hash<br/><span className="text-white">{activePool.terms_hash}</span></div></article><article className="surface-card p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">Recent attempts</p><h3 className="mt-2 text-xl font-black">Round 7</h3></div><span className="status-chip status-success">Pass</span></div><div className="mt-5 border-l-2 border-[#c9e95f] pl-4"><p className="text-sm font-bold">Attempt 1 · finalized</p><p className="mt-1 text-xs leading-5 text-[#718078]">Evidence matched its committed digest and validators agreed on the pass verdict.</p></div><p className="mt-5 text-[11px] font-semibold text-[#7a8980]">Reasoning is explanatory. Verdict and observed source digest are the authoritative consensus fields.</p></article></div></div></section>}

      {tab === "create" && <section className="mx-auto grid max-w-[1420px] gap-8 px-5 py-10 sm:px-10 lg:grid-cols-[1fr_380px] lg:px-14 lg:py-14"><div><p className="eyebrow">Creator workflow</p><h1 className="mt-2 text-4xl font-black tracking-[-.045em] sm:text-5xl">Write the rules before<br/>anyone puts money down.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-[#65746c]">The pool ID, verification policy, schedule, economics, refund policy, and fee recipient are hashed together. Later platform changes cannot alter this pool.</p><form onSubmit={createPool} className="surface-card mt-8 p-6 sm:p-8"><div className="grid gap-5"><div className="grid gap-5 sm:grid-cols-2"><Field label="Pool title"><input name="title" required maxLength={120} placeholder="30 mornings of movement" /></Field><Field label="Pool ID" hint="Optional; one is generated if blank."><input name="pool_id" maxLength={80} placeholder="move-30" /></Field></div><Field label="Plain-language promise"><textarea name="description" required maxLength={500} rows={3} placeholder="What will every participant commit to doing?" /></Field><Field label="Pass / fail rules" hint="Be precise enough that an independent reviewer could apply them."><textarea name="rules" required maxLength={2500} rows={5} placeholder="Pass when… Fail when… Evidence must…" /></Field><fieldset><legend className="field-title">Verification mode</legend><div className="mt-2 grid gap-3 sm:grid-cols-2"><label className="choice-card"><input type="radio" name="verification_mode" value="self_attested" defaultChecked/><span><strong>Self-attested</strong><small>Lower friction. The participant’s statement is the only source.</small></span></label><label className="choice-card"><input type="radio" name="verification_mode" value="source_verified"/><span><strong>Source-verified</strong><small>HTTPS source plus a matching content digest is mandatory.</small></span></label></div></fieldset><div className="grid gap-5 sm:grid-cols-3"><Field label="Stake (GEN)"><input name="stake" type="number" min="0.000001" step="0.000001" required defaultValue="10" /></Field><Field label="Rounds"><input name="rounds" type="number" min="1" max="60" required defaultValue="21" /></Field><Field label="Round length (hours)"><input name="round_hours" type="number" min="1" max="744" required defaultValue="24" /></Field></div><div className="grid gap-5 sm:grid-cols-3"><Field label="Minimum cohort"><input name="min_players" type="number" min="2" max="100" required defaultValue="6" /></Field><Field label="Maximum cohort"><input name="max_players" type="number" min="2" max="100" required defaultValue="20" /></Field><Field label="Formation (days)"><input name="join_days" type="number" min="1" max="90" required defaultValue="7" /></Field></div></div><div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#173c2d]/10 pt-6"><p className="max-w-lg text-xs leading-5 text-[#718078]">Creation does not move funds. Participants review the resulting immutable terms and stake separately.</p><button className="primary-button" type="submit" disabled={Boolean(busy)}>{busy === "Create pool" ? "Waiting for consensus…" : "Publish immutable terms"}</button></div></form></div><aside className="space-y-5 lg:pt-24"><div className="rounded-[28px] bg-[#dfff72] p-6"><p className="eyebrow text-[#506629]">Safety preview</p><h2 className="mt-4 text-2xl font-black">If the cohort minimum is missed</h2><p className="mt-3 text-sm leading-6 text-[#4f6034]">The pool never becomes active. Every joined participant can claim their full stake as contract credit—no platform fee.</p></div><div className="surface-card p-6"><p className="eyebrow">Creator checklist</p><ul className="check-list mt-5"><li>One measurable action per round</li><li>A deadline users can understand</li><li>Evidence sources available to validators</li><li>No private or authenticated URLs</li><li>Consequences stated before joining</li></ul></div><div className="rounded-[24px] border border-[#173c2d]/10 p-5 text-xs leading-5 text-[#65756c]"><strong className="text-[#173c2d]">Creator authority ends at publication.</strong><br/>Creators cannot edit terms, change fees, judge check-ins, seize stakes, or cancel after anyone joins.</div></aside></section>}

      {tab === "owner" && <section className="mx-auto max-w-[1420px] px-5 py-10 sm:px-10 lg:px-14 lg:py-14"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Owner console</p><h1 className="mt-2 text-4xl font-black tracking-[-.045em] sm:text-5xl">Operate the protocol,<br/>not people’s outcomes.</h1><p className="mt-3 max-w-2xl text-[#64736b]">The owner may schedule a future fee, but cannot rewrite existing pools, verdicts, evidence, participant status, or settlement splits.</p></div><div className={`rounded-full px-4 py-2 text-xs font-black ${isOwner ? "bg-[#dfff72]" : "bg-white/70"}`}>{isOwner ? "Connected as owner" : `Owner ${shortAddress(owner)}`}</div></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Pools created" value={String(stats.pools_created ?? 0)} note={`${stats.pools_activated ?? 0} activated`}/><Metric label="Total joins" value={String(stats.joins ?? 0)} note={`${stats.checkins_passed ?? 0} passed check-ins`}/><Metric label="Fees accrued" value={`${formatGen(String(stats.fees_accrued_wei ?? 0))} GEN`} note="Only on forfeited funds"/><Metric label="Payouts emitted" value={String(stats.payouts_emitted ?? 0)} note="Delivery verified separately"/></div><div className="mt-7 grid gap-6 lg:grid-cols-[.9fr_1.1fr]"><form className="surface-card p-6 sm:p-8" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void transact("Schedule fee", "schedule_fee_bps", [Number(data.get("fee_bps") ?? 0)]); }}><p className="eyebrow">Future fee schedule</p><div className="mt-4 flex items-end gap-3"><Field label="New fee (basis points)" hint="Maximum 1,000 bps / 10%."><input name="fee_bps" type="number" min="0" max="1000" defaultValue={String(config.fee_bps ?? 0)} /></Field><button className="primary-button mb-[22px] shrink-0" disabled={Boolean(busy) || (isLiveConfigured && !isOwner)} type="submit">Schedule</button></div><div className="mt-5 rounded-2xl bg-[#edf0e8] p-4 text-sm"><div className="flex justify-between"><span>Current fee</span><strong>{(Number(config.fee_bps ?? 0) / 100).toFixed(2)}%</strong></div><div className="mt-2 flex justify-between"><span>Delay</span><strong>24 hours</strong></div><div className="mt-2 flex justify-between"><span>Existing pools</span><strong>Unaffected</strong></div></div><button className="secondary-button mt-4 w-full" type="button" onClick={() => void transact("Apply scheduled fee", "apply_scheduled_fee")}>Apply matured change</button></form><article className="rounded-[28px] bg-[#173c2d] p-6 text-white sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.15em] text-[#a9bbb0]">Protocol health</p><h2 className="mt-2 text-2xl font-black">Constraints are doing the work.</h2></div><span className="grid h-12 w-12 place-items-center rounded-full bg-[#dfff72] text-xl font-black text-[#173c2d]">✓</span></div><div className="mt-7 grid gap-3 sm:grid-cols-2">{[["Fee escalation","24h timelock"],["Pool economics","Snapshot at creation"],["Minimum cohort","Refund state"],["Retries","3 per round"],["All participants fail","Refund minus fee"],["Payout status","Emission ≠ delivery"]].map(([label,value]) => <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/8" key={label}><p className="text-xs text-[#a9bbb0]">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>)}</div></article></div></section>}

      <footer className="border-t border-[#173c2d]/10"><div className="mx-auto flex max-w-[1420px] flex-wrap items-center justify-between gap-4 px-5 py-8 text-xs font-semibold text-[#718078] sm:px-10 lg:px-14"><p>Commitment Pools · independent GenLayer product</p><p>Immutable terms · bounded evidence · conserved value</p></div></footer>
    </main>
  );
}
