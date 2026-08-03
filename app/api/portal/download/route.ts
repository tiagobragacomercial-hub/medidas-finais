import { cookies } from "next/headers";
import {
  active,
  bindings,
  sha256,
  type PortalPublication,
} from "../../../../src/server/portal";

export async function GET(request: Request) {
  const access = new URL(request.url).searchParams.get("access") || "",
    runtime = await bindings();
  let publication: PortalPublication | null = null;
  if (access.startsWith("access-")) {
    const id = access.slice(7);
    if ((await cookies()).get("portal_access")?.value === id)
      publication = await runtime.DB.prepare(
        "SELECT id, project_id, snapshot_json, pdf_object_key, active, expires_at FROM portal_publications WHERE id = ? LIMIT 1",
      )
        .bind(id)
        .first<PortalPublication>();
  } else if (access) {
    publication = await runtime.DB.prepare(
      "SELECT id, project_id, snapshot_json, pdf_object_key, active, expires_at FROM portal_publications WHERE token_hash = ? LIMIT 1",
    )
      .bind(await sha256(access))
      .first<PortalPublication>();
  }
  if (!publication || !active(publication))
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  const object = await runtime.MEDIA.get(publication.pdf_object_key);
  if (!object)
    return Response.json({ error: "Arquivo indisponível" }, { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": 'attachment; filename="medidas-finais.pdf"',
      "cache-control": "private, no-store",
    },
  });
}

export async function POST() {
  return Response.json({ error: "Portal somente leitura" }, { status: 405 });
}
export async function PUT() {
  return Response.json({ error: "Portal somente leitura" }, { status: 405 });
}
export async function DELETE() {
  return Response.json({ error: "Portal somente leitura" }, { status: 405 });
}
