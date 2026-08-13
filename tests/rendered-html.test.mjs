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
  assert.match(app, /geometry\.start\.x\s*\*\s*1000/);
  assert.match(app, /vectorEffect="non-scaling-stroke"/);
  assert.doesNotMatch(app, /function photoLineStyle/);
  assert.match(app, /p = normalizePointer\(e\.clientX, e\.clientY, r\)/);
  assert.match(app, /photo\.width <= photo\.height/);
  assert.match(app, /height: "88%"/);
  assert.match(app, /width: "auto"/);
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
  assert.match(app, /selectEnvironment=\{selectEditorEnvironment\}/);
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
  assert.match(models, /descriptionPoint\?: Point/);
  assert.match(models, /interface FloorPlanText/);
  assert.doesNotMatch(app, /Mover ponto inicial|Mover ponto final/);
  assert.match(app, /startDrag\("label"\)/);
  assert.match(app, /startDrag\("description"\)/);
  assert.match(app, /Digite o texto que ficará na planta/);
  assert.match(exporter, /a\.labelPoint \|\|/);
});

test("cadastro de cliente e projeto usa um fluxo único", async () => {
  const app = await readFile(
    new URL("../src/components/MedidasApp.tsx", import.meta.url),
    "utf8",
  );
  assert.match(app, /Cadastro único do levantamento/);
  assert.match(app, /Responsável/);
  assert.match(app, /Ambientes que serão medidos/);
  assert.match(app, /openModal\("client-project"\)/);
});

test("editor de medidas remove a ferramenta em L e oferece desfazer", async () => {
  const [app, catalog] = await Promise.all([
    readFile(new URL("../src/components/MedidasApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/features/annotations/catalog.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(app, /\["linear", "↔ Medida"\]/);
  assert.doesNotMatch(app, /Informe a segunda medida/);
  assert.doesNotMatch(app, /Descrição da medida \(opcional\)/);
  assert.doesNotMatch(catalog, /l-shape/);
  assert.match(app, /Desfazer última ação/);
});

test("planta aceita paredes sequenciais e componentes de porta e janela", async () => {
  const [app, models] = await Promise.all([
    readFile(new URL("../src/components/MedidasApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/types/models.ts", import.meta.url), "utf8"),
  ]);
  assert.match(models, /strokes\?: Point\[\]\[\]/);
  assert.match(app, /setDrawingStroke\(true\)/);
  assert.match(app, /strokeLinecap="round"/);
  assert.match(app, /Ajustar retas e quinas/);
  assert.match(app, /Desenhar paredes/);
  assert.match(app, /sequenceStart/);
  assert.match(app, /mode === "curve"/);
  assert.match(app, /Adicionar ponto/);
  assert.match(app, /sequenceOrigin/);
  assert.match(app, /closesEnvironment/);
  assert.match(app, /Tipo da próxima porta/);
  assert.match(app, /Pivotante/);
  assert.match(app, /Embutida/);
  assert.match(app, /Sanfonada/);
  assert.match(app, /doorType === "sliding"/);
  assert.match(app, /el\.type === "window"/);
  assert.match(app, /floor-grid-large/);
  assert.match(app, /Inverter horizontalmente/);
  assert.match(app, /Inverter verticalmente/);
  assert.match(app, /Girar 90°/);
  assert.match(app, /Curvar parede selecionada/);
  assert.match(app, /Janela banheiro 40 cm/);
  assert.match(app, /Janela padrão 110 cm/);
  assert.match(app, /millimeters = isDoor/);
  assert.match(models, /flipHorizontal\?: boolean/);
  assert.match(models, /flipVertical\?: boolean/);
  assert.match(models, /shape\?: "rectangle" \| "square" \| "circle"/);
});

test("estilo escolhido passa a valer para todas as medidas das fotos", async () => {
  const app = await readFile(
    new URL("../src/components/MedidasApp.tsx", import.meta.url),
    "utf8",
  );
  assert.match(app, /applyAnnotationStyle/);
  assert.match(app, /medidas-finais-annotation-style/);
  assert.match(app, /Cor de todas/);
  assert.match(app, /Linha de todas/);
  assert.match(app, /Letra de todas/);
  assert.match(app, /window\.setTimeout\(click, 2000\)/);
  assert.match(app, /Salvar e finalizar/);
});

test("ambiente aceita vídeo sem tratá-lo como fotografia editável", async () => {
  const [app, models] = await Promise.all([
    readFile(new URL("../src/components/MedidasApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/types/models.ts", import.meta.url), "utf8"),
  ]);
  assert.match(models, /mediaType\?: "image" \| "video"/);
  assert.match(app, /video\/mp4,video\/quicktime,video\/webm/);
  assert.match(app, /Vídeos do ambiente/);
  assert.match(app, /mediaType === "video"/);
  assert.match(app, /<video/);
});

test("editor permite fotografar diretamente com a câmera traseira", async () => {
  const app = await readFile(new URL("../src/components/MedidasApp.tsx", import.meta.url), "utf8");
  assert.match(app, /capture="environment"/);
  assert.match(app, /Tirar foto/);
  assert.match(app, /Importar da galeria/);
});

test("traços não bloqueiam o início de outra medida", async () => {
  const app = await readFile(
    new URL("../src/components/MedidasApp.tsx", import.meta.url),
    "utf8",
  );
  assert.match(app, /showHandles=\{tool === "select"\}/);
  assert.match(app, /pointerEvents: "none"/);
  assert.match(app, /pointerEvents="none"/);
  assert.match(app, /selectedMeasurement && mode !== "measure"/);
  assert.match(app, /\(mode === "wall" \|\| mode === "curve" \|\| mode === "point"\) &&/);
});

test("medida mostra prévia entre os pontos e solicita o número por último", async () => {
  const app = await readFile(
    new URL("../src/components/MedidasApp.tsx", import.meta.url),
    "utf8",
  );
  assert.match(app, /Prévia da medida em criação/);
  assert.match(app, /measurementPreview/);
  assert.match(app, /measurementEnd/);
  assert.match(app, /Posicione a linha da cota longe da parede/);
  assert.match(app, /labelPoint: p/);
  assert.match(app, /dimensionX1/);
  assert.match(app, /normalX/);
  assert.match(app, /setDragPart\("label"\)/);
  assert.match(app, /Agora informe o número real da medida/);
  const promptPosition = app.indexOf("Agora informe o número real da medida");
  const measurementInsertPosition = app.indexOf("setMeasurements((items)", promptPosition);
  assert.ok(promptPosition >= 0 && measurementInsertPosition > promptPosition);
});

test("medida da foto usa dois pontos e posicionamento da cota como a planta", async () => {
  const app = await readFile(
    new URL("../src/components/MedidasApp.tsx", import.meta.url),
    "utf8",
  );
  assert.match(app, /requiredPoints = config\.points/);
  assert.doesNotMatch(app, /Agora posicione a linha da medida/);
  assert.match(app, /x: \(points\[0\]\.x \+ points\[1\]\.x\) \/ 2/);
  assert.match(app, /function photoDimensionGeometry/);
  assert.match(app, /geometry\.lineStart/);
  assert.match(app, /geometry\.lineEnd/);
  assert.match(app, /startDrag\("label"\)/);
  assert.match(app, /fontSize: 12/);
  assert.match(app, /border: "none"/);
  assert.match(app, /boxShadow: "none"/);
  assert.match(app, /zIndex: 10/);
});

test("foto oferece somente os símbolos técnicos da referência com legenda lateral", async () => {
  const [app, catalog, models, exporter] = await Promise.all([
    readFile(new URL("../src/components/MedidasApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/features/annotations/catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/types/models.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/features/photos/export-png.ts", import.meta.url), "utf8"),
  ]);
  for (const label of [
    "Tomada", "Tomada de piso", "Tomada de teto", "Interruptor simples",
    "Telefone / TV a cabo", "Interfone", "Campainha",
    "Arandela", "Quadro geral de luz", "Água fria", "Água quente",
    "Saída de esgoto parede", "Ponto de gás",
  ]) assert.match(catalog, new RegExp(label));
  assert.doesNotMatch(catalog, /Tomada baixa|Tomada média|Tomada alta|Interruptor duplo|Interruptor triplo|Ventilação|Ar-condicionado|Equipamento|Outro/);
  assert.match(app, /function TechnicalSymbolIcon/);
  assert.match(app, /aria-label="Símbolo técnico"/);
  assert.match(app, /a\.type === "technical"/);
  assert.match(app, /technicalSymbolColor\(a\.technicalSymbol\)/);
  assert.doesNotMatch(app, /nearestTechnicalAnchor/);
  assert.doesNotMatch(app, /Mover ponto inicial|Mover ponto final/);
  assert.match(app, /allowMeasureThrough=\{tool === "linear"\}/);
  assert.match(app, /pointerEvents: allowMeasureThrough \? "none" : "auto"/);
  assert.match(models, /technicalSymbol\?: string/);
  assert.match(exporter, /drawTechnicalSymbol/);
  assert.match(exporter, /ctx\.arc\(x, y, size \/ 2/);
  assert.match(exporter, /a\.type === "technical"/);
  assert.match(exporter, /a\.type === "technical" \? 0 : 1/);
  assert.match(catalog, /technicalSymbolColor/);
  assert.match(catalog, /color: "#0284c7"/);
  assert.match(catalog, /color: "#dc2626"/);
  assert.match(catalog, /color: "#92400e"/);
});

test("traço livre é classificado e retificado ao terminar o gesto", async () => {
  const [app, geometry] = await Promise.all([
    readFile(new URL("../src/components/MedidasApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/features/floor-plan/geometry.ts", import.meta.url), "utf8"),
  ]);
  assert.match(app, /finishCanvasGesture/);
  assert.match(app, /processFreehandStroke\(stroke\)/);
  assert.match(app, /classifyStroke\(stroke\)/);
  assert.match(geometry, /"straight" \| "curve" \| "mixed"/);
  assert.match(geometry, /function perpendicularDistance/);
});

test("planta usa letras externas, colunas livres e cotas finas em tamanho 12", async () => {
  const [app, models] = await Promise.all([
    readFile(new URL("../src/components/MedidasApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/types/models.ts", import.meta.url), "utf8"),
  ]);
  assert.match(app, /planCenter/);
  assert.match(app, /candidateA/);
  assert.match(app, /\{wallCode\(index\)\}/);
  assert.match(app, /columnStart/);
  assert.match(app, /Desenhe o tamanho livremente/);
  assert.doesNotMatch(app, /aria-label="Largura da coluna"/);
  assert.doesNotMatch(app, /aria-label="Comprimento da coluna"/);
  assert.match(app, /fontSize="12"/);
  assert.match(app, /strokeWidth="1\.5"/);
  assert.match(models, /drawWidth\?: number/);
  assert.match(models, /drawHeight\?: number/);
});

test("planta salva permanece anexada ao ambiente e reabre para ediÃ§Ã£o", async () => {
  const app = await readFile(
    new URL("../src/components/MedidasApp.tsx", import.meta.url),
    "utf8",
  );
  assert.match(app, /selectedEnvironmentPlan\?\.confirmed/);
  assert.match(app, /"Editar planta"/);
  assert.match(app, /"Continuar planta"/);
  assert.match(app, /const savePlan = useCallback/);
  assert.match(app, /await savePlan\(true\)/);
  assert.match(app, /environmentId: environment\.id/);
  assert.match(app, /if \(\s*!existing &&\s*!strokes\.length/);
});

test("só libera outro ambiente após concluir todas as paredes do atual", async () => {
  const app = await readFile(
    new URL("../src/components/MedidasApp.tsx", import.meta.url),
    "utf8",
  );
  assert.match(app, /selectedEnvironmentComplete/);
  assert.match(app, /completedWallCodes/);
  assert.match(app, /selectedEnvironmentPlan\?\.confirmed/);
  assert.match(app, /\.every\(\(code\) => completedWallCodes\.has\(code\)\)/);
  assert.match(app, /Conclua todas as paredes deste ambiente antes de continuar/);
  assert.match(app, /selectEnvironment=\{selectEditorEnvironment\}/);
  assert.match(app, /!selectedEnvironmentComplete/);
});

test("cada parede abre uma página limpa e independente para nova foto", async () => {
  const app = await readFile(
    new URL("../src/components/MedidasApp.tsx", import.meta.url),
    "utf8",
  );
  assert.match(app, /function openWallPage/);
  assert.match(app, /async function persistCurrentWall/);
  assert.match(app, /await syncPending\(httpSyncTransport\)/);
  assert.match(app, /await persistCurrentWall\(\)/);
  assert.match(app, /setPhotoId\(""\)/);
  assert.match(app, /setDraftPoints\(\[\]\)/);
  assert.match(app, /setDraftPointer\(null\)/);
  assert.match(app, /setSelected\(""\)/);
  assert.match(app, /setPhotoDrag\(null\)/);
  assert.match(app, /setTool\("select"\)/);
  assert.match(app, /Página da parede/);
  assert.match(app, /Nova página: Parede/);
  assert.match(app, /\(item\.wallCode \|\| "A"\) === currentWallCode/);
  assert.doesNotMatch(app, /!item\.wallCode \|\| item\.wallCode === currentWallCode/);
});
