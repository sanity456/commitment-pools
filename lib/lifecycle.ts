export type Pool = {
  id: string; title: string; description: string; rules: string; creator: string;
  verification_mode: string; stake_wei: string; rounds_required: number;
  min_players: number; max_players: number; participant_count: number;
  status: string; join_deadline: number; activity_starts_at: number;
  activity_ends_at: number; round_window_seconds: number; fee_bps: number;
  terms_hash: string; fee_recipient: string; activation_failure: string;
  winner_count: number; loser_count: number; fee_wei: string;
};
export type Participant = {
  address: string; status: string; rounds_passed: number; stake_wei: string;
  refund_claimed: boolean; settlement_credit_wei: string; last_attempt_id: string;
};
export function record(value: unknown): Record<string, unknown> {
  if (value instanceof Map) return Object.fromEntries(value);
  return (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
}
export function normalizePool(value: unknown): Pool {
  const p = record(value);
  return {
    id: String(p.id ?? ""), title: String(p.title ?? ""), description: String(p.description ?? ""),
    rules: String(p.rules ?? ""), creator: String(p.creator ?? ""),
    verification_mode: String(p.verification_mode ?? "self_attested"), stake_wei: String(p.stake_wei ?? "0"),
    rounds_required: Number(p.rounds_required ?? 0), min_players: Number(p.min_players ?? 0),
    max_players: Number(p.max_players ?? 0), participant_count: Number(p.participant_count ?? 0),
    status: String(p.status ?? ""), join_deadline: Number(p.join_deadline ?? 0),
    activity_starts_at: Number(p.activity_starts_at ?? 0), activity_ends_at: Number(p.activity_ends_at ?? 0),
    round_window_seconds: Number(p.round_window_seconds ?? 0), fee_bps: Number(p.fee_bps ?? 0),
    terms_hash: String(p.terms_hash ?? ""), fee_recipient: String(p.fee_recipient ?? ""),
    activation_failure: String(p.activation_failure ?? ""), winner_count: Number(p.winner_count ?? 0),
    loser_count: Number(p.loser_count ?? 0), fee_wei: String(p.fee_wei ?? "0"),
  };
}
export function normalizeParticipant(value: unknown): Participant {
  const p = record(value);
  return { address: String(p.address ?? ""), status: String(p.status ?? ""), rounds_passed: Number(p.rounds_passed ?? 0),
    stake_wei: String(p.stake_wei ?? "0"), refund_claimed: Boolean(p.refund_claimed),
    settlement_credit_wei: String(p.settlement_credit_wei ?? "0"), last_attempt_id: String(p.last_attempt_id ?? "") };
}
export function roundState(pool: Pool, participant: Participant | null, now: number) {
  const number = (participant?.rounds_passed ?? 0) + 1;
  const opensAt = pool.activity_starts_at + (number - 1) * pool.round_window_seconds;
  const closesAt = opensAt + pool.round_window_seconds;
  const parts = participant?.last_attempt_id.split(":") ?? [];
  const attemptedRound = Number(parts.at(-2) ?? 0);
  const attempts = attemptedRound === number ? Number(parts.at(-1) ?? 0) : 0;
  return { number, opensAt, closesAt, attempts,
    open: pool.status === "active" && participant?.status === "active" && number <= pool.rounds_required
      && now >= opensAt && now < closesAt && attempts < 3 };
}
export function poolActions(pool: Pool, participant: Participant | null, wallet: string, now: number, canSettle: boolean) {
  const connected = Boolean(wallet);
  const forming = pool.status === "forming";
  return {
    join: connected && forming && now < pool.join_deadline && !participant && pool.participant_count < pool.max_players,
    activate: connected && forming && now >= pool.join_deadline,
    cancel: connected && forming && pool.participant_count === 0 && wallet.toLowerCase() === pool.creator.toLowerCase(),
    refund: connected && pool.status === "refunding" && Boolean(participant) && !participant?.refund_claimed,
    submit: connected && roundState(pool, participant, now).open,
    settle: connected && pool.status === "active" && canSettle,
  };
}
