export type TeamSide = 'offense' | 'defense';
export type AppSectionView = 'home' | 'designer' | 'library' | 'academy';

export type PlayerRole = 
  | 'QB' 
  | 'C' 
  | 'WR1' 
  | 'WR2' 
  | 'WR3' 
  | 'RB' 
  | 'RUSH' 
  | 'CB1' 
  | 'CB2' 
  | 'S1' 
  | 'S2' 
  | 'LB' 
  | 'CUSTOM';

export type ActionType = 
  | 'run'      // Primary route (Cyan/Blue solid with arrow)
  | 'pass'     // Ball trajectory (Purple dashed)
  | 'motion'   // Pre-snap motion (Emerald dotted)
  | 'block'    // Screen / Block (Amber T-bar)
  | 'rush'     // Blitz path (Red bolt/arrow)
  | 'zone';    // Zone area coverage (Translucent fill)

export interface Point {
  x: number; // 0 - 100 percentage of field width
  y: number; // 0 - 100 percentage of field height
  action?: 'start' | 'cut' | 'passTarget' | 'catch' | 'block' | 'end' | 'pause' | 'stop_and_go';
  pauseDuration?: number; // seconds to wait/pause at this point (e.g. 0.4s - 2.0s)
}

export interface Route {
  id: string;
  playerId: string;
  actionType: ActionType;
  points: Point[];
  color?: string;
  notes?: string;
  passTargetPointIndex?: number; // Point index where ball is thrown/caught
}

export interface Player {
  id: string;
  role: PlayerRole;
  label: string;
  jerseyNumber?: string;
  team: TeamSide;
  x: number; // Initial position (0 - 100)
  y: number; // Initial position (0 - 100)
  color?: string;
  customName?: string;
  speedRating?: number;          // 70 - 99 (default 88)
  readProgression?: 1 | 2 | 3;   // 1st Read, 2nd Read, Checkdown/3rd
  hasMotion?: boolean;           // Pre-snap motion
  motionTargetX?: number;        // Target X coordinate for pre-snap motion
  delaySec?: number;             // Pre-route delay / wait time at snap in seconds (0.0 - 2.5s)
}

export type PlayCategory = 'Ofensiva' | 'Defensiva' | 'Especiales';

export type PlayTag = 
  | 'Zona Roja' 
  | '3ra & Largo' 
  | 'Pase Rápido' 
  | 'Pase Profundo' 
  | 'RPO / Corrida' 
  | 'Trick Play' 
  | 'Anti-Blitz' 
  | 'Cover 2' 
  | 'Cover 1' 
  | 'Cover 0 (Blitz)' 
  | 'Extra Point (1pt)' 
  | 'Extra Point (2pts)'
  | '5v5'
  | '7v7';

export interface BallPassEvent {
  fromPlayerId: string;
  toPlayerId: string;
  targetPoint: Point;
  releaseProgress: number; // 0.0 - 1.0
  catchProgress: number;   // 0.0 - 1.0
}

export type ZoneShape = 'rectangle' | 'circle' | 'triangle';

export interface ZoneCoverage {
  id: string;
  playerId: string;
  name: string;      // ej: 'Deep Half', 'Flat', 'Hook/Curl', 'Deep 1/3', 'Quarter 1/4'
  shape?: ZoneShape; // 'rectangle' | 'circle' | 'triangle' (default 'rectangle')
  cx: number;        // Center X (0 - 100)
  cy: number;        // Center Y (0 - 140)
  rx: number;        // Half width / Radius X
  ry: number;        // Half height / Radius Y
  color?: string;    // Custom color
}

export interface Play {
  id: string;
  name: string;
  category: PlayCategory;
  formationName: string;
  tags: string[];
  description: string;
  losY: number;            // Line of Scrimmage Y (percentage, default ~65%)
  players: Player[];
  routes: Route[];
  zones?: ZoneCoverage[];
  defenseScheme?: DefenseScheme;
  ballPass?: BallPassEvent;
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
  defenseName?: string;
  offenseName?: string;
  defenseFormationName?: string;
}

export type ToolMode = 
  | 'select'        // Move players & select
  | 'draw'          // Draw route directly from any player
  | 'draw_zone'     // Draw/Assign defensive zone coverage
  | 'erase_route';  // Click to erase specific route

export type FieldViewMode = 'offense' | 'defense' | 'matchup';
export type DefenseScheme = 'cover2' | 'cover3' | 'cover4' | 'cover1' | 'blitz';

export interface ReceiverAnalytics {
  playerId: string;
  separationYards: number;
  status: 'open' | 'contested' | 'covered';
  nearestDefenderId: string | null;
  nearestDefenderDist: number;
}

export interface NextGenAnalytics {
  timeToThrowSec: number;
  timeToPressureSec: number;
  pressureMarginSec: number;
  pressureStatus: 'safe' | 'pressure' | 'sack';
  isLaneObstructed: boolean;
  obstructingDefenderName: string | null;
  targetSeparationYards: number | null;
  targetSeparationStatus: 'open' | 'contested' | 'covered' | null;
  expectedYacYards: number;
  receiversAnalytics: Map<string, ReceiverAnalytics>;
}

export interface FlagPullEvent {
  occurred: boolean;               // True if flag was pulled or sack occurred
  isSack: boolean;                 // QB tackled before pass
  isTouchdown: boolean;            // Scored before flag pull
  progress: number;                // 0.0 - 1.0 (simulation progress)
  timeSec: number;                 // e.g. 1.85s
  yardLine: number;                // e.g. 22 (yard line)
  yardsGained: number;             // e.g. +8.0 yds relative to LOS
  carrierId: string;
  carrierLabel: string;            // e.g. 'X' or 'QB'
  carrierName: string;             // e.g. 'WR1 Izquierdo'
  tacklerId?: string;
  tacklerLabel?: string;           // e.g. 'CB1' or 'R'
  tacklerName?: string;            // e.g. 'Cornerback Izq'
  location: { x: number; y: number };
  closestDefenderDistYards: number;
  passReleaseTimeSec?: number;     // Dynamic opportune moment when QB released the pass
  passCatchTimeSec?: number;       // Exact time when pass is caught
}

export interface PlaybackState {
  isPlaying: boolean;
  progress: number; // 0.0 to 1.0
  speed: number;    // 0.5, 1.0, 1.5, 2.0
  loop: boolean;
  stopAtFlagPull?: boolean; // When true, halts simulation automatically when flag is pulled
}

