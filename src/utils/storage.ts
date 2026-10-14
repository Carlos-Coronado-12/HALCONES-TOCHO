import { Play } from '../types/playbook';
import { INITIAL_DEFAULT_PLAYS } from '../constants/presets';

const STORAGE_KEY = 'halcones_tocho_playbook_v3_y30';

export function loadSavedPlays(): Play[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize with Madden default plays
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_PLAYS));
      return INITIAL_DEFAULT_PLAYS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_DEFAULT_PLAYS;
  } catch (err) {
    console.error('Error loading plays from localStorage:', err);
    return INITIAL_DEFAULT_PLAYS;
  }
}

export function saveAllPlays(plays: Play[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plays));
  } catch (err) {
    console.error('Error saving plays to localStorage:', err);
  }
}

export function savePlay(play: Play, allPlays: Play[]): Play[] {
  const existingIdx = allPlays.findIndex((p) => p.id === play.id);
  let updatedPlays: Play[];

  const updatedPlay = {
    ...play,
    updatedAt: Date.now(),
  };

  if (existingIdx >= 0) {
    updatedPlays = [...allPlays];
    updatedPlays[existingIdx] = updatedPlay;
  } else {
    updatedPlays = [updatedPlay, ...allPlays];
  }

  saveAllPlays(updatedPlays);
  return updatedPlays;
}

export function deletePlayById(id: string, allPlays: Play[]): Play[] {
  const updatedPlays = allPlays.filter((p) => p.id !== id);
  saveAllPlays(updatedPlays);
  return updatedPlays;
}

export function duplicatePlay(play: Play, allPlays: Play[]): { newPlay: Play; updatedList: Play[] } {
  const newPlay: Play = {
    ...play,
    id: `play_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: `${play.name} (Copia)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const updatedList = [newPlay, ...allPlays];
  saveAllPlays(updatedList);
  return { newPlay, updatedList };
}

export function exportPlaybookToJson(plays: Play[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plays, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `Halcones_Playbook_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportPlaysByCategory(plays: Play[], category: 'Ofensiva' | 'Defensiva'): void {
  const filtered = plays.filter((p) => p.category === category);
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filtered, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const slug = category === 'Ofensiva' ? 'Ofensivas' : 'Defensivas';
  downloadAnchor.setAttribute('download', `Halcones_${slug}_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importPlaybookFromJson(jsonString: string, currentPlays: Play[]): Play[] {
  try {
    const imported = JSON.parse(jsonString);
    if (!Array.isArray(imported)) {
      throw new Error('Formato de archivo inválido. Debe ser una lista de jugadas.');
    }
    
    // Merge or replace
    const playMap = new Map<string, Play>();
    currentPlays.forEach((p) => playMap.set(p.id, p));
    imported.forEach((p) => {
      if (p.id && p.name && p.players) {
        playMap.set(p.id, p);
      }
    });

    const merged = Array.from(playMap.values());
    saveAllPlays(merged);
    return merged;
  } catch (err) {
    console.error('Failed to import JSON playbook:', err);
    throw err;
  }
}
