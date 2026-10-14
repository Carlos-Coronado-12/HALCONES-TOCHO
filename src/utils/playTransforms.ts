import { Play, Point } from '../types/playbook';

/**
 * Field scale reference (matches FieldCanvas markings):
 * - Goal line at y = 18
 * - 1 yard = 2 SVG units
 */
export const GOAL_LINE_Y = 18;
export const UNITS_PER_YARD = 2;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Mirrors the entire play left <-> right (players, routes and pass target).
 */
export function mirrorPlay(play: Play): Play {
  const fx = (x: number) => round2(100 - x);

  return {
    ...play,
    players: play.players.map((p) => ({ ...p, x: fx(p.x) })),
    routes: play.routes.map((r) => ({
      ...r,
      points: r.points.map((pt) => ({ ...pt, x: fx(pt.x) })),
    })),
    zones: play.zones?.map((z) => ({
      ...z,
      cx: fx(z.cx),
    })),
    ballPass: play.ballPass
      ? {
          ...play.ballPass,
          targetPoint: { ...play.ballPass.targetPoint, x: fx(play.ballPass.targetPoint.x) },
        }
      : undefined,
    updatedAt: Date.now(),
  };
}

export interface YardGuide {
  y: number;
  label: string;
}

/**
 * Key depths relative to the Line of Scrimmage used for route cuts.
 */
export function getKeyYardGuides(losY: number): YardGuide[] {
  const guides: YardGuide[] = [
    { y: losY - 5 * UNITS_PER_YARD, label: '5 YDS' },
    { y: losY - 10 * UNITS_PER_YARD, label: '10 YDS' },
    { y: losY - 15 * UNITS_PER_YARD, label: '15 YDS' },
  ].filter((g) => g.y > GOAL_LINE_Y + 1.5);

  if (losY > GOAL_LINE_Y + 2) {
    guides.push({ y: GOAL_LINE_Y, label: 'TD' });
  }
  return guides;
}

/**
 * Snaps a point's Y to the closest key yard line if within threshold.
 */
export function snapToGuides(
  point: Point,
  guides: YardGuide[],
  threshold = 1.8
): { point: Point; snapped: YardGuide | null } {
  let best: YardGuide | null = null;
  let bestDist = threshold;

  guides.forEach((g) => {
    const d = Math.abs(point.y - g.y);
    if (d <= bestDist) {
      best = g;
      bestDist = d;
    }
  });

  if (!best) return { point, snapped: null };
  return { point: { ...point, y: (best as YardGuide).y }, snapped: best };
}

function perpendicularDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
}

/**
 * Ramer–Douglas–Peucker simplification: turns a jittery freehand stroke
 * into a few clean segments (crisp route cuts).
 */
export function simplifyPath(points: Point[], epsilon = 0.9): Point[] {
  if (points.length <= 2) return points.map((p) => ({ ...p }));

  let maxDist = 0;
  let index = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPath(points.slice(0, index + 1), epsilon);
    const right = simplifyPath(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [{ ...first }, { ...last }];
}
