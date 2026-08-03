import type { Point } from "../../types/models";
export const clampNormalized = (n: number) => Math.min(1, Math.max(0, n));
export function normalizePointer(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
): Point {
  return {
    x: clampNormalized((clientX - rect.left) / rect.width),
    y: clampNormalized((clientY - rect.top) / rect.height),
  };
}
export function denormalizePoint(point: Point, width: number, height: number) {
  return { x: point.x * width, y: point.y * height };
}
