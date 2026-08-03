import { getChatGPTUser } from "../../chatgpt-auth";
import { bindings, sha256 } from "../../../src/server/portal";

const secret = (bytes: number) => {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
};

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const form = await request.formData(),
    snapshot = form.get("snapshot"),
    pdf = form.get("pdf");
  if (
    typeof snapshot !== "string" ||
    snapshot.length > 5_000_000 ||
    !(pdf instanceof File)
  )
    return Response.json({ error: "Publicação inválida" }, { status: 400 });
  let parsed: { project?: { id?: string } };
  try {
    parsed = JSON.parse(snapshot);
  } catch {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const projectId = parsed.project?.id;
  if (!projectId)
    return Response.json({ error: "Projeto obrigatório" }, { status: 400 });
  const id = crypto.randomUUID(),
    token = secret(32),
    code = String(
      crypto.getRandomValues(new Uint32Array(1))[0] % 100_000_000,
    ).padStart(8, "0"),
    timestamp = new Date().toISOString(),
    objectKey = `publications/${id}.pdf`,
    runtime = await bindings();
  await runtime.MEDIA.put(objectKey, await pdf.arrayBuffer(), {
    httpMetadata: {
      contentType: "application/pdf",
      contentDisposition: 'attachment; filename="medidas-finais.pdf"',
    },
    customMetadata: { owner: user.email, projectId },
  });
  await runtime.DB.prepare(
    `INSERT INTO portal_publications
      (id, project_id, token_hash, code_hash, snapshot_json, pdf_object_key, active, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, NULL, ?, ?)`,
  )
    .bind(
      id,
      projectId,
      await sha256(token),
      await sha256(code),
      snapshot,
      objectKey,
      timestamp,
      timestamp,
    )
    .run();
  return Response.json({ accepted: true, token, code, url: `/p/${token}` });
}

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "ID obrigatório" }, { status: 400 });
  const runtime = await bindings();
  await runtime.DB.prepare(
    "UPDATE portal_publications SET active = 0, updated_at = ? WHERE id = ?",
  )
    .bind(new Date().toISOString(), id)
    .run();
  return Response.json({ accepted: true });
}
