import assert from "node:assert/strict";
import test from "node:test";

import { buildAnchorMetadata, getNodeProviderConfig, getTestnetWalletConfig, parseAnchorCommand, validateTraceForAnchor } from "./anchor.js";
import { createEvidenceTrace } from "./evidence.js";

test("buildAnchorMetadata binds a trace hash as an immutable NFT attribute", () => {
  const metadata = buildAnchorMetadata({
    sha256: "a".repeat(64),
    tracePath: "out/deal-evidence.json",
    directAddress: "DIRECT://example"
  });

  assert.equal(metadata.kind, "metadata");
  assert.equal(metadata.name, "Verifiable Deal Trace");
  assert.equal(
    metadata.attributes.find((item) => item.trait_type === "trace_sha256")?.value,
    "a".repeat(64)
  );
  assert.equal(
    metadata.attributes.find((item) => item.trait_type === "network")?.value,
    "testnet2"
  );
});

test("buildAnchorMetadata rejects an invalid trace hash", () => {
  assert.throws(
    () => buildAnchorMetadata({ sha256: "not-a-hash", tracePath: "out/x.json", directAddress: "DIRECT://example" }),
    /64-character hexadecimal SHA-256/
  );
});

test("validateTraceForAnchor rejects a trace whose hash no longer matches evidence", () => {
  const trace = createEvidenceTrace({
    version: "1",
    observedAt: "2026-09-20T00:00:00.000Z",
    offer: {
      source: "ozon",
      url: "https://www.ozon.ru/product/demo/",
      title: "Demo router",
      priceRub: 4490,
      inStock: true,
      checkedAt: "2026-09-20T00:00:00.000Z",
      kit: "solo"
    },
    decision: { status: "CHECK", reasons: ["live_price_confirmed"] }
  });

  assert.throws(
    () => validateTraceForAnchor({ ...trace, sha256: "b".repeat(64) }),
    /does not match its evidence/
  );
});

test("parseAnchorCommand requires an explicit publish flag for testnet writes", () => {
  assert.deepEqual(parseAnchorCommand(["out/deal-evidence.json"]), {
    tracePath: "out/deal-evidence.json",
    publish: false
  });
  assert.deepEqual(parseAnchorCommand(["out/deal-evidence.json", "--publish-testnet"]), {
    tracePath: "out/deal-evidence.json",
    publish: true
  });
});

test("getTestnetWalletConfig uses one network name across Sphere and wallet-api", () => {
  assert.deepEqual(getTestnetWalletConfig(), {
    baseUrl: "https://wallet-api.unicity.network",
    network: "testnet2"
  });
});

test("node provider config matches the wallet-api testnet2 challenge network", () => {
  assert.deepEqual(getNodeProviderConfig(), {
    dataDir: ".sphere-agent",
    network: "testnet2",
    oracle: { apiKey: "sk_ddc3cfcc001e4a28ac3fad7407f99590" },
    transport: { timeout: 10_000 }
  });
});
