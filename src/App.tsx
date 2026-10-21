import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Play, 
  Player, 
  Route as PlayRoute, 
  ToolMode, 
  PlaybackState,
  FieldViewMode,
  DefenseScheme,
  ZoneCoverage,
  ZoneShape,
  PlayCategory,
  TeamSide
} from './types/playbook';
import { 
  loadSavedPlays, 
  savePlay, 
  deletePlayById, 
  duplicatePlay, 
  saveAllPlays,
  exportPlaysByCategory
} from './utils/storage';
import { 
  INITIAL_DEFAULT_PLAYS, 
  DEFAULT_OFFENSIVE_PLAYERS, 
  FORMATION_PRESETS,
  FormationPreset,
  DEFENSE_SCHEMES_DATA
} from './constants/presets';
import { exportPlayAsTacticalImage } from './utils/exportImage';
import { mirrorPlay } from './utils/playTransforms';
import { generateConceptRoutes, ConceptId, ConceptSide, PASS_CONCEPTS } from './utils/concepts';
import { computeFlagPullEvent } from './utils/flagPull';
import { isFirebaseConfigured } from './services/firebase';
import { savePlayToCloud, deletePlayFromCloud, fetchPlaysFromCloud } from './services/cloudPlaybook';

import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { FieldCanvas } from './components/FieldCanvas';
import { PlayControls } from './components/PlayControls';
import { PlaybookSidebar } from './components/PlaybookSidebar';
import { PlayModal } from './components/PlayModal';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LibraryPage } from './pages/LibraryPage';
import { AcademyPage } from './pages/AcademyPage';
import { FormationPicker } from './components/FormationPicker';
import { RoutePresetSelector } from './components/RoutePresetSelector';
import { PlayerDrawer } from './components/PlayerDrawer';
import { ExportModal } from './components/ExportModal';
import { ConceptSelector } from './components/ConceptSelector';
import { StudyCenterModal } from './components/study/StudyCenterModal';
import { loadUserStudyStats, saveUserStudyStats } from './constants/fundamentalsData';
import { UserStudyStats } from './types/study';

export const App: React.FC = () => {
  const navigate = useNavigate();

  // SVG Canvas Ref for export and bounding box
  const svgRef = useRef<SVGSVGElement>(null);

  // Playbook Storage State
  const [plays, setPlays] = useState<Play[]>(() => loadSavedPlays());
  const [currentPlay, setCurrentPlay] = useState<Play>(() => plays[0] || INITIAL_DEFAULT_PLAYS[0]);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Interaction & Drawing State
  const [currentMode, setCurrentMode] = useState<ToolMode>('select');
  const [zoneShape, setZoneShape] = useState<ZoneShape>('rectangle');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // History stack for Undo
  const [history, setHistory] = useState<Play[]>([]);

  // Simulation / Animation Playback State
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    progress: 0,
    speed: 1.0,
    loop: true,
    stopAtFlagPull: true,
  });

  // View Mode (Offense, Defense, Matchup 5v5) & Active Defense Scheme
  const [viewMode, setViewMode] = useState<FieldViewMode>('matchup');
  const [defenseScheme, setDefenseScheme] = useState<DefenseScheme>('cover1');

  // Speed workflow: magnet snapping & concepts modal
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [isConceptOpen, setIsConceptOpen] = useState<boolean>(false);

  // Modals Visibility & Category
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [sidebarCategory, setSidebarCategory] = useState<'ALL' | PlayCategory>('ALL');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [saveTargetCategory, setSaveTargetCategory] = useState<PlayCategory | null>(null);
  const [isFormationPickerOpen, setIsFormationPickerOpen] = useState<boolean>(false);
  const [isRoutePresetOpen, setIsRoutePresetOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isStudyCenterOpen, setIsStudyCenterOpen] = useState<boolean>(false);
  const [studyStats, setStudyStats] = useState<UserStudyStats>(() => loadUserStudyStats());

  const handleUpdateStudyStats = (newStats: UserStudyStats) => {
    setStudyStats(newStats);
    saveUserStudyStats(newStats);
  };

  // Initial synchronization with Cloud Firestore if configured
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    fetchPlaysFromCloud().then((cloudPlays) => {
      if (cloudPlays && cloudPlays.length > 0) {
        setPlays((prevPlays) => {
          const map = new Map<string, Play>();
          prevPlays.forEach((p) => map.set(p.id, p));
          cloudPlays.forEach((p) => map.set(p.id, p));
          const merged = Array.from(map.values());
          saveAllPlays(merged);
          return merged;
        });
      }
    });
  }, []);

  // Save snapshot to history
  const pushHistory = useCallback((playSnapshot: Play) => {
    setHistory((prev) => [...prev.slice(-15), JSON.parse(JSON.stringify(playSnapshot))]);
    setIsDirty(true);
  }, []);

  // Undo last change
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentPlay(previous);
  }, [history]);

  // Debounce play state for heavy background flag-pull physics simulation (prevents UI lockup during player moves)
  const [debouncedPlay, setDebouncedPlay] = useState<Play>(currentPlay);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPlay(currentPlay);
    }, 80);
    return () => clearTimeout(timer);
  }, [currentPlay]);

  // Compute Flag Pull / Tackle Prediction
  const flagPullEvent = useMemo(() => {
    const offenseList = debouncedPlay.players.filter((p) => p.team === 'offense');
    const defenseList = debouncedPlay.players.filter((p) => p.team === 'defense');
    const defSchemeData = DEFENSE_SCHEMES_DATA[defenseScheme] || DEFENSE_SCHEMES_DATA.cover2;

    let effPlayers: Player[];
    if (viewMode === 'offense') {
      effPlayers = offenseList.length > 0 ? offenseList : DEFAULT_OFFENSIVE_PLAYERS;
    } else if (viewMode === 'defense') {
      effPlayers = defenseList.length > 0 ? defenseList : defSchemeData.players;
    } else {
      if (defenseList.length > 0 && offenseList.length > 0) {
        effPlayers = debouncedPlay.players;
      } else if (defenseList.length > 0) {
        effPlayers = [...DEFAULT_OFFENSIVE_PLAYERS, ...defenseList];
      } else {
        effPlayers = [...offenseList, ...defSchemeData.players];
      }
    }

    const offenseIds = new Set(effPlayers.filter((p) => p.team === 'offense').map((p) => p.id));
    const defenseIds = new Set(effPlayers.filter((p) => p.team === 'defense').map((p) => p.id));

    let effRoutes: PlayRoute[];
    if (viewMode === 'offense') {
      effRoutes = debouncedPlay.routes.filter((r) => offenseIds.has(r.playerId));
    } else if (viewMode === 'defense') {
      effRoutes = defenseIds.size > 0 ? debouncedPlay.routes.filter((r) => defenseIds.has(r.playerId)) : defSchemeData.routes;
    } else {
      effRoutes = defenseIds.size > 0 ? debouncedPlay.routes : [...debouncedPlay.routes, ...defSchemeData.routes];
    }

    const effZones: ZoneCoverage[] = viewMode === 'offense'
      ? []
      : debouncedPlay.zones !== undefined
      ? debouncedPlay.zones
      : (defSchemeData.zones || []);

    const defenderZoneMap = new Map<string, ZoneCoverage>();
    effZones.forEach((z) => {
      defenderZoneMap.set(z.playerId, z);
      const matchingPlayer = effPlayers.find(
        (p) =>
          p.id === z.playerId ||
          (z.playerId.startsWith('def_') && p.role?.toLowerCase() === z.playerId.replace('def_', '').toLowerCase()) ||
          (p.team === 'defense' && p.role === (z as any).role)
      );
      if (matchingPlayer) {
        defenderZoneMap.set(matchingPlayer.id, z);
      }
    });

    const isManCoverage = defenseScheme === 'cover1' || defenseScheme === 'blitz';
    const defenderAssignments = new Map<string, Player>();
    if (isManCoverage) {
      const offenseReceivers = effPlayers.filter((p) => p.team === 'offense' && p.role !== 'QB');
      const sortedReceivers = [...offenseReceivers].sort((a, b) => a.x - b.x);
      const defensePlayers = effPlayers.filter((p) => p.team === 'defense');
      const nonRushDefenders = defensePlayers.filter((p) => p.role !== 'RUSH');
      const sortedDefenders = [...nonRushDefenders].sort((a, b) => a.x - b.x);

      const assignedReceiverIds = new Set<string>();
      sortedDefenders.forEach((defender) => {
        let closestRec: Player | null = null;
        let minXDist = 99999;
        sortedReceivers.forEach((rec) => {
          if (!assignedReceiverIds.has(rec.id)) {
            const dist = Math.abs(defender.x - rec.x);
            if (dist < minXDist) {
              minXDist = dist;
              closestRec = rec;
            }
          }
        });
        if (!closestRec && sortedReceivers.length > 0) {
          closestRec = sortedReceivers[0];
        }
        if (closestRec) {
          assignedReceiverIds.add(closestRec.id);
          defenderAssignments.set(defender.id, closestRec);
        }
      });
    }

    return computeFlagPullEvent({
      effectivePlayers: effPlayers,
      effectiveRoutes: effRoutes,
      losY: debouncedPlay.losY,
      targetReceiverId: selectedPlayer?.team === 'offense' && selectedPlayer.role !== 'QB' ? selectedPlayer.id : null,
      defenseScheme,
      zones: effZones,
      defenderZoneMap,
      defenderAssignments,
    });
  }, [debouncedPlay, viewMode, defenseScheme, selectedPlayer]);

  const flagPullEventRef = useRef(flagPullEvent);
  flagPullEventRef.current = flagPullEvent;

  // Animation Loop with requestAnimationFrame
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (playback.isPlaying) {
        setPlayback((prev) => {
          // Playback full duration ~ 15.0 seconds at 1.0x speed
          const baseDuration = 15.0;
          const increment = (delta / baseDuration) * prev.speed;
          let nextProgress = prev.progress + increment;

          // Auto-Stop at Flag Pull if option is active and milestone is crossed
          const fp = flagPullEventRef.current;
          if (
            prev.stopAtFlagPull &&
            fp &&
            fp.occurred &&
            prev.progress < fp.progress &&
            nextProgress >= fp.progress
          ) {
            return {
              ...prev,
              isPlaying: false,
              progress: fp.progress,
            };
          }

          if (nextProgress >= 1.0) {
            if (prev.loop) {
              nextProgress = 0;
            } else {
              return { ...prev, isPlaying: false, progress: 1.0 };
            }
          }
          return { ...prev, progress: nextProgress };
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [playback.isPlaying]);

  // Mirror the whole play left <-> right
  const handleFlipPlay = useCallback(() => {
    pushHistory(currentPlay);
    setCurrentPlay(mirrorPlay(currentPlay));
    setSelectedPlayer(null);
  }, [currentPlay, pushHistory]);

  // Keyboard Shortcuts (Space to play, Ctrl+Z to undo, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when inside input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setPlayback((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        setPlayback((prev) => ({ ...prev, isPlaying: false, progress: 0 }));
      } else if (e.code === 'KeyS') {
        setCurrentMode('select');
      } else if (e.code === 'KeyD') {
        setCurrentMode('draw');
      } else if (e.code === 'KeyZ' && !e.ctrlKey && !e.metaKey) {
        setCurrentMode('draw_zone');
      } else if (e.code === 'KeyE' && !e.ctrlKey && !e.metaKey) {
        setCurrentMode('erase_route');
      } else if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey) {
        handleFlipPlay();
      } else if (e.code === 'KeyC' && !e.ctrlKey && !e.metaKey) {
        setIsConceptOpen(true);
      } else if (e.code === 'KeyG' && !e.ctrlKey && !e.metaKey) {
        setSnapEnabled((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        e.preventDefault();
        handleUndo();
      } else if (e.code === 'Escape') {
        setSelectedPlayer(null);
        setIsSidebarOpen(false);
        setIsSaveModalOpen(false);
        setIsFormationPickerOpen(false);
        setIsRoutePresetOpen(false);
        setIsExportModalOpen(false);
        setIsConceptOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleFlipPlay]);

  // Apply a full pass concept (replaces only the affected offensive routes)
  const handleApplyConcept = (conceptId: ConceptId, side: ConceptSide) => {
    const conceptRoutes = generateConceptRoutes(currentPlay.players, conceptId, side);
    if (conceptRoutes.length === 0) return;

    pushHistory(currentPlay);
    const affected = new Set(conceptRoutes.map((r) => r.playerId));
    const concept = PASS_CONCEPTS.find((c) => c.id === conceptId);

    setCurrentPlay((prev) => ({
      ...prev,
      routes: [...prev.routes.filter((r) => !affected.has(r.playerId)), ...conceptRoutes],
      tags: concept && !prev.tags.includes(concept.name) ? [...prev.tags, concept.name] : prev.tags,
    }));
    setPlayback((prev) => ({ ...prev, isPlaying: false, progress: 0 }));
  };

  // Create a brand new play
  const handleNewPlay = () => {
    const newPlay: Play = {
      id: `play_${Date.now()}`,
      name: 'Nueva Jugada (Yarda 30)',
      category: 'Ofensiva',
      formationName: 'Spread 2x2 (Yarda 30)',
      tags: ['5v5', 'Yarda 30'],
      description: 'Diseña las trayectorias desde la yarda 30 hacia la zona de anotación.',
      losY: 78,
      players: JSON.parse(JSON.stringify(DEFAULT_OFFENSIVE_PLAYERS)),
      routes: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    pushHistory(currentPlay);
    setCurrentPlay(newPlay);
    setSelectedPlayer(null);
    setPlayback((prev) => ({ ...prev, isPlaying: false, progress: 0 }));
  };

  // Handler to switch defense scheme and seamlessly update defense players/routes on the field while preserving the offense
  const handleSelectDefenseScheme = useCallback((scheme: DefenseScheme) => {
    setDefenseScheme(scheme);
    const schemeData = DEFENSE_SCHEMES_DATA[scheme] || DEFENSE_SCHEMES_DATA.cover2;
    setCurrentPlay((prev) => {
      const currentOffense = prev.players.filter((p) => p.team === 'offense');
      const currentOffRoutes = prev.routes.filter((r) =>
        currentOffense.some((op) => op.id === r.playerId)
      );
      const offPlayers = currentOffense.length > 0 ? currentOffense : DEFAULT_OFFENSIVE_PLAYERS;
      return {
        ...prev,
        defenseScheme: scheme,
        defenseName: schemeData.name,
        players: [
          ...offPlayers,
          ...JSON.parse(JSON.stringify(schemeData.players))
        ],
        routes: [
          ...currentOffRoutes,
          ...JSON.parse(JSON.stringify(schemeData.routes))
        ],
        zones: JSON.parse(JSON.stringify(schemeData.zones || [])),
      };
    });
  }, []);

  // Dedicated handlers to load and save offense and defense separately
  const handleLoadOffense = () => {
    setSidebarCategory('Ofensiva');
    setIsSidebarOpen(true);
  };

  const handleSaveOffense = () => {
    setSaveTargetCategory('Ofensiva');
    setIsSaveModalOpen(true);
  };

  const handleLoadDefense = () => {
    setSidebarCategory('Defensiva');
    setIsSidebarOpen(true);
  };

  const handleSaveDefense = () => {
    setSaveTargetCategory('Defensiva');
    setIsSaveModalOpen(true);
  };

  const handleExportOffenseJson = () => {
    exportPlaysByCategory(plays, 'Ofensiva');
  };

  const handleExportDefenseJson = () => {
    exportPlaysByCategory(plays, 'Defensiva');
  };

  // Save play modal callback (supports full play, or offense/defense separately)
  const handleSavePlayModal = (updatedData: Partial<Play>) => {
    let playToSave: Play;
    const targetCat = saveTargetCategory || updatedData.category || currentPlay.category;

    if (targetCat === 'Ofensiva') {
      const offensePlayers = currentPlay.players.filter((p) => p.team === 'offense');
      const offenseRoutes = currentPlay.routes.filter((r) =>
        offensePlayers.some((p) => p.id === r.playerId)
      );
      const offPlayers = offensePlayers.length > 0 ? offensePlayers : DEFAULT_OFFENSIVE_PLAYERS;

      playToSave = {
        ...currentPlay,
        id: currentPlay.category === 'Ofensiva' ? currentPlay.id : `play_off_${Date.now()}`,
        ...updatedData,
        category: 'Ofensiva',
        players: offPlayers,
        routes: offenseRoutes,
        zones: [],
        updatedAt: Date.now(),
      };

      const updatedList = savePlay(playToSave, plays);
      setPlays(updatedList);

      // Preserve active defense unit on field canvas
      const currentDefense = currentPlay.players.filter((p) => p.team === 'defense');
      const currentDefRoutes = currentPlay.routes.filter((r) =>
        currentDefense.some((dp) => dp.id === r.playerId)
      );
      const currentZones = currentPlay.zones || [];

      setCurrentPlay({
        ...playToSave,
        offenseName: playToSave.name,
        defenseName: currentPlay.defenseName,
        defenseFormationName: currentPlay.defenseFormationName,
        defenseScheme: currentPlay.defenseScheme || defenseScheme,
        players: [
          ...playToSave.players,
          ...currentDefense
        ],
        routes: [
          ...playToSave.routes,
          ...currentDefRoutes
        ],
        zones: currentZones,
      });

      setIsDirty(false);
      setSaveTargetCategory(null);

      // Sync to Cloud Firestore if configured
      if (isFirebaseConfigured()) {
        savePlayToCloud(playToSave);
      }
    } else if (targetCat === 'Defensiva') {
      let defensePlayers = currentPlay.players.filter((p) => p.team === 'defense');
      let defenseRoutes = currentPlay.routes.filter((r) =>
        defensePlayers.some((p) => p.id === r.playerId)
      );
      const schemeData = DEFENSE_SCHEMES_DATA[defenseScheme] || DEFENSE_SCHEMES_DATA.cover2;
      let defenseZones = (currentPlay.zones && currentPlay.zones.length > 0)
        ? currentPlay.zones
        : (defenseScheme !== 'blitz' ? JSON.parse(JSON.stringify(schemeData.zones || [])) : []);

      if (defensePlayers.length === 0) {
        defensePlayers = JSON.parse(JSON.stringify(schemeData.players));
        if (defenseRoutes.length === 0) {
          defenseRoutes = JSON.parse(JSON.stringify(schemeData.routes));
        }
      }

      playToSave = {
        ...currentPlay,
        id: currentPlay.category === 'Defensiva' ? currentPlay.id : `play_def_${Date.now()}`,
        ...updatedData,
        category: 'Defensiva',
        defenseScheme: currentPlay.defenseScheme || defenseScheme,
        players: defensePlayers,
        routes: defenseRoutes,
        zones: defenseZones,
        ballPass: undefined,
        updatedAt: Date.now(),
      };

      const updatedList = savePlay(playToSave, plays);
      setPlays(updatedList);

      // CRITICAL FIX: PRESERVE ACTIVE OFFENSIVE UNIT ON FIELD CANVAS!
      const currentOffense = currentPlay.players.filter((p) => p.team === 'offense');
      const currentOffRoutes = currentPlay.routes.filter((r) =>
        currentOffense.some((op) => op.id === r.playerId)
      );
      const offPlayers = currentOffense.length > 0 ? currentOffense : DEFAULT_OFFENSIVE_PLAYERS;

      setCurrentPlay((prev) => ({
        ...prev,
        defenseName: playToSave.name,
        defenseFormationName: playToSave.formationName,
        defenseScheme: playToSave.defenseScheme || defenseScheme,
        players: [
          ...offPlayers,
          ...defensePlayers
        ],
        routes: [
          ...currentOffRoutes,
          ...defenseRoutes
        ],
        zones: defenseZones,
      }));

      setIsDirty(false);
      setSaveTargetCategory(null);

      // Sync to Cloud Firestore if configured
      if (isFirebaseConfigured()) {
        savePlayToCloud(playToSave);
      }
    } else {
      playToSave = {
        ...currentPlay,
        ...updatedData,
        updatedAt: Date.now(),
      };

      const updatedList = savePlay(playToSave, plays);
      setPlays(updatedList);
      setCurrentPlay(playToSave);
      setIsDirty(false);
      setSaveTargetCategory(null);

      // Sync to Cloud Firestore if configured
      if (isFirebaseConfigured()) {
        savePlayToCloud(playToSave);
      }
    }
  };

  // Quick save current state without opening modal if already named
  const handleQuickSave = () => {
    setSaveTargetCategory(null);
    setIsSaveModalOpen(true);
  };

  // Select Play from sidebar (intelligently blends units in all modes to NEVER wipe out the offense or defense)
  const handleSelectPlay = (play: Play) => {
    pushHistory(currentPlay);

    if (play.category === 'Defensiva') {
      // Load defense unit, PRESERVE ACTIVE OFFENSIVE UNIT!
      const currentOffense = currentPlay.players.filter((p) => p.team === 'offense');
      const currentOffRoutes = currentPlay.routes.filter((r) =>
        currentOffense.some((op) => op.id === r.playerId)
      );
      const offPlayers = currentOffense.length > 0 ? currentOffense : DEFAULT_OFFENSIVE_PLAYERS;
      const currentPass = currentPlay.ballPass;

      const loadedScheme: DefenseScheme = play.defenseScheme || (
        play.id.includes('cover2') ? 'cover2' :
        play.id.includes('cover3') ? 'cover3' :
        play.id.includes('cover4') ? 'cover4' :
        play.id.includes('blitz') ? 'blitz' :
        play.id.includes('cover1') ? 'cover1' : defenseScheme
      );
      const schemeData = DEFENSE_SCHEMES_DATA[loadedScheme] || DEFENSE_SCHEMES_DATA.cover2;

      let defPlayers = play.players.filter((p) => p.team === 'defense');
      if (defPlayers.length === 0) {
        defPlayers = play.players.map((p) => ({ ...p, team: 'defense' as TeamSide }));
      }
      if (defPlayers.length === 0) {
        defPlayers = JSON.parse(JSON.stringify(schemeData.players));
      }

      const defPlayerIds = new Set(defPlayers.map((p) => p.id));
      let defRoutes = play.routes.filter((r) => defPlayerIds.has(r.playerId));
      if (defRoutes.length === 0 && play.routes.length > 0) {
        defRoutes = play.routes;
      }
      if (defRoutes.length === 0) {
        defRoutes = JSON.parse(JSON.stringify(schemeData.routes || []));
      }

      // Robust zone loading: prioritize play.zones if populated; otherwise load scheme default zones
      let defZones: ZoneCoverage[] = (play.zones && play.zones.length > 0)
        ? JSON.parse(JSON.stringify(play.zones))
        : (loadedScheme !== 'blitz' ? JSON.parse(JSON.stringify(schemeData.zones || [])) : []);

      setDefenseScheme(loadedScheme);

      // If user was in offense view, switch to defense view so the loaded defense & zones are immediately visible
      if (viewMode === 'offense') {
        setViewMode('defense');
      }

      // Ensure defensive player IDs don't collide with offensive player IDs
      const offPlayerIds = new Set(offPlayers.map((p) => p.id));
      const defIdMap = new Map<string, string>();
      const safeDefPlayers = defPlayers.map((dp) => {
        if (offPlayerIds.has(dp.id)) {
          const safeId = `def_${dp.id}`;
          defIdMap.set(dp.id, safeId);
          return { ...dp, id: safeId, team: 'defense' as TeamSide };
        }
        return { ...dp, team: 'defense' as TeamSide };
      });

      const safeDefRoutes = defRoutes.map((r) => {
        if (defIdMap.has(r.playerId)) {
          return { ...r, playerId: defIdMap.get(r.playerId)! };
        }
        return r;
      });

      // Reliably map zones to the actual defensive player IDs on the field
      const safeDefZones = defZones.map((z) => {
        const mappedId = defIdMap.has(z.playerId) ? defIdMap.get(z.playerId)! : z.playerId;
        const exists = safeDefPlayers.some((p) => p.id === mappedId);
        if (exists) {
          return { ...z, playerId: mappedId };
        }
        // Fallback: match by role to ensure zone has a valid player on the field
        const roleMatch = safeDefPlayers.find((p) => {
          if ((z as any).role && p.role === (z as any).role) return true;
          if (z.playerId.startsWith('def_') && p.role?.toLowerCase() === z.playerId.replace('def_', '').toLowerCase()) return true;
          if (z.playerId.includes('cb1') && p.role === 'CB1') return true;
          if (z.playerId.includes('cb2') && p.role === 'CB2') return true;
          if ((z.playerId.includes('s1') || z.playerId.includes('fs')) && p.role === 'S1') return true;
          if ((z.playerId.includes('s2') || z.playerId.includes('ss')) && p.role === 'S2') return true;
          if (z.playerId.includes('lb') && p.role === 'LB') return true;
          return false;
        });
        if (roleMatch) {
          return { ...z, playerId: roleMatch.id, color: z.color || roleMatch.color };
        }
        return { ...z, playerId: mappedId };
      });

      const merged: Play = {
        ...currentPlay,
        defenseScheme: loadedScheme,
        defenseName: play.name,
        defenseFormationName: play.formationName,
        players: [
          ...offPlayers,
          ...safeDefPlayers
        ],
        routes: [
          ...currentOffRoutes,
          ...safeDefRoutes
        ],
        zones: safeDefZones,
        ballPass: currentPass,
      };

      setCurrentPlay(merged);
    } else if (play.category === 'Ofensiva') {
      // Load offense unit, PRESERVE ACTIVE DEFENSE UNIT!
      const currentDefense = currentPlay.players.filter((p) => p.team === 'defense');
      const currentDefRoutes = currentPlay.routes.filter((r) =>
        currentDefense.some((dp) => dp.id === r.playerId)
      );
      const currentZones = (currentPlay.zones && currentPlay.zones.length > 0)
        ? currentPlay.zones
        : (defenseScheme !== 'blitz' ? (DEFENSE_SCHEMES_DATA[defenseScheme]?.zones || []) : []);

      const defPlayers = currentDefense.length > 0 ? currentDefense : (DEFENSE_SCHEMES_DATA[defenseScheme]?.players || []);
      const defRoutes = currentDefRoutes.length > 0 ? currentDefRoutes : (DEFENSE_SCHEMES_DATA[defenseScheme]?.routes || []);
      const defZones = currentZones;

      let offPlayers = play.players.filter((p) => p.team === 'offense');
      if (offPlayers.length === 0) {
        offPlayers = play.players.map((p) => ({ ...p, team: 'offense' as TeamSide }));
      }
      const offPlayerIds = new Set(offPlayers.map((p) => p.id));
      const offRoutes = play.routes.filter((r) => offPlayerIds.has(r.playerId));

      // Ensure offensive player IDs don't collide with defensive player IDs
      const defPlayerIds = new Set(defPlayers.map((p) => p.id));
      const offIdMap = new Map<string, string>();
      const safeOffPlayers = offPlayers.map((op) => {
        if (defPlayerIds.has(op.id)) {
          const safeId = `off_${op.id}`;
          offIdMap.set(op.id, safeId);
          return { ...op, id: safeId, team: 'offense' as TeamSide };
        }
        return { ...op, team: 'offense' as TeamSide };
      });

      const safeOffRoutes = offRoutes.map((r) => {
        if (offIdMap.has(r.playerId)) {
          return { ...r, playerId: offIdMap.get(r.playerId)! };
        }
        return r;
      });

      const merged: Play = {
        ...play,
        offenseName: play.name,
        defenseName: currentPlay.defenseName,
        defenseFormationName: currentPlay.defenseFormationName,
        defenseScheme: currentPlay.defenseScheme || defenseScheme,
        players: [
          ...safeOffPlayers,
          ...defPlayers
        ],
        routes: [
          ...safeOffRoutes,
          ...defRoutes
        ],
        zones: defZones,
      };

      setCurrentPlay(merged);
    } else {
      setCurrentPlay(play);
    }

    setSelectedPlayer(null);
    setPlayback((prev) => ({ ...prev, isPlaying: false, progress: 0 }));
    setIsDirty(false);
  };

  // Delete play
  const handleDeletePlay = (playId: string) => {
    const updated = deletePlayById(playId, plays);
    setPlays(updated);
    if (currentPlay.id === playId) {
      setCurrentPlay(updated[0] || INITIAL_DEFAULT_PLAYS[0]);
    }

    // Delete from Cloud Firestore if configured
    if (isFirebaseConfigured()) {
      deletePlayFromCloud(playId);
    }
  };

  // Duplicate play
  const handleDuplicatePlay = (play: Play) => {
    const { newPlay, updatedList } = duplicatePlay(play, plays);
    setPlays(updatedList);
    setCurrentPlay(newPlay);
  };

  // Apply formation preset (preserves the opposing unit so neither offense nor defense disappears)
  const handleSelectFormation = (preset: FormationPreset) => {
    pushHistory(currentPlay);
    const isOffense = preset.category === 'offense';

    setCurrentPlay((prev) => {
      if (isOffense) {
        const currentDefense = prev.players.filter((p) => p.team === 'defense');
        const currentDefRoutes = prev.routes.filter((r) => currentDefense.some((dp) => dp.id === r.playerId));
        const currentZones = prev.zones !== undefined
          ? prev.zones
          : (DEFENSE_SCHEMES_DATA[defenseScheme]?.zones || []);

        return {
          ...prev,
          formationName: preset.name,
          losY: preset.losY,
          players: [
            ...JSON.parse(JSON.stringify(preset.players)),
            ...currentDefense
          ],
          routes: currentDefRoutes,
          zones: currentZones,
          ballPass: undefined,
          description: preset.description,
        };
      } else {
        const currentOffense = prev.players.filter((p) => p.team === 'offense');
        const currentOffRoutes = prev.routes.filter((r) => currentOffense.some((op) => op.id === r.playerId));

        return {
          ...prev,
          defenseFormationName: preset.name,
          players: [
            ...(currentOffense.length > 0 ? currentOffense : DEFAULT_OFFENSIVE_PLAYERS),
            ...JSON.parse(JSON.stringify(preset.players))
          ],
          routes: currentOffRoutes,
          zones: (preset as any).zones && (preset as any).zones.length > 0
            ? (preset as any).zones
            : (defenseScheme !== 'blitz' ? (DEFENSE_SCHEMES_DATA[defenseScheme]?.zones || []) : []),
          description: preset.description,
        };
      }
    });

    setSelectedPlayer(null);
    setPlayback((prev) => ({ ...prev, isPlaying: false, progress: 0 }));
  };

  // Update single player position
  const handleUpdatePlayerPosition = (playerId: string, x: number, y: number) => {
    setCurrentPlay((prev) => {
      let basePlayers = prev.players;
      let baseRoutes = prev.routes;
      let baseZones = prev.zones || [];

      const exists = prev.players.some((p) => p.id === playerId);
      if (!exists) {
        const defScheme = DEFENSE_SCHEMES_DATA[defenseScheme] || DEFENSE_SCHEMES_DATA.cover2;
        basePlayers = [...prev.players, ...JSON.parse(JSON.stringify(defScheme.players))];
        baseRoutes = [...prev.routes, ...JSON.parse(JSON.stringify(defScheme.routes))];
        baseZones = [...baseZones, ...JSON.parse(JSON.stringify(defScheme.zones || []))];
      }

      const updatedPlayers = basePlayers.map((p) => {
        if (p.id === playerId) {
          return { ...p, x, y };
        }
        return p;
      });

      // Update start point of route if exists
      const updatedRoutes = baseRoutes.map((r) => {
        if (r.playerId === playerId && r.points.length > 0) {
          const newPoints = [...r.points];
          newPoints[0] = { ...newPoints[0], x, y };
          return { ...r, points: newPoints };
        }
        return r;
      });

      return {
        ...prev,
        players: updatedPlayers,
        routes: updatedRoutes,
        zones: baseZones,
      };
    });
    setIsDirty(true);
  };

  // Add or update route for a player
  const handleAddOrUpdateRoute = (route: PlayRoute, skipHistory: boolean = false) => {
    if (!skipHistory) {
      pushHistory(currentPlay);
    }
    setCurrentPlay((prev) => {
      let basePlayers = prev.players;
      let baseZones = prev.zones || [];
      const exists = prev.players.some((p) => p.id === route.playerId);
      if (!exists) {
        const defScheme = DEFENSE_SCHEMES_DATA[defenseScheme] || DEFENSE_SCHEMES_DATA.cover2;
        if (defScheme.players.some((dp) => dp.id === route.playerId)) {
          basePlayers = [...prev.players, ...JSON.parse(JSON.stringify(defScheme.players))];
          baseZones = [...baseZones, ...JSON.parse(JSON.stringify(defScheme.zones || []))];
        }
      }

      const existingIdx = prev.routes.findIndex((r) => r.playerId === route.playerId);
      let updatedRoutes: PlayRoute[];

      if (existingIdx >= 0) {
        updatedRoutes = [...prev.routes];
        updatedRoutes[existingIdx] = route;
      } else {
        updatedRoutes = [...prev.routes, route];
      }

      return {
        ...prev,
        players: basePlayers,
        routes: updatedRoutes,
        zones: baseZones,
      };
    });
  };

  // Apply preset route
  const handleApplyPresetRoute = (_playerId: string, route: PlayRoute) => {
    handleAddOrUpdateRoute(route);
  };

  // Delete route
  const handleDeleteRoute = (routeId: string) => {
    pushHistory(currentPlay);
    setCurrentPlay((prev) => ({
      ...prev,
      routes: prev.routes.filter((r) => r.id !== routeId),
    }));
  };

  // Clear routes (clears only the active unit depending on viewMode)
  const handleClearAllRoutes = () => {
    pushHistory(currentPlay);
    if (viewMode === 'offense') {
      const defenseIds = new Set(currentPlay.players.filter((p) => p.team === 'defense').map((p) => p.id));
      setCurrentPlay((prev) => ({
        ...prev,
        routes: prev.routes.filter((r) => defenseIds.has(r.playerId)),
        ballPass: undefined,
      }));
    } else if (viewMode === 'defense') {
      const offenseIds = new Set(currentPlay.players.filter((p) => p.team === 'offense').map((p) => p.id));
      setCurrentPlay((prev) => ({
        ...prev,
        routes: prev.routes.filter((r) => offenseIds.has(r.playerId)),
        zones: [],
      }));
    } else {
      setCurrentPlay((prev) => ({
        ...prev,
        routes: [],
        zones: [],
        ballPass: undefined,
      }));
    }
  };

  // Clear specific player route
  const handleClearPlayerRoute = (playerId: string) => {
    pushHistory(currentPlay);
    setCurrentPlay((prev) => ({
      ...prev,
      routes: prev.routes.filter((r) => r.playerId !== playerId),
    }));
  };

  // Add or update zone coverage
  const handleAddOrUpdateZone = (zone: ZoneCoverage) => {
    pushHistory(currentPlay);
    setCurrentPlay((prev) => {
      const defScheme = DEFENSE_SCHEMES_DATA[defenseScheme] || DEFENSE_SCHEMES_DATA.cover2;
      let basePlayers = prev.players;
      const exists = prev.players.some((p) => p.id === zone.playerId);
      if (!exists) {
        if (defScheme.players.some((dp) => dp.id === zone.playerId)) {
          basePlayers = [...prev.players, ...JSON.parse(JSON.stringify(defScheme.players))];
        }
      }

      const existingZones: ZoneCoverage[] = prev.zones !== undefined
        ? prev.zones
        : JSON.parse(JSON.stringify(defScheme.zones || []));

      const existingIdx = existingZones.findIndex((z) => z.playerId === zone.playerId || z.id === zone.id);
      let updatedZones: ZoneCoverage[];

      if (existingIdx >= 0) {
        updatedZones = [...existingZones];
        updatedZones[existingIdx] = zone;
      } else {
        updatedZones = [...existingZones, zone];
      }

      return {
        ...prev,
        players: basePlayers,
        zones: updatedZones,
      };
    });
  };

  // Delete zone coverage
  const handleDeleteZone = (zoneId: string) => {
    pushHistory(currentPlay);
    setCurrentPlay((prev) => {
      const defScheme = DEFENSE_SCHEMES_DATA[defenseScheme] || DEFENSE_SCHEMES_DATA.cover2;
      const baseZones: ZoneCoverage[] = prev.zones !== undefined
        ? prev.zones
        : JSON.parse(JSON.stringify(defScheme.zones || []));
      return {
        ...prev,
        zones: baseZones.filter((z) => z.id !== zoneId && z.playerId !== zoneId),
      };
    });
    setIsDirty(true);
  };

  // Update Line of Scrimmage and translate whole formation (offense + defense + routes + zones)
  const handleUpdateLosY = (newLosY: number) => {
    setCurrentPlay((prev) => {
      const deltaY = newLosY - prev.losY;
      if (Math.abs(deltaY) < 0.001) return prev;

      const updatedPlayers = prev.players.map((p) => ({
        ...p,
        y: Math.max(2, Math.min(138, p.y + deltaY)),
      }));

      const updatedRoutes = prev.routes.map((r) => ({
        ...r,
        points: r.points.map((pt) => ({
          ...pt,
          y: Math.max(0, Math.min(140, pt.y + deltaY)),
        })),
      }));

      const updatedZones = (prev.zones || []).map((z) => ({
        ...z,
        cy: Math.max(5, Math.min(135, z.cy + deltaY)),
      }));

      // Update selectedPlayer coordinates if open
      setSelectedPlayer((prevSel) => {
        if (!prevSel) return null;
        return updatedPlayers.find((p) => p.id === prevSel.id) || prevSel;
      });

      return {
        ...prev,
        losY: newLosY,
        players: updatedPlayers,
        routes: updatedRoutes,
        zones: updatedZones,
      };
    });
    setIsDirty(true);
  };

  // Update Player metadata (name, jersey, role, team)
  const handleUpdatePlayer = (updatedPlayer: Player) => {
    pushHistory(currentPlay);
    setCurrentPlay((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p)),
    }));
  };

  // Delete player from field
  const handleDeletePlayer = (playerId: string) => {
    pushHistory(currentPlay);
    setCurrentPlay((prev) => {
      const defScheme = DEFENSE_SCHEMES_DATA[defenseScheme] || DEFENSE_SCHEMES_DATA.cover2;
      const baseZones: ZoneCoverage[] = prev.zones !== undefined
        ? prev.zones
        : JSON.parse(JSON.stringify(defScheme.zones || []));
      return {
        ...prev,
        players: prev.players.filter((p) => p.id !== playerId),
        routes: prev.routes.filter((r) => r.playerId !== playerId),
        zones: baseZones.filter((z) => z.playerId !== playerId),
      };
    });
    setSelectedPlayer(null);
    setIsDirty(true);
  };

  // Add new player to field
  const handleAddPlayer = () => {
    pushHistory(currentPlay);
    const count = currentPlay.players.length + 1;
    const isOffense = currentPlay.category === 'Ofensiva';

    const newPlayer: Player = {
      id: `p_custom_${Date.now()}`,
      role: 'CUSTOM',
      label: `${count}`,
      jerseyNumber: `${count}`,
      team: isOffense ? 'offense' : 'defense',
      x: 50,
      y: isOffense ? currentPlay.losY + 8 : currentPlay.losY - 8,
      color: isOffense ? '#38bdf8' : '#f87171',
      customName: `Jugador ${count}`,
    };

    setCurrentPlay((prev) => ({
      ...prev,
      players: [...prev.players, newPlayer],
    }));
    setSelectedPlayer(newPlayer);
  };

  // Export tactical image
  const handleExportTacticalImage = () => {
    if (svgRef.current) {
      exportPlayAsTacticalImage(svgRef.current, currentPlay);
    }
  };

  // Reset to initial factory presets
  const handleResetToDefaults = () => {
    saveAllPlays(INITIAL_DEFAULT_PLAYS);
    setPlays(INITIAL_DEFAULT_PLAYS);
    setCurrentPlay(INITIAL_DEFAULT_PLAYS[0]);
    setIsDirty(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070d09] text-slate-100 overflow-hidden font-sans">
      <Routes>
        {/* Ruta 1: Menú Principal (Sin Header superior) */}
        <Route
          path="/"
          element={
            <HomePage
              plays={plays}
              currentPlay={currentPlay}
              studyStats={studyStats}
              onSelectPlay={(p) => {
                handleSelectPlay(p);
                navigate('/pizarra');
              }}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          }
        />

        {/* Ruta 2: Pizarra Táctica (Con Header superior táctico y controles de campo) */}
        <Route
          path="/pizarra"
          element={
            <div className="flex flex-col h-full w-full overflow-hidden">
              {/* Header Táctico - SOLO visible en la Pizarra */}
              <Header
                currentPlay={currentPlay}
                viewMode={viewMode}
                onChangeViewMode={setViewMode}
                defenseScheme={defenseScheme}
                onChangeDefenseScheme={handleSelectDefenseScheme}
                onOpenSidebar={() => {
                  setSidebarCategory(viewMode === 'matchup' || viewMode === 'defense' ? 'Defensiva' : 'ALL');
                  setIsSidebarOpen(true);
                }}
                onOpenSaveModal={handleQuickSave}
                onLoadOffense={handleLoadOffense}
                onSaveOffense={handleSaveOffense}
                onLoadDefense={handleLoadDefense}
                onSaveDefense={handleSaveDefense}
                onExportOffenseJson={handleExportOffenseJson}
                onExportDefenseJson={handleExportDefenseJson}
                onNewPlay={handleNewPlay}
                onOpenFormationPicker={() => setIsFormationPickerOpen(true)}
                onExportImage={handleExportTacticalImage}
                onOpenExportModal={() => setIsExportModalOpen(true)}
                onOpenStudyCenter={() => navigate('/academia')}
                activeSection="designer"
                onNavigate={(sec) => {
                  if (sec === 'home') navigate('/');
                  else if (sec === 'designer') navigate('/pizarra');
                  else if (sec === 'academy') navigate('/academia');
                }}
                isDirty={isDirty}
              />

              {/* Espacio de Trabajo Principal (Toolbar + FieldCanvas + PlayControls) */}
              <div className="flex-1 flex flex-col overflow-hidden relative">
                <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#0c120e]">
                  <div className="flex-1 relative flex items-center justify-center bg-[#0c120e] overflow-hidden">
                    <Toolbar
                      currentMode={currentMode}
                      onSelectMode={(mode) => setCurrentMode(mode)}
                      zoneShape={zoneShape}
                      onSelectZoneShape={(shape) => setZoneShape(shape)}
                      onOpenPresetRoutes={() => setIsRoutePresetOpen(true)}
                      onOpenConcepts={() => setIsConceptOpen(true)}
                      onFlipPlay={handleFlipPlay}
                      snapEnabled={snapEnabled}
                      onToggleSnap={() => setSnapEnabled((prev) => !prev)}
                      onClearRoutes={handleClearAllRoutes}
                      onResetFormation={() => handleSelectFormation(FORMATION_PRESETS[0])}
                      onAddPlayer={handleAddPlayer}
                      canUndo={history.length > 0}
                      onUndo={handleUndo}
                    />

                    <FieldCanvas
                      play={currentPlay}
                      currentMode={currentMode}
                      zoneShape={zoneShape}
                      playback={playback}
                      viewMode={viewMode}
                      defenseScheme={defenseScheme}
                      snapEnabled={snapEnabled}
                      selectedPlayerId={selectedPlayer?.id || null}
                      onSelectPlayer={(player) => setSelectedPlayer(player)}
                      onUpdatePlayerPosition={handleUpdatePlayerPosition}
                      onAddOrUpdateRoute={handleAddOrUpdateRoute}
                      onDeleteRoute={handleDeleteRoute}
                      onAddOrUpdateZone={handleAddOrUpdateZone}
                      onDeleteZone={handleDeleteZone}
                      onUpdateLosY={handleUpdateLosY}
                      onResetPlayback={() => setPlayback((prev) => ({ ...prev, isPlaying: false, progress: 0 }))}
                      onOpenPresetRoutesModal={() => setIsRoutePresetOpen(true)}
                      svgRef={svgRef}
                      flagPullEvent={flagPullEvent}
                    />
                  </div>

                  <PlayControls
                    playback={playback}
                    onTogglePlay={() => setPlayback((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))}
                    onReset={() => setPlayback((prev) => ({ ...prev, isPlaying: false, progress: 0 }))}
                    onSeek={(progress) => setPlayback((prev) => ({ ...prev, progress }))}
                    onChangeSpeed={(speed) => setPlayback((prev) => ({ ...prev, speed }))}
                    onToggleLoop={() => setPlayback((prev) => ({ ...prev, loop: !prev.loop }))}
                    onStep={(delta) =>
                      setPlayback((prev) => ({
                        ...prev,
                        progress: Math.max(0, Math.min(1, prev.progress + delta)),
                      }))
                    }
                    flagPullEvent={flagPullEvent}
                    onToggleStopAtFlagPull={() => setPlayback((prev) => ({ ...prev, stopAtFlagPull: !prev.stopAtFlagPull }))}
                  />
                </div>
              </div>
            </div>
          }
        />

        {/* Ruta 3: Casillero / Biblioteca de Jugadas Completa */}
        <Route
          path="/casillero"
          element={
            <LibraryPage
              plays={plays}
              currentPlay={currentPlay}
              onSelectPlay={(p) => {
                handleSelectPlay(p);
                navigate('/pizarra');
              }}
              onNewPlay={() => {
                handleNewPlay();
                navigate('/pizarra');
              }}
              onDuplicatePlay={handleDuplicatePlay}
              onDeletePlay={handleDeletePlay}
            />
          }
        />

        {/* Ruta 4: Academia Halcones (IFAF, Rutas, Quiz, Coberturas) */}
        <Route
          path="/academia"
          element={
            <AcademyPage
              plays={plays}
              studyStats={studyStats}
              onUpdateStudyStats={handleUpdateStudyStats}
            />
          }
        />

        {/* Fallback de rutas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Playbook Sidebar Drawer */}
      <PlaybookSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        plays={plays}
        currentPlayId={currentPlay.id}
        activeDefenseScheme={defenseScheme}
        onSelectPlay={handleSelectPlay}
        onSelectDefenseScheme={(scheme) => {
          handleSelectDefenseScheme(scheme);
          setViewMode('matchup');
        }}
        onDeletePlay={handleDeletePlay}
        onDuplicatePlay={handleDuplicatePlay}
        initialCategory={sidebarCategory}
      />

      {/* Save / Edit Play Modal */}
      <PlayModal
        isOpen={isSaveModalOpen}
        onClose={() => {
          setIsSaveModalOpen(false);
          setSaveTargetCategory(null);
        }}
        play={currentPlay}
        targetCategory={saveTargetCategory}
        onSave={handleSavePlayModal}
      />

      {/* Preset Formations Modal */}
      <FormationPicker
        isOpen={isFormationPickerOpen}
        onClose={() => setIsFormationPickerOpen(false)}
        onSelectFormation={handleSelectFormation}
      />

      {/* Preset Route Tree Modal */}
      <RoutePresetSelector
        isOpen={isRoutePresetOpen}
        onClose={() => setIsRoutePresetOpen(false)}
        selectedPlayer={selectedPlayer}
        players={currentPlay.players}
        onApplyPresetRoute={handleApplyPresetRoute}
        onSelectPlayer={(p) => setSelectedPlayer(p)}
      />

      {/* Pass Concepts Modal */}
      <ConceptSelector
        isOpen={isConceptOpen}
        onClose={() => setIsConceptOpen(false)}
        players={currentPlay.players}
        losY={currentPlay.losY}
        onApplyConcept={handleApplyConcept}
      />

      {/* Selected Player Properties Floating Drawer */}
      <PlayerDrawer
        player={selectedPlayer}
        route={selectedPlayer ? currentPlay.routes.find((r) => r.playerId === selectedPlayer.id) : null}
        zone={(() => {
          if (!selectedPlayer) return null;
          const currentZones = currentPlay.zones !== undefined
            ? currentPlay.zones
            : (DEFENSE_SCHEMES_DATA[defenseScheme] || DEFENSE_SCHEMES_DATA.cover2).zones || [];
          return currentZones.find((z) => z.playerId === selectedPlayer.id) || null;
        })()}
        onClose={() => setSelectedPlayer(null)}
        onUpdatePlayer={handleUpdatePlayer}
        onDeletePlayer={handleDeletePlayer}
        onClearPlayerRoute={handleClearPlayerRoute}
        onUpdateRoute={handleAddOrUpdateRoute}
        onUpdateZone={handleAddOrUpdateZone}
        onDeleteZone={handleDeleteZone}
        onOpenPresetRoutes={() => setIsRoutePresetOpen(true)}
      />

      {/* Export / Backup Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        plays={plays}
        onImportPlays={(updatedList) => {
          setPlays(updatedList);
          if (updatedList.length > 0) setCurrentPlay(updatedList[0]);
        }}
        onResetToDefaults={handleResetToDefaults}
      />

      {/* Halcones Academy Study Center Modal */}
      <StudyCenterModal
        isOpen={isStudyCenterOpen}
        onClose={() => setIsStudyCenterOpen(false)}
        plays={plays}
        stats={studyStats}
        onUpdateStats={handleUpdateStudyStats}
      />
    </div>
  );
};

export default App;
