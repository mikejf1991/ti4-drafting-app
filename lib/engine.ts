import { CELLS, CELL_BY_ID, HOME_CELLS, neighborIds } from './board';
import { BLUE_TILES, FACTIONS, RED_TILES, TILES } from './catalog';
import type { Actor, CreateRoomInput, RoomAction, RoomState, RoomView } from './types';

type Random = () => number;
const FACTION_IDS = new Set(FACTIONS.map(faction => faction.id));
function fail(message: string): never { throw new Error(message); }
function shuffled<T>(values: T[], random: Random): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function event(state: RoomState, text: string) {
  state.history.push({ id: `${state.revision}:${state.history.length}`, text, at: state.updatedAt });
  state.history = state.history.slice(-100);
}
function validateActor(state: RoomState, actor: Actor) {
  if (actor.kind !== 'host' && (actor.kind !== 'seat' || !Number.isInteger(actor.seatId) || !state.players[actor.seatId])) fail('Unknown seat.');
}

export function createRoomState(input: CreateRoomInput, _random: Random = Math.random): RoomState {
  if (input.names.length !== 8 || input.seatTokenHashes.length !== 8) fail('A room requires exactly eight seats.');
  const title = input.title.trim();
  if (!title || title.length > 80) fail('Room title must be 1–80 characters.');
  const names = input.names.map(name => name.trim());
  if (names.some(name => !name || name.length > 32)) fail('Player names must be 1–32 characters.');
  const now = new Date().toISOString();
  return {
    schemaVersion: 1, id: input.id, title, createdAt: now, updatedAt: now, revision: 0, previewVersion: 0,
    practice: input.practice, phase: 'factions', hostTokenHash: input.hostTokenHash,
    players: names.map((name, id) => ({ id, name, tokenHash: input.seatTokenHashes[id], ranking: null, factionId: null, hand: [] })),
    priority: [], speaker: null, board: { '0,0': 18 }, speakerPool: [], unusedTiles: [], placements: [], history: [],
  };
}

function resolveFactions(state: RoomState, random: Random) {
  state.priority = shuffled(state.players.map(player => player.id), random);
  const taken = new Set<number>();
  for (const id of state.priority) {
    const player = state.players[id];
    const faction = player.ranking!.find(choice => !taken.has(choice));
    if (faction === undefined) fail('No faction available in ranking.');
    player.factionId = faction;
    taken.add(faction);
  }
  // A separate draw: speaker is independent from the faction priority draw.
  state.speaker = Math.floor(random() * 8);
  const blue = shuffled(BLUE_TILES, random);
  const red = shuffled(RED_TILES, random);
  state.speakerPool = [...blue.splice(0, 2), ...red.splice(0, 2)];
  // The remaining shuffled deck stays server-only until all four opening tiles are placed.
  state.unusedTiles = [...blue, ...red];
  HOME_CELLS.forEach((cell, index) => {
    state.board[cell.id] = FACTIONS.find(faction => faction.id === state.players[state.priority[index]].factionId)!.homeTile;
  });
  state.phase = 'speaker';
  event(state, `All factions revealed. ${state.players[state.speaker].name} is speaker and places four opening systems.`);
}

/** Preserve each seat's deal when undoing the opening transition or reading an older room. */
function reclaimHands(state: RoomState) {
  const deck = [...state.players.flatMap(player => player.hand), ...state.unusedTiles];
  state.unusedTiles = [...deck.filter(id => TILES[id].type === 'blue'), ...deck.filter(id => TILES[id].type === 'red')];
  for (const player of state.players) player.hand = [];
}

function dealHands(state: RoomState) {
  // Do not shuffle here: repeating the fourth opening placement must repeat the same deal.
  const blue = state.unusedTiles.filter(id => TILES[id].type === 'blue');
  const red = state.unusedTiles.filter(id => TILES[id].type === 'red');
  if (blue.length !== 34 || red.length !== 16) fail('The remaining system deck is incomplete.');
  for (const player of state.players) player.hand = [...blue.splice(0, 4), ...red.splice(0, 2)];
  state.unusedTiles = [...blue, ...red];
}

export function getCurrentPlayer(state: RoomState): number | null {
  if (state.phase === 'speaker') return state.speaker;
  if (state.phase !== 'placement' || state.speaker === null) return null;
  const turn = state.placements.filter(placement => placement.kind === 'draft').length;
  if (turn >= 48) return null;
  const withinSnake = turn % 16;
  const offset = withinSnake < 8 ? withinSnake : 15 - withinSnake;
  return state.priority[(state.priority.indexOf(state.speaker) + offset) % 8];
}

function activeRing(state: RoomState): number | null {
  if (state.phase === 'factions' || state.phase === 'complete') return null;
  return CELLS.find(cell => cell.homeIndex === null && !state.board[cell.id])?.ring ?? null;
}
function conflicts(state: RoomState, tileId: number, cellId: string): boolean {
  const tile = TILES[tileId];
  return neighborIds(CELL_BY_ID[cellId]).some(id => {
    // Homes are displayed for orientation but attach after drafting, so they do not
    // constrain placements. Identify home positions rather than the tile's metadata.
    const neighbor = CELL_BY_ID[id];
    if (neighbor && neighbor.homeIndex !== null) return false;
    const other = TILES[state.board[id]];
    return other && ((tile.anomalies.length > 0 && other.anomalies.length > 0) || tile.wormholes.some(wormhole => other.wormholes.includes(wormhole)));
  });
}

/** Exceptions apply only when every tile/position combination on the active ring conflicts. */
export function getLegalMoves(state: RoomState, seatId: number): RoomView['legalMoves'] {
  if (getCurrentPlayer(state) !== seatId) return [];
  const ring = activeRing(state);
  const cells = CELLS.filter(cell => cell.ring === ring && cell.homeIndex === null && !state.board[cell.id]);
  const pool = state.phase === 'speaker' ? state.speakerPool : state.players[seatId].hand;
  const all = pool.flatMap(tileId => cells.map(cell => ({ tileId, cellId: cell.id, exception: conflicts(state, tileId, cell.id) })));
  const normal = all.filter(move => !move.exception);
  return normal.length ? normal : all;
}

export function applyAction(state: RoomState, actor: Actor, action: RoomAction, random: Random = Math.random): RoomState {
  validateActor(state, actor);
  // Never mutate the caller's state, including when validation below rejects an action.
  const next = structuredClone(state);
  // Older rooms dealt normal hands before the opening. Hide them immediately in views,
  // then lazily migrate on the next successful action without resetting room progress.
  if (next.phase === 'speaker' && next.players.some(player => player.hand.length > 0)) reclaimHands(next);
  // Preview writes have their own CAS version so a pending confirmation remains
  // valid while older selections and clears cannot overwrite newer previews.
  if (action.type !== 'preview') next.revision++;
  next.updatedAt = new Date().toISOString();
  if (action.type !== 'preview') next.pendingPreview = null;
  switch (action.type) {
    case 'rank': {
      if (actor.kind !== 'seat') fail('Only a player can lock a faction ranking.');
      if (next.phase !== 'factions') fail('Faction selection is already complete.');
      const player = next.players[actor.seatId];
      if (player.ranking !== null) fail('Your faction ranking is already locked.');
      if (!Array.isArray(action.ranking) || action.ranking.length !== 8 || new Set(action.ranking).size !== 8 || action.ranking.some(id => !FACTION_IDS.has(id))) fail('Choose exactly eight distinct eligible factions.');
      player.ranking = [...action.ranking];
      event(next, `${player.name} locked a faction ranking.`);
      if (next.players.every(player => player.ranking !== null)) resolveFactions(next, random);
      break;
    }
    case 'rename': {
      if (actor.kind !== 'seat') fail('Open a player link to change that player’s name.');
      if (next.phase !== 'factions') fail('Names can only be changed during faction selection.');
      const name = typeof action.name === 'string' ? action.name.trim() : '';
      if (!name || name.length > 32) fail('Player names must be 1–32 characters.');
      next.players[actor.seatId].name = name;
      break;
    }
    case 'practice-fill': {
      if (actor.kind !== 'host') fail('Only the host can fill practice rankings.');
      if (!next.practice) fail('Automatic rankings are only available in practice rooms.');
      if (next.phase !== 'factions') fail('Faction selection is already complete.');
      for (const player of next.players) if (player.ranking === null) player.ranking = shuffled(FACTIONS.map(faction => faction.id), random).slice(0, 8);
      resolveFactions(next, random);
      break;
    }
    case 'place': {
      if (actor.kind !== 'seat') fail('Open the active player’s private link to place a tile.');
      if (next.phase !== 'speaker' && next.phase !== 'placement') fail('Tile placement is not active.');
      if (getCurrentPlayer(next) !== actor.seatId) fail('It is not your turn.');
      const kind = next.phase === 'speaker' ? 'seed' : 'draft';
      const pool = kind === 'seed' ? next.speakerPool : next.players[actor.seatId].hand;
      if (!pool.includes(action.tileId)) fail('That tile is not in your active tile pool.');
      if (!CELL_BY_ID[action.cellId] || CELL_BY_ID[action.cellId].homeIndex !== null || next.board[action.cellId]) fail('Choose an empty system position.');
      if (CELL_BY_ID[action.cellId].ring !== activeRing(next)) fail('Complete the current ring before starting the next ring.');
      const move = getLegalMoves(next, actor.seatId).find(move => move.tileId === action.tileId && move.cellId === action.cellId);
      if (!move) fail('Anomaly or matching-wormhole adjacency is forbidden while another legal placement exists.');
      pool.splice(pool.indexOf(action.tileId), 1);
      next.board[action.cellId] = action.tileId;
      next.placements.push({ id: `placement:${next.revision}`, seatId: actor.seatId, tileId: action.tileId, cellId: action.cellId, kind, exception: move.exception });
      event(next, `${next.players[actor.seatId].name} placed tile ${action.tileId}${move.exception ? ' (unavoidable adjacency exception)' : ''}.`);
      if (kind === 'seed' && next.placements.filter(placement => placement.kind === 'seed').length === 4) {
        dealHands(next);
        next.phase = 'placement';
      }
      if (next.placements.length === 52) {
        next.phase = 'complete';
        event(next, 'Galaxy complete. All 52 drafted systems are placed.');
      }
      break;
    }
    case 'preview': {
      if (actor.kind !== 'seat') fail('Open the active player’s private link to preview a tile.');
      if (next.phase !== 'speaker' && next.phase !== 'placement') fail('Tile placement is not active.');
      if (getCurrentPlayer(next) !== actor.seatId) fail('It is not your turn.');
      const move = action.move;
      if (move && !getLegalMoves(next, actor.seatId).some(legal => legal.tileId === move.tileId && legal.cellId === move.cellId)) fail('That placement is not available.');
      next.pendingPreview = move ? { seatId: actor.seatId, tileId: move.tileId, cellId: move.cellId } : null;
      next.previewVersion = (state.previewVersion ?? 0) + 1;
      break;
    }
    case 'undo': {
      if (actor.kind !== 'host') fail('Only the host can undo the last placement.');
      const placement = next.placements.pop();
      if (!placement) fail('There is no placement to undo.');
      delete next.board[placement.cellId];
      (placement.kind === 'seed' ? next.speakerPool : next.players[placement.seatId].hand).push(placement.tileId);
      if (placement.kind === 'seed') reclaimHands(next);
      next.phase = placement.kind === 'seed' ? 'speaker' : 'placement';
      event(next, `Host undid tile ${placement.tileId}; ${next.players[placement.seatId].name} places again.`);
      break;
    }
    default: fail('Unknown room action.');
  }
  return next;
}

/** A preview is shown only while it is still one of the active seat's legal moves. */
function currentPreview(state: RoomState) {
  const preview = state.pendingPreview;
  if (!preview || preview.seatId !== getCurrentPlayer(state)) return null;
  if (!getLegalMoves(state, preview.seatId).some(move => move.tileId === preview.tileId && move.cellId === preview.cellId)) return null;
  return { seatId: preview.seatId, tileId: preview.tileId, cellId: preview.cellId };
}

/** Build a whitelist projection. Never spread persisted RoomState into an API response. */
export function getRoomView(state: RoomState, actor: Actor): RoomView {
  validateActor(state, actor);
  const player = actor.kind === 'seat' ? state.players[actor.seatId] : null;
  return structuredClone({
    id: state.id, title: state.title, createdAt: state.createdAt, revision: state.revision, practice: state.practice, phase: state.phase,
    players: state.players.map(({ id, name, ranking, factionId, hand }) => ({ id, name, ready: ranking !== null, factionId: state.phase === 'factions' ? null : factionId, handCount: state.phase === 'speaker' ? (id === state.speaker ? state.speakerPool.length : 0) : hand.length })),
    priority: state.priority, speaker: state.speaker, currentPlayer: getCurrentPlayer(state),
    board: state.board, placements: state.placements, history: state.history,
    actor: actor.kind === 'host' ? { kind: 'host' as const } : { kind: 'seat' as const, seatId: actor.seatId },
    myRanking: player?.ranking ?? null, myHand: state.phase === 'speaker' ? [] : player?.hand ?? [],
    speakerPool: player?.id === state.speaker ? state.speakerPool : [],
    legalMoves: player ? getLegalMoves(state, player.id) : [],
    activeRing: activeRing(state), canUndo: actor.kind === 'host' && state.placements.length > 0,
    pendingPreview: currentPreview(state),
    previewVersion: state.previewVersion ?? 0,
  });
}
