import { readFile, writeFile } from "node:fs/promises";

import { createEvidenceTrace, type DealEvidence } from "./evidence.js";

function assertDealEvidence(value: unknown): asserts value is DealEvidence {
  if (!value || typeof value !== "object") throw new Error("Evidence must be a JSON object");
  const evidence = value as Partial<DealEvidence>;
  if (evidence.version !== "1") throw new Error("Evidence version must be \"1\"");
  if (!evidence.offer?.url || !evidence.offer.title || !Number.isFinite(evidence.offer.priceRub)) {
    throw new Error("Evidence offer requires url, title, and numeric priceRub");
  }
  if (!evidence.decision?.status || !Array.isArray(evidence.decision.reasons)) {
    throw new Error("Evidence decision requires status and reasons");
  }
}

export async function writeTraceFromFile(inputPath: string, outputPath: string) {
  const evidence: unknown = JSON.parse(await readFile(inputPath, "utf8"));
  assertDealEvidence(evidence);
  const trace = createEvidenceTrace(evidence);
  await writeFile(outputPath, `${JSON.stringify(trace, null, 2)}\n`, "utf8");
  return trace;
}

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath) {
    throw new Error("Usage: npm run trace -- <evidence.json> <trace.json>");
  }
  const trace = await writeTraceFromFile(inputPath, outputPath);
  console.log(`Trace created: ${trace.sha256}`);
  console.log(`File: ${outputPath}`);
}

if (process.argv[1]?.endsWith("cli.ts") || process.argv[1]?.endsWith("cli.js")) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
