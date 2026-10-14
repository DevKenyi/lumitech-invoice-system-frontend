import { openDB } from "idb";

const DB_NAME = "lumiledger-foodpos";
const DB_VERSION = 1;

const CART_DRAFT_KEY = "current";
const MENU_SNAPSHOT_KEY = "current";

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("cartDraft")) {
          db.createObjectStore("cartDraft");
        }
        if (!db.objectStoreNames.contains("pendingOrders")) {
          const store = db.createObjectStore("pendingOrders", { keyPath: "clientOrderId" });
          store.createIndex("status", "status");
        }
        if (!db.objectStoreNames.contains("menuSnapshot")) {
          db.createObjectStore("menuSnapshot");
        }
      },
    });
  }
  return dbPromise;
}

// ── Cart draft — survives refresh/crash while an order is being built ────────

export async function saveCartDraft(draft) {
  const db = await getDb();
  await db.put("cartDraft", draft, CART_DRAFT_KEY);
}

export async function getCartDraft() {
  const db = await getDb();
  return db.get("cartDraft", CART_DRAFT_KEY);
}

export async function clearCartDraft() {
  const db = await getDb();
  await db.delete("cartDraft", CART_DRAFT_KEY);
}

// ── Pending orders — durable record of every order created on this device ───

export async function saveLocalOrder(order) {
  const db = await getDb();
  await db.put("pendingOrders", order);
}

export async function markLocalOrderSynced(clientOrderId, serverOrder) {
  const db = await getDb();
  const existing = await db.get("pendingOrders", clientOrderId);
  if (!existing) return;
  await db.put("pendingOrders", {
    ...existing,
    status: "synced",
    serverOrderNumber: serverOrder.orderNumber,
    serverId: serverOrder.id,
  });
}

export async function markLocalOrderFailed(clientOrderId, errorMessage) {
  const db = await getDb();
  const existing = await db.get("pendingOrders", clientOrderId);
  if (!existing) return;
  await db.put("pendingOrders", { ...existing, status: "failed", lastError: errorMessage });
}

export async function listPendingOrders() {
  const db = await getDb();
  const all = await db.getAllFromIndex("pendingOrders", "status", "pending_sync");
  const failed = await db.getAllFromIndex("pendingOrders", "status", "failed");
  return [...all, ...failed].sort((a, b) => a.createdAt - b.createdAt);
}

export async function getLocalOrder(clientOrderId) {
  const db = await getDb();
  return db.get("pendingOrders", clientOrderId);
}

export async function nextLocalOrderNumber() {
  const pending = await listPendingOrders();
  const synced = await (async () => {
    const db = await getDb();
    return db.getAllFromIndex("pendingOrders", "status", "synced");
  })();
  const count = pending.length + synced.length;
  return `LOCAL-${String(count + 1).padStart(3, "0")}`;
}

// ── Menu snapshot — last successfully-fetched menu, for offline fallback ────

export async function saveMenuSnapshot(snapshot) {
  const db = await getDb();
  await db.put("menuSnapshot", { ...snapshot, fetchedAt: Date.now() }, MENU_SNAPSHOT_KEY);
}

export async function getMenuSnapshot() {
  const db = await getDb();
  return db.get("menuSnapshot", MENU_SNAPSHOT_KEY);
}
