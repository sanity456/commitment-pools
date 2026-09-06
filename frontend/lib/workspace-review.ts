import type { Participant, Pool } from "./lifecycle.ts";

export function workspaceIdentity(
  session: {
    wallet: string;
    coreAddress: string;
    captureAddress: string;
    chainId: number;
  } | null,
) {
  return session
    ? [
        session.chainId,
        session.coreAddress,
        session.captureAddress,
        session.wallet,
      ]
        .join("|")
        .toLowerCase()
    : "signed-out";
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}

// Consent follows recorded terms and participant progress, not refreshes or local time.
export function poolReviewKey(
  pool: Pool | undefined,
  participant: Participant | null,
) {
  return pool ? JSON.stringify(canonical({ pool, participant })) : "";
}

export function detailIsFresh(
  detail: { key: string; revision: number } | null,
  poolId: string,
  revision: number,
  error: string,
) {
  return Boolean(
    detail && detail.key === poolId && detail.revision === revision && !error,
  );
}
