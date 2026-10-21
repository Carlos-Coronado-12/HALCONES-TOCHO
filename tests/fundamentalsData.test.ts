import { describe, it, expect } from 'vitest';
import { 
  IFAF_QUIZ_QUESTIONS, 
  OFFICIAL_ROUTE_TREE, 
  DEFENSIVE_COVERAGES_GUIDE 
} from '../src/constants/fundamentalsData';

describe('Banco Oficial de Preguntas y Fundamentos (IFAF & Route Tree)', () => {
  it('debe tener al menos 20 preguntas en el banco de estudio', () => {
    expect(IFAF_QUIZ_QUESTIONS.length).toBeGreaterThanOrEqual(20);
  });

  it('cada pregunta debe ser válida, con 4 opciones y un correctIndex válido', () => {
    IFAF_QUIZ_QUESTIONS.forEach((q, idx) => {
      expect(q.id, `Pregunta [${idx}] debe tener id`).toBeTruthy();
      expect(q.question, `Pregunta [${q.id}] debe tener texto`).toBeTruthy();
      expect(q.options.length, `Pregunta [${q.id}] debe tener exactamente 4 opciones`).toBe(4);
      expect(q.correctIndex, `Pregunta [${q.id}] correctIndex debe estar entre 0 y 3`).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex, `Pregunta [${q.id}] correctIndex debe estar entre 0 y 3`).toBeLessThanOrEqual(3);
      expect(q.explanation, `Pregunta [${q.id}] debe tener explicación`).toBeTruthy();
    });
  });

  it('las preguntas con diagrama visual deben tener coordenadas dentro del campo (0-100) y sin solapamiento destructivo', () => {
    const routeQuestions = IFAF_QUIZ_QUESTIONS.filter((q) => q.routePoints && q.routePoints.length > 0);
    expect(routeQuestions.length).toBeGreaterThanOrEqual(8);

    routeQuestions.forEach((q) => {
      const pts = q.routePoints!;
      expect(pts.length, `Diagrama de [${q.id}] debe tener al menos 2 puntos`).toBeGreaterThanOrEqual(2);

      pts.forEach((pt) => {
        expect(pt.x).toBeGreaterThanOrEqual(0);
        expect(pt.x).toBeLessThanOrEqual(100);
        expect(pt.y).toBeGreaterThanOrEqual(0);
        expect(pt.y).toBeLessThanOrEqual(100);
      });

      // Validar que en rutas de regreso (Curl / Comeback) el punto final no esté encimado en el tallo con dx < 3
      if (q.id === 'route_diag_curl_4') {
        const pStem = pts[1];
        const pEnd = pts[pts.length - 1];
        const deltaX = Math.abs(pEnd.x - pStem.x);
        expect(deltaX, 'Curl debe tener separación lateral para ser visible y no cortarse').toBeGreaterThanOrEqual(8);
      }
    });
  });

  it('el Árbol de Rutas Oficial (1-9) debe cumplir la regla de oro: Pares adentro, Impares afuera', () => {
    const routes1to9 = OFFICIAL_ROUTE_TREE.filter((r) => r.number >= 1 && r.number <= 9);
    expect(routes1to9.length).toBe(9);

    routes1to9.forEach((r) => {
      if (r.number % 2 === 0) {
        expect(r.type, `Ruta par #${r.number} (${r.name}) debe romper hacia adentro o detenerse`).toMatch(/in|stop/);
      } else {
        expect(r.type, `Ruta impar #${r.number} (${r.name}) debe romper hacia afuera o vertical`).toMatch(/out|vertical/);
      }
    });
  });

  it('la guía de coberturas defensivas debe tener coberturas clave definidas', () => {
    expect(DEFENSIVE_COVERAGES_GUIDE.length).toBeGreaterThanOrEqual(4);
    const cover2 = DEFENSIVE_COVERAGES_GUIDE.find((c) => c.id === 'cover2');
    expect(cover2).toBeDefined();
    expect(cover2?.safetiesCount).toBe(2);
    expect(cover2?.bestBeaters.length).toBeGreaterThan(0);
  });
});
