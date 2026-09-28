export type Phase = 'factions' | 'speaker' | 'placement' | 'complete';
export interface Tile {
  id: number; name: string; type: 'home' | 'blue' | 'red' | 'center';
  faction?: string; planets: {name: string; resources: number; influence: number; trait: string | null; specialty: string[]}[];
  anomalies: string[]; wormholes: string[];
}
export interface Faction { id: number; name: string; shortName: string; homeTile: number; }
export interface Cell { id: string; q: number; r: number; ring: number; homeIndex: number | null; }
export interface PlayerState {
  id: number; name: string; tokenHash: string; ranking: number[] | null;
  factionId: number | null; hand: number[];
}
export interface Placement { id?: string; seatId: number; tileId: number; cellId: string; kind: 'seed' | 'draft'; exception: boolean; }
export interface HistoryEvent { id: string; text: string; at: string; }
export interface RoomState {
  schemaVersion: 1; id: string; title: string; createdAt: string; updatedAt: string; revision: number;
  practice: boolean; phase: Phase; hostTokenHash: string; players: PlayerState[];
  priority: number[]; speaker: number | null; board: Record<string, number>;
  speakerPool: number[];
  /** Server-only undealt deck during the opening; two leftover blue tiles after the normal deal. */
  unusedTiles: number[]; placements: Placement[]; history: HistoryEvent[];
}
export type Actor = { kind: 'host' } | { kind: 'seat'; seatId: number };
export type RoomAction =
  | { type: 'rank'; ranking: number[] }
  | { type: 'rename'; name: string }
  | { type: 'place'; tileId: number; cellId: string }
  | { type: 'undo' }
  | { type: 'practice-fill' };
export interface PlayerView { id: number; name: string; ready: boolean; factionId: number | null; handCount: number; }
export interface RoomView {
  id: string; title: string; createdAt: string; revision: number; practice: boolean; phase: Phase;
  players: PlayerView[]; priority: number[]; speaker: number | null; currentPlayer: number | null;
  board: Record<string, number>; placements: Placement[]; history: HistoryEvent[];
  actor: Actor; myRanking: number[] | null; myHand: number[]; speakerPool: number[];
  legalMoves: {tileId: number; cellId: string; exception: boolean}[];
  activeRing: number | null; canUndo: boolean;
}
export interface CreateRoomInput {
  id: string; title: string; names: string[]; hostTokenHash: string;
  seatTokenHashes: string[]; practice: boolean;
}
export interface CreateRoomResponse { room: RoomView; hostToken: string; seatTokens: string[]; }
