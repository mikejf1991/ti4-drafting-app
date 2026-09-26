import { describe, expect, it } from 'vitest';
import { CELLS, HOME_CELLS, hexToPixel, neighborIds } from '../lib/board';
import { BLUE_TILES, FACTIONS, RED_TILES, TILES } from '../lib/catalog';
import { applyAction, createRoomState, getCurrentPlayer, getLegalMoves, getRoomView } from '../lib/engine';
import type { RoomState } from '../lib/types';

const rank = [1, 2, 3, 4, 5, 6, 7, 8];
function random(seed = 12) {
  return () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
}
function room(practice = false) {
  return createRoomState({ id: 'test', title: 'Eight-player draft', names: Array.from({ length: 8 }, (_, n) => `Player ${n}`), hostTokenHash: 'host-secret', seatTokenHashes: Array.from({ length: 8 }, (_, n) => `seat-secret-${n}`), practice });
}
function ready(seed = 12) {
  let state = room();
  const rng = random(seed);
  for (let seatId = 0; seatId < 8; seatId++) state = applyAction(state, { kind: 'seat', seatId }, { type: 'rank', ranking: rank }, rng);
  return state;
}
function placeFirst(state: RoomState) {
  const seatId = getCurrentPlayer(state)!;
  const move = getLegalMoves(state, seatId)[0];
  expect(move).toBeDefined();
  return applyAction(state, { kind: 'seat', seatId }, { type: 'place', tileId: move.tileId, cellId: move.cellId });
}

describe('fixed eight-player catalog and geometry', () => {
  it('has 61 unique cells, eight prescribed homes and a flat-top image layout', () => {
    expect(CELLS).toHaveLength(61);
    expect(new Set(CELLS.map(cell => cell.id)).size).toBe(61);
    expect([0, 1, 2, 3, 4].map(ring => CELLS.filter(cell => cell.ring === ring).length)).toEqual([1, 6, 12, 18, 24]);
    expect(HOME_CELLS.map(cell => CELLS.indexOf(cell))).toEqual([37, 40, 43, 46, 49, 52, 55, 58]);
    expect(HOME_CELLS.map(cell => cell.homeIndex)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(neighborIds(CELLS[0])).toHaveLength(6);
    expect(hexToPixel({ q: 1, r: 0 }, 10)).toEqual({ x: 15, y: Math.sqrt(3) * 5 });
  });
  it('contains exactly the requested factions and system pools, excluding Creuss from the deal', () => {
    expect(FACTIONS).toHaveLength(24);
    expect(BLUE_TILES).toHaveLength(36);
    expect(RED_TILES).toHaveLength(18);
    expect(new Set([...BLUE_TILES, ...RED_TILES]).size).toBe(54);
    expect([...BLUE_TILES, ...RED_TILES]).not.toContain(51);
    expect(FACTIONS.find(faction => faction.id === 17)?.homeTile).toBe(17);
    expect(TILES[51].planets[0].name).toBe('Creuss');
    expect(TILES[51].wormholes).toEqual(['delta']);
    expect(TILES[51].anomalies).toEqual([]);
    expect(TILES[51].planets[0].trait).toBeNull();
    expect(FACTIONS.find(faction => faction.id === 6)?.name).toContain('L1Z1X');
  });
});

describe('faction locking, allocation and privacy', () => {
  it('allocates eight identical ranked lists without collisions, following the priority draw', () => {
    const state = ready();
    expect(new Set(state.players.map(player => player.factionId)).size).toBe(8);
    expect(state.priority.map(id => state.players[id].factionId)).toEqual(rank);
    expect(HOME_CELLS.map(cell => state.board[cell.id])).toEqual(rank);
    expect(state.phase).toBe('speaker');
    expect(state.players.every(player => player.hand.filter(id => BLUE_TILES.includes(id)).length === 4 && player.hand.filter(id => RED_TILES.includes(id)).length === 2)).toBe(true);
    expect(state.speakerPool.filter(id => BLUE_TILES.includes(id))).toHaveLength(2);
    expect(state.speakerPool.filter(id => RED_TILES.includes(id))).toHaveLength(2);
    expect(state.unusedTiles).toHaveLength(2);
    expect(state.unusedTiles.every(id => BLUE_TILES.includes(id))).toBe(true);
    expect(new Set([...state.players.flatMap(player => player.hand), ...state.speakerPool, ...state.unusedTiles]).size).toBe(54);
  });
  it('draws speaker separately instead of assigning faction priority one', () => {
    // Fisher–Yates at .99 keeps [0..7]; a separate .99 speaker draw picks seat7.
    let state = room();
    for (let seatId = 0; seatId < 8; seatId++) state = applyAction(state, { kind: 'seat', seatId }, { type: 'rank', ranking: rank }, () => .99);
    expect(state.priority[0]).toBe(0);
    expect(state.speaker).toBe(7);
  });
  it('places Creuss Gate on the board while keeping the Creuss home system off-board', () => {
    let state = room();
    for (let seatId = 0; seatId < 8; seatId++) state = applyAction(state, { kind: 'seat', seatId }, { type: 'rank', ranking: [17, 52, 53, 54, 55, 56, 57, 58] }, random(seatId));
    expect(Object.values(state.board)).toContain(17);
    expect(Object.values(state.board)).not.toContain(51);
    for (let n = 0; n < 52; n++) state = placeFirst(state);
    expect(Object.keys(state.board)).toHaveLength(61);
    expect(Object.values(state.board)).not.toContain(51);
  });
  it('reveals nothing provisional and rejects changes to locked ranks', () => {
    let state = room();
    for (let seatId = 0; seatId < 7; seatId++) state = applyAction(state, { kind: 'seat', seatId }, { type: 'rank', ranking: rank });
    expect(state.players.every(player => player.factionId === null)).toBe(true);
    expect(state.priority).toEqual([]);
    expect(state.speaker).toBeNull();
    const host = getRoomView(state, { kind: 'host' });
    expect(host.myRanking).toBeNull();
    expect(host.players.every(player => player.factionId === null)).toBe(true);
    expect(() => applyAction(state, { kind: 'seat', seatId: 0 }, { type: 'rank', ranking: rank })).toThrow(/locked/);
    expect(() => applyAction(room(), { kind: 'seat', seatId: 0 }, { type: 'rank', ranking: [1, 1, 2, 3, 4, 5, 6, 7] })).toThrow(/eight distinct/);
    expect(() => applyAction(room(), { kind: 'seat', seatId: 0 }, { type: 'rank', ranking: [...rank.slice(0, 7), 51] })).toThrow(/eligible/);
  });
  it('whitelists all public responses and isolates the returned objects', () => {
    const state = ready();
    const host = getRoomView(state, { kind: 'host' });
    expect(host.myHand).toEqual([]);
    expect(host.myRanking).toBeNull();
    expect(host.speakerPool).toEqual([]);
    expect(host.legalMoves).toEqual([]);
    const serialized = JSON.stringify(host);
    for (const forbidden of ['secret', 'tokenHash', 'unusedTiles', '"ranking"', '"hand"']) expect(serialized).not.toContain(forbidden);
    for (let seatId = 0; seatId < 8; seatId++) {
      const view = getRoomView(state, { kind: 'seat', seatId });
      expect(view.myHand).toEqual(state.players[seatId].hand);
      expect(view.myRanking).toEqual(rank);
      expect(view.speakerPool).toEqual(seatId === state.speaker ? state.speakerPool : []);
      expect(view.legalMoves.length > 0).toBe(seatId === state.speaker);
      expect(Object.keys(view.players[0]).sort()).toEqual(['factionId', 'handCount', 'id', 'name', 'ready']);
      view.myHand.pop();
      expect(state.players[seatId].hand).toHaveLength(6);
    }
    host.board['0,0'] = 1;
    expect(state.board['0,0']).toBe(18);
  });
  it('guards practice autofill and keeps existing locked lists', () => {
    expect(() => applyAction(room(), { kind: 'host' }, { type: 'practice-fill' })).toThrow(/practice/);
    expect(() => applyAction(room(true), { kind: 'seat', seatId: 0 }, { type: 'practice-fill' })).toThrow(/host/);
    let state = applyAction(room(true), { kind: 'seat', seatId: 0 }, { type: 'rank', ranking: rank });
    state = applyAction(state, { kind: 'host' }, { type: 'practice-fill' }, random());
    expect(state.phase).toBe('speaker');
    expect(state.players[0].ranking).toEqual(rank);
    expect(new Set(state.players.map(player => player.factionId)).size).toBe(8);
  });
});

describe('placement and recovery', () => {
  it('rejects wrong turns, host placement, occupied cells, and outer rings without mutating state', () => {
    const state = ready();
    const before = structuredClone(state);
    const tileId = state.speakerPool[0];
    expect(() => applyAction(state, { kind: 'host' }, { type: 'place', tileId, cellId: '0,-1' })).toThrow(/private link/);
    expect(() => applyAction(state, { kind: 'seat', seatId: (state.speaker! + 1) % 8 }, { type: 'place', tileId, cellId: '0,-1' })).toThrow(/not your turn/);
    expect(() => applyAction(state, { kind: 'seat', seatId: state.speaker! }, { type: 'place', tileId, cellId: '0,-2' })).toThrow(/current ring/);
    expect(() => applyAction(state, { kind: 'seat', seatId: state.speaker! }, { type: 'place', tileId, cellId: '0,0' })).toThrow(/empty/);
    expect(state).toEqual(before);
  });
  it('places four seed tiles before touching a hand and double-turns at both snake ends', () => {
    let state = ready();
    const speaker = state.speaker!;
    for (let i = 0; i < 4; i++) { expect(getCurrentPlayer(state)).toBe(speaker); state = placeFirst(state); }
    expect(state.phase).toBe('placement');
    expect(state.players.every(player => player.hand.length === 6)).toBe(true);
    const order: number[] = [];
    for (let i = 0; i < 17; i++) { order.push(getCurrentPlayer(state)!); state = placeFirst(state); }
    const clockwise = Array.from({ length: 8 }, (_, i) => state.priority[(state.priority.indexOf(speaker) + i) % 8]);
    expect(order).toEqual([...clockwise, ...clockwise.toReversed(), speaker]);
  });
  it('completes 52 placements / 61 cells across many randomized drafts without a deadlock', () => {
    for (let seed = 1; seed <= 20; seed++) {
      let state = ready(seed);
      let previousRing = 1;
      for (let n = 0; n < 52; n++) {
        const moves = getLegalMoves(state, getCurrentPlayer(state)!);
        expect(moves.length).toBeGreaterThan(0);
        const ring = CELLS.find(cell => cell.id === moves[0].cellId)!.ring;
        expect(ring).toBeGreaterThanOrEqual(previousRing);
        expect(moves.every(move => CELLS.find(cell => cell.id === move.cellId)!.ring === ring)).toBe(true);
        previousRing = ring;
        state = placeFirst(state);
      }
      expect(state.phase).toBe('complete');
      expect(Object.keys(state.board)).toHaveLength(61);
      expect(new Set(Object.values(state.board)).size).toBe(61);
      expect(state.players.flatMap(player => player.hand)).toEqual([]);
      expect(state.speakerPool).toEqual([]);
      expect(getCurrentPlayer(state)).toBeNull();
      expect(state.placements.filter(placement => placement.kind === 'seed')).toHaveLength(4);
      expect(state.placements.filter(placement => placement.kind === 'draft')).toHaveLength(48);
    }
  });
  it('allows adjacency exceptions only when no available tile has a legal active-ring position', () => {
    const state = ready();
    // A ring with one empty slot surrounded by anomalies.
    for (const cell of CELLS.filter(cell => cell.ring === 1 && cell.id !== '0,-1')) state.board[cell.id] = 43;
    state.speakerPool = [42, 19];
    expect(getLegalMoves(state, state.speaker!)).toEqual([{ tileId: 19, cellId: '0,-1', exception: false }]);
    expect(() => applyAction(state, { kind: 'seat', seatId: state.speaker! }, { type: 'place', tileId: 42, cellId: '0,-1' })).toThrow(/another legal placement/);
    state.speakerPool = [42];
    expect(getLegalMoves(state, state.speaker!)).toEqual([{ tileId: 42, cellId: '0,-1', exception: true }]);
    const next = placeFirst(state);
    expect(next.placements.at(-1)?.exception).toBe(true);
  });
  it('checks alternate positions and matching wormhole types, while allowing different types', () => {
    const state = ready();
    state.speakerPool = [26]; // Alpha.
    state.board['0,-1'] = 39; // Alpha.
    const moves = getLegalMoves(state, state.speaker!);
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.some(move => move.cellId === '1,-1')).toBe(false);
    expect(moves.every(move => !move.exception)).toBe(true);
    state.board['0,-1'] = 40; // Beta.
    expect(getLegalMoves(state, state.speaker!).some(move => move.cellId === '1,-1')).toBe(true);
  });
  it('undo restores phase, active player and pool across seed, snake and completion boundaries', () => {
    let state = ready();
    const assigned = state.players.map(player => player.factionId);
    expect(() => applyAction(state, { kind: 'host' }, { type: 'undo' })).toThrow(/no placement/);
    for (let n = 0; n < 52; n++) {
      const before = state;
      state = placeFirst(state);
      if ([0, 3, 4, 11, 12, 19, 20, 51].includes(n)) {
        expect(() => applyAction(state, { kind: 'seat', seatId: state.speaker! }, { type: 'undo' })).toThrow(/host/);
        const undone = applyAction(state, { kind: 'host' }, { type: 'undo' });
        expect(undone.phase).toBe(before.phase);
        expect(undone.board).toEqual(before.board);
        expect(getCurrentPlayer(undone)).toBe(getCurrentPlayer(before));
        expect([...undone.speakerPool].sort()).toEqual([...before.speakerPool].sort());
        expect(undone.players.map(player => [...player.hand].sort())).toEqual(before.players.map(player => [...player.hand].sort()));
        expect(undone.players.map(player => player.factionId)).toEqual(assigned);
        expect(undone.revision).toBe(state.revision + 1);
      }
    }
  });
  it('permits only a seat to rename itself during faction selection', () => {
    const state = applyAction(room(), { kind: 'seat', seatId: 3 }, { type: 'rename', name: '  Ada  ' });
    expect(state.players[3].name).toBe('Ada');
    expect(() => applyAction(state, { kind: 'host' }, { type: 'rename', name: 'Bob' })).toThrow(/player link/);
    expect(() => applyAction(ready(), { kind: 'seat', seatId: 3 }, { type: 'rename', name: 'Bob' })).toThrow(/faction selection/);
  });
});
