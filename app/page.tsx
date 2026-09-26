'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GalaxyBoard } from '@/components/galaxy-board';
import type { CreateRoomResponse } from '@/lib/types';

const INITIAL_NAMES = Array.from({ length: 8 }, (_, i) => `Player ${i + 1}`);

export default function HomePage() {
  const router = useRouter();
  const [title, setTitle] = useState('Saturday galaxy draft');
  const [names, setNames] = useState(INITIAL_NAMES);
  const [practice, setPractice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function createRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const trimmed = names.map(name => name.trim());
    if (trimmed.some(name => !name)) { setError('Enter a name for each player.'); return; }
    if (new Set(trimmed.map(name => name.toLowerCase())).size !== 8) { setError('Give each player a distinct name.'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: title.trim(), names: trimmed, practice }) });
      const data = await response.json() as CreateRoomResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || 'The room could not be created.');
      const key = `ti4-room-${data.room.id}`;
      sessionStorage.setItem(`${key}-host`, data.hostToken);
      sessionStorage.setItem(`${key}-invites`, JSON.stringify(data.seatTokens));
      sessionStorage.setItem(`${key}-active`, 'host');
      router.push(`/room/${encodeURIComponent(data.room.id)}#host=${encodeURIComponent(data.hostToken)}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The room could not be created.'); }
    finally { setBusy(false); }
  }

  return <main className="landing-shell">
    <header className="site-header"><a className="brand" href="/"><span className="brand-mark">✦</span><span>THE GALAXY DRAFT</span></a><span className="header-caption">TWILIGHT IMPERIUM · FOURTH EDITION</span></header>
    <div className="landing-content">
      <section className="landing-intro"><p className="eyebrow">EIGHT PLAYERS · ONE GALAXY</p><h1>Build your next galaxy together.</h1><p>Rank factions privately, draft your systems, and place every tile on a shared board. Your table can follow each pick as it happens.</p><div className="landing-rule"><span>01 / FACTIONS</span><span>02 / SPEAKER & PRIORITY</span><span>03 / SYSTEMS</span><span>04 / FINAL MAP</span></div></section>
      <div className="landing-grid">
        <div className="landing-board" aria-label="Preview of the eight-player board"><div className="landing-board-caption"><span>THE BOARD</span><span>8 HOME SYSTEMS · 4 RINGS</span></div><GalaxyBoard board={{ '0,0': 18 }} compact/></div>
        <section className="create-panel" aria-labelledby="create-heading"><p className="eyebrow">START A DRAFT</p><h2 id="create-heading">Prepare the table</h2><form onSubmit={createRoom}>
          <label className="field-label" htmlFor="room-title">Room name</label><input id="room-title" maxLength={80} value={title} onChange={e => setTitle(e.target.value)} required placeholder="Friday night draft"/>
          <div className="field-heading"><span>Players</span><small>Clockwise seating is randomized</small></div><div className="name-grid">{names.map((name, i) => <label key={i} className="seat-input"><span>{String(i + 1).padStart(2, '0')}</span><input aria-label={`Player ${i + 1} name`} maxLength={32} value={name} onChange={e => setNames(prev => prev.map((value, index) => index === i ? e.target.value : value))} required/></label>)}</div>
          <label className="check-row"><input type="checkbox" checked={practice} onChange={e => setPractice(e.target.checked)}/><span><strong>Practice room</strong><small>Try a full draft on your own, with sample rankings for other seats.</small></span></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button create-button" type="submit" disabled={busy}>{busy ? 'Creating room…' : 'Create draft room'}<span aria-hidden>→</span></button>
        </form></section>
      </div>
    </div>
  </main>;
}
