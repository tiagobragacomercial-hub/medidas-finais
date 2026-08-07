import type { Point } from "../../types/models";

export type StrokeKind = "straight" | "curve" | "mixed";

const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

function perpendicularDistance(point: Point, start: Point, end: Point) {
  const length = distance(start, end);
  if (!length) return distance(point, start);
  return Math.abs(
    (end.y - start.y) * point.x -
      (end.x - start.x) * point.y +
      end.x * start.y -
      end.y * start.x,
  ) / length;
}

function simplify(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;
  const first = points[0], last = points[points.length - 1];
  let farthestIndex = 0, farthestDistance = 0;
  for (let index = 1; index < points.length - 1; index += 1) {
    const value = perpendicularDistance(points[index], first, last);
    if (value > farthestDistance) {
      farthestDistance = value;
      farthestIndex = index;
    }
  }
  if (farthestDistance <= tolerance) return [first, last];
  const left = simplify(points.slice(0, farthestIndex + 1), tolerance),
    right = simplify(points.slice(farthestIndex), tolerance);
  return [...left.slice(0, -1), ...right];
}

function withoutNearDuplicates(points: Point[]) {
  return points.filter(
    (point, index) => index === 0 || distance(points[index - 1], point) >= 0.003,
  );
}

export function classifyStroke(points: Point[]): StrokeKind {
  if (points.length < 3) return "straight";
  const start = points[0], end = points[points.length - 1], chord = distance(start, end),
    maxDeviation = Math.max(...points.map((point) => perpendicularDistance(point, start, end)));
  if (maxDeviation <= Math.max(0.008, chord * 0.045)) return "straight";

  let signedTurn = 0, absoluteTurn = 0;
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1], current = points[index], next = points[index + 1],
      cross = (current.x - previous.x) * (next.y - current.y) -
        (current.y - previous.y) * (next.x - current.x),
      turn = Math.atan2(
        cross,
        (current.x - previous.x) * (next.x - current.x) +
          (current.y - previous.y) * (next.y - current.y),
      );
    signedTurn += turn;
    absoluteTurn += Math.abs(turn);
  }
  return Math.abs(signedTurn) >= absoluteTurn * 0.68 ? "curve" : "mixed";
}

export function processFreehandStroke(source: Point[]): Point[] {
  const points = withoutNearDuplicates(source);
  if (points.length < 2) return points;
  if (classifyStroke(points) === "straight") {
    const start = points[0], rawEnd = points[points.length - 1],
      dx = rawEnd.x - start.x, dy = rawEnd.y - start.y,
      angle = Math.abs(Math.atan2(dy, dx));
    if (angle < Math.PI / 18 || angle > Math.PI - Math.PI / 18)
      return [start, { x: rawEnd.x, y: start.y }];
    if (Math.abs(angle - Math.PI / 2) < Math.PI / 18)
      return [start, { x: start.x, y: rawEnd.y }];
    return [start, rawEnd];
  }
  const smoothed = points.map((point, index) => {
    if (!index || index === points.length - 1) return point;
    return {
      x: (points[index - 1].x + point.x * 2 + points[index + 1].x) / 4,
      y: (points[index - 1].y + point.y * 2 + points[index + 1].y) / 4,
    };
  });
  return simplify(smoothed, 0.0035);
}

export function straightenStroke(source: Point[]): Point[] {
  const points = withoutNearDuplicates(source);
  if (points.length < 2) return points;
  const start = points[0], rawEnd = points[points.length - 1],
    dx = rawEnd.x - start.x, dy = rawEnd.y - start.y,
    angle = Math.abs(Math.atan2(dy, dx));
  if (angle < Math.PI / 18 || angle > Math.PI - Math.PI / 18)
    return [start, { x: rawEnd.x, y: start.y }];
  if (Math.abs(angle - Math.PI / 2) < Math.PI / 18)
    return [start, { x: start.x, y: rawEnd.y }];
  return [start, rawEnd];
}

export function polylineStroke(source: Point[]): Point[] {
  const points = withoutNearDuplicates(source);
  if (points.length < 3) return straightenStroke(points);
  const corners = simplify(points, 0.032);
  if (corners.length < 2) return corners;
  const orthogonal: Point[] = [corners[0]];
  for (let index = 1; index < corners.length; index += 1) {
    const current = orthogonal[orthogonal.length - 1];
    const point = corners[index];
    const dx = point.x - current.x;
    const dy = point.y - current.y;
    const nextPoint =
      Math.abs(dx) >= Math.abs(dy)
        ? { x: point.x, y: current.y }
        : { x: current.x, y: point.y };
    if (
      orthogonal[orthogonal.length - 1].x !== nextPoint.x ||
      orthogonal[orthogonal.length - 1].y !== nextPoint.y
    ) {
      orthogonal.push(nextPoint);
    }
    if (index === corners.length - 1) {
      if (
        orthogonal[orthogonal.length - 1].x !== point.x ||
        orthogonal[orthogonal.length - 1].y !== point.y
      ) {
        orthogonal.push(point);
      }
    }
  }
  return orthogonal;
}

export function rectifyPath(points: Point[]): Point[] {
  return processFreehandStroke(points);
}

export function strokePath(points: Point[]): string {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x * 1000} ${points[0].y * 600}`;
  if (classifyStroke(points) === "straight")
    return `M ${points[0].x * 1000} ${points[0].y * 600} L ${points[points.length - 1].x * 1000} ${points[points.length - 1].y * 600}`;
  if (classifyStroke(points) === "mixed")
    return points.slice(1).reduce(
      (path, point) => `${path} L ${point.x * 1000} ${point.y * 600}`,
      `M ${points[0].x * 1000} ${points[0].y * 600}`,
    );
  let path = `M ${points[0].x * 1000} ${points[0].y * 600}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index], next = points[index + 1],
      middleX = ((point.x + next.x) / 2) * 1000,
      middleY = ((point.y + next.y) / 2) * 600;
    path += ` Q ${point.x * 1000} ${point.y * 600} ${middleX} ${middleY}`;
  }
  const last = points[points.length - 1];
  return `${path} T ${last.x * 1000} ${last.y * 600}`;
}

export function polylinePath(points: Point[]): string {
  if (!points.length) return "";
  return points.slice(1).reduce(
    (path, point) => `${path} L ${point.x * 1000} ${point.y * 600}`,
    `M ${points[0].x * 1000} ${points[0].y * 600}`,
  );
}

export const wallCode = (index: number) => {
  let n = index, result = "";
  do {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
};
