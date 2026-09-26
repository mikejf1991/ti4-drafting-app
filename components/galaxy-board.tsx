'use client';

import { useRef, useState } from 'react';
import { CELLS, hexToPixel } from '@/lib/board';
import { TILES, tileImage } from '@/lib/catalog';
import type { Cell, PlayerView } from '@/lib/types';

export const HEX_SIZE = 61;
export const BOARD_WIDTH = 1240;
export const BOARD_HEIGHT = 1120;

export function hexPoint(cell: Cell, size = HEX_SIZE) {
  return hexToPixel(cell, size);
}

export function hexVertices(size = HEX_SIZE) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = index * Math.PI / 3;
    return { x: size * Math.cos(angle), y: size * Math.sin(angle) };
  });
}

export function hexPolygon(size = HEX_SIZE) {
  return hexVertices(size).map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

type BoardProps = {
  board: Record<string, number>;
  players?: PlayerView[];
  legalCellIds?: string[];
  selectedCellId?: string | null;
  previewTileId?: number | null;
  onCellClick?: (cell: Cell) => void;
  compact?: boolean;
};

export function GalaxyBoard({ board, players = [], legalCellIds = [], selectedCellId, previewTileId, onCellClick, compact = false }: BoardProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const legal = new Set(legalCellIds);
  const polygon = hexPolygon();
  const previewCell = selectedCellId && previewTileId != null && !board[selectedCellId] ? selectedCellId : null;

  function changeZoom(next: number) { setZoom(Math.max(.65, Math.min(2.6, next))); }

  return <div className={`galaxy-board ${compact ? 'galaxy-board--compact' : ''}`}>
    {!compact && <div className="board-tools" aria-label="Board view controls">
      <button type="button" onClick={() => changeZoom(zoom + .2)} aria-label="Zoom in">+</button>
      <button type="button" onClick={() => changeZoom(zoom - .2)} aria-label="Zoom out">−</button>
      <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} aria-label="Reset board view">⌖</button>
    </div>}
    <svg className="board-svg" viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`} role="img" aria-label="Eight-player galaxy board with four rings of hexagonal tiles"
      onWheel={compact ? undefined : e => { e.preventDefault(); changeZoom(zoom + (e.deltaY < 0 ? .1 : -.1)); }}
      onPointerDown={compact ? undefined : e => { if (e.button !== 0) return; drag.current = { x: e.clientX, y: e.clientY, moved: false }; }}
      onPointerMove={compact ? undefined : e => { if (!drag.current) return; const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y; if (!drag.current.moved && Math.abs(dx) + Math.abs(dy) > 4) { drag.current.moved = true; e.currentTarget.setPointerCapture(e.pointerId); } if (drag.current.moved) setPan(p => ({ x: p.x + dx, y: p.y + dy })); drag.current.x = e.clientX; drag.current.y = e.clientY; }}
      onPointerUp={compact ? undefined : () => { suppressClick.current = Boolean(drag.current?.moved); drag.current = null; window.setTimeout(() => { suppressClick.current = false; }, 80); }}>
      <defs>
        <radialGradient id="spaceGlow"><stop stopColor="#1b3146" stopOpacity=".8"/><stop offset="1" stopColor="#081421" stopOpacity="0"/></radialGradient>
        <pattern id="starfield" width="170" height="140" patternUnits="userSpaceOnUse"><circle cx="14" cy="28" r="1" fill="#b1cad2" opacity=".35"/><circle cx="116" cy="84" r=".75" fill="#fff1d5" opacity=".35"/><circle cx="88" cy="12" r=".7" fill="#91b7ca" opacity=".3"/></pattern>
        {CELLS.map(cell => <clipPath id={`hex-${cell.id.replace(',', '-')}`} key={cell.id}><polygon points={polygon}/></clipPath>)}
      </defs>
      <rect width={BOARD_WIDTH} height={BOARD_HEIGHT} fill="url(#starfield)"/>
      <ellipse cx={BOARD_WIDTH / 2} cy={BOARD_HEIGHT / 2} rx="520" ry="470" fill="url(#spaceGlow)"/>
      <g transform={`translate(${BOARD_WIDTH / 2 + pan.x} ${BOARD_HEIGHT / 2 + pan.y}) scale(${zoom})`}>
        {CELLS.map(cell => {
          const { x, y } = hexPoint(cell);
          const tileId = board[cell.id] ?? (previewCell === cell.id ? previewTileId : null);
          const home = cell.homeIndex !== null;
          const owner = home ? players[cell.homeIndex!] : null;
          const selected = selectedCellId === cell.id;
          const allowed = legal.has(cell.id);
          const tile = tileId != null ? TILES[tileId] : null;
          return <g key={cell.id} transform={`translate(${x} ${y})`} className={`board-cell ${allowed ? 'board-cell--legal' : ''} ${selected ? 'board-cell--selected' : ''} ${home ? 'board-cell--home' : ''}`}
            role={onCellClick ? 'button' : undefined} tabIndex={onCellClick ? 0 : undefined}
            aria-label={`${home ? `${owner?.name ?? `Seat ${cell.homeIndex! + 1}`} home` : cell.ring === 0 ? 'Mecatol Rex' : `Ring ${cell.ring} cell ${cell.id}`}${tile ? `, ${tile.name}` : ', empty'}${allowed ? ', legal placement' : ''}`}
            onClick={() => { if (!suppressClick.current) onCellClick?.(cell); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCellClick?.(cell); } }}>
            <polygon points={polygon} className="hex-base"/>
            {tileId != null && <image href={tileImage(tileId)} x={-HEX_SIZE} y={-Math.sqrt(3) * HEX_SIZE / 2} width={2 * HEX_SIZE} height={Math.sqrt(3) * HEX_SIZE} preserveAspectRatio="xMidYMid meet" clipPath={`url(#hex-${cell.id.replace(',', '-')})`} opacity={previewCell === cell.id ? .72 : 1}/>}
            <polygon points={polygon} className="hex-outline"/>
            {allowed && !tileId && <><circle r="15" className="legal-marker"/><text className="legal-marker-text" textAnchor="middle" dominantBaseline="middle">+</text></>}
            {home && !tileId && <><text className="home-placeholder-number" textAnchor="middle" y="-8">{String(cell.homeIndex! + 1).padStart(2, '0')}</text><text className="home-placeholder-label" textAnchor="middle" y="13">{owner?.name ?? `PLAYER ${cell.homeIndex! + 1}`}</text></>}
            {previewCell === cell.id && <text className="preview-watermark" textAnchor="middle" y="47">PREVIEW</text>}
          </g>;
        })}
      </g>
    </svg>
    {!compact && <div className="board-hint">Scroll to zoom · Drag to explore · Select a hex to inspect</div>}
  </div>;
}
