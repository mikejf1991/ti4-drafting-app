'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CELLS } from '@/lib/board';
import { FACTIONS, TILES, tileImage } from '@/lib/catalog';
import type { Cell, RoomAction, RoomView, Tile } from '@/lib/types';
import { GalaxyBoard } from './galaxy-board';
import { ExportMap } from './export-map';
import { HandTileDetails, handTileLabel } from './hand-tile-details';
import { usePlacementUpdates } from './use-placement-updates';

const phaseNames: Record<RoomView['phase'], string> = { factions: 'Faction selection', speaker: 'Opening placements', placement: 'System placement', complete: 'Galaxy complete' };

function getTile(id: number | null | undefined) { return id == null ? null : TILES[id] ?? null; }
function factionName(id: number | null) { return id == null ? 'Unassigned' : FACTIONS.find(f => f.id === id)?.name ?? `Faction ${id}`; }
function roomKey(id: string) { return `ti4-room-${id}`; }
type PreviewMove = { tileId: number; cellId: string };
type PreviewIntent = { sequence: number; move: PreviewMove | null; revision: number; retries: number };
type PreviewSync = { epoch: number; sequence: number; intent: PreviewIntent | null; inFlight: boolean; timer: ReturnType<typeof setTimeout> | null; controller: AbortController | null; owns: boolean; lastLocalKey: string | undefined };
function previewKey(move: PreviewMove | null) { return move ? `${move.tileId}@${move.cellId}` : ''; }
function snapshotVersion(view: RoomView) { return { revision: view.revision, previewVersion: view.previewVersion ?? 0 }; }
function isOlderSnapshot(next: ReturnType<typeof snapshotVersion>, current: ReturnType<typeof snapshotVersion>) {
  return next.revision < current.revision || (next.revision === current.revision && next.previewVersion < current.previewVersion);
}

export function RoomClient({ roomId }: { roomId: string }) {
  const [token, setToken] = useState('');
  const [room, setRoom] = useState<RoomView | null>(null);
  const [invites, setInvites] = useState<string[]>([]);
  const [hostAvailable, setHostAvailable] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authExpired, setAuthExpired] = useState(false);
  const tokenRef = useRef('');
  const versionRef = useRef({ revision: -1, previewVersion: -1 });
  const roomRef = useRef<RoomView | null>(null);
  const previewSync = useRef<PreviewSync>({ epoch: 0, sequence: 0, intent: null, inFlight: false, timer: null, controller: null, owns: false, lastLocalKey: undefined });
  const pumpPreviewRef = useRef<() => void>(() => {});
  const actionInFlightRef = useRef(false);
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'sharing' | 'retrying' | 'failed'>('idle');
  const [ranking, setRanking] = useState<number[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<number | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [connection, setConnection] = useState<'live' | 'retrying'>('live');
  const [copied, setCopied] = useState('');
  const [rulesOpen, setRulesOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inspection, setInspection] = useState<number | null>(null);
  const [rosterOpen, setRosterOpen] = useState<boolean | null>(null);
  const { newCellIds, markSeen } = usePlacementUpdates(room, roomId);

  const resetPreviewSync = useCallback(() => {
    const sync = previewSync.current;
    if (sync.timer) clearTimeout(sync.timer);
    sync.controller?.abort();
    previewSync.current = { epoch: sync.epoch + 1, sequence: sync.sequence, intent: null, inFlight: false, timer: null, controller: null, owns: false, lastLocalKey: undefined };
    setPreviewStatus('idle');
  }, []);

  const acceptRoom = useCallback((next: RoomView, currentToken: string) => {
    if (currentToken !== tokenRef.current) return false;
    const nextVersion = snapshotVersion(next);
    if (isOlderSnapshot(nextVersion, versionRef.current)) return false;
    const priorRevision = versionRef.current.revision;
    versionRef.current = nextVersion;
    roomRef.current = next;
    if (next.revision > priorRevision) {
      const sync = previewSync.current;
      if (sync.intent && sync.intent.revision !== next.revision) {
        if (sync.timer) clearTimeout(sync.timer);
        sync.timer = null;
        sync.intent = null;
      }
      sync.owns = false;
      sync.lastLocalKey = undefined;
      setPreviewStatus('idle');
    }
    setRoom(next);
    setConnection('live');
    return true;
  }, []);

  useEffect(() => {
    const restoreIdentity = () => {
    const prefix = roomKey(roomId);
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const seatFromUrl = fragment.get('seat');
    const hostFromUrl = fragment.get('host');
    if (hostFromUrl) { sessionStorage.setItem(`${prefix}-host`, hostFromUrl); sessionStorage.setItem(`${prefix}-active`, 'host'); }
    if (seatFromUrl) { sessionStorage.setItem(`${prefix}-seat`, seatFromUrl); sessionStorage.setItem(`${prefix}-active`, 'seat'); }
    if (seatFromUrl || hostFromUrl) history.replaceState(null, '', window.location.pathname + window.location.search);
    const active = sessionStorage.getItem(`${prefix}-active`);
    const chosen = (active === 'seat' ? sessionStorage.getItem(`${prefix}-seat`) : sessionStorage.getItem(`${prefix}-host`)) || '';
    resetPreviewSync();
    tokenRef.current = chosen;
    versionRef.current = { revision: -1, previewVersion: -1 };
    roomRef.current = null;
    const savedInvites = sessionStorage.getItem(`${prefix}-invites`);
    setInvites([]);
    if (savedInvites) { try { setInvites(JSON.parse(savedInvites)); } catch { /* malformed old session data */ } }
    setHostAvailable(Boolean(sessionStorage.getItem(`${prefix}-host`)));
    setToken(chosen);
    setAuthReady(true);
    setAuthExpired(false);
    setRoom(null);
    setRanking([]);
    setSelectedTileId(null);
    setSelectedCellId(null);
    setRosterOpen(null);
    };
    restoreIdentity();
    window.addEventListener('hashchange', restoreIdentity);
    return () => window.removeEventListener('hashchange', restoreIdentity);
  }, [roomId, resetPreviewSync]);

  useEffect(() => () => {
    const sync = previewSync.current;
    if (sync.timer) clearTimeout(sync.timer);
    sync.controller?.abort();
    sync.epoch += 1;
    sync.intent = null;
  }, []);

  const refresh = useCallback(async (currentToken: string, quiet = false) => {
    if (!currentToken || currentToken !== tokenRef.current) return null;
    try {
      const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, { headers: { Authorization: `Bearer ${currentToken}` }, cache: 'no-store' });
      const next = await response.json() as RoomView & { error?: string };
      if (currentToken !== tokenRef.current) return null;
      if (response.status === 401 || response.status === 403) {
        resetPreviewSync(); roomRef.current = null; setRoom(null); setAuthExpired(true); setError('This invitation has expired or was replaced. Ask the host for a new link.');
        return null;
      }
      if (!response.ok) throw new Error(next.error || 'Unable to open this room.');
      if (!acceptRoom(next, currentToken)) return null;
      if (!quiet) setError('');
      setSelectedCellId(old => old && !next.board[old] ? old : null);
      return next;
    } catch (cause) {
      if (currentToken !== tokenRef.current) return null;
      setConnection('retrying');
      if (!quiet) setError(cause instanceof Error ? cause.message : 'Unable to open this room.');
      return null;
    }
  }, [roomId, acceptRoom, resetPreviewSync]);

  const pumpPreview = useCallback(() => {
    const sync = previewSync.current;
    const intent = sync.intent;
    if (!intent || sync.inFlight || sync.timer || actionInFlightRef.current) return;
    const current = roomRef.current;
    if (!current || current.revision !== intent.revision || current.actor.kind !== 'seat' || current.currentPlayer !== current.actor.seatId || (current.phase !== 'speaker' && current.phase !== 'placement')) {
      sync.intent = null;
      setPreviewStatus('idle');
      return;
    }
    const currentToken = tokenRef.current;
    const epoch = sync.epoch;
    const version = versionRef.current;
    sync.inFlight = true;
    const controller = new AbortController();
    sync.controller = controller;
    const scheduleRetry = () => {
      if (previewSync.current !== sync || sync.epoch !== epoch || sync.intent?.sequence !== intent.sequence) return;
      intent.retries += 1;
      if (intent.retries > 3) { setPreviewStatus('failed'); return; }
      setPreviewStatus('retrying');
      sync.timer = setTimeout(() => { sync.timer = null; pumpPreviewRef.current(); }, [0, 450, 1000, 2000][intent.retries]);
    };
    void (async () => {
      try {
        const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
          signal: controller.signal,
          body: JSON.stringify({ expectedRevision: version.revision, expectedPreviewVersion: version.previewVersion, action: { type: 'preview', move: intent.move } satisfies RoomAction }),
        });
        const data = await response.json() as RoomView & { error?: string };
        if (previewSync.current !== sync || sync.epoch !== epoch || tokenRef.current !== currentToken) return;
        if (response.ok) {
          acceptRoom(data, currentToken);
          if (sync.intent?.sequence === intent.sequence) {
            sync.intent = null;
            sync.owns = Boolean(intent.move);
            setPreviewStatus('idle');
          }
        } else if (response.status === 409) {
          await refresh(currentToken, true);
          scheduleRetry();
        } else if (response.status >= 500) {
          scheduleRetry();
        } else {
          if (response.status === 401 || response.status === 403) await refresh(currentToken, true);
          if (sync.intent?.sequence === intent.sequence) setPreviewStatus('failed');
        }
      } catch {
        scheduleRetry();
      } finally {
        if (previewSync.current !== sync || sync.epoch !== epoch) return;
        sync.inFlight = false;
        sync.controller = null;
        if (sync.intent && !sync.timer && intent.retries <= 3 && sync.intent.sequence !== intent.sequence) pumpPreviewRef.current();
      }
    })();
  }, [roomId, acceptRoom, refresh]);
  pumpPreviewRef.current = pumpPreview;

  const shareLocalPreview = useCallback((move: PreviewMove | null, force = false) => {
    const current = roomRef.current;
    if (!current || current.actor.kind !== 'seat' || current.currentPlayer !== current.actor.seatId || (current.phase !== 'speaker' && current.phase !== 'placement')) return;
    const sync = previewSync.current;
    const key = previewKey(move);
    if (!force && sync.lastLocalKey === key) return;
    sync.lastLocalKey = key;
    if (!move && !sync.owns && !sync.intent?.move && current.pendingPreview?.seatId !== current.actor.seatId) return;
    if (sync.timer) { clearTimeout(sync.timer); sync.timer = null; }
    sync.intent = { sequence: ++sync.sequence, move, revision: current.revision, retries: 0 };
    setPreviewStatus('sharing');
    pumpPreviewRef.current();
  }, []);

  useEffect(() => {
    if (!token || authExpired) return;
    void refresh(token);
    let interval: ReturnType<typeof setInterval>;
    const schedule = () => { clearInterval(interval); interval = setInterval(() => void refresh(token, true), document.hidden ? 15000 : 3000); };
    const visible = () => { if (!document.hidden) void refresh(token, true); schedule(); };
    schedule();
    document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', visible); };
  }, [token, refresh, authExpired]);

  const legalMoves = room?.legalMoves ?? [];
  const legalCells = useMemo(() => selectedTileId == null ? [] : legalMoves.filter(move => move.tileId === selectedTileId).map(move => move.cellId), [legalMoves, selectedTileId]);
  const previewMove = legalMoves.find(move => move.tileId === selectedTileId && move.cellId === selectedCellId);
  const selectedCell = CELLS.find(cell => cell.id === selectedCellId) ?? null;
  const inspectedTile = getTile(inspection ?? selectedTileId ?? (selectedCellId ? room?.board[selectedCellId] : null));
  const isHost = room?.actor.kind === 'host';
  const mySeat = room?.actor.kind === 'seat' ? room.actor.seatId : null;
  const myPlayer = mySeat == null ? null : room?.players.find(player => player.id === mySeat);
  const latestCellId = room?.placements.at(-1)?.cellId;
  const isTurn = mySeat !== null && room?.currentPlayer === mySeat;
  const readyCount = room?.players.filter(player => player.ready).length ?? 0;
  const activeHand = room?.phase === 'speaker' ? room.speakerPool : room?.myHand ?? [];
  const orderedPlayers = room?.priority.length ? room.priority.map(id => room.players[id]) : room?.players ?? [];
  const speakerIndex = room?.speaker != null ? room.priority.indexOf(room.speaker) : -1;
  const placementOrder = room && speakerIndex >= 0 ? [...room.priority.slice(speakerIndex), ...room.priority.slice(0, speakerIndex)] : [];
  const showRoster = rosterOpen ?? false;
  const sharedPreview = room?.pendingPreview && (!previewMove || room.pendingPreview.seatId !== mySeat) ? room.pendingPreview : null;

  async function act(action: RoomAction) {
    if (!room || !token || busy) return false;
    actionInFlightRef.current = true;
    const sync = previewSync.current;
    if (sync.timer) clearTimeout(sync.timer);
    sync.controller?.abort();
    sync.timer = null;
    sync.intent = null;
    setPreviewStatus('idle');
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/actions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ expectedRevision: room.revision, action }) });
      const data = await response.json() as RoomView & { error?: string };
      if (!response.ok) {
        if (response.status === 409) { const fresh = await refresh(token, true); if (fresh && selectedTileId !== null && selectedCellId && !fresh.legalMoves.some(move => move.tileId === selectedTileId && move.cellId === selectedCellId)) setSelectedCellId(null); }
        throw new Error(data.error || (response.status === 409 ? 'The board changed. Check the latest legal spaces and try again.' : 'The action could not be saved.'));
      }
      return acceptRoom(data, token);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The action could not be saved.'); return false; }
    finally { actionInFlightRef.current = false; setBusy(false); pumpPreviewRef.current(); }
  }

  async function copyText(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); setCopied(label); window.setTimeout(() => setCopied(''), 2200); }
    catch { setError('Clipboard access failed. Select and copy the link below.'); }
  }

  function inviteLink(index: number) { return `${window.location.origin}/room/${encodeURIComponent(roomId)}#seat=${encodeURIComponent(invites[index])}`; }

  async function reissueInvite(seatId: number) {
    if (!room || !token || !window.confirm(`Create a new invitation for ${room.players[seatId]?.name}? Their old invitation will stop working.`)) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/invites`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ seatId, expectedRevision: room.revision }) });
      const data = await response.json() as { token?: string; room?: RoomView; error?: string };
      if (!response.ok || !data.token || !data.room) throw new Error(data.error || 'Could not replace the invitation.');
      const updated = Array.from({ length: 8 }, (_, i) => i === seatId ? data.token! : invites[i] || '');
      setInvites(updated);
      sessionStorage.setItem(`${roomKey(roomId)}-invites`, JSON.stringify(updated));
      if (!acceptRoom(data.room, token)) return;
      setInviteOpen(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not replace the invitation.'); }
    finally { setBusy(false); }
  }

  function switchToHost() {
    const hostToken = sessionStorage.getItem(`${roomKey(roomId)}-host`);
    if (!hostToken) return;
    sessionStorage.setItem(`${roomKey(roomId)}-active`, 'host');
    resetPreviewSync();
    tokenRef.current = hostToken; versionRef.current = { revision: -1, previewVersion: -1 }; roomRef.current = null;
    setToken(hostToken); setRoom(null); setError(''); setAuthExpired(false); setSelectedCellId(null); setSelectedTileId(null);
  }

  function onCellClick(cell: Cell) {
    setSelectedCellId(cell.id);
    setInspection(room?.board[cell.id] ?? null);
    const move = legalMoves.find(option => option.tileId === selectedTileId && option.cellId === cell.id);
    shareLocalPreview(move ? { tileId: move.tileId, cellId: move.cellId } : null);
  }

  if (!authReady) return <main className="room-loading">Opening the galaxy…</main>;
  if (!token) return <main className="access-shell"><a className="brand" href="/"><span className="brand-mark">✦</span> THE GALAXY DRAFT</a><div className="access-panel"><p className="eyebrow">INVITATION REQUIRED</p><h1>Open your seat link</h1><p>This room needs a host or player invitation. Ask the host to send your link, then open it in this tab.</p><a className="secondary-button" href="/">Create a new room</a></div></main>;
  if (authExpired) return <main className="access-shell"><a className="brand" href="/"><span className="brand-mark">✦</span> THE GALAXY DRAFT</a><div className="access-panel"><p className="eyebrow">INVITATION EXPIRED</p><h1>Ask for a new link</h1><p>This invitation was replaced or is no longer valid. The host can create a fresh invitation for your seat.</p>{hostAvailable && <button className="secondary-button" onClick={switchToHost}>Return to host view</button>}</div></main>;

  return <main className="room-shell">
    <header className="site-header room-header"><a className="brand" href="/"><span className="brand-mark">✦</span><span>THE GALAXY DRAFT</span></a><div className="header-room"><span className="header-caption">DRAFT ROOM</span><strong>{room?.title ?? 'Opening room…'}</strong></div><div className="header-actions"><span className={`connection-status ${connection === 'retrying' ? 'connection-status--retry' : ''}`}><i/>{connection === 'retrying' ? 'Reconnecting' : 'Live'}</span>{room && <button className="text-button" onClick={() => setRulesOpen(true)}>Rules</button>}</div></header>
    {error && <div className="room-error" role="alert"><span>{error}</span><button type="button" onClick={() => void refresh(token)}>Retry</button></div>}
    {!room ? <div className="room-loading">{connection === 'retrying' ? 'Trying to reconnect to the room…' : 'Loading galaxy…'}</div> : <>
      <div className="room-status-bar"><div><span className="eyebrow">{phaseNames[room.phase]}</span><strong>{room.phase === 'complete' ? 'The map is ready' : room.phase === 'factions' ? `${readyCount} of 8 rankings locked` : room.currentPlayer != null ? `${room.players[room.currentPlayer]?.name ?? 'A player'} is drafting` : 'Preparing the next pick'}</strong></div><div className="status-meta">{room.activeRing != null && <span>RING {room.activeRing}</span>}</div></div>
      <div className="room-layout">
        <section className="board-column">
          <div className="board-topline"><div><span className="eyebrow">THE GALAXY</span><h1>{room.title}</h1></div><div className="seat-identity" aria-label={myPlayer ? 'Your player identity' : 'Host view'}><span className="eyebrow">{myPlayer ? 'YOUR SEAT' : 'HOST VIEW'}</span>{myPlayer && <><strong>{myPlayer.name}</strong><span className="seat-faction">{myPlayer.factionId == null ? 'Choosing factions' : factionName(myPlayer.factionId)}</span></>}</div></div>
          <div className="board-updates"><div className="board-key"><span><i className="key-dot key-dot--legal"/> Legal space</span><span><i className="key-dot key-dot--selected"/> Selected</span>{latestCellId && <span><i className="key-dot key-dot--latest"/> Latest tile</span>}{newCellIds.length > 0 && <span><i className="key-dot key-dot--new"/> New since last visit</span>}{sharedPreview && <span><i className="key-dot key-dot--pending"/> Pending, not locked</span>}</div>{newCellIds.length > 0 && <div className="placement-updates" role="status"><span>{newCellIds.length} new {newCellIds.length === 1 ? 'tile' : 'tiles'}</span><button type="button" className="text-button" onClick={markSeen}>Mark seen</button></div>}</div>
          <GalaxyBoard board={room.board} players={orderedPlayers} legalCellIds={legalCells} selectedCellId={selectedCellId} previewTileId={previewMove ? selectedTileId : null} pendingPreview={sharedPreview ? { ...sharedPreview, playerName: room.players[sharedPreview.seatId]?.name ?? 'Active player' } : null} latestCellId={latestCellId} newCellIds={newCellIds} onCellClick={onCellClick}/>
        </section>
        <aside className="control-column">
          <div className="control-scroll">
            <section className="roster-section"><div className="section-title"><span className="eyebrow">{room.priority.length ? 'CLOCKWISE PRIORITY' : 'THE TABLE'}</span><button type="button" className="roster-toggle" aria-expanded={showRoster} onClick={() => setRosterOpen(!showRoster)}>{showRoster ? "Hide" : "Show"} · 8 players</button></div>{showRoster && <div className="roster-list">{orderedPlayers.map((player, index) => <div key={player.id} className={`roster-row ${room.currentPlayer === player.id ? 'roster-row--current' : ''} ${mySeat === player.id ? 'roster-row--me' : ''}`}><span className="roster-seat">{String(index + 1).padStart(2, '0')}</span><span className="roster-person"><strong>{player.name}{mySeat === player.id ? ' · You' : ''}{room.speaker === player.id ? ' ★' : ''}</strong><small>{player.factionId == null ? (player.ready ? 'Ranking locked' : 'Choosing factions') : factionName(player.factionId)}</small></span><span className="roster-tag">{room.phase === 'factions' ? (player.ready ? 'READY' : 'WAITING') : room.currentPlayer === player.id ? 'ON TURN' : player.handCount ? `${player.handCount} TILES` : '—'}</span></div>)}</div>}</section>
            {room.phase === 'factions' && <section className="draft-section"><div className="section-title"><span className="eyebrow">FACTION DRAFT</span></div>{isHost ? <><h2>Private rankings underway</h2><p className="muted">Each player ranks eight factions on their own invitation link. Assignments reveal together once everyone is ready. Rankings remain private.</p>{room.practice && <button type="button" className="secondary-button wide-button" disabled={busy} onClick={() => void act({ type: 'practice-fill' })}>Fill remaining rankings for practice</button>}</> : room.myRanking ? <><h2>Your ranking is locked</h2><p className="muted">Your preferences are saved. The next phase starts when every player has locked a list.</p><ol className="locked-ranking">{room.myRanking.map(id => <li key={id}>{factionName(id)}</li>)}</ol></> : <><h2>Rank your eight factions</h2><p className="muted">Add eight in order of preference. Only you can see this list.</p><div className="rank-list">{ranking.map((id, index) => <div className="rank-row" key={id}><span>{String(index + 1).padStart(2, '0')}</span><strong>{factionName(id)}</strong><div><button aria-label={`Move ${factionName(id)} up`} disabled={index === 0} onClick={() => setRanking(prev => { const next = [...prev]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })}>↑</button><button aria-label={`Move ${factionName(id)} down`} disabled={index === ranking.length - 1} onClick={() => setRanking(prev => { const next = [...prev]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next; })}>↓</button><button aria-label={`Remove ${factionName(id)}`} onClick={() => setRanking(prev => prev.filter(value => value !== id))}>×</button></div></div>)}</div><div className="faction-picker"><div className="field-heading"><span>Available factions</span><small>{ranking.length} / 8 selected</small></div><div className="faction-grid">{FACTIONS.map(faction => <button key={faction.id} type="button" disabled={ranking.includes(faction.id) || ranking.length >= 8} onClick={() => setRanking(prev => [...prev, faction.id])}><span>{faction.shortName}</span><small>+</small></button>)}</div></div><button className="primary-button wide-button" type="button" disabled={ranking.length !== 8 || busy} onClick={() => void act({ type: 'rank', ranking })}>{busy ? 'Saving…' : `Lock ranking (${ranking.length}/8)`}</button></>}</section>}
            {(room.phase === 'speaker' || room.phase === 'placement') && <section className="draft-section"><span className="eyebrow">YOUR DRAFT</span><h2>{isHost ? 'Follow the draft' : isTurn ? 'Your turn to place' : 'Waiting for your turn'}</h2><p className="muted">{room.phase === 'speaker' ? `${room.players[room.speaker ?? 0]?.name} places a separate hand of 2 blue and 2 red systems next to Mecatol Rex. Everyone receives their six-tile hand after all four are placed.` : `Ring ${room.activeRing ?? '—'} placements are in progress.`} {isTurn ? 'Choose a tile, then a glowing space on the board.' : ''}</p>{sharedPreview && <p className="pending-note" role="status"><strong>{sharedPreview.seatId === mySeat ? 'You' : room.players[sharedPreview.seatId]?.name}</strong> {sharedPreview.seatId === mySeat ? 'are' : 'is'} considering {getTile(sharedPreview.tileId)?.name ?? `tile ${sharedPreview.tileId}`}. Not locked in yet.</p>}{isTurn && (previewStatus === 'retrying' || previewStatus === 'failed') && <p className="pending-note" role="status">{previewStatus === 'retrying' ? 'Sharing this preview is delayed. Retrying…' : 'Preview sharing failed. You can still confirm the placement.'}{previewStatus === 'failed' && <button type="button" className="text-button" onClick={() => shareLocalPreview(previewMove ? { tileId: previewMove.tileId, cellId: previewMove.cellId } : null, true)}>Retry sharing</button>}</p>}{room.priority.length > 0 && <div className="priority-line"><span>Placement order</span>{placementOrder.map((id, index) => <span key={id} title={`Clockwise from speaker: ${index + 1}`}>{room.players[id]?.name}{id === room.speaker ? ' ★' : ''}</span>)}</div>}{!isHost && <>{previewMove && <div className="preview-panel"><span className="eyebrow">PLACEMENT PREVIEW</span><strong>{getTile(selectedTileId)?.name} → {selectedCell?.homeIndex != null ? `${orderedPlayers[selectedCell.homeIndex]?.name} home` : `ring ${selectedCell?.ring}`}</strong>{previewMove.exception && <small>Exception placement</small>}<div className="preview-actions"><button type="button" className="primary-button" disabled={busy} onClick={async () => { const ok = await act({ type: 'place', tileId: selectedTileId!, cellId: selectedCellId! }); if (ok) { setSelectedTileId(null); setSelectedCellId(null); setInspection(null); } }}>{busy ? 'Placing…' : 'Confirm placement'}</button><button type="button" className="secondary-button" onClick={() => { setSelectedCellId(null); shareLocalPreview(null); }}>Cancel</button></div></div>}<div className="hand-heading"><span>{room.phase === 'speaker' ? 'Opening hand' : 'Your tiles'}</span><small>{activeHand.length} tiles</small></div>{activeHand.length ? <div className="tile-hand">{activeHand.map(tileId => { const tile = getTile(tileId); const selectable = legalMoves.some(move => move.tileId === tileId); return <button key={tileId} type="button" className={`hand-tile ${selectedTileId === tileId ? 'hand-tile--selected' : ''}`} onClick={() => { setSelectedTileId(selectable ? tileId : null); setInspection(tileId); setSelectedCellId(null); shareLocalPreview(null); }} aria-label={handTileLabel(tile, tileId)}><img src={tileImage(tileId)} alt=""/><HandTileDetails tile={tile} tileId={tileId} opening={room.phase === 'speaker'}/></button>; })}</div> : <p className="empty-note">{room.phase === 'speaker' ? 'Your six tiles will be dealt after the speaker finishes all four opening placements.' : 'Your hand is empty for this step.'}</p>}{selectedTileId != null && isTurn && <p className="selection-prompt">{legalCells.length ? `${legalCells.length} legal ${legalCells.length === 1 ? 'space' : 'spaces'} highlighted on the board` : 'This tile has no legal spaces right now.'}</p>}</>}</section>}
            {inspectedTile && <TileInspector tile={inspectedTile} onClose={() => setInspection(null)}/>}
            {room.phase === 'complete' && <section className="draft-section"><span className="eyebrow">FINISHED MAP</span><h2>Ready for the table</h2><p className="muted">Explore the completed board, then save a map or a tile list for your game.</p><ExportMap room={room}/></section>}
            {isHost && <section className="host-section"><span className="eyebrow">HOST CONTROLS</span><h2>Table tools</h2><button type="button" className="secondary-button wide-button" onClick={() => { const hostToken = sessionStorage.getItem(`${roomKey(roomId)}-host`); if (hostToken) void copyText(`${window.location.origin}/room/${encodeURIComponent(roomId)}#host=${encodeURIComponent(hostToken)}`, "host"); }}>{copied === "host" ? "Host link copied" : "Copy host return link"}</button><button type="button" className="secondary-button wide-button" onClick={() => setInviteOpen(!inviteOpen)}>{inviteOpen ? 'Hide invitations' : 'Show player invitations'}</button>{inviteOpen && <div className="invite-list"><p className="muted">Each link opens one private seat. Share each only with its player.</p>{room.players.map(player => <div className="invite-row" key={player.id}><div><strong>{player.name}</strong>{invites[player.id] ? <input aria-label={`${player.name} invitation link`} readOnly value={inviteLink(player.id)} onFocus={e => e.currentTarget.select()}/> : <small>Link unavailable in this tab</small>}</div><div className="invite-actions">{invites[player.id] && <button type="button" onClick={() => void copyText(inviteLink(player.id), `seat-${player.id}`)}>{copied === `seat-${player.id}` ? 'Copied' : 'Copy'}</button>}<button type="button" disabled={busy} onClick={() => void reissueInvite(player.id)}>Replace</button>{room.practice && invites[player.id] && <a href={inviteLink(player.id)} target="_blank" rel="noopener noreferrer">Open seat</a>}</div></div>)}{invites.length === 8 && invites.every(Boolean) && <button className="secondary-button wide-button" onClick={() => void copyText(room.players.map(p => `${p.name}: ${inviteLink(p.id)}`).join('\n'), 'all')}>{copied === 'all' ? 'Copied all invitations' : 'Copy all invitations'}</button>}</div>}{room.canUndo && <button type="button" className="danger-button wide-button" disabled={busy} onClick={() => { if (window.confirm('Undo the last placement? Players will see the restored board immediately.')) void act({ type: 'undo' }); }}>Undo last placement</button>}</section>}
            {room.practice && !isHost && hostAvailable && <button type="button" className="text-button return-host" onClick={switchToHost}>Return to practice host view →</button>}
          </div>
        </aside>
      </div>
      {room.history.length > 0 && <div className="activity-strip"><span className="eyebrow">LATEST</span><span>{room.history.at(-1)?.text}</span></div>}
      {rulesOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setRulesOpen(false); }}><section className="rules-modal" role="dialog" aria-modal="true" aria-label="Draft rules"><button className="modal-close" onClick={() => setRulesOpen(false)} aria-label="Close rules">×</button><span className="eyebrow">TABLE GUIDE</span><h2>How the draft works</h2><ol><li><strong>Rank factions.</strong> Every player privately ranks eight factions. Lists lock when submitted.</li><li><strong>Establish speaker and priority.</strong> Faction assignments and clockwise priority are revealed together after all rankings lock. The speaker is drawn independently at random.</li><li><strong>Place systems.</strong> Only the speaker is dealt an opening hand of 2 blue and 2 red tiles, placed next to Mecatol Rex. After all four are placed, everyone receives 4 blue and 2 red tiles. Starting with the speaker, place clockwise, then reverse at each end with consecutive turns for the end player. The speaker places the final tile: 52 placements total. Complete each ring before moving outward. Select a tile and highlighted legal hex, then confirm. Matching wormholes and anomalies cannot touch unless no legal alternative exists. Home systems are shown for orientation but attach after drafting, so their anomalies and wormholes do not restrict placements.</li><li><strong>Finish the galaxy.</strong> Once all placements are made, save the map and tile list.</li></ol><p>Only the player on turn sees legal placement options. The host can replace lost invitations and undo the latest placement.</p></section></div>}
    </>}
  </main>;
}

function TileInspector({ tile, onClose }: { tile: Tile; onClose: () => void }) {
  return <section className="tile-inspector"><div className="inspector-top"><span className="eyebrow">SYSTEM DETAIL · #{tile.id}</span><button type="button" onClick={onClose} aria-label="Close system detail">×</button></div><div className="inspector-body"><img src={tileImage(tile.id)} alt={`${tile.name} system tile`}/><div><h2>{tile.name}</h2><p className="muted">{tile.type === 'home' ? 'Home system' : tile.type === 'center' ? 'Mecatol Rex' : `${tile.type} system`}</p>{tile.planets.length ? <ul>{tile.planets.map(planet => <li key={planet.name}><strong>{planet.name}</strong><span>{planet.resources} resources · {planet.influence} influence{planet.trait ? ` · ${planet.trait}` : ''}{planet.specialty.length ? ` · ${planet.specialty.join(', ')}` : ''}</span></li>)}</ul> : <p className="muted">No planets</p>}{(tile.anomalies.length > 0 || tile.wormholes.length > 0) && <p className="tile-tags">{[...tile.anomalies, ...tile.wormholes].join(' · ')}</p>}</div></div></section>;
}
