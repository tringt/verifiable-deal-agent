import { createHash } from "node:crypto";

export type Decision = "ALERT" | "CHECK" | "REJECT";

export interface DealEvidence {
  version: "1";
  observedAt: string;
  offer: {
    source: "ozon" | "wildberries" | "yandex_market";
    url: string;
    title: string;
    priceRub: number;
    inStock: boolean;
    checkedAt: string;
    kit: string;
  };
  decision: {
    status: Decision;
    reasons: string[];
  };
}

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function createEvidenceTrace(evidence: DealEvidence) {
  const canonical = canonicalize(evidence);
  return {
    evidence,
    sha256: createHash("sha256").update(canonical).digest("hex"),
    createdAt: new Date().toISOString()
  };
}
