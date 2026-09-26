import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createRoomState } from '../lib/engine';
import { authenticate, authorizedRoom, failure, HttpError, newToken, tokenHash } from '../lib/server';
import { getRoom, insertRoom, saveRoom, StorageError } from '../lib/store';
import type { RoomState } from '../lib/types';

const previous = {
  storage: process.env.TI4_STORAGE,
  localDir: process.env.TI4_LOCAL_DIR,
  vercel: process.env.VERCEL,
};
let temporaryDirectory: string;

beforeAll(async () => {
  temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'ti4-server-test-'));
  process.env.TI4_STORAGE = 'local';
  process.env.TI4_LOCAL_DIR = temporaryDirectory;
  delete process.env.VERCEL;
});

afterAll(async () => {
  for (const [key, value] of Object.entries({ TI4_STORAGE: previous.storage, TI4_LOCAL_DIR: previous.localDir, VERCEL: previous.vercel })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  await rm(temporaryDirectory, { recursive: true, force: true });
});

function room() {
  const hostToken = newToken();
  const seatTokens = Array.from({ length: 8 }, () => newToken());
  const state = createRoomState({
    id: randomUUID(), title: 'Private draft',
    names: Array.from({ length: 8 }, (_, id) => `Player ${id + 1}`),
    hostTokenHash: tokenHash(hostToken),
    seatTokenHashes: seatTokens.map(tokenHash), practice: false,
  });
  return { state, hostToken, seatTokens };
}

function request(token?: string) {
  return new Request('https://example.test/api/rooms', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

describe('private invitation authentication', () => {
  it('distinguishes host from each seat without storing bearer tokens', () => {
    const { state, hostToken, seatTokens } = room();
    expect(authenticate(state, hostToken)).toEqual({ kind: 'host' });
    for (let seatId = 0; seatId < 8; seatId++) {
      expect(authenticate(state, seatTokens[seatId])).toEqual({ kind: 'seat', seatId });
    }
    const persisted = JSON.stringify(state);
    expect(persisted).not.toContain(hostToken);
    for (const token of seatTokens) expect(persisted).not.toContain(token);
  });

  it('rejects malformed, unknown, and replaced invitations', () => {
    const { state, hostToken, seatTokens } = room();
    expect(() => authenticate(state, 'short')).toThrow(HttpError);
    expect(() => authenticate(state, newToken())).toThrow(/invalid or has been replaced/);
    state.players[0].tokenHash = tokenHash(newToken());
    expect(() => authenticate(state, seatTokens[0])).toThrow(/invalid or has been replaced/);
    expect(authenticate(state, hostToken)).toEqual({ kind: 'host' });
  });

  it('scopes bearer tokens to their room and rejects missing rooms', async () => {
    const first = room();
    const second = room();
    await Promise.all([insertRoom(first.state), insertRoom(second.state)]);
    expect((await authorizedRoom(request(first.seatTokens[2]), first.state.id)).actor).toEqual({ kind: 'seat', seatId: 2 });
    expect((await authorizedRoom(request(second.hostToken), second.state.id)).actor).toEqual({ kind: 'host' });
    await expect(authorizedRoom(request(first.seatTokens[2]), second.state.id)).rejects.toMatchObject({ status: 401 });
    await expect(authorizedRoom(request(first.hostToken), randomUUID())).rejects.toMatchObject({ status: 404 });
    await expect(authorizedRoom(request(first.hostToken), 'bad-id')).rejects.toMatchObject({ status: 404 });
    await expect(authorizedRoom(request(), first.state.id)).rejects.toMatchObject({ status: 401 });
  });

  it('returns generic unexpected errors without leaking their message or stack', async () => {
    const secret = 'sensitive-internal-error-detail';
    const result = failure(new Error(secret));
    expect(result.status).toBe(500);
    expect(result.headers.get('cache-control')).toContain('no-store');
    expect(JSON.stringify(await result.json())).not.toContain(secret);
    const storage = failure(new StorageError('Room storage is temporarily unavailable. Please retry.'));
    expect(storage.status).toBe(503);
  });
});

describe('local room persistence', () => {
  it('reads a saved revision durably and isolates other room IDs', async () => {
    const first = room().state;
    const second = room().state;
    await Promise.all([insertRoom(first), insertRoom(second)]);
    const changed: RoomState = { ...first, revision: 1, title: 'Updated title' };
    expect(await saveRoom(changed, 0)).toBe(true);
    expect(await getRoom(first.id)).toMatchObject({ revision: 1, title: 'Updated title' });
    expect(await getRoom(second.id)).toMatchObject({ revision: 0, title: 'Private draft' });
    expect(await getRoom(randomUUID())).toBeNull();
    expect(await saveRoom({ ...changed, revision: 2 }, 0)).toBe(false);
  });

  it('allows exactly one concurrent save at the same expected revision', async () => {
    const original = room().state;
    await insertRoom(original);
    const contenders = Array.from({ length: 8 }, (_, index): RoomState => ({
      ...original, revision: 1, title: `Contender ${index}`,
    }));
    const results = await Promise.all(contenders.map(state => saveRoom(state, 0)));
    expect(results.filter(Boolean)).toHaveLength(1);
    const winner = contenders[results.indexOf(true)];
    expect(await getRoom(original.id)).toMatchObject({ revision: 1, title: winner.title });
  });
});
