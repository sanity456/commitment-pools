type CreditSnapshot = {
  wallet: string;
  session: { signedIn: boolean; wallet: string } | null;
  ready: boolean;
  busy: string;
  credit: string | null;
  creditError: string;
};

// Credit is wallet-wide, not a receipt or an allocation from a particular pool.
export function freshWalletCredit(snapshot: CreditSnapshot): string | null {
  if (
    !snapshot.ready ||
    snapshot.busy ||
    snapshot.creditError ||
    !snapshot.wallet ||
    !snapshot.session?.signedIn ||
    snapshot.wallet.toLowerCase() !== snapshot.session.wallet.toLowerCase() ||
    snapshot.credit === null ||
    !/^(0|[1-9]\d*)$/.test(snapshot.credit)
  )
    return null;
  return snapshot.credit;
}
