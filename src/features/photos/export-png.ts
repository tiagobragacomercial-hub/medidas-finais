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
  ctx.lineWidth = Math.max(3, bitmap.width / 500);
  ctx.font = `700 ${Math.max(18, bitmap.width / 42)}px Arial`;
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
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const tick = Math.max(8, bitmap.width / 100);
    for (const [x, y] of [
      [x1, y1],
      [x2, y2],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x, y - tick);
      ctx.lineTo(x, y + tick);
      ctx.stroke();
    }
    const labelPoint = a.labelPoint || {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      },
      mx = labelPoint.x * bitmap.width,
      my = labelPoint.y * bitmap.height,
      offset = 0;
    ctx.fillStyle = "#fff";
    const metrics = ctx.measureText(a.value || "?");
    ctx.fillRect(
      mx - metrics.width / 2 - 8,
      my - offset - ctx.measureText("M").actualBoundingBoxAscent - 5,
      metrics.width + 16,
      ctx.measureText("M").actualBoundingBoxAscent + 10,
    );
    ctx.fillStyle = "#9d101d";
    ctx.fillText(a.value || "?", mx, my - offset);
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
