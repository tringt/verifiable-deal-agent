import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  buildAnchorMetadata,
  createPendingAnchor,
  finalizeAnchorReceipt,
  getNodeProviderConfig,
  getTestnetWalletConfig,
  readAnchorReceipt,
  parseAnchorCommand,
  validateTraceForAnchor
} from "./anchor.js";
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

test("node provider config requires a locally supplied testnet oracle key", () => {
  assert.throws(
    () => getNodeProviderConfig({}),
    /UNICITY_TESTNET_ORACLE_API_KEY/
  );

  assert.deepEqual(getNodeProviderConfig({ UNICITY_TESTNET_ORACLE_API_KEY: "test-key" }), {
    dataDir: ".sphere-agent",
    network: "testnet2",
    oracle: { apiKey: "test-key" },
    transport: { timeout: 10_000 }
  });
});

test("pending anchor blocks a duplicate publish until the original outcome is confirmed", async () => {
  const directory = await mkdtemp(join(tmpdir(), "verifiable-deal-agent-"));
  const tracePath = join(directory, "trace.json");
  const sha256 = "c".repeat(64);

  try {
    await createPendingAnchor(tracePath, { network: "testnet2", traceSha256: sha256, issuer: "DIRECT://example" });

    await assert.rejects(
      () => createPendingAnchor(tracePath, { network: "testnet2", traceSha256: sha256, issuer: "DIRECT://example" }),
      /unconfirmed anchor attempt/
    );

    await finalizeAnchorReceipt(tracePath, {
      network: "testnet2",
      traceSha256: sha256,
      tokenId: "token-123",
      issuer: "DIRECT://example",
      anchoredAt: "2026-09-21T00:00:00.000Z"
    });

    assert.deepEqual(await readAnchorReceipt(tracePath, sha256), {
      network: "testnet2",
      traceSha256: sha256,
      tokenId: "token-123",
      issuer: "DIRECT://example",
      anchoredAt: "2026-09-21T00:00:00.000Z"
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
