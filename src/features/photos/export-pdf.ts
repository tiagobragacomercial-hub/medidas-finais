import type { Annotation, Point } from "../../types/models";

export interface AnnotationSegment {
  start: Point;
  end: Point;
  value?: string;
}

export function getAnnotationSegments(annotation: Annotation): AnnotationSegment[] {
  if (annotation.type === "l-shape" && annotation.points.length === 3) {
    return [
      {
        start: annotation.points[0],
        end: annotation.points[1],
        value: annotation.value || undefined,
      },
      {
        start: annotation.points[1],
        end: annotation.points[2],
        value: annotation.secondaryValue || annotation.value || undefined,
      },
    ];
  }
  if (annotation.points.length >= 2) {
    return [
      {
        start: annotation.points[0],
        end: annotation.points[1],
        value: annotation.value || undefined,
      },
    ];
  }
  return [];
}

export function getAnnotationLabelPoint(
  annotation: Annotation,
  segmentIndex = 0,
): Point {
  if (annotation.labelPoint) return annotation.labelPoint;
  const segments = getAnnotationSegments(annotation);
  if (!segments.length) {
    return annotation.points[0] || { x: 0, y: 0 };
  }
  const segment = segments[Math.min(segmentIndex, segments.length - 1)];
  return {
    x: (segment.start.x + segment.end.x) / 2,
    y: (segment.start.y + segment.end.y) / 2,
  };
}

export function getLineAngle(start: Point, end: Point): number {
  return (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;
}
