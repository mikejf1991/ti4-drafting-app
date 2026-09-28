import type { Actor, Placement } from './types';

export type PlacementSnapshot = readonly string[];

export interface PlacementVisit {
  /** Fixed for the visible visit so newly arriving placements stay highlighted. */
  baseline: PlacementSnapshot | null;
  /** Only snapshots actually displayed while visible may become the next baseline. */
  lastVisible: PlacementSnapshot | null;
  active: boolean;
}

export function placementIdentity(placement: Placement): string {
  return placement.id ?? `legacy:${placement.kind}:${placement.seatId}:${placement.tileId}:${placement.cellId}`;
}

export function placementSnapshot(placements: readonly Placement[]): PlacementSnapshot {
  return placements.map(placementIdentity);
}

export function placementUpdatesKey(roomId: string, actor: Actor): string {
  const viewer = actor.kind === 'host' ? 'host' : `seat:${actor.seatId}`;
  return `ti4-placement-updates:v1:${encodeURIComponent(roomId)}:${viewer}`;
}

export function parsePlacementSnapshot(value: string | null): PlacementSnapshot | null {
  if (value === null) return null;
  try {
    const saved: unknown = JSON.parse(value);
    if (!saved || typeof saved !== 'object' || !('version' in saved) || saved.version !== 1 || !('placementIds' in saved)) return null;
    const ids = saved.placementIds;
    return Array.isArray(ids) && ids.every(id => typeof id === 'string' && id.length > 0) ? ids : null;
  } catch {
    return null;
  }
}

export function serializePlacementSnapshot(snapshot: PlacementSnapshot): string {
  return JSON.stringify({ version: 1, placementIds: snapshot });
}

export function createPlacementVisit(saved: PlacementSnapshot | null): PlacementVisit {
  return { baseline: saved, lastVisible: null, active: false };
}

export function observePlacements(visit: PlacementVisit, placements: readonly Placement[], visible: boolean): PlacementVisit {
  if (!visible) return visit;
  const snapshot = placementSnapshot(placements);
  return { baseline: visit.baseline ?? snapshot, lastVisible: snapshot, active: true };
}

export function leavePlacementVisit(visit: PlacementVisit): PlacementVisit {
  if (!visit.active) return visit;
  return { baseline: visit.lastVisible ?? visit.baseline, lastVisible: visit.lastVisible, active: false };
}

export function acknowledgePlacements(placements: readonly Placement[]): PlacementVisit {
  const snapshot = placementSnapshot(placements);
  return { baseline: snapshot, lastVisible: snapshot, active: true };
}

export function newPlacementCellIds(placements: readonly Placement[], baseline: PlacementSnapshot | null): string[] {
  if (baseline === null) return [];
  const seen = new Set(baseline);
  return placements.filter(placement => !seen.has(placementIdentity(placement))).map(placement => placement.cellId);
}
