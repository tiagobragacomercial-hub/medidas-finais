"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, now, queue, uid } from "../database/local/db";
import type {
  Annotation,
  Client,
  Environment,
  FloorPlanElement,
  FloorPlanMeasurement,
  FloorPlanRecord,
  FloorPlanText,
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
  Mic,
  Plus,
  QrCode,
  Save,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import QRCode from "qrcode";
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
import { getSupabase } from "../database/remote/supabase";
type Section =
  | "dashboard"
  | "clients"
  | "projects"
  | "editor"
  | "floorplan"
  | "sync"
  | "voice"
  | "portal"
  | "settings";
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
    [selectedProjectId, setSelectedProjectId] = useState(""),
    [selectedEnvironmentId, setSelectedEnvironmentId] = useState(""),
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
  const selectedProjectEnvironments = selectedProjectId
    ? envs.filter((environment) => environment.projectId === selectedProjectId)
    : envs,
    firstProjectId = projects[0]?.id;
  useEffect(() => {
    if (!selectedProjectId && firstProjectId) setSelectedProjectId(firstProjectId);
  }, [firstProjectId, selectedProjectId]);
  useEffect(() => {
    const available = selectedProjectEnvironments;
    if (!available.some((environment) => environment.id === selectedEnvironmentId))
      setSelectedEnvironmentId(available[0]?.id || "");
  }, [selectedEnvironmentId, selectedProjectEnvironments]);
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
          <button
            className={`navbtn ${!['portal', 'settings'].includes(section) ? 'active' : ''}`}
            onClick={() => setSection("dashboard")}
          >
            Operação
          </button>
          <button
            className={`navbtn ${section === 'portal' ? 'active' : ''}`}
            onClick={() => setSection("portal")}
          >
            Publicações
          </button>
          <button
            className={`navbtn ${section === 'settings' ? 'active' : ''}`}
            onClick={() => setSection("settings")}
          >
            Administração
          </button>
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
            icon={<Mic />}
            label="Assistente de voz"
            active={section === "voice"}
            click={() => setSection("voice")}
          />
          <Side
            icon={<QrCode />}
            label="Portal do cliente"
            active={section === "portal"}
            click={() => setSection("portal")}
          />
          <Side
            icon={<Settings />}
            label="Configurações"
            active={section === "settings"}
            click={() => setSection("settings")}
          />
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
              newClient={() => setModal("client")}
              newProject={() => setModal("project")}
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
              open={(projectId) => {
                setSelectedProjectId(projectId);
                const environment = envs.find((item) => item.projectId === projectId);
                setSelectedEnvironmentId(environment?.id || "");
                setSection("editor");
              }}
            />
          )}{" "}
          {section === "editor" && (
            <Editor
              envs={selectedProjectEnvironments}
              photos={photos}
              environmentId={selectedEnvironmentId}
              selectEnvironment={setSelectedEnvironmentId}
              notify={setToast}
            />
          )}{" "}
          {section === "floorplan" && (
            <FloorPlan
              envs={selectedProjectEnvironments}
              environmentId={selectedEnvironmentId}
              selectEnvironment={setSelectedEnvironmentId}
            />
          )}{" "}
          {section === "sync" && <Sync pending={pending} />}{" "}
          {section === "voice" && (
            <VoiceAssistant go={setSection} openModal={setModal} />
          )}{" "}
          {section === "portal" && (
            <Portal
              projects={projects}
              projectId={selectedProjectId}
              selectProject={setSelectedProjectId}
            />
          )}
          {section === "settings" && <SettingsPanel />}
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
  newClient,
  newProject,
}: {
  clients: Client[];
  projects: Project[];
  envs: Environment[];
  photos: Photo[];
  pending: number;
  go: (s: Section) => void;
  newClient: () => void;
  newProject: () => void;
}) {
  return (
    <>
      <Head
        eye="Painel operacional"
        title="Bom trabalho, Franciane"
        sub="Seus levantamentos ficam seguros neste dispositivo, mesmo sem internet."
        action={
          <button
            className="btn primary"
            onClick={
              !clients.length
                ? newClient
                : !projects.length
                  ? newProject
                  : () => go("projects")
            }
          >
            <Plus size={17} />
            {!clients.length
              ? "Cadastrar primeiro cliente"
              : !projects.length
                ? "Criar primeiro projeto"
                : "Novo levantamento"}
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
  open,
}: {
  projects: Project[];
  clients: Client[];
  add: () => void;
  addEnv: () => void;
  open: (projectId: string) => void;
}) {
  return (
    <>
      <Head
        eye="Levantamentos"
        title="Projetos"
        sub="Organize ambientes, fotos e versões de cada entrega."
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={addEnv} disabled={!projects.length}>
              + Ambiente
            </button>
            <button className="btn primary" onClick={add} disabled={!clients.length}>
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
              onClick={() => open(p.id)}
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
  environmentId,
  selectEnvironment,
  notify,
}: {
  envs: Environment[];
  photos: Photo[];
  environmentId: string;
  selectEnvironment: (environmentId: string) => void;
  notify: (s: string) => void;
}) {
  const environmentMedia = photos.filter(
      (item) => item.environmentId === environmentId,
    ),
    environmentPhotos = environmentMedia.filter(
      (item) => !item.mediaType || item.mediaType === "image",
    ),
    environmentVideos = environmentMedia.filter(
      (item) => item.mediaType === "video",
    ),
    [photoId, setPhotoId] = useState(""),
    photo = environmentPhotos.find((p) => p.id === photoId),
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
    [selected, setSelected] = useState(""),
    [photoDrag, setPhotoDrag] = useState<{
      annotationId: string;
      target: "start" | "end" | "label";
    } | null>(null);
  const file = useRef<HTMLInputElement>(null),
    canvas = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!environmentPhotos.some((item) => item.id === photoId))
      setPhotoId(environmentPhotos[0]?.id || "");
  }, [environmentPhotos, photoId]);
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    const environment = envs.find((item) => item.id === environmentId);
    if (!f || !environment) {
      notify("Selecione ou crie um ambiente antes de importar a foto");
      return;
    }
    const url = URL.createObjectURL(f);
    const saveMedia = async (
      width: number,
      height: number,
      mediaType: "image" | "video",
      durationSeconds?: number,
    ) => {
      const id = uid();
      await db.photos.put({
        id,
        environmentId: environment.id,
        name: f.name,
        blob: f,
        width,
        height,
        mediaType,
        mimeType: f.type,
        durationSeconds,
        syncState: "local",
        createdAt: now(),
      });
      await queue("photo", id, "upload");
      if (mediaType === "image") setPhotoId(id);
      URL.revokeObjectURL(url);
      e.target.value = "";
      notify(
        mediaType === "video"
          ? "Vídeo original salvo neste dispositivo"
          : "Foto original salva neste dispositivo",
      );
    };
    if (f.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () =>
        void saveMedia(video.videoWidth, video.videoHeight, "video", video.duration);
      video.onerror = () => {
        URL.revokeObjectURL(url);
        notify("Formato de vídeo não suportado neste navegador");
      };
      video.src = url;
    } else {
      const image = new Image();
      image.onload = () => void saveMedia(image.width, image.height, "image");
      image.onerror = () => {
        URL.revokeObjectURL(url);
        notify("Formato de imagem não suportado neste navegador");
      };
      image.src = url;
    }
  }
  async function draw(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("[data-annotation-control]")) return;
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
  async function movePhotoAnnotation(e: React.PointerEvent<HTMLDivElement>) {
    if (!photoDrag || !canvas.current) return;
    const point = normalizePointer(e.clientX, e.clientY, canvas.current.getBoundingClientRect());
    const annotation = await db.annotations.get(photoDrag.annotationId);
    if (!annotation) return;
    if (photoDrag.target === "label")
      await db.annotations.update(annotation.id, { labelPoint: point, updatedAt: now() });
    else {
      const index = photoDrag.target === "start" ? 0 : annotation.points.length - 1;
      await db.annotations.update(annotation.id, {
        points: annotation.points.map((item, itemIndex) => itemIndex === index ? point : item),
        updatedAt: now(),
      });
    }
  }
  async function finishPhotoDrag() {
    if (!photoDrag) return;
    const annotation = await db.annotations.get(photoDrag.annotationId);
    if (annotation)
      await db.annotations.update(annotation.id, { version: annotation.version + 1, updatedAt: now() });
    await queue("annotation", photoDrag.annotationId, "update");
    setPhotoDrag(null);
    notify("Posição salva neste dispositivo");
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
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!photo) {
      setUrl("");
      return;
    }
    const nextUrl = URL.createObjectURL(photo.blob);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [photo]);
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
              accept="image/jpeg,image/png,image/heic,video/mp4,video/quicktime,video/webm"
              onChange={upload}
            />
            <button
              className="btn primary"
              onClick={() => file.current?.click()}
            >
              <ImagePlus size={17} />
              Importar foto ou vídeo
            </button>
          </>
        }
      />
      <section className="card" style={{ marginBottom: 14 }}>
        <div className="actions" style={{ alignItems: "end", flexWrap: "wrap" }}>
          <label className="field" style={{ minWidth: 240 }}>
            <span>Ambiente</span>
            <select
              value={environmentId}
              onChange={(event) => selectEnvironment(event.target.value)}
            >
              <option value="">Selecione um ambiente</option>
              {envs.map((environment) => (
                <option key={environment.id} value={environment.id}>
                  {environment.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field" style={{ minWidth: 240 }}>
            <span>Fotografia</span>
            <select
              value={photoId}
              disabled={!environmentPhotos.length}
              onChange={(event) => setPhotoId(event.target.value)}
            >
              <option value="">Nenhuma fotografia</option>
              {environmentPhotos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      {environmentVideos.length > 0 && (
        <section className="card" style={{ marginBottom: 14 }}>
          <div className="cardhead">
            <h2>Vídeos do ambiente</h2>
            <span className="pill">{environmentVideos.length}</span>
          </div>
          <div className="grid">
            {environmentVideos.map((video) => (
              <EnvironmentVideo key={video.id} media={video} />
            ))}
          </div>
        </section>
      )}
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
            onPointerMove={movePhotoAnnotation}
            onPointerUp={finishPhotoDrag}
            onPointerCancel={finishPhotoDrag}
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
                      startDrag={(target) => {
                        setSelected(a.id);
                        setPhotoDrag({ annotationId: a.id, target });
                      }}
                      showHandles={tool === "select"}
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

function EnvironmentVideo({ media }: { media: Photo }) {
  const url = useMemo(() => URL.createObjectURL(media.blob), [media.blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <article className="card" style={{ gridColumn: "span 6" }}>
      <video
        controls
        preload="metadata"
        src={url}
        style={{ width: "100%", maxHeight: 320, borderRadius: 12, background: "#111" }}
      />
      <strong>{media.name}</strong>
      <small style={{ display: "block" }}>
        {media.durationSeconds
          ? `${Math.round(media.durationSeconds)} segundos · salvo neste dispositivo`
          : "Salvo neste dispositivo"}
      </small>
    </article>
  );
}

function Measure({
  a,
  selected,
  click,
  startDrag,
  showHandles,
}: {
  a: Annotation;
  selected: boolean;
  click: () => void;
  startDrag: (target: "start" | "end" | "label") => void;
  showHandles: boolean;
}) {
  if (a.type === "technical" || a.type === "detail" || a.type === "text") {
    const p = a.points[0];
    return (
      <button
        className={`point-marker ${a.type} ${selected ? "selected" : ""}`}
        onClick={click}
        onPointerDown={(event) => {
          event.stopPropagation();
          event.currentTarget.setPointerCapture(event.pointerId);
          startDrag("label");
        }}
        data-annotation-control
        style={{
          left: `${(a.labelPoint?.x ?? p.x) * 100}%`,
          top: `${(a.labelPoint?.y ?? p.y) * 100}%`,
        }}
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
              labelPoint: undefined,
              value: i === 0 ? a.value : a.secondaryValue || "?",
            }}
            selected={selected}
            click={click}
            startDrag={startDrag}
            showHandles={showHandles}
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
    ang = (Math.atan2(dy, dx) * 180) / Math.PI,
    label = a.labelPoint || {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  return (
    <>
      <div
        className="measure"
        style={{
          left: `${p1.x * 100}%`,
          top: `${p1.y * 100}%`,
          width: `${len}%`,
          transform: `rotate(${ang}deg)`,
          height: selected ? 5 : 3,
          pointerEvents: "none",
        }}
      />
      <button
        className="point-marker text"
        data-annotation-control
        onClick={click}
        onPointerDown={(event) => {
          event.stopPropagation();
          event.currentTarget.setPointerCapture(event.pointerId);
          startDrag("label");
        }}
        style={{ left: `${label.x * 100}%`, top: `${label.y * 100}%` }}
      >
        {a.value || "?"}
      </button>
      {selected && showHandles &&
        [p1, p2].map((point, index) => (
          <button
            key={index}
            aria-label={index ? "Mover ponto final" : "Mover ponto inicial"}
            data-annotation-control
            onPointerDown={(event) => {
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
              startDrag(index ? "end" : "start");
            }}
            style={{
              position: "absolute",
              left: `${point.x * 100}%`,
              top: `${point.y * 100}%`,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#0876db",
              border: "3px solid white",
              transform: "translate(-50%, -50%)",
              zIndex: 8,
            }}
          />
        ))}
    </>
  );
}
function FloorPlan({
  envs,
  environmentId,
  selectEnvironment,
}: {
  envs: Environment[];
  environmentId: string;
  selectEnvironment: (environmentId: string) => void;
}) {
  return (
    <>
      <section className="card" style={{ marginBottom: 14 }}>
        <label className="field" style={{ maxWidth: 420 }}>
          <span>Ambiente da planta</span>
          <select
            value={environmentId}
            onChange={(event) => selectEnvironment(event.target.value)}
          >
            <option value="">Selecione um ambiente</option>
            {envs.map((environment) => (
              <option key={environment.id} value={environment.id}>
                {environment.name}
              </option>
            ))}
          </select>
        </label>
      </section>
      <InteractiveFloorPlan
        key={environmentId || "empty"}
        environment={envs.find((item) => item.id === environmentId)}
      />
    </>
  );
}
function InteractiveFloorPlan({ environment }: { environment?: Environment }) {
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]),
    [strokes, setStrokes] = useState<Array<Array<{ x: number; y: number }>>>([]),
    [mode, setMode] = useState<
      "wall" | "door" | "window" | "camera" | "measure" | "text"
    >("wall"),
    [elements, setElements] = useState<FloorPlanElement[]>([]),
    [measurements, setMeasurements] = useState<FloorPlanMeasurement[]>([]),
    [texts, setTexts] = useState<FloorPlanText[]>([]),
    [measurementStart, setMeasurementStart] = useState<{
      x: number;
      y: number;
    } | null>(null),
    [confirmed, setConfirmed] = useState(false),
    [hydratedEnvironment, setHydratedEnvironment] = useState(""),
    [selected, setSelected] = useState<
      | { kind: "point"; strokeIndex: number; index: number }
      | { kind: "element"; id: string }
      | { kind: "measurement"; id: string }
      | { kind: "text"; id: string }
      | null
    >(null),
    [dragging, setDragging] = useState(false),
    [drawingStroke, setDrawingStroke] = useState(false),
    [dragPart, setDragPart] = useState<
      "item" | "start" | "end" | "label"
    >("item");
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
  const floorPlanProject = useLiveQuery<Project | undefined>(
    () =>
      environment
        ? db.projects.get(environment.projectId)
        : Promise.resolve<Project | undefined>(undefined),
    [environment?.projectId],
  );
  useEffect(() => {
    if (
      !environment ||
      plan === undefined ||
      hydratedEnvironment === environment.id
    )
      return;
    setPoints(plan?.points || []);
    setStrokes(
      plan?.strokes?.length
        ? plan.strokes
        : plan?.points?.length
          ? [plan.points]
          : [],
    );
    setElements(plan?.elements || []);
    setMeasurements(plan?.measurements || []);
    setTexts(plan?.texts || []);
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
          points: strokes[0] || points,
          strokes,
          elements,
          measurements,
          texts,
          confirmed,
          version: (existing?.version || 0) + 1,
          createdAt: existing?.createdAt || timestamp,
          updatedAt: timestamp,
        });
        await queue("floorPlan", id, existing ? "update" : "create");
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [
    points,
    strokes,
    elements,
    measurements,
    texts,
    confirmed,
    environment,
    hydratedEnvironment,
  ]);
  function add(e: React.PointerEvent<SVGSVGElement>) {
    if (confirmed || !environment || e.target !== e.currentTarget) return;
    const r = e.currentTarget.getBoundingClientRect(),
      p = normalizePointer(e.clientX, e.clientY, r);
    if (mode === "wall") {
      setStrokes((items) => [...items, [p]]);
      setDrawingStroke(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    else if (mode === "measure") {
      if (!measurementStart) setMeasurementStart(p);
      else {
        const id = uid();
        setMeasurements((items) => [
          ...items,
          {
            id,
            start: measurementStart,
            end: p,
            value: "",
            unit: floorPlanProject?.unit || "mm",
          },
        ]);
        setSelected({ kind: "measurement", id });
        setMeasurementStart(null);
      }
    } else if (mode === "text") {
      const value = prompt("Digite o texto que ficará na planta:", "")?.trim();
      if (value) {
        const id = uid();
        setTexts((items) => [...items, { id, value, point: p }]);
        setSelected({ kind: "text", id });
      }
    } else setElements((v) => [...v, { id: uid(), type: mode, ...p }]);
  }
  function pointerPosition(e: React.PointerEvent<SVGSVGElement>) {
    return normalizePointer(
      e.clientX,
      e.clientY,
      e.currentTarget.getBoundingClientRect(),
    );
  }
  function moveSelected(e: React.PointerEvent<SVGSVGElement>) {
    const p = pointerPosition(e);
    if (drawingStroke && mode === "wall" && !confirmed) {
      setStrokes((items) => {
        const next = [...items], current = [...(next[next.length - 1] || [])], last = current[current.length - 1];
        if (!last || Math.hypot(p.x - last.x, p.y - last.y) >= 0.008) current.push(p);
        next[next.length - 1] = current;
        return next;
      });
      return;
    }
    if (!dragging || !selected || confirmed) return;
    if (selected.kind === "point")
      setStrokes((items) =>
        items.map((stroke, strokeIndex) =>
          strokeIndex === selected.strokeIndex
            ? stroke.map((item, index) => (index === selected.index ? p : item))
            : stroke,
        ),
      );
    else if (selected.kind === "element")
      setElements((items) =>
        items.map((item) =>
          item.id === selected.id ? { ...item, ...p } : item,
        ),
      );
    else if (selected.kind === "measurement")
      setMeasurements((items) =>
        items.map((item) => {
          if (item.id !== selected.id) return item;
          if (dragPart === "start") return { ...item, start: p };
          if (dragPart === "end") return { ...item, end: p };
          return { ...item, labelPoint: p };
        }),
      );
    else if (selected.kind === "text")
      setTexts((items) =>
        items.map((item) => item.id === selected.id ? { ...item, point: p } : item),
      );
  }
  function removeSelected() {
    if (!selected || confirmed) return;
    if (selected.kind === "point")
      setStrokes((items) =>
        items
          .map((stroke, strokeIndex) =>
            strokeIndex === selected.strokeIndex
              ? stroke.filter((_, index) => index !== selected.index)
              : stroke,
          )
          .filter((stroke) => stroke.length > 1),
      );
    else if (selected.kind === "element")
      setElements((items) => items.filter((item) => item.id !== selected.id));
    else if (selected.kind === "measurement")
      setMeasurements((items) =>
        items.filter((item) => item.id !== selected.id),
      );
    else setTexts((items) => items.filter((item) => item.id !== selected.id));
    setSelected(null);
  }
  return (
    <>
      <Head
        eye="Planta baixa"
        title="Desenho do ambiente"
        sub="Desenhe a geometria e informe manualmente cada medida real; nenhum valor é calculado ou inventado."
      />
      {!environment && (
        <section className="card empty">
          <h2>Crie um ambiente antes da planta</h2>
          <p>A planta precisa permanecer vinculada ao ambiente correto.</p>
        </section>
      )}
      <div className="grid">
        <section className="card wide">
          <div className="floorplan">
            <svg
              viewBox="0 0 1000 600"
              aria-label="Planta baixa vetorial"
              style={{ touchAction: "none" }}
              onPointerMove={moveSelected}
              onPointerUp={() => { setDragging(false); setDrawingStroke(false); }}
              onPointerCancel={() => { setDragging(false); setDrawingStroke(false); }}
              onPointerLeave={() => { if (!drawingStroke) setDragging(false); }}
              onPointerDown={add}
            >
              {strokes.map((stroke, strokeIndex) => {
                const middle = stroke[Math.floor(stroke.length / 2)];
                return (
                  <g key={`stroke-${strokeIndex}`}>
                    <polyline
                      points={stroke.map((point) => `${point.x * 1000},${point.y * 600}`).join(" ")}
                      fill="none"
                      stroke="#163b59"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pointerEvents="none"
                    />
                    {middle && stroke.length > 1 && (
                      <text
                        x={middle.x * 1000}
                        y={middle.y * 600 - 12}
                        fill="#075da9"
                        pointerEvents="none"
                      >
                        Traço {wallCode(strokeIndex)}
                      </text>
                    )}
                  </g>
                );
              })}
              {measurements.map((measurement) => {
                const selectedMeasurement =
                    selected?.kind === "measurement" &&
                    selected.id === measurement.id,
                  x1 = measurement.start.x * 1000,
                  y1 = measurement.start.y * 600,
                  x2 = measurement.end.x * 1000,
                  y2 = measurement.end.y * 600,
                  labelPoint = measurement.labelPoint || {
                    x: (measurement.start.x + measurement.end.x) / 2,
                    y: (measurement.start.y + measurement.end.y) / 2,
                  },
                  labelX = labelPoint.x * 1000,
                  labelY = labelPoint.y * 600;
                return (
                  <g
                    key={measurement.id}
                    role="button"
                    aria-label={`Cota ${measurement.value || "sem valor"}`}
                  >
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={selectedMeasurement ? "#f59e0b" : "#d12f2f"}
                      strokeWidth={selectedMeasurement ? 6 : 4}
                      strokeDasharray="12 7"
                      pointerEvents="none"
                    />
                    {[{ x: x1, y: y1, part: "start" as const }, { x: x2, y: y2, part: "end" as const }].map((handle) => (
                      <circle
                        key={handle.part}
                        cx={handle.x}
                        cy={handle.y}
                        r={selectedMeasurement ? 12 : 7}
                        fill="#d12f2f"
                        pointerEvents={
                          selectedMeasurement && mode !== "measure" ? "auto" : "none"
                        }
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          if (confirmed) return;
                          setSelected({ kind: "measurement", id: measurement.id });
                          setDragPart(handle.part);
                          setDragging(true);
                          event.currentTarget.setPointerCapture(event.pointerId);
                        }}
                      />
                    ))}
                    <rect
                      x={labelX - 48}
                      y={labelY - 22}
                      width="96"
                      height="28"
                      rx="6"
                      fill="#fff"
                      stroke="#d12f2f"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        if (confirmed) return;
                        setSelected({ kind: "measurement", id: measurement.id });
                        setDragPart("label");
                        if (selectedMeasurement) {
                          setDragging(true);
                          event.currentTarget.setPointerCapture(event.pointerId);
                        }
                      }}
                    />
                    <text
                      x={labelX}
                      y={labelY - 3}
                      textAnchor="middle"
                      fill="#9f1f1f"
                      fontWeight="700"
                      style={{ pointerEvents: "none" }}
                    >
                      {measurement.value
                        ? `${measurement.value} ${measurement.unit}`
                        : "Informe a medida"}
                    </text>
                  </g>
                );
              })}
              {texts.map((item) => (
                <g
                  key={item.id}
                  role="button"
                  aria-label={`Texto ${item.value}`}
                  transform={`translate(${item.point.x * 1000} ${item.point.y * 600})`}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    if (confirmed) return;
                    setSelected({ kind: "text", id: item.id });
                    setDragPart("item");
                    setDragging(true);
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                >
                  <rect
                    x="-8"
                    y="-24"
                    width={Math.max(70, item.value.length * 10)}
                    height="34"
                    rx="6"
                    fill="#fff"
                    stroke={selected?.kind === "text" && selected.id === item.id ? "#f59e0b" : "#163b59"}
                    strokeWidth="3"
                  />
                  <text x="4" y="0" fill="#172534" fontWeight="700" style={{ pointerEvents: "none" }}>
                    {item.value}
                  </text>
                </g>
              ))}
              {measurementStart && (
                <circle
                  cx={measurementStart.x * 1000}
                  cy={measurementStart.y * 600}
                  r="12"
                  fill="#f59e0b"
                  stroke="#fff"
                  strokeWidth="4"
                />
              )}
              {!confirmed && mode === "wall" && strokes.flatMap((stroke, strokeIndex) => {
                const indexes = stroke.length > 1 ? [0, stroke.length - 1] : [];
                return indexes.map((pointIndex) => {
                  const point = stroke[pointIndex];
                  const isSelected = selected?.kind === "point" && selected.strokeIndex === strokeIndex && selected.index === pointIndex;
                  return (
                    <circle
                      key={`p-${strokeIndex}-${pointIndex}`}
                      cx={point.x * 1000}
                      cy={point.y * 600}
                      r={isSelected ? 16 : 9}
                      fill={isSelected ? "#f59e0b" : "#0876db"}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        setSelected({ kind: "point", strokeIndex, index: pointIndex });
                        setDragging(true);
                        event.currentTarget.setPointerCapture(event.pointerId);
                      }}
                    />
                  );
                });
              })}
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
                  {el.type === "camera" && (
                    <circle
                      r="18"
                      fill="#7a3fe0"
                      stroke={selected?.kind === "element" && selected.id === el.id ? "#f59e0b" : "#0876db"}
                      strokeWidth="4"
                    />
                  )}
                  {el.type === "door" && (
                    <g transform={`rotate(${el.direction || 0})`}>
                      <circle r="5" fill="#0876db" />
                      <line x1="0" y1="0" x2="48" y2="0" stroke="#163b59" strokeWidth="6" />
                      <path d="M 0 48 A 48 48 0 0 0 48 0" fill="none" stroke="#0876db" strokeWidth="3" />
                    </g>
                  )}
                  {el.type === "window" && (
                    <g transform={`rotate(${el.direction || 0})`}>
                      <rect x="-34" y="-10" width="68" height="20" fill="#fff" stroke="#163b59" strokeWidth="5" />
                      <line x1="-30" y1="0" x2="30" y2="0" stroke="#60aee8" strokeWidth="4" />
                    </g>
                  )}
                  <text x="25" y="6" style={{ pointerEvents: "none" }}>
                    {el.type}
                    {el.type === "camera" && el.photoId ? " • foto" : ""}
                  </text>
                </g>
              ))}
            </svg>
            {!strokes.length && (
              <div className="emptycanvas">
                <p>Toque ou clique para iniciar o contorno livre.</p>
              </div>
            )}
          </div>
        </section>
        <aside className="card aside">
          <h2>Ferramentas da planta</h2>
          <div className="actions" style={{ flexWrap: "wrap" }}>
            {(["wall", "door", "window", "camera", "measure", "text"] as const).map(
              (x) => (
                <button
                  key={x}
                  className={`btn ${mode === x ? "primary" : ""}`}
                  onClick={() => {
                    setMode(x);
                    setMeasurementStart(null);
                  }}
                >
                  {x === "wall" ? "mão livre" : x === "measure" ? "medida" : x === "text" ? "texto" : x}
                </button>
              ),
            )}
          </div>
          {mode === "wall" && (
            <p className="subtitle">
              Pressione e arraste o dedo, mouse ou caneta para desenhar cada parede à mão livre.
            </p>
          )}
          {mode === "measure" && (
            <p className="subtitle">
              {measurementStart
                ? "Marque o segundo ponto da cota."
                : "Marque dois pontos e depois digite a medida real."}
            </p>
          )}
          {mode === "text" && (
            <p className="subtitle">
              Clique na planta, digite o texto e depois arraste-o para qualquer posição.
            </p>
          )}
          <button
            className="btn"
            disabled={!strokes.length || confirmed}
            onClick={() => setStrokes((items) => items.map((stroke) => rectifyPath(stroke)))}
          >
            Retificar traços
          </button>
          <button
            className="btn"
            disabled={
              !confirmed &&
              measurements.some((measurement) => !measurement.value)
            }
            onClick={() => setConfirmed((v) => !v)}
          >
            {confirmed ? "Editar novamente" : "Confirmar planta"}
          </button>
          {!confirmed &&
            measurements.some((measurement) => !measurement.value) && (
              <p className="pill warn">
                Informe todas as medidas antes de confirmar a planta.
              </p>
            )}
          {selected?.kind === "element" &&
            ["door", "window"].includes(
              elements.find((item) => item.id === selected.id)?.type || "",
            ) && (
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
                Girar porta ou janela
              </button>
            )}
          {selected?.kind === "measurement" && (
            <label className="field">
              <span>Valor real da medida</span>
              <div className="actions" style={{ alignItems: "center" }}>
                <input
                  inputMode="decimal"
                  placeholder="Ex.: 3200"
                  disabled={confirmed}
                  value={
                    measurements.find((item) => item.id === selected.id)
                      ?.value || ""
                  }
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value !== "" && !/^\d*(?:[.,]\d*)?$/.test(value))
                      return;
                    setMeasurements((items) =>
                      items.map((item) =>
                        item.id === selected.id ? { ...item, value } : item,
                      ),
                    );
                  }}
                  aria-label="Valor real da medida da planta"
                />
                <strong>
                  {measurements.find((item) => item.id === selected.id)?.unit ||
                    floorPlanProject?.unit ||
                    "mm"}
                </strong>
              </div>
              <small>O sistema nunca calcula ou preenche este valor.</small>
            </label>
          )}
          {selected?.kind === "text" && (
            <label className="field">
              <span>Texto livre da planta</span>
              <input
                disabled={confirmed}
                value={texts.find((item) => item.id === selected.id)?.value || ""}
                onChange={(event) =>
                  setTexts((items) =>
                    items.map((item) =>
                      item.id === selected.id ? { ...item, value: event.target.value } : item,
                    ),
                  )
                }
              />
              <small>Arraste o texto diretamente na planta para reposicioná-lo.</small>
            </label>
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
              setStrokes([]);
              setElements([]);
              setMeasurements([]);
              setTexts([]);
              setMeasurementStart(null);
              setConfirmed(false);
            }}
          >
            Limpar rascunho
          </button>
          <p className="subtitle">
            {strokes.length
              ? `${strokes.length} traços · ${elements.length} elementos · ${measurements.length} medidas manuais · ${texts.length} textos`
              : "Aguardando o primeiro traço"}
          </p>
        </aside>
      </div>
    </>
  );
}
type VoiceRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult:
    | ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};
function VoiceAssistant({
  go,
  openModal,
}: {
  go: (section: Section) => void;
  openModal: (modal: "client" | "project" | "environment") => void;
}) {
  const [listening, setListening] = useState(false),
    [transcript, setTranscript] = useState(""),
    [supported, setSupported] = useState(true),
    recognition = useRef<VoiceRecognition | null>(null);
  useEffect(() => {
    const Constructor =
      (
        window as unknown as {
          SpeechRecognition?: new () => VoiceRecognition;
          webkitSpeechRecognition?: new () => VoiceRecognition;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => VoiceRecognition;
        }
      ).webkitSpeechRecognition;
    if (!Constructor) {
      setSupported(false);
      return;
    }
    const instance = new Constructor();
    instance.lang = "pt-BR";
    instance.interimResults = false;
    instance.continuous = false;
    instance.onresult = (event) =>
      setTranscript(event.results[0][0].transcript);
    instance.onerror = () => setListening(false);
    instance.onend = () => setListening(false);
    recognition.current = instance;
    return () => instance.stop();
  }, []);
  function execute() {
    const command = transcript.toLocaleLowerCase("pt-BR");
    const destinations: Array<[string, Section]> = [
      ["clientes", "clients"],
      ["projetos", "projects"],
      ["fotos", "editor"],
      ["editor", "editor"],
      ["planta", "floorplan"],
      ["sincronização", "sync"],
      ["portal", "portal"],
    ];
    const destination = destinations.find(([word]) => command.includes(word));
    if (command.includes("novo cliente")) openModal("client");
    else if (command.includes("novo projeto")) openModal("project");
    else if (command.includes("novo ambiente")) openModal("environment");
    else if (destination) go(destination[1]);
    setTranscript("");
  }
  return (
    <>
      <Head
        eye="Comandos confirmados"
        title="Assistente de voz"
        sub="O sistema transcreve primeiro e só executa depois da sua confirmação."
      />
      <section className="card" style={{ maxWidth: 760 }}>
        <h2>{listening ? "Ouvindo…" : "Diga um comando"}</h2>
        <p className="subtitle">
          Exemplos: abrir clientes, abrir planta, novo projeto ou novo ambiente.
        </p>
        {!supported && (
          <p className="pill warn">
            Reconhecimento de voz indisponível neste navegador.
          </p>
        )}
        <label className="field">
          <span>Transcrição editável</span>
          <textarea
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            placeholder="A fala aparecerá aqui antes de qualquer ação"
          />
        </label>
        <div className="actions">
          <button
            className="btn primary"
            disabled={!supported || listening}
            onClick={() => {
              setListening(true);
              recognition.current?.start();
            }}
          >
            <Mic size={16} /> {listening ? "Ouvindo" : "Começar a ouvir"}
          </button>
          <button
            className="btn"
            disabled={!transcript.trim()}
            onClick={execute}
          >
            Confirmar comando
          </button>
          <button
            className="btn"
            disabled={!transcript}
            onClick={() => setTranscript("")}
          >
            Cancelar
          </button>
        </div>
      </section>
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
function Portal({
  projects,
  projectId,
  selectProject,
}: {
  projects: Project[];
  projectId: string;
  selectProject: (projectId: string) => void;
}) {
  const [qr, setQr] = useState(""),
    [access, setAccess] = useState<{ url: string; code: string } | null>(null),
    [publishing, setPublishing] = useState(false),
    project = projects.find((item) => item.id === projectId);
  async function publish() {
    if (!project || publishing) return;
    setPublishing(true);
    try {
      await syncPending(httpSyncTransport);
      const [client, environments, photos, annotations, floorPlans] =
        await Promise.all([
          db.clients.get(project.clientId),
          db.environments.where("projectId").equals(project.id).toArray(),
          db.photos.toArray(),
          db.annotations.toArray(),
          db.floorPlans.toArray(),
        ]);
      const environmentIds = new Set(environments.map((item) => item.id)),
        projectPhotos = photos.filter((item) =>
          environmentIds.has(item.environmentId),
        ),
        photoIds = new Set(projectPhotos.map((item) => item.id)),
        snapshot = {
          project,
          client: client ? { id: client.id, name: client.name } : null,
          environments,
          photos: projectPhotos.map((item) => ({
            id: item.id,
            environmentId: item.environmentId,
            name: item.name,
            width: item.width,
            height: item.height,
            mediaType: item.mediaType || "image",
            mimeType: item.mimeType || item.blob.type,
            durationSeconds: item.durationSeconds,
            createdAt: item.createdAt,
          })),
          annotations: annotations.filter((item) => photoIds.has(item.photoId)),
          floorPlans: floorPlans.filter((item) =>
            environmentIds.has(item.environmentId),
          ),
        };
      const form = new FormData();
      form.set("snapshot", JSON.stringify(snapshot));
      form.set("pdf", await pdf(project, false), "medidas-finais.pdf");
      const response = await fetch("/api/publications", {
        method: "POST",
        body: form,
      });
      if (!response.ok) throw new Error("Não foi possível publicar");
      const result = (await response.json()) as { url: string; code: string };
      setAccess(result);
      setQr(
        await QRCode.toDataURL(`${location.origin}${result.url}`, {
          margin: 2,
          width: 180,
        }),
      );
      await db.projects.update(project.id, {
        status: "published",
        version: project.version + 1,
        updatedAt: now(),
      });
      await queue("project", project.id, "update");
    } finally {
      setPublishing(false);
    }
  }
  return (
    <>
      <Head
        eye="Entrega controlada"
        title="Portal do cliente"
        sub="Somente a versão publicada pode ser visualizada ou baixada."
      />
      <section className="card" style={{ marginBottom: 14 }}>
        <label className="field" style={{ maxWidth: 520 }}>
          <span>Projeto para publicação</span>
          <select
            value={projectId}
            onChange={(event) => {
              selectProject(event.target.value);
              setAccess(null);
              setQr("");
            }}
          >
            <option value="">Selecione um projeto</option>
            {projects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </section>
      <section className="portal-cover">
        <div className="eyebrow" style={{ color: "#8ecbff" }}>
          Pasta digital
        </div>
        <h1>{project?.name || "Selecione um projeto para publicar"}</h1>
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
          <button
            className="btn"
            disabled={!project}
            onClick={() => pdf(project)}
          >
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
          <h2>
            {access ? `Código: ${access.code}` : "Acesso ainda não publicado"}
          </h2>
          <p className="subtitle">Token revogável e sem dados pessoais.</p>
          <button
            className="btn primary"
            disabled={!project || publishing}
            onClick={publish}
          >
            {publishing ? "Publicando…" : "Publicar versão e gerar acesso"}
          </button>
        </div>
      </div>
    </>
  );
}

function SettingsPanel() {
  const [leaving, setLeaving] = useState(false);
  async function signOut() {
    if (leaving) return;
    setLeaving(true);
    await getSupabase().auth.signOut();
    location.assign("/login");
  }
  return (
    <>
      <Head
        eye="Administração"
        title="Configurações"
        sub="Sessão da proprietária e informações deste dispositivo."
      />
      <section className="card" style={{ maxWidth: 720 }}>
        <h2>Conta conectada</h2>
        <p className="subtitle">
          Os dados operacionais continuam salvos localmente para uso sem internet.
        </p>
        <button className="btn danger" disabled={leaving} onClick={signOut}>
          {leaving ? "Saindo…" : "Sair da conta"}
        </button>
      </section>
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
async function pdf(p?: Project, save = true): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
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
      environmentMedia = await db.photos
        .where("environmentId")
        .equals(environment.id)
        .toArray(),
      environmentPhotos = environmentMedia.filter(
        (item) => !item.mediaType || item.mediaType === "image",
      ),
      environmentVideos = environmentMedia.filter(
        (item) => item.mediaType === "video",
      );
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
      const drawingStrokes = plan.strokes?.length ? plan.strokes : [plan.points];
      drawingStrokes.forEach((stroke, strokeIndex) => {
        stroke.slice(1).forEach((point, index) => {
          const previous = stroke[index];
          d.line(
            box.x + previous.x * box.w,
            box.y + previous.y * box.h,
            box.x + point.x * box.w,
            box.y + point.y * box.h,
          );
        });
        const middle = stroke[Math.floor(stroke.length / 2)];
        if (middle) {
          d.setFontSize(8);
          d.setTextColor(7, 93, 169);
          d.text(`Traço ${wallCode(strokeIndex)}`, box.x + middle.x * box.w, box.y + middle.y * box.h - 2);
        }
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
      (plan.measurements || []).forEach((measurement) => {
        const x1 = box.x + measurement.start.x * box.w,
          y1 = box.y + measurement.start.y * box.h,
          x2 = box.x + measurement.end.x * box.w,
          y2 = box.y + measurement.end.y * box.h;
        d.setDrawColor(190, 35, 35);
        d.setLineWidth(0.5);
        d.line(x1, y1, x2, y2);
        d.circle(x1, y1, 1, "F");
        d.circle(x2, y2, 1, "F");
        if (measurement.value) {
          const labelPoint = measurement.labelPoint || {
            x: (measurement.start.x + measurement.end.x) / 2,
            y: (measurement.start.y + measurement.end.y) / 2,
          };
          d.setFillColor(255, 255, 255);
          d.setTextColor(155, 25, 25);
          d.setFontSize(8);
          d.text(
            `${measurement.value} ${measurement.unit}`,
            box.x + labelPoint.x * box.w,
            box.y + labelPoint.y * box.h,
            { align: "center" },
          );
        }
      });
      (plan.texts || []).forEach((item) => {
        d.setTextColor(23, 37, 52);
        d.setFontSize(9);
        d.text(item.value, box.x + item.point.x * box.w, box.y + item.point.y * box.h);
      });
    }
    footer();

    if (environmentVideos.length) {
      d.addPage();
      header(environment.name.toUpperCase(), "Vídeos anexados ao ambiente");
      d.setTextColor(23, 37, 52);
      d.setFontSize(11);
      environmentVideos.forEach((video, index) => {
        const duration = video.durationSeconds
          ? ` · ${Math.round(video.durationSeconds)} segundos`
          : "";
        d.text(`${index + 1}. ${video.name}${duration}`, 24, 45 + index * 10);
      });
      d.setFontSize(8);
      d.setTextColor(96, 115, 134);
      d.text(
        "Os vídeos permanecem anexados digitalmente; o PDF registra sua identificação.",
        24,
        50 + environmentVideos.length * 10,
      );
      footer();
    }

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
          if (
            (annotation.type === "text" || annotation.type === "technical" || annotation.type === "detail") &&
            annotation.points[0]
          ) {
            const point = annotation.labelPoint || annotation.points[0];
            d.setTextColor(23, 37, 52);
            d.setFontSize(8);
            d.text(
              annotation.type === "text" ? annotation.value : annotation.description,
              x + point.x * width,
              y + point.y * height,
            );
            return;
          }
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
              const labelPoint = annotation.labelPoint || {
                x: (start.x + end.x) / 2,
                y: (start.y + end.y) / 2,
              };
              d.setFillColor(255, 255, 255);
              d.setTextColor(170, 20, 20);
              d.setFontSize(8);
              d.text(
                `${annotation.code}: ${annotation.value}`,
                x + labelPoint.x * width,
                y + labelPoint.y * height,
                { align: "center" },
              );
            }
          }
        });
      footer();
    }
  }
  const result = d.output("blob");
  if (save) d.save("medidas-finais-para-producao.pdf");
  return result;
}
