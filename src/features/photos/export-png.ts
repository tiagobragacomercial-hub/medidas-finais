import type { Annotation, Photo } from "../../types/models";
import { technicalSymbolColor } from "../annotations/catalog";
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
    if (a.type === "technical" && a.points[0]) {
      const point = a.labelPoint || a.points[0],
        x = point.x * bitmap.width,
        y = point.y * bitmap.height,
        size = Math.max(30, bitmap.width / 28);
      ctx.save();
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = technicalSymbolColor(a.technicalSymbol);
      ctx.lineWidth = Math.max(3, bitmap.width / 500);
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      drawTechnicalSymbol(
        ctx,
        a.technicalSymbol,
        x,
        y,
        size * 0.62,
      );
      continue;
    }
    if ((a.type === "text" || a.type === "detail") && a.points[0]) {
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

function drawTechnicalSymbol(
  ctx: CanvasRenderingContext2D,
  symbol: string | undefined,
  x: number,
  y: number,
  size: number,
) {
  const red = "#ef3340", blue = "#1769d2", green = "#18a83b", half = size / 2;
  ctx.save();
  ctx.translate(x - half, y - half);
  ctx.scale(size / 32, size / 32);
  ctx.lineWidth = 2;
  ctx.strokeStyle = red;
  ctx.fillStyle = "#fff";
  const triangle = (reverse = false) => {
    ctx.beginPath();
    ctx.moveTo(reverse ? 25 : 7, 5);
    ctx.lineTo(reverse ? 7 : 25, 16);
    ctx.lineTo(reverse ? 25 : 7, 27);
    ctx.closePath();
  };
  if (symbol?.startsWith("outlet-") && !["outlet-floor", "outlet-ceiling"].includes(symbol)) {
    triangle();
    if (symbol === "outlet-high") { ctx.fillStyle = red; ctx.fill(); }
    else { ctx.fill(); ctx.stroke(); }
    if (symbol === "outlet-medium") {
      ctx.fillStyle = red; ctx.beginPath(); ctx.moveTo(7, 16); ctx.lineTo(25, 16); ctx.lineTo(7, 27); ctx.closePath(); ctx.fill();
    }
  } else if (symbol === "outlet-floor" || symbol === "outlet-ceiling") {
    ctx.fillRect(6, 5, 20, 22); ctx.strokeRect(6, 5, 20, 22);
    ctx.beginPath(); ctx.moveTo(7, 6); ctx.lineTo(25, 16); ctx.lineTo(7, 26);
    if (symbol === "outlet-ceiling") { ctx.closePath(); ctx.fillStyle = red; ctx.fill(); }
    else ctx.stroke();
  } else if (symbol?.startsWith("switch-")) {
    ctx.beginPath(); ctx.arc(16, 16, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (symbol === "switch-double") { ctx.beginPath(); ctx.moveTo(16, 5); ctx.lineTo(16, 27); ctx.stroke(); }
    if (symbol === "switch-triple") {
      ctx.beginPath(); ctx.moveTo(16, 16); ctx.lineTo(9, 7); ctx.moveTo(16, 16); ctx.lineTo(26, 15); ctx.moveTo(16, 16); ctx.lineTo(11, 26); ctx.stroke();
    }
  } else if (symbol === "phone-tv") { triangle(true); ctx.fill(); ctx.stroke(); }
  else if (symbol === "intercom") {
    ctx.beginPath(); ctx.moveTo(8, 5); ctx.lineTo(8, 27); ctx.moveTo(8, 10); ctx.lineTo(24, 4); ctx.lineTo(24, 28); ctx.lineTo(8, 22); ctx.stroke();
  } else if (symbol === "bell") {
    ctx.fillRect(7, 7, 18, 19); ctx.strokeRect(7, 7, 18, 19); ctx.beginPath(); ctx.moveTo(9, 7); ctx.lineTo(16, 3); ctx.stroke();
  } else if (symbol === "sconce") {
    ctx.beginPath(); ctx.moveTo(10, 5); ctx.lineTo(10, 27); ctx.arc(10, 16, 11, -Math.PI / 2, Math.PI / 2); ctx.fill(); ctx.stroke();
  } else if (symbol === "light-panel") {
    ctx.fillStyle = red; ctx.beginPath(); ctx.moveTo(5, 20); ctx.lineTo(27, 10); ctx.lineTo(27, 22); ctx.lineTo(5, 22); ctx.closePath(); ctx.fill();
  } else if (["cold-water", "hot-water", "sewer"].includes(symbol || "")) {
    ctx.strokeStyle = blue; ctx.beginPath(); ctx.arc(16, 16, 11, 0, Math.PI * 2);
    if (symbol === "sewer") { ctx.fillStyle = blue; ctx.fill(); }
    else { ctx.fill(); ctx.stroke(); ctx.fillStyle = blue;
      if (symbol === "cold-water") { ctx.beginPath(); ctx.arc(16, 16, 11, Math.PI, 0); ctx.lineTo(5, 16); ctx.fill(); }
      else { ctx.fillRect(5, 5, 11, 11); ctx.fillRect(16, 16, 11, 11); }
    }
  } else if (symbol === "gas") {
    ctx.fillStyle = green; ctx.font = "700 21px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("G", 16, 17);
  }
  ctx.restore();
}
