import { openDB, DBSchema } from 'idb';

interface AcropoleDB extends DBSchema {
  syncQueue: {
    key: string;
    value: {
      id: string;
      endpoint: string;
      method: string;
      payload: any;
      timestamp: number;
    };
  };
  pdfCache: {
    key: string;
    value: {
      url: string;
      blob: Blob;
      timestamp: number;
    };
  };
}

const DB_NAME = 'acropole-offline-db';

export async function getDB() {
  return openDB<AcropoleDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pdfCache')) {
        db.createObjectStore('pdfCache', { keyPath: 'url' });
      }
    },
  });
}

// ── Queue for Offline Actions (e.g. Flashcard Reviews) ──

export async function queueOfflineAction(endpoint: string, method: string, payload: any) {
  const db = await getDB();
  const id = crypto.randomUUID();
  await db.put('syncQueue', {
    id,
    endpoint,
    method,
    payload,
    timestamp: Date.now(),
  });
  console.log(`[OfflineSync] Queued action for ${endpoint}`);
}

export async function processSyncQueue() {
  if (!navigator.onLine) return;
  
  const db = await getDB();
  const tx = db.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');
  const items = await store.getAll();

  if (items.length === 0) return;

  console.log(`[OfflineSync] Processing ${items.length} queued actions...`);

  for (const item of items) {
    try {
      const res = await fetch(item.endpoint, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });

      if (res.ok || res.status >= 400) {
        // If success or unrecoverable client error, remove from queue
        await db.delete('syncQueue', item.id);
      }
    } catch (e) {
      console.warn(`[OfflineSync] Failed to sync item ${item.id}, will retry later`, e);
      // Stop processing queue if network is down again
      break; 
    }
  }
}

// ── PDF Caching for Offline Reading ──

export async function cachePdfOffline(url: string, blob: Blob) {
  const db = await getDB();
  await db.put('pdfCache', {
    url,
    blob,
    timestamp: Date.now(),
  });
  console.log(`[OfflineSync] PDF cached: ${url}`);
}

export async function getCachedPdf(url: string): Promise<Blob | null> {
  const db = await getDB();
  const record = await db.get('pdfCache', url);
  return record ? record.blob : null;
}
