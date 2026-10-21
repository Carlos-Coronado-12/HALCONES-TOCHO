import { describe, it, expect } from 'vitest';
import { computeFlagPullEvent } from '../src/utils/flagPull';
import { Play } from '../src/types/playbook';
import { PLAYER_COLORS } from '../src/constants/presets';

describe('Flag-Pull Physics & Simulation Engine', () => {
  const mockPlay: Play = {
    id: 'test_play',
    name: 'Test Quick Out',
    category: 'Ofensiva',
    formationName: 'Spread 2x2',
    losY: 78,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    players: [
      { id: 'qb', role: 'QB', label: 'QB', jerseyNumber: '7', team: 'offense', x: 50, y: 92, color: PLAYER_COLORS.QB },
      { id: 'c', role: 'C', label: 'C', jerseyNumber: '50', team: 'offense', x: 50, y: 78, color: PLAYER_COLORS.C },
      { id: 'wr1', role: 'WR1', label: 'X', jerseyNumber: '11', team: 'offense', x: 15, y: 78, color: PLAYER_COLORS.X },
      { id: 'cb1', role: 'CB1', label: 'CB1', jerseyNumber: '25', team: 'defense', x: 15, y: 68, color: PLAYER_COLORS.CB1 },
    ],
    routes: [
      {
        id: 'r_qb',
        playerId: 'qb',
        actionType: 'run',
        color: PLAYER_COLORS.QB,
        points: [{ x: 50, y: 92 }, { x: 50, y: 94 }],
      },
      {
        id: 'r_wr1',
        playerId: 'wr1',
        actionType: 'run',
        color: PLAYER_COLORS.X,
        points: [{ x: 15, y: 78 }, { x: 15, y: 65 }, { x: 5, y: 65 }],
      },
      {
        id: 'r_cb1',
        playerId: 'cb1',
        actionType: 'run',
        color: PLAYER_COLORS.CB1,
        points: [{ x: 15, y: 68 }, { x: 15, y: 65 }],
      },
    ],
    ballPass: {
      fromPlayerId: 'qb',
      toPlayerId: 'wr1',
      targetPoint: { x: 15, y: 65 },
      releaseProgress: 0.3,
      catchProgress: 0.6,
    },
  };

  it('debe calcular el evento de jale de bandera cuando el defensivo converge sobre el receptor', () => {
    const event = computeFlagPullEvent({
      effectivePlayers: mockPlay.players,
      effectiveRoutes: mockPlay.routes,
      losY: mockPlay.losY,
      targetReceiverId: 'wr1',
      defenseScheme: 'cover1',
    });

    expect(event).toBeDefined();
    expect(event).toHaveProperty('occurred');
    expect(event).toHaveProperty('isSack');
    expect(event).toHaveProperty('isTouchdown');
    expect(event).toHaveProperty('location');
    expect(event.location).toHaveProperty('x');
    expect(event.location).toHaveProperty('y');
  });

  it('debe registrar ganancia de yardas respecto a la línea de golpeo (LOS)', () => {
    const event = computeFlagPullEvent({
      effectivePlayers: mockPlay.players,
      effectiveRoutes: mockPlay.routes,
      losY: mockPlay.losY,
      targetReceiverId: 'wr1',
      defenseScheme: 'cover1',
    });

    expect(typeof event.yardsGained).toBe('number');
    expect(typeof event.yardLine).toBe('number');
  });

  it('debe registrar intento de Touchdown si el receptor corre hacia la zona de anotación sin ser alcanzado', () => {
    // Receptor veloz hacia TD y defensivo lejos en la otra banda
    const touchdownPlayPlayers = [
      { id: 'qb', role: 'QB' as const, label: 'QB', jerseyNumber: '7', team: 'offense' as const, x: 50, y: 92, color: PLAYER_COLORS.QB },
      { id: 'wr1', role: 'WR1' as const, label: 'X', jerseyNumber: '11', team: 'offense' as const, x: 15, y: 78, color: PLAYER_COLORS.X },
      { id: 'cb1', role: 'CB1' as const, label: 'CB1', jerseyNumber: '25', team: 'defense' as const, x: 90, y: 70, color: PLAYER_COLORS.CB1 },
    ];
    const touchdownRoutes = [
      {
        id: 'r_qb',
        playerId: 'qb',
        actionType: 'run' as const,
        color: PLAYER_COLORS.QB,
        points: [{ x: 50, y: 92 }, { x: 50, y: 94 }],
      },
      {
        id: 'r_wr1',
        playerId: 'wr1',
        actionType: 'run' as const,
        color: PLAYER_COLORS.X,
        points: [{ x: 15, y: 78 }, { x: 15, y: 15 }], // Cruza la línea de gol (y < 18)
      },
      {
        id: 'r_cb1',
        playerId: 'cb1',
        actionType: 'run' as const,
        color: PLAYER_COLORS.CB1,
        points: [{ x: 90, y: 70 }, { x: 90, y: 65 }],
      },
    ];

    const event = computeFlagPullEvent({
      effectivePlayers: touchdownPlayPlayers,
      effectiveRoutes: touchdownRoutes,
      losY: 78,
      targetReceiverId: 'wr1',
      defenseScheme: 'cover2',
    });

    expect(event.isTouchdown).toBe(true);
    expect(event.occurred).toBe(true);
  });
});
