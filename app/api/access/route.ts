import { NextResponse } from "next/server";
import {
  bindings,
  sha256,
  type PortalPublication,
  active,
} from "../../../src/server/portal";

export async function POST(request: Request) {
  const form = await request.formData(),
    code = String(form.get("code") || "").replace(/\D/g, "");
  if (code.length !== 8)
    return NextResponse.redirect(
      new URL("/acesso?erro=codigo", request.url),
      303,
    );
  const runtime = await bindings(),
    publication = await runtime.DB.prepare(
      "SELECT id, project_id, snapshot_json, pdf_object_key, active, expires_at FROM portal_publications WHERE code_hash = ? LIMIT 1",
    )
      .bind(await sha256(code))
      .first<PortalPublication>();
  if (!publication || !active(publication))
    return NextResponse.redirect(
      new URL("/acesso?erro=invalido", request.url),
      303,
    );
  const response = NextResponse.redirect(
    new URL(`/p/access-${publication.id}`, request.url),
    303,
  );
  response.cookies.set("portal_access", publication.id, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
