import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'yuedu_db';
const STORE_NAME = 'book_contents';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function saveBookContent(id: string, content: string) {
  const db = await getDB();
  await db.put(STORE_NAME, content, id);
}

export async function getBookContent(id: string): Promise<string | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function deleteBookContent(id: string) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}
