import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getSetting, markOperationComplete, markOperationFailed, markOperationSyncing,
  mergeRemoteClients, mergeRemoteProjects, nextPendingOperation, readSyncEntity, setSetting,
} from "./database";

async function organizationId(client: SupabaseClient) {
  const cached = await getSetting("organization_id");
  if (cached) return cached;
  const { data, error } = await client.from("organization_members").select("organization_id").limit(1).maybeSingle();
  if (error) throw error;
  if (!data?.organization_id) throw new Error("Conta sem organização autorizada.");
  await setSetting("organization_id", data.organization_id);
  return data.organization_id as string;
}

function remoteRecord(entity: "client" | "project", local: Record<string, unknown>, orgId: string) {
  const common = {
    id: local.id, organization_id: orgId, name: local.name, address: local.address ?? "",
    version: local.version ?? 1, created_at: local.created_at, updated_at: local.updated_at,
    deleted_at: local.deleted_at ?? null, device_id: local.device_id,
    sync_status: "SINCRONIZADO", last_sync_at: new Date().toISOString(),
  };
  return entity === "client"
    ? { ...common, phone: local.phone ?? "", email: local.email ?? "", notes: "", status: "active" }
    : { ...common, client_id: local.client_id, responsible: "", unit: local.unit ?? "mm", status: "draft" };
}

export async function synchronize(client: SupabaseClient) {
  const orgId = await organizationId(client);
  let processed = 0;
  while (processed < 100) {
    const operation = await nextPendingOperation();
    if (!operation) break;
    await markOperationSyncing(operation);
    try {
      const local = await readSyncEntity(operation);
      if (!local) throw new Error("Registro local não encontrado.");
      const receipt = await client.from("sync_receipts").select("operation_id").eq("operation_id", operation.id).maybeSingle();
      if (receipt.error) throw receipt.error;
      if (!receipt.data) {
        const record = remoteRecord(operation.entity, local, orgId);
        const result = operation.entity === "client"
          ? await client.from("clients").upsert(record as never)
          : await client.from("projects").upsert(record as never);
        const { error } = result;
        if (error) throw error;
        const { error: receiptError } = await client.from("sync_receipts").insert({
          operation_id: operation.id, organization_id: orgId, entity: operation.entity,
          entity_id: operation.entity_id, action: operation.operation,
        });
        if (receiptError && receiptError.code !== "23505") throw receiptError;
      }
      await markOperationComplete(operation);
      processed += 1;
    } catch (error) {
      await markOperationFailed(operation, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  const [clients, projects] = await Promise.all([
    client.from("clients").select("*").eq("organization_id", orgId),
    client.from("projects").select("*").eq("organization_id", orgId),
  ]);
  if (clients.error) throw clients.error;
  if (projects.error) throw projects.error;
  await mergeRemoteClients((clients.data ?? []) as Array<Record<string, unknown>>);
  await mergeRemoteProjects((projects.data ?? []) as Array<Record<string, unknown>>);
  await setSetting("last_sync_at", new Date().toISOString());
  return processed;
}
