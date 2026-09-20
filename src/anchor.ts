import type { NftMetadata } from "@unicitylabs/sphere-sdk";
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

export function getNodeProviderConfig() {
  return {
    dataDir: ".sphere-agent",
    network: "testnet2" as const,
    oracle: { apiKey: "sk_ddc3cfcc001e4a28ac3fad7407f99590" },
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
