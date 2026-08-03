import type { Point } from "../../types/models";
export function rectifyPath(points: Point[]): Point[] {
  if (points.length < 2) return points;
  return points.map((p, i) => {
    if (i === 0) return p;
    const prev = points[i - 1],
      dx = Math.abs(p.x - prev.x),
      dy = Math.abs(p.y - prev.y);
    return dx > dy ? { x: p.x, y: prev.y } : { x: prev.x, y: p.y };
  });
}
export const wallCode = (index: number) => {
  let n = index,
    result = "";
  do {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
};
