import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  Unsubscribe 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Play } from '../types/playbook';

export const DEFAULT_TEAM_ID = 'halcones_tocho';

/**
 * Saves or updates a single play in Cloud Firestore.
 */
export async function savePlayToCloud(play: Play, teamId: string = DEFAULT_TEAM_ID): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) {
    return false;
  }

  try {
    const playDocRef = doc(db, 'teams', teamId, 'plays', play.id);
    await setDoc(playDocRef, {
      ...play,
      updatedAt: Date.now(),
    });
    return true;
  } catch (err) {
    console.error('Error guardando jugada en Firestore:', err);
    return false;
  }
}

/**
 * Deletes a play from Cloud Firestore.
 */
export async function deletePlayFromCloud(playId: string, teamId: string = DEFAULT_TEAM_ID): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) {
    return false;
  }

  try {
    const playDocRef = doc(db, 'teams', teamId, 'plays', playId);
    await deleteDoc(playDocRef);
    return true;
  } catch (err) {
    console.error('Error eliminando jugada en Firestore:', err);
    return false;
  }
}

/**
 * Fetches all plays from Cloud Firestore for a specific team.
 */
export async function fetchPlaysFromCloud(teamId: string = DEFAULT_TEAM_ID): Promise<Play[] | null> {
  if (!isFirebaseConfigured() || !db) {
    return null;
  }

  try {
    const playsColRef = collection(db, 'teams', teamId, 'plays');
    const snapshot = await getDocs(playsColRef);
    
    if (snapshot.empty) {
      return [];
    }

    const plays: Play[] = [];
    snapshot.forEach((docSnap) => {
      plays.push(docSnap.data() as Play);
    });

    return plays;
  } catch (err) {
    console.error('Error obteniendo jugadas de Firestore:', err);
    return null;
  }
}

/**
 * Uploads an entire batch of local plays to Cloud Firestore.
 */
export async function uploadAllPlaysToCloud(plays: Play[], teamId: string = DEFAULT_TEAM_ID): Promise<number> {
  if (!isFirebaseConfigured() || !db) {
    return 0;
  }

  let count = 0;
  for (const play of plays) {
    const success = await savePlayToCloud(play, teamId);
    if (success) count++;
  }
  return count;
}

/**
 * Real-time listener for team plays in Cloud Firestore.
 */
export function subscribeToCloudPlays(
  teamId: string = DEFAULT_TEAM_ID,
  onUpdate: (plays: Play[]) => void
): Unsubscribe | null {
  if (!isFirebaseConfigured() || !db) {
    return null;
  }

  try {
    const playsColRef = collection(db, 'teams', teamId, 'plays');
    return onSnapshot(
      playsColRef,
      (snapshot) => {
        const plays: Play[] = [];
        snapshot.forEach((docSnap) => {
          plays.push(docSnap.data() as Play);
        });
        if (plays.length > 0) {
          onUpdate(plays);
        }
      },
      (error) => {
        console.error('Error en listener de Firestore:', error);
      }
    );
  } catch (err) {
    console.error('Error suscribiendo a Firestore:', err);
    return null;
  }
}
