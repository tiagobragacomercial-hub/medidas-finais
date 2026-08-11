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
    strokes: [
      [
        { x: 0.1, y: 0.1 },
        { x: 0.35, y: 0.12 },
        { x: 0.8, y: 0.1 },
      ],
      [
        { x: 0.8, y: 0.1 },
        { x: 0.8, y: 0.7 },
      ],
    ],
    elements: [
      {
        id: uid(),
        type: "door",
        x: 0.5,
        y: 0.1,
        width: 800,
        wallIndex: 0,
        flipHorizontal: true,
        flipVertical: false,
      },
      {
        id: uid(),
        type: "column",
        x: 0.4,
        y: 0.4,
        width: 300,
        height: 300,
        shape: "circle",
        locked: true,
      },
    ],
    measurements: [
      {
        id: uid(),
        start: { x: 0.1, y: 0.15 },
        end: { x: 0.8, y: 0.15 },
        value: "3200",
        unit: "mm",
        labelPoint: { x: 0.55, y: 0.24 },
      },
    ],
    texts: [
      {
        id: uid(),
        value: "PONTO DE ÁGUA",
        point: { x: 0.62, y: 0.4 },
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
  assert.equal(plan?.strokes?.length, 2);
  assert.equal(plan?.strokes?.[0].length, 3);
  assert.equal(plan?.elements[0].type, "door");
  assert.equal(plan?.elements[0].width, 800);
  assert.equal(plan?.elements[0].flipHorizontal, true);
  assert.equal(plan?.elements[1].shape, "circle");
  assert.equal(plan?.elements[1].locked, true);
  assert.equal(plan?.measurements?.[0].value, "3200");
  assert.deepEqual(plan?.measurements?.[0].labelPoint, { x: 0.55, y: 0.24 });
  assert.equal(plan?.texts?.[0].value, "PONTO DE ÁGUA");
  assert.deepEqual(plan?.texts?.[0].point, { x: 0.62, y: 0.4 });
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
test("vídeo do ambiente permanece local e na fila após reabrir", async () => {
  await db.delete();
  await db.open();
  const id = uid(), timestamp = now();
  await db.transaction("rw", db.photos, db.syncOperations, async () => {
    await db.photos.put({
      id,
      environmentId: "ambiente-video",
      name: "vistoria.mp4",
      blob: new Blob(["video-local"], { type: "video/mp4" }),
      width: 1080,
      height: 1920,
      mediaType: "video",
      mimeType: "video/mp4",
      durationSeconds: 42,
      syncState: "local",
      createdAt: timestamp,
    });
    await queue("photo", id, "upload");
  });
  db.close();
  await db.open();
  const video = await db.photos.get(id);
  assert.equal(video?.mediaType, "video");
  assert.equal(video?.durationSeconds, 42);
  assert.equal(video?.blob.type, "video/mp4");
  assert.equal((await db.syncOperations.where("entityId").equals(id).first())?.status, "pending");
  await db.delete();
});
test.after(async () => {
  db.close();
});
