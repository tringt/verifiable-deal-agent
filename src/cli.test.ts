import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { writeTraceFromFile } from "./cli.js";

test("writes a trace file from valid deal evidence JSON", async () => {
  const directory = await mkdtemp(join(tmpdir(), "verifiable-deal-agent-"));
  const input = join(directory, "evidence.json");
  const output = join(directory, "trace.json");

  await writeFile(input, JSON.stringify({
    version: "1",
    observedAt: "2026-09-20T12:00:00.000Z",
    offer: {
      source: "ozon",
      url: "https://www.ozon.ru/product/example/",
      title: "Cordless router",
      priceRub: 4490,
      inStock: true,
      checkedAt: "2026-09-20T12:00:00.000Z",
      kit: "solo"
    },
    decision: { status: "CHECK", reasons: ["live_price_confirmed"] }
  }), "utf8");

  await writeTraceFromFile(input, output);
  const trace = JSON.parse(await readFile(output, "utf8"));

  assert.match(trace.sha256, /^[a-f0-9]{64}$/);
  assert.equal(trace.evidence.offer.title, "Cordless router");
  await rm(directory, { recursive: true, force: true });
});
