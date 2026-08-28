"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { contractAddress, digestText, formatGen, isLiveConfigured, parseGen, readContract, shortAddress } from "../lib/genlayer";
import { normalizeParticipant, normalizePool, poolActions, record, roundState, type Participant, type Pool } from "../lib/lifecycle";
import { errorMessage, useProtocol } from "../lib/useProtocol";

type Tab = "explore" | "mine" | "create" | "owner";
type Detail = { key: string; pool: Pool; participants: Participant[]; canSettle: boolean; attempt: Record<string, unknown> | null };
const tabs: [Tab, string][] = [["explore", "Explore"], ["mine", "Pool workspace"], ["create", "Create pool"], ["owner", "Owner"]];
const shell = "mx-auto max-w-[1420px] px-5 sm:px-10 lg:px-14";
function label(value: string) { return value.replaceAll("_", " "); }
function date(value: number) { return value ? new Date(value * 1000).toLocaleString(undefined, {dateStyle: "medium", timeStyle: "short"}) : "Not scheduled"; }
function Field({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return <label className="field-label"><span>{title}</span>{children}{hint && <small>{hint}</small>}</label>;
}
function Metric({ title, value, note }: { title: string; value: string; note: string }) {
  return <div className="surface-card p-5"><p className="eyebrow">{title}</p><p className="mt-3 break-words text-3xl font-black tracking-tight">{value}</p><p className="mt-2 text-xs text-[#718078]">{note}</p></div>;
}
function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="surface-card p-8"><h2 className="text-xl font-black">{title}</h2><p className="mt-3 text-sm leading-6 text-[#65746c]">{children}</p></div>;
}

export default function Home() {
  const protocol = useProtocol("list_pools");
  const { wallet, stats, config, credit, busy, ready, now, notice, setNotice, transact } = protocol;
  const [tab, setTab] = useState<Tab>("explore");
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const pools = useMemo(() => protocol.items.map(normalizePool), [protocol.items]);
  const poolId = selectedId || pools[0]?.id || "";
  const detailKey = [poolId, wallet, protocol.revision].join("|");
  const selected = detail?.key === detailKey ? detail : null;
  const pool = selected?.pool;
  const me = selected?.participants.find(p => p.address.toLowerCase() === wallet.toLowerCase()) ?? null;
  const actions = pool ? poolActions(pool, me, wallet, now, Boolean(selected?.canSettle) || now >= pool.activity_ends_at) : null;
  const round = pool ? roundState(pool, me, now) : null;
  const owner = String(config?.owner ?? "");
  const isOwner = Boolean(wallet && owner && wallet.toLowerCase() === owner.toLowerCase());
  const disabled = Boolean(busy) || !ready;
  const pendingFeeAt = Number(config?.pending_fee_effective_at ?? 0);

  useEffect(() => {
    let cancelled = false;
    const task = window.setTimeout(async () => {
      setAcceptedTerms(false); setDetailError("");
      if (!poolId || !isLiveConfigured) return;
      try {
        const [poolRaw, playersRaw, settleRaw] = await Promise.all([
          readContract("get_pool", [poolId]), readContract("list_participants", [poolId, 0, 50]), readContract("can_settle", [poolId]),
        ]);
        const players = record(playersRaw);
        const participants = Array.isArray(players.items) ? players.items.map(normalizeParticipant) : [];
        if (Number(players.total ?? 0) > 50) {
          const second = record(await readContract("list_participants", [poolId, 50, 50]));
          if (Array.isArray(second.items)) participants.push(...second.items.map(normalizeParticipant));
        }
        const mine = participants.find(p => p.address.toLowerCase() === wallet.toLowerCase());
        let attempt: Record<string, unknown> | null = null;
        if (mine?.last_attempt_id) {
          const parts = mine.last_attempt_id.split(":");
          attempt = record(await readContract("get_attempt", [poolId, wallet, Number(parts.at(-2)), Number(parts.at(-1))]));
        }
        if (!cancelled) setDetail({key: detailKey, pool: normalizePool(poolRaw), participants, canSettle: settleRaw === true, attempt});
      } catch (failure) { if (!cancelled) setDetailError(errorMessage(failure)); }
    }, 0);
    return () => { cancelled = true; window.clearTimeout(task); };
  }, [detailKey, poolId, wallet]);

  function openPool(id: string) { setSelectedId(id); setAcceptedTerms(false); setTab("mine"); }
  async function createPool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const id = String(data.get("pool_id") ?? "").trim() || "pool-" + Date.now().toString(36);
      const minimum = Number(data.get("min_players"));
      const maximum = Number(data.get("max_players"));
      if (minimum > maximum) throw new Error("Minimum cohort cannot exceed maximum cohort.");
      const stake = parseGen(String(data.get("stake")));
      if (stake <= 0n) throw new Error("Stake must be greater than zero.");
      const success = await transact("Create pool", "create_pool", [
        id, String(data.get("title")).trim(), String(data.get("description")), String(data.get("rules")),
        String(data.get("verification_mode")), stake, Number(data.get("rounds")), minimum, maximum,
        Number(data.get("join_days")) * 86400, Number(data.get("round_hours")) * 3600,
      ]);
      if (success) openPool(id);
    } catch (failure) { setNotice({kind: "error", text: errorMessage(failure)}); }
  }
  async function checkIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pool || !actions?.submit) return;
    const data = new FormData(event.currentTarget);
    try {
      const snapshot = String(data.get("snapshot") ?? "");
      const digest = snapshot.trim() ? await digestText(snapshot) : String(data.get("digest") ?? "").trim();
      if (pool.verification_mode === "source_verified" && !/^[0-9a-f]{64}$/i.test(digest))
        throw new Error("Provide the full rendered source text or a 64-character SHA-256 digest.");
      await transact("Submit check-in", "submit_checkin", [pool.id, String(data.get("proof")), String(data.get("evidence_url") ?? ""), digest, crypto.randomUUID()]);
    } catch (failure) { setNotice({kind: "error", text: errorMessage(failure)}); }
  }

  return <main className="min-h-screen bg-[#f5f1e8] text-[#142118]">
    <nav className="sticky top-0 z-40 border-b border-[#173c2d]/10 bg-[#f5f1e8]/95 backdrop-blur-xl">
      <div className={shell + " flex items-center justify-between gap-4 py-4"}>
        <button className="flex items-center gap-3 text-left" onClick={() => setTab("explore")}><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#173c2d] text-sm font-black text-[#dfff72]">CP</span><span><strong className="block text-sm">Commitment Pools</strong><small className="text-[10px] font-bold uppercase tracking-widest text-[#65746b]">Proof over promises</small></span></button>
        <div className="hidden rounded-full bg-white/60 p-1 text-sm md:flex">{tabs.map(([id, title]) => <button key={id} aria-current={tab === id ? "page" : undefined} className={"nav-pill " + (tab === id ? "nav-pill-active" : "")} onClick={() => setTab(id)}>{title}</button>)}</div>
        <button className="wallet-button" disabled={Boolean(busy)} onClick={() => void protocol.connect()}>{wallet ? shortAddress(wallet) : "Connect wallet"}</button>
      </div>
      <div className={shell + " flex gap-2 overflow-x-auto pb-3 md:hidden"}>{tabs.map(([id, title]) => <button key={id} aria-current={tab === id ? "page" : undefined} className={"mobile-tab " + (tab === id ? "mobile-tab-active" : "")} onClick={() => setTab(id)}>{title}</button>)}</div>
    </nav>
    <div className={shell + " pt-4"}>
      <div className="mode-strip mode-live"><strong>Studionet · sandbox</strong><span>{isLiveConfigured ? shortAddress(contractAddress) + " · finalized contract data · test GEN only" : "Contract not configured. Transactions are disabled."}</span><button className="ml-auto underline" onClick={protocol.refresh} disabled={protocol.loading || Boolean(busy)}>{protocol.loading ? "Loading…" : "Refresh"}</button></div>
      {protocol.error && <div className="notice notice-error" role="alert"><span>!</span><p>{protocol.error} Previously loaded data may be stale; actions are disabled.</p><button aria-label="Retry loading" onClick={protocol.refresh}>↻</button></div>}
      {notice && <div className={"notice notice-" + notice.kind} role={notice.kind === "error" ? "alert" : "status"}><span>{notice.kind === "success" ? "✓" : "!"}</span><div><p>{notice.text}</p>{notice.hash && <code className="mt-2 block break-all text-[11px]">{notice.hash}</code>}</div><button aria-label="Dismiss message" onClick={() => setNotice(null)}>×</button></div>}
    </div>

    {tab === "explore" && <>
      <section className={shell + " grid gap-8 py-12 lg:grid-cols-[1.1fr_.9fr] lg:py-16"}>
        <div className="py-6"><p className="eyebrow">A little accountability. A real commitment.</p><h1 className="mt-7 text-[clamp(3.3rem,7vw,7.1rem)] font-black leading-[.9] tracking-[-.07em] text-[#173c2d]">Put some <span className="text-[#547743]">weight</span><br/>behind your word.</h1><p className="mt-8 max-w-xl text-lg leading-8 text-[#53635a]">Join a cohort, stake on a visible schedule, and prove each round against rules nobody can rewrite after you join.</p><div className="mt-8 flex flex-wrap gap-3"><button className="primary-button" onClick={() => setTab("create")}>Create a pool ↗</button><button className="secondary-button" onClick={() => document.getElementById("pools")?.scrollIntoView({behavior: "smooth"})}>Explore pools</button></div><p className="mt-6 text-xs leading-6 text-[#6c7a72]">Minimum-cohort refunds · Fee snapshot per pool · Explicit proof rules</p></div>
        <aside className="rounded-[34px] bg-[#173c2d] p-7 text-white shadow-xl sm:p-9">
          <p className="text-xs font-bold uppercase tracking-widest text-[#b9c8bf]">The commitment, in four steps</p><h2 className="mt-4 text-3xl font-black tracking-tight">Know what you sign.<br/>Own what comes next.</h2>
          <ol className="mt-8 space-y-5">{[["01","Review the terms","See your exact stake, deadline, proof policy, and failure consequences."],["02","Form the cohort","If the minimum is missed, participants can claim full refund credit."],["03","Prove each round","Submit within the scheduled window. Unclear results allow up to three attempts."],["04","Settle & withdraw","Winners share forfeited stakes after the snapshotted fee. If all fail, everyone receives a refund minus that fee."]].map(([step,title,description]) => <li key={step} className="flex gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#dfff72] text-xs font-black text-[#173c2d]">{step}</span><div><h3 className="text-sm font-black">{title}</h3><p className="mt-1 text-xs leading-5 text-[#bdccc3]">{description}</p></div></li>)}</ol>
          <div className="mt-8 flex justify-between border-t border-white/15 pt-5 text-sm"><span>Actual pools on this contract</span><strong>{stats ? String(stats.pools_created ?? 0) : "—"}</strong></div>
        </aside>
      </section>
      <section id="pools" className={shell + " pb-16"}><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Public contract directory</p><h2 className="mt-2 text-3xl font-black tracking-tight">Commitments worth keeping</h2></div><p className="text-xs text-[#65746c]">{protocol.loading ? "Reading Studionet…" : pools.length + " of " + protocol.total + " pools loaded"}</p></div>
        {!pools.length ? <Empty title={protocol.loading ? "Loading pools…" : protocol.error ? "Pool directory unavailable" : "Your first cohort starts here"}>{protocol.error ? "Retry the network connection above." : "No sample activity is displayed. Create a pool to publish the first set of terms on this Studionet contract."}</Empty> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{pools.map((item,index) => <article className="pool-card" key={item.id}><div className="flex items-center justify-between"><span className={"pool-icon " + (index % 2 ? "pool-icon-blue" : "")}>{String(index+1).padStart(2,"0")}</span><span className="status-chip">{label(item.status)}</span></div><h3 className="mt-5 break-words text-xl font-black">{item.title}</h3><p className="mt-2 text-xs text-[#718078]">{label(item.verification_mode)}</p><div className="pool-facts"><div><strong>{formatGen(item.stake_wei)} GEN</strong><span>stake per person</span></div><div><strong>{item.rounds_required}</strong><span>scheduled rounds</span></div><div><strong>{item.participant_count}/{item.max_players}</strong><span>participants</span></div></div><p className="mt-4 text-xs leading-5 text-[#718078]">Join deadline: {date(item.join_deadline)}</p><button className="secondary-button mt-5 w-full" onClick={() => openPool(item.id)}>Review terms & status →</button></article>)}</div>}
        {pools.length < protocol.total && <button className="secondary-button mt-6" disabled={protocol.loading} onClick={() => void protocol.more()}>Load more pools</button>}
      </section>
    </>}

    {tab === "mine" && <section className={shell + " py-10"}>
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Participant workspace</p><h1 className="mt-2 text-4xl font-black tracking-tight">Your next step, made clear.</h1><p className="mt-3 text-sm text-[#65746c]">Review any public pool. Connect your participant wallet to see your round and credit.</p></div><div className="w-full sm:w-80"><Field title="Choose a pool"><select value={poolId} onChange={e => openPool(e.target.value)}><option value="" disabled>Select a pool</option>{pools.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></Field></div></div>
      <form className="mt-5 flex max-w-xl gap-3" onSubmit={e => {e.preventDefault(); openPool(String(new FormData(e.currentTarget).get("lookup")).trim());}}><Field title="Open a pool by ID"><input name="lookup" required maxLength={80} placeholder="Pool ID from your invitation" /></Field><button className="secondary-button self-end" type="submit">Open</button></form>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#173c2d]/10 bg-white/60 p-5"><div><p className="eyebrow">Your withdrawable contract credit</p><p className="mt-2 text-xl font-black">{wallet ? credit === null ? "Loading…" : formatGen(credit) + " GEN" : "Connect wallet to view"}</p>{protocol.creditError && <p className="mt-2 text-xs text-red-800">Credit unavailable: {protocol.creditError}</p>}<p className="mt-2 text-xs text-[#65746c]">Withdrawal emits a separate transfer. Emission is not proof of delivery.</p></div><button className="primary-button" disabled={disabled || credit === null || BigInt(credit) <= 0n} onClick={() => void transact("Withdraw credit", "withdraw")}>Withdraw credit</button></div>
      {detailError ? <div className="mt-6" role="alert"><Empty title="Pool could not be loaded">{detailError}</Empty></div> : !pool ? <div className="mt-6"><Empty title={poolId ? "Loading pool…" : "No pool selected"}>{poolId ? "Checking immutable terms and participant state." : "Create a pool or open an invitation ID to get started."}</Empty></div> :
      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-6">
          <article className="surface-card p-6 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><span className="eyebrow break-all">{pool.id}</span><span className="status-chip">{label(pool.status)}</span></div><h2 className="mt-4 text-3xl font-black tracking-tight">{pool.title}</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#65746c]">{pool.description}</p><h3 className="mt-6 text-sm font-black">The rules you are accepting</h3><p className="mt-3 whitespace-pre-wrap rounded-2xl bg-[#edf0e8] p-4 text-sm leading-7">{pool.rules}</p>
            <dl className="mt-6 grid grid-cols-2 gap-5 text-sm">{[["Stake",formatGen(pool.stake_wei)+" GEN"],["Verification",label(pool.verification_mode)],["Cohort",pool.participant_count+" joined · minimum "+pool.min_players+" · max "+pool.max_players],["Schedule",pool.rounds_required+" rounds · "+(pool.round_window_seconds/3600)+" hours each"],["Join deadline",date(pool.join_deadline)],["Activity starts",date(pool.activity_starts_at)],["Activity ends",date(pool.activity_ends_at)],["Fee on forfeitures",(pool.fee_bps/100)+"%"]].map(([key,value]) => <div key={key}><dt className="text-xs text-[#718078]">{key}</dt><dd className="mt-1 font-bold">{value}</dd></div>)}</dl>
            <p className="mt-6 text-xs leading-6 text-[#65746c]">A failed or missed round forfeits your stake to successful participants, minus the fee. If everyone fails, all stakes are refunded minus the fee. A missed minimum or unusable activation window returns full refund credit. A source-verified check-in must match the validator-rendered public page; a self-attested statement is not independent proof.</p>
            <details className="mt-5 text-xs"><summary className="cursor-pointer font-bold">Immutable terms hash & authority</summary><p className="mt-3 break-all font-mono">{pool.terms_hash}</p><p className="mt-2 break-all">Creator: {pool.creator}</p><p className="mt-2 break-all">Fee recipient: {pool.fee_recipient}</p></details>
            {actions?.join && <div className="mt-6 border-t border-[#173c2d]/10 pt-5"><label className="flex items-start gap-3 text-xs leading-6"><input type="checkbox" className="mt-1" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)}/><span>I have reviewed the rules, schedule, refund policy and exact {formatGen(pool.stake_wei)} GEN stake. This is a Studionet test commitment.</span></label><button className="primary-button mt-4" disabled={disabled || !acceptedTerms} onClick={() => void transact("Join pool", "join", [pool.id], BigInt(pool.stake_wei))}>Confirm terms & stake {formatGen(pool.stake_wei)} GEN</button></div>}
            {!wallet && <button className="primary-button mt-6" disabled={Boolean(busy)} onClick={() => void protocol.connect()}>Connect wallet to participate</button>}
            <div className="mt-5 flex flex-wrap gap-3">{actions?.activate && <button className="primary-button" disabled={disabled} onClick={() => void transact("Activate pool", "activate_pool", [pool.id])}>Activate or enable refunds</button>}{actions?.cancel && <button className="secondary-button" disabled={disabled} onClick={() => void transact("Cancel empty pool", "cancel_empty_pool", [pool.id])}>Cancel empty pool</button>}{actions?.refund && <button className="primary-button" disabled={disabled} onClick={() => void transact("Claim formation refund", "claim_formation_refund", [pool.id])}>Claim full refund credit</button>}{actions?.settle && <button className="primary-button" disabled={disabled} onClick={() => void transact("Settle pool", "settle", [pool.id])}>Settle & allocate credits</button>}</div>
            {pool.activation_failure && <p className="mt-4 text-xs text-[#7b3023]">Activation outcome: {label(pool.activation_failure)}</p>}
            {pool.status === "settled" && <p className="mt-4 text-sm">{pool.winner_count} successful · {pool.loser_count} failed · {formatGen(pool.fee_wei)} GEN fee. Allocations are available as contract credit.</p>}
          </article>
          <article className="surface-card p-6"><h3 className="text-xl font-black">Cohort activity</h3>{!selected?.participants.length ? <p className="mt-4 text-sm text-[#718078]">No participants have joined.</p> : <ul className="mt-5 divide-y divide-[#173c2d]/10">{selected.participants.map(player => {const missed = player.status === "active" && pool.status === "active" && now >= roundState(pool,player,now).closesAt; return <li key={player.address} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="text-xs font-bold">{shortAddress(player.address)}{player.address.toLowerCase() === wallet.toLowerCase() ? " · you" : ""}</p><p className="mt-1 text-xs text-[#718078]">{player.rounds_passed}/{pool.rounds_required} rounds passed · {label(player.status)}</p></div>{missed && wallet && <button className="small-primary" disabled={disabled} onClick={() => void transact("Mark missed round", "mark_missed_round", [pool.id, player.address])}>Record missed deadline</button>}</li>;})}</ul>}</article>
        </div>
        <aside className="space-y-6">
          <article className="rounded-[28px] bg-[#173c2d] p-6 text-white"><p className="text-xs font-bold uppercase tracking-widest text-[#b9c8bf]">Your position</p><h2 className="mt-3 text-3xl font-black">{me ? label(me.status) : wallet ? "Not a participant" : "Wallet not connected"}</h2>{me && round && <><p className="mt-5">{me.rounds_passed}/{pool.rounds_required} rounds passed</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full bg-[#dfff72]" style={{width: (me.rounds_passed / pool.rounds_required * 100) + "%"}}/></div>{me.status === "active" && <div className="mt-5 text-sm leading-7"><p>Next round: {round.number}</p><p>Opens: {date(round.opensAt)}</p><p>Closes: {date(round.closesAt)}</p><p>Attempts used: {round.attempts}/3</p></div>}<p className="mt-5 text-sm">Settlement credit: {formatGen(me.settlement_credit_wei)} GEN</p></>}</article>
          {actions?.submit && <form className="surface-card space-y-5 p-6" onSubmit={checkIn}><div><p className="eyebrow">Round {round?.number}</p><h3 className="mt-2 text-xl font-black">Submit your proof</h3></div><Field title="What did you complete?"><textarea name="proof" required maxLength={3000} rows={5} placeholder="Describe the action, date, and how it meets the rules."/></Field><Field title={pool.verification_mode === "source_verified" ? "Public HTTPS evidence URL" : "Evidence URL (optional)"}><input name="evidence_url" type="url" pattern="https://.+" required={pool.verification_mode === "source_verified"} maxLength={2048} placeholder="https://…"/></Field>{pool.verification_mode === "source_verified" && <><Field title="Full rendered source text" hint="Whitespace is normalized before hashing. It must match the entire text validators fetch—not an excerpt."><textarea name="snapshot" rows={4}/></Field><Field title="Or provide a SHA-256 digest"><input name="digest" pattern="[a-fA-F0-9]{64}" maxLength={64}/></Field></>}<p className="text-xs leading-5 text-[#718078]">Submit well before the deadline; consensus can take several minutes. Proof and public evidence must not contain private information.</p><button className="primary-button w-full" disabled={disabled}>Submit round {round?.number} proof</button></form>}
          {me && !actions?.submit && pool.status === "active" && <Empty title="Check-in is not available">{me.status !== "active" ? "Your participant status is terminal. Settlement becomes available when all participants are terminal or the activity ends." : "The next round is not open, its deadline passed, or its three-attempt limit was reached. Check the schedule above."}</Empty>}
          {selected?.attempt && <article className="surface-card p-6"><p className="eyebrow">Latest recorded attempt</p><div className="mt-3 flex items-center justify-between"><h3 className="text-lg font-black">Round {String(selected.attempt.round)} · attempt {String(selected.attempt.attempt)}</h3><span className="status-chip">{String(selected.attempt.verdict)}</span></div><p className="mt-4 text-sm leading-6 text-[#65746c]">{String(selected.attempt.reasoning ?? "")}</p><p className="mt-3 text-xs text-[#718078]">Leader explanation is not an independent audit. The recorded verdict and evidence digest are the consensus fields.</p><details className="mt-4 text-xs"><summary>Evidence digest</summary><code className="mt-2 block break-all">{String(selected.attempt.observed_evidence_digest || "No external source digest")}</code></details></article>}
        </aside>
      </div>}
    </section>}

    {tab === "create" && <section className={shell + " grid gap-8 py-12 lg:grid-cols-[1fr_340px]"}><div><p className="eyebrow">Creator workflow</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Write the rules before<br/>anyone puts money down.</h1><form onSubmit={createPool} className="surface-card mt-8 space-y-5 p-6 sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><Field title="Pool title"><input name="title" required maxLength={120} placeholder="30 mornings of movement"/></Field><Field title="Pool ID" hint="Optional; generated if blank."><input name="pool_id" maxLength={80} placeholder="move-30"/></Field></div><Field title="Plain-language promise"><textarea name="description" required maxLength={500} rows={3}/></Field><Field title="Pass / fail rules" hint="Define one measurable action, accepted evidence, and clear failure conditions."><textarea name="rules" required maxLength={2500} rows={5}/></Field><Field title="Verification policy"><select name="verification_mode"><option value="self_attested">Self-attested — participant statement only</option><option value="source_verified">Source-verified — public HTTPS source + digest</option></select></Field><div className="grid gap-5 sm:grid-cols-3"><Field title="Test stake (GEN)"><input name="stake" inputMode="decimal" required pattern="[0-9]+([.][0-9]{1,18})?" defaultValue="0.001"/></Field><Field title="Rounds"><input name="rounds" type="number" min="1" max="60" required defaultValue="7"/></Field><Field title="Round length (hours)"><input name="round_hours" type="number" min="1" max="744" required defaultValue="24"/></Field><Field title="Minimum cohort"><input name="min_players" type="number" min="2" max="100" required defaultValue="2"/></Field><Field title="Maximum cohort"><input name="max_players" type="number" min="2" max="100" required defaultValue="10"/></Field><Field title="Formation (days)"><input name="join_days" type="number" min="1" max="90" required defaultValue="3"/></Field></div><p className="text-xs leading-6 text-[#718078]">Creation publishes terms without moving funds. Stake and all deadlines are immutable. Rounds begin at the formation deadline, so someone must activate the pool promptly.</p><button className="primary-button" disabled={disabled}>{busy === "Create pool" ? "Waiting for finality…" : "Publish immutable terms"}</button></form></div><aside className="space-y-5 lg:pt-24"><article className="rounded-[28px] bg-[#dfff72] p-6"><p className="eyebrow">Studionet first</p><h2 className="mt-4 text-2xl font-black">Make the promise small.<br/>Make the rules clear.</h2><p className="mt-4 text-sm leading-7">This product uses test GEN. Wallet funding and contract payouts must be validated on your Studionet setup before asking a cohort to stake.</p></article><article className="surface-card p-6"><h3 className="font-black">Creator checklist</h3><ul className="check-list mt-5"><li>One measurable action per round</li><li>Enough time for validator consensus</li><li>Public evidence available without login</li><li>Failure consequences stated up front</li><li>No personal or confidential evidence</li></ul></article><p className="p-4 text-xs leading-6 text-[#65746c]">Creators cannot edit published terms, judge check-ins, seize stakes, or cancel after a participant joins.</p></aside></section>}

    {tab === "owner" && <section className={shell + " py-12"}><p className="eyebrow">Owner console</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Operate the protocol,<br/>not people’s outcomes.</h1><p className="mt-5 text-sm text-[#65746c]">{owner ? (isOwner ? "Connected as contract owner · " : "Read-only unless connected as owner · ") + owner : "Loading contract authority…"}</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric title="Pools created" value={stats ? String(stats.pools_created ?? 0) : "—"} note="From this deployed contract"/><Metric title="Total joins" value={stats ? String(stats.joins ?? 0) : "—"} note="Finalized participant entries"/><Metric title="Fees accrued" value={stats ? formatGen(String(stats.fees_accrued_wei ?? 0)) + " GEN" : "—"} note="Applied to forfeited stakes only"/><Metric title="Payouts emitted" value={stats ? String(stats.payouts_emitted ?? 0) : "—"} note="Delivery must be checked separately"/></div><div className="mt-7 grid gap-6 lg:grid-cols-2"><form className="surface-card p-7" onSubmit={event => {event.preventDefault(); void transact("Schedule fee", "schedule_fee_bps", [Number(new FormData(event.currentTarget).get("fee_bps"))]);}}><p className="eyebrow">Future fee schedule</p><h2 className="mt-3 text-2xl font-black">Current fee: {config ? Number(config.fee_bps)/100 + "%" : "—"}</h2><div className="mt-6"><Field title="New fee (basis points)" hint="100 basis points = 1%. Maximum 1,000 / 10%."><input name="fee_bps" type="number" min="0" max="1000" required defaultValue="500" disabled={!isOwner}/></Field></div><button className="primary-button mt-5" disabled={disabled || !isOwner}>Schedule with 24h delay</button><p className="mt-5 text-sm text-[#65746c]">{pendingFeeAt ? "Scheduled: " + Number(config?.pending_fee_bps)/100 + "% · can apply after " + date(pendingFeeAt) : "No fee change is scheduled."}</p><button className="secondary-button mt-4" type="button" disabled={disabled || !wallet || !pendingFeeAt || now < pendingFeeAt} onClick={() => void transact("Apply scheduled fee", "apply_scheduled_fee")}>Apply matured change</button><p className="mt-3 text-xs text-[#718078]">Anyone may apply a matured fee. Existing pools retain their original fee.</p></form><article className="rounded-[28px] bg-[#173c2d] p-7 text-white"><p className="text-xs uppercase tracking-widest text-[#b9c8bf]">Bounded authority</p><h2 className="mt-3 text-3xl font-black">The owner cannot choose who wins.</h2><ul className="mt-6 space-y-4 text-sm leading-7 text-[#bdccc3]"><li>Fees are snapshotted when each pool is created.</li><li>Proof verdicts, participation, and immutable terms are not owner-editable.</li><li>Settlement conserves the pool’s accounted stake across participants and fees.</li><li>Network status, payout delivery monitoring, and operational alerts remain separate concerns.</li></ul></article></div></section>}
    <footer className="border-t border-[#173c2d]/10"><div className={shell + " flex flex-wrap justify-between gap-3 py-8 text-xs text-[#718078]"}><p>Commitment Pools · independent GenLayer product</p><p>Studionet sandbox · test funds only · evidence is public</p></div></footer>
  </main>;
}
