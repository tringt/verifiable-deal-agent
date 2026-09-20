import { mkdir, writeFile } from "node:fs/promises";

import { createEvidenceTrace, type DealEvidence } from "./evidence.js";

const checkedAt = new Date().toISOString();
const evidence: DealEvidence = {
  version: "1",
  observedAt: checkedAt,
  offer: {
    source: "ozon",
    url: "https://www.ozon.ru/product/demo/",
    title: "Демо: аккумуляторный кромочный фрезер",
    priceRub: 4490,
    inStock: true,
    checkedAt,
    kit: "solo / без аккумулятора"
  },
  decision: {
    status: "CHECK",
    reasons: ["live_price_confirmed", "in_stock", "kit_identified", "insufficient_price_history"]
  }
};

const trace = createEvidenceTrace(evidence);
await mkdir("out", { recursive: true });
await writeFile("out/deal-evidence.json", `${JSON.stringify(trace, null, 2)}\n`, "utf8");
console.log(`Trace created: ${trace.sha256}`);
console.log("File: out/deal-evidence.json");
