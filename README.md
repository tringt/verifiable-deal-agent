# Verifiable Deal Agent

Read-only marketplace deal analysis with tamper-evident evidence traces.

For every `ALERT`, `CHECK`, or `REJECT` decision, the agent stores structured
offer evidence and creates a deterministic SHA-256 hash. A reviewer can verify
that the decision inputs were not changed after the trace was created.

> **Status:** testnet MVP. It does not buy goods, send marketplace alerts, or
> handle real funds.

## What it demonstrates

- Structured evidence: source, URL, live price, availability, kit, decision,
  and reason codes.
- Deterministic hashing: object-key ordering does not change the evidence hash.
- Local trace generation for inspection.
- Optional, coinless Unicity `testnet2` NFT anchoring with the trace hash in
  metadata.
- A local pending journal that blocks duplicate anchor attempts until the prior
  outcome is reconciled.

## Prerequisites

- Node.js 20 or newer
- npm

## Install and run

```powershell
npm install
npm test
npm run build
npm run demo
Get-Content out\deal-evidence.json
```

`npm run demo` writes a sample trace to `out/deal-evidence.json`. A fixed,
publicly reproducible example is in [docs/DEMO.md](docs/DEMO.md).

## Create a trace from real evidence

Export a verified deal decision as JSON, then create its local trace:

```powershell
npm run trace -- path\to\evidence.json out\trace.json
```

The input schema is defined in `src/evidence.ts`. It contains the marketplace,
URL, live price, availability, kit, decision status, and reason codes.

## Optional testnet proof anchor

Anchoring is opt-in and uses **Unicity testnet2 only**. It creates a coinless
testnet NFT; it is not a payment and does not use real funds.

1. Obtain the current public testnet oracle key from the official Sphere SDK
   documentation and store it locally. Never commit a populated `.env` file.
2. Create a trace.
3. Run a dry run, then publish only when the metadata looks correct.

```powershell
$env:UNICITY_TESTNET_ORACLE_API_KEY = "<public-testnet-key>"
npm run anchor -- out\deal-evidence.json
npm run anchor -- out\deal-evidence.json --publish-testnet
```

Before publishing, the CLI creates `<trace>.testnet-anchor.pending.json`. A
second publish is blocked while that attempt remains unconfirmed. On success it
writes a receipt with the testnet token ID instead of minting a duplicate.

## Safety boundaries

- No automatic purchases, trading, or financial advice.
- No marketplace credentials, session cookies, or private keys in this repo.
- The local Sphere testnet identity is stored under `.sphere-agent/`, which is
  excluded from Git.
- Testnet settlement and payments are intentionally out of scope.

## Next milestone

Connect the trace CLI to a read-only marketplace decision feed and verify each
anchored token against its local receipt.
