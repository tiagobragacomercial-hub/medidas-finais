export type SyncState =
  "local" | "pending" | "syncing" | "synced" | "failed" | "conflict";
export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}
export interface Project {
  id: string;
  clientId: string;
  name: string;
  address: string;
  responsible: string;
  unit: "mm" | "cm" | "m";
  status: "draft" | "published";
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface Environment {
  id: string;
  projectId: string;
  name: string;
  type: string;
  status: "active" | "archived";
}
export interface Photo {
  id: string;
  environmentId: string;
  name: string;
  blob: Blob;
  width: number;
  height: number;
  mediaType?: "image" | "video";
  mimeType?: string;
  durationSeconds?: number;
  syncState: SyncState;
  createdAt: string;
  wallCode?: string;
  detailOfPhotoId?: string;
}
export interface Point {
  x: number;
  y: number;
}
export interface Annotation {
  id: string;
  photoId: string;
  type: "linear" | "l-shape" | "angle" | "technical" | "text" | "detail";
  code: string;
  state: "protected" | "editing" | "hidden";
  points: Point[];
  labelPoint?: Point;
  descriptionPoint?: Point;
  value: string;
  secondaryValue?: string;
  textPosition: "between" | "above" | "below" | "left" | "right" | "free";
  description: string;
  layer: number;
  version: number;
  updatedAt: string;
  color?: string;
  strokeWidth?: number;
  fontSize?: number;
  locked?: boolean;
}
export interface SyncOperation {
  id: string;
  entity: string;
  entityId: string;
  action: "create" | "update" | "delete" | "upload";
  attempts: number;
  status: SyncState;
  createdAt: string;
}
export interface Floor {
  id: string;
  projectId: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}
export interface Wall {
  id: string;
  environmentId: string;
  code: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}
export interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
export interface TrashItem {
  id: string;
  entity: string;
  entityId: string;
  snapshot: unknown;
  expiresAt: string;
  createdAt: string;
}
export interface FloorPlanElement {
  id: string;
  type: "door" | "window" | "column" | "camera";
  x: number;
  y: number;
  direction?: number;
  flipped?: boolean;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  shape?: "rectangle" | "square" | "circle";
  variant?: "bathroom" | "standard";
  doorType?:
    | "swing"
    | "pivot"
    | "pocket"
    | "sliding"
    | "folding"
    | "accordion";
  locked?: boolean;
  wallIndex?: number;
  photoId?: string;
  width?: number;
  height?: number;
  drawWidth?: number;
  drawHeight?: number;
}
export interface FloorPlanMeasurement {
  id: string;
  start: Point;
  end: Point;
  value: string;
  unit: "mm" | "cm" | "m";
  labelPoint?: Point;
  color?: string;
  locked?: boolean;
}
export interface FloorPlanText {
  id: string;
  value: string;
  point: Point;
}
export interface FloorPlanRecord {
  id: string;
  environmentId: string;
  points: Point[];
  strokes?: Point[][];
  strokeKinds?: Array<"polyline" | "curve">;
  elements: FloorPlanElement[];
  measurements?: FloorPlanMeasurement[];
  texts?: FloorPlanText[];
  confirmed: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}
