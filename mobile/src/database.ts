import * as Crypto from "expo-crypto";
import * as SQLite from "expo-sqlite";

export type SyncStatus =
  | "AGUARDANDO_SINCRONIZACAO"
  | "SINCRONIZANDO"
  | "SINCRONIZADO"
  | "ERRO_DE_SINCRONIZACAO"
  | "CONFLITO";

export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string;
  sync_status: SyncStatus;
  updated_at: string;
};

export type Project = {
  id: string;
  client_id: string;
  name: string;
  address: string;
  unit: "mm" | "cm" | "m";
  sync_status: SyncStatus;
  updated_at: string;
};

const databasePromise = SQLite.openDatabaseAsync("medidas-finais.sqlite");

const migrations = [
  `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL,
      device_id TEXT NOT NULL,
      deleted_at TEXT,
      last_sync_at TEXT
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY NOT NULL,
      client_id TEXT NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      unit TEXT NOT NULL DEFAULT 'mm',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      sync_status TEXT NOT NULL,
      device_id TEXT NOT NULL,
      deleted_at TEXT,
      last_sync_at TEXT,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      next_attempt_at TEXT,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, created_at);
  `,
  `
    DELETE FROM sync_queue;
    DELETE FROM projects;
    DELETE FROM clients;
  `,
];

export async function initializeDatabase() {
  const database = await databasePromise;
  await database.execAsync("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  for (let index = 0; index < migrations.length; index += 1) {
    const version = index + 1;
    const applied = await database.getFirstAsync<{ version: number }>(
      "SELECT version FROM schema_migrations WHERE version = ?",
      version,
    ).catch(() => null);
    if (applied) continue;
    await database.withTransactionAsync(async () => {
      await database.execAsync(migrations[index]);
      await database.runAsync(
        "INSERT INTO schema_migrations(version, applied_at) VALUES (?, ?)",
        version,
        new Date().toISOString(),
      );
    });
  }
}

function timestamp() {
  return new Date().toISOString();
}

async function deviceId(database: SQLite.SQLiteDatabase) {
  await database.execAsync(
    "CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);",
  );
  const current = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = 'device_id'",
  );
  if (current) return current.value;
  const id = Crypto.randomUUID();
  await database.runAsync(
    "INSERT INTO app_settings(key, value) VALUES ('device_id', ?)",
    id,
  );
  return id;
}

export async function createClient(name: string): Promise<Client> {
  const database = await databasePromise;
  const id = Crypto.randomUUID(), now = timestamp(), device = await deviceId(database);
  const record: Client = {
    id, name: name.trim(), phone: "", email: "",
    sync_status: "AGUARDANDO_SINCRONIZACAO", updated_at: now,
  };
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO clients(id,name,created_at,updated_at,sync_status,device_id)
       VALUES (?,?,?,?,?,?)`,
      id, record.name, now, now, record.sync_status, device,
    );
    await enqueue(database, "client", id, "create", record, now);
  });
  return record;
}

export async function createProject(clientId: string, name: string): Promise<Project> {
  const database = await databasePromise;
  const id = Crypto.randomUUID(), now = timestamp(), device = await deviceId(database);
  const record: Project = {
    id, client_id: clientId, name: name.trim(), address: "", unit: "mm",
    sync_status: "AGUARDANDO_SINCRONIZACAO", updated_at: now,
  };
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO projects(id,client_id,name,created_at,updated_at,sync_status,device_id)
       VALUES (?,?,?,?,?,?,?)`,
      id, clientId, record.name, now, now, record.sync_status, device,
    );
    await enqueue(database, "project", id, "create", record, now);
  });
  return record;
}

async function enqueue(
  database: SQLite.SQLiteDatabase,
  entity: string,
  entityId: string,
  operation: string,
  payload: object,
  now: string,
) {
  const id = Crypto.randomUUID();
  await database.runAsync(
    `INSERT INTO sync_queue
      (id,entity,entity_id,operation,payload,idempotency_key,status,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    id, entity, entityId, operation, JSON.stringify(payload), id,
    "AGUARDANDO_SINCRONIZACAO", now, now,
  );
}

export async function listClients() {
  const database = await databasePromise;
  return database.getAllAsync<Client>(
    "SELECT id,name,phone,email,sync_status,updated_at FROM clients WHERE deleted_at IS NULL ORDER BY name",
  );
}

export async function listProjects() {
  const database = await databasePromise;
  return database.getAllAsync<Project>(
    "SELECT id,client_id,name,address,unit,sync_status,updated_at FROM projects WHERE deleted_at IS NULL ORDER BY updated_at DESC",
  );
}

export async function pendingCount() {
  const database = await databasePromise;
  const result = await database.getFirstAsync<{ total: number }>(
    "SELECT COUNT(*) AS total FROM sync_queue WHERE status != 'SINCRONIZADO'",
  );
  return result?.total ?? 0;
}
