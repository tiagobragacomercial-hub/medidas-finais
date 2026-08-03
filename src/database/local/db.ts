import Dexie, { type EntityTable } from "dexie";
import type {
  AuditLog,
  Annotation,
  Client,
  Environment,
  Photo,
  Project,
  SyncOperation,
  TrashItem,
  Wall,
  Floor,
  FloorPlanRecord,
} from "../../types/models";
class AppDb extends Dexie {
  clients!: EntityTable<Client, "id">;
  projects!: EntityTable<Project, "id">;
  environments!: EntityTable<Environment, "id">;
  photos!: EntityTable<Photo, "id">;
  annotations!: EntityTable<Annotation, "id">;
  syncOperations!: EntityTable<SyncOperation, "id">;
  floors!: EntityTable<Floor, "id">;
  walls!: EntityTable<Wall, "id">;
  auditLogs!: EntityTable<AuditLog, "id">;
  trashItems!: EntityTable<TrashItem, "id">;
  floorPlans!: EntityTable<FloorPlanRecord, "id">;
  constructor() {
    super("medidas-finais");
    this.version(1).stores({
      clients: "id,name,status,updatedAt",
      projects: "id,clientId,status,updatedAt",
      environments: "id,projectId,status",
      photos: "id,environmentId,syncState,createdAt",
      annotations: "id,photoId,state,layer,updatedAt",
      syncOperations: "id,status,createdAt",
    });
    this.version(2)
      .stores({
        clients: "id,name,status,updatedAt",
        projects: "id,clientId,status,updatedAt",
        environments: "id,projectId,status",
        photos: "id,environmentId,syncState,createdAt",
        annotations: "id,photoId,state,layer,updatedAt",
        syncOperations: "id,status,createdAt",
        floors: "id,projectId,order",
        walls: "id,environmentId,code,order",
        auditLogs: "id,entity,entityId,action,createdAt",
        trashItems: "id,entity,entityId,expiresAt,createdAt",
      })
      .upgrade(async (tx) => {
        const projects = await tx.table("projects").toArray();
        for (const project of projects) {
          const floorId = `floor-${project.id}`;
          await tx.table("floors").put({
            id: floorId,
            projectId: project.id,
            name: "Térreo",
            order: 1,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
          });
          const environments = await tx
            .table("environments")
            .where("projectId")
            .equals(project.id)
            .toArray();
          for (const environment of environments)
            await tx.table("environments").update(environment.id, { floorId });
        }
      });
    this.version(3).stores({
      clients: "id,name,status,updatedAt",
      projects: "id,clientId,status,updatedAt",
      environments: "id,projectId,status",
      photos: "id,environmentId,syncState,createdAt",
      annotations: "id,photoId,state,layer,updatedAt",
      syncOperations: "id,entity,entityId,status,createdAt",
      floors: "id,projectId,order",
      walls: "id,environmentId,code,order",
      auditLogs: "id,entity,entityId,action,createdAt",
      trashItems: "id,entity,entityId,expiresAt,createdAt",
    });
    this.version(4).stores({
      clients: "id,name,status,updatedAt",
      projects: "id,clientId,status,updatedAt",
      environments: "id,projectId,status",
      photos: "id,environmentId,syncState,createdAt",
      annotations: "id,photoId,state,layer,updatedAt",
      syncOperations: "id,entity,entityId,status,createdAt",
      floors: "id,projectId,order",
      walls: "id,environmentId,code,order",
      auditLogs: "id,entity,entityId,action,createdAt",
      trashItems: "id,entity,entityId,expiresAt,createdAt",
      floorPlans: "id,environmentId,updatedAt",
    });
    this.version(5)
      .stores({
        clients: "id,name,status,updatedAt",
        projects: "id,clientId,status,updatedAt",
        environments: "id,projectId,status",
        photos: "id,environmentId,syncState,createdAt",
        annotations: "id,photoId,state,layer,updatedAt",
        syncOperations: "id,entity,entityId,status,createdAt",
        floors: "id,projectId,order",
        walls: "id,environmentId,code,order",
        auditLogs: "id,entity,entityId,action,createdAt",
        trashItems: "id,entity,entityId,expiresAt,createdAt",
        floorPlans: "id,environmentId,updatedAt",
      })
      .upgrade(async (tx) => {
        await Promise.all(
          [
            "syncOperations",
            "annotations",
            "floorPlans",
            "photos",
            "walls",
            "environments",
            "floors",
            "projects",
            "clients",
            "auditLogs",
            "trashItems",
          ].map((table) => tx.table(table).clear()),
        );
      });
  }
}
export const db = new AppDb();
export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export async function queue(
  entity: string,
  entityId: string,
  action: SyncOperation["action"],
) {
  await db.syncOperations.put({
    id: uid(),
    entity,
    entityId,
    action,
    attempts: 0,
    status: "pending",
    createdAt: now(),
  });
}
