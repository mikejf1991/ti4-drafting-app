import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { CELLS, HOME_CELLS, neighborIds } from '../lib/board';
import { TILES } from '../lib/catalog';
import { applyAction, createRoomState, getCurrentPlayer, getLegalMoves, getRoomView } from '../lib/engine';
import { actionSchema } from '../lib/server';
import { getRoom, insertRoom, saveRoom } from '../lib/store';
import type { Actor, RoomAction, RoomState } from '../lib/types';

const rank = [1, 2, 3, 4, 5, 6, 7, 8];
function random(seed = 12) {
  return () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
}
function room(id = 'test') {
  return createRoomState({ id, title: 'Eight-player draft', names: Array.from({ length: 8 }, (_, n) => `Player ${n}`), hostTokenHash: 'host-secret', seatTokenHashes: Array.from({ length: 8 }, (_, n) => `seat-secret-${n}`), practice: false });
}
function ready(seed = 12, id = 'test') {
  let state = room(id);
  const rng = random(seed);
  for (let seatId = 0; seatId < 8; seatId++) state = applyAction(state, { kind: 'seat', seatId }, { type: 'rank', ranking: rank }, rng);
  return state;
}
const seat = (seatId: number): Actor => ({ kind: 'seat', seatId });
const host: Actor = { kind: 'host' };
function current(state: RoomState) { return getCurrentPlayer(state)!; }
function firstMove(state: RoomState) { return getLegalMoves(state, current(state))[0]; }
function place(state: RoomState, move = firstMove(state)) {
  return applyAction(state, seat(current(state)), { type: 'place', tileId: move.tileId, cellId: move.cellId });
}
function preview(state: RoomState, move: { tileId: number; cellId: string } | null = firstMove(state), actor = seat(current(state))) {
  return applyAction(state, actor, { type: 'preview', move: move && { tileId: move.tileId, cellId: move.cellId } });
}
/** Advance until `count` placements (seed + draft) exist. */
function advance(state: RoomState, count: number) {
  while (state.placements.length < count) state = place(state);
  return state;
}
function allViews(state: RoomState) {
  return [getRoomView(state, host), ...Array.from({ length: 8 }, (_, id) => getRoomView(state, seat(id)))];
}
const snapshot = (state: RoomState) => JSON.stringify(state);

describe('preview authorization and phase gating', () => {
  it('rejects the host even with a legal move', () => {
    const state = ready();
    expect(() => preview(state, firstMove(state), host)).toThrow();
  });

  it('rejects every seat other than the current player, in speaker and placement phases', () => {
    for (const state of [ready(), advance(ready(), 6)]) {
      const active = current(state);
      const move = firstMove(state);
      for (let id = 0; id < 8; id++) {
        if (id === active) continue;
        expect(() => preview(state, move, seat(id))).toThrow();
        expect(() => preview(state, null, seat(id))).toThrow();
      }
    }
  });

  it('rejects unknown seat actors (out of range, negative, fractional)', () => {
    const state = ready();
    for (const seatId of [8, -1, 0.5, Number.NaN]) expect(() => preview(state, firstMove(state), seat(seatId))).toThrow(/Unknown seat/);
  });

  it('rejects previews (including null clears) during factions and after completion', () => {
    expect(() => applyAction(room(), seat(0), { type: 'preview', move: null })).toThrow('Tile placement is not active.');
    const complete = advance(ready(), 52);
    expect(complete.phase).toBe('complete');
    for (let id = 0; id < 8; id++) {
      expect(() => applyAction(complete, seat(id), { type: 'preview', move: null })).toThrow();
      expect(() => applyAction(complete, seat(id), { type: 'preview', move: { tileId: 19, cellId: '0,-1' } })).toThrow();
    }
  });
});

describe('preview move validation', () => {
  it('rejects occupied, home, later-ring and malformed cells', () => {
    const state = ready();
    const tileId = firstMove(state).tileId;
    const ring2 = CELLS.find(cell => cell.ring === 2)!.id;
    for (const cellId of ['0,0', HOME_CELLS[0].id, ring2, '', 'abc', '9,9', '0,-1 ', '__proto__', 'constructor', 'toString', '-0,-1']) {
      expect(() => preview(state, { tileId, cellId }), cellId).toThrow();
    }
  });

  it('rejects out-of-range and non-integer tile ids', () => {
    const state = ready();
    const cellId = firstMove(state).cellId;
    for (const tileId of [0, 81, -1, 1.5, Number.NaN, Infinity, Number.MAX_SAFE_INTEGER, 18, 1]) {
      expect(() => preview(state, { tileId, cellId }), String(tileId)).toThrow();
    }
    expect(() => applyAction(state, seat(current(state)), { type: 'preview', move: { tileId: '19' as unknown as number, cellId } })).toThrow();
  });

  it('rejects an empty move object', () => {
    const state = ready();
    expect(() => applyAction(state, seat(current(state)), { type: 'preview', move: {} as { tileId: number; cellId: string } })).toThrow();
  });

  it('rejects undealt deck tiles during the speaker opening', () => {
    const state = ready();
    const cellId = firstMove(state).cellId;
    for (const tileId of state.unusedTiles.slice(0, 10)) expect(() => preview(state, { tileId, cellId })).toThrow();
  });

  it('rejects tiles from another seat’s hand and leftover undealt tiles during placement', () => {
    const state = advance(ready(), 4);
    expect(state.phase).toBe('placement');
    const active = current(state);
    const cellId = firstMove(state).cellId;
    for (const player of state.players) {
      if (player.id === active) continue;
      for (const tileId of player.hand) expect(() => preview(state, { tileId, cellId })).toThrow();
    }
    for (const tileId of state.unusedTiles) expect(() => preview(state, { tileId, cellId })).toThrow();
  });

  it('rejects a tile that is already on the board', () => {
    const state = advance(ready(), 5);
    const placed = state.placements[4];
    expect(() => preview(state, { tileId: placed.tileId, cellId: firstMove(state).cellId })).toThrow();
  });

  it('rejects a conflicting (exception) move while a normal move exists', () => {
    let state = ready();
    let found: { state: RoomState; tileId: number; cellId: string } | null = null;
    for (let i = 0; i < 52 && !found; i++) {
      const active = current(state);
      const legal = getLegalMoves(state, active);
      if (legal.every(move => !move.exception)) {
        const pool = state.phase === 'speaker' ? state.speakerPool : state.players[active].hand;
        const ring = CELLS.find(cell => cell.id === legal[0].cellId)!.ring;
        for (const tileId of pool) for (const cell of CELLS.filter(c => c.ring === ring && c.homeIndex === null && !state.board[c.id])) {
          if (!found && !legal.some(move => move.tileId === tileId && move.cellId === cell.id)) found = { state, tileId, cellId: cell.id };
        }
      }
      if (!found) state = place(state);
    }
    expect(found).not.toBeNull();
    expect(() => preview(found!.state, { tileId: found!.tileId, cellId: found!.cellId })).toThrow('That placement is not available.');
  });

  it('accepts an exception move when every option conflicts', () => {
    const state = ready();
    state.phase = 'placement';
    state.speakerPool = [];
    const ring1 = CELLS.filter(cell => cell.ring === 1);
    const target = ring1[0];
    for (const cell of ring1.slice(1)) state.board[cell.id] = 41;
    expect(neighborIds(target).some(id => state.board[id] === 41)).toBe(true);
    const active = current(state);
    state.players[active].hand = [42];
    const legal = getLegalMoves(state, active);
    expect(legal).toEqual([{ tileId: 42, cellId: target.id, exception: true }]);
    const next = preview(state, { tileId: 42, cellId: target.id });
    expect(getRoomView(next, host).pendingPreview).toEqual({ seatId: active, tileId: 42, cellId: target.id });
  });

  it('stores only seatId/tileId/cellId even when the move carries extra keys', () => {
    const state = ready();
    const move = firstMove(state);
    const next = applyAction(state, seat(current(state)), { type: 'preview', move: { ...move, exception: true, seatId: 5, hand: [1, 2] } as unknown as { tileId: number; cellId: string } });
    expect(next.pendingPreview).toEqual({ seatId: current(state), tileId: move.tileId, cellId: move.cellId });
    expect(Object.keys(getRoomView(next, host).pendingPreview!).sort()).toEqual(['cellId', 'seatId', 'tileId']);
  });
});

describe('revision and immutability', () => {
  it('does not mutate the input state on success or failure', () => {
    const state = ready();
    const before = snapshot(state);
    preview(state);
    expect(snapshot(state)).toBe(before);
    expect(() => preview(state, { tileId: 999, cellId: '0,-1' })).toThrow();
    expect(() => preview(state, firstMove(state), seat((current(state) + 1) % 8))).toThrow();
    expect(snapshot(state)).toBe(before);
  });

  it('does not mutate a legacy opening room (hands dealt during the opening) when previewing', () => {
    const state = ready(27);
    const deck = [...state.unusedTiles];
    for (const player of state.players) player.hand = deck.splice(0, 6);
    state.unusedTiles = deck;
    const before = snapshot(state);
    const next = preview(state);
    expect(snapshot(state)).toBe(before);
    expect(next.revision).toBe(state.revision);
    expect(() => preview(state, { tileId: 999, cellId: '0,-1' })).toThrow();
    expect(snapshot(state)).toBe(before);
  });

  it('keeps the revision across a long chain of previews and clears, while a place still bumps it exactly once', () => {
    let state = ready();
    const start = state.revision;
    const moves = getLegalMoves(state, current(state));
    for (let i = 0; i < 20; i++) state = preview(state, i % 3 === 2 ? null : moves[i % moves.length]);
    expect(state.revision).toBe(start);
    expect(state.history.length).toBe(ready().history.length);
    state = place(state);
    expect(state.revision).toBe(start + 1);
  });

  it('clears a stored preview on every non-preview action, including actions in the factions phase', () => {
    const forged = { seatId: 0, tileId: 19, cellId: '0,-1' };
    const ranking = room();
    ranking.pendingPreview = forged;
    expect(applyAction(ranking, seat(0), { type: 'rank', ranking: rank }).pendingPreview).toBeNull();
    const renaming = room();
    renaming.pendingPreview = forged;
    expect(applyAction(renaming, seat(0), { type: 'rename', name: 'Zed' }).pendingPreview).toBeNull();
    const filling = createRoomState({ id: 'p', title: 'Practice', names: Array.from({ length: 8 }, (_, n) => `P${n}`), hostTokenHash: 'h', seatTokenHashes: Array.from({ length: 8 }, (_, n) => `s${n}`), practice: true });
    filling.pendingPreview = forged;
    expect(applyAction(filling, host, { type: 'practice-fill' }, random()).pendingPreview).toBeNull();
  });
});

describe('preview lifecycle across turn boundaries', () => {
  it('does not carry a preview into the same seat’s second consecutive turn at a snake reversal', () => {
    let state = advance(ready(), 4 + 7);
    const before = current(state);
    const moves = getLegalMoves(state, before);
    const previewed = preview(state, moves[moves.length - 1]);
    state = place(previewed, moves[0]);
    expect(current(state)).toBe(before);
    expect(state.pendingPreview).toBeNull();
    for (const view of allViews(state)) expect(view.pendingPreview).toBeNull();
  });

  it('a stale preview replayed after the place is rejected by the revision check (simulated route)', async () => {
    const env = await localStore();
    try {
      let state = advance(ready(12, randomUUID()), 4 + 7);
      await insertRoom(state);
      const moves = getLegalMoves(state, current(state));
      const stale = { tileId: moves[moves.length - 1].tileId, cellId: moves[moves.length - 1].cellId };
      const r = state.revision;
      expect(await route(state.id, seat(current(state)), r, { type: 'preview', move: stale })).toBe(200);
      expect(await route(state.id, seat(current(state)), r, { type: 'place', ...moves[0] })).toBe(200);
      expect(await route(state.id, seat(current(state)), r, { type: 'preview', move: stale })).toBe(409);
      state = (await getRoom(state.id))!;
      expect(state.revision).toBe(r + 1);
      expect(state.pendingPreview).toBeNull();
    } finally { await env.restore(); }
  });

  it('clears the speaker’s seed preview at the speaker→placement transition', () => {
    let state = advance(ready(), 3);
    const speaker = current(state);
    state = place(preview(state));
    expect(state.phase).toBe('placement');
    expect(state.pendingPreview).toBeNull();
    expect(current(state)).toBe(speaker);
    for (const view of allViews(state)) expect(view.pendingPreview).toBeNull();
  });

  it('clears the preview on the final placement and leaves nothing visible once complete', () => {
    let state = advance(ready(), 51);
    state = preview(state);
    expect(getRoomView(state, host).pendingPreview).not.toBeNull();
    state = place(state);
    expect(state.phase).toBe('complete');
    expect(state.pendingPreview).toBeNull();
    for (const view of allViews(state)) expect(view.pendingPreview).toBeNull();
  });

  it('host undo across the seed boundary clears the preview and makes the dealt-hand tile unpreviewable', () => {
    let state = advance(ready(), 4);
    const active = current(state);
    const move = firstMove(state);
    state = preview(state, move);
    state = applyAction(state, host, { type: 'undo' });
    expect(state.phase).toBe('speaker');
    expect(state.pendingPreview).toBeNull();
    for (const view of allViews(state)) expect(view.pendingPreview).toBeNull();
    if (!state.speakerPool.includes(move.tileId)) expect(() => preview(state, move, seat(active))).toThrow();
  });
});

describe('view projection of stored/forged previews', () => {
  it('hides a stored preview whose seat is not the current player', () => {
    const state = ready();
    const other = (current(state) + 1) % 8;
    state.pendingPreview = { seatId: other, tileId: firstMove(state).tileId, cellId: firstMove(state).cellId };
    for (const view of allViews(state)) expect(view.pendingPreview).toBeNull();
  });

  it('hides (and does not throw on) previews with out-of-range or wrongly-typed seat ids', () => {
    const state = ready();
    const { tileId, cellId } = firstMove(state);
    for (const seatId of [99, -1, 8, String(current(state)) as unknown as number, null as unknown as number]) {
      state.pendingPreview = { seatId, tileId, cellId };
      for (const view of allViews(state)) expect(view.pendingPreview).toBeNull();
    }
  });

  it('hides a preview whose cell is occupied (including Mecatol, home cells and prototype keys)', () => {
    const state = advance(ready(), 5);
    const { tileId } = firstMove(state);
    for (const cellId of [state.placements[4].cellId, '0,0', HOME_CELLS[3].id, 'constructor', '__proto__']) {
      state.pendingPreview = { seatId: current(state), tileId, cellId };
      for (const view of allViews(state)) expect(view.pendingPreview, cellId).toBeNull();
    }
  });

  it('hides a preview in the factions and complete phases', () => {
    const factions = room();
    factions.pendingPreview = { seatId: 0, tileId: 19, cellId: '0,-1' };
    for (const view of allViews(factions)) expect(view.pendingPreview).toBeNull();
    const complete = advance(ready(), 52);
    for (let id = 0; id < 8; id++) {
      complete.pendingPreview = { seatId: id, tileId: 19, cellId: '0,-1' };
      expect(getRoomView(complete, host).pendingPreview).toBeNull();
    }
  });

  it('never projects extra fields smuggled into a stored preview', () => {
    const state = ready();
    const move = firstMove(state);
    state.pendingPreview = { seatId: current(state), tileId: move.tileId, cellId: move.cellId, hand: state.speakerPool, tokenHash: 'seat-secret' } as never;
    for (const view of allViews(state)) {
      expect(view.pendingPreview).toEqual({ seatId: current(state), tileId: move.tileId, cellId: move.cellId });
      expect(JSON.stringify(view)).not.toContain('seat-secret');
    }
  });

  it('a speaker-phase preview reveals only the previewed tile, not the rest of the opening pool', () => {
    const speakerState = ready();
    const next = preview(speakerState);
    const speaker = current(next);
    for (const view of [getRoomView(next, host), ...Array.from({ length: 8 }, (_, id) => id).filter(id => id !== speaker).map(id => getRoomView(next, seat(id)))]) {
      expect(view.speakerPool).toEqual([]);
      expect(view.myHand).toEqual([]);
      expect(view.legalMoves).toEqual([]);
    }
  });

  it('a placement-phase preview does not expose the active player’s other hand tiles to others', () => {
    const state = preview(advance(ready(), 6));
    const active = current(state);
    for (let id = 0; id < 8; id++) {
      if (id === active) continue;
      const view = getRoomView(state, seat(id));
      expect(view.myHand).toEqual(state.players[id].hand);
      expect(view.legalMoves).toEqual([]);
    }
  });

  // Hardening: these stored states are not producible through applyAction, but the view
  // is the privacy boundary and should only reveal a tile that could actually be placed.
  it('hides a stored preview of a tile that is not in the current player’s active pool', () => {
    const state = advance(ready(), 6);
    const active = current(state);
    const otherSeat = (active + 1) % 8;
    const secret = state.players[otherSeat].hand[0];
    state.pendingPreview = { seatId: active, tileId: secret, cellId: firstMove(state).cellId };
    expect(getRoomView(state, host).pendingPreview).toBeNull();
  });

  it('hides a stored preview pointing at a cell that is not on the board', () => {
    const state = ready();
    state.pendingPreview = { seatId: current(state), tileId: firstMove(state).tileId, cellId: '9,9' };
    expect(getRoomView(state, host).pendingPreview).toBeNull();
  });
});

describe('actionSchema for preview', () => {
  const ok = (value: unknown) => actionSchema.safeParse(value).success;
  it('rejects missing, undefined, empty, or partial moves', () => {
    expect(ok({ type: 'preview' })).toBe(false);
    expect(ok({ type: 'preview', move: undefined })).toBe(false);
    expect(ok({ type: 'preview', move: {} })).toBe(false);
    expect(ok({ type: 'preview', move: { tileId: 19 } })).toBe(false);
    expect(ok({ type: 'preview', move: { cellId: '0,-1' } })).toBe(false);
    expect(ok({ type: 'preview', move: [] })).toBe(false);
    expect(ok({ type: 'preview', move: 'null' })).toBe(false);
  });
  it('rejects bad tile ids', () => {
    for (const tileId of [0, 81, -1, 1.5, '19', 1e308, null, true]) expect(ok({ type: 'preview', move: { tileId, cellId: '0,-1' } }), String(tileId)).toBe(false);
  });
  it('rejects bad cell ids', () => {
    for (const cellId of ['', '0', '0,0,0', ' 0,0', '0,0 ', '0,0\n', '10,0', 'a,b', '0;0', 0, null]) expect(ok({ type: 'preview', move: { tileId: 19, cellId } }), JSON.stringify(cellId)).toBe(false);
  });
  it('rejects extra keys at the top level and inside move, including a JSON __proto__ key', () => {
    expect(ok({ type: 'preview', move: null, seatId: 3 })).toBe(false);
    expect(ok({ type: 'preview', move: { tileId: 19, cellId: '0,-1', seatId: 3 } })).toBe(false);
    expect(ok(JSON.parse('{"type":"preview","move":{"tileId":19,"cellId":"0,-1","__proto__":{"seatId":3}}}'))).toBe(false);
    expect(ok(JSON.parse('{"type":"preview","move":null,"__proto__":{"x":1}}'))).toBe(false);
  });
  it('accepts null and a well-formed move', () => {
    expect(ok({ type: 'preview', move: null })).toBe(true);
    expect(ok({ type: 'preview', move: { tileId: 19, cellId: '-1,0' } })).toBe(true);
  });
});

// ---- Store-level concurrency (local file mode) ----

async function localStore() {
  const previous = { storage: process.env.TI4_STORAGE, localDir: process.env.TI4_LOCAL_DIR, vercel: process.env.VERCEL };
  const dir = await mkdtemp(path.join(os.tmpdir(), 'ti4-preview-adv-'));
  process.env.TI4_STORAGE = 'local';
  process.env.TI4_LOCAL_DIR = dir;
  delete process.env.VERCEL;
  return {
    async restore() {
      for (const [key, value] of Object.entries({ TI4_STORAGE: previous.storage, TI4_LOCAL_DIR: previous.localDir, VERCEL: previous.vercel })) {
        if (value === undefined) delete process.env[key]; else process.env[key] = value;
      }
      await rm(dir, { recursive: true, force: true });
    },
  };
}

/** Mirrors app/api/rooms/[id]/actions/route.ts without the HTTP plumbing. */
async function route(id: string, actor: Actor, expectedRevision: number, action: RoomAction): Promise<number> {
  const state = (await getRoom(id))!;
  if (state.revision !== expectedRevision) return 409;
  let next: RoomState;
  try { next = applyAction(state, actor, action); } catch { return 400; }
  return (await saveRoom(next, expectedRevision)) ? 200 : 409;
}

describe('concurrency through the compare-and-swap store', () => {
  let env: Awaited<ReturnType<typeof localStore>>;
  beforeAll(async () => { env = await localStore(); });
  afterAll(async () => { await env.restore(); });

  it('a preview computed before a place can never be saved over it', async () => {
    const state = advance(ready(12, randomUUID()), 6);
    await insertRoom(state);
    const active = current(state);
    const placed = place(state);
    const stalePreview = preview(state);
    expect(await saveRoom(placed, state.revision)).toBe(true);
    expect(await saveRoom(stalePreview, state.revision)).toBe(false);
    const stored = (await getRoom(state.id))!;
    expect(stored.revision).toBe(state.revision + 1);
    expect(stored.placements).toHaveLength(7);
    expect(stored.pendingPreview).toBeNull();
    expect(current(stored)).not.toBe(active);
  });

  it('racing preview and place requests always end with the place saved and no preview', async () => {
    for (let i = 0; i < 10; i++) {
      const state = ready(12 + i, randomUUID());
      await insertRoom(state);
      const actor = seat(current(state));
      const moves = getLegalMoves(state, current(state));
      const results = await Promise.all([
        route(state.id, actor, state.revision, { type: 'preview', move: { tileId: moves[1].tileId, cellId: moves[1].cellId } }),
        route(state.id, actor, state.revision, { type: 'place', tileId: moves[0].tileId, cellId: moves[0].cellId }),
        route(state.id, actor, state.revision, { type: 'preview', move: null }),
      ]);
      const stored = (await getRoom(state.id))!;
      // The place either won or was told to retry (409); it is never silently lost behind a 200.
      if (results[1] === 200) {
        expect(stored.placements).toHaveLength(1);
        expect(stored.pendingPreview ?? null).toBeNull();
      } else {
        expect(results[1]).toBe(409);
        expect(stored.placements).toHaveLength(0);
      }
      expect(stored.revision).toBe(state.revision + stored.placements.length);
    }
  });

  it('a place still succeeds with the same expectedRevision after a saved preview', async () => {
    const state = ready(12, randomUUID());
    await insertRoom(state);
    const actor = seat(current(state));
    const move = firstMove(state);
    expect(await route(state.id, actor, state.revision, { type: 'preview', move: { tileId: move.tileId, cellId: move.cellId } })).toBe(200);
    expect((await getRoom(state.id))!.pendingPreview).toEqual({ seatId: actor.kind === 'seat' ? actor.seatId : -1, tileId: move.tileId, cellId: move.cellId });
    expect(await route(state.id, actor, state.revision, { type: 'place', tileId: move.tileId, cellId: move.cellId })).toBe(200);
    expect((await getRoom(state.id))!.pendingPreview).toBeNull();
  });

  it('a host undo racing a preview is never lost and leaves no preview', async () => {
    const base = advance(ready(12, randomUUID()), 6);
    await insertRoom(base);
    const actor = seat(current(base));
    const results = await Promise.all([
      route(base.id, actor, base.revision, { type: 'preview', move: { tileId: firstMove(base).tileId, cellId: firstMove(base).cellId } }),
      route(base.id, host, base.revision, { type: 'undo' }),
    ]);
    const stored = (await getRoom(base.id))!;
    if (results[1] === 200) {
      expect(stored.placements).toHaveLength(5);
      expect(stored.pendingPreview ?? null).toBeNull();
    } else expect(results[1]).toBe(409);
  });

  // Characterization of the deliberate trade-off: previews at one revision are last-writer-wins,
  // so a delayed earlier selection can overwrite a newer one (cosmetic only, never a placement).
  it('CHARACTERIZATION: a delayed stale preview at the same revision overwrites a newer clear', async () => {
    const state = ready(12, randomUUID());
    await insertRoom(state);
    const selected = preview(state);
    const cleared = preview(selected, null);
    expect(await saveRoom(cleared, state.revision)).toBe(true);
    expect(await saveRoom(selected, state.revision)).toBe(true);
    expect((await getRoom(state.id))!.pendingPreview).not.toBeNull();
  });
});
