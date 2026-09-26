import type { Tile } from '@/lib/types';

const TECH_SKIPS: Record<string, { name: string; color: string }> = {
  biotic: { name: 'Biotic', color: 'green' },
  cybernetic: { name: 'Cybernetic', color: 'yellow' },
  propulsion: { name: 'Propulsion', color: 'blue' },
  warfare: { name: 'Warfare', color: 'red' },
};

export function handTileLabel(tile: Tile | null, tileId: number) {
  const planets = tile?.planets.map(planet => {
    const skips = planet.specialty.filter(specialty => TECH_SKIPS[specialty]).map(specialty => `${TECH_SKIPS[specialty].name} tech skip`);
    return `${planet.name}: ${planet.resources} resources, ${planet.influence} influence${skips.length ? `, ${skips.join(', ')}` : ''}`;
  });
  return `Select ${tile?.name ?? `tile ${tileId}`}${planets?.length ? `. ${planets.join('; ')}` : ''}`;
}

export function HandTileDetails({ tile, tileId, opening }: { tile: Tile | null; tileId: number; opening: boolean }) {
  return <span className="hand-tile-content">
    {tile?.planets.length ? tile.planets.map(planet => <span className="hand-planet" key={planet.name}>
      <strong className="hand-planet-name">{planet.name}</strong>
      <span className="hand-planet-stats" role="img" aria-label={`${planet.resources} resources, ${planet.influence} influence`} title="Resources / Influence">
        <span className="planet-resources">{planet.resources}</span><span className="planet-stat-divider">/</span><span className="planet-influence">{planet.influence}</span>
      </span>
      {planet.specialty.filter(specialty => TECH_SKIPS[specialty]).map(specialty => {
        const skip = TECH_SKIPS[specialty];
        const label = `${skip.name} (${skip.color}) tech skip`;
        return <span key={specialty} className={`hand-tech-skip hand-tech-skip--${specialty}`} role="img" aria-label={label} title={label}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1 14 4.5v7L8 15l-6-3.5v-7Z"/><circle cx="8" cy="8" r="2.5"/></svg>{skip.name}
        </span>;
      })}
    </span>) : <strong>{tile?.name ?? `Tile ${tileId}`}</strong>}
    <small>#{tileId} · {tile?.type ?? 'system'}{opening ? ' · Opening hand' : ''}</small>
  </span>;
}
