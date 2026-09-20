import assert from "node:assert/strict";
import test from "node:test";

import { createEvidenceTrace, type DealEvidence } from "./evidence.js";

const evidence: DealEvidence = {
  version: "1",
  observedAt: "2026-09-20T12:00:00.000Z",
  offer: {
    source: "ozon",
    url: "https://www.ozon.ru/product/example/",
    title: "Аккумуляторный кромочный фрезер",
    priceRub: 4490,
    inStock: true,
    checkedAt: "2026-09-20T12:00:00.000Z",
    kit: "solo / без аккумулятора"
  },
  decision: {
    status: "CHECK",
    reasons: ["live_price_confirmed", "in_stock", "insufficient_price_history"]
  }
};

test("creates the same SHA-256 regardless of object key order", () => {
  const reordered = {
    decision: evidence.decision,
    offer: evidence.offer,
    observedAt: evidence.observedAt,
    version: evidence.version
  } as DealEvidence;

  const originalTrace = createEvidenceTrace(evidence);
  const reorderedTrace = createEvidenceTrace(reordered);

  assert.match(originalTrace.sha256, /^[a-f0-9]{64}$/);
  assert.equal(originalTrace.sha256, reorderedTrace.sha256);
});
