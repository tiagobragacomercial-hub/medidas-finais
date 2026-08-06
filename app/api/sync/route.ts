import { getApiUser } from "../../../src/server/api-user";

type Envelope = {
  operationId: string;
  entity: string;
  entityId: string;
  action: string;
  payload: unknown;
};

function validEnvelope(value: unknown): value is Envelope {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return ["operationId", "entity", "entityId", "action"].every(
    (key) => typeof item[key] === "string" && item[key] !== "",
  );
}

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return Response.json({ error: "Não autorizado" }, { status: 401 });
  let envelope: unknown,
    file: File | null = null;
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const form = await request.formData();
    const raw = form.get("envelope");
    file = form.get("file") as File | null;
    try {
      envelope = typeof raw === "string" ? JSON.parse(raw) : null;
    } catch {
      return Response.json({ error: "Envelope inválido" }, { status: 400 });
    }
  } else {
    envelope = await request.json().catch(() => null);
  }
  if (!validEnvelope(envelope))
    return Response.json({ error: "Operação inválida" }, { status: 400 });

  const { env } = await import("cloudflare:workers");
  const bindings = env as unknown as { DB: D1Database; MEDIA: R2Bucket };
  const timestamp = new Date().toISOString();
  let checksum: string | null = null;
  if (file) {
    const bytes = await file.arrayBuffer();
    checksum = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    )
      .map((part) => part.toString(16).padStart(2, "0"))
      .join("");
    await bindings.MEDIA.put(`photos/${envelope.entityId}`, bytes, {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
      customMetadata: { owner: user.email, checksum },
    });
  }
  await bindings.DB.prepare(
    `INSERT INTO sync_records
      (id, entity, entity_id, action, payload_json, checksum, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
      payload_json = excluded.payload_json,
      checksum = excluded.checksum,
      updated_at = excluded.updated_at`,
  )
    .bind(
      envelope.operationId,
      envelope.entity,
      envelope.entityId,
      envelope.action,
      JSON.stringify({ owner: user.email, data: envelope.payload }),
      checksum,
      timestamp,
      timestamp,
    )
    .run();
  return Response.json({ accepted: true, operationId: envelope.operationId });
}

export async function PUT() {
  return Response.json({ error: "Método não permitido" }, { status: 405 });
}

export async function DELETE() {
  return Response.json({ error: "Método não permitido" }, { status: 405 });
}
