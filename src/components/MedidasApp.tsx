"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, now, queue, uid } from "../database/local/db";
import type {
  Annotation,
  Client,
  Environment,
  FloorPlanElement,
  FloorPlanRecord,
  Photo,
  Project,
} from "../types/models";
import {
  Camera,
  ClipboardList,
  Cloud,
  Download,
  FileText,
  FolderKanban,
  Home,
  ImagePlus,
  LayoutDashboard,
  Lock,
  Map,
  Plus,
  QrCode,
  Save,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { exportAnnotatedPng } from "../features/photos/export-png";
import { normalizePointer } from "../features/annotations/geometry";
import { measurementValueSchema } from "../schemas/entities";
import {
  isAnnotationTool,
  nextCode,
  technicalCategories,
  toolConfig,
} from "../features/annotations/catalog";
import { rectifyPath, wallCode } from "../features/floor-plan/geometry";
import { httpSyncTransport, syncPending } from "../features/sync/processor";
type Section =
  | "dashboard"
  | "clients"
  | "projects"
  | "editor"
  | "floorplan"
  | "sync"
  | "portal";
const types = [
  "Cozinha",
  "Sala",
  "Dormitório",
  "Suíte",
  "Banheiro",
  "Lavabo",
  "Lavanderia",
  "Área gourmet",
  "Corredor",
  "Varanda",
  "Escritório",
  "Garagem",
  "Comercial",
  "Personalizado",
];
export function MedidasApp() {
  const [section, setSection] = useState<Section>("dashboard"),
    [modal, setModal] = useState<null | "client" | "project" | "environment">(
      null,
    ),
    [toast, setToast] = useState("");
  const clients = useLiveQuery(() => db.clients.toArray(), []) || [],
    projects = useLiveQuery(() => db.projects.toArray(), []) || [],
    envs = useLiveQuery(() => db.environments.toArray(), []) || [],
    photos = useLiveQuery(() => db.photos.toArray(), []) || [],
    pending =
      useLiveQuery(
        () =>
          db.syncOperations
            .where("status")
            .anyOf("pending", "failed", "conflict")
            .count(),
        [],
      ) || 0;
  useEffect(() => {
    navigator.serviceWorker?.register("/sw.js").catch(() => {});
    let running = false;
    const synchronize = async () => {
      if (running || !navigator.onLine) return;
      running = true;
      const result = await syncPending(httpSyncTransport);
      running = false;
      if (result.sent) setToast(`${result.sent} item(ns) sincronizado(s)`);
    };
    void synchronize();
    window.addEventListener("online", synchronize);
    const timer = window.setInterval(synchronize, 15000);
    return () => {
      window.removeEventListener("online", synchronize);
      window.clearInterval(timer);
    };
  }, []);
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brandmark">
            <ClipboardList size={21} />
          </div>
          <span>Medidas Finais</span>
        </div>
        <nav>
          <button className="navbtn active">Operação</button>
          <button className="navbtn">Publicações</button>
          <button className="navbtn">Administração</button>
        </nav>
        <div className="sync">
          <span className="dot" />
          <span>
            {navigator.onLine
              ? pending
                ? `${pending} itens aguardando sincronização`
                : "Salvo neste dispositivo"
              : "Sem internet — dados protegidos"}
          </span>
        </div>
      </header>
      <div className="layout">
        <aside className="sidebar">
          <Side
            icon={<LayoutDashboard />}
            label="Visão geral"
            active={section === "dashboard"}
            click={() => setSection("dashboard")}
          />
          <div className="side-label">Levantamentos</div>
          <Side
            icon={<Users />}
            label="Clientes"
            active={section === "clients"}
            click={() => setSection("clients")}
          />
          <Side
            icon={<FolderKanban />}
            label="Projetos"
            active={section === "projects"}
            click={() => setSection("projects")}
          />
          <Side
            icon={<ImagePlus />}
            label="Editor de fotos"
            active={section === "editor"}
            click={() => setSection("editor")}
          />
          <Side
            icon={<Map />}
            label="Plantas baixas"
            active={section === "floorplan"}
            click={() => setSection("floorplan")}
          />
          <div className="side-label">Entrega</div>
          <Side
            icon={<Cloud />}
            label="Sincronização"
            active={section === "sync"}
            click={() => setSection("sync")}
          />
          <Side
            icon={<QrCode />}
            label="Portal do cliente"
            active={section === "portal"}
            click={() => setSection("portal")}
          />
          <Side icon={<Settings />} label="Configurações" />
        </aside>
        <main className="content">
          {section === "dashboard" && (
            <Dashboard
              clients={clients}
              projects={projects}
              envs={envs}
              photos={photos}
              pending={pending}
              go={setSection}
            />
          )}{" "}
          {section === "clients" && (
            <Clients clients={clients} add={() => setModal("client")} />
          )}{" "}
          {section === "projects" && (
            <Projects
              projects={projects}
              clients={clients}
              add={() => setModal("project")}
              addEnv={() => setModal("environment")}
            />
          )}{" "}
          {section === "editor" && (
            <Editor envs={envs} photos={photos} notify={setToast} />
          )}{" "}
          {section === "floorplan" && <FloorPlan envs={envs} />}{" "}
          {section === "sync" && <Sync pending={pending} />}{" "}
          {section === "portal" && <Portal projects={projects} />}
        </main>
      </div>
      <div className="mobilebar">
        <button onClick={() => setSection("dashboard")}>
          <Home />
          <br />
          Início
        </button>
        <button onClick={() => setSection("projects")}>
          <FolderKanban />
          <br />
          Projetos
        </button>
        <button onClick={() => setSection("editor")}>
          <Camera />
          <br />
          Medir
        </button>
        <button onClick={() => setSection("sync")}>
          <Cloud />
          <br />
          Sync
        </button>
      </div>
      {modal && (
        <Modal
          type={modal}
          clients={clients}
          projects={projects}
          close={() => setModal(null)}
          saved={() => {
            setModal(null);
            setToast("Salvo neste dispositivo");
            setTimeout(() => setToast(""), 2200);
          }}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
function Side({
  icon,
  label,
  active,
  click,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  click?: () => void;
}) {
  return (
    <button className={`sidebtn ${active ? "active" : ""}`} onClick={click}>
      <span
        style={{
          display: "inline-flex",
          verticalAlign: "middle",
          marginRight: 10,
        }}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}
function Head({
  eye,
  title,
  sub,
  action,
}: {
  eye: string;
  title: string;
  sub: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="pagehead">
      <div>
        <div className="eyebrow">{eye}</div>
        <h1>{title}</h1>
        <p className="subtitle">{sub}</p>
      </div>
      {action}
    </div>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="card metric">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
function Dashboard({
  clients,
  projects,
  envs,
  photos,
  pending,
  go,
}: {
  clients: Client[];
  projects: Project[];
  envs: Environment[];
  photos: Photo[];
  pending: number;
  go: (s: Section) => void;
}) {
  return (
    <>
      <Head
        eye="Painel operacional"
        title="Bom trabalho, Franciane"
        sub="Seus levantamentos ficam seguros neste dispositivo, mesmo sem internet."
        action={
          <button className="btn primary" onClick={() => go("projects")}>
            <Plus size={17} />
            Novo levantamento
          </button>
        }
      />
      <div className="grid">
        <Metric label="Projetos ativos" value={projects.length} />
        <Metric label="Ambientes" value={envs.length} />
        <Metric label="Fotos salvas" value={photos.length} />
        <Metric label="Pendências de envio" value={pending} />
        <section className="card wide">
          <div className="cardhead">
            <h2>Levantamentos recentes</h2>
          </div>
          {projects.length ? (
            projects.map((p) => (
              <div className="row" key={p.id}>
                <div className="avatar">{p.name[0]}</div>
                <div className="rowmain">
                  <strong>{p.name}</strong>
                  <small>
                    {clients.find((c) => c.id === p.clientId)?.name} · {p.unit}
                  </small>
                </div>
                <span className="pill warn">Rascunho</span>
              </div>
            ))
          ) : (
            <div className="empty">
              Crie o primeiro cliente e levantamento para começar.
            </div>
          )}
        </section>
        <section className="card aside">
          <h2>Próximas ações</h2>
          <div className="row">
            <div className="rowmain">
              <strong>Itens para sincronizar</strong>
            </div>
            <span className="pill">{pending}</span>
          </div>
          <div className="row">
            <div className="rowmain">
              <strong>Fotos sem parede</strong>
            </div>
            <span className="pill">{photos.length}</span>
          </div>
        </section>
      </div>
    </>
  );
}
function Clients({ clients, add }: { clients: Client[]; add: () => void }) {
  return (
    <>
      <Head
        eye="Cadastros"
        title="Clientes"
        sub="Informações internas ficam separadas do conteúdo publicado."
        action={
          <button className="btn primary" onClick={add}>
            <Plus size={17} />
            Novo cliente
          </button>
        }
      />
      <section className="card">
        {clients.length ? (
          clients.map((c) => (
            <div className="row" key={c.id}>
              <div className="avatar">{c.name.slice(0, 2).toUpperCase()}</div>
              <div className="rowmain">
                <strong>{c.name}</strong>
                <small>{c.phone || c.email || "Sem contato informado"}</small>
              </div>
              <span className={`pill ${c.status === "active" ? "ok" : ""}`}>
                {c.status === "active" ? "Ativo" : "Arquivado"}
              </span>
              <button
                className="btn"
                onClick={async () => {
                  await db.clients.update(c.id, {
                    status: c.status === "active" ? "archived" : "active",
                    updatedAt: now(),
                  });
                  await queue("client", c.id, "update");
                }}
              >
                {c.status === "active" ? "Arquivar" : "Restaurar"}
              </button>
            </div>
          ))
        ) : (
          <div className="empty">Nenhum cliente cadastrado.</div>
        )}
      </section>
    </>
  );
}
function Projects({
  projects,
  clients,
  add,
  addEnv,
}: {
  projects: Project[];
  clients: Client[];
  add: () => void;
  addEnv: () => void;
}) {
  return (
    <>
      <Head
        eye="Levantamentos"
        title="Projetos"
        sub="Organize ambientes, fotos e versões de cada entrega."
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={addEnv}>
              + Ambiente
            </button>
            <button className="btn primary" onClick={add}>
              + Novo projeto
            </button>
          </div>
        }
      />
      <div className="grid">
        {projects.map((p) => (
          <article className="card" style={{ gridColumn: "span 4" }} key={p.id}>
            <div className="cardhead">
              <div className="avatar">
                <FolderKanban size={19} />
              </div>
              <span className="pill warn">v{p.version}</span>
            </div>
            <h2>{p.name}</h2>
            <p className="subtitle">
              {clients.find((c) => c.id === p.clientId)?.name}
            </p>
            <div className="row">
              <small>{p.address || "Endereço não informado"}</small>
            </div>
            <button
              className="btn"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Abrir levantamento
            </button>
          </article>
        ))}
        {!projects.length && (
          <section className="card full empty">
            Crie um cliente e depois o primeiro projeto.
          </section>
        )}
      </div>
    </>
  );
}
function Modal({
  type,
  clients,
  projects,
  close,
  saved,
}: {
  type: "client" | "project" | "environment";
  clients: Client[];
  projects: Project[];
  close: () => void;
  saved: () => void;
}) {
  const ref = useRef<HTMLFormElement>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const f = new FormData(ref.current!),
      id = uid();
    if (type === "client")
      await db.clients.put({
        id,
        name: String(f.get("name")),
        phone: String(f.get("phone") || ""),
        email: String(f.get("email") || ""),
        address: String(f.get("address") || ""),
        notes: String(f.get("notes") || ""),
        status: "active",
        createdAt: now(),
        updatedAt: now(),
      });
    else if (type === "project")
      await db.projects.put({
        id,
        clientId: String(f.get("clientId")),
        name: String(f.get("name")),
        address: String(f.get("address") || ""),
        responsible: String(f.get("responsible") || ""),
        unit: (f.get("unit") || "mm") as Project["unit"],
        status: "draft",
        version: 1,
        createdAt: now(),
        updatedAt: now(),
      });
    else
      await db.environments.put({
        id,
        projectId: String(f.get("projectId")),
        name: String(f.get("name")),
        type: String(f.get("envType")),
        status: "active",
      });
    await queue(type, id, "create");
    saved();
  }
  return (
    <div className="modalback">
      <form ref={ref} className="modal" onSubmit={submit}>
        <div className="cardhead">
          <h2>
            {type === "client"
              ? "Novo cliente"
              : type === "project"
                ? "Novo projeto"
                : "Novo ambiente"}
          </h2>
          <button type="button" className="btn" onClick={close}>
            Fechar
          </button>
        </div>
        <div className="formgrid">
          {type === "project" && (
            <Field label="Cliente">
              <select name="clientId" required>
                {clients.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {type === "environment" && (
            <>
              <Field label="Projeto">
                <select name="projectId" required>
                  {projects.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tipo">
                <select name="envType">
                  {types.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </>
          )}
          <Field label="Nome">
            <input name="name" required autoFocus />
          </Field>
          {type === "client" && (
            <>
              <Field label="Telefone">
                <input name="phone" />
              </Field>
              <Field label="E-mail">
                <input type="email" name="email" />
              </Field>
              <Field label="Endereço" full>
                <input name="address" />
              </Field>
              <Field label="Observações internas" full>
                <textarea name="notes" rows={3} />
              </Field>
            </>
          )}
          {type === "project" && (
            <>
              <Field label="Endereço">
                <input name="address" />
              </Field>
              <Field label="Responsável">
                <input name="responsible" />
              </Field>
              <Field label="Unidade">
                <select name="unit">
                  <option value="mm">Milímetros</option>
                  <option value="cm">Centímetros</option>
                  <option value="m">Metros</option>
                </select>
              </Field>
            </>
          )}
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={close}>
            Cancelar
          </button>
          <button className="btn primary">
            <Save size={16} />
            Salvar no dispositivo
          </button>
        </div>
      </form>
    </div>
  );
}
function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`field ${full ? "full" : ""}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}
function Editor({
  envs,
  photos,
  notify,
}: {
  envs: Environment[];
  photos: Photo[];
  notify: (s: string) => void;
}) {
  const [photoId, setPhotoId] = useState(photos[0]?.id || ""),
    photo = photos.find((p) => p.id === photoId),
    anns =
      useLiveQuery<Annotation[]>(
        () =>
          photoId
            ? db.annotations.where("photoId").equals(photoId).toArray()
            : Promise.resolve<Annotation[]>([]),
        [photoId],
      ) || [],
    [tool, setTool] = useState("select"),
    [draftPoints, setDraftPoints] = useState<Array<{ x: number; y: number }>>(
      [],
    ),
    [selected, setSelected] = useState("");
  const file = useRef<HTMLInputElement>(null),
    canvas = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!photoId && photos[0]) setPhotoId(photos[0].id);
  }, [photos, photoId]);
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !envs[0]) return;
    const im = new Image(),
      url = URL.createObjectURL(f);
    im.onload = async () => {
      const id = uid();
      await db.photos.put({
        id,
        environmentId: envs[0].id,
        name: f.name,
        blob: f,
        width: im.width,
        height: im.height,
        syncState: "local",
        createdAt: now(),
      });
      await queue("photo", id, "upload");
      setPhotoId(id);
      URL.revokeObjectURL(url);
      notify("Foto original salva neste dispositivo");
    };
    im.src = url;
  }
  async function draw(e: React.PointerEvent) {
    if (!isAnnotationTool(tool) || !photo) return;
    const r = canvas.current!.getBoundingClientRect(),
      p = normalizePointer(e.clientX, e.clientY, r);
    const points = [...draftPoints, p],
      config = toolConfig[tool];
    if (points.length < config.points) {
      setDraftPoints(points);
      notify(`Ponto ${points.length} registrado`);
      return;
    }
    let value = "",
      secondaryValue: string | undefined,
      description = "";
    if (tool === "text") {
      value = prompt("Digite o texto:", "") ?? "";
      if (!value) return setDraftPoints([]);
    } else if (tool === "detail")
      description = prompt("Descrição da foto de detalhe:", "") ?? "";
    else if (tool === "point") {
      description =
        prompt(
          `Categoria: ${technicalCategories.join(", ")}`,
          technicalCategories[0],
        ) ?? "";
      value = prompt("Valor informado (opcional):", "") ?? "";
    } else {
      value =
        prompt(
          tool === "angle"
            ? "Informe o ângulo confirmado:"
            : "Informe a medida (somente número):",
          "",
        ) ?? "";
      const parsed = measurementValueSchema.safeParse(value.trim());
      if (!parsed.success) {
        notify("Informe somente o número da medida");
        return setDraftPoints([]);
      }
      value = parsed.data;
      if (tool === "l") {
        const second = prompt("Informe a segunda medida:", "") ?? "",
          parsedSecond = measurementValueSchema.safeParse(second.trim());
        if (!parsedSecond.success) {
          notify("Segunda medida inválida");
          return setDraftPoints([]);
        }
        secondaryValue = parsedSecond.data;
      }
    }
    const finalPoints =
      tool === "l"
        ? [points[0], { x: points[1].x, y: points[0].y }, points[1]]
        : points;
    const id = uid();
    await db.annotations.put({
      id,
      photoId: photo.id,
      type: config.type,
      code: nextCode(tool, anns),
      state: "protected",
      points: finalPoints,
      value,
      secondaryValue,
      textPosition: "above",
      description,
      layer: anns.length + 1,
      version: 1,
      updatedAt: now(),
    });
    await queue("annotation", id, "create");
    setDraftPoints([]);
    setTool("select");
    notify(`${config.label} salva e protegida`);
  }
  async function edit(a: Annotation) {
    const snapshot = structuredClone(a);
    await db.annotations.update(a.id, { state: "editing" });
    const value = prompt("Corrigir valor:", a.value);
    if (value === null) {
      await db.annotations.put(snapshot);
      notify("Alterações canceladas");
      return;
    }
    const parsed = measurementValueSchema.safeParse(value.trim());
    if (!parsed.success) {
      await db.annotations.put(snapshot);
      notify("Valor inválido; versão anterior restaurada");
      return;
    }
    await db.auditLogs.put({
      id: uid(),
      entity: "annotation",
      entityId: a.id,
      action: "update",
      metadata: { before: snapshot },
      createdAt: now(),
    });
    await db.annotations.update(a.id, {
      value: parsed.data,
      state: "protected",
      version: a.version + 1,
      updatedAt: now(),
    });
    await queue("annotation", a.id, "update");
  }
  async function duplicate(a: Annotation) {
    const id = uid(),
      copy = {
        ...structuredClone(a),
        id,
        code: `${a.code}-C`,
        points: a.points.map((p) => ({
          x: Math.min(1, p.x + 0.02),
          y: Math.min(1, p.y + 0.02),
        })),
        state: "protected" as const,
        layer: Math.max(0, ...anns.map((x) => x.layer)) + 1,
        version: 1,
        updatedAt: now(),
      };
    await db.annotations.put(copy);
    await queue("annotation", id, "create");
    notify("Marcação duplicada e protegida");
  }
  async function toggleHidden(a: Annotation) {
    await db.annotations.update(a.id, {
      state: a.state === "hidden" ? "protected" : "hidden",
      updatedAt: now(),
    });
    await queue("annotation", a.id, "update");
  }
  async function moveLayer(a: Annotation, direction: number) {
    await db.annotations.update(a.id, {
      layer: Math.max(0, a.layer + direction),
      version: a.version + 1,
      updatedAt: now(),
    });
    await queue("annotation", a.id, "update");
  }
  const url = useMemo(
    () => (photo ? URL.createObjectURL(photo.blob) : ""),
    [photo],
  );
  return (
    <>
      <Head
        eye="Editor vetorial"
        title="Medidas sobre a fotografia"
        sub="A imagem original nunca é alterada; as marcações ficam separadas."
        action={
          <>
            <input
              ref={file}
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/heic"
              onChange={upload}
            />
            <button
              className="btn primary"
              onClick={() => file.current?.click()}
            >
              <ImagePlus size={17} />
              Importar foto
            </button>
          </>
        }
      />
      <div className="workspace">
        <div className="tools">
          {[
            ["select", "↖ Selecionar"],
            ["linear", "↔ Medida"],
            ["l", "⌞ Medida em L"],
            ["angle", "∠ Ângulo"],
            ["point", "⊙ Ponto técnico"],
            ["text", "T Texto"],
            ["detail", "◉ Foto detalhe"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={`tool ${tool === id ? "active" : ""}`}
              onClick={() => setTool(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="canvaswrap">
          <div
            ref={canvas}
            className="canvas"
            onPointerDown={draw}
            style={
              photo ? { aspectRatio: `${photo.width}/${photo.height}` } : {}
            }
          >
            {photo ? (
              <>
                <img src={url} alt={photo.name} />
                {anns
                  .filter((a) => a.state !== "hidden")
                  .sort((a, b) => a.layer - b.layer)
                  .map((a) => (
                    <Measure
                      key={a.id}
                      a={a}
                      selected={a.id === selected}
                      click={() => setSelected(a.id)}
                    />
                  ))}
              </>
            ) : (
              <div className="emptycanvas">
                <div>
                  <ImagePlus size={42} />
                  <h3>Adicione uma fotografia</h3>
                  <p>Crie antes um projeto e ambiente.</p>
                </div>
              </div>
            )}
          </div>
          <div className="statusbar">
            <Lock size={12} style={{ display: "inline" }} /> Salvo neste
            dispositivo
          </div>
        </div>
        <aside className="inspector">
          <div className="cardhead">
            <h2>Marcações</h2>
            <span className="pill">{anns.length}</span>
          </div>
          {anns.map((a) => (
            <div
              key={a.id}
              className={`annotation-item ${a.id === selected ? "selected" : ""}`}
              onClick={() => setSelected(a.id)}
            >
              <strong>
                {a.code} · {a.value || "Pendente"}
              </strong>
              <small style={{ display: "block" }}>
                {a.state === "protected" ? "Protegida" : "Em edição"}
              </small>
              {a.id === selected && (
                <div
                  style={{
                    display: "flex",
                    gap: 5,
                    marginTop: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <button className="btn" onClick={() => edit(a)}>
                    <Lock size={13} />
                    Desbloquear
                  </button>
                  <select
                    aria-label="Posição do número"
                    value={a.textPosition}
                    onChange={async (e) => {
                      await db.annotations.update(a.id, {
                        textPosition: e.target
                          .value as Annotation["textPosition"],
                        version: a.version + 1,
                        updatedAt: now(),
                      });
                      await queue("annotation", a.id, "update");
                    }}
                  >
                    <option value="between">Entre</option>
                    <option value="above">Acima</option>
                    <option value="below">Abaixo</option>
                    <option value="left">Esquerda</option>
                    <option value="right">Direita</option>
                    <option value="free">Livre</option>
                  </select>
                  <button
                    className="btn danger"
                    onClick={() => toggleHidden(a)}
                  >
                    <Trash2 size={13} />
                    {a.state === "hidden" ? "Restaurar" : "Ocultar"}
                  </button>
                  <button className="btn" onClick={() => duplicate(a)}>
                    Duplicar
                  </button>
                  <button
                    className="btn"
                    aria-label="Trazer para frente"
                    onClick={() => moveLayer(a, 1)}
                  >
                    Camada +
                  </button>
                  <button
                    className="btn"
                    aria-label="Enviar para trás"
                    onClick={() => moveLayer(a, -1)}
                  >
                    Camada -
                  </button>
                </div>
              )}
            </div>
          ))}
          {photo && (
            <button
              className="btn"
              style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
              onClick={() =>
                exportAnnotatedPng(photo, anns)
                  .then(() =>
                    notify("PNG exportado sem alterar a foto original"),
                  )
                  .catch(() => notify("Falha ao exportar PNG"))
              }
            >
              <Download size={14} />
              Exportar PNG
            </button>
          )}
        </aside>
      </div>
    </>
  );
}
function Measure({
  a,
  selected,
  click,
}: {
  a: Annotation;
  selected: boolean;
  click: () => void;
}) {
  if (a.type === "technical" || a.type === "detail" || a.type === "text") {
    const p = a.points[0];
    return (
      <button
        className={`point-marker ${a.type} ${selected ? "selected" : ""}`}
        onClick={click}
        style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
        aria-label={`${a.code} ${a.description}`}
      >
        <strong>{a.code}</strong>
        <span>{a.type === "text" ? a.value : a.description}</span>
      </button>
    );
  }
  if (a.type === "l-shape" && a.points.length === 3) {
    return (
      <>
        {[0, 1].map((i) => (
          <Measure
            key={i}
            a={{
              ...a,
              type: "linear",
              points: [a.points[i], a.points[i + 1]],
              value: i === 0 ? a.value : a.secondaryValue || "?",
            }}
            selected={selected}
            click={click}
          />
        ))}
      </>
    );
  }
  if (a.type === "angle" && a.points.length === 3) {
    return (
      <button
        className="angle-marker"
        onClick={click}
        style={{
          left: `${a.points[1].x * 100}%`,
          top: `${a.points[1].y * 100}%`,
        }}
      >
        {a.value}°
      </button>
    );
  }
  if (a.points.length < 2) return null;
  const [p1, p2] = a.points,
    dx = (p2.x - p1.x) * 100,
    dy = (p2.y - p1.y) * 100,
    len = Math.hypot(dx, dy),
    ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <div
      className="measure"
      onClick={click}
      style={{
        left: `${p1.x * 100}%`,
        top: `${p1.y * 100}%`,
        width: `${len}%`,
        transform: `rotate(${ang}deg)`,
        height: selected ? 5 : 3,
        pointerEvents: "auto",
      }}
    >
      <span>{a.value || "?"}</span>
    </div>
  );
}
function FloorPlan({ envs }: { envs: Environment[] }) {
  return <InteractiveFloorPlan environment={envs[0]} />;
}
function InteractiveFloorPlan({ environment }: { environment?: Environment }) {
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]),
    [mode, setMode] = useState<"wall" | "door" | "window" | "camera">("wall"),
    [elements, setElements] = useState<FloorPlanElement[]>([]),
    [confirmed, setConfirmed] = useState(false),
    [hydratedEnvironment, setHydratedEnvironment] = useState(""),
    [selected, setSelected] = useState<
      { kind: "point"; index: number } | { kind: "element"; id: string } | null
    >(null),
    [dragging, setDragging] = useState(false);
  const plan = useLiveQuery<FloorPlanRecord | undefined>(
    () =>
      environment
        ? db.floorPlans.where("environmentId").equals(environment.id).first()
        : Promise.resolve<FloorPlanRecord | undefined>(undefined),
    [environment?.id],
  );
  const environmentPhotos =
    useLiveQuery<Photo[]>(
      () =>
        environment
          ? db.photos.where("environmentId").equals(environment.id).toArray()
          : Promise.resolve<Photo[]>([]),
      [environment?.id],
    ) || [];
  useEffect(() => {
    if (
      !environment ||
      plan === undefined ||
      hydratedEnvironment === environment.id
    )
      return;
    setPoints(plan?.points || []);
    setElements(plan?.elements || []);
    setConfirmed(plan?.confirmed || false);
    setHydratedEnvironment(environment.id);
  }, [environment, plan, hydratedEnvironment]);
  useEffect(() => {
    if (!environment || hydratedEnvironment !== environment.id) return;
    const timer = setTimeout(async () => {
      const existing = await db.floorPlans
        .where("environmentId")
        .equals(environment.id)
        .first();
      const timestamp = now(),
        id = existing?.id || uid();
      await db.transaction("rw", db.floorPlans, db.syncOperations, async () => {
        await db.floorPlans.put({
          id,
          environmentId: environment.id,
          points,
          elements,
          confirmed,
          version: (existing?.version || 0) + 1,
          createdAt: existing?.createdAt || timestamp,
          updatedAt: timestamp,
        });
        await queue("floorPlan", id, existing ? "update" : "create");
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [points, elements, confirmed, environment, hydratedEnvironment]);
  function add(e: React.PointerEvent<HTMLDivElement>) {
    if (confirmed || !environment || e.target !== e.currentTarget) return;
    const r = e.currentTarget.getBoundingClientRect(),
      p = normalizePointer(e.clientX, e.clientY, r);
    if (mode === "wall") setPoints((v) => [...v, p]);
    else setElements((v) => [...v, { id: uid(), type: mode, ...p }]);
  }
  function pointerPosition(e: React.PointerEvent<SVGSVGElement>) {
    return normalizePointer(
      e.clientX,
      e.clientY,
      e.currentTarget.getBoundingClientRect(),
    );
  }
  function moveSelected(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragging || !selected || confirmed) return;
    const p = pointerPosition(e);
    if (selected.kind === "point")
      setPoints((items) =>
        items.map((item, index) => (index === selected.index ? p : item)),
      );
    else
      setElements((items) =>
        items.map((item) =>
          item.id === selected.id ? { ...item, ...p } : item,
        ),
      );
  }
  function removeSelected() {
    if (!selected || confirmed) return;
    if (selected.kind === "point")
      setPoints((items) => items.filter((_, i) => i !== selected.index));
    else
      setElements((items) => items.filter((item) => item.id !== selected.id));
    setSelected(null);
  }
  return (
    <>
      <Head
        eye="Planta baixa"
        title="Desenho do ambiente"
        sub="Desenhe a geometria real; o sistema organiza traços, mas não cria medidas."
      />
      {!environment && (
        <section className="card empty">
          <h2>Crie um ambiente antes da planta</h2>
          <p>A planta precisa permanecer vinculada ao ambiente correto.</p>
        </section>
      )}
      <div className="grid">
        <section className="card wide">
          <div className="floorplan" onPointerDown={add}>
            <svg
              viewBox="0 0 1000 600"
              aria-label="Planta baixa vetorial"
              onPointerMove={moveSelected}
              onPointerUp={() => setDragging(false)}
              onPointerCancel={() => setDragging(false)}
              onPointerLeave={() => setDragging(false)}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget)
                  add(e as unknown as React.PointerEvent<HTMLDivElement>);
              }}
            >
              {points.slice(1).map((p, i) => (
                <g key={i}>
                  <line
                    x1={points[i].x * 1000}
                    y1={points[i].y * 600}
                    x2={p.x * 1000}
                    y2={p.y * 600}
                    stroke="#163b59"
                    strokeWidth="9"
                  />
                  <text
                    x={(points[i].x + p.x) * 500}
                    y={(points[i].y + p.y) * 300 - 12}
                    fill="#075da9"
                  >
                    Parede {wallCode(i)}
                  </text>
                </g>
              ))}
              {points.map((p, i) => (
                <circle
                  key={`p${i}`}
                  cx={p.x * 1000}
                  cy={p.y * 600}
                  r={
                    selected?.kind === "point" && selected.index === i ? 16 : 10
                  }
                  fill={
                    selected?.kind === "point" && selected.index === i
                      ? "#f59e0b"
                      : "#0876db"
                  }
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (confirmed) return;
                    setSelected({ kind: "point", index: i });
                    setDragging(true);
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                />
              ))}
              {elements.map((el) => (
                <g
                  key={el.id}
                  transform={`translate(${el.x * 1000} ${el.y * 600})`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (confirmed) return;
                    setSelected({ kind: "element", id: el.id });
                    setDragging(true);
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                >
                  <circle
                    r="18"
                    fill={el.type === "camera" ? "#7a3fe0" : "#fff"}
                    stroke={
                      selected?.kind === "element" && selected.id === el.id
                        ? "#f59e0b"
                        : "#0876db"
                    }
                    strokeWidth="4"
                  />
                  {el.type === "door" && (
                    <path
                      d="M 0 0 L 38 0 A 38 38 0 0 1 0 38"
                      fill="none"
                      stroke="#0876db"
                      strokeWidth="4"
                      transform={`rotate(${el.direction || 0})`}
                    />
                  )}
                  <text x="25" y="6" style={{ pointerEvents: "none" }}>
                    {el.type}
                    {el.type === "camera" && el.photoId ? " • foto" : ""}
                  </text>
                </g>
              ))}
            </svg>
            {!points.length && (
              <div className="emptycanvas">
                <p>Toque ou clique para iniciar o contorno livre.</p>
              </div>
            )}
          </div>
        </section>
        <aside className="card aside">
          <h2>Ferramentas da planta</h2>
          <div className="actions" style={{ flexWrap: "wrap" }}>
            {(["wall", "door", "window", "camera"] as const).map((x) => (
              <button
                key={x}
                className={`btn ${mode === x ? "primary" : ""}`}
                onClick={() => setMode(x)}
              >
                {x}
              </button>
            ))}
          </div>
          <button
            className="btn"
            onClick={() => setPoints(rectifyPath(points))}
          >
            Prévia de linhas retas
          </button>
          <button className="btn" onClick={() => setConfirmed((v) => !v)}>
            {confirmed ? "Editar novamente" : "Confirmar planta"}
          </button>
          {selected?.kind === "element" &&
            elements.find((item) => item.id === selected.id)?.type ===
              "door" && (
              <button
                className="btn"
                disabled={confirmed}
                onClick={() =>
                  setElements((items) =>
                    items.map((item) =>
                      item.id === selected.id
                        ? {
                            ...item,
                            direction: ((item.direction || 0) + 90) % 360,
                          }
                        : item,
                    ),
                  )
                }
              >
                Girar abertura da porta
              </button>
            )}
          {selected?.kind === "element" &&
            elements.find((item) => item.id === selected.id)?.type ===
              "camera" && (
              <label className="field">
                <span>Foto vinculada à câmera</span>
                <select
                  disabled={confirmed}
                  value={
                    elements.find((item) => item.id === selected.id)?.photoId ||
                    ""
                  }
                  onChange={(e) =>
                    setElements((items) =>
                      items.map((item) =>
                        item.id === selected.id
                          ? { ...item, photoId: e.target.value || undefined }
                          : item,
                      ),
                    )
                  }
                >
                  <option value="">Sem foto vinculada</option>
                  {environmentPhotos.map((photo) => (
                    <option key={photo.id} value={photo.id}>
                      {photo.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          <button
            className="btn danger"
            disabled={!selected || confirmed}
            onClick={removeSelected}
          >
            Excluir item selecionado
          </button>
          <button
            className="btn danger"
            onClick={() => {
              setPoints([]);
              setElements([]);
              setConfirmed(false);
            }}
          >
            Limpar rascunho
          </button>
          <p className="subtitle">
            {points.length > 1
              ? `${points.length - 1} paredes · ${elements.length} elementos · nenhuma medida criada`
              : "Aguardando o primeiro traço"}
          </p>
        </aside>
      </div>
    </>
  );
}
// Mantido temporariamente durante a migração visual; será removido quando a planta persistente substituir todos os estados.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FloorPlanLegacy() {
  return (
    <>
      <Head
        eye="Planta baixa"
        title="Desenho do ambiente"
        sub="Paredes e aberturas vetoriais editáveis, sem inventar dimensões."
      />
      <div className="grid">
        <section className="card wide">
          <div className="floorplan">
            <div
              className="wall"
              style={{ left: "18%", top: "20%", width: "55%" }}
            />
            <div
              className="wall"
              style={{
                left: "73%",
                top: "20%",
                width: "50%",
                transform: "rotate(90deg)",
              }}
            />
            <div
              className="wall"
              style={{ left: "18%", top: "72%", width: "55%" }}
            />
            <div
              className="wall"
              style={{
                left: "18%",
                top: "20%",
                width: "52%",
                transform: "rotate(90deg)",
              }}
            />
            <div className="door" style={{ left: "18%", top: "52%" }} />
          </div>
        </section>
        <aside className="card aside">
          <h2>Elementos</h2>
          <p className="subtitle">
            Parede · Porta · Janela · Vão · Coluna · Câmera
          </p>
          <button className="btn">Retificar traços</button>
        </aside>
      </div>
    </>
  );
}
function Sync({ pending }: { pending: number }) {
  return (
    <>
      <Head
        eye="Offline-first"
        title="Sincronização segura"
        sub="A cópia local só sai após confirmação válida do servidor."
      />
      <div className="grid">
        <Metric label="Na fila" value={pending} />
        <Metric label="Falhas" value={0} />
        <Metric label="Conflitos" value={0} />
        <Metric label="Dispositivos" value={1} />
        <section className="card full">
          <h2>Fila local protegida</h2>
          <div className="progress" style={{ marginTop: 18 }}>
            <i />
          </div>
          <p className="subtitle" style={{ marginTop: 12 }}>
            Configure a API remota para enviar os itens. Nada será apagado
            localmente.
          </p>
        </section>
      </div>
    </>
  );
}
function Portal({ projects }: { projects: Project[] }) {
  const [qr, setQr] = useState("");
  useEffect(() => {
    QRCode.toDataURL(`${location.origin}/p/desenvolvimento-seguro`, {
      margin: 2,
      width: 180,
    }).then(setQr);
  }, []);
  return (
    <>
      <Head
        eye="Entrega controlada"
        title="Portal do cliente"
        sub="Somente a versão publicada pode ser visualizada ou baixada."
      />
      <section className="portal-cover">
        <div className="eyebrow" style={{ color: "#8ecbff" }}>
          Pasta digital
        </div>
        <h1>
          {projects[0]?.name || "Apartamento Centro — Levantamento Completo"}
        </h1>
        <p>Versão publicada 1 · acesso somente leitura</p>
      </section>
      <div className="portal-grid">
        <div className="portal-tile">
          <Map />
          <h2>Ambientes e plantas</h2>
          <p className="subtitle">Navegação sem permissão de edição.</p>
        </div>
        <div className="portal-tile">
          <FileText />
          <h2>PDF técnico</h2>
          <button className="btn" onClick={() => pdf(projects[0])}>
            <Download size={15} />
            Gerar PDF local
          </button>
        </div>
        <div className="portal-tile">
          {qr && (
            <img
              src={qr}
              width="130"
              height="130"
              alt="QR Code de desenvolvimento"
            />
          )}
          <h2>Código: DEMO-4827</h2>
          <p className="subtitle">Token revogável e sem dados pessoais.</p>
        </div>
      </div>
    </>
  );
}
async function blobDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
async function pdf(p?: Project) {
  const d = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const project = p || (await db.projects.toCollection().first()),
    environments = project
      ? await db.environments.where("projectId").equals(project.id).toArray()
      : [],
    pageWidth = 297;
  const header = (title: string, subtitle: string) => {
    d.setFillColor(9, 44, 76);
    d.rect(0, 0, pageWidth, 23, "F");
    d.setTextColor(255);
    d.setFontSize(15);
    d.text(title, 14, 14);
    d.setFontSize(8);
    d.text(subtitle, 283, 14, { align: "right" });
    d.setTextColor(30);
  };
  const footer = () => {
    d.setDrawColor(210);
    d.line(14, 198, 283, 198);
    d.setFontSize(8);
    d.setTextColor(90);
    d.text("Documento técnico - nenhuma medida estimada", 14, 204);
    d.text(String(d.getNumberOfPages()), 283, 204, { align: "right" });
  };
  d.setFillColor(9, 44, 76);
  d.rect(0, 0, pageWidth, 62, "F");
  d.setTextColor(255);
  d.setFontSize(25);
  d.text("MEDIDAS FINAIS PARA PRODUÇÃO", 18, 32);
  d.setTextColor(30);
  d.setFontSize(18);
  d.text(project?.name || "Projeto sem título", 18, 83);
  d.setFontSize(10);
  d.text(
    `Unidade: ${project?.unit || "não informada"} | Versão: ${project?.version || 1}`,
    18,
    97,
  );
  d.text(project?.address || "Endereço não informado", 18, 108);
  d.text("Documento estruturado. Nenhuma medida foi estimada.", 18, 126);
  footer();

  d.addPage();
  header("ÍNDICE DE AMBIENTES", project?.name || "Projeto");
  d.setFontSize(11);
  if (!environments.length) d.text("Nenhum ambiente cadastrado.", 18, 42);
  environments.forEach((environment, index) => {
    d.text(
      `${index + 1}. ${environment.name} - ${environment.type}`,
      18,
      42 + index * 8,
    );
  });
  footer();

  for (const environment of environments) {
    const plan = await db.floorPlans
        .where("environmentId")
        .equals(environment.id)
        .first(),
      environmentPhotos = await db.photos
        .where("environmentId")
        .equals(environment.id)
        .toArray();
    d.addPage();
    header(
      environment.name.toUpperCase(),
      `${environment.type} | Planta baixa`,
    );
    d.setDrawColor(205);
    d.roundedRect(14, 31, 269, 155, 2, 2);
    if (!plan?.points.length) {
      d.setFontSize(11);
      d.text("Planta baixa não cadastrada.", 24, 48);
    } else {
      const box = { x: 24, y: 40, w: 240, h: 132 };
      d.setLineWidth(1.2);
      d.setDrawColor(22, 59, 89);
      plan.points.slice(1).forEach((point, index) => {
        const previous = plan.points[index];
        d.line(
          box.x + previous.x * box.w,
          box.y + previous.y * box.h,
          box.x + point.x * box.w,
          box.y + point.y * box.h,
        );
        d.setFontSize(8);
        d.setTextColor(7, 93, 169);
        d.text(
          `Parede ${wallCode(index)}`,
          box.x + ((previous.x + point.x) / 2) * box.w,
          box.y + ((previous.y + point.y) / 2) * box.h - 2,
        );
      });
      plan.elements.forEach((element) => {
        const x = box.x + element.x * box.w,
          y = box.y + element.y * box.h;
        d.setFillColor(
          element.type === "camera" ? 122 : 255,
          element.type === "camera" ? 63 : 255,
          element.type === "camera" ? 224 : 255,
        );
        d.circle(x, y, 2.5, "FD");
        d.setFontSize(7);
        d.text(element.type, x + 4, y + 2);
      });
    }
    footer();

    for (const photo of environmentPhotos) {
      d.addPage();
      header(environment.name.toUpperCase(), photo.name);
      const sourceWidth = Math.max(photo.width, 1),
        sourceHeight = Math.max(photo.height, 1),
        maxWidth = 220,
        maxHeight = 155,
        scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight),
        width = sourceWidth * scale,
        height = sourceHeight * scale,
        x = (pageWidth - width) / 2,
        y = 29 + (160 - height) / 2;
      try {
        d.addImage(await blobDataUrl(photo.blob), x, y, width, height);
      } catch {
        d.setFontSize(10);
        d.text("Foto indisponível para renderização.", 18, 45);
      }
      const annotations = await db.annotations
        .where("photoId")
        .equals(photo.id)
        .toArray();
      annotations
        .filter((annotation) => annotation.state !== "hidden")
        .forEach((annotation) => {
          if (annotation.points.length > 1) {
            const [start, end] = annotation.points;
            d.setDrawColor(230, 47, 47);
            d.setLineWidth(0.8);
            d.line(
              x + start.x * width,
              y + start.y * height,
              x + end.x * width,
              y + end.y * height,
            );
            if (annotation.value) {
              d.setFillColor(255, 255, 255);
              d.setTextColor(170, 20, 20);
              d.setFontSize(8);
              d.text(
                `${annotation.code}: ${annotation.value}`,
                x + ((start.x + end.x) / 2) * width,
                y + ((start.y + end.y) / 2) * height - 2,
                { align: "center" },
              );
            }
          }
        });
      footer();
    }
  }
  d.save("medidas-finais-para-producao.pdf");
}
