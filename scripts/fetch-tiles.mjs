// Refresh only the 80 base + Prophecy of Kings tiles requested for this app.
// Metadata/artwork source: https://github.com/KeeganW/ti4 (fan-made; TI artwork belongs to FFG).
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const source = await fetch('https://raw.githubusercontent.com/KeeganW/ti4/master/src/data/tileData.js');
if (!source.ok) throw new Error(`Metadata download failed: ${source.status}`);
const { default: metadata } = await import(`data:text/javascript;base64,${Buffer.from(await source.text()).toString('base64')}`);
const tiles = {};
for (let id = 1; id <= 80; id++) {
  const raw = metadata.all[id];
  const faction = raw.faction?.replace('Lizix', 'L1Z1X');
  const anomalies = Array.isArray(raw.anomaly) ? raw.anomaly : raw.anomaly ? [raw.anomaly] : [];
  const wormholes = Array.isArray(raw.wormhole) ? raw.wormhole : raw.wormhole ? [raw.wormhole] : [];
  const planets = raw.planets.map(planet => ({ ...planet, trait: planet.trait ?? null, specialty: planet.specialty ?? [] }));
  tiles[id] = {
    id, name: id === 17 ? 'Creuss Gate' : planets.map(p => p.name).join(' / ') || anomalies.join(' / ').replaceAll('-', ' ') || (wormholes.length ? `${wormholes.join(' / ')} wormhole` : 'Empty space'),
    type: id === 18 ? 'center' : raw.type === 'green' ? 'home' : raw.type,
    ...(faction ? { faction } : {}), planets, anomalies, wormholes,
  };
}
await mkdir(new URL('data/', root), { recursive: true });
await mkdir(new URL('public/tiles/', root), { recursive: true });
await writeFile(new URL('data/tiles.json', root), `${JSON.stringify(tiles, null, 2)}\n`);
// Keep downloads bounded to avoid hammering the source.
for (let start = 1; start <= 80; start += 8) {
  await Promise.all(Array.from({ length: Math.min(8, 81 - start) }, async (_, offset) => {
    const id = start + offset;
    const response = await fetch(`https://keeganw.github.io/ti4/tiles/ST_${id}.webp`);
    if (!response.ok) throw new Error(`Tile ${id}: HTTP ${response.status}`);
    await writeFile(new URL(`public/tiles/ST_${id}.webp`, root), Buffer.from(await response.arrayBuffer()));
  }));
}
console.log(`Saved 80 tiles and metadata to ${fileURLToPath(root)}`);
