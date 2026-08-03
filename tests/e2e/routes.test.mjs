import assert from "node:assert/strict";
import test from "node:test";
async function request(path) {
  const workerUrl = new URL("../../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}
for (const path of [
  "/",
  "/clientes",
  "/projetos",
  "/acesso",
  "/p/token-seguro",
]) {
  test(`rota ${path} responde sem erro`, async () => {
    const response = await request(path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") || "", /^text\/html/);
  });
}
