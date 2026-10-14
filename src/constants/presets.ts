import { Play, Player, Route, DefenseScheme, ZoneCoverage } from '../types/playbook';

export interface FormationPreset {
  name: string;
  category: 'offense' | 'defense';
  description: string;
  losY: number;
  players: Player[];
}

// Madden 27 Color Coded Positions
export const PLAYER_COLORS = {
  X: '#facc15',   // Primary Read 🅇 (Yellow)
  Z: '#38bdf8',   // Secondary Read 🅱️ (Sky Blue)
  H: '#fb923c',   // Slot Read 🆈 (Orange)
  Y: '#fb923c',   // Slot Read 🆈 (Orange)
  C: '#00a859',   // Center 🅰️ (Tecmilenio Green)
  QB: '#f8fafc',  // Quarterback 🅁🅱️ (White / Silver)
  RB: '#f472b6',  // Running Back 🅻 (Pink)
  RUSH: '#ef4444',// Rusher (Red)
  CB1: '#f43f5e', // Cornerback Left (Rose)
  CB2: '#f43f5e', // Cornerback Right (Rose)
  S1: '#a855f7',  // Free Safety (Purple)
  S2: '#a855f7',  // Strong Safety (Purple)
  LB: '#fb7185',  // Linebacker (Coral)
};

// Line of Scrimmage at the 30-Yard Line
export const YARD_30_LOS_Y = 78;

export const DEFAULT_OFFENSIVE_PLAYERS: Player[] = [
  { id: 'off_qb', role: 'QB', label: 'QB', jerseyNumber: '7', team: 'offense', x: 50, y: 92, color: PLAYER_COLORS.QB, customName: 'Quarterback' },
  { id: 'off_c', role: 'C', label: 'C', jerseyNumber: '50', team: 'offense', x: 50, y: 78, color: PLAYER_COLORS.C, customName: 'Center' },
  { id: 'off_wr1', role: 'WR1', label: 'X', jerseyNumber: '11', team: 'offense', x: 15, y: 78, color: PLAYER_COLORS.X, customName: 'WR Izquierdo' },
  { id: 'off_wr2', role: 'WR2', label: 'H', jerseyNumber: '24', team: 'offense', x: 30, y: 79, color: PLAYER_COLORS.H, customName: 'Slot WR' },
  { id: 'off_wr3', role: 'WR3', label: 'Z', jerseyNumber: '88', team: 'offense', x: 85, y: 78, color: PLAYER_COLORS.Z, customName: 'WR Derecho' },
];

export const FORMATION_PRESETS: FormationPreset[] = [
  {
    name: 'Spread 2x2 (Yarda 30)',
    category: 'offense',
    description: 'Formación estándar en la yarda 30 con 2 receptores a la izquierda y 2 a la derecha.',
    losY: 78,
    players: [
      { id: 'p_qb', role: 'QB', label: 'QB', jerseyNumber: '7', team: 'offense', x: 50, y: 92, color: PLAYER_COLORS.QB },
      { id: 'p_c', role: 'C', label: 'C', jerseyNumber: '50', team: 'offense', x: 50, y: 78, color: PLAYER_COLORS.C },
      { id: 'p_x', role: 'WR1', label: 'X', jerseyNumber: '11', team: 'offense', x: 15, y: 78, color: PLAYER_COLORS.X },
      { id: 'p_h', role: 'WR2', label: 'H', jerseyNumber: '24', team: 'offense', x: 30, y: 79, color: PLAYER_COLORS.H },
      { id: 'p_z', role: 'WR3', label: 'Z', jerseyNumber: '88', team: 'offense', x: 85, y: 78, color: PLAYER_COLORS.Z },
    ]
  },
  {
    name: 'Trips Derecho (Yarda 30)',
    category: 'offense',
    description: '3 receptores al lado derecho para sobrecargar la cobertura y 1 receptor aislado (X) a la izquierda.',
    losY: 78,
    players: [
      { id: 'p_qb', role: 'QB', label: 'QB', jerseyNumber: '7', team: 'offense', x: 50, y: 92, color: PLAYER_COLORS.QB },
      { id: 'p_c', role: 'C', label: 'C', jerseyNumber: '50', team: 'offense', x: 50, y: 78, color: PLAYER_COLORS.C },
      { id: 'p_x', role: 'WR1', label: 'X', jerseyNumber: '11', team: 'offense', x: 15, y: 78, color: PLAYER_COLORS.X },
      { id: 'p_y', role: 'WR2', label: 'Y', jerseyNumber: '80', team: 'offense', x: 70, y: 79, color: PLAYER_COLORS.Y },
      { id: 'p_z', role: 'WR3', label: 'Z', jerseyNumber: '88', team: 'offense', x: 86, y: 78, color: PLAYER_COLORS.Z },
    ]
  },
  {
    name: 'Bunch Derecho (Racimo)',
    category: 'offense',
    description: '3 receptores en racimo en la yarda 30 para generar tráfico y picks rápidos.',
    losY: 78,
    players: [
      { id: 'p_qb', role: 'QB', label: 'QB', jerseyNumber: '7', team: 'offense', x: 50, y: 92, color: PLAYER_COLORS.QB },
      { id: 'p_c', role: 'C', label: 'C', jerseyNumber: '50', team: 'offense', x: 50, y: 78, color: PLAYER_COLORS.C },
      { id: 'p_x', role: 'WR1', label: 'X', jerseyNumber: '11', team: 'offense', x: 15, y: 78, color: PLAYER_COLORS.X },
      { id: 'p_b1', role: 'WR2', label: 'Y', jerseyNumber: '80', team: 'offense', x: 70, y: 79, color: PLAYER_COLORS.Y },
      { id: 'p_b2', role: 'WR3', label: 'Z', jerseyNumber: '88', team: 'offense', x: 78, y: 81, color: PLAYER_COLORS.Z },
    ]
  },
  {
    name: 'Pistol / Backfield (RPO)',
    category: 'offense',
    description: 'Corredor al lado del QB en la yarda 30 para opciones de carrera y pase pantalla.',
    losY: 78,
    players: [
      { id: 'p_qb', role: 'QB', label: 'QB', jerseyNumber: '7', team: 'offense', x: 50, y: 90, color: PLAYER_COLORS.QB },
      { id: 'p_rb', role: 'RB', label: 'RB', jerseyNumber: '21', team: 'offense', x: 40, y: 92, color: PLAYER_COLORS.RB },
      { id: 'p_c', role: 'C', label: 'C', jerseyNumber: '50', team: 'offense', x: 50, y: 78, color: PLAYER_COLORS.C },
      { id: 'p_x', role: 'WR1', label: 'X', jerseyNumber: '11', team: 'offense', x: 15, y: 78, color: PLAYER_COLORS.X },
      { id: 'p_z', role: 'WR2', label: 'Z', jerseyNumber: '88', team: 'offense', x: 85, y: 78, color: PLAYER_COLORS.Z },
    ]
  },
  // Defensive Formations
  {
    name: 'Defensa 2-3 Zona (Cover 2)',
    category: 'defense',
    description: '2 Safeties protegiendo zonas profundas, 2 CBs en laterales y 1 Rusher a 7 yardas (Yarda 37).',
    losY: 78,
    players: [
      { id: 'def_rush', role: 'RUSH', label: 'R', jerseyNumber: '99', team: 'defense', x: 50, y: 64, color: PLAYER_COLORS.RUSH },
      { id: 'def_cb1', role: 'CB1', label: 'CB1', jerseyNumber: '25', team: 'defense', x: 18, y: 72, color: PLAYER_COLORS.CB1 },
      { id: 'def_cb2', role: 'CB2', label: 'CB2', jerseyNumber: '26', team: 'defense', x: 82, y: 72, color: PLAYER_COLORS.CB2 },
      { id: 'def_s1', role: 'S1', label: 'FS', jerseyNumber: '33', team: 'defense', x: 30, y: 48, color: PLAYER_COLORS.S1 },
      { id: 'def_s2', role: 'S2', label: 'SS', jerseyNumber: '34', team: 'defense', x: 70, y: 48, color: PLAYER_COLORS.S2 },
    ]
  },
  {
    name: 'Defensa 1-3-1 Zona (Cover 1)',
    category: 'defense',
    description: '1 Safety en el fondo central, 3 defensivos en zonas medias y 1 Rusher frontal.',
    losY: 78,
    players: [
      { id: 'def_rush', role: 'RUSH', label: 'R', jerseyNumber: '99', team: 'defense', x: 50, y: 64, color: PLAYER_COLORS.RUSH },
      { id: 'def_cb1', role: 'CB1', label: 'CB1', jerseyNumber: '25', team: 'defense', x: 18, y: 72, color: PLAYER_COLORS.CB1 },
      { id: 'def_lb', role: 'LB', label: 'LB', jerseyNumber: '54', team: 'defense', x: 50, y: 68, color: PLAYER_COLORS.LB },
      { id: 'def_cb2', role: 'CB2', label: 'CB2', jerseyNumber: '26', team: 'defense', x: 82, y: 72, color: PLAYER_COLORS.CB2 },
      { id: 'def_s1', role: 'S1', label: 'FS', jerseyNumber: '33', team: 'defense', x: 50, y: 40, color: PLAYER_COLORS.S1 },
    ]
  }
];

export const DEFENSE_SCHEMES_DATA: Record<
  DefenseScheme,
  { id: DefenseScheme; name: string; description: string; players: Player[]; routes: Route[]; zones?: ZoneCoverage[] }
> = {
  cover2: {
    id: 'cover2',
    name: 'Cover 2 (Zona Drops)',
    description: '2 Safeties en zonas profundas (Deep Halves) y 2 CBs patrullando los flats laterales.',
    players: [
      { id: 'def_rush', role: 'RUSH' as const, label: 'R', jerseyNumber: '99', team: 'defense' as const, x: 50, y: 64, color: PLAYER_COLORS.RUSH, customName: 'Rusher' },
      { id: 'def_cb1', role: 'CB1' as const, label: 'CB1', jerseyNumber: '25', team: 'defense' as const, x: 18, y: 72, color: PLAYER_COLORS.CB1, customName: 'Cornerback Izq' },
      { id: 'def_cb2', role: 'CB2' as const, label: 'CB2', jerseyNumber: '26', team: 'defense' as const, x: 82, y: 72, color: PLAYER_COLORS.CB2, customName: 'Cornerback Der' },
      { id: 'def_s1', role: 'S1' as const, label: 'FS', jerseyNumber: '33', team: 'defense' as const, x: 30, y: 48, color: PLAYER_COLORS.S1, customName: 'Free Safety' },
      { id: 'def_s2', role: 'S2' as const, label: 'SS', jerseyNumber: '34', team: 'defense' as const, x: 70, y: 48, color: PLAYER_COLORS.S2, customName: 'Strong Safety' },
    ],
    routes: [
      {
        id: 'r_def_rush',
        playerId: 'def_rush',
        actionType: 'rush' as const,
        color: PLAYER_COLORS.RUSH,
        points: [{ x: 50, y: 64 }, { x: 50, y: 92 }]
      },
      {
        id: 'r_def_cb1',
        playerId: 'def_cb1',
        actionType: 'run' as const,
        color: PLAYER_COLORS.CB1,
        points: [{ x: 18, y: 72 }, { x: 16, y: 60 }]
      },
      {
        id: 'r_def_cb2',
        playerId: 'def_cb2',
        actionType: 'run' as const,
        color: PLAYER_COLORS.CB2,
        points: [{ x: 82, y: 72 }, { x: 84, y: 60 }]
      },
      {
        id: 'r_def_s1',
        playerId: 'def_s1',
        actionType: 'run' as const,
        color: PLAYER_COLORS.S1,
        points: [{ x: 30, y: 48 }, { x: 28, y: 28 }]
      },
      {
        id: 'r_def_s2',
        playerId: 'def_s2',
        actionType: 'run' as const,
        color: PLAYER_COLORS.S2,
        points: [{ x: 70, y: 48 }, { x: 72, y: 28 }]
      }
    ],
    zones: [
      { id: 'z_s1', playerId: 'def_s1', name: 'Deep Half Izq', cx: 28, cy: 30, rx: 22, ry: 14, color: PLAYER_COLORS.S1 },
      { id: 'z_s2', playerId: 'def_s2', name: 'Deep Half Der', cx: 72, cy: 30, rx: 22, ry: 14, color: PLAYER_COLORS.S2 },
      { id: 'z_cb1', playerId: 'def_cb1', name: 'Flat Izq (Under)', cx: 20, cy: 60, rx: 16, ry: 9, color: PLAYER_COLORS.CB1 },
      { id: 'z_cb2', playerId: 'def_cb2', name: 'Flat Der (Under)', cx: 80, cy: 60, rx: 16, ry: 9, color: PLAYER_COLORS.CB2 },
    ]
  },
  cover3: {
    id: 'cover3',
    name: 'Cover 3 (3 Tercios)',
    description: '3 Defensores en zonas profundas (Deep Thirds) y 1 Linebacker protegiendo el centro corto.',
    players: [
      { id: 'def_rush', role: 'RUSH' as const, label: 'R', jerseyNumber: '99', team: 'defense' as const, x: 50, y: 64, color: PLAYER_COLORS.RUSH, customName: 'Rusher' },
      { id: 'def_cb1', role: 'CB1' as const, label: 'CB1', jerseyNumber: '25', team: 'defense' as const, x: 18, y: 72, color: PLAYER_COLORS.CB1, customName: 'Cornerback Izq' },
      { id: 'def_lb', role: 'LB' as const, label: 'LB', jerseyNumber: '54', team: 'defense' as const, x: 50, y: 70, color: PLAYER_COLORS.LB, customName: 'Linebacker Hook' },
      { id: 'def_cb2', role: 'CB2' as const, label: 'CB2', jerseyNumber: '26', team: 'defense' as const, x: 82, y: 72, color: PLAYER_COLORS.CB2, customName: 'Cornerback Der' },
      { id: 'def_s1', role: 'S1' as const, label: 'FS', jerseyNumber: '33', team: 'defense' as const, x: 50, y: 44, color: PLAYER_COLORS.S1, customName: 'Free Safety' },
    ],
    routes: [
      {
        id: 'r_def_rush',
        playerId: 'def_rush',
        actionType: 'rush' as const,
        color: PLAYER_COLORS.RUSH,
        points: [{ x: 50, y: 64 }, { x: 50, y: 92 }]
      },
      {
        id: 'r_def_cb1',
        playerId: 'def_cb1',
        actionType: 'run' as const,
        color: PLAYER_COLORS.CB1,
        points: [{ x: 18, y: 72 }, { x: 16, y: 28 }]
      },
      {
        id: 'r_def_lb',
        playerId: 'def_lb',
        actionType: 'run' as const,
        color: PLAYER_COLORS.LB,
        points: [{ x: 50, y: 70 }, { x: 50, y: 58 }]
      },
      {
        id: 'r_def_cb2',
        playerId: 'def_cb2',
        actionType: 'run' as const,
        color: PLAYER_COLORS.CB2,
        points: [{ x: 82, y: 72 }, { x: 84, y: 28 }]
      },
      {
        id: 'r_def_s1',
        playerId: 'def_s1',
        actionType: 'run' as const,
        color: PLAYER_COLORS.S1,
        points: [{ x: 50, y: 44 }, { x: 50, y: 26 }]
      }
    ],
    zones: [
      { id: 'z_c3_cb1', playerId: 'def_cb1', name: 'Deep 1/3 Izq', cx: 18, cy: 30, rx: 16, ry: 15, color: PLAYER_COLORS.CB1 },
      { id: 'z_c3_s1', playerId: 'def_s1', name: 'Deep 1/3 Centro', cx: 50, cy: 26, rx: 18, ry: 15, color: PLAYER_COLORS.S1 },
      { id: 'z_c3_cb2', playerId: 'def_cb2', name: 'Deep 1/3 Der', cx: 82, cy: 30, rx: 16, ry: 15, color: PLAYER_COLORS.CB2 },
      { id: 'z_c3_lb', playerId: 'def_lb', name: 'Hook / Centro Corto', cx: 50, cy: 58, rx: 20, ry: 10, color: PLAYER_COLORS.LB },
    ]
  },
  cover4: {
    id: 'cover4',
    name: 'Cover 4 (Quarters / Zona Roja)',
    description: '4 Defensores cubren cuadrantes de 25% del fondo cada uno. Máxima seguridad profunda.',
    players: [
      { id: 'def_rush', role: 'RUSH' as const, label: 'R', jerseyNumber: '99', team: 'defense' as const, x: 50, y: 64, color: PLAYER_COLORS.RUSH, customName: 'Rusher' },
      { id: 'def_cb1', role: 'CB1' as const, label: 'CB1', jerseyNumber: '25', team: 'defense' as const, x: 15, y: 68, color: PLAYER_COLORS.CB1, customName: 'CB1' },
      { id: 'def_s1', role: 'S1' as const, label: 'FS', jerseyNumber: '33', team: 'defense' as const, x: 38, y: 50, color: PLAYER_COLORS.S1, customName: 'Free Safety' },
      { id: 'def_s2', role: 'S2' as const, label: 'SS', jerseyNumber: '34', team: 'defense' as const, x: 62, y: 50, color: PLAYER_COLORS.S2, customName: 'Strong Safety' },
      { id: 'def_cb2', role: 'CB2' as const, label: 'CB2', jerseyNumber: '26', team: 'defense' as const, x: 85, y: 68, color: PLAYER_COLORS.CB2, customName: 'CB2' },
    ],
    routes: [
      {
        id: 'r_def_rush',
        playerId: 'def_rush',
        actionType: 'rush' as const,
        color: PLAYER_COLORS.RUSH,
        points: [{ x: 50, y: 64 }, { x: 50, y: 92 }]
      },
      {
        id: 'r_def_cb1',
        playerId: 'def_cb1',
        actionType: 'run' as const,
        color: PLAYER_COLORS.CB1,
        points: [{ x: 15, y: 68 }, { x: 14, y: 32 }]
      },
      {
        id: 'r_def_s1',
        playerId: 'def_s1',
        actionType: 'run' as const,
        color: PLAYER_COLORS.S1,
        points: [{ x: 38, y: 50 }, { x: 38, y: 32 }]
      },
      {
        id: 'r_def_s2',
        playerId: 'def_s2',
        actionType: 'run' as const,
        color: PLAYER_COLORS.S2,
        points: [{ x: 62, y: 50 }, { x: 62, y: 32 }]
      },
      {
        id: 'r_def_cb2',
        playerId: 'def_cb2',
        actionType: 'run' as const,
        color: PLAYER_COLORS.CB2,
        points: [{ x: 85, y: 68 }, { x: 86, y: 32 }]
      }
    ],
    zones: [
      { id: 'z_c4_cb1', playerId: 'def_cb1', name: 'Quarter 1/4 Izq', cx: 14, cy: 30, rx: 12, ry: 15, color: PLAYER_COLORS.CB1 },
      { id: 'z_c4_s1', playerId: 'def_s1', name: 'Quarter 1/4 C-Izq', cx: 38, cy: 30, rx: 12, ry: 15, color: PLAYER_COLORS.S1 },
      { id: 'z_c4_s2', playerId: 'def_s2', name: 'Quarter 1/4 C-Der', cx: 62, cy: 30, rx: 12, ry: 15, color: PLAYER_COLORS.S2 },
      { id: 'z_c4_cb2', playerId: 'def_cb2', name: 'Quarter 1/4 Der', cx: 86, cy: 30, rx: 12, ry: 15, color: PLAYER_COLORS.CB2 },
    ]
  },
  cover1: {
    id: 'cover1',
    name: 'Cover 1 (Hombre + FS)',
    description: 'Marca personal a receptores con Free Safety patrullando el fondo.',
    players: [
      { id: 'def_rush', role: 'RUSH' as const, label: 'R', jerseyNumber: '99', team: 'defense' as const, x: 50, y: 64, color: PLAYER_COLORS.RUSH, customName: 'Rusher' },
      { id: 'def_cb1', role: 'CB1' as const, label: 'CB1', jerseyNumber: '25', team: 'defense' as const, x: 16, y: 72, color: PLAYER_COLORS.CB1, customName: 'CB vs X' },
      { id: 'def_lb', role: 'LB' as const, label: 'LB', jerseyNumber: '54', team: 'defense' as const, x: 32, y: 72, color: PLAYER_COLORS.LB, customName: 'LB vs Slot' },
      { id: 'def_cb2', role: 'CB2' as const, label: 'CB2', jerseyNumber: '26', team: 'defense' as const, x: 84, y: 72, color: PLAYER_COLORS.CB2, customName: 'CB vs Z' },
      { id: 'def_s1', role: 'S1' as const, label: 'FS', jerseyNumber: '33', team: 'defense' as const, x: 50, y: 42, color: PLAYER_COLORS.S1, customName: 'Free Safety' },
    ],
    routes: [
      {
        id: 'r_def_rush',
        playerId: 'def_rush',
        actionType: 'rush' as const,
        color: PLAYER_COLORS.RUSH,
        points: [{ x: 50, y: 64 }, { x: 50, y: 92 }]
      },
      {
        id: 'r_def_cb1',
        playerId: 'def_cb1',
        actionType: 'run' as const,
        color: PLAYER_COLORS.CB1,
        points: [{ x: 16, y: 72 }, { x: 18, y: 55 }]
      },
      {
        id: 'r_def_lb',
        playerId: 'def_lb',
        actionType: 'run' as const,
        color: PLAYER_COLORS.LB,
        points: [{ x: 32, y: 72 }, { x: 32, y: 56 }]
      },
      {
        id: 'r_def_cb2',
        playerId: 'def_cb2',
        actionType: 'run' as const,
        color: PLAYER_COLORS.CB2,
        points: [{ x: 84, y: 72 }, { x: 82, y: 55 }]
      },
      {
        id: 'r_def_s1',
        playerId: 'def_s1',
        actionType: 'run' as const,
        color: PLAYER_COLORS.S1,
        points: [{ x: 50, y: 42 }, { x: 50, y: 22 }]
      }
    ],
    zones: [
      { id: 'z_c1_s1', playerId: 'def_s1', name: 'Deep Middle (FS)', cx: 50, cy: 26, rx: 24, ry: 15, color: PLAYER_COLORS.S1 }
    ]
  },
  blitz: {
    id: 'blitz',
    name: 'Cover 0 (All Out Blitz)',
    description: 'Presión agresiva con doble blitz al QB y cobertura pegada.',
    players: [
      { id: 'def_rush', role: 'RUSH' as const, label: 'R', jerseyNumber: '99', team: 'defense' as const, x: 45, y: 64, color: PLAYER_COLORS.RUSH, customName: 'Rusher 1' },
      { id: 'def_lb', role: 'LB' as const, label: 'LB', jerseyNumber: '54', team: 'defense' as const, x: 55, y: 64, color: PLAYER_COLORS.LB, customName: 'Rusher 2 (Blitz)' },
      { id: 'def_cb1', role: 'CB1' as const, label: 'CB1', jerseyNumber: '25', team: 'defense' as const, x: 16, y: 74, color: PLAYER_COLORS.CB1, customName: 'Press CB1' },
      { id: 'def_cb2', role: 'CB2' as const, label: 'CB2', jerseyNumber: '26', team: 'defense' as const, x: 84, y: 74, color: PLAYER_COLORS.CB2, customName: 'Press CB2' },
      { id: 'def_s1', role: 'S1' as const, label: 'FS', jerseyNumber: '33', team: 'defense' as const, x: 50, y: 54, color: PLAYER_COLORS.S1, customName: 'Safety Center' },
    ],
    routes: [
      {
        id: 'r_def_rush',
        playerId: 'def_rush',
        actionType: 'rush' as const,
        color: PLAYER_COLORS.RUSH,
        points: [{ x: 45, y: 64 }, { x: 50, y: 92 }]
      },
      {
        id: 'r_def_lb',
        playerId: 'def_lb',
        actionType: 'rush' as const,
        color: PLAYER_COLORS.LB,
        points: [{ x: 55, y: 64 }, { x: 50, y: 92 }]
      },
      {
        id: 'r_def_cb1',
        playerId: 'def_cb1',
        actionType: 'run' as const,
        color: PLAYER_COLORS.CB1,
        points: [{ x: 16, y: 74 }, { x: 18, y: 62 }]
      },
      {
        id: 'r_def_cb2',
        playerId: 'def_cb2',
        actionType: 'run' as const,
        color: PLAYER_COLORS.CB2,
        points: [{ x: 84, y: 74 }, { x: 82, y: 62 }]
      },
      {
        id: 'r_def_s1',
        playerId: 'def_s1',
        actionType: 'run' as const,
        color: PLAYER_COLORS.S1,
        points: [{ x: 50, y: 54 }, { x: 50, y: 68 }]
      }
    ]
  }
};

export const INITIAL_DEFAULT_PLAYS: Play[] = [
  {
    id: 'play_mesh_yard30',
    name: 'Madden Mesh (Yarda 30 → TD)',
    category: 'Ofensiva',
    formationName: 'Spread 2x2 (Yarda 30)',
    tags: ['Pase Rápido', 'Anti-Blitz', 'Yarda 30'],
    description: 'Iniciando en la yarda 30: X corre 5 yds verticales y cruza a la derecha. Z corre 9 yds y cruza a la izquierda por arriba. Centro C ataca la costura vertical a la anotación.',
    losY: 78,
    createdAt: Date.now() - 1000000,
    updatedAt: Date.now() - 1000000,
    isFavorite: true,
    players: [
      { id: 'p1', role: 'QB', label: 'QB', jerseyNumber: '7', team: 'offense', x: 50, y: 92, color: PLAYER_COLORS.QB },
      { id: 'p2', role: 'C', label: 'C', jerseyNumber: '50', team: 'offense', x: 50, y: 78, color: PLAYER_COLORS.C },
      { id: 'p3', role: 'WR1', label: 'X', jerseyNumber: '11', team: 'offense', x: 15, y: 78, color: PLAYER_COLORS.X },
      { id: 'p4', role: 'WR2', label: 'H', jerseyNumber: '24', team: 'offense', x: 30, y: 79, color: PLAYER_COLORS.H },
      { id: 'p5', role: 'WR3', label: 'Z', jerseyNumber: '88', team: 'offense', x: 85, y: 78, color: PLAYER_COLORS.Z },
    ],
    routes: [
      {
        id: 'r_qb',
        playerId: 'p1',
        actionType: 'run',
        color: PLAYER_COLORS.QB,
        points: [{ x: 50, y: 92 }, { x: 50, y: 95 }]
      },
      {
        id: 'r_c',
        playerId: 'p2',
        actionType: 'run',
        color: PLAYER_COLORS.C,
        points: [{ x: 50, y: 78 }, { x: 50, y: 52 }, { x: 50, y: 28 }]
      },
      {
        id: 'r_x',
        playerId: 'p3',
        actionType: 'run',
        color: PLAYER_COLORS.X,
        points: [{ x: 15, y: 78 }, { x: 15, y: 68 }, { x: 45, y: 66 }, { x: 80, y: 65 }]
      },
      {
        id: 'r_h',
        playerId: 'p4',
        actionType: 'run',
        color: PLAYER_COLORS.H,
        points: [{ x: 30, y: 79 }, { x: 30, y: 56 }, { x: 10, y: 38 }]
      },
      {
        id: 'r_z',
        playerId: 'p5',
        actionType: 'run',
        color: PLAYER_COLORS.Z,
        points: [{ x: 85, y: 78 }, { x: 85, y: 60 }, { x: 55, y: 58 }, { x: 20, y: 57 }]
      }
    ],
    ballPass: {
      fromPlayerId: 'p1',
      toPlayerId: 'p3',
      targetPoint: { x: 45, y: 66 },
      releaseProgress: 0.45,
      catchProgress: 0.70
    }
  },
  {
    id: 'play_flood_yard30',
    name: 'Flood Right (Yarda 30 → Zona Roja)',
    category: 'Ofensiva',
    formationName: 'Trips Derecho (Yarda 30)',
    tags: ['Pase Profundo', '3ra & Largo', 'Yarda 30'],
    description: 'Sobrecarga de 3 niveles en banda derecha desde la 30: Z en racha profunda a la anotación, Y en corte a la banda en la 15, y C al flat en la 25.',
    losY: 78,
    createdAt: Date.now() - 500000,
    updatedAt: Date.now() - 500000,
    isFavorite: true,
    players: [
      { id: 'f_qb', role: 'QB', label: 'QB', jerseyNumber: '7', team: 'offense', x: 50, y: 92, color: PLAYER_COLORS.QB },
      { id: 'f_c', role: 'C', label: 'C', jerseyNumber: '50', team: 'offense', x: 50, y: 78, color: PLAYER_COLORS.C },
      { id: 'f_x', role: 'WR1', label: 'X', jerseyNumber: '11', team: 'offense', x: 15, y: 78, color: PLAYER_COLORS.X },
      { id: 'f_y', role: 'WR2', label: 'Y', jerseyNumber: '80', team: 'offense', x: 70, y: 79, color: PLAYER_COLORS.Y },
      { id: 'f_z', role: 'WR3', label: 'Z', jerseyNumber: '88', team: 'offense', x: 86, y: 78, color: PLAYER_COLORS.Z },
    ],
    routes: [
      {
        id: 'rf_qb',
        playerId: 'f_qb',
        actionType: 'run',
        color: PLAYER_COLORS.QB,
        points: [{ x: 50, y: 92 }, { x: 55, y: 94 }]
      },
      {
        id: 'rf_c',
        playerId: 'f_c',
        actionType: 'run',
        color: PLAYER_COLORS.C,
        points: [{ x: 50, y: 78 }, { x: 65, y: 74 }, { x: 90, y: 74 }]
      },
      {
        id: 'rf_x',
        playerId: 'f_x',
        actionType: 'run',
        color: PLAYER_COLORS.X,
        points: [{ x: 15, y: 78 }, { x: 15, y: 52 }, { x: 45, y: 24 }]
      },
      {
        id: 'rf_y',
        playerId: 'f_y',
        actionType: 'run',
        color: PLAYER_COLORS.Y,
        points: [{ x: 70, y: 79 }, { x: 70, y: 56 }, { x: 92, y: 54 }]
      },
      {
        id: 'rf_z',
        playerId: 'f_z',
        actionType: 'run',
        color: PLAYER_COLORS.Z,
        points: [{ x: 86, y: 78 }, { x: 86, y: 45 }, { x: 86, y: 16 }]
      }
    ],
    ballPass: {
      fromPlayerId: 'f_qb',
      toPlayerId: 'f_y',
      targetPoint: { x: 92, y: 54 },
      releaseProgress: 0.5,
      catchProgress: 0.75
    }
  },
  {
    id: 'play_def_cover1_man',
    name: 'Cover 1 Personal (Hombre a Hombre IA 🤖)',
    category: 'Defensiva',
    formationName: 'Defensa 1-3-1 Personal',
    defenseScheme: 'cover1',
    tags: ['Hombre a Hombre', 'Cover 1', 'IA Reactiva', 'Cojín 1.5Y'],
    description: 'Marcación individual pegada de cada defensor sobre su receptor asignado con IA reactiva y Free Safety profundo en el centro.',
    losY: 78,
    createdAt: Date.now() - 400000,
    updatedAt: Date.now() - 400000,
    isFavorite: true,
    players: [
      { id: 'd_c1_rush', role: 'RUSH', label: 'R', jerseyNumber: '99', team: 'defense', x: 50, y: 64, color: PLAYER_COLORS.RUSH, customName: 'Rusher' },
      { id: 'd_c1_cb1', role: 'CB1', label: 'CB1', jerseyNumber: '25', team: 'defense', x: 18, y: 72, color: PLAYER_COLORS.CB1, customName: 'Cornerback Izq' },
      { id: 'd_c1_lb', role: 'LB', label: 'LB', jerseyNumber: '54', team: 'defense', x: 50, y: 68, color: PLAYER_COLORS.LB, customName: 'Linebacker' },
      { id: 'd_c1_cb2', role: 'CB2', label: 'CB2', jerseyNumber: '26', team: 'defense', x: 82, y: 72, color: PLAYER_COLORS.CB2, customName: 'Cornerback Der' },
      { id: 'd_c1_s1', role: 'S1', label: 'FS', jerseyNumber: '33', team: 'defense', x: 50, y: 40, color: PLAYER_COLORS.S1, customName: 'Free Safety' },
    ],
    routes: [
      { id: 'rd_c1_rush', playerId: 'd_c1_rush', actionType: 'rush', color: PLAYER_COLORS.RUSH, points: [{ x: 50, y: 64 }, { x: 50, y: 92 }] },
      { id: 'rd_c1_cb1', playerId: 'd_c1_cb1', actionType: 'run', color: PLAYER_COLORS.CB1, points: [{ x: 18, y: 72 }, { x: 16, y: 60 }] },
      { id: 'rd_c1_lb', playerId: 'd_c1_lb', actionType: 'run', color: PLAYER_COLORS.LB, points: [{ x: 50, y: 68 }, { x: 50, y: 55 }] },
      { id: 'rd_c1_cb2', playerId: 'd_c1_cb2', actionType: 'run', color: PLAYER_COLORS.CB2, points: [{ x: 82, y: 72 }, { x: 84, y: 60 }] },
      { id: 'rd_c1_s1', playerId: 'd_c1_s1', actionType: 'run', color: PLAYER_COLORS.S1, points: [{ x: 50, y: 40 }, { x: 50, y: 25 }] },
    ],
    zones: [
      { id: 'z_c1_s1', playerId: 'd_c1_s1', name: 'Deep Middle (FS)', cx: 50, cy: 26, rx: 24, ry: 15, shape: 'rectangle', color: PLAYER_COLORS.S1 }
    ]
  },
  {
    id: 'play_def_blitz_man',
    name: 'Cover 0 Blitz (Presión al QB + IA 🤖)',
    category: 'Defensiva',
    formationName: 'Defensa Blitz Agresivo',
    defenseScheme: 'blitz',
    tags: ['Blitz', 'Cover 0', 'Presión QB', 'IA'],
    description: 'Rusher a máxima aceleración directo al QB con cobertura hombre a hombre estricta sin apoyo profundo.',
    losY: 78,
    createdAt: Date.now() - 300000,
    updatedAt: Date.now() - 300000,
    isFavorite: true,
    players: [
      { id: 'd_b_rush', role: 'RUSH', label: 'R', jerseyNumber: '99', team: 'defense', x: 50, y: 64, color: PLAYER_COLORS.RUSH, customName: 'Rusher' },
      { id: 'd_b_cb1', role: 'CB1', label: 'CB1', jerseyNumber: '25', team: 'defense', x: 15, y: 70, color: PLAYER_COLORS.CB1, customName: 'CB1 Press' },
      { id: 'd_b_s1', role: 'S1', label: 'FS', jerseyNumber: '33', team: 'defense', x: 35, y: 66, color: PLAYER_COLORS.S1, customName: 'Safety Slot' },
      { id: 'd_b_s2', role: 'S2', label: 'SS', jerseyNumber: '34', team: 'defense', x: 65, y: 66, color: PLAYER_COLORS.S2, customName: 'Safety Slot' },
      { id: 'd_b_cb2', role: 'CB2', label: 'CB2', jerseyNumber: '26', team: 'defense', x: 85, y: 70, color: PLAYER_COLORS.CB2, customName: 'CB2 Press' },
    ],
    routes: [
      { id: 'rd_b_rush', playerId: 'd_b_rush', actionType: 'rush', color: PLAYER_COLORS.RUSH, points: [{ x: 50, y: 64 }, { x: 50, y: 92 }] },
    ]
  },
  {
    id: 'play_def_cover2_zone',
    name: 'Cover 2 Zona (2 Profundos + 2 Flats)',
    category: 'Defensiva',
    formationName: 'Defensa 2-3 Zona (Cover 2)',
    defenseScheme: 'cover2',
    tags: ['Cover 2', 'Zona Drops', '2 Profundos'],
    description: '2 Safeties protegiendo mitades profundas y 2 Cornerbacks patrullando los flats laterales.',
    losY: 78,
    createdAt: Date.now() - 200000,
    updatedAt: Date.now() - 200000,
    isFavorite: true,
    players: [
      { id: 'd_c2_rush', role: 'RUSH', label: 'R', jerseyNumber: '99', team: 'defense', x: 50, y: 64, color: PLAYER_COLORS.RUSH, customName: 'Rusher' },
      { id: 'd_c2_cb1', role: 'CB1', label: 'CB1', jerseyNumber: '25', team: 'defense', x: 18, y: 72, color: PLAYER_COLORS.CB1, customName: 'Cornerback Izq' },
      { id: 'd_c2_cb2', role: 'CB2', label: 'CB2', jerseyNumber: '26', team: 'defense', x: 82, y: 72, color: PLAYER_COLORS.CB2, customName: 'Cornerback Der' },
      { id: 'd_c2_s1', role: 'S1', label: 'FS', jerseyNumber: '33', team: 'defense', x: 30, y: 48, color: PLAYER_COLORS.S1, customName: 'Free Safety' },
      { id: 'd_c2_s2', role: 'S2', label: 'SS', jerseyNumber: '34', team: 'defense', x: 70, y: 48, color: PLAYER_COLORS.S2, customName: 'Strong Safety' },
    ],
    routes: [
      { id: 'rd_c2_rush', playerId: 'd_c2_rush', actionType: 'rush', color: PLAYER_COLORS.RUSH, points: [{ x: 50, y: 64 }, { x: 50, y: 92 }] },
      { id: 'rd_c2_cb1', playerId: 'd_c2_cb1', actionType: 'run', color: PLAYER_COLORS.CB1, points: [{ x: 18, y: 72 }, { x: 16, y: 60 }] },
      { id: 'rd_c2_cb2', playerId: 'd_c2_cb2', actionType: 'run', color: PLAYER_COLORS.CB2, points: [{ x: 82, y: 72 }, { x: 84, y: 60 }] },
      { id: 'rd_c2_s1', playerId: 'd_c2_s1', actionType: 'run', color: PLAYER_COLORS.S1, points: [{ x: 30, y: 48 }, { x: 28, y: 28 }] },
      { id: 'rd_c2_s2', playerId: 'd_c2_s2', actionType: 'run', color: PLAYER_COLORS.S2, points: [{ x: 70, y: 48 }, { x: 72, y: 28 }] },
    ],
    zones: [
      { id: 'z_c2_s1', playerId: 'd_c2_s1', name: 'Deep Half Izq', cx: 28, cy: 30, rx: 22, ry: 14, shape: 'rectangle', color: PLAYER_COLORS.S1 },
      { id: 'z_c2_s2', playerId: 'd_c2_s2', name: 'Deep Half Der', cx: 72, cy: 30, rx: 22, ry: 14, shape: 'rectangle', color: PLAYER_COLORS.S2 },
      { id: 'z_c2_cb1', playerId: 'd_c2_cb1', name: 'Flat Izq (Under)', cx: 20, cy: 60, rx: 16, ry: 9, shape: 'rectangle', color: PLAYER_COLORS.CB1 },
      { id: 'z_c2_cb2', playerId: 'd_c2_cb2', name: 'Flat Der (Under)', cx: 80, cy: 60, rx: 16, ry: 9, shape: 'rectangle', color: PLAYER_COLORS.CB2 },
    ]
  },
  {
    id: 'play_def_cover3_zone',
    name: 'Cover 3 Zona (3 Tercios Profundos)',
    category: 'Defensiva',
    formationName: 'Defensa 3 Tercios (Cover 3)',
    defenseScheme: 'cover3',
    tags: ['Cover 3', 'Zona 3 Tercios', 'Hook LB', 'Anti-Mesh'],
    description: '3 defensivos cubren el fondo en tercios y 1 Linebacker flota en el centro corto tapando cruces y slants.',
    losY: 78,
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000,
    isFavorite: false,
    players: [
      { id: 'd_c3_rush', role: 'RUSH', label: 'R', jerseyNumber: '99', team: 'defense', x: 50, y: 64, color: PLAYER_COLORS.RUSH, customName: 'Rusher' },
      { id: 'd_c3_cb1', role: 'CB1', label: 'CB1', jerseyNumber: '25', team: 'defense', x: 18, y: 72, color: PLAYER_COLORS.CB1, customName: 'Cornerback Izq' },
      { id: 'd_c3_lb', role: 'LB', label: 'LB', jerseyNumber: '54', team: 'defense', x: 50, y: 70, color: PLAYER_COLORS.LB, customName: 'Linebacker Hook' },
      { id: 'd_c3_cb2', role: 'CB2', label: 'CB2', jerseyNumber: '26', team: 'defense', x: 82, y: 72, color: PLAYER_COLORS.CB2, customName: 'Cornerback Der' },
      { id: 'd_c3_s1', role: 'S1', label: 'FS', jerseyNumber: '33', team: 'defense', x: 50, y: 44, color: PLAYER_COLORS.S1, customName: 'Free Safety' },
    ],
    routes: [
      { id: 'rd_c3_rush', playerId: 'd_c3_rush', actionType: 'rush', color: PLAYER_COLORS.RUSH, points: [{ x: 50, y: 64 }, { x: 50, y: 92 }] },
      { id: 'rd_c3_cb1', playerId: 'd_c3_cb1', actionType: 'run', color: PLAYER_COLORS.CB1, points: [{ x: 18, y: 72 }, { x: 16, y: 28 }] },
      { id: 'rd_c3_lb', playerId: 'd_c3_lb', actionType: 'run', color: PLAYER_COLORS.LB, points: [{ x: 50, y: 70 }, { x: 50, y: 58 }] },
      { id: 'rd_c3_cb2', playerId: 'd_c3_cb2', actionType: 'run', color: PLAYER_COLORS.CB2, points: [{ x: 82, y: 72 }, { x: 84, y: 28 }] },
      { id: 'rd_c3_s1', playerId: 'd_c3_s1', actionType: 'run', color: PLAYER_COLORS.S1, points: [{ x: 50, y: 44 }, { x: 50, y: 26 }] },
    ],
    zones: [
      { id: 'z_c3_cb1', playerId: 'd_c3_cb1', name: 'Deep 1/3 Izq', cx: 18, cy: 30, rx: 16, ry: 15, shape: 'rectangle', color: PLAYER_COLORS.CB1 },
      { id: 'z_c3_s1', playerId: 'd_c3_s1', name: 'Deep 1/3 Centro', cx: 50, cy: 26, rx: 18, ry: 15, shape: 'circle', color: PLAYER_COLORS.S1 },
      { id: 'z_c3_cb2', playerId: 'd_c3_cb2', name: 'Deep 1/3 Der', cx: 82, cy: 30, rx: 16, ry: 15, shape: 'rectangle', color: PLAYER_COLORS.CB2 },
      { id: 'z_c3_lb', playerId: 'd_c3_lb', name: 'Hook / Centro Corto', cx: 50, cy: 58, rx: 20, ry: 10, shape: 'triangle', color: PLAYER_COLORS.LB },
    ]
  },
  {
    id: 'play_def_cover4_zone',
    name: 'Cover 4 Quarters (Zona Roja)',
    category: 'Defensiva',
    formationName: 'Defensa Quarters (Cover 4)',
    defenseScheme: 'cover4',
    tags: ['Cover 4', 'Quarters', 'Zona Roja', 'Anti-Profundo'],
    description: '4 defensores cubren cuadrantes de 25% del fondo. Máxima protección contra pases profundos y zona de gol.',
    losY: 78,
    createdAt: Date.now() - 50000,
    updatedAt: Date.now() - 50000,
    isFavorite: false,
    players: [
      { id: 'd_c4_rush', role: 'RUSH', label: 'R', jerseyNumber: '99', team: 'defense', x: 50, y: 64, color: PLAYER_COLORS.RUSH, customName: 'Rusher' },
      { id: 'd_c4_cb1', role: 'CB1', label: 'CB1', jerseyNumber: '25', team: 'defense', x: 15, y: 68, color: PLAYER_COLORS.CB1, customName: 'CB1' },
      { id: 'd_c4_s1', role: 'S1', label: 'FS', jerseyNumber: '33', team: 'defense', x: 38, y: 50, color: PLAYER_COLORS.S1, customName: 'Free Safety' },
      { id: 'd_c4_s2', role: 'S2', label: 'SS', jerseyNumber: '34', team: 'defense', x: 62, y: 50, color: PLAYER_COLORS.S2, customName: 'Strong Safety' },
      { id: 'd_c4_cb2', role: 'CB2', label: 'CB2', jerseyNumber: '26', team: 'defense', x: 85, y: 68, color: PLAYER_COLORS.CB2, customName: 'CB2' },
    ],
    routes: [
      { id: 'rd_c4_rush', playerId: 'd_c4_rush', actionType: 'rush', color: PLAYER_COLORS.RUSH, points: [{ x: 50, y: 64 }, { x: 50, y: 92 }] },
      { id: 'rd_c4_cb1', playerId: 'd_c4_cb1', actionType: 'run', color: PLAYER_COLORS.CB1, points: [{ x: 15, y: 68 }, { x: 14, y: 26 }] },
      { id: 'rd_c4_s1', playerId: 'd_c4_s1', actionType: 'run', color: PLAYER_COLORS.S1, points: [{ x: 38, y: 50 }, { x: 36, y: 24 }] },
      { id: 'rd_c4_s2', playerId: 'd_c4_s2', actionType: 'run', color: PLAYER_COLORS.S2, points: [{ x: 62, y: 50 }, { x: 64, y: 24 }] },
      { id: 'rd_c4_cb2', playerId: 'd_c4_cb2', actionType: 'run', color: PLAYER_COLORS.CB2, points: [{ x: 85, y: 68 }, { x: 86, y: 26 }] },
    ],
    zones: [
      { id: 'z_c4_cb1', playerId: 'd_c4_cb1', name: 'Quarter 1/4 Izq', cx: 14, cy: 26, rx: 12, ry: 14, shape: 'rectangle', color: PLAYER_COLORS.CB1 },
      { id: 'z_c4_s1', playerId: 'd_c4_s1', name: 'Quarter 1/4 Centro-Izq', cx: 38, cy: 24, rx: 12, ry: 14, shape: 'rectangle', color: PLAYER_COLORS.S1 },
      { id: 'z_c4_s2', playerId: 'd_c4_s2', name: 'Quarter 1/4 Centro-Der', cx: 62, cy: 24, rx: 12, ry: 14, shape: 'rectangle', color: PLAYER_COLORS.S2 },
      { id: 'z_c4_cb2', playerId: 'd_c4_cb2', name: 'Quarter 1/4 Der', cx: 86, cy: 26, rx: 12, ry: 14, shape: 'rectangle', color: PLAYER_COLORS.CB2 },
    ]
  }
];
