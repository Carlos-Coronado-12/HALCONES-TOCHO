import { Player, Route, Point } from '../types/playbook';
import { UNITS_PER_YARD } from './playTransforms';

export type ConceptSide = 'left' | 'right';
export type ConceptId = 'smash' | 'flood' | 'drive' | 'dagger' | 'stick' | 'mesh' | 'wheel_flat';

/**
 * A route step in yards.
 * i: lateral movement (+ toward the middle of the field, - toward the sideline)
 * d: depth (+ downfield, - backwards)
 */
interface Step {
  i: number;
  d: number;
}

export interface ConceptDef {
  id: ConceptId;
  name: string;
  tag: string;
  beats: string;
  description: string;
  outside: Step[];   // #1 receiver on concept side (closest to sideline)
  slot: Step[];      // #2 receiver on concept side
  checkdown: Step[]; // Center / RB
  backside: Step[];  // Receivers on the opposite side
  qb: Step[];
}

export const PASS_CONCEPTS: ConceptDef[] = [
  {
    id: 'smash',
    name: 'Smash',
    tag: 'Hitch + Corner',
    beats: 'Cover 2',
    description: 'Hitch corto del #1 a 5 yds y Corner del slot por encima del esquinero.',
    outside: [{ i: 0, d: 5 }, { i: 0.5, d: -1 }],
    slot: [{ i: 0, d: 6 }, { i: -7, d: 7 }],
    checkdown: [{ i: 0, d: 3 }, { i: 2, d: 1 }],
    backside: [{ i: 0, d: 6 }, { i: 12, d: 0 }],
    qb: [{ i: 0, d: -2 }],
  },
  {
    id: 'flood',
    name: 'Flood / Sail',
    tag: '3 Niveles',
    beats: 'Cover 3 / Zona',
    description: 'Go profundo, Out a 7 yds y Flat: sobrecarga los tres niveles de la banda.',
    outside: [{ i: 0, d: 18 }],
    slot: [{ i: 0, d: 7 }, { i: -14, d: 0 }],
    checkdown: [{ i: -2, d: 1 }, { i: -14, d: 1 }],
    backside: [{ i: 0, d: 8 }, { i: 7, d: 8 }],
    qb: [{ i: -3, d: -2 }],
  },
  {
    id: 'drive',
    name: 'Drive',
    tag: 'Drag + Dig',
    beats: 'Cover 1 / Hombre',
    description: 'Drag bajo a 2 yds con Dig a 6 yds por encima: lectura alto-bajo al centro.',
    outside: [{ i: 0, d: 6 }, { i: 16, d: 0 }],
    slot: [{ i: 0, d: 2 }, { i: 22, d: 0 }],
    checkdown: [{ i: 0, d: 5 }],
    backside: [{ i: 0, d: 18 }],
    qb: [{ i: 0, d: -2 }],
  },
  {
    id: 'dagger',
    name: 'Dagger',
    tag: 'Seam + Dig',
    beats: 'Cover 2 / Cover 3',
    description: 'El slot limpia el fondo con Seam y el #1 ataca el hueco con un Dig a 8 yds.',
    outside: [{ i: 0, d: 8 }, { i: 14, d: 0 }],
    slot: [{ i: 0, d: 18 }],
    checkdown: [{ i: 2, d: 1 }, { i: 10, d: 1 }],
    backside: [{ i: 0, d: 7 }, { i: 1, d: -1 }],
    qb: [{ i: 0, d: -2 }],
  },
  {
    id: 'stick',
    name: 'Stick',
    tag: 'Pase Rápido',
    beats: 'Blitz / Cover 0',
    description: 'Stick a 4 yds y Flat rápido con Go limpiando: lanzamiento en menos de 2 s.',
    outside: [{ i: 0, d: 16 }],
    slot: [{ i: 0, d: 4 }, { i: 1.5, d: 0 }],
    checkdown: [{ i: -2, d: 1 }, { i: -14, d: 1 }],
    backside: [{ i: 0, d: 2 }, { i: 7, d: 6 }],
    qb: [{ i: 0, d: -1 }],
  },
  {
    id: 'mesh',
    name: 'Mesh',
    tag: 'Doble Cruce',
    beats: 'Cover 1 / Hombre',
    description: 'Dos cruces bajos que se rozan en el centro para generar bloqueos naturales.',
    outside: [{ i: 0, d: 2 }, { i: 26, d: 0 }],
    slot: [{ i: 0, d: 7 }, { i: -7, d: 7 }],
    checkdown: [{ i: 0, d: 14 }],
    backside: [{ i: 0, d: 3 }, { i: 26, d: 0 }],
    qb: [{ i: 0, d: -2 }],
  },
  {
    id: 'wheel_flat',
    name: 'Wheel',
    tag: 'Rueda + Slant',
    beats: 'Cover 1 / Zona',
    description: 'El slot sale a la banda y acelera vertical mientras el #1 corta en Slant.',
    outside: [{ i: 0, d: 2 }, { i: 8, d: 5 }],
    slot: [{ i: -3, d: 1 }, { i: -4, d: 5 }, { i: 0, d: 12 }],
    checkdown: [{ i: 0, d: 5 }],
    backside: [{ i: 0, d: 6 }, { i: 12, d: 0 }],
    qb: [{ i: 0, d: -2 }],
  },
];

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function buildPoints(start: { x: number; y: number }, steps: Step[], inDir: number): Point[] {
  const pts: Point[] = [{ x: start.x, y: start.y, action: 'start' }];
  let x = start.x;
  let y = start.y;

  steps.forEach((s, idx) => {
    x = clamp(x + s.i * UNITS_PER_YARD * inDir, 3, 97);
    y = clamp(y - s.d * UNITS_PER_YARD, 6, 136);
    pts.push({ x, y, action: idx === steps.length - 1 ? 'end' : 'cut' });
  });

  return pts;
}

/**
 * Returns the side with more receivers (the "strong" side).
 */
export function getStrongSide(players: Player[]): ConceptSide {
  const receivers = players.filter(
    (p) => p.team === 'offense' && !['QB', 'C', 'RB'].includes(p.role)
  );
  const left = receivers.filter((p) => p.x < 50).length;
  const right = receivers.length - left;
  return right > left ? 'right' : 'left';
}

/**
 * Generates the full set of offensive routes for a concept on the chosen side.
 */
export function generateConceptRoutes(
  players: Player[],
  conceptId: ConceptId,
  side: ConceptSide
): Route[] {
  const concept = PASS_CONCEPTS.find((c) => c.id === conceptId);
  if (!concept) return [];

  const offense = players.filter((p) => p.team === 'offense');
  const qb = offense.find((p) => p.role === 'QB');
  const checkdowns = offense.filter((p) => p.role === 'C' || p.role === 'RB');
  const receivers = offense.filter((p) => p !== qb && !checkdowns.includes(p));

  const isOnSide = (p: Player) => (side === 'left' ? p.x < 50 : p.x >= 50);
  const distToSideline = (p: Player) => (side === 'left' ? p.x : 100 - p.x);

  const strong = receivers.filter(isOnSide).sort((a, b) => distToSideline(a) - distToSideline(b));
  const weak = receivers.filter((p) => !isOnSide(p));

  // "Inside" direction for strong side & checkdowns, inverted for backside
  const strongInDir = side === 'left' ? 1 : -1;
  const weakInDir = -strongInDir;

  const assignments: { player: Player; steps: Step[]; inDir: number }[] = [];
  const pendingCheckdowns = [...checkdowns];

  if (strong[0]) assignments.push({ player: strong[0], steps: concept.outside, inDir: strongInDir });

  if (strong[1]) {
    assignments.push({ player: strong[1], steps: concept.slot, inDir: strongInDir });
  } else if (pendingCheckdowns.length > 0) {
    // Lone receiver on concept side: the center/RB fills the slot role
    assignments.push({ player: pendingCheckdowns.shift() as Player, steps: concept.slot, inDir: strongInDir });
  }

  strong.slice(2).forEach((p) => assignments.push({ player: p, steps: concept.checkdown, inDir: strongInDir }));
  weak.forEach((p) => assignments.push({ player: p, steps: concept.backside, inDir: weakInDir }));
  pendingCheckdowns.forEach((p) => assignments.push({ player: p, steps: concept.checkdown, inDir: strongInDir }));
  if (qb) assignments.push({ player: qb, steps: concept.qb, inDir: strongInDir });

  const stamp = Date.now();
  return assignments.map(({ player, steps, inDir }) => ({
    id: `route_${player.id}_${concept.id}_${stamp}`,
    playerId: player.id,
    actionType: 'run' as const,
    color: player.color,
    points: buildPoints({ x: player.x, y: player.y }, steps, inDir),
  }));
}
