'use client';

import { useState } from 'react';
import { CELLS, hexToPixel } from '@/lib/board';
import { FACTIONS, TILES, tileImage } from '@/lib/catalog';
import type { RoomView } from '@/lib/types';

const SIZE = 76;
const WIDTH = 1500;
const HEIGHT = 1420;
const vertices = Array.from({ length: 6 }, (_, i) => ({ x: SIZE * Math.cos(i * Math.PI / 3), y: SIZE * Math.sin(i * Math.PI / 3) }));
function xy(q: number, r: number) { const point = hexToPixel({ q, r }, SIZE); return { x: WIDTH / 2 + point.x, y: HEIGHT / 2 + point.y }; }
function download(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
function safeName(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'galaxy'; }

export function ExportMap({ room }: { room: RoomView }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const base = safeName(room.title);

  async function savePng() {
    setSaving(true); setError('');
    try {
      const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT;
      const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas is unavailable.');
      ctx.fillStyle = '#081421'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#e7eef0'; ctx.font = '600 34px system-ui'; ctx.textAlign = 'center'; ctx.fillText(room.title, WIDTH / 2, 76);
      ctx.font = '17px system-ui'; ctx.fillStyle = '#8ca8b6'; ctx.fillText('THE GALAXY DRAFT · TWILIGHT IMPERIUM FOURTH EDITION', WIDTH / 2, 108);
      const images = await Promise.all(CELLS.map(async cell => {
        const tileId = room.board[cell.id];
        if (!tileId) return null;
        const img = new Image(); img.src = tileImage(tileId);
        try { await img.decode(); return img; } catch { throw new Error(`Could not load tile art #${tileId}. Try the export again.`); }
      }));
      CELLS.forEach((cell, index) => {
        const { x, y } = xy(cell.q, cell.r); const tileId = room.board[cell.id];
        ctx.save(); ctx.translate(x, y); ctx.beginPath(); vertices.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath();
        ctx.fillStyle = '#102334'; ctx.fill(); ctx.clip();
        const img = images[index]; if (img) ctx.drawImage(img, -SIZE, -Math.sqrt(3) * SIZE / 2, SIZE * 2, Math.sqrt(3) * SIZE);
        ctx.restore();
        ctx.save(); ctx.translate(x, y); ctx.beginPath(); vertices.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)); ctx.closePath(); ctx.strokeStyle = cell.homeIndex != null ? '#dda672' : '#7393a3'; ctx.lineWidth = cell.homeIndex != null ? 3 : 2; ctx.stroke();
        if (tileId) { ctx.fillStyle = 'rgba(4, 12, 20, .82)'; ctx.fillRect(-23, 38, 46, 24); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 17px system-ui'; ctx.fillText(String(tileId), 0, 56); }
        ctx.restore();
      });
      ctx.textAlign = 'center'; ctx.font = '16px system-ui'; ctx.fillStyle = '#98b5c2'; ctx.fillText('Tile numbers are shown for easy setup. Home systems are outlined in amber.', WIDTH / 2, HEIGHT - 48);
      const creuss = room.players.find(player => player.factionId === 17);
      if (creuss) { const img = new Image(); img.src = tileImage(51); try { await img.decode(); } catch { throw new Error('Could not load Creuss tile art. Try the export again.'); } ctx.drawImage(img, WIDTH - 244, 95, 132, 114); ctx.fillStyle = '#f4d0a7'; ctx.textAlign = 'center'; ctx.font = 'bold 16px system-ui'; ctx.fillText('51 · CREUSS', WIDTH - 178, 234); ctx.font = '13px system-ui'; ctx.fillText(`${creuss.name} · off-board home`, WIDTH - 178, 254); }
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG export failed.');
      download(blob, `${base}-galaxy.png`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'PNG export failed.'); }
    finally { setSaving(false); }
  }

  function saveTileMap() {
    const polygons = CELLS.map(cell => {
      const { x, y } = xy(cell.q, cell.r);
      const points = vertices.map(v => `${(x + v.x).toFixed(1)},${(y + v.y).toFixed(1)}`).join(' ');
      const tileId = room.board[cell.id];
      const player = cell.homeIndex == null ? null : room.players[room.priority[cell.homeIndex]];
      const label = tileId ? `${tileId}` : '—';
      const sub = player ? `${escapeXml(player.name)} · ${escapeXml(FACTIONS.find(f => f.id === player.factionId)?.shortName ?? '')}` : tileId ? escapeXml(TILES[tileId]?.name ?? '') : '';
      return `<g><polygon points="${points}" fill="${cell.homeIndex == null ? '#fff' : '#fff5e9'}" stroke="#1c3546" stroke-width="2"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-size="23" font-weight="700" fill="#102334">${label}</text><text x="${x}" y="${y + 26}" text-anchor="middle" font-size="10" fill="#476172">${sub}</text></g>`;
    }).join('');
    const creuss = room.players.find(player => player.factionId === 17);
    const offboard = creuss ? `<g font-family="sans-serif"><polygon points="1290,140 1365,183 1365,269 1290,312 1215,269 1215,183" fill="#fff5e9" stroke="#1c3546" stroke-width="2"/><text x="1290" y="225" text-anchor="middle" font-size="24" font-weight="700">51</text><text x="1290" y="248" text-anchor="middle" font-size="12">CREUSS · OFF-BOARD</text><text x="1290" y="334" text-anchor="middle" font-size="14">${escapeXml(creuss.name)}</text></g>` : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}"><rect width="100%" height="100%" fill="white"/><text x="${WIDTH / 2}" y="76" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="700" fill="#102334">${escapeXml(room.title)}</text><text x="${WIDTH / 2}" y="108" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#476172">TILE NUMBER MAP · PRINT AT ACTUAL SIZE OR FIT TO PAGE</text><g font-family="sans-serif">${polygons}</g>${offboard}</svg>`;
    download(new Blob([svg], { type: 'image/svg+xml' }), `${base}-tile-map.svg`);
  }

  function saveJson() {
    const publicMap = { title: room.title, roomId: room.id, createdAt: room.createdAt, players: room.players.map(player => ({ playerId: player.id, clockwiseSeat: room.priority.indexOf(player.id) + 1, name: player.name, faction: FACTIONS.find(f => f.id === player.factionId)?.name ?? null, offboardHomeTile: player.factionId === 17 ? 51 : null })), clockwisePriority: room.priority, speakerPlayerId: room.speaker, speakerClockwiseSeat: room.speaker == null ? null : room.priority.indexOf(room.speaker) + 1, board: room.board, placements: room.placements };
    download(new Blob([JSON.stringify(publicMap, null, 2)], { type: 'application/json' }), `${base}-map.json`);
  }

  return <div className="export-actions"><button type="button" className="primary-button wide-button" disabled={saving} onClick={() => void savePng()}>{saving ? 'Saving image…' : 'Download board PNG'}</button><button type="button" className="secondary-button wide-button" onClick={saveTileMap}>Download printable tile map</button><button type="button" className="secondary-button wide-button" onClick={saveJson}>Download map data</button>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}

function escapeXml(value: string) { return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!); }
