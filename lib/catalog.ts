import tileData from '../data/tiles.json';
import type { Faction, Tile } from './types';

export const TILES = tileData as Record<number, Tile>;
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, n) => from + n);
export const BLUE_TILES = [...range(19, 38), ...range(59, 66), ...range(69, 76)];
export const RED_TILES = [...range(39, 50), 67, 68, ...range(77, 80)];
const shortNames = ['Sol', 'Mentak', 'Yin', 'Muaat', 'Arborec', 'L1Z1X', 'Winnu', 'Nekro', 'Naalu', 'Letnev', 'Saar', 'Jol-Nar', 'Sardakk', 'Xxcha', 'Yssaril', 'Hacan', 'Ghosts', 'Mahact', 'Nomad', 'Vuil’Raith', 'Titans', 'Empyrean', 'Naaz-Rokha', 'Argent'];
export const FACTIONS: Faction[] = [...range(1, 17), ...range(52, 58)].map((id, index) => ({
  id, name: TILES[id].faction!, shortName: shortNames[index], homeTile: id,
}));
export function tileImage(id: number): string { return `/tiles/ST_${id}.webp`; }
