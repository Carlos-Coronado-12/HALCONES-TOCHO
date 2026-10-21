import { describe, it, expect } from 'vitest';
import { generateConceptRoutes, PASS_CONCEPTS, ConceptId } from '../src/utils/concepts';
import { Player } from '../src/types/playbook';
import { PLAYER_COLORS } from '../src/constants/presets';

describe('Tactical Concepts Route Generator (Smash, Mesh, Flood, etc.)', () => {
  const offensivePlayers: Player[] = [
    { id: 'p_qb', role: 'QB', label: 'QB', jerseyNumber: '7', team: 'offense', x: 50, y: 92, color: PLAYER_COLORS.QB },
    { id: 'p_c', role: 'C', label: 'C', jerseyNumber: '50', team: 'offense', x: 50, y: 78, color: PLAYER_COLORS.C },
    { id: 'p_x', role: 'WR1', label: 'X', jerseyNumber: '11', team: 'offense', x: 15, y: 78, color: PLAYER_COLORS.X },
    { id: 'p_h', role: 'WR2', label: 'H', jerseyNumber: '24', team: 'offense', x: 30, y: 79, color: PLAYER_COLORS.H },
    { id: 'p_z', role: 'WR3', label: 'Z', jerseyNumber: '88', team: 'offense', x: 85, y: 78, color: PLAYER_COLORS.Z },
  ];

  it('debe contener definiciones válidas para todos los conceptos tácticos predefinidos', () => {
    expect(PASS_CONCEPTS.length).toBeGreaterThanOrEqual(5);
    PASS_CONCEPTS.forEach((concept) => {
      expect(concept.id).toBeDefined();
      expect(concept.name).toBeDefined();
      expect(concept.beats).toBeDefined();
      expect(concept.description).toBeDefined();
      expect(concept.outside.length).toBeGreaterThan(0);
      expect(concept.slot.length).toBeGreaterThan(0);
    });
  });

  const conceptKeys: ConceptId[] = ['smash', 'flood', 'drive', 'dagger', 'stick', 'mesh', 'wheel_flat'];

  conceptKeys.forEach((conceptId) => {
    it(`debe generar rutas tácticas válidas para el concepto: ${conceptId}`, () => {
      const generatedRoutes = generateConceptRoutes(offensivePlayers, conceptId, 'right');
      expect(generatedRoutes.length).toBeGreaterThan(0);

      generatedRoutes.forEach((route) => {
        expect(route.playerId).toBeDefined();
        expect(route.points.length).toBeGreaterThanOrEqual(2);
        
        // Cada punto debe estar dentro de los límites del campo (0-100)
        route.points.forEach((pt) => {
          expect(pt.x).toBeGreaterThanOrEqual(0);
          expect(pt.x).toBeLessThanOrEqual(100);
          expect(pt.y).toBeGreaterThanOrEqual(0);
          expect(pt.y).toBeLessThanOrEqual(140);
        });
      });
    });
  });
});
