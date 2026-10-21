import { describe, it, expect } from 'vitest';
import { mirrorPlay } from '../src/utils/playTransforms';
import { Play } from '../src/types/playbook';
import { PLAYER_COLORS } from '../src/constants/presets';

describe('Play Transformations - Mirroring (Espejo Táctico)', () => {
  const originalPlay: Play = {
    id: 'play_right_flood',
    name: 'Flood Right',
    category: 'Ofensiva',
    formationName: 'Trips Derecho',
    losY: 78,
    createdAt: 1000,
    updatedAt: 1000,
    players: [
      { id: 'qb', role: 'QB', label: 'QB', jerseyNumber: '7', team: 'offense', x: 50, y: 92, color: PLAYER_COLORS.QB },
      { id: 'wr_x', role: 'WR1', label: 'X', jerseyNumber: '11', team: 'offense', x: 15, y: 78, color: PLAYER_COLORS.X },
      { id: 'wr_z', role: 'WR3', label: 'Z', jerseyNumber: '88', team: 'offense', x: 85, y: 78, color: PLAYER_COLORS.Z },
    ],
    routes: [
      {
        id: 'r_x',
        playerId: 'wr_x',
        actionType: 'run',
        color: PLAYER_COLORS.X,
        points: [{ x: 15, y: 78 }, { x: 15, y: 65 }, { x: 40, y: 65 }],
      },
      {
        id: 'r_z',
        playerId: 'wr_z',
        actionType: 'run',
        color: PLAYER_COLORS.Z,
        points: [{ x: 85, y: 78 }, { x: 85, y: 40 }, { x: 95, y: 35 }],
      },
    ],
    ballPass: {
      fromPlayerId: 'qb',
      toPlayerId: 'wr_z',
      targetPoint: { x: 95, y: 35 },
      releaseProgress: 0.5,
      catchProgress: 0.8,
    },
  };

  it('debe invertir simétricamente todas las coordenadas X respecto al centro del campo (100 - x)', () => {
    const mirrored = mirrorPlay(originalPlay);

    // QB estaba en 50 -> debe permanecer en 50 (100 - 50 = 50)
    const qb = mirrored.players.find((p) => p.id === 'qb');
    expect(qb?.x).toBe(50);

    // WR X estaba en 15 -> debe pasar a 85 (100 - 15 = 85)
    const wrX = mirrored.players.find((p) => p.id === 'wr_x');
    expect(wrX?.x).toBe(85);

    // WR Z estaba en 85 -> debe pasar a 15 (100 - 85 = 15)
    const wrZ = mirrored.players.find((p) => p.id === 'wr_z');
    expect(wrZ?.x).toBe(15);
  });

  it('debe invertir simétricamente los puntos de las rutas sin alterar la profundidad Y', () => {
    const mirrored = mirrorPlay(originalPlay);

    const rZ = mirrored.routes.find((r) => r.playerId === 'wr_z');
    expect(rZ).toBeDefined();
    // Punto final original: { x: 95, y: 35 } -> Espejo: { x: 5, y: 35 }
    expect(rZ?.points[2].x).toBe(5);
    expect(rZ?.points[2].y).toBe(35);
  });

  it('debe invertir simétricamente el punto destino del pase (targetPoint)', () => {
    const mirrored = mirrorPlay(originalPlay);
    // targetPoint original: { x: 95, y: 35 } -> Espejo: { x: 5, y: 35 }
    expect(mirrored.ballPass?.targetPoint.x).toBe(5);
    expect(mirrored.ballPass?.targetPoint.y).toBe(35);
    expect(mirrored.updatedAt).toBeGreaterThan(0);
  });
});
