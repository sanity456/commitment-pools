# Commitment Pools v2 Architecture

## Product boundary

Commitment Pools is a group accountability product. GenLayer is used only for the subjective state transition that needs validator consensus: deciding whether a submitted check-in satisfies the pool's immutable verification policy.

- **Frontend/indexer owns:** discovery, wallet UX, human-readable GEN amounts, notifications, cached lists, transaction status, and non-authoritative previews.
- **Contract owns:** immutable pool terms, participant stakes, scheduled rounds, attempt history, consensus verdicts, settlement arithmetic, refundable credits, and fee snapshots.
- **External evidence owns:** raw public evidence. Source-verified pools require validators to independently fetch the same URL and match its declared normalized content digest.

## State flow

`forming -> active -> settled`

If the minimum cohort is not reached:

`forming -> refunding -> cancelled`

If nobody activates the pool before the first complete round elapses:

`forming -> refunding -> cancelled`

Formation can never be shortened by an early settlement. Activity starts only after the advertised join deadline. Every round has a deterministic opening and closing timestamp, and keeper inactivity cannot turn an elapsed first round into an automatic participant loss.

## Actors

- **Protocol owner:** schedules future fee changes; cannot change a funded pool's fee or settlement policy.
- **Pool creator:** defines bounded terms and may cancel only before anyone joins.
- **Participant:** joins with the exact stake, submits scheduled evidence, claims refunds/settlement credit, and emits a withdrawal to their own address.
- **Keeper:** any address may activate or settle eligible pools.

## Safety invariants

1. A pool snapshots its fee and fee recipient before the first stake.
2. Formation cannot end before `join_deadline`.
3. A participant can pass at most one scheduled round per round window.
4. Every attempt is append-only; `unclear` retries never overwrite history.
5. Every stake is credited exactly once to a refund, winner, all-fail refund, or protocol fee/distribution.
6. Settlement uses integer base units and conserves the recorded stakes.
7. “Transfer emitted” is not represented as confirmed payment.
8. A missed activation grace period refunds participants rather than forcing stale missed rounds.

## Verification modes

- `self_attested`: the model judges only the participant statement. The UI must label this as motivational rather than independently verified.
- `source_verified`: the model receives the statement and independently fetched public evidence; validators must agree on the source digest and verdict.

High-value pools should use `source_verified` or a later signed-attestation adapter.
