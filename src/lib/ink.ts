import type { Ink, Point, Stroke } from '../types';

/**
 * Convert stroke points into an SVG path string with quadratic bezier curves
 */
export function strokeToSvgPath(stroke: Stroke): string {
  if (stroke.length === 0) return '';
  if (stroke.length === 1) {
    const [x, y] = stroke[0];
    return `M ${x} ${y} L ${x + 0.1} ${y + 0.1}`;
  }

  let d = `M ${stroke[0][0]} ${stroke[0][1]}`;

  for (let i = 1; i < stroke.length - 1; i++) {
    const xc = (stroke[i][0] + stroke[i + 1][0]) / 2;
    const yc = (stroke[i][1] + stroke[i + 1][1]) / 2;
    d += ` Q ${stroke[i][0]} ${stroke[i][1]}, ${xc} ${yc}`;
  }

  const last = stroke[stroke.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
}

/**
 * Calculate bounding box of ink
 */
export function getInkBounds(ink: Ink): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
  if (!ink || ink.length === 0) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const stroke of ink) {
    for (const [x, y] of stroke) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (minX === Infinity) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  return { minX, minY, maxX, maxY, width, height };
}
