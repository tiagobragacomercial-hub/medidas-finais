import type { Annotation, Photo } from "../../types/models";
export async function exportAnnotatedPng(
  photo: Photo,
  annotations: Annotation[],
): Promise<void> {
  const bitmap = await createImageBitmap(photo.blob),
    canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.drawImage(bitmap, 0, 0);
  ctx.strokeStyle = "#e21f2f";
  ctx.fillStyle = "#9d101d";
  ctx.lineWidth = Math.max(1.5, bitmap.width / 1000);
  ctx.font = `700 ${Math.max(12, bitmap.width / 100)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  for (const a of annotations.filter((x) => x.state !== "hidden")) {
    if ((a.type === "text" || a.type === "technical" || a.type === "detail") && a.points[0]) {
      const point = a.labelPoint || a.points[0],
        text = a.type === "text" ? a.value : a.description;
      ctx.fillStyle = "#9d101d";
      ctx.fillText(text, point.x * bitmap.width, point.y * bitmap.height);
      continue;
    }
    if (a.points.length < 2) continue;
    const [p1, p2] = a.points,
      x1 = p1.x * bitmap.width,
      y1 = p1.y * bitmap.height,
      x2 = p2.x * bitmap.width,
      y2 = p2.y * bitmap.height;
    const labelPoint = a.labelPoint || {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      },
      mx = labelPoint.x * bitmap.width,
      my = labelPoint.y * bitmap.height,
      dx = x2 - x1,
      dy = y2 - y1,
      length = Math.hypot(dx, dy) || 1,
      normalX = -dy / length,
      normalY = dx / length,
      offset = (mx - (x1 + x2) / 2) * normalX + (my - (y1 + y2) / 2) * normalY,
      lineX1 = x1 + normalX * offset,
      lineY1 = y1 + normalY * offset,
      lineX2 = x2 + normalX * offset,
      lineY2 = y2 + normalY * offset,
      textOffset = 0;
    ctx.strokeStyle = a.color || "#e21f2f";
    for (const [startX, startY, endX, endY] of [
      [x1, y1, lineX1, lineY1],
      [x2, y2, lineX2, lineY2],
      [lineX1, lineY1, lineX2, lineY2],
    ]) {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    ctx.fillStyle = "#fff";
    const metrics = ctx.measureText(a.value || "?");
    ctx.fillRect(
      mx - metrics.width / 2 - 8,
      my - textOffset - ctx.measureText("M").actualBoundingBoxAscent - 5,
      metrics.width + 16,
      ctx.measureText("M").actualBoundingBoxAscent + 10,
    );
    ctx.fillStyle = a.color || "#9d101d";
    ctx.fillText(a.value || "?", mx, my - textOffset);
  }
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (x) => (x ? resolve(x) : reject(new Error("Falha ao exportar PNG"))),
      "image/png",
    ),
  );
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = `${photo.name.replace(/\.[^.]+$/, "")}-medidas.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
