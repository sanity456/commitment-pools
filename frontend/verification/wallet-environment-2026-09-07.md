# Commitment Pools — wallet environment screenshots

Status: **current browser and wallet versions documented from owner-supplied screenshots on September 7, 2026**. This is a post-test environment record, not a new wallet test or proof of the versions used for every earlier transaction.

## Observed versions

- Chrome's earlier About screenshot shows **152.0.7977.76**, Official Build, 64-bit, with an update awaiting relaunch.
- Chrome's subsequent About screenshot shows **152.0.7977.83**, Official Build, 64-bit, and reports that Chrome is up to date.
- MetaMask's About screenshot shows **13.46.1**.

These values were read visually from the images supplied by the owner in this task. The earlier automated access restriction was not bypassed. No browser settings, extension settings, wallet accounts or transactions were changed to collect this record.

## Original artifacts

The originals remain in the owner's local screenshot directory. Identical, unedited copies are now included in this private release-evidence bundle. Their SHA-256 hashes and byte lengths were checked against the supplied files.

1. [Chrome before relaunch](environment/chrome-before-update.png)
   - Bytes: `35948`
   - SHA-256: `dad4ae66951292e726f2a4739bf5d2bb9bbbb78e6dbca2f68855ca6e924c79c5`
2. [Chrome after update](environment/chrome-after-update.png)
   - Bytes: `76825`
   - SHA-256: `7414ed70d5d4bd9022d42c6d2674c51f1b3b1c007c60a0de2a0923c1db64379b`
3. [MetaMask About](environment/metamask-about.png)
   - Bytes: `47217`
   - SHA-256: `c24a652825c546331093ecafcb0d7868f4ba5d1c1499d19e72e214601f697440`

## Scope and limits

The request for current version numbers is now satisfied. The previous release and lifecycle records accurately describe what had been collected at their respective checkpoints; their historical gaps are not silently rewritten.

The screenshots were supplied after the recorded wallet lifecycle, and the Chrome images show a version change. Therefore, Chrome 152.0.7977.83 is not retroactively assigned to the earlier wallet transactions. Nor is a complete earlier Chrome/MetaMask version pairing established solely by these later screenshots. Record the actual versions again at the start of any remaining human acceptance run.

Screenshot filenames are source labels, not independently verified capture times, test start times or chain timestamps. Existing contract timing evidence continues to use the stored chain timestamps. No full lifecycle, new-origin sign-in, consent transition, contract suite or public CI was rerun for this documentation update.

The initial documentation checkpoint retained only local paths and hashes. The release-evidence packaging now includes the unchanged screenshots and repository-relative links; CI verifies their exact bytes. This does not make the private repository public. Signed-out reviewer access must still be checked after the owner approves GitHub publication.
