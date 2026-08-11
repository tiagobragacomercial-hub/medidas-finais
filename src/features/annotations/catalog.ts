import type { Annotation } from "../../types/models";
export const toolConfig = {
  linear: { type: "linear", prefix: "M", points: 2, label: "Medida linear" },
  angle: { type: "angle", prefix: "A", points: 3, label: "Medida angular" },
  point: { type: "technical", prefix: "T", points: 1, label: "Ponto técnico" },
  text: { type: "text", prefix: "TXT", points: 1, label: "Texto" },
  detail: { type: "detail", prefix: "D", points: 1, label: "Foto de detalhe" },
} as const;
export type AnnotationTool = keyof typeof toolConfig;
export const isAnnotationTool = (value: string): value is AnnotationTool =>
  value in toolConfig;
export function nextCode(tool: AnnotationTool, annotations: Annotation[]) {
  const prefix = toolConfig[tool].prefix,
    count = annotations.filter((a) => a.code.startsWith(prefix)).length + 1;
  return `${prefix}${String(count).padStart(2, "0")}`;
}
export const technicalSymbols = [
  { id: "outlet", label: "Tomada", color: "#7c3aed" },
  { id: "outlet-floor", label: "Tomada de piso", color: "#db2777" },
  { id: "outlet-ceiling", label: "Tomada de teto", color: "#e11d48" },
  { id: "switch-single", label: "Interruptor simples", color: "#ea580c" },
  { id: "phone-tv", label: "Telefone / TV a cabo", color: "#2563eb" },
  { id: "intercom", label: "Interfone", color: "#0891b2" },
  { id: "bell", label: "Campainha", color: "#0d9488" },
  { id: "sconce", label: "Arandela", color: "#65a30d" },
  { id: "light-panel", label: "Quadro geral de luz", color: "#16a34a" },
  { id: "cold-water", label: "Água fria", color: "#0284c7" },
  { id: "hot-water", label: "Água quente", color: "#dc2626" },
  { id: "sewer", label: "Saída de esgoto parede", color: "#92400e" },
  { id: "gas", label: "Ponto de gás", color: "#16a34a" },
] as const;

export function technicalSymbolColor(id?: string) {
  return technicalSymbols.find((symbol) => symbol.id === id)?.color || "#6d28d9";
}
