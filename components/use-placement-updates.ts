'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  acknowledgePlacements, createPlacementVisit, leavePlacementVisit, newPlacementCellIds,
  observePlacements, parsePlacementSnapshot, placementUpdatesKey, serializePlacementSnapshot,
  type PlacementSnapshot, type PlacementVisit,
} from '@/lib/placement-updates';
import type { RoomView } from '@/lib/types';

interface VisitSession { key: string; visit: PlacementVisit; }
interface VisibleBaseline { key: string; snapshot: PlacementSnapshot; }

function loadSnapshot(key: string): PlacementSnapshot | null {
  try { return parsePlacementSnapshot(localStorage.getItem(key)); }
  catch { return null; }
}

function saveVisibleSnapshot(session: VisitSession) {
  if (session.visit.lastVisible === null) return;
  try { localStorage.setItem(session.key, serializePlacementSnapshot(session.visit.lastVisible)); }
  catch { /* Browser storage may be blocked or full; tracking still works for this visit. */ }
}

export function usePlacementUpdates(room: RoomView | null, roomId: string): { newCellIds: string[]; markSeen: () => void } {
  const session = useRef<VisitSession | null>(null);
  const latestRoom = useRef<RoomView | null>(null);
  const pageHidden = useRef(false);
  const [baseline, setBaseline] = useState<VisibleBaseline | null>(null);
  const key = room?.id === roomId ? placementUpdatesKey(roomId, room.actor) : null;

  const publishBaseline = useCallback(() => {
    const current = session.current;
    setBaseline(previous => {
      if (!current || current.visit.baseline === null) return previous === null ? previous : null;
      if (previous?.key === current.key && previous.snapshot === current.visit.baseline) return previous;
      return { key: current.key, snapshot: current.visit.baseline };
    });
  }, []);

  const leave = useCallback(() => {
    if (!session.current) return;
    session.current.visit = leavePlacementVisit(session.current.visit);
    saveVisibleSnapshot(session.current);
  }, []);

  const observe = useCallback(() => {
    const current = session.current;
    const latest = latestRoom.current;
    if (!current || !latest) return;
    current.visit = observePlacements(current.visit, latest.placements, !document.hidden && !pageHidden.current);
    publishBaseline();
  }, [publishBaseline]);

  useEffect(() => {
    latestRoom.current = room?.id === roomId ? room : null;
    if (!key) {
      // Loading can separate two seat identities. Save the departing seat before clearing it.
      leave();
      session.current = null;
      publishBaseline();
      return;
    }
    if (session.current?.key !== key) {
      leave();
      session.current = { key, visit: createPlacementVisit(loadSnapshot(key)) };
    }
    observe();
  }, [key, room, roomId, leave, observe, publishBaseline]);

  useEffect(() => {
    const resume = () => {
      if (document.hidden) return;
      pageHidden.current = false;
      observe();
    };
    const hide = () => {
      pageHidden.current = true;
      leave();
      publishBaseline();
    };
    const visibilityChanged = () => { if (document.hidden) hide(); else resume(); };
    document.addEventListener('visibilitychange', visibilityChanged);
    window.addEventListener('pagehide', hide);
    window.addEventListener('pageshow', resume);
    window.addEventListener('focus', resume);
    return () => {
      document.removeEventListener('visibilitychange', visibilityChanged);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('pageshow', resume);
      window.removeEventListener('focus', resume);
      // Do not advance the in-memory baseline: React's development effect replay
      // also runs this cleanup, and must not dismiss the current visit's highlights.
      if (session.current) saveVisibleSnapshot(session.current);
    };
  }, [leave, observe, publishBaseline]);

  const markSeen = useCallback(() => {
    const current = session.current;
    const latest = latestRoom.current;
    if (!current || current.key !== key || !latest || document.hidden || pageHidden.current) return;
    current.visit = acknowledgePlacements(latest.placements);
    saveVisibleSnapshot(current);
    publishBaseline();
  }, [key, publishBaseline]);

  // A newly selected seat never renders highlights left over from the previous seat.
  const newCellIds = room && key === baseline?.key ? newPlacementCellIds(room.placements, baseline.snapshot) : [];
  return { newCellIds, markSeen };
}
