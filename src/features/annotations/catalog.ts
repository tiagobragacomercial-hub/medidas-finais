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
export const technicalCategories = [
  "Tomada",
  "Interruptor",
  "Água fria",
  "Água quente",
  "Esgoto",
  "Gás",
  "Ventilação",
  "Ar-condicionado",
  "Porta",
  "Janela",
  "Gesso",
  "Piso",
  "Coluna",
  "Equipamento",
  "Outro",
] as const;
