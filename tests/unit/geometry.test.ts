import assert from "node:assert/strict";
import test from "node:test";
import {
  clampNormalized,
  denormalizePoint,
  normalizePointer,
} from "../../src/features/annotations/geometry.ts";
import {
  rectifyPath,
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
test("retificação não cria medidas e preserva quantidade de vértices", () => {
  const source = [
      { x: 0.1, y: 0.1 },
      { x: 0.8, y: 0.12 },
      { x: 0.82, y: 0.7 },
    ],
    result = rectifyPath(source);
  assert.equal(result.length, source.length);
  assert.deepEqual(result, [
    { x: 0.1, y: 0.1 },
    { x: 0.8, y: 0.1 },
    { x: 0.8, y: 0.7 },
  ]);
  assert.equal(wallCode(0), "A");
  assert.equal(wallCode(25), "Z");
  assert.equal(wallCode(26), "AA");
});
