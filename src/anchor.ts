import type { NftMetadata } from "@unicitylabs/sphere-sdk";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { createEvidenceTrace, type DealEvidence } from "./evidence.js";

export interface AnchorMetadataInput {
  sha256: string;
  tracePath: string;
  directAddress: string;
}

export interface EvidenceTrace {
  evidence: DealEvidence;
  sha256: string;
  createdAt: string;
}

export interface PendingAnchor {
  network: "testnet2";
  traceSha256: string;
  issuer: string;
}

export interface AnchorReceipt extends PendingAnchor {
  tokenId: string;
  anchoredAt: string;
}

function receiptPath(tracePath: string): string {
  return `${tracePath}.testnet-anchor.json`;
}

function pendingPath(tracePath: string): string {
  return `${tracePath}.testnet-anchor.pending.json`;
}

export async function readAnchorReceipt(tracePath: string, sha256: string): Promise<AnchorReceipt | undefined> {
  try {
    const receipt = JSON.parse(await readFile(receiptPath(tracePath), "utf8")) as AnchorReceipt;
    if (receipt.traceSha256 !== sha256) {
      throw new Error("Existing anchor receipt belongs to a different trace");
    }
    return receipt;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

export async function createPendingAnchor(tracePath: string, pending: PendingAnchor): Promise<void> {
  try {
    await writeFile(pendingPath(tracePath), `${JSON.stringify(pending, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error("An unconfirmed anchor attempt already exists; reconcile it before retrying");
    }
    throw error;
  }
}

export async function finalizeAnchorReceipt(tracePath: string, receipt: AnchorReceipt): Promise<void> {
  await writeFile(receiptPath(tracePath), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  await unlink(pendingPath(tracePath));
}

export function parseAnchorCommand(args: string[]): { tracePath: string; publish: boolean } {
  const [tracePath, ...flags] = args;
  if (!tracePath || flags.some((flag) => flag !== "--publish-testnet")) {
    throw new Error("Usage: npm run anchor -- <trace.json> [--publish-testnet]");
  }

  return { tracePath, publish: flags.includes("--publish-testnet") };
}

export function getTestnetWalletConfig() {
  return {
    baseUrl: "https://wallet-api.unicity.network",
    network: "testnet2" as const
  };
}

export function getNodeProviderConfig(env: NodeJS.ProcessEnv = process.env) {
  const apiKey = env.UNICITY_TESTNET_ORACLE_API_KEY;
  if (!apiKey) {
    throw new Error("UNICITY_TESTNET_ORACLE_API_KEY is required for testnet anchoring");
  }

  return {
    dataDir: ".sphere-agent",
    network: "testnet2" as const,
    oracle: { apiKey },
    transport: { timeout: 10_000 }
  };
}

export function validateTraceForAnchor(trace: EvidenceTrace): EvidenceTrace {
  const expected = createEvidenceTrace(trace.evidence).sha256;
  if (trace.sha256 !== expected) {
    throw new Error("Trace SHA-256 does not match its evidence");
  }
  return trace;
}

export function buildAnchorMetadata(input: AnchorMetadataInput): NftMetadata {
  if (!/^[a-f0-9]{64}$/i.test(input.sha256)) {
    throw new Error("Expected a 64-character hexadecimal SHA-256 hash");
  }

  return {
    kind: "metadata",
    name: "Verifiable Deal Trace",
    description: "Testnet proof anchor for an immutable marketplace-decision evidence hash.",
    image: null,
    animation_url: null,
    external_url: null,
    attributes: [
      { trait_type: "trace_sha256", value: input.sha256.toLowerCase() },
      { trait_type: "trace_path", value: input.tracePath },
      { trait_type: "issuer", value: input.directAddress },
      { trait_type: "network", value: "testnet2" },
      { trait_type: "purpose", value: "marketplace-deal-evidence" }
    ],
    collection: "Verifiable Deal Agent",
    collection_id: null
  };
}
