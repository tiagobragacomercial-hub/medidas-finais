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
  { id: "outlet-low", label: "Tomada baixa" },
  { id: "outlet-medium", label: "Tomada média" },
  { id: "outlet-high", label: "Tomada alta" },
  { id: "outlet-floor", label: "Tomada de piso" },
  { id: "outlet-ceiling", label: "Tomada de teto" },
  { id: "switch-single", label: "Interruptor simples" },
  { id: "switch-double", label: "Interruptor duplo" },
  { id: "switch-triple", label: "Interruptor triplo" },
  { id: "phone-tv", label: "Telefone / TV a cabo" },
  { id: "intercom", label: "Interfone" },
  { id: "bell", label: "Campainha" },
  { id: "sconce", label: "Arandela" },
  { id: "light-panel", label: "Quadro geral de luz" },
  { id: "cold-water", label: "Água fria" },
  { id: "hot-water", label: "Água quente" },
  { id: "sewer", label: "Saída de esgoto parede" },
  { id: "gas", label: "Ponto de gás" },
] as const;
