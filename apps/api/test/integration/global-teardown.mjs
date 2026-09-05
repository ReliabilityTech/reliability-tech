export default async function globalTeardown() {
  const container = globalThis.__ARBORA_PG_CONTAINER__;
  if (container) await container.stop();
}
