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
// Persisted pre-correction shape: all eight six-tile hands existed during the opening.
function legacyOpening(placed: number) {
  let state = ready(27);
  for (let i = 0; i < placed; i++) state = placeFirst(state);
  const blue = state.unusedTiles.filter(id => BLUE_TILES.includes(id));
  const red = state.unusedTiles.filter(id => RED_TILES.includes(id));
  for (const player of state.players) player.hand = [...blue.splice(0, 4), ...red.splice(0, 2)];
  state.unusedTiles = [...blue, ...red];
  return state;
}
// A focused ring-three geometry fixture with ordinary systems throughout the inner rings.
function homeAdjacencyFixture(homeTile: number, tileId: number) {
  const state = ready();
  state.phase = 'placement';
  state.speakerPool = [];
  for (const cell of CELLS.filter(cell => cell.ring === 1 || cell.ring === 2)) state.board[cell.id] = 19;
  const home = HOME_CELLS[0];
  state.board[home.id] = homeTile;
  const target = CELLS.find(cell => cell.ring === 3 && neighborIds(home).includes(cell.id))!;
  state.players[state.speaker!].hand = [tileId, 19];
  return { state, home, target };
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
    expect(state.players.every(player => player.hand.length === 0)).toBe(true);
    expect(state.speakerPool.filter(id => BLUE_TILES.includes(id))).toHaveLength(2);
    expect(state.speakerPool.filter(id => RED_TILES.includes(id))).toHaveLength(2);
    expect(state.unusedTiles).toHaveLength(50);
    expect(state.unusedTiles.filter(id => BLUE_TILES.includes(id))).toHaveLength(34);
    expect(state.unusedTiles.filter(id => RED_TILES.includes(id))).toHaveLength(16);
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
    let state = ready();
    for (let i = 0; i < 4; i++) state = placeFirst(state);
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
  it.each([0, 1, 2, 3])('hides legacy opening hands immediately and preserves their deal after %i placed opening tiles', placed => {
    let state = legacyOpening(placed);
    const original = structuredClone(state);
    const originalHands = state.players.map(player => [...player.hand]);
    const originalUnused = [...state.unusedTiles];
    const expectedCounts = state.players.map(player => player.id === state.speaker ? 4 - placed : 0);
    expect(getRoomView(state, { kind: 'host' }).players.map(player => player.handCount)).toEqual(expectedCounts);
    for (const player of state.players) {
      const view = getRoomView(state, { kind: 'seat', seatId: player.id });
      expect(view.myHand).toEqual([]);
      expect(view.players.map(player => player.handCount)).toEqual(expectedCounts);
      expect(view.speakerPool).toEqual(player.id === state.speaker ? state.speakerPool : []);
    }
    expect(state).toEqual(original); // Reads must not mutate persisted state.
    const first = getLegalMoves(state, state.speaker!)[0];
    expect(() => applyAction(state, { kind: 'host' }, { type: 'place', tileId: first.tileId, cellId: first.cellId })).toThrow(/private link/);
    expect(state).toEqual(original); // A rejected action must not persist the migration.
    for (let i = placed; i < 4; i++) {
      const before = structuredClone(state);
      const move = getLegalMoves(state, state.speaker!)[0];
      state = applyAction(state, { kind: 'seat', seatId: state.speaker! }, { type: 'place', tileId: move.tileId, cellId: move.cellId }, () => { throw new Error('Legacy migration must not reroll.'); });
      expect(state.schemaVersion).toBe(1);
      expect(state.revision).toBe(before.revision + 1);
      expect(state.priority).toEqual(original.priority);
      expect(state.speaker).toBe(original.speaker);
      expect(state.board).toEqual({ ...before.board, [move.cellId]: move.tileId });
      expect(state.placements.slice(0, -1)).toEqual(before.placements);
      if (i < 3) {
        expect(state.phase).toBe('speaker');
        expect(state.players.flatMap(player => player.hand)).toEqual([]);
        expect(state.unusedTiles).toHaveLength(50);
      }
    }
    expect(state.phase).toBe('placement');
    expect(state.players.map(player => player.hand)).toEqual(originalHands);
    expect(state.unusedTiles).toEqual(originalUnused);
  });
  it('migrates an old opening room when the host undoes an opening placement', () => {
    const state = legacyOpening(3);
    const originalHands = state.players.map(player => [...player.hand]);
    const last = state.placements.at(-1)!;
    let undone = applyAction(state, { kind: 'host' }, { type: 'undo' });
    expect(undone.placements).toHaveLength(2);
    expect(undone.board[last.cellId]).toBeUndefined();
    expect(undone.speakerPool).toContain(last.tileId);
    expect(undone.players.flatMap(player => player.hand)).toEqual([]);
    expect(undone.unusedTiles).toHaveLength(50);
    undone = placeFirst(placeFirst(undone));
    expect(undone.players.map(player => player.hand)).toEqual(originalHands);
  });
  it('withdraws every normal hand when undoing the fourth opening and repeats exactly the same deal', () => {
    let state = ready();
    for (let i = 0; i < 3; i++) state = placeFirst(state);
    const before = structuredClone(state);
    const move = getLegalMoves(state, state.speaker!)[0];
    const action = { type: 'place' as const, tileId: move.tileId, cellId: move.cellId };
    const dealt = applyAction(state, { kind: 'seat', seatId: state.speaker! }, action);
    for (let retry = 0; retry < 3; retry++) {
      const undone = applyAction(retry === 0 ? dealt : state, { kind: 'host' }, { type: 'undo' });
      expect(undone.phase).toBe('speaker');
      expect(undone.board).toEqual(before.board);
      expect(undone.placements).toEqual(before.placements);
      expect(undone.players.flatMap(player => player.hand)).toEqual([]);
      expect(undone.unusedTiles).toEqual(before.unusedTiles);
      for (const player of undone.players) {
        const view = getRoomView(undone, { kind: 'seat', seatId: player.id });
        expect(view.myHand).toEqual([]);
        expect(view.players.map(player => player.handCount)).toEqual(undone.players.map(other => other.id === undone.speaker ? 1 : 0));
      }
      state = applyAction(undone, { kind: 'seat', seatId: undone.speaker! }, action, () => { throw new Error('Replay must not reroll.'); });
      expect(state.phase).toBe('placement');
      expect(state.players.map(player => player.hand)).toEqual(dealt.players.map(player => player.hand));
      expect(state.unusedTiles).toEqual(dealt.unusedTiles);
      expect(getCurrentPlayer(state)).toBe(state.speaker);
    }
  });
  it('does not migrate or redeal rooms already in normal placement or complete', () => {
    let state = legacyOpening(3);
    state = placeFirst(state);
    for (let i = 0; i < 48; i++) {
      const before = structuredClone(state);
      const current = getCurrentPlayer(state)!;
      for (const player of state.players) expect(getRoomView(state, { kind: 'seat', seatId: player.id }).myHand).toEqual(player.hand);
      expect(state).toEqual(before);
      const move = getLegalMoves(state, current)[0];
      state = applyAction(state, { kind: 'seat', seatId: current }, { type: 'place', tileId: move.tileId, cellId: move.cellId }, () => { throw new Error('Normal placement must not reroll.'); });
      expect(state.unusedTiles).toEqual(before.unusedTiles);
      expect(state.board).toEqual({ ...before.board, [move.cellId]: move.tileId });
      for (const player of state.players) expect(player.hand).toEqual(before.players[player.id].hand.filter(id => player.id !== current || id !== move.tileId));
    }
    const complete = structuredClone(state);
    const view = getRoomView(state, { kind: 'host' });
    expect(view.phase).toBe('complete');
    expect(view.board).toEqual(complete.board);
    expect(view.currentPlayer).toBeNull();
    expect(state).toEqual(complete);
  });
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
  it('deals normal hands only after all four opening placements, preserving the hidden deck order', () => {
    let state = ready();
    const deck = [...state.unusedTiles];
    const expectedBlue = deck.filter(id => BLUE_TILES.includes(id));
    const expectedRed = deck.filter(id => RED_TILES.includes(id));
    for (let i = 0; i < 4; i++) {
      expect(state.phase).toBe('speaker');
      expect(state.players.every(player => player.hand.length === 0)).toBe(true);
      expect(state.unusedTiles).toEqual(deck);
      const host = getRoomView(state, { kind: 'host' });
      expect(host.players.map(player => player.handCount)).toEqual(state.players.map(player => player.id === state.speaker ? 4 - i : 0));
      expect(host.myHand).toEqual([]);
      expect(host.speakerPool).toEqual([]);
      for (const player of state.players) {
        const view = getRoomView(state, { kind: 'seat', seatId: player.id });
        expect(view.myHand).toEqual([]);
        expect(view.speakerPool).toEqual(player.id === state.speaker ? state.speakerPool : []);
        expect(JSON.stringify(view)).not.toContain('unusedTiles');
      }
      const move = getLegalMoves(state, state.speaker!)[0];
      expect(CELLS.find(cell => cell.id === move.cellId)?.ring).toBe(1);
      expect(() => applyAction(state, { kind: 'seat', seatId: state.speaker! }, { type: 'place', tileId: deck[0], cellId: move.cellId })).toThrow(/active tile pool/);
      state = applyAction(state, { kind: 'seat', seatId: state.speaker! }, { type: 'place', tileId: move.tileId, cellId: move.cellId }, () => { throw new Error('Opening placement must not reroll the deck.'); });
    }
    expect(state.phase).toBe('placement');
    expect(getCurrentPlayer(state)).toBe(state.speaker);
    expect(state.speakerPool).toEqual([]);
    for (const player of state.players) {
      expect(player.hand).toEqual([...expectedBlue.splice(0, 4), ...expectedRed.splice(0, 2)]);
      expect(getRoomView(state, { kind: 'seat', seatId: player.id }).myHand).toEqual(player.hand);
    }
    expect(state.unusedTiles).toEqual(expectedBlue);
    expect(state.unusedTiles).toHaveLength(2);
    expect(expectedRed).toEqual([]);
  });
  it('follows all 48 snake turns, including both double-turn ends and the final speaker turn', () => {
    let state = ready();
    const speaker = state.speaker!;
    for (let i = 0; i < 4; i++) { expect(getCurrentPlayer(state)).toBe(speaker); state = placeFirst(state); }
    expect(state.phase).toBe('placement');
    expect(state.players.every(player => player.hand.length === 6)).toBe(true);
    const order: number[] = [];
    for (let i = 0; i < 48; i++) { order.push(getCurrentPlayer(state)!); state = placeFirst(state); }
    const clockwise = Array.from({ length: 8 }, (_, i) => state.priority[(state.priority.indexOf(speaker) + i) % 8]);
    expect(order).toEqual(Array.from({ length: 3 }, () => [...clockwise, ...clockwise.toReversed()]).flat());
    expect(order.flatMap((id, index) => id === speaker ? [index] : [])).toEqual([0, 15, 16, 31, 32, 47]);
    expect(order.flatMap((id, index) => id === clockwise[7] ? [index] : [])).toEqual([7, 8, 23, 24, 39, 40]);
    for (const player of state.players) expect(order.filter(id => id === player.id)).toHaveLength(6);
    expect(state.phase).toBe('complete');
    expect(getCurrentPlayer(state)).toBeNull();
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
  it('ignores the Empyrean nebula home when placing a neighboring anomaly', () => {
    const { state, target } = homeAdjacencyFixture(56, 43);
    expect(TILES[56].anomalies).toEqual(['nebula']);
    const move = { tileId: 43, cellId: target.id, exception: false };
    expect(getLegalMoves(state, state.speaker!)).toContainEqual(move);
    const placed = applyAction(state, { kind: 'seat', seatId: state.speaker! }, { type: 'place', ...move });
    expect(placed.board[target.id]).toBe(43);
    expect(placed.placements.at(-1)?.exception).toBe(false);
    expect(getRoomView(state, { kind: 'seat', seatId: state.speaker! }).activeRing).toBe(3);
  });
  it('ignores a matching wormhole on the Creuss home position', () => {
    // The base/PoK deal contains no delta tile; tile 51 exercises delta matching in this fixture.
    const { state, target } = homeAdjacencyFixture(17, 51);
    expect(TILES[17].wormholes).toEqual(['delta']);
    expect(TILES[51].wormholes).toEqual(['delta']);
    expect(getLegalMoves(state, state.speaker!)).toContainEqual({ tileId: 51, cellId: target.id, exception: false });
  });
  it('excludes homes by board position rather than tile type or absent metadata', () => {
    const { state, home, target } = homeAdjacencyFixture(79, 26);
    expect(TILES[79].type).toBe('red');
    expect(TILES[79].wormholes).toEqual(['alpha']);
    expect(getLegalMoves(state, state.speaker!)).toContainEqual({ tileId: 26, cellId: target.id, exception: false });
    const neighbor = CELLS.find(cell => cell.ring === 3 && neighborIds(target).includes(cell.id))!;
    state.board[home.id] = 1;
    state.board[neighbor.id] = 79;
    expect(getLegalMoves(state, state.speaker!).some(move => move.tileId === 26 && move.cellId === target.id)).toBe(false);
  });
  it.each([67, 68])('still blocks an anomaly next to non-home planet/anomaly tile %i', blocker => {
    const { state, target } = homeAdjacencyFixture(56, 43);
    const neighbor = CELLS.find(cell => cell.ring === 3 && neighborIds(target).includes(cell.id))!;
    state.board[neighbor.id] = blocker;
    expect(TILES[blocker].planets.length).toBeGreaterThan(0);
    expect(TILES[blocker].anomalies.length).toBeGreaterThan(0);
    expect(getLegalMoves(state, state.speaker!)).toContainEqual({ tileId: 19, cellId: target.id, exception: false });
    expect(getLegalMoves(state, state.speaker!).some(move => move.tileId === 43 && move.cellId === target.id)).toBe(false);
    expect(() => applyAction(state, { kind: 'seat', seatId: state.speaker! }, { type: 'place', tileId: 43, cellId: target.id })).toThrow(/another legal placement/);
  });
  it.each([67, 68])('still treats non-home planet/anomaly tile %i as an anomaly when placing it', tileId => {
    const { state, target } = homeAdjacencyFixture(56, tileId);
    const neighbor = CELLS.find(cell => cell.ring === 3 && neighborIds(target).includes(cell.id))!;
    state.board[neighbor.id] = 43;
    expect(getLegalMoves(state, state.speaker!).some(move => move.tileId === tileId && move.cellId === target.id)).toBe(false);
  });
  it('gives an undo/replay of the same tile and position a new public placement ID', () => {
    const state = ready();
    const move = getLegalMoves(state, state.speaker!)[0];
    const action = { type: 'place' as const, tileId: move.tileId, cellId: move.cellId };
    const placed = applyAction(state, { kind: 'seat', seatId: state.speaker! }, action);
    const first = structuredClone(placed.placements[0]);
    expect(first.id).toBe(`placement:${placed.revision}`);
    expect(getRoomView(placed, { kind: 'host' }).placements[0].id).toBe(first.id);
    const undone = applyAction(placed, { kind: 'host' }, { type: 'undo' });
    expect(undone.placements).toEqual([]);
    const replayed = applyAction(undone, { kind: 'seat', seatId: state.speaker! }, action);
    const second = replayed.placements[0];
    expect(second.id).toBe(`placement:${replayed.revision}`);
    expect(second.id).not.toBe(first.id);
    expect(second).toEqual({ ...first, id: second.id });
    expect(placed.placements[0]).toEqual(first);
  });
  it('preserves older placements without IDs while assigning IDs only to newly placed tiles', () => {
    let state = placeFirst(placeFirst(ready()));
    for (const placement of state.placements) delete placement.id;
    const legacy = structuredClone(state);
    expect(getRoomView(state, { kind: 'host' }).placements).toEqual(legacy.placements);
    expect(state).toEqual(legacy);
    const next = placeFirst(state);
    expect(next.placements.slice(0, 2)).toEqual(legacy.placements);
    expect(next.placements.at(-1)?.id).toBe(`placement:${next.revision}`);
    const undone = applyAction(next, { kind: 'host' }, { type: 'undo' });
    expect(undone.placements).toEqual(legacy.placements);
    const legacyUndo = applyAction(undone, { kind: 'host' }, { type: 'undo' });
    expect(legacyUndo.placements).toEqual(legacy.placements.slice(0, 1));
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

describe('shared placement previews', () => {
  function previewing() {
    const state = ready();
    const seatId = getCurrentPlayer(state)!;
    const move = getLegalMoves(state, seatId)[0];
    const next = applyAction(state, { kind: 'seat', seatId }, { type: 'preview', move: { tileId: move.tileId, cellId: move.cellId } });
    return { state, next, seatId, move };
  }

  it('shares the active player’s selection with every viewer without advancing the revision', () => {
    const { state, next, seatId, move } = previewing();
    expect(next.revision).toBe(state.revision);
    expect(next.board[move.cellId]).toBeUndefined();
    const expected = { seatId, tileId: move.tileId, cellId: move.cellId };
    expect(getRoomView(next, { kind: 'host' }).pendingPreview).toEqual(expected);
    for (let viewer = 0; viewer < 8; viewer++) expect(getRoomView(next, { kind: 'seat', seatId: viewer }).pendingPreview).toEqual(expected);
  });

  it('replaces and clears the preview as the selection changes', () => {
    const { next, seatId } = previewing();
    const other = getLegalMoves(next, seatId)[1];
    const moved = applyAction(next, { kind: 'seat', seatId }, { type: 'preview', move: { tileId: other.tileId, cellId: other.cellId } });
    expect(getRoomView(moved, { kind: 'host' }).pendingPreview).toMatchObject({ tileId: other.tileId, cellId: other.cellId });
    const cleared = applyAction(moved, { kind: 'seat', seatId }, { type: 'preview', move: null });
    expect(getRoomView(cleared, { kind: 'host' }).pendingPreview).toBeNull();
  });

  it('clears the preview when the placement is confirmed or undone', () => {
    const { next, seatId, move } = previewing();
    const placed = applyAction(next, { kind: 'seat', seatId }, { type: 'place', tileId: move.tileId, cellId: move.cellId });
    expect(placed.revision).toBe(next.revision + 1);
    expect(placed.pendingPreview).toBeNull();
    expect(getRoomView(placed, { kind: 'host' }).pendingPreview).toBeNull();
    const nextSeat = getCurrentPlayer(placed)!;
    const nextMove = getLegalMoves(placed, nextSeat)[0];
    const previewed = applyAction(placed, { kind: 'seat', seatId: nextSeat }, { type: 'preview', move: { tileId: nextMove.tileId, cellId: nextMove.cellId } });
    expect(applyAction(previewed, { kind: 'host' }, { type: 'undo' }).pendingPreview).toBeNull();
  });

  it('only accepts previews of the active player’s legal moves', () => {
    const { state, seatId, move } = previewing();
    const waiting = (seatId + 1) % 8;
    expect(() => applyAction(state, { kind: 'seat', seatId: waiting }, { type: 'preview', move: { tileId: move.tileId, cellId: move.cellId } })).toThrow('It is not your turn.');
    expect(() => applyAction(state, { kind: 'host' }, { type: 'preview', move: null })).toThrow();
    expect(() => applyAction(state, { kind: 'seat', seatId }, { type: 'preview', move: { tileId: move.tileId, cellId: '0,0' } })).toThrow('That placement is not available.');
    expect(() => applyAction(room(), { kind: 'seat', seatId: 0 }, { type: 'preview', move: null })).toThrow('Tile placement is not active.');
  });

  it('treats rooms saved before previews existed as having none', () => {
    const state = ready();
    delete state.pendingPreview;
    expect(getRoomView(state, { kind: 'host' }).pendingPreview).toBeNull();
  });
});
