import { cookies } from "next/headers";
import {
  active,
  bindings,
  sha256,
  type PortalPublication,
} from "../../../../src/server/portal";

type Snapshot = {
  photos?: Array<{
    id: string;
    mediaType?: "image" | "video";
    mimeType?: string;
  }>;
};

export async function GET(request: Request) {
  const url = new URL(request.url),
    access = url.searchParams.get("access") || "",
    mediaId = url.searchParams.get("media") || "";
  if (!access || !mediaId)
    return new Response("Acesso inválido", { status: 400 });

  const runtime = await bindings();
  let publication: PortalPublication | null = null;
  if (access.startsWith("access-")) {
    const id = access.slice(7);
    if ((await cookies()).get("portal_access")?.value === id)
      publication = await runtime.DB.prepare(
        "SELECT id, project_id, snapshot_json, pdf_object_key, active, expires_at FROM portal_publications WHERE id = ? LIMIT 1",
      )
        .bind(id)
        .first<PortalPublication>();
  } else {
    publication = await runtime.DB.prepare(
      "SELECT id, project_id, snapshot_json, pdf_object_key, active, expires_at FROM portal_publications WHERE token_hash = ? LIMIT 1",
    )
      .bind(await sha256(access))
      .first<PortalPublication>();
  }
  if (!publication || !active(publication))
    return new Response("Acesso não autorizado", { status: 401 });

  const snapshot = JSON.parse(publication.snapshot_json) as Snapshot,
    media = (snapshot.photos || []).find(
      (item) => item.id === mediaId && item.mediaType === "video",
    );
  if (!media) return new Response("Vídeo não encontrado", { status: 404 });

  const object = await runtime.MEDIA.get(`photos/${media.id}`);
  if (!object) return new Response("Vídeo indisponível", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type", media.mimeType || "video/mp4");
  headers.set("cache-control", "private, max-age=3600");
  headers.set("content-disposition", "inline");
  return new Response(object.body, { headers });
}
