# Verifiable Deal Agent

Read-only marketplace deal analysis with tamper-evident evidence traces.

For every `ALERT`, `CHECK`, or `REJECT` decision, the agent stores the offer
evidence and a deterministic SHA-256 hash. The hash lets a reviewer verify that
the recorded decision inputs were not changed after a trace was created.

> **Status:** local MVP. It does not buy goods, send alerts, or use real funds.

## What the MVP proves

- A marketplace offer can be represented as structured evidence: source, URL,
  checked price, availability, kit, decision, and reasons.
- Object-key ordering does not change the generated evidence hash.
- A JSON trace can be produced locally for inspection or later anchoring to
  Unicity Sphere testnet.

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

`npm run demo` writes a sample trace to `out/deal-evidence.json`.

For a fixed, publicly reproducible example, see the [demo proof trace](docs/DEMO.md).

## Create a trace from deal evidence

Export a verified offer decision as JSON, then create its local trace:

```powershell
npm run trace -- path\to\evidence.json out\trace.json
```

The input follows the schema in `src/evidence.ts`: source, URL, title, live
price, availability, kit, decision status, and reason codes.

## Trace format

The generated JSON contains:

- `evidence` — observed offer and decision inputs;
- `sha256` — deterministic SHA-256 of canonicalized evidence;
- `createdAt` — local trace creation time.

## Safety boundaries

- No automatic purchases or trading.
- No marketplace credentials, session cookies, or private keys in this repo.
- A local Sphere **testnet2** identity is generated under `.sphere-agent/` and
  is excluded from Git.
- `npm run anchor -- <trace.json> --publish-testnet` anchors a trace as a
  coinless testnet NFT. Settlement and payments are intentionally not wired in.

## Next milestone

Connect the trace CLI to a read-only marketplace decision feed and verify each
anchored token against its local receipt without handling real funds.
