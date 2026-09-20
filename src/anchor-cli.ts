import { readFile, writeFile } from "node:fs/promises";
import { Sphere } from "@unicitylabs/sphere-sdk";
import { createNodeProviders, createWalletApiProviders } from "@unicitylabs/sphere-sdk/impl/nodejs";
import { buildAnchorMetadata, getNodeProviderConfig, getTestnetWalletConfig, parseAnchorCommand, validateTraceForAnchor, type EvidenceTrace } from "./anchor.js";

const { tracePath, publish } = parseAnchorCommand(process.argv.slice(2));
const trace = validateTraceForAnchor(JSON.parse(await readFile(tracePath, "utf8")) as EvidenceTrace);

const providers = createNodeProviders(getNodeProviderConfig());
console.error("anchor:init");
const { sphere } = await Sphere.init({
  ...createWalletApiProviders(providers, getTestnetWalletConfig()),
  autoGenerate: false,
  network: "testnet2"
});
console.error("anchor:ready");

if (!sphere.identity?.directAddress) {
  throw new Error("Sphere identity has no DIRECT address");
}

const metadata = buildAnchorMetadata({
  sha256: trace.sha256,
  tracePath,
  directAddress: sphere.identity.directAddress
});

if (!publish) {
  console.log(JSON.stringify({ network: "testnet2", publish: false, metadata }, null, 2));
  await sphere.destroy();
  process.exit(0);
}

console.error("anchor:mint-request");
const result = await sphere.payments.mintNft({ content: metadata, sign: true });
console.error("anchor:mint-result");
if (!result.success || !result.tokenId) {
  throw new Error(`Testnet anchor mint failed: ${result.error ?? "unknown error"}`);
}

const receipt = {
  network: "testnet2",
  traceSha256: trace.sha256,
  tokenId: result.tokenId,
  issuer: sphere.identity.directAddress,
  anchoredAt: new Date().toISOString()
};
await writeFile(`${tracePath}.testnet-anchor.json`, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
console.log(JSON.stringify(receipt, null, 2));
await sphere.destroy();
