import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

const root = process.cwd();
const output = resolve(root, ".vercel", "output");
if (!output.startsWith(`${resolve(root, ".vercel")}${sep}`))
  throw new Error("Diretório de saída inválido");

await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, "static"), { recursive: true });
await cp(resolve(root, "dist", "client"), resolve(output, "static"), {
  recursive: true,
});

const functionRoot = resolve(output, "functions", "index.func");
await mkdir(functionRoot, { recursive: true });
await cp(resolve(root, "dist", "server"), resolve(functionRoot, "server"), {
  recursive: true,
});
await writeFile(
  resolve(functionRoot, "package.json"),
  JSON.stringify({ type: "module" }),
);
await writeFile(
  resolve(functionRoot, ".vc-config.json"),
  JSON.stringify({ runtime: "nodejs22.x", handler: "index.mjs", launcherType: "Nodejs" }),
);
await writeFile(
  resolve(functionRoot, "index.mjs"),
  `import worker from "./server/index.js";
export default async function handler(req, res) {
  const origin = "https://" + (req.headers.host || "localhost");
  const url = new URL(req.url || "/", origin);
  const method = req.method || "GET";
  const chunks = [];
  if (method !== "GET" && method !== "HEAD") {
    for await (const chunk of req) chunks.push(chunk);
  }
  const request = new Request(url, {
    method,
    headers: req.headers,
    body: chunks.length ? Buffer.concat(chunks) : undefined,
    duplex: chunks.length ? "half" : undefined,
  });
  const response = await worker.fetch(
    request,
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}
`,
);
await writeFile(
  resolve(output, "config.json"),
  JSON.stringify({
    version: 3,
    routes: [{ handle: "filesystem" }, { src: "/(.*)", dest: "/index" }],
  }),
);
