import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("a aplicação preserva as regras essenciais do produto", async () => {
  const [app, db, manifest] = await Promise.all([
    readFile(
      new URL("../src/components/MedidasApp.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../src/database/local/db.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../public/manifest.webmanifest", import.meta.url),
      "utf8",
    ),
  ]);
  assert.match(app, /Foto original salva neste dispositivo/);
  assert.match(app, /Nenhuma medida foi estimada/i);
  assert.match(app, /Somente a versão publicada/);
  assert.match(db, /medidas-finais/);
  assert.equal(JSON.parse(manifest).display, "standalone");
});

test("coordenadas de marcações são proporcionais", async () => {
  const [geometry, app] = await Promise.all([
    readFile(
      new URL("../src/features/annotations/geometry.ts", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../src/components/MedidasApp.tsx", import.meta.url),
      "utf8",
    ),
  ]);
  assert.match(geometry, /clientX\s*-\s*rect\.left/);
  assert.match(geometry, /point\.x\s*\*\s*width/);
  assert.match(app, /p1\.x\s*\*\s*100/);
});

test("exportação usa a foto original e omite elementos ocultos", async () => {
  const exporter = await readFile(
    new URL("../src/features/photos/export-png.ts", import.meta.url),
    "utf8",
  );
  assert.match(exporter, /createImageBitmap\(photo\.blob\)/);
  assert.match(exporter, /state\s*!==\s*"hidden"/);
  assert.match(exporter, /image\/png/);
});

test("navegação e seleção operacional possuem ações reais", async () => {
  const app = await readFile(
    new URL("../src/components/MedidasApp.tsx", import.meta.url),
    "utf8",
  );
  assert.match(app, /onClick=\{\(\) => setSection\("dashboard"\)\}/);
  assert.match(app, /onClick=\{\(\) => setSection\("portal"\)\}/);
  assert.match(app, /onClick=\{\(\) => setSection\("settings"\)\}/);
  assert.match(app, /onClick=\{\(\) => open\(p\.id\)\}/);
  assert.match(app, /selectEnvironment=\{setSelectedEnvironmentId\}/);
  assert.match(app, /selectProject=\{setSelectedProjectId\}/);
  assert.doesNotMatch(app, /function FloorPlanLegacy/);
});

test("medidas e textos possuem posicionamento manual independente", async () => {
  const [app, models, exporter] = await Promise.all([
    readFile(new URL("../src/components/MedidasApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/types/models.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/features/photos/export-png.ts", import.meta.url), "utf8"),
  ]);
  assert.match(models, /labelPoint\?: Point/);
  assert.match(models, /interface FloorPlanText/);
  assert.match(app, /Mover ponto inicial/);
  assert.match(app, /Mover ponto final/);
  assert.match(app, /Digite o texto que ficará na planta/);
  assert.match(exporter, /a\.labelPoint \|\|/);
});
