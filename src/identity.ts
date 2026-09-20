import { Sphere } from "@unicitylabs/sphere-sdk";
import { createNodeProviders } from "@unicitylabs/sphere-sdk/impl/nodejs";

const dataDir = ".sphere-agent";

const providers = createNodeProviders({
  dataDir,
  network: "testnet",
  transport: { timeout: 5_000 }
});

const { created, sphere } = await Sphere.init({
  ...providers,
  autoGenerate: true,
  network: "testnet",
  walletApi: "none"
});

const identity = sphere.identity;

if (!identity?.chainPubkey) {
  throw new Error("Sphere did not return a public identity");
}

console.log(JSON.stringify({
  created,
  network: "testnet",
  chainPubkey: identity.chainPubkey,
  directAddress: identity.directAddress ?? null,
  storage: dataDir
}, null, 2));

// The SDK may retain a relay reconnect timer even after local initialization.
// This CLI performs no payment or publish operation, so ending the process here
// is safe and keeps one-shot initialization from hanging.
void sphere.destroy();
process.exit(0);
