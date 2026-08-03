import { cookies } from "next/headers";
import {
  active,
  bindings,
  sha256,
  type PortalPublication,
} from "../../../src/server/portal";

type Snapshot = {
  project?: { name?: string; address?: string; version?: number };
  client?: { name?: string };
  environments?: Array<{ id: string; name: string; type: string }>;
  photos?: Array<{ id: string; environmentId: string; name: string }>;
};

export default async function ClientPortal({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let publication: PortalPublication | null = null;
  try {
    const runtime = await bindings();
    if (token.startsWith("access-")) {
      const id = token.slice(7),
        authorized = (await cookies()).get("portal_access")?.value === id;
      if (authorized)
        publication = await runtime.DB.prepare(
          "SELECT id, project_id, snapshot_json, pdf_object_key, active, expires_at FROM portal_publications WHERE id = ? LIMIT 1",
        )
          .bind(id)
          .first<PortalPublication>();
    } else {
      publication = await runtime.DB.prepare(
        "SELECT id, project_id, snapshot_json, pdf_object_key, active, expires_at FROM portal_publications WHERE token_hash = ? LIMIT 1",
      )
        .bind(await sha256(token))
        .first<PortalPublication>();
    }
  } catch {
    publication = null;
  }
  if (!publication || !active(publication))
    return (
      <main className="content">
        <section
          className="card empty"
          style={{ maxWidth: 680, margin: "10vh auto" }}
        >
          <h1>Acesso indisponível</h1>
          <p>O link é inválido, expirou ou foi revogado.</p>
        </section>
      </main>
    );
  const snapshot = JSON.parse(publication.snapshot_json) as Snapshot,
    downloadKey = token.startsWith("access-")
      ? `access-${publication.id}`
      : token;
  return (
    <main className="content">
      <section className="portal-cover">
        <div className="eyebrow">Pasta digital - somente leitura</div>
        <h1>{snapshot.project?.name || "Medidas Finais para Produção"}</h1>
        <p>
          {snapshot.client?.name || "Cliente"} · versão{" "}
          {snapshot.project?.version || 1}
        </p>
      </section>
      <section className="card" style={{ marginTop: 18 }}>
        <div className="cardhead">
          <div>
            <h2>Ambientes publicados</h2>
            <p className="subtitle">
              Esta área não possui comandos de edição ou exclusão.
            </p>
          </div>
          <a
            className="btn primary"
            href={`/api/portal/download?access=${encodeURIComponent(downloadKey)}`}
          >
            Baixar PDF técnico
          </a>
        </div>
        {(snapshot.environments || []).map((environment) => (
          <div className="row" key={environment.id}>
            <div className="avatar">
              {environment.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="rowmain">
              <strong>{environment.name}</strong>
              <small>
                {environment.type} ·{" "}
                {
                  (snapshot.photos || []).filter(
                    (photo) => photo.environmentId === environment.id,
                  ).length
                }{" "}
                foto(s)
              </small>
            </div>
            <span className="pill ok">Visualização</span>
          </div>
        ))}
      </section>
    </main>
  );
}
