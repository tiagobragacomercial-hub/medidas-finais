import { z } from "zod";
export const idSchema = z.string().uuid();
export const unitSchema = z.enum(["mm", "cm", "m"]);
export const clientSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(160),
  phone: z.string().max(40).default(""),
  email: z.union([z.literal(""), z.email()]),
  address: z.string().max(500).default(""),
  notes: z.string().max(5000).default(""),
  status: z.enum(["active", "archived"]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const normalizedPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});
export const measurementValueSchema = z
  .string()
  .regex(/^\d+(?:[.,]\d+)?$/, "A medida deve ser informada como número");
export const syncOperationSchema = z.object({
  id: idSchema,
  entity: z.string().min(1),
  entityId: idSchema,
  action: z.enum(["create", "update", "delete", "upload"]),
  attempts: z.number().int().nonnegative(),
  status: z.enum([
    "local",
    "pending",
    "syncing",
    "synced",
    "failed",
    "conflict",
  ]),
  createdAt: z.iso.datetime(),
});
