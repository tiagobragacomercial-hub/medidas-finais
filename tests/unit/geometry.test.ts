import assert from "node:assert/strict";
import test from "node:test";
import {
  clampNormalized,
  denormalizePoint,
  normalizePointer,
} from "../../src/features/annotations/geometry.ts";
import {
  classifyStroke,
  processFreehandStroke,
  rectifyPath,
  strokePath,
  wallCode,
} from "../../src/features/floor-plan/geometry.ts";
test("normaliza e limita coordenadas à área da foto", () => {
  assert.deepEqual(
    normalizePointer(150, 100, { left: 50, top: 50, width: 200, height: 100 }),
    { x: 0.5, y: 0.5 },
  );
  assert.equal(clampNormalized(-2), 0);
  assert.equal(clampNormalized(4), 1);
  assert.deepEqual(denormalizePoint({ x: 0.25, y: 0.75 }, 800, 400), {
    x: 200,
    y: 300,
  });
});
test("reta desenhada à mão é retificada automaticamente", () => {
  const source = [
      { x: 0.1, y: 0.2 },
      { x: 0.35, y: 0.204 },
      { x: 0.6, y: 0.197 },
      { x: 0.85, y: 0.205 },
    ],
    result = processFreehandStroke(source);
  assert.equal(classifyStroke(source), "straight");
  assert.deepEqual(result, [
    { x: 0.1, y: 0.2 },
    { x: 0.85, y: 0.2 },
  ]);
  assert.deepEqual(rectifyPath(source), result);
  assert.match(strokePath(result), / L /);
});

test("curva é identificada e preservada com múltiplos pontos", () => {
  const curve = [
    { x: 0.1, y: 0.7 },
    { x: 0.15, y: 0.5 },
    { x: 0.3, y: 0.32 },
    { x: 0.5, y: 0.2 },
    { x: 0.72, y: 0.16 },
  ];
  const result = processFreehandStroke(curve);
  assert.equal(classifyStroke(curve), "curve");
  assert.ok(result.length > 2);
  assert.match(strokePath(result), / Q /);
  assert.equal(wallCode(0), "A");
  assert.equal(wallCode(25), "Z");
  assert.equal(wallCode(26), "AA");
});
