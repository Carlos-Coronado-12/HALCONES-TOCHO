import { PlayerRole } from './playbook';

export type StudyCategory = 
  | 'ifaf_rules'         // Reglamento oficial IFAF 5v5 Flag Football
  | 'route_tree'          // Árbol de rutas 1-9 y conceptos
  | 'coverage_defense'    // Coberturas defensivas y lecturas
  | 'playbook_halcones';  // Preguntas sobre el playbook del equipo

export type QuestionDifficulty = 'basico' | 'intermedio' | 'avanzado';

export interface QuizQuestion {
  id: string;
  category: StudyCategory;
  difficulty: QuestionDifficulty;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  ruleRef?: string;       // Referencia a regla IFAF o técnica
  diagramType?: 'route' | 'field' | 'coverage';
  routePoints?: { x: number; y: number }[]; // Puntos para el diagrama SVG de la ruta
  routeNumber?: number;
}

export interface RouteDefinition {
  number: number;
  name: string;
  alias?: string;
  type: 'in' | 'out' | 'vertical' | 'stop' | 'special';
  depthYards: string;
  description: string;
  keyCoachingPoint: string;
  pathPoints: { x: number; y: number }[]; // Canvas percentage coordinates for demo
}

export interface CoverageConcept {
  id: string;
  name: string;
  type: 'zone' | 'man';
  safetiesCount: number;
  description: string;
  strengths: string[];
  weaknesses: string[];
  bestBeaters: string[];  // Rutas o conceptos ideales para atacarla
}

export interface PlaybookStudyChallenge {
  playId: string;
  playName: string;
  formationName: string;
  role: PlayerRole;
  playerLabel: string;
  questionType: 'identify_route' | 'read_progression' | 'defense_responsibility' | 'hot_read';
  prompt: string;
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
}

export interface UserStudyStats {
  totalAnswered: number;
  correctAnswers: number;
  currentStreak: number;
  bestStreak: number;
  categoryScores: Record<StudyCategory, { answered: number; correct: number }>;
  completedPlaybookTests: number;
  lastStudyDate?: string;
}
