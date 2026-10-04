import { mkdir, readFile, writeFile, open, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { RoomState } from './types';

const TABLE = 'ti4_draft_rooms_v1';
export class StorageError extends Error {}
const localMode = () => process.env.TI4_STORAGE === 'local' && !process.env.VERCEL;
// Runtime-only local data must never be traced into a deployment bundle.
const directory = () => path.resolve(/* turbopackIgnore: true */ process.env.TI4_LOCAL_DIR || '.local-data/rooms');
const file = (id: string) => path.join(directory(), `${id}.json`);

function credentials() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new StorageError('Room storage is not configured yet.');
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.supabase.co')) throw new StorageError('Room storage configuration is invalid.');
  return {url: endpoint.origin, key};
}

async function database(query: string, init: RequestInit = {}) {
  const {url, key} = credentials();
  let result: Response;
  try {
    result = await fetch(`${url}/rest/v1/${TABLE}${query}`, {
      ...init, cache: 'no-store', signal: AbortSignal.timeout(12_000),
      headers: {apikey: key, ...(key.startsWith('eyJ') ? {Authorization: `Bearer ${key}`} : {}),
        'Content-Type': 'application/json', Prefer: 'return=representation', ...init.headers},
    });
  } catch { throw new StorageError('Room storage is temporarily unavailable. Please retry.'); }
  if (!result.ok) {
    // Never expose database details, connection strings, or credentials to a client/log.
    throw new StorageError(result.status === 404 ? 'Room storage needs its initial database setup.' : 'Room storage is temporarily unavailable. Please retry.');
  }
  return result.json() as Promise<{id: string; revision: number; state: RoomState}[]>;
}

export async function getRoom(id: string): Promise<RoomState | null> {
  if (localMode()) {
    try { return JSON.parse(await readFile(file(id), 'utf8')); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
  }
  const rows = await database(`?id=eq.${encodeURIComponent(id)}&select=id,revision,state`);
  return rows[0]?.state ?? null;
}

export async function insertRoom(state: RoomState) {
  if (localMode()) {
    await mkdir(directory(), {recursive: true});
    await writeFile(file(state.id), JSON.stringify(state), {flag: 'wx', mode: 0o600});
    return;
  }
  await database('', {method: 'POST', body: JSON.stringify({id:state.id, revision:state.revision, state})});
}

export async function saveRoom(state: RoomState, expectedRevision: number, expectedPreviewVersion?: number): Promise<boolean> {
  if (!localMode()) {
    // JSON-path filtering keeps the preview CAS atomic without adding a database column.
    // Missing and explicit null versions are legacy zero, matching the local comparison.
    const previewFilter = expectedPreviewVersion === undefined ? '' : expectedPreviewVersion === 0
      ? '&or=(state->>previewVersion.is.null,state->>previewVersion.eq.0)'
      : `&state->>previewVersion=eq.${expectedPreviewVersion}`;
    const rows = await database(`?id=eq.${encodeURIComponent(state.id)}&revision=eq.${expectedRevision}${previewFilter}`, {
      method: 'PATCH', body: JSON.stringify({state, revision:state.revision, updated_at:new Date().toISOString()}),
    });
    return rows.length === 1;
  }
  // The lock spans read/compare/write, including across local server workers.
  const lockPath = `${file(state.id)}.lock`;
  let lock: Awaited<ReturnType<typeof open>> | undefined;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { lock = await open(lockPath, 'wx', 0o600); break; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  }
  if (!lock) throw new StorageError('Another move is saving. Please retry.');
  const temp = `${file(state.id)}.${randomUUID()}.tmp`;
  try {
    const previous = await getRoom(state.id);
    if (!previous || previous.revision !== expectedRevision) return false;
    if (expectedPreviewVersion !== undefined && (previous.previewVersion ?? 0) !== expectedPreviewVersion) return false;
    await writeFile(temp, JSON.stringify(state), {mode:0o600});
    await rename(temp, file(state.id));
    return true;
  } finally {
    await lock.close();
    await unlink(lockPath).catch(() => {});
    await unlink(temp).catch(() => {});
  }
}

export async function storageReady() {
  if (localMode()) { await mkdir(directory(), {recursive:true}); return; }
  await database('?select=id&limit=1');
}
