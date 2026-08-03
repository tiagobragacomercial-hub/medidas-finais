import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
};

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ...timestamps,
});
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    status: text("status").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_org_email_idx").on(t.organizationId, t.email)],
);
export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  address: text("address"),
  internalNotes: text("internal_notes"),
  status: text("status").notNull(),
  version: integer("version").notNull().default(1),
  deletedAt: text("deleted_at"),
  ...timestamps,
});
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id),
  name: text("name").notNull(),
  address: text("address"),
  surveyDate: text("survey_date"),
  company: text("company"),
  responsible: text("responsible"),
  unit: text("unit").notNull(),
  status: text("status").notNull(),
  version: integer("version").notNull().default(1),
  publishedVersion: integer("published_version").notNull().default(0),
  ...timestamps,
});
export const floors = sqliteTable("floors", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull(),
  ...timestamps,
});
export const environments = sqliteTable("environments", {
  id: text("id").primaryKey(),
  floorId: text("floor_id")
    .notNull()
    .references(() => floors.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  sortOrder: integer("sort_order").notNull(),
  version: integer("version").notNull().default(1),
  ...timestamps,
});
export const walls = sqliteTable(
  "walls",
  {
    id: text("id").primaryKey(),
    environmentId: text("environment_id")
      .notNull()
      .references(() => environments.id),
    code: text("code").notNull(),
    name: text("name"),
    sortOrder: integer("sort_order").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("walls_environment_code_idx").on(t.environmentId, t.code),
  ],
);
export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  environmentId: text("environment_id").references(() => environments.id),
  wallId: text("wall_id").references(() => walls.id),
  kind: text("kind").notNull(),
  objectKey: text("object_key").notNull(),
  mimeType: text("mime_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  checksum: text("checksum").notNull(),
  syncState: text("sync_state").notNull(),
  version: integer("version").notNull().default(1),
  ...timestamps,
});
export const annotations = sqliteTable("annotations", {
  id: text("id").primaryKey(),
  mediaId: text("media_id")
    .notNull()
    .references(() => media.id),
  kind: text("kind").notNull(),
  code: text("code").notNull(),
  state: text("state").notNull(),
  geometryJson: text("geometry_json").notNull(),
  dataJson: text("data_json").notNull(),
  layer: integer("layer").notNull(),
  version: integer("version").notNull().default(1),
  ...timestamps,
});
export const publications = sqliteTable("publications", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  version: integer("version").notNull(),
  snapshotJson: text("snapshot_json").notNull(),
  status: text("status").notNull(),
  publishedAt: text("published_at"),
  ...timestamps,
});
export const clientAccess = sqliteTable("client_access", {
  id: text("id").primaryKey(),
  publicationId: text("publication_id")
    .notNull()
    .references(() => publications.id),
  tokenHash: text("token_hash").notNull().unique(),
  codeHash: text("code_hash").notNull().unique(),
  active: integer("active", { mode: "boolean" }).notNull(),
  expiresAt: text("expires_at"),
  permissionsJson: text("permissions_json").notNull(),
  ...timestamps,
});
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  userId: text("user_id"),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  metadataJson: text("metadata_json").notNull(),
  createdAt: text("created_at").notNull(),
});
export const syncRecords = sqliteTable("sync_records", {
  id: text("id").primaryKey(),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  payloadJson: text("payload_json").notNull(),
  checksum: text("checksum"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export const portalPublications = sqliteTable("portal_publications", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  codeHash: text("code_hash").notNull().unique(),
  snapshotJson: text("snapshot_json").notNull(),
  pdfObjectKey: text("pdf_object_key").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
