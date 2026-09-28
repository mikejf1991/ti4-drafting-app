import { describe, expect, it } from 'vitest';
import {
  acknowledgePlacements, createPlacementVisit, leavePlacementVisit, newPlacementCellIds,
  observePlacements, parsePlacementSnapshot, placementIdentity, placementSnapshot,
  placementUpdatesKey, serializePlacementSnapshot,
} from '../lib/placement-updates';
import type { Placement } from '../lib/types';

function placement(revision: number, cellId = `${revision},0`): Placement {
  return { id: `placement:${revision}`, seatId: 0, tileId: 19 + revision, cellId, kind: 'draft', exception: false };
}

describe('browser-local placement updates', () => {
  const first = placement(1);
  const second = placement(2);
  const third = placement(3);

  it('baselines the first visible visit without labeling the existing board as new', () => {
    let visit = createPlacementVisit(null);
    visit = observePlacements(visit, [first], false);
    expect(visit.lastVisible).toBeNull();
    expect(visit.baseline).toBeNull();
    visit = observePlacements(visit, [first, second], true);
    expect(newPlacementCellIds([first, second], visit.baseline)).toEqual([]);
    expect(visit.lastVisible).toEqual(placementSnapshot([first, second]));
  });

  it('shows changes since a previous visit and accumulates live placements until acknowledged', () => {
    let visit = createPlacementVisit(placementSnapshot([first]));
    visit = observePlacements(visit, [first, second], true);
    expect(newPlacementCellIds([first, second], visit.baseline)).toEqual([second.cellId]);
    visit = observePlacements(visit, [first, second, third], true);
    expect(newPlacementCellIds([first, second, third], visit.baseline)).toEqual([second.cellId, third.cellId]);
    visit = acknowledgePlacements([first, second, third]);
    expect(newPlacementCellIds([first, second, third], visit.baseline)).toEqual([]);
    expect(visit.lastVisible).toEqual(visit.baseline);
  });

  it('persists only the visible departure snapshot despite hidden polling and repeated departures', () => {
    let visit = observePlacements(createPlacementVisit(placementSnapshot([first])), [first, second], true);
    visit = leavePlacementVisit(visit);
    const departed = visit;
    visit = observePlacements(visit, [first, second, third], false);
    visit = leavePlacementVisit(visit);
    expect(visit).toBe(departed);
    expect(visit.lastVisible).toEqual(placementSnapshot([first, second]));
    visit = observePlacements(visit, [first, second, third], true);
    expect(newPlacementCellIds([first, second, third], visit.baseline)).toEqual([third.cellId]);
  });

  it('does not mark an unseen board as seen when a returning tab loads and closes while hidden', () => {
    let visit = createPlacementVisit(placementSnapshot([first]));
    visit = observePlacements(visit, [first, second], false);
    visit = leavePlacementVisit(visit);
    expect(visit.lastVisible).toBeNull();
    expect(visit.baseline).toEqual(placementSnapshot([first]));
    visit = observePlacements(visit, [first, second], true);
    expect(newPlacementCellIds([first, second], visit.baseline)).toEqual([second.cellId]);
  });

  it('removes undone highlights and detects replaying the same tile into the same cell', () => {
    const baseline = placementSnapshot([first]);
    expect(newPlacementCellIds([first, second], baseline)).toEqual([second.cellId]);
    expect(newPlacementCellIds([first], baseline)).toEqual([]);
    const replay = { ...first, id: 'placement:5' };
    expect(newPlacementCellIds([replay], baseline)).toEqual([first.cellId]);
    expect(newPlacementCellIds([], baseline)).toEqual([]);
  });

  it('uses a stable, descriptive fallback for placements saved before IDs were introduced', () => {
    const old = { ...first, id: undefined };
    expect(placementIdentity(old)).toBe(`legacy:draft:0:${first.tileId}:${first.cellId}`);
    const baseline = placementSnapshot([old]);
    expect(newPlacementCellIds([{ ...old }], baseline)).toEqual([]);
    expect(newPlacementCellIds([{ ...old, kind: 'seed' }], baseline)).toEqual([old.cellId]);
    expect(newPlacementCellIds([{ ...old, id: 'placement:9' }], baseline)).toEqual([old.cellId]);
  });

  it('isolates host, seat, and room storage keys without using invitation credentials', () => {
    const keys = [
      placementUpdatesKey('draft', { kind: 'host' }),
      placementUpdatesKey('draft', { kind: 'seat', seatId: 0 }),
      placementUpdatesKey('draft', { kind: 'seat', seatId: 1 }),
      placementUpdatesKey('other-draft', { kind: 'seat', seatId: 0 }),
    ];
    expect(new Set(keys).size).toBe(4);
    expect(keys[0]).toBe('ti4-placement-updates:v1:draft:host');
    expect(keys[1]).toBe('ti4-placement-updates:v1:draft:seat:0');
    expect(placementUpdatesKey('draft:host', { kind: 'host' })).toContain('draft%3Ahost');
  });

  it('preserves an empty saved baseline and safely ignores malformed or obsolete browser data', () => {
    expect(parsePlacementSnapshot(serializePlacementSnapshot([]))).toEqual([]);
    const snapshot = placementSnapshot([first, second]);
    expect(parsePlacementSnapshot(serializePlacementSnapshot(snapshot))).toEqual(snapshot);
    for (const value of [null, '', '{', 'null', '[]', '{"version":2,"placementIds":[]}', '{"version":1,"placementIds":[2]}', '{"version":1,"placementIds":[""]}']) {
      expect(parsePlacementSnapshot(value)).toBeNull();
    }
    const visit = observePlacements(createPlacementVisit([]), [first], true);
    expect(newPlacementCellIds([first], visit.baseline)).toEqual([first.cellId]);
  });
});
