import { describe, it, expect, beforeEach } from 'vitest';
import { 
  savePlay, 
  deletePlayById, 
  duplicatePlay, 
  exportPlaysByCategory,
  importPlaybookFromJson 
} from '../src/utils/storage';
import { Play } from '../src/types/playbook';

// Setup browser globals for Node test environment
if (typeof localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

if (typeof document === 'undefined') {
  (global as any).document = {
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
    createElement: () => ({
      setAttribute: () => {},
      click: () => {},
      remove: () => {},
    }),
  };
}

describe('Storage & Play Management Logic (CRUD & Export)', () => {
  const initialPlays: Play[] = [
    {
      id: 'play_1',
      name: 'Slant In',
      category: 'Ofensiva',
      formationName: 'Spread',
      losY: 78,
      createdAt: 1000,
      updatedAt: 1000,
      players: [],
      routes: [],
    },
    {
      id: 'play_2',
      name: 'Cover 2 Zone',
      category: 'Defensiva',
      formationName: '2-3',
      losY: 78,
      createdAt: 1000,
      updatedAt: 1000,
      players: [],
      routes: [],
    },
  ];

  it('debe agregar una nueva jugada al inicio de la lista', () => {
    const newPlay: Play = {
      id: 'play_3',
      name: 'Post Corner',
      category: 'Ofensiva',
      formationName: 'Trips',
      losY: 78,
      createdAt: 2000,
      updatedAt: 2000,
      players: [],
      routes: [],
    };

    const updated = savePlay(newPlay, initialPlays);
    expect(updated.length).toBe(3);
    expect(updated[0].id).toBe('play_3');
  });

  it('debe actualizar una jugada existente sin duplicarla', () => {
    const updatedPlay: Play = {
      ...initialPlays[0],
      name: 'Slant In Modificado',
    };

    const updated = savePlay(updatedPlay, initialPlays);
    expect(updated.length).toBe(2);
    expect(updated[0].name).toBe('Slant In Modificado');
  });

  it('debe eliminar una jugada por su ID', () => {
    const updated = deletePlayById('play_1', initialPlays);
    expect(updated.length).toBe(1);
    expect(updated.find((p) => p.id === 'play_1')).toBeUndefined();
  });

  it('debe duplicar una jugada asignando nuevo ID y sufijo de copia', () => {
    const result = duplicatePlay(initialPlays[0], initialPlays);
    expect(result.newPlay.id).not.toBe(initialPlays[0].id);
    expect(result.newPlay.name).toContain('(Copia)');
    expect(result.updatedList.length).toBe(3);
  });

  it('debe ejecutar exportPlaysByCategory sin errores', () => {
    expect(() => exportPlaysByCategory(initialPlays, 'Ofensiva')).not.toThrow();
    expect(() => exportPlaysByCategory(initialPlays, 'Defensiva')).not.toThrow();
  });

  it('debe importar jugadas desde un string JSON válido', () => {
    const jsonToImport = JSON.stringify([
      {
        id: 'play_imported',
        name: 'Mesh Cross',
        category: 'Ofensiva',
        formationName: 'Spread',
        losY: 78,
        createdAt: 3000,
        updatedAt: 3000,
        players: [],
        routes: [],
      },
    ]);

    const imported = importPlaybookFromJson(jsonToImport, initialPlays);
    expect(imported.length).toBe(3);
    expect(imported.find((p) => p.id === 'play_imported')).toBeDefined();
  });
});
