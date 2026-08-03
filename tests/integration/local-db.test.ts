import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import { db, now, queue, uid } from "../../src/database/local/db.ts";
import { syncPending } from "../../src/features/sync/processor.ts";
test("cliente e operação sobrevivem a fechamento e reabertura do banco", async () => {
  await db.delete();
  await db.open();
  const id = uid(),
    createdAt = now();
  await db.transaction("rw", db.clients, db.syncOperations, async () => {
    await db.clients.put({
      id,
      name: "Cliente Offline",
      phone: "",
      email: "",
      address: "",
      notes: "",
      status: "active",
      createdAt,
      updatedAt: createdAt,
    });
    await queue("client", id, "create");
  });
  db.close();
  await db.open();
  assert.equal((await db.clients.get(id))?.name, "Cliente Offline");
  const operation = await db.syncOperations
    .where("entityId")
    .equals(id)
    .first();
  assert.equal(operation?.status, "pending");
  assert.equal(operation?.action, "create");
  await db.delete();
});
test("planta vetorial permanece vinculada ao ambiente após reabrir", async () => {
  await db.delete();
  await db.open();
  const timestamp = now(),
    id = uid();
  await db.floorPlans.put({
    id,
    environmentId: "ambiente-teste",
    points: [
      { x: 0.1, y: 0.1 },
      { x: 0.8, y: 0.1 },
      { x: 0.8, y: 0.7 },
    ],
    elements: [{ id: uid(), type: "door", x: 0.5, y: 0.1 }],
    measurements: [
      {
        id: uid(),
        start: { x: 0.1, y: 0.15 },
        end: { x: 0.8, y: 0.15 },
        value: "3200",
        unit: "mm",
      },
    ],
    confirmed: true,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  db.close();
  await db.open();
  const plan = await db.floorPlans
    .where("environmentId")
    .equals("ambiente-teste")
    .first();
  assert.equal(plan?.confirmed, true);
  assert.equal(plan?.points.length, 3);
  assert.equal(plan?.elements[0].type, "door");
  assert.equal(plan?.measurements?.[0].value, "3200");
  await db.delete();
});
test("sync só confirma após aceite e preserva a cópia local", async () => {
  await db.delete();
  await db.open();
  const id = uid(),
    timestamp = now();
  await db.clients.put({
    id,
    name: "Cópia protegida",
    phone: "",
    email: "",
    address: "",
    notes: "",
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  await queue("client", id, "create");
  const failure = await syncPending(async () => {
    throw new Error("servidor indisponível");
  });
  assert.equal(failure.failed, 1);
  assert.equal((await db.clients.get(id))?.name, "Cópia protegida");
  assert.equal((await db.syncOperations.toArray())[0]?.status, "failed");
  const success = await syncPending(async () => ({ accepted: true }));
  assert.equal(success.sent, 1);
  assert.equal((await db.clients.get(id))?.name, "Cópia protegida");
  assert.equal((await db.syncOperations.toArray())[0]?.status, "synced");
  await db.delete();
});
test.after(async () => {
  db.close();
});
