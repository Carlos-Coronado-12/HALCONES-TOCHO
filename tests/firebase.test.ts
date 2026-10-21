import { describe, it, expect } from 'vitest';
import { isFirebaseConfigured, db } from '../src/services/firebase';
import { DEFAULT_TEAM_ID } from '../src/services/cloudPlaybook';

describe('Firebase Cloud Infrastructure', () => {
  it('debe confirmar que Firebase está configurado con las credenciales de Halcones', () => {
    const configured = isFirebaseConfigured();
    expect(configured).toBe(true);
  });

  it('debe tener una instancia inicializada de Firestore db', () => {
    expect(db).toBeDefined();
    expect(db).not.toBeNull();
  });

  it('debe utilizar DEFAULT_TEAM_ID para el equipo Halcones Tocho', () => {
    expect(DEFAULT_TEAM_ID).toBe('halcones_tocho');
  });
});
