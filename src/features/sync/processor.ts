import type { SyncOperation } from "../../types/models";
import { db } from "../../database/local/db.ts";

export type SyncEnvelope = {
  operationId: string;
  entity: string;
  entityId: string;
  action: SyncOperation["action"];
  payload: unknown;
};

export type SyncTransport = (
  envelope: SyncEnvelope,
) => Promise<{ accepted: true }>;

async function readEntity(operation: SyncOperation): Promise<unknown> {
  let value: unknown;
  switch (operation.entity) {
    case "client":
      value = await db.clients.get(operation.entityId);
      break;
    case "project":
      value = await db.projects.get(operation.entityId);
      break;
    case "environment":
      value = await db.environments.get(operation.entityId);
      break;
    case "annotation":
      value = await db.annotations.get(operation.entityId);
      break;
    case "floorPlan":
      value = await db.floorPlans.get(operation.entityId);
      break;
    case "floor":
      value = await db.floors.get(operation.entityId);
      break;
    case "wall":
      value = await db.walls.get(operation.entityId);
      break;
    case "photo": {
      const photo = await db.photos.get(operation.entityId);
      if (!photo && operation.action !== "delete")
        throw new Error("Registro local não encontrado");
      return photo
        ? {
            ...photo,
            blob: undefined,
            mimeType: photo.blob.type || "application/octet-stream",
            byteSize: photo.blob.size,
          }
        : { id: operation.entityId };
    }
    default:
      throw new Error(`Entidade não sincronizável: ${operation.entity}`);
  }
  if (!value && operation.action !== "delete")
    throw new Error("Registro local não encontrado");
  return value || { id: operation.entityId };
}

export async function syncPending(transport: SyncTransport): Promise<{
  sent: number;
  failed: number;
}> {
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    return { sent: 0, failed: 0 };
  const operations = await db.syncOperations
    .where("status")
    .anyOf("pending", "failed")
    .sortBy("createdAt");
  let sent = 0,
    failed = 0;
  for (const operation of operations) {
    await db.syncOperations.update(operation.id, { status: "syncing" });
    try {
      const result = await transport({
        operationId: operation.id,
        entity: operation.entity,
        entityId: operation.entityId,
        action: operation.action,
        payload: await readEntity(operation),
      });
      if (!result.accepted)
        throw new Error("Servidor não confirmou a gravação");
      await db.syncOperations.update(operation.id, { status: "synced" });
      if (operation.entity === "photo")
        await db.photos.update(operation.entityId, { syncState: "synced" });
      sent++;
    } catch {
      await db.syncOperations.update(operation.id, {
        status: "failed",
        attempts: operation.attempts + 1,
      });
      failed++;
    }
  }
  return { sent, failed };
}

export const httpSyncTransport: SyncTransport = async (envelope) => {
  let body: BodyInit, headers: HeadersInit | undefined;
  if (envelope.entity === "photo") {
    const photo = await db.photos.get(envelope.entityId);
    if (!photo) throw new Error("Foto local não encontrada");
    const form = new FormData();
    form.set("envelope", JSON.stringify(envelope));
    form.set("file", photo.blob, photo.name);
    body = form;
  } else {
    headers = { "content-type": "application/json" };
    body = JSON.stringify(envelope);
  }
  const response = await fetch("/api/sync", { method: "POST", headers, body });
  if (!response.ok)
    throw new Error(`Falha de sincronização (${response.status})`);
  const result = (await response.json()) as { accepted?: boolean };
  if (result.accepted !== true) throw new Error("Confirmação remota inválida");
  return { accepted: true };
};
