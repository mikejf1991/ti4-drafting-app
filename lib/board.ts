import type { Cell } from './types';

export const DIRECTIONS = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]] as const;
// Official normal eight-player layout: source boardData.json home_worlds
// [37,40,43,46,49,52,55,58], with center index 0 and clockwise ring indexing.
export const CELLS: Cell[] = [{ id: '0,0', q: 0, r: 0, ring: 0, homeIndex: null }];
for (let ring = 1; ring <= 4; ring++) {
  let q = 0;
  let r = -ring;
  let position = 0;
  for (const [dq, dr] of DIRECTIONS) {
    for (let step = 0; step < ring; step++, position++) {
      CELLS.push({ id: `${q},${r}`, q, r, ring, homeIndex: ring === 4 && position % 3 === 0 ? position / 3 : null });
      q += dq;
      r += dr;
    }
  }
}
export const HOME_CELLS = CELLS.filter(cell => cell.homeIndex !== null);
export const CELL_BY_ID = Object.fromEntries(CELLS.map(cell => [cell.id, cell]));

/** Flat-top hex centers; tile images use a 2*size by sqrt(3)*size box. */
export function hexToPixel(cell: Pick<Cell, 'q' | 'r'>, size = 50): { x: number; y: number } {
  return { x: 1.5 * size * cell.q, y: Math.sqrt(3) * size * (cell.r + cell.q / 2) };
}
export function neighborIds(cell: Cell): string[] {
  return DIRECTIONS.map(([q, r]) => `${cell.q + q},${cell.r + r}`);
}
