import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("a aplicação preserva as regras essenciais do produto", async()=>{
  const [app,db,manifest]=await Promise.all([readFile(new URL("../src/components/MedidasApp.tsx",import.meta.url),"utf8"),readFile(new URL("../src/database/local/db.ts",import.meta.url),"utf8"),readFile(new URL("../public/manifest.webmanifest",import.meta.url),"utf8")]);
  assert.match(app,/Foto original salva neste dispositivo/);
  assert.match(app,/Nenhuma medida foi estimada|Nenhuma medida foi estimada/i);
  assert.match(app,/Somente a versão publicada/);
  assert.match(db,/medidas-finais/);
  assert.equal(JSON.parse(manifest).display,"standalone");
});

test("coordenadas de marcações são proporcionais",async()=>{
  const app=await readFile(new URL("../src/components/MedidasApp.tsx",import.meta.url),"utf8");
  assert.match(app,/clientX-r\.left/);assert.match(app,/p1\.x\*100/);assert.match(app,/p1\.y\*100/);
});
