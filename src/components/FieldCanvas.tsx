import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Play, Player, Route, ToolMode, ActionType, Point, PlaybackState, FieldViewMode, DefenseScheme, ZoneCoverage, ZoneShape, FlagPullEvent } from '../types/playbook';
import { getPositionAtTime, pointsToSvgPath, getDistance, getRouteBasePoints, insertStopAlongPolyline } from '../utils/geometry';
import { getKeyYardGuides, snapToGuides, simplifyPath } from '../utils/playTransforms';
import { computeNextGenAnalytics } from '../utils/analytics';
import { DEFENSE_SCHEMES_DATA, DEFAULT_OFFENSIVE_PLAYERS } from '../constants/presets';
import { Activity, Timer, AlertTriangle, CheckCircle2, Eye, Flag, X, Users, Shield } from 'lucide-react';
import {
  getTargetReceiver,
  getCarrierLivePosition,
  computeDefenderPositionAtTime,
  calculatePassTimings,
  BASE_DURATION_SEC,
  BASE_SPRINT_SPEED,
} from '../utils/flagPull';

interface FieldCanvasProps {
  play: Play;
  currentMode: ToolMode;
  zoneShape?: ZoneShape;
  playback: PlaybackState;
  viewMode?: FieldViewMode;
  defenseScheme?: DefenseScheme;
  snapEnabled?: boolean;
  selectedPlayerId: string | null;
  onSelectPlayer: (player: Player | null) => void;
  onUpdatePlayerPosition: (playerId: string, x: number, y: number) => void;
  onAddOrUpdateRoute: (route: Route, skipHistory?: boolean) => void;
  onDeleteRoute: (routeId: string) => void;
  onAddOrUpdateZone?: (zone: ZoneCoverage) => void;
  onDeleteZone?: (zoneId: string) => void;
  onUpdateLosY: (losY: number) => void;
  onResetPlayback?: () => void;
  onOpenPresetRoutesModal?: () => void;
  svgRef: React.RefObject<SVGSVGElement>;
  flagPullEvent?: FlagPullEvent | null;
}

export const FieldCanvas: React.FC<FieldCanvasProps> = ({
  play,
  currentMode,
  zoneShape = 'rectangle',
  playback,
  viewMode = 'matchup',
  defenseScheme = 'cover2',
  snapEnabled = true,
  selectedPlayerId,
  onSelectPlayer,
  onUpdatePlayerPosition,
  onAddOrUpdateRoute,
  onDeleteRoute,
  onAddOrUpdateZone,
  onDeleteZone,
  onUpdateLosY,
  onResetPlayback,
  onOpenPresetRoutesModal: _onOpenPresetRoutesModal,
  svgRef,
  flagPullEvent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for dragging player and Line of Scrimmage
  const draggingPlayerIdRef = useRef<string | null>(null);
  const draggingLosRef = useRef<boolean>(false);

  // Ref and state for dragging Stop & Go badge strictly along route trajectory
  const draggingStopBadgeRef = useRef<{
    routeId: string;
    playerId: string;
    pauseDuration: number;
    basePoints: Point[];
  } | null>(null);
  const [isDraggingStopBadge, setIsDraggingStopBadge] = useState<boolean>(false);

  // State and refs for actively drawing route
  const [isDrawingRoute, setIsDrawingRoute] = useState<boolean>(false);
  const isDrawingRouteRef = useRef<boolean>(false);
  const [activeRoutePlayerId, setActiveRoutePlayerId] = useState<string | null>(null);
  const activeRoutePlayerIdRef = useRef<string | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const drawingPointsRef = useRef<Point[]>([]);

  // State and refs for drawing/assigning zone
  const [drawingZone, setDrawingZone] = useState<{ startX: number; startY: number; currentX: number; currentY: number; playerId: string } | null>(null);
  const drawingZoneRef = useRef<{ startX: number; startY: number; currentX: number; currentY: number; playerId: string } | null>(null);

  // State for analytics HUD toggle
  const [showAnalyticsHud, setShowAnalyticsHud] = useState<boolean>(true);

  // Transient Drag Overrides (for 60-120fps buttery smooth dragging with 0 lag)
  const [dragPlayerPos, setDragPlayerPos] = useState<{ id: string; x: number; y: number } | null>(null);
  const lastDragCoordsRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const dragRafRef = useRef<number | null>(null);

  const [dragLosY, setDragLosY] = useState<number | null>(null);
  const lastLosYRef = useRef<number | null>(null);
  const losRafRef = useRef<number | null>(null);
  const stopBadgeRafRef = useRef<number | null>(null);

  // Transient Zone Editing (for 60-120fps live interactive resizing and moving)
  const [editingZone, setEditingZone] = useState<{
    zoneId: string;
    cx: number;
    cy: number;
    rx: number;
    ry: number;
  } | null>(null);
  const lastZoneEditRef = useRef<{
    zoneId: string;
    cx: number;
    cy: number;
    rx: number;
    ry: number;
  } | null>(null);
  const zoneEditRafRef = useRef<number | null>(null);
  const draggingZoneHandleRef = useRef<{
    zoneId: string;
    handleType:
      | 'center'
      | 'left'
      | 'right'
      | 'top'
      | 'bottom'
      | 'corner'
      | 'corner_nw'
      | 'corner_ne'
      | 'corner_sw'
      | 'corner_se';
    initialCx: number;
    initialCy: number;
    initialRx: number;
    initialRy: number;
    startFieldCoords: Point;
  } | null>(null);

  // Cached analytics to completely skip expensive calculations during active player/LOS drag
  const cachedAnalyticsRef = useRef<any>(null);

  // Active Display LOS Y (uses transient drag override if dragging LOS)
  const displayLosY = dragLosY ?? play.losY;

  // Smart yard snapping guides (5 / 10 / 15 yds + goal line)
  const [activeGuideY, setActiveGuideY] = useState<number | null>(null);
  const yardGuides = useMemo(() => getKeyYardGuides(displayLosY), [displayLosY]);

  // Compute effective players based on viewMode
  const effectivePlayers = useMemo(() => {
    const offenseList = play.players.filter((p) => p.team === 'offense');
    const defenseList = play.players.filter((p) => p.team === 'defense');
    const defSchemeData = DEFENSE_SCHEMES_DATA[defenseScheme] || DEFENSE_SCHEMES_DATA.cover2;

    if (viewMode === 'offense') {
      return offenseList.length > 0 ? offenseList : DEFAULT_OFFENSIVE_PLAYERS;
    }

    if (viewMode === 'defense') {
      return defenseList.length > 0 ? defenseList : defSchemeData.players;
    }

    // Matchup 5v5 Mode
    if (defenseList.length > 0 && offenseList.length > 0) {
      return play.players;
    } else if (defenseList.length > 0) {
      return [...DEFAULT_OFFENSIVE_PLAYERS, ...defenseList];
    } else {
      return [...offenseList, ...defSchemeData.players];
    }
  }, [play.players, viewMode, defenseScheme]);

  // Display players (incorporates transient drag override instantly without root app re-renders)
  const displayPlayers = useMemo(() => {
    if (!dragPlayerPos) return effectivePlayers;
    return effectivePlayers.map((p) =>
      p.id === dragPlayerPos.id ? { ...p, x: dragPlayerPos.x, y: dragPlayerPos.y } : p
    );
  }, [effectivePlayers, dragPlayerPos]);

  // Compute effective routes based on viewMode
  const effectiveRoutes = useMemo(() => {
    const offenseIds = new Set(play.players.filter((p) => p.team === 'offense').map((p) => p.id));
    const defenseIds = new Set(play.players.filter((p) => p.team === 'defense').map((p) => p.id));
    const defSchemeData = DEFENSE_SCHEMES_DATA[defenseScheme] || DEFENSE_SCHEMES_DATA.cover2;

    if (viewMode === 'offense') {
      return play.routes.filter((r) => offenseIds.has(r.playerId));
    }

    if (viewMode === 'defense') {
      if (defenseIds.size > 0) {
        return play.routes.filter((r) => defenseIds.has(r.playerId));
      }
      return defSchemeData.routes;
    }

    // Matchup Mode
    if (defenseIds.size > 0) {
      return play.routes;
    } else {
      return [...play.routes, ...defSchemeData.routes];
    }
  }, [play.routes, play.players, viewMode, defenseScheme]);

  // Display routes (dynamically anchors route origin to the dragged player, and rusher target to QB)
  const displayRoutes = useMemo(() => {
    const rusher = displayPlayers.find((p) => p.role === 'RUSH');
    const qb = displayPlayers.find((p) => p.role === 'QB' || p.label.toUpperCase() === 'QB') || displayPlayers.find((p) => p.team === 'offense');

    return effectiveRoutes.map((r) => {
      let points = r.points || [];
      if (dragPlayerPos && r.playerId === dragPlayerPos.id && points.length > 0) {
        points = [{ ...points[0], x: dragPlayerPos.x, y: dragPlayerPos.y }, ...points.slice(1)];
      }
      // El rusher siempre se queda con el QB: su ruta recta apunta directamente al QB
      if (rusher && qb && r.playerId === rusher.id && (r.actionType === 'rush' || points.length <= 2)) {
        const startX = dragPlayerPos?.id === rusher.id ? dragPlayerPos.x : rusher.x;
        const startY = dragPlayerPos?.id === rusher.id ? dragPlayerPos.y : rusher.y;
        const endX = dragPlayerPos?.id === qb.id ? dragPlayerPos.x : qb.x;
        const endY = dragPlayerPos?.id === qb.id ? dragPlayerPos.y : qb.y;
        points = [
          { x: startX, y: startY },
          { x: endX, y: endY },
        ];
      }
      return { ...r, points };
    });
  }, [effectiveRoutes, dragPlayerPos, displayPlayers]);

  // Compute effective defensive zones (from custom play or scheme presets)
  const effectiveZones = useMemo<ZoneCoverage[]>(() => {
    if (viewMode === 'offense') return [];
    if (play.zones !== undefined && play.zones.length > 0) {
      return play.zones;
    }
    if (defenseScheme === 'blitz') return [];
    const defSchemeData = DEFENSE_SCHEMES_DATA[defenseScheme] || DEFENSE_SCHEMES_DATA.cover2;
    return defSchemeData.zones || [];
  }, [play.zones, defenseScheme, viewMode]);

  // Stable refs for callbacks and values to decouple window listeners from render cycles
  const onUpdatePlayerPositionRef = useRef(onUpdatePlayerPosition);
  onUpdatePlayerPositionRef.current = onUpdatePlayerPosition;

  const onUpdateLosYRef = useRef(onUpdateLosY);
  onUpdateLosYRef.current = onUpdateLosY;

  const onAddOrUpdateRouteRef = useRef(onAddOrUpdateRoute);
  onAddOrUpdateRouteRef.current = onAddOrUpdateRoute;

  const onAddOrUpdateZoneRef = useRef(onAddOrUpdateZone);
  onAddOrUpdateZoneRef.current = onAddOrUpdateZone;

  const effectivePlayersRef = useRef(effectivePlayers);
  effectivePlayersRef.current = effectivePlayers;

  const effectiveRoutesRef = useRef(effectiveRoutes);
  effectiveRoutesRef.current = effectiveRoutes;

  const playRef = useRef(play);
  playRef.current = play;

  const zoneShapeRef = useRef(zoneShape);
  zoneShapeRef.current = zoneShape;

  // Display defensive zones (incorporates live transient resize/move overrides)
  const displayZones = useMemo(() => {
    if (!editingZone) return effectiveZones;
    return effectiveZones.map((z) =>
      z.id === editingZone.zoneId
        ? { ...z, cx: editingZone.cx, cy: editingZone.cy, rx: editingZone.rx, ry: editingZone.ry }
        : z
    );
  }, [effectiveZones, editingZone]);

  const displayZonesRef = useRef(displayZones);
  displayZonesRef.current = displayZones;

  // Map of defender ID -> ZoneCoverage (with role & suffix fallback)
  const defenderZoneMap = useMemo(() => {
    const map = new Map<string, ZoneCoverage>();
    displayZones.forEach((z) => {
      map.set(z.playerId, z);
      const matchingPlayer = effectivePlayers.find(
        (p) =>
          p.id === z.playerId ||
          (z.playerId.startsWith('def_') && p.role?.toLowerCase() === z.playerId.replace('def_', '').toLowerCase()) ||
          (p.team === 'defense' && p.role === (z as any).role)
      );
      if (matchingPlayer) {
        map.set(matchingPlayer.id, z);
      }
    });
    return map;
  }, [displayZones, effectivePlayers]);

  // Convert pointer event client coordinates to normalized percentage (0-100 X, 0-140 Y)
  // Uses exact SVG Screen CTM Inverse Matrix to guarantee 100% precision with zero letterboxing offset
  const getFieldCoords = useCallback((e: React.PointerEvent | PointerEvent | MouseEvent | TouchEvent): Point | null => {
    const svg = svgRef.current;
    if (!svg) return null;

    let clientX = 0;
    let clientY = 0;

    if ('clientX' in e && typeof e.clientX === 'number') {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if ('touches' in e && (e as TouchEvent).touches && (e as TouchEvent).touches.length > 0) {
      clientX = (e as TouchEvent).touches[0].clientX;
      clientY = (e as TouchEvent).touches[0].clientY;
    } else if ('changedTouches' in e && (e as TouchEvent).changedTouches && (e as TouchEvent).changedTouches.length > 0) {
      clientX = (e as TouchEvent).changedTouches[0].clientX;
      clientY = (e as TouchEvent).changedTouches[0].clientY;
    } else {
      return null;
    }

    try {
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgPt = pt.matrixTransform(ctm.inverse());
        return {
          x: Math.max(0, Math.min(100, svgPt.x)),
          y: Math.max(0, Math.min(140, svgPt.y)),
        };
      }
    } catch {
      // Fallback in case CTM inverse is not available
    }

    const rect = svg.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(140, ((clientY - rect.top) / rect.height) * 140));
    return { x, y };
  }, [svgRef]);

  // Identify Quarterback (Passer)
  const qbPlayer = useMemo(() => {
    return (
      effectivePlayers.find((p) => p.role === 'QB' || p.label.toUpperCase() === 'QB') ||
      effectivePlayers.find((p) => p.team === 'offense' && p.role !== 'RUSH') ||
      effectivePlayers[0]
    );
  }, [effectivePlayers]);

  // Target receiver is the selected player or the primary read / WR1
  const targetReceiver = useMemo(() => {
    const offensePlayers = effectivePlayers.filter((p) => p.team === 'offense');
    return getTargetReceiver(offensePlayers, qbPlayer?.id, effectiveRoutes, selectedPlayerId);
  }, [effectivePlayers, qbPlayer, effectiveRoutes, selectedPlayerId]);

  // Compute pass flight and catch milestones
  const passTimings = useMemo(() => {
    const qbRoute = effectiveRoutes.find((r) => r.playerId === qbPlayer?.id);
    const targetRoute = targetReceiver ? effectiveRoutes.find((r) => r.playerId === targetReceiver.id) : null;
    const targetSpeed = targetReceiver ? BASE_SPRINT_SPEED * ((targetReceiver.speedRating || 88) / 88) : BASE_SPRINT_SPEED;
    const defensePlayers = effectivePlayers.filter((p) => p.team === 'defense');
    return calculatePassTimings(qbPlayer, qbRoute, targetReceiver, targetRoute, targetSpeed, defensePlayers, play.losY);
  }, [qbPlayer, targetReceiver, effectiveRoutes, effectivePlayers, play.losY]);

  // Check if current scheme is Man-to-Man
  const isManCoverage = defenseScheme === 'cover1' || defenseScheme === 'blitz';

  // Compute Man-to-Man Defender -> Receiver assignments
  const defenderAssignments = useMemo(() => {
    const offenseReceivers = effectivePlayers.filter((p) => p.team === 'offense' && p.role !== 'QB');
    const sortedReceivers = [...offenseReceivers].sort((a, b) => a.x - b.x);
    const defensePlayers = effectivePlayers.filter((p) => p.team === 'defense');
    const nonRushDefenders = defensePlayers.filter((p) => p.role !== 'RUSH');
    const sortedDefenders = [...nonRushDefenders].sort((a, b) => a.x - b.x);

    const map = new Map<string, Player>();
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

      if (closestRec) {
        assignedReceiverIds.add((closestRec as Player).id);
        map.set(defender.id, closestRec);
      } else if (sortedReceivers.length > 0) {
        const fallback = [...sortedReceivers].sort((a, b) => Math.abs(defender.x - a.x) - Math.abs(defender.x - b.x))[0];
        map.set(defender.id, fallback);
      }
    });

    // El rusher SIEMPRE se queda con el QB (cobertura personal directa)
    const rushers = defensePlayers.filter((p) => p.role === 'RUSH');
    rushers.forEach((r) => {
      if (qbPlayer) {
        map.set(r.id, qbPlayer);
      }
    });

    return map;
  }, [effectivePlayers, qbPlayer]);

  // Calculate dynamic player positions during playback with RAC sprint and full defensive pursuit
  const animatedPlayerPositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number; angle: number }>();
    const currentPlayTimeSec = Math.max(0, playback.progress * BASE_DURATION_SEC);

    // 1. Calculate Offensive Player Positions
    const offensePlayers = effectivePlayers.filter((p) => p.team === 'offense');
    const qb = qbPlayer || offensePlayers[0];

    offensePlayers.forEach((player) => {
      const route = effectiveRoutes.find((r) => r.playerId === player.id);
      const athleteSpeed = BASE_SPRINT_SPEED * ((player.speedRating || 88) / 88);

      // QB logic
      if (player.id === qb?.id) {
        if (route && route.points.length >= 2 && currentPlayTimeSec > 0) {
          const animated = getPositionAtTime(route.points, currentPlayTimeSec, athleteSpeed, player.delaySec || 0);
          map.set(player.id, animated);
        } else {
          map.set(player.id, { x: player.x, y: player.y, angle: 0 });
        }
        return;
      }

      // TARGET RECEIVER (RUN AFTER CATCH & TOUCHDOWN SPRINT):
      // Receiver follows assigned route completely, and seamlessly continues forward to touchdown without jumping
      if (player.id === targetReceiver?.id) {
        const animated = getCarrierLivePosition(
          player,
          route,
          athleteSpeed,
          player.delaySec || 0,
          currentPlayTimeSec,
          passTimings.catchTimeSec
        );
        map.set(player.id, animated);
        return;
      }

      // Handle Pre-Snap Motion at constant walking speed
      if (player.hasMotion) {
        const motionTargetX = player.motionTargetX ?? (player.x < 50 ? player.x + 30 : player.x - 30);
        const motionDurationSec = 0.5; // Motion takes 0.5s smoothly
        if (currentPlayTimeSec <= 0) {
          map.set(player.id, { x: player.x, y: player.y, angle: 0 });
          return;
        } else if (currentPlayTimeSec < motionDurationSec) {
          const motionT = currentPlayTimeSec / motionDurationSec;
          const currentX = player.x + (motionTargetX - player.x) * motionT;
          map.set(player.id, { x: currentX, y: player.y, angle: motionTargetX > player.x ? 0 : 180 });
          return;
        } else {
          const postMotionTime = currentPlayTimeSec - motionDurationSec;
          if (route && route.points.length >= 2) {
            const animated = getPositionAtTime(route.points, postMotionTime, athleteSpeed, player.delaySec || 0);
            map.set(player.id, animated);
          } else {
            map.set(player.id, { x: motionTargetX, y: player.y, angle: 0 });
          }
          return;
        }
      }

      if (route && route.points.length >= 2 && currentPlayTimeSec > 0) {
        const animated = getPositionAtTime(route.points, currentPlayTimeSec, athleteSpeed, player.delaySec || 0);
        map.set(player.id, animated);
      } else {
        map.set(player.id, { x: player.x, y: player.y, angle: 0 });
      }
    });

    const qbPos = qb ? map.get(qb.id) || { x: qb.x, y: qb.y, angle: 0 } : { x: 50, y: 92, angle: 0 };
    const qbRoute = qb ? effectiveRoutes.find((r) => r.playerId === qb.id) : undefined;
    const qbAthleteSpeed = qb ? BASE_SPRINT_SPEED * ((qb.speedRating || 88) / 88) : BASE_SPRINT_SPEED;
    const getQbPosAtT = (t: number) => {
      if (!qb) return qbPos;
      if (qbRoute && qbRoute.points.length >= 2 && t > 0) {
        return getPositionAtTime(qbRoute.points, t, qbAthleteSpeed, qb.delaySec || 0);
      }
      return { x: qb.x, y: qb.y };
    };

    // Function to sample carrier's live coordinates at any time t
    const getCarrierPosAtT = (t: number) => {
      if (!targetReceiver) return qbPos;
      const tRoute = effectiveRoutes.find((r) => r.playerId === targetReceiver.id);
      const tSpeed = BASE_SPRINT_SPEED * ((targetReceiver.speedRating || 88) / 88);
      return getCarrierLivePosition(
        targetReceiver,
        tRoute,
        tSpeed,
        targetReceiver.delaySec || 0,
        t,
        passTimings.catchTimeSec
      );
    };

    // 2. Calculate Defensive Player Positions (Continuous physical integration at assigned speed)
    const defensePlayers = effectivePlayers.filter((p) => p.team === 'defense');

    const getOffensiveThreatsAtT = (time: number) => {
      const isPostCatch = time >= passTimings.catchTimeSec;
      return offensePlayers.map((p) => {
        const isCarrier = isPostCatch ? p.id === targetReceiver?.id : p.id === qb?.id;
        let pos: { x: number; y: number };
        if (p.id === targetReceiver?.id) {
          pos = getCarrierPosAtT(time);
        } else if (p.id === qb?.id) {
          pos = getQbPosAtT(time);
        } else {
          const r = effectiveRoutes.find((rt) => rt.playerId === p.id);
          const spd = BASE_SPRINT_SPEED * ((p.speedRating || 88) / 88);
          if (r && r.points && r.points.length >= 2) {
            pos = getPositionAtTime(r.points, time, spd, p.delaySec || 0);
          } else {
            pos = { x: p.x, y: p.y };
          }
        }
        return { id: p.id, x: pos.x, y: pos.y, isCarrier };
      });
    };

    defensePlayers.forEach((player) => {
      const defAthleteSpeed = BASE_SPRINT_SPEED * ((player.speedRating || 88) / 88);
      const assignedZone = defenderZoneMap.get(player.id);
      const assignedReceiver = isManCoverage && !assignedZone ? defenderAssignments.get(player.id) : undefined;
      const assignedReceiverRoute = assignedReceiver ? effectiveRoutes.find((r) => r.playerId === assignedReceiver.id) : undefined;
      const assignedReceiverSpeed = assignedReceiver ? BASE_SPRINT_SPEED * ((assignedReceiver.speedRating || 88) / 88) : BASE_SPRINT_SPEED;

      const assignedReceiverPos = assignedReceiver
        ? (time: number) => {
            if (assignedReceiverRoute && assignedReceiverRoute.points && assignedReceiverRoute.points.length >= 2) {
              return getPositionAtTime(assignedReceiverRoute.points, Math.max(0, time - 0.15), assignedReceiverSpeed, assignedReceiver.delaySec || 0);
            }
            return { x: assignedReceiver.x, y: assignedReceiver.y };
          }
        : undefined;

      const route = effectiveRoutes.find((r) => r.playerId === player.id);

      const defenderPos = computeDefenderPositionAtTime({
        defender: player,
        defSpeed: defAthleteSpeed,
        t: currentPlayTimeSec,
        losY: play.losY,
        releaseTimeSec: passTimings.releaseTimeSec,
        catchTimeSec: passTimings.catchTimeSec,
        targetCatchPos: passTimings.targetCatchPos,
        getCarrierPos: getCarrierPosAtT,
        qbPos: getQbPosAtT,
        assignedZone,
        assignedReceiverPos,
        route,
        getOffensiveThreats: getOffensiveThreatsAtT,
      });

      map.set(player.id, defenderPos);
    });

    return map;
  }, [
    effectivePlayers,
    effectiveRoutes,
    playback.progress,
    isManCoverage,
    defenderAssignments,
    defenderZoneMap,
    targetReceiver,
    qbPlayer,
    passTimings,
  ]);

  // Compute Next Gen Analytics & Live Separation Engine
  const analytics = useMemo(() => {
    // Return cached analytics during active dragging to keep 60-120 FPS buttery smooth
    if ((dragPlayerPos || dragLosY !== null || editingZone !== null) && cachedAnalyticsRef.current) {
      return cachedAnalyticsRef.current;
    }
    const result = computeNextGenAnalytics(
      effectivePlayers,
      effectiveRoutes,
      animatedPlayerPositions,
      playback.progress,
      targetReceiver,
      qbPlayer,
      play.losY,
      BASE_DURATION_SEC
    );
    cachedAnalyticsRef.current = result;
    return result;
  }, [effectivePlayers, effectiveRoutes, animatedPlayerPositions, playback.progress, targetReceiver, qbPlayer, play.losY, dragPlayerPos, dragLosY, editingZone]);

  // Finalize route helper
  const finalizeRoute = useCallback(() => {
    if (!isDrawingRouteRef.current || !activeRoutePlayerIdRef.current) return;
    const pts = drawingPointsRef.current;
    const activeId = activeRoutePlayerIdRef.current;

    if (pts.length >= 2) {
      const actionType: ActionType = 'run';
      const player = effectivePlayers.find((p) => p.id === activeId);
      const color = player?.color || '#facc15';

      // Clean freehand jitter only if user drew a long stroke
      const finalizedPoints = snapEnabled && pts.length > 5
        ? simplifyPath(pts)
        : pts.map((p) => ({ ...p }));

      if (player) {
        finalizedPoints[0] = { x: player.x, y: player.y, action: 'start' };
      }
      finalizedPoints[finalizedPoints.length - 1] = {
        ...finalizedPoints[finalizedPoints.length - 1],
        action: 'end',
      };

      if (snapEnabled && finalizedPoints.length > 0) {
        const lastIdx = finalizedPoints.length - 1;
        const snapRes = snapToGuides(finalizedPoints[lastIdx], yardGuides, 2.5);
        if (snapRes.snapped) {
          finalizedPoints[lastIdx] = snapRes.point;
        }
      }

      const newRoute: Route = {
        id: `route_${activeId}_${Date.now()}`,
        playerId: activeId,
        actionType,
        color,
        points: finalizedPoints,
      };

      onAddOrUpdateRoute(newRoute);
    }

    isDrawingRouteRef.current = false;
    activeRoutePlayerIdRef.current = null;
    drawingPointsRef.current = [];
    setIsDrawingRoute(false);
    setActiveRoutePlayerId(null);
    setDrawingPoints([]);
  }, [currentMode, effectivePlayers, snapEnabled, yardGuides, onAddOrUpdateRoute]);

  // Cancel route drawing helper
  const cancelRouteDrawing = useCallback(() => {
    isDrawingRouteRef.current = false;
    activeRoutePlayerIdRef.current = null;
    drawingPointsRef.current = [];
    setIsDrawingRoute(false);
    setActiveRoutePlayerId(null);
    setDrawingPoints([]);
  }, []);

  const finalizeRouteRef = useRef(finalizeRoute);
  finalizeRouteRef.current = finalizeRoute;

  const cancelRouteDrawingRef = useRef(cancelRouteDrawing);
  cancelRouteDrawingRef.current = cancelRouteDrawing;

  // Cancel route drawing when user changes tool mode
  useEffect(() => {
    if (currentMode !== 'draw' && isDrawingRouteRef.current) {
      cancelRouteDrawing();
    }
  }, [currentMode, cancelRouteDrawing]);

  // Keyboard shortcut: Escape to cancel, Enter to finish route
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawingRouteRef.current) {
        cancelRouteDrawing();
      } else if (e.key === 'Enter' && isDrawingRouteRef.current) {
        finalizeRoute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finalizeRoute, cancelRouteDrawing]);

  // Handle pointer down on a player chip directly
  const handlePlayerPointerDown = (e: React.PointerEvent, player: Player) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentMode === 'select') {
      onSelectPlayer(player);
      draggingPlayerIdRef.current = player.id;
    } else if (currentMode === 'draw') {
      if (playback.progress > 0 && onResetPlayback) {
        onResetPlayback();
      }

      onSelectPlayer(player);
      draggingPlayerIdRef.current = null;

      // Start route directly from the player's true coordinates
      const startPt: Point = { x: player.x, y: player.y, action: 'start' };
      isDrawingRouteRef.current = true;
      activeRoutePlayerIdRef.current = player.id;
      drawingPointsRef.current = [startPt];

      setIsDrawingRoute(true);
      setActiveRoutePlayerId(player.id);
      setDrawingPoints([startPt]);
    } else if (currentMode === 'draw_zone') {
      draggingPlayerIdRef.current = null;
      if (player.team === 'defense' && player.role !== 'RUSH') {
        const zoneObj = {
          startX: player.x,
          startY: player.y,
          currentX: player.x,
          currentY: player.y,
          playerId: player.id,
        };
        drawingZoneRef.current = zoneObj;
        setDrawingZone(zoneObj);
      }
    } else if (currentMode === 'erase_route') {
      const playerRoute = effectiveRoutes.find((r) => r.playerId === player.id);
      if (playerRoute) {
        onDeleteRoute(playerRoute.id);
      }
      const playerZone = effectiveZones.find((z) => z.playerId === player.id);
      if (playerZone && onDeleteZone) {
        onDeleteZone(playerZone.id);
      }
    }
  };

  // Handle pointer down on SVG field canvas
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const coords = getFieldCoords(e);
    if (!coords) return;

    if (currentMode === 'select') {
      // Check if clicked near Line of Scrimmage
      const isNearLos = Math.abs(coords.y - displayLosY) < 3.2;
      if (isNearLos) {
        draggingLosRef.current = true;
        return;
      }
      onSelectPlayer(null);
    } else if (currentMode === 'draw') {
      // Snap to closest player near click (generous 8.5 unit radius)
      let targetPlayer: Player | null = null;
      let minDist = 99999;
      for (const p of effectivePlayers) {
        const d = getDistance({ x: p.x, y: p.y }, coords);
        if (d < minDist) {
          minDist = d;
          targetPlayer = p;
        }
      }

      if (targetPlayer && minDist <= 8.5) {
        const playerToSnap = targetPlayer as Player;
        if (playback.progress > 0 && onResetPlayback) {
          onResetPlayback();
        }
        onSelectPlayer(playerToSnap);
        draggingPlayerIdRef.current = null;

        const startPt: Point = { x: playerToSnap.x, y: playerToSnap.y, action: 'start' };
        isDrawingRouteRef.current = true;
        activeRoutePlayerIdRef.current = playerToSnap.id;
        drawingPointsRef.current = [startPt];

        setIsDrawingRoute(true);
        setActiveRoutePlayerId(playerToSnap.id);
        setDrawingPoints([startPt]);
      }
    } else if (currentMode === 'draw_zone') {
      // Target defender is selected defender or nearest defensive player
      const defensePlayers = effectivePlayers.filter((p) => p.team === 'defense' && p.role !== 'RUSH');
      let targetDefender: Player | null = null;
      let minDist = 99999;
      for (const p of defensePlayers) {
        const d = getDistance({ x: p.x, y: p.y }, coords);
        if (d < minDist) {
          minDist = d;
          targetDefender = p;
        }
      }

      if (targetDefender && minDist <= 12) {
        const defenderToSnap = targetDefender as Player;
        onSelectPlayer(defenderToSnap);
        const zoneObj = {
          startX: coords.x,
          startY: coords.y,
          currentX: coords.x,
          currentY: coords.y,
          playerId: defenderToSnap.id,
        };
        drawingZoneRef.current = zoneObj;
        setDrawingZone(zoneObj);
      }
    }
  };

  // Handle pointer down on interactive zone handles (center move or edge resize)
  const handleZoneHandlePointerDown = useCallback((
    e: React.PointerEvent,
    zone: ZoneCoverage,
    handleType:
      | 'center'
      | 'left'
      | 'right'
      | 'top'
      | 'bottom'
      | 'corner'
      | 'corner_nw'
      | 'corner_ne'
      | 'corner_sw'
      | 'corner_se'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Reset playback if running
    if (playback.progress > 0 && onResetPlayback) {
      onResetPlayback();
    }

    // Select the player who owns this zone
    const ownerPlayer = effectivePlayers.find((p) => p.id === zone.playerId);
    if (ownerPlayer) {
      onSelectPlayer(ownerPlayer);
    }

    const coords = getFieldCoords(e);
    if (!coords) return;

    draggingZoneHandleRef.current = {
      zoneId: zone.id,
      handleType,
      initialCx: zone.cx,
      initialCy: zone.cy,
      initialRx: zone.rx,
      initialRy: zone.ry,
      startFieldCoords: coords,
    };
    lastZoneEditRef.current = {
      zoneId: zone.id,
      cx: zone.cx,
      cy: zone.cy,
      rx: zone.rx,
      ry: zone.ry,
    };
  }, [playback.progress, onResetPlayback, effectivePlayers, onSelectPlayer, getFieldCoords]);

  // Handle pointer down on Stop & Go badge to begin sliding along route trajectory
  const handleStopBadgePointerDown = useCallback((e: React.PointerEvent, route: Route, pt: Point) => {
    e.preventDefault();
    e.stopPropagation();

    // Reset playback if playing
    if (playback.progress > 0 && onResetPlayback) {
      onResetPlayback();
    }

    // Select the player who owns this route
    const ownerPlayer = effectivePlayers.find((p) => p.id === route.playerId);
    if (ownerPlayer) {
      onSelectPlayer(ownerPlayer);
    }

    const basePoints = getRouteBasePoints(route.points);
    const pauseDuration = pt.pauseDuration || (pt.action === 'stop_and_go' ? 0.6 : 0.8);

    draggingStopBadgeRef.current = {
      routeId: route.id,
      playerId: route.playerId,
      pauseDuration,
      basePoints,
    };
    setIsDraggingStopBadge(true);
  }, [playback.progress, onResetPlayback, effectivePlayers, onSelectPlayer]);

  // Window-level pointer move and up handlers to guarantee 100% fluid dragging and drawing (60-120 FPS)
  useEffect(() => {
    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!draggingPlayerIdRef.current && !draggingLosRef.current && !isDrawingRouteRef.current && !drawingZoneRef.current && !draggingStopBadgeRef.current && !draggingZoneHandleRef.current) return;
      e.preventDefault();

      const coords = getFieldCoords(e);
      if (!coords) return;

      // Handle interactive Zone Handle dragging (move center or resize edges with anchored opposite side)
      if (draggingZoneHandleRef.current) {
        const { zoneId, handleType, initialCx, initialCy, initialRx, initialRy, startFieldCoords } = draggingZoneHandleRef.current;
        let newCx = initialCx;
        let newCy = initialCy;
        let newRx = initialRx;
        let newRy = initialRy;

        const fixedLeft = initialCx - initialRx;
        const fixedRight = initialCx + initialRx;
        const fixedTop = initialCy - initialRy;
        const fixedBottom = initialCy + initialRy;

        if (handleType === 'center') {
          // Free repositioning of the whole zone (preserves rx, ry)
          const deltaX = coords.x - startFieldCoords.x;
          const deltaY = coords.y - startFieldCoords.y;
          newCx = Math.max(initialRx, Math.min(100 - initialRx, initialCx + deltaX));
          newCy = Math.max(initialRy, Math.min(140 - initialRy, initialCy + deltaY));
        } else if (handleType === 'right') {
          // Anchored: Left edge (fixedLeft) stays completely fixed in place
          const clampedX = Math.max(fixedLeft + 4, Math.min(100, coords.x));
          newRx = (clampedX - fixedLeft) / 2;
          newCx = fixedLeft + newRx;
        } else if (handleType === 'left') {
          // Anchored: Right edge (fixedRight) stays completely fixed in place
          const clampedX = Math.max(0, Math.min(fixedRight - 4, coords.x));
          newRx = (fixedRight - clampedX) / 2;
          newCx = fixedRight - newRx;
        } else if (handleType === 'top') {
          // Anchored: Bottom edge (fixedBottom) stays completely fixed in place
          const clampedY = Math.max(0, Math.min(fixedBottom - 3, coords.y));
          newRy = (fixedBottom - clampedY) / 2;
          newCy = fixedBottom - newRy;
        } else if (handleType === 'bottom') {
          // Anchored: Top edge (fixedTop) stays completely fixed in place
          const clampedY = Math.max(fixedTop + 3, Math.min(140, coords.y));
          newRy = (clampedY - fixedTop) / 2;
          newCy = fixedTop + newRy;
        } else if (handleType === 'corner' || handleType === 'corner_se') {
          // Anchored: Top-Left corner (fixedLeft, fixedTop) stays completely fixed in place
          const clampedX = Math.max(fixedLeft + 4, Math.min(100, coords.x));
          const clampedY = Math.max(fixedTop + 3, Math.min(140, coords.y));
          newRx = (clampedX - fixedLeft) / 2;
          newCx = fixedLeft + newRx;
          newRy = (clampedY - fixedTop) / 2;
          newCy = fixedTop + newRy;
        } else if (handleType === 'corner_nw') {
          // Anchored: Bottom-Right corner (fixedRight, fixedBottom) stays completely fixed in place
          const clampedX = Math.max(0, Math.min(fixedRight - 4, coords.x));
          const clampedY = Math.max(0, Math.min(fixedBottom - 3, coords.y));
          newRx = (fixedRight - clampedX) / 2;
          newCx = fixedRight - newRx;
          newRy = (fixedBottom - clampedY) / 2;
          newCy = fixedBottom - newRy;
        } else if (handleType === 'corner_ne') {
          // Anchored: Bottom-Left corner (fixedLeft, fixedBottom) stays completely fixed in place
          const clampedX = Math.max(fixedLeft + 4, Math.min(100, coords.x));
          const clampedY = Math.max(0, Math.min(fixedBottom - 3, coords.y));
          newRx = (clampedX - fixedLeft) / 2;
          newCx = fixedLeft + newRx;
          newRy = (fixedBottom - clampedY) / 2;
          newCy = fixedBottom - newRy;
        } else if (handleType === 'corner_sw') {
          // Anchored: Top-Right corner (fixedRight, fixedTop) stays completely fixed in place
          const clampedX = Math.max(0, Math.min(fixedRight - 4, coords.x));
          const clampedY = Math.max(fixedTop + 3, Math.min(140, coords.y));
          newRx = (fixedRight - clampedX) / 2;
          newCx = fixedRight - newRx;
          newRy = (clampedY - fixedTop) / 2;
          newCy = fixedTop + newRy;
        }

        lastZoneEditRef.current = {
          zoneId,
          cx: newCx,
          cy: newCy,
          rx: newRx,
          ry: newRy,
        };

        if (zoneEditRafRef.current === null) {
          zoneEditRafRef.current = requestAnimationFrame(() => {
            zoneEditRafRef.current = null;
            if (lastZoneEditRef.current) {
              setEditingZone({ ...lastZoneEditRef.current });
            }
          });
        }
        return;
      }

      if (draggingStopBadgeRef.current) {
        // Slide Stop & Go badge strictly along route trajectory (throttled via RAF)
        if (stopBadgeRafRef.current === null) {
          stopBadgeRafRef.current = requestAnimationFrame(() => {
            stopBadgeRafRef.current = null;
            if (draggingStopBadgeRef.current) {
              const { routeId, pauseDuration, basePoints } = draggingStopBadgeRef.current;
              const targetRoute = effectiveRoutesRef.current.find((r) => r.id === routeId);
              if (targetRoute) {
                const updatedPoints = insertStopAlongPolyline(basePoints, coords, pauseDuration);
                onAddOrUpdateRouteRef.current({
                  ...targetRoute,
                  points: updatedPoints,
                }, true); // skipHistory = true during active drag
              }
            }
          });
        }
        return;
      }

      if (draggingPlayerIdRef.current) {
        const draggingPlayer = effectivePlayersRef.current.find((p) => p.id === draggingPlayerIdRef.current);
        let targetX = coords.x;
        let targetY = coords.y;
        if (draggingPlayer?.team === 'defense') {
          // Defenders cannot cross the Line of Scrimmage into the offense
          targetY = Math.min(playRef.current.losY - 0.5, targetY);
        }
        lastDragCoordsRef.current = { id: draggingPlayerIdRef.current, x: targetX, y: targetY };
        if (dragRafRef.current === null) {
          dragRafRef.current = requestAnimationFrame(() => {
            dragRafRef.current = null;
            if (lastDragCoordsRef.current) {
              setDragPlayerPos({ ...lastDragCoordsRef.current });
            }
          });
        }
      } else if (draggingLosRef.current) {
        const clampedY = Math.max(25, Math.min(125, coords.y));
        lastLosYRef.current = clampedY;
        if (losRafRef.current === null) {
          losRafRef.current = requestAnimationFrame(() => {
            losRafRef.current = null;
            if (lastLosYRef.current !== null) {
              setDragLosY(lastLosYRef.current);
            }
          });
        }
      } else if (drawingZoneRef.current) {
        const updated = {
          ...drawingZoneRef.current,
          currentX: coords.x,
          currentY: coords.y,
        };
        drawingZoneRef.current = updated;
        setDrawingZone(updated);
      } else if (isDrawingRouteRef.current) {
        const pts = drawingPointsRef.current;
        const lastPoint = pts[pts.length - 1];

        // Smooth sampling threshold: 0.8 units
        if (!lastPoint || getDistance(lastPoint, coords) >= 0.8) {
          const updated = [...pts, coords];
          drawingPointsRef.current = updated;
          setDrawingPoints(updated);
        }
      }
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      // Cancel pending animation frames
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      if (losRafRef.current !== null) {
        cancelAnimationFrame(losRafRef.current);
        losRafRef.current = null;
      }
      if (zoneEditRafRef.current !== null) {
        cancelAnimationFrame(zoneEditRafRef.current);
        zoneEditRafRef.current = null;
      }

      // Commit interactive Zone edit to playbook state
      if (draggingZoneHandleRef.current) {
        if (lastZoneEditRef.current) {
          const finalEdit = lastZoneEditRef.current;
          lastZoneEditRef.current = null;
          setEditingZone(null);

          const existingZone = displayZonesRef.current.find((z) => z.id === finalEdit.zoneId);
          if (existingZone && onAddOrUpdateZoneRef.current) {
            onAddOrUpdateZoneRef.current({
              ...existingZone,
              cx: Number(finalEdit.cx.toFixed(1)),
              cy: Number(finalEdit.cy.toFixed(1)),
              rx: Number(finalEdit.rx.toFixed(1)),
              ry: Number(finalEdit.ry.toFixed(1)),
            });
          }
        } else {
          setEditingZone(null);
        }
        draggingZoneHandleRef.current = null;
      }

      // Commit Stop & Go badge position to history on release
      if (draggingStopBadgeRef.current) {
        const { routeId, pauseDuration, basePoints } = draggingStopBadgeRef.current;
        const targetRoute = effectiveRoutesRef.current.find((r) => r.id === routeId);
        const coords = getFieldCoords(e);
        if (targetRoute && coords) {
          const updatedPoints = insertStopAlongPolyline(basePoints, coords, pauseDuration);
          onAddOrUpdateRouteRef.current({
            ...targetRoute,
            points: updatedPoints,
          }, false);
        } else if (targetRoute) {
          onAddOrUpdateRouteRef.current(targetRoute, false);
        }
        draggingStopBadgeRef.current = null;
        setIsDraggingStopBadge(false);
      }

      // Commit player drag to root state
      if (draggingPlayerIdRef.current) {
        if (lastDragCoordsRef.current) {
          const final = lastDragCoordsRef.current;
          lastDragCoordsRef.current = null;
          setDragPlayerPos(null);
          onUpdatePlayerPositionRef.current(final.id, final.x, final.y);
        } else {
          setDragPlayerPos(null);
        }
        draggingPlayerIdRef.current = null;
      }

      // Commit LOS drag to root state
      if (draggingLosRef.current) {
        if (lastLosYRef.current !== null) {
          const finalLosY = lastLosYRef.current;
          lastLosYRef.current = null;
          setDragLosY(null);
          onUpdateLosYRef.current(finalLosY);
        } else {
          setDragLosY(null);
        }
        draggingLosRef.current = false;
      }

      setActiveGuideY(null);

      // Finalize zone drawing
      if (drawingZoneRef.current) {
        const z = drawingZoneRef.current;
        const defender = effectivePlayersRef.current.find((p) => p.id === z.playerId);
        const defColor = defender?.color || '#a855f7';

        const spanX = Math.abs(z.currentX - z.startX);
        const spanY = Math.abs(z.currentY - z.startY);

        let cx = (z.startX + z.currentX) / 2;
        let cy = (z.startY + z.currentY) / 2;
        let rx = Math.max(12, spanX / 2);
        let ry = Math.max(8, spanY / 2);

        // If clicked without dragging (tiny span), position zone centered at click
        if (spanX < 4 && spanY < 4) {
          cx = z.startX;
          cy = z.startY;
          rx = 16;
          ry = 10;
        }

        // Friendly tactical name based on location
        let name = 'Zona Personalizada';
        if (cy < 38) {
          name = cx < 35 ? 'Deep 1/3 Izq' : cx > 65 ? 'Deep 1/3 Der' : 'Deep Middle';
        } else if (cy < 65) {
          name = cx < 35 ? 'Flat Izq' : cx > 65 ? 'Flat Der' : 'Hook / Curl';
        } else {
          name = 'Zona Corta';
        }

        const newZone: ZoneCoverage = {
          id: `zone_${z.playerId}_${Date.now()}`,
          playerId: z.playerId,
          name,
          shape: zoneShapeRef.current || 'rectangle',
          cx: Math.round(cx),
          cy: Math.round(cy),
          rx: Math.round(rx),
          ry: Math.round(ry),
          color: defColor,
        };

        if (onAddOrUpdateZoneRef.current) {
          onAddOrUpdateZoneRef.current(newZone);
        }

        drawingZoneRef.current = null;
        setDrawingZone(null);
      }

      // Check route drawing release
      if (isDrawingRouteRef.current && activeRoutePlayerIdRef.current) {
        const pts = drawingPointsRef.current;
        if (pts.length >= 2) {
          finalizeRouteRef.current();
        } else {
          cancelRouteDrawingRef.current();
        }
      }
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      if (dragRafRef.current !== null) cancelAnimationFrame(dragRafRef.current);
      if (losRafRef.current !== null) cancelAnimationFrame(losRafRef.current);
      if (stopBadgeRafRef.current !== null) cancelAnimationFrame(stopBadgeRafRef.current);
      if (zoneEditRafRef.current !== null) cancelAnimationFrame(zoneEditRafRef.current);
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [getFieldCoords]);
  const animatedBall = React.useMemo(() => {
    // If no receiver is selected or simulation is at 0, do not launch ball
    if (!targetReceiver || !qbPlayer || playback.progress <= 0) return null;

    const currentPlayTimeSec = playback.progress * BASE_DURATION_SEC;

    const qbPos = animatedPlayerPositions.get(qbPlayer.id) || { x: qbPlayer.x, y: qbPlayer.y, angle: 0 };
    const receiverPos = animatedPlayerPositions.get(targetReceiver.id) || { x: targetReceiver.x, y: targetReceiver.y, angle: 0 };

    // Use synchronized pass timings
    const releaseTimeSec = passTimings.releaseTimeSec;
    const releaseProgress = releaseTimeSec / BASE_DURATION_SEC;
    const catchTimeSec = passTimings.catchTimeSec;
    const catchProgress = Math.min(0.95, catchTimeSec / BASE_DURATION_SEC);
    const qbReleasePos = passTimings.qbReleasePos;
    const targetCatchPos = passTimings.targetCatchPos;
    const passDistance = Math.max(8, getDistance(qbReleasePos, targetCatchPos));

    // Phase 1: Before release, ball is held by QB
    if (playback.progress < releaseProgress) {
      const sway = Math.sin(currentPlayTimeSec * 6) * 0.3;
      return {
        x: qbPos.x + 0.8,
        y: qbPos.y - 0.4 + sway,
        groundY: qbPos.y,
        inAir: false,
        altitude: 0,
        rotation: -25,
        scale: 0.9,
        spiralAngle: 0,
      };
    }

    // Phase 2: In Flight (Parabolic Ballistic Arc + Dynamic Aerodynamics)
    if (playback.progress < catchProgress) {
      const flightT = Math.max(0, Math.min(1, (playback.progress - releaseProgress) / (catchProgress - releaseProgress)));
      
      const fromX = qbReleasePos.x;
      const fromY = qbReleasePos.y;
      const toX = targetCatchPos.x;
      const toY = targetCatchPos.y;

      // 2D position on turf
      const groundX = fromX + (toX - fromX) * flightT;
      const groundY = fromY + (toY - fromY) * flightT;

      // Heading angle along flight path
      const dx = toX - fromX;
      const dy = toY - fromY;
      const headingAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

      // Identify if throw is a short dump/shovel flip (< 6 yds) or a backward lateral
      const isBackwardOrShort = dy >= -1.0 || passDistance < 12.0;

      // Peak altitude depends on throw distance (Bullet stays low, deep pass climbs high)
      const isBullet = passDistance < 18;
      const isDeep = passDistance > 32;
      const peakAltitude = isBackwardOrShort ? 2.5 : isBullet ? 4.5 : isDeep ? 15.0 : 9.0;
      
      // Parabolic altitude arc z(t) = sin(t * PI) * H_peak
      const altitude = Math.sin(flightT * Math.PI) * peakAltitude;

      let rotation: number;
      if (isBackwardOrShort) {
        // Rotates / flips horizontally end-over-end for short flips or backward pitches
        rotation = headingAngleDeg + 90 + (flightT * 720);
      } else {
        // Realistic Spiral Bullet: Nose points directly along flight trajectory vector tip-first!
        // Subtle pitch tilt: nose leads slightly up on release, levels at apex, tilts down into receiver's hands
        const pitchTilt = (0.5 - flightT) * (isBullet ? 4.0 : 10.0);
        const wobble = Math.sin(flightT * Math.PI * 8) * (isBullet ? 0.8 : 1.6);
        rotation = headingAngleDeg + pitchTilt + wobble;
      }

      // 3D Perspective scale: ball looks bigger as it rises toward camera
      const scale = 0.85 + (altitude / 16.0) * 0.45;

      // Tight spiral spin frequency around longitudinal axis
      const spiralRevolutions = isDeep ? 6 : isBullet ? 3 : 4;
      const spiralAngle = (flightT * spiralRevolutions * 360) % 360;

      return {
        x: groundX,
        y: groundY - altitude * 0.45,
        groundY,
        inAir: true,
        altitude,
        rotation,
        scale,
        spiralAngle,
      };
    }

    // Phase 3: Caught! Ball is tucked into receiver's running direction
    const receiverAngle = receiverPos.angle !== 0 ? receiverPos.angle : -90;
    return {
      x: receiverPos.x,
      y: receiverPos.y - 0.4,
      groundY: receiverPos.y,
      inAir: false,
      altitude: 0,
      rotation: receiverAngle,
      scale: 0.9,
      spiralAngle: 0,
    };
  }, [targetReceiver, qbPlayer, playback.progress, animatedPlayerPositions, effectiveRoutes, passTimings]);

  // Rush cone Y (7 yards away from LOS = ~14 units)
  const rushConeY = Math.max(10, displayLosY - 14);

  // Active player for route drawing preview color
  const activeDrawingPlayer = displayPlayers.find((p) => p.id === activeRoutePlayerId);
  const activeDrawingColor = activeDrawingPlayer?.color || '#facc15';


  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-row items-center justify-center p-1 sm:p-3 canvas-container select-none overflow-hidden bg-[#050505] gap-3 sm:gap-4"
    >
      {/* 1. Dedicated Field Canvas Box */}
      <div className="relative w-full max-w-[560px] aspect-[10/14] max-h-[85vh] bg-[#020202] rounded-xl shadow-2xl border-2 border-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
        {/* Floating Trigger Pill for NextGen Stats Outside the Field */}
        <div className="absolute top-2.5 right-2.5 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowAnalyticsHud((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold shadow-lg transition-all backdrop-blur-md ${
              showAnalyticsHud
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 ring-1 ring-emerald-500/30'
                : 'bg-[#070d09]/90 text-slate-300 border-[#1e3425] hover:bg-[#121f16] hover:text-white'
            }`}
            title="Mostrar / Ocultar panel de telemetría Next Gen Stats fuera del campo"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-extrabold tracking-wider uppercase font-display">NextGen</span>
            <span className="text-[10px] text-cyan-300 font-mono font-bold bg-[#0c1a11] px-1.5 py-0.5 rounded border border-emerald-800/40">
              {analytics.timeToThrowSec}s
            </span>
          </button>
        </div>

        <svg
          ref={svgRef}
          viewBox="0 0 100 140"
          className="w-full h-full cursor-crosshair touch-none"
          onPointerDown={handleCanvasPointerDown}
          onDoubleClick={() => {
            if (isDrawingRouteRef.current) finalizeRoute();
          }}
        >
          {/* SVG Marker Definitions for Accurate Dynamic Arrowheads & Gradients */}
          <defs>
            {/* 3D Realistic Football Texture & Lighting */}
            <radialGradient id="footballLeather" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="55%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#451a03" />
            </radialGradient>
            <linearGradient id="footballGleam" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>

            {/* Vision Cone Gradient */}
            <radialGradient id="qbVisionGradient" cx="0%" cy="50%" r="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#0284c7" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.0" />
            </radialGradient>

            {/* Passing Lane Gradients */}
            <linearGradient id="passingLaneClear" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="passingLaneBlocked" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f87171" stopOpacity="0.9" />
            </linearGradient>

            {/* Markers for each active route */}
            {displayRoutes.map((route) => {
              const player = displayPlayers.find((p) => p.id === route.playerId);
              const color = route.color || player?.color || '#facc15';
              return (
                <marker
                  key={`marker-${route.id}`}
                  id={`arrow-${route.id}`}
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="4.5"
                  markerHeight="4.5"
                  orient="auto"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={color} />
                </marker>
              );
            })}

            {/* Drawing Preview Marker */}
            <marker
              id="arrow-drawing-preview"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="4.5"
              markerHeight="4.5"
              orient="auto"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={activeDrawingColor} />
            </marker>
          </defs>

          {/* Black Pitch Surface */}
          <rect x="0" y="0" width="100" height="140" fill="#030303" />

          {/* End Zone (Top: 0 to 18) */}
          <rect x="0" y="0" width="100" height="18" fill="#080808" />
          <line x1="0" y1="18" x2="100" y2="18" stroke="#ffffff" strokeWidth="0.8" />
          
          {/* Athletic Diagonal Endzone Stripes */}
          {[0, 20, 40, 60, 80].map((xOffset) => (
            <line
              key={`ez-stripe-${xOffset}`}
              x1={xOffset}
              y1="0"
              x2={xOffset + 18}
              y2="18"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="4"
            />
          ))}

          <text
            x="50"
            y="11.5"
            fill="rgba(255, 255, 255, 0.4)"
            fontSize="5.5"
            fontFamily="'Space Grotesk', sans-serif"
            fontWeight="bold"
            textAnchor="middle"
            letterSpacing="6"
          >
            TECMILENIO
          </text>

          {/* No-Run Zone (18 to 28) */}
          <rect x="0" y="18" width="100" height="10" fill="rgba(245, 158, 11, 0.03)" />
          <line x1="0" y1="28" x2="100" y2="28" stroke="rgba(245, 158, 11, 0.35)" strokeWidth="0.4" strokeDasharray="2,2" />
          <text
            x="50"
            y="24"
            fill="rgba(245, 158, 11, 0.45)"
            fontSize="2.1"
            fontFamily="'Space Grotesk', sans-serif"
            fontWeight="bold"
            textAnchor="middle"
            letterSpacing="1"
          >
            NO-RUN ZONE (5 YDS)
          </text>

          {/* Stadium Yard Lines Across Field */}
          {[
            { y: 38, label: '10' },
            { y: 58, label: '20' },
            { y: 78, label: '30' }, // 30-YARD LINE (Standard Scrimmage)
            { y: 98, label: '40' },
            { y: 118, label: '50' },
            { y: 135, label: 'OWN 40' },
          ].map((line, idx) => {
            const isYard30 = line.y === 78;
            return (
              <g key={`yardline-${idx}`}>
                <line
                  x1="0"
                  y1={line.y}
                  x2="100"
                  y2={line.y}
                  stroke={isYard30 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.16)'}
                  strokeWidth={isYard30 ? '0.6' : '0.3'}
                />
                {/* Hash marks */}
                <line x1="30" y1={line.y - 0.9} x2="30" y2={line.y + 0.9} stroke="rgba(255, 255, 255, 0.25)" strokeWidth="0.3" />
                <line x1="70" y1={line.y - 0.9} x2="70" y2={line.y + 0.9} stroke="rgba(255, 255, 255, 0.25)" strokeWidth="0.3" />
                
                {/* Yard Numbers */}
                <text
                  x="5"
                  y={line.y + 0.8}
                  fill={isYard30 ? '#38bdf8' : 'rgba(255, 255, 255, 0.35)'}
                  fontSize="2.2"
                  fontFamily="'Space Grotesk', sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {line.label}
                </text>
                <text
                  x="95"
                  y={line.y + 0.8}
                  fill={isYard30 ? '#38bdf8' : 'rgba(255, 255, 255, 0.35)'}
                  fontSize="2.2"
                  fontFamily="'Space Grotesk', sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {line.label}
                </text>
              </g>
            );
          })}

          {/* Rusher 7-Yard Marker - Clean Turf Line & Sideline Indicator */}
          <g className="pointer-events-none select-none" opacity="0.65">
            <line
              x1="0"
              y1={rushConeY}
              x2="100"
              y2={rushConeY}
              stroke="#f59e0b"
              strokeWidth="0.4"
              strokeDasharray="2,2"
            />
            <text
              x="6"
              y={rushConeY - 0.7}
              fill="#fbbf24"
              fontSize="1.2"
              fontFamily="'Space Grotesk', sans-serif"
              fontWeight="bold"
            >
              RUSH 7Y
            </text>
            <text
              x="94"
              y={rushConeY - 0.7}
              fill="#fbbf24"
              fontSize="1.2"
              fontFamily="'Space Grotesk', sans-serif"
              fontWeight="bold"
              textAnchor="end"
            >
              RUSH 7Y
            </text>
          </g>

          {/* Line of Scrimmage (LOS) draggable handle (Moves entire offense & defense formation) */}
          <g
            className="cursor-ns-resize select-none"
            onPointerDown={(e) => {
              e.stopPropagation();
              draggingLosRef.current = true;
            }}
          >
            {/* Invisible thicker hit area for easy grabbing */}
            <line
              x1="0"
              y1={displayLosY}
              x2="100"
              y2={displayLosY}
              stroke="transparent"
              strokeWidth="5.0"
            />
            {/* Visible Line */}
            <line
              x1="0"
              y1={displayLosY}
              x2="100"
              y2={displayLosY}
              stroke="#38bdf8"
              strokeWidth="0.9"
              strokeDasharray="4,1"
              opacity="0.85"
            />
            {/* LOS Left Drag Badge */}
            <g
              transform={`translate(3, ${displayLosY - 1.6})`}
              className="transition-transform"
            >
              <title>Arrastrar Línea de Golpeo (mueve toda la formación)</title>
              <rect width="16" height="3.2" rx="0.8" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.3" />
              <text
                x="8"
                y="2.3"
                fill="#ffffff"
                fontSize="1.5"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="'Space Grotesk', sans-serif"
              >
                LOS ↕
              </text>
            </g>
          </g>

          {/* Defensive Zone Coverage Shapes (Rectangle / Box, Circle / Ellipse, Triangle) */}
          {displayZones.map((zone) => {
            const defender = effectivePlayers.find(
              (p) =>
                p.id === zone.playerId ||
                (zone.playerId.startsWith('def_') && p.role?.toLowerCase() === zone.playerId.replace('def_', '').toLowerCase()) ||
                (p.team === 'defense' && p.role === (zone as any).role) ||
                (zone.playerId.includes('cb1') && p.role === 'CB1') ||
                (zone.playerId.includes('cb2') && p.role === 'CB2') ||
                (zone.playerId.includes('s1') && p.role === 'S1') ||
                (zone.playerId.includes('s2') && p.role === 'S2') ||
                (zone.playerId.includes('lb') && p.role === 'LB')
            );
            const zoneColor = zone.color || defender?.color || '#a855f7';
            const isZoneSelected = selectedPlayerId === zone.playerId || (defender && selectedPlayerId === defender.id);
            const shape = zone.shape || 'rectangle';
            const isActionActive = playback.isPlaying || playback.progress > 0;

            return (
              <g
                key={zone.id}
                className="transition-all"
                style={{
                  cursor: isActionActive
                    ? 'default'
                    : currentMode === 'erase_route'
                    ? 'pointer'
                    : currentMode === 'select'
                    ? 'pointer'
                    : 'default',
                }}
                onPointerDown={(e) => {
                  if (isActionActive) return;
                  if (currentMode === 'select') {
                    e.stopPropagation();
                    if (defender) {
                      onSelectPlayer(defender);
                    }
                  } else if (currentMode === 'erase_route') {
                    e.stopPropagation();
                    if (onDeleteZone) {
                      onDeleteZone(zone.id);
                    }
                  }
                }}
              >
                {/* Dotted Drop Line from Defender Initial Spot to Zone Center */}
                {defender && (
                  <line
                    x1={defender.x}
                    y1={defender.y}
                    x2={zone.cx}
                    y2={zone.cy}
                    stroke={zoneColor}
                    strokeWidth={isZoneSelected ? "0.9" : "0.7"}
                    strokeDasharray="2,2"
                    opacity={isActionActive ? 0.22 : (isZoneSelected ? 0.8 : 0.45)}
                  />
                )}

                {/* Translucent Zone Shape */}
                {shape === 'circle' ? (
                  <ellipse
                    cx={zone.cx}
                    cy={zone.cy}
                    rx={zone.rx}
                    ry={zone.ry}
                    fill={zoneColor}
                    fillOpacity={isZoneSelected ? 0.24 : (isActionActive ? 0.06 : 0.09)}
                    stroke={zoneColor}
                    strokeOpacity={isZoneSelected ? 0.95 : (isActionActive ? 0.30 : 0.50)}
                    strokeWidth={isZoneSelected ? 1.4 : 0.65}
                    strokeDasharray={isZoneSelected ? undefined : "3,2"}
                    className="transition-all"
                  />
                ) : shape === 'triangle' ? (
                  <polygon
                    points={`${zone.cx},${zone.cy - zone.ry} ${zone.cx + zone.rx},${zone.cy + zone.ry} ${zone.cx - zone.rx},${zone.cy + zone.ry}`}
                    fill={zoneColor}
                    fillOpacity={isZoneSelected ? 0.24 : (isActionActive ? 0.06 : 0.09)}
                    stroke={zoneColor}
                    strokeOpacity={isZoneSelected ? 0.95 : (isActionActive ? 0.30 : 0.50)}
                    strokeWidth={isZoneSelected ? 1.4 : 0.65}
                    strokeDasharray={isZoneSelected ? undefined : "3,2"}
                    className="transition-all"
                  />
                ) : (
                  <rect
                    x={zone.cx - zone.rx}
                    y={zone.cy - zone.ry}
                    width={zone.rx * 2}
                    height={zone.ry * 2}
                    rx="1.5"
                    fill={zoneColor}
                    fillOpacity={isZoneSelected ? 0.24 : (isActionActive ? 0.06 : 0.09)}
                    stroke={zoneColor}
                    strokeOpacity={isZoneSelected ? 0.95 : (isActionActive ? 0.30 : 0.50)}
                    strokeWidth={isZoneSelected ? 1.4 : 0.65}
                    strokeDasharray={isZoneSelected ? undefined : "3,2"}
                    className="transition-all"
                  />
                )}

                {/* Selected Zone Controls & Handles (Active only when selected and not simulating) */}
                {isZoneSelected && !isActionActive ? (
                  <>
                    {/* Zone Name Header Badge & Direct Delete Button */}
                    <g transform={`translate(${zone.cx}, ${zone.cy - 3.8})`}>
                      <g className="pointer-events-none select-none">
                        <rect
                          x="-14"
                          y="-2.0"
                          width="28"
                          height="4.0"
                          rx="0.9"
                          fill="#080312"
                          stroke={zoneColor}
                          strokeWidth="0.5"
                          opacity="0.95"
                        />
                        <text
                          x="0"
                          y="0.8"
                          fill="#ffffff"
                          fontSize="1.3"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="'Space Grotesk', sans-serif"
                        >
                          {shape === 'circle' ? '⭕' : shape === 'triangle' ? '🔺' : '⬛'} {zone.name}
                        </text>
                      </g>

                      {/* Direct Delete Zone Button on Canvas */}
                      {onDeleteZone && (
                        <g
                          transform={`translate(${zone.cx > 70 ? -20.5 : 20.5}, 0)`}
                          className="cursor-pointer select-none"
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeleteZone(zone.id);
                          }}
                        >
                          <title>Quitar / Eliminar esta zona</title>
                          <rect
                            x="-5.5"
                            y="-2.0"
                            width="11"
                            height="4.0"
                            rx="0.9"
                            fill="#991b1b"
                            stroke="#ef4444"
                            strokeWidth="0.5"
                            opacity="0.95"
                          />
                          <text
                            x="0"
                            y="0.8"
                            fill="#ffffff"
                            fontSize="1.2"
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="'Space Grotesk', sans-serif"
                            className="pointer-events-none"
                          >
                            ✕ Quitar
                          </text>
                        </g>
                      )}
                    </g>

                    {/* Live Yardage Dimensions Badge (Width x Depth in Football Yards) */}
                    <g transform={`translate(${zone.cx}, ${zone.cy + 3.8})`} className="pointer-events-none select-none">
                      <rect
                        x="-16"
                        y="-1.8"
                        width="32"
                        height="3.6"
                        rx="0.8"
                        fill="#0f172a"
                        stroke="#38bdf8"
                        strokeWidth="0.4"
                        opacity="0.95"
                      />
                      <text
                        x="0"
                        y="0.7"
                        fill="#38bdf8"
                        fontSize="1.2"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="'Space Grotesk', sans-serif"
                      >
                        {`↔ Ancho: ${Math.round(zone.rx * 2 * 0.5)} yds | ↕ Prof: ${Math.round(zone.ry * 2 * 0.5)} yds`}
                      </text>
                    </g>

                    {/* Center Move Handle (Mover zona completa) */}
                    <g
                      transform={`translate(${zone.cx}, ${zone.cy})`}
                      className="cursor-move select-none"
                      onPointerDown={(e) => handleZoneHandlePointerDown(e, zone, 'center')}
                    >
                      <title>Mover posición de la zona</title>
                      {/* Generous Hit Circle */}
                      <circle r="4.2" fill="transparent" />
                      {/* Center Pin Circle */}
                      <circle
                        r="2.5"
                        fill="#0f172a"
                        stroke={zoneColor}
                        strokeWidth="0.8"
                        className="filter drop-shadow-md"
                      />
                      {/* Move Crosshair Arrows */}
                      <line x1="-1.4" y1="0" x2="1.4" y2="0" stroke="#ffffff" strokeWidth="0.45" strokeLinecap="round" />
                      <line x1="0" y1="-1.4" x2="0" y2="1.4" stroke="#ffffff" strokeWidth="0.45" strokeLinecap="round" />
                    </g>

                    {/* Right Handle (Ajustar ancho derecho) */}
                    <g
                      transform={`translate(${zone.cx + zone.rx}, ${zone.cy})`}
                      className="cursor-ew-resize select-none"
                      onPointerDown={(e) => handleZoneHandlePointerDown(e, zone, 'right')}
                    >
                      <title>Ajustar ancho (derecha)</title>
                      <rect x="-2.5" y="-4.0" width="5.0" height="8.0" fill="transparent" />
                      <rect
                        x="-1.1"
                        y="-2.8"
                        width="2.2"
                        height="5.6"
                        rx="0.8"
                        fill="#0f172a"
                        stroke={zoneColor}
                        strokeWidth="0.6"
                      />
                      <line x1="-0.4" y1="-1.4" x2="-0.4" y2="1.4" stroke="#ffffff" strokeWidth="0.35" strokeLinecap="round" />
                      <line x1="0.4" y1="-1.4" x2="0.4" y2="1.4" stroke="#ffffff" strokeWidth="0.35" strokeLinecap="round" />
                    </g>

                    {/* Left Handle (Ajustar ancho izquierdo) */}
                    <g
                      transform={`translate(${zone.cx - zone.rx}, ${zone.cy})`}
                      className="cursor-ew-resize select-none"
                      onPointerDown={(e) => handleZoneHandlePointerDown(e, zone, 'left')}
                    >
                      <title>Ajustar ancho (izquierda)</title>
                      <rect x="-2.5" y="-4.0" width="5.0" height="8.0" fill="transparent" />
                      <rect
                        x="-1.1"
                        y="-2.8"
                        width="2.2"
                        height="5.6"
                        rx="0.8"
                        fill="#0f172a"
                        stroke={zoneColor}
                        strokeWidth="0.6"
                      />
                      <line x1="-0.4" y1="-1.4" x2="-0.4" y2="1.4" stroke="#ffffff" strokeWidth="0.35" strokeLinecap="round" />
                      <line x1="0.4" y1="-1.4" x2="0.4" y2="1.4" stroke="#ffffff" strokeWidth="0.35" strokeLinecap="round" />
                    </g>

                    {/* Top Handle (Ajustar profundidad superior) */}
                    <g
                      transform={`translate(${zone.cx}, ${zone.cy - zone.ry})`}
                      className="cursor-ns-resize select-none"
                      onPointerDown={(e) => handleZoneHandlePointerDown(e, zone, 'top')}
                    >
                      <title>Ajustar profundidad (arriba)</title>
                      <rect x="-4.0" y="-2.5" width="8.0" height="5.0" fill="transparent" />
                      <rect
                        x="-2.8"
                        y="-1.1"
                        width="5.6"
                        height="2.2"
                        rx="0.8"
                        fill="#0f172a"
                        stroke={zoneColor}
                        strokeWidth="0.6"
                      />
                      <line x1="-1.4" y1="-0.4" x2="1.4" y2="-0.4" stroke="#ffffff" strokeWidth="0.35" strokeLinecap="round" />
                      <line x1="-1.4" y1="0.4" x2="1.4" y2="0.4" stroke="#ffffff" strokeWidth="0.35" strokeLinecap="round" />
                    </g>

                    {/* Bottom Handle (Ajustar profundidad inferior) */}
                    <g
                      transform={`translate(${zone.cx}, ${zone.cy + zone.ry})`}
                      className="cursor-ns-resize select-none"
                      onPointerDown={(e) => handleZoneHandlePointerDown(e, zone, 'bottom')}
                    >
                      <title>Ajustar profundidad (abajo)</title>
                      <rect x="-4.0" y="-2.5" width="8.0" height="5.0" fill="transparent" />
                      <rect
                        x="-2.8"
                        y="-1.1"
                        width="5.6"
                        height="2.2"
                        rx="0.8"
                        fill="#0f172a"
                        stroke={zoneColor}
                        strokeWidth="0.6"
                      />
                      <line x1="-1.4" y1="-0.4" x2="1.4" y2="-0.4" stroke="#ffffff" strokeWidth="0.35" strokeLinecap="round" />
                      <line x1="-1.4" y1="0.4" x2="1.4" y2="0.4" stroke="#ffffff" strokeWidth="0.35" strokeLinecap="round" />
                    </g>

                    {/* Corner Handle NW (Superior Izquierda: Ancla Inferior Derecha) */}
                    <g
                      transform={`translate(${zone.cx - zone.rx}, ${zone.cy - zone.ry})`}
                      className="cursor-nwse-resize select-none"
                      onPointerDown={(e) => handleZoneHandlePointerDown(e, zone, 'corner_nw')}
                    >
                      <title>Ajustar esquina superior izquierda</title>
                      <circle r="3.6" fill="transparent" />
                      <circle
                        r="1.9"
                        fill="#0f172a"
                        stroke={zoneColor}
                        strokeWidth="0.7"
                        className="filter drop-shadow-sm"
                      />
                      <circle r="0.8" fill="#38bdf8" />
                    </g>

                    {/* Corner Handle NE (Superior Derecha: Ancla Inferior Izquierda) */}
                    <g
                      transform={`translate(${zone.cx + zone.rx}, ${zone.cy - zone.ry})`}
                      className="cursor-nesw-resize select-none"
                      onPointerDown={(e) => handleZoneHandlePointerDown(e, zone, 'corner_ne')}
                    >
                      <title>Ajustar esquina superior derecha</title>
                      <circle r="3.6" fill="transparent" />
                      <circle
                        r="1.9"
                        fill="#0f172a"
                        stroke={zoneColor}
                        strokeWidth="0.7"
                        className="filter drop-shadow-sm"
                      />
                      <circle r="0.8" fill="#38bdf8" />
                    </g>

                    {/* Corner Handle SW (Inferior Izquierda: Ancla Superior Derecha) */}
                    <g
                      transform={`translate(${zone.cx - zone.rx}, ${zone.cy + zone.ry})`}
                      className="cursor-nesw-resize select-none"
                      onPointerDown={(e) => handleZoneHandlePointerDown(e, zone, 'corner_sw')}
                    >
                      <title>Ajustar esquina inferior izquierda</title>
                      <circle r="3.6" fill="transparent" />
                      <circle
                        r="1.9"
                        fill="#0f172a"
                        stroke={zoneColor}
                        strokeWidth="0.7"
                        className="filter drop-shadow-sm"
                      />
                      <circle r="0.8" fill="#38bdf8" />
                    </g>

                    {/* Corner Handle SE (Inferior Derecha: Ancla Superior Izquierda) */}
                    <g
                      transform={`translate(${zone.cx + zone.rx}, ${zone.cy + zone.ry})`}
                      className="cursor-nwse-resize select-none"
                      onPointerDown={(e) => handleZoneHandlePointerDown(e, zone, 'corner_se')}
                    >
                      <title>Ajustar esquina inferior derecha</title>
                      <circle r="3.6" fill="transparent" />
                      <circle
                        r="1.9"
                        fill="#0f172a"
                        stroke={zoneColor}
                        strokeWidth="0.7"
                        className="filter drop-shadow-sm"
                      />
                      <circle r="0.8" fill="#38bdf8" />
                    </g>
                  </>
                ) : (
                  /* Standard Unselected Zone Center Label - Minimal & Non-Obtrusive */
                  <g transform={`translate(${zone.cx}, ${zone.cy})`} className="pointer-events-none select-none" opacity={isActionActive ? 0.35 : 0.65}>
                    <text
                      x="0"
                      y="0.5"
                      fill={zoneColor}
                      fontSize="1.1"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="'Space Grotesk', sans-serif"
                    >
                      {zone.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Active Drawing Zone Preview (Paint Style Box / Ellipse / Triangle) */}
          {drawingZone && (() => {
            const spanX = Math.abs(drawingZone.currentX - drawingZone.startX);
            const spanY = Math.abs(drawingZone.currentY - drawingZone.startY);
            const cx = (drawingZone.startX + drawingZone.currentX) / 2;
            const cy = (drawingZone.startY + drawingZone.currentY) / 2;
            const rx = Math.max(8, spanX / 2);
            const ry = Math.max(5, spanY / 2);
            const def = effectivePlayers.find((p) => p.id === drawingZone.playerId);
            const color = def?.color || '#a855f7';
            const shape = zoneShape || 'rectangle';

            return (
              <g className="pointer-events-none">
                {def && (
                  <line
                    x1={def.x}
                    y1={def.y}
                    x2={cx}
                    y2={cy}
                    stroke={color}
                    strokeWidth="0.7"
                    strokeDasharray="2,2"
                    opacity={0.6}
                  />
                )}

                {/* Live Shape Preview */}
                {shape === 'circle' ? (
                  <ellipse
                    cx={cx}
                    cy={cy}
                    rx={rx}
                    ry={ry}
                    fill={color}
                    fillOpacity="0.18"
                    stroke={color}
                    strokeWidth="1.0"
                    strokeDasharray="2,2"
                  />
                ) : shape === 'triangle' ? (
                  <polygon
                    points={`${cx},${cy - ry} ${cx + rx},${cy + ry} ${cx - rx},${cy + ry}`}
                    fill={color}
                    fillOpacity="0.18"
                    stroke={color}
                    strokeWidth="1.0"
                    strokeDasharray="2,2"
                  />
                ) : (
                  <rect
                    x={cx - rx}
                    y={cy - ry}
                    width={rx * 2}
                    height={ry * 2}
                    rx="1.5"
                    fill={color}
                    fillOpacity="0.18"
                    stroke={color}
                    strokeWidth="1.0"
                    strokeDasharray="2,2"
                  />
                )}

                <g transform={`translate(${cx}, ${cy})`}>
                  <rect x="-9.5" y="-1.8" width="19" height="3.6" rx="0.6" fill="#080312" stroke={color} strokeWidth="0.4" />
                  <text x="0" y="0.7" fill={color} fontSize="1.3" fontWeight="bold" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif">
                    {shape === 'circle' ? '⭕ CÍRCULO' : shape === 'triangle' ? '🔺 TRIÁNGULO' : '⬛ CUADRADO'}
                  </text>
                </g>
              </g>
            );
          })()}

          {/* Pre-Snap Motion Vector Paths (when at progress = 0) */}
          {playback.progress === 0 &&
            displayPlayers
              .filter((p) => p.hasMotion && p.team === 'offense')
              .map((p) => {
                const targetX = p.motionTargetX ?? (p.x < 50 ? p.x + 30 : p.x - 30);
                return (
                  <g key={`motion-${p.id}`} className="pointer-events-none" opacity={0.6}>
                    <line
                      x1={p.x}
                      y1={p.y}
                      x2={targetX}
                      y2={p.y}
                      stroke="#38bdf8"
                      strokeWidth="1.0"
                      strokeDasharray="2,2"
                    />
                    <circle cx={targetX} cy={p.y} r="1.5" fill="none" stroke="#38bdf8" strokeWidth="0.6" />
                    <rect
                      x={(p.x + targetX) / 2 - 6}
                      y={p.y - 3.2}
                      width="12"
                      height="2.4"
                      rx="0.5"
                      fill="#041822"
                      stroke="#38bdf8"
                      strokeWidth="0.3"
                    />
                    <text
                      x={(p.x + targetX) / 2}
                      y={p.y - 1.5}
                      fill="#38bdf8"
                      fontSize="1.3"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="'Space Grotesk', sans-serif"
                    >
                      MOTION ➜
                    </text>
                  </g>
                );
              })}

          {/* Routes rendering: In Man-to-Man coverage, static non-rush defender routes are hidden */}
          {displayRoutes
            .filter((route) => {
              // Hide existing route for the player while drawing a new one to prevent clutter/confusion
              if (isDrawingRoute && activeRoutePlayerId === route.playerId) {
                return false;
              }
              if (!isManCoverage) return true;
              const player = displayPlayers.find((p) => p.id === route.playerId);
              // Hide static routes for non-rush defenders in man-to-man
              if (player?.team === 'defense' && player?.role !== 'RUSH') {
                return false;
              }
              return true;
            })
            .map((route) => {
              const player = displayPlayers.find((p) => p.id === route.playerId);
              const isSelected = selectedPlayerId === route.playerId;
              const routeColor = route.color || player?.color || '#facc15';
              const pathData = pointsToSvgPath(route.points);
              const isPass = route.actionType === 'pass';
              const isBlock = route.actionType === 'block';

              // Sleek, unobtrusive route transparency
              const routeOpacity = isSelected
                ? 0.92
                : (playback.isPlaying || playback.progress > 0)
                  ? 0.35
                  : 0.55;

              return (
                <g key={route.id} opacity={routeOpacity} className="transition-opacity duration-300">
                  <path
                    d={pathData}
                    fill="none"
                    stroke={routeColor}
                    strokeWidth={isBlock ? '1.8' : '1.5'}
                    strokeDasharray={isPass ? '3,3' : 'none'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    markerEnd={!isBlock && route.points.length >= 2 ? `url(#arrow-${route.id})` : undefined}
                  />

                  {/* Stop & Go / Static Pause Badges along the route - Draggable strictly along route trajectory */}
                  {route.points
                    .filter((p, idx) => idx > 0 && (p.action === 'stop_and_go' || p.action === 'pause' || (p.pauseDuration && p.pauseDuration > 0)))
                    .map((pt, pIdx) => {
                      const pauseDuration = pt.pauseDuration || (pt.action === 'stop_and_go' ? 0.6 : 0.8);
                      const isBeingDragged = isDraggingStopBadge && draggingStopBadgeRef.current?.routeId === route.id;

                      return (
                        <g
                          key={`stop-badge-${route.id}-${pIdx}`}
                          transform={`translate(${pt.x}, ${pt.y})`}
                          className="cursor-grab active:cursor-grabbing select-none group touch-none"
                          onPointerDown={(e) => handleStopBadgePointerDown(e, route, pt)}
                        >
                          {/* Expanded transparent hit area for easy touch/mouse grabbing */}
                          <circle cx="0" cy="0" r="4.5" fill="transparent" />

                          {/* Pulsing ring indicator */}
                          <circle
                            cx="0"
                            cy="0"
                            r={isBeingDragged ? '3.0' : '2.0'}
                            fill="#ef4444"
                            opacity={isBeingDragged ? 0.55 : 0.3}
                            className={isBeingDragged ? undefined : 'animate-ping'}
                          />
                          <circle
                            cx="0"
                            cy="0"
                            r="1.5"
                            fill="#ef4444"
                            stroke={isBeingDragged ? '#fbbf24' : '#ffffff'}
                            strokeWidth="0.35"
                            className="transition-transform group-hover:scale-110"
                          />

                          {/* Stop Pill Badge */}
                          <rect
                            x="-6.5"
                            y="-4.2"
                            width="13.0"
                            height="2.7"
                            rx="0.5"
                            fill="#150608"
                            stroke={isBeingDragged ? '#fbbf24' : '#ef4444'}
                            strokeWidth={isBeingDragged ? '0.45' : '0.3'}
                            opacity="0.96"
                            className="filter drop-shadow-md"
                          />
                          <text
                            x="0"
                            y="-2.4"
                            fill={isBeingDragged ? '#fef08a' : '#fca5a5'}
                            fontSize="1.0"
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="'Space Grotesk', sans-serif"
                            className="pointer-events-none select-none"
                          >
                            🛑 STOP {pauseDuration}s ↕
                          </text>

                          {/* Interactive slider hint on hover */}
                          <rect
                            x="-7.5"
                            y="1.6"
                            width="15.0"
                            height="1.9"
                            rx="0.4"
                            fill="#0f172a"
                            stroke="#38bdf8"
                            strokeWidth="0.25"
                            opacity={isBeingDragged ? '0.95' : '0.8'}
                            className="pointer-events-none select-none opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                          <text
                            x="0"
                            y="2.9"
                            fill="#7dd3fc"
                            fontSize="0.75"
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="'Space Grotesk', sans-serif"
                            className="pointer-events-none select-none opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            DESLIZAR EN RUTA
                          </text>
                        </g>
                      );
                    })}
                </g>
              );
            })}

          {/* Man-to-Man Defensive Assignment Dotted Tether Lines */}
          {isManCoverage &&
            displayPlayers
              .filter((p) => p.team === 'defense')
              .map((defender) => {
                const assignedRec = defenderAssignments.get(defender.id);
                if (!assignedRec) return null;

                const defPos = animatedPlayerPositions.get(defender.id) || { x: defender.x, y: defender.y };
                const recPos = animatedPlayerPositions.get(assignedRec.id) || { x: assignedRec.x, y: assignedRec.y };
                const defColor = defender.color || '#f43f5e';

                const isActionActive = playback.isPlaying || playback.progress > 0;

                return (
                  <g key={`man-lock-${defender.id}`} className="pointer-events-none">
                    {/* Dotted Lock-on Line */}
                    <line
                      x1={defPos.x}
                      y1={defPos.y}
                      x2={recPos.x}
                      y2={recPos.y}
                      stroke={defColor}
                      strokeWidth="0.75"
                      strokeDasharray="1.5,1.5"
                      opacity={isActionActive ? 0.22 : 0.45}
                    />


                  </g>
                );
              })}

          {/* Passing Lane Ray (QB -> Target Receiver) with Obstruction Alert */}
          {targetReceiver && qbPlayer && (
            <g className="pointer-events-none">
              {(() => {
                const qbPos = animatedPlayerPositions.get(qbPlayer.id) || { x: qbPlayer.x, y: qbPlayer.y };
                const recPos = animatedPlayerPositions.get(targetReceiver.id) || { x: targetReceiver.x, y: targetReceiver.y };
                const isBlocked = analytics.isLaneObstructed;
                const isActionActive = playback.isPlaying || playback.progress > 0;

                return (
                  <g>
                    {/* Passing Lane Vector */}
                    <line
                      x1={qbPos.x}
                      y1={qbPos.y}
                      x2={recPos.x}
                      y2={recPos.y}
                      stroke={isBlocked ? 'url(#passingLaneBlocked)' : 'url(#passingLaneClear)'}
                      strokeWidth={isBlocked ? '1.0' : '0.8'}
                      strokeDasharray={isBlocked ? '2,2' : '3,1.5'}
                      opacity={isActionActive ? 0.45 : 0.70}
                    />
                    

                  </g>
                );
              })()}
            </g>
          )}

          {/* Smart Yard Guides (visible only while drawing with the magnet on) */}
          {isDrawingRoute && snapEnabled && (
            <g className="pointer-events-none">
              {yardGuides.map((g) => {
                const active = activeGuideY === g.y;
                return (
                  <g key={`guide-${g.label}`}>
                    <line
                      x1="0"
                      x2="100"
                      y1={g.y}
                      y2={g.y}
                      stroke={active ? '#34d399' : 'rgba(52, 211, 153, 0.35)'}
                      strokeWidth={active ? '0.6' : '0.35'}
                      strokeDasharray="1.5,1.5"
                    />
                    <rect
                      x="19"
                      y={g.y - 1.5}
                      width="12"
                      height="3"
                      rx="0.6"
                      fill={active ? '#00a859' : '#0b1a12'}
                      stroke="rgba(52, 211, 153, 0.6)"
                      strokeWidth="0.25"
                    />
                    <text
                      x="25"
                      y={g.y + 0.6}
                      fill="#ffffff"
                      fontSize="1.5"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="'Space Grotesk', sans-serif"
                    >
                      {g.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Active Drawing Route Preview */}
          {isDrawingRoute && drawingPoints.length >= 2 && (
            <g className="pointer-events-none">
              <path
                d={pointsToSvgPath(drawingPoints)}
                fill="none"
                stroke={activeDrawingColor}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd="url(#arrow-drawing-preview)"
              />
            </g>
          )}

          {/* Tactical Flag Pull / Tackle Marker on Field */}
          {flagPullEvent && flagPullEvent.occurred && (
            <g
              className="pointer-events-none transition-all duration-300"
              transform={`translate(${flagPullEvent.location.x}, ${flagPullEvent.location.y})`}
            >
              {/* Outer Pulsing Target Ring */}
              <circle
                r="4.2"
                fill="none"
                stroke={flagPullEvent.isSack ? '#ef4444' : flagPullEvent.isTouchdown ? '#eab308' : '#f43f5e'}
                strokeWidth="0.6"
                strokeDasharray="2,2"
                opacity={playback.progress >= flagPullEvent.progress ? 0.95 : 0.45}
                className="animate-spin"
                style={{ animationDuration: '6s' }}
              />

              {/* Inner Circle Halo */}
              <circle
                r="2.6"
                fill={flagPullEvent.isSack ? '#ef4444' : flagPullEvent.isTouchdown ? '#eab308' : '#f43f5e'}
                fillOpacity={playback.progress >= flagPullEvent.progress ? 0.35 : 0.15}
                stroke={flagPullEvent.isSack ? '#ef4444' : flagPullEvent.isTouchdown ? '#eab308' : '#f43f5e'}
                strokeWidth="0.5"
              />

              {/* Center Icon */}
              <text
                x="0"
                y="1"
                textAnchor="middle"
                fontSize="2.6"
                className="select-none"
              >
                {flagPullEvent.isSack ? '💥' : flagPullEvent.isTouchdown ? '🏆' : '🚩'}
              </text>

              {/* Tactical Callout Pill Badge on Field */}
              <g transform="translate(0, -4.8)">
                <rect
                  x="-20"
                  y="-2.2"
                  width="40"
                  height="4.4"
                  rx="1.0"
                  fill="#0e0407"
                  stroke={flagPullEvent.isSack ? '#ef4444' : flagPullEvent.isTouchdown ? '#eab308' : '#f43f5e'}
                  strokeWidth="0.4"
                  opacity={playback.progress >= flagPullEvent.progress ? 0.95 : 0.75}
                />
                <text
                  x="0"
                  y="0.8"
                  fill="#ffffff"
                  fontSize="1.3"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="'Space Grotesk', sans-serif"
                >
                  {flagPullEvent.isTouchdown
                    ? `🏆 TOUCHDOWN (+${flagPullEvent.yardsGained} yds)`
                    : flagPullEvent.isSack
                    ? `💥 SACK: ${flagPullEvent.tacklerName || flagPullEvent.tacklerLabel || 'Rusher'} (${flagPullEvent.timeSec}s)`
                    : `🚩 BANDERA: ${flagPullEvent.tacklerName || flagPullEvent.tacklerLabel || 'Defensa'} (${flagPullEvent.timeSec}s)`}
                </text>
              </g>
            </g>
          )}

          {/* Animated Football with Real Aerodynamic Flight Physics */}
          {animatedBall && (
            <g className="pointer-events-none">
              {/* Dynamic Ground Shadow on Turf */}
              {animatedBall.inAir && (
                <ellipse
                  cx={animatedBall.x}
                  cy={animatedBall.groundY}
                  rx={1.3 + (animatedBall.altitude / 16.0) * 1.5}
                  ry={0.65 + (animatedBall.altitude / 16.0) * 0.75}
                  fill="rgba(0, 0, 0, 0.45)"
                  opacity={Math.max(0.15, 0.55 - (animatedBall.altitude / 16.0) * 0.35)}
                />
              )}

              {/* Realistic Football with 3D Perspective Scaling & Flight Orientation */}
              <g
                transform={`translate(${animatedBall.x}, ${animatedBall.y}) scale(${animatedBall.scale || 1.0}) rotate(${animatedBall.rotation || -20})`}
              >
                {/* Football Ellipsoid Body with 3D Shader Texture */}
                <ellipse
                  cx="0"
                  cy="0"
                  rx="1.9"
                  ry="1.15"
                  fill="url(#footballLeather)"
                  stroke="#fbbf24"
                  strokeWidth="0.2"
                />

                {/* Top Specular Gleam Highlight */}
                <ellipse
                  cx="0"
                  cy="-0.3"
                  rx="1.4"
                  ry="0.5"
                  fill="url(#footballGleam)"
                />

                {/* Pro White Double Stripes on Both Tips */}
                <path d="M -1.2 -0.85 L -1.2 0.85" stroke="#ffffff" strokeWidth="0.32" strokeLinecap="round" />
                <path d="M 1.2 -0.85 L 1.2 0.85" stroke="#ffffff" strokeWidth="0.32" strokeLinecap="round" />

                {/* Rotating Laces & Seams reflecting tight aerodynamic spiral */}
                <g transform={`rotate(${animatedBall.spiralAngle * 0.15})`}>
                  {/* Central Spine */}
                  <line x1="-0.8" y1="0" x2="0.8" y2="0" stroke="#ffffff" strokeWidth="0.28" strokeLinecap="round" />
                  {/* Cross Stitches */}
                  <line x1="-0.5" y1="-0.4" x2="-0.5" y2="0.4" stroke="#ffffff" strokeWidth="0.22" strokeLinecap="round" />
                  <line x1="-0.2" y1="-0.4" x2="-0.2" y2="0.4" stroke="#ffffff" strokeWidth="0.22" strokeLinecap="round" />
                  <line x1="0.1" y1="-0.4" x2="0.1" y2="0.4" stroke="#ffffff" strokeWidth="0.22" strokeLinecap="round" />
                  <line x1="0.4" y1="-0.4" x2="0.4" y2="0.4" stroke="#ffffff" strokeWidth="0.22" strokeLinecap="round" />
                </g>
              </g>
            </g>
          )}

          {/* Compact Players Tokens with Direct Touch / Drag Support & Next Gen Metrics */}
          {displayPlayers.map((player) => {
            const animatedPos = animatedPlayerPositions.get(player.id);
            const pos = (dragPlayerPos?.id === player.id)
              ? { x: dragPlayerPos.x, y: dragPlayerPos.y, angle: 0 }
              : (animatedPos || { x: player.x, y: player.y, angle: 0 });
            const isSelected = selectedPlayerId === player.id;
            const isTarget = targetReceiver?.id === player.id;
            const playerColor = player.color || '#facc15';
            const recAnalytics = player.team === 'offense' && player.role !== 'QB'
              ? analytics.receiversAnalytics.get(player.id)
              : null;

            return (
              <g
                key={player.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer touch-none"
                onPointerDown={(e) => handlePlayerPointerDown(e, player)}
              >
                {/* Invisible hit target for easy clicking and touch dragging */}
                <circle cx="0" cy="0" r="4.2" fill="transparent" pointerEvents="all" />

                {/* Receiver Separation Colored Halo */}
                {recAnalytics && (
                  <circle
                    cx="0"
                    cy="0"
                    r="2.5"
                    fill="none"
                    stroke={
                      recAnalytics.status === 'open'
                        ? '#10b981'
                        : recAnalytics.status === 'contested'
                        ? '#f59e0b'
                        : '#ef4444'
                    }
                    strokeWidth="0.4"
                    strokeDasharray="1.0,1.0"
                    opacity={0.85}
                  />
                )}

                {/* Target Receiver Glowing Indicator */}
                {isTarget && (
                  <circle
                    cx="0"
                    cy="0"
                    r="2.8"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="0.5"
                    strokeDasharray="1.2,1.2"
                    className="animate-spin"
                  />
                )}

                {/* Selection Halo */}
                {isSelected && !isTarget && (
                  <circle
                    cx="0"
                    cy="0"
                    r="2.4"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="0.45"
                    strokeDasharray="1.0,1.0"
                  />
                )}

                {/* Tackler Defender Highlight Halo */}
                {flagPullEvent && flagPullEvent.occurred && flagPullEvent.tacklerId === player.id && !flagPullEvent.isTouchdown && (
                  <circle
                    cx="0"
                    cy="0"
                    r="2.7"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="0.55"
                    strokeDasharray="1.2,1.2"
                    className="animate-pulse"
                  />
                )}

                {/* Smaller, Semi-Transparent Refined Token Base */}
                <circle
                  cx="0"
                  cy="0"
                  r="1.65"
                  fill="rgba(6, 12, 8, 0.72)"
                  stroke={playerColor}
                  strokeWidth="0.55"
                  strokeOpacity="0.95"
                />

                {/* Player Letter/Role */}
                <text
                  x="0"
                  y="0.5"
                  fill={playerColor}
                  fontSize={player.label.length > 2 ? '1.05' : '1.25'}
                  fontFamily="'Space Grotesk', sans-serif"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                >
                  {player.label}
                </text>

                {/* QB Progression Read Badge (❶ / ❷ / ❸) */}
                {player.readProgression && player.team === 'offense' && (
                  <g transform="translate(-1.6, -1.6)">
                    <circle cx="0" cy="0" r="0.8" fill="#00a859" stroke="#ffffff" strokeWidth="0.25" opacity="0.95" />
                    <text
                      x="0"
                      y="0.3"
                      fill="#ffffff"
                      fontSize="0.75"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {player.readProgression === 1 ? '1' : player.readProgression === 2 ? '2' : 'C'}
                    </text>
                  </g>
                )}

                {/* Compact Jersey Number Badge */}
                {player.jerseyNumber && !player.readProgression && (
                  <g transform="translate(1.3, -1.3)">
                    <circle cx="0" cy="0" r="0.7" fill="rgba(8, 8, 8, 0.85)" stroke={playerColor} strokeWidth="0.2" />
                    <text
                      x="0"
                      y="0.25"
                      fill="#ffffff"
                      fontSize="0.6"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {player.jerseyNumber}
                    </text>
                  </g>
                )}


              </g>
            );
          })}
        </svg>

        {/* Minimalist Tactical HUD Footer */}
        <div className="absolute bottom-1.5 left-2 right-2 hidden sm:flex items-center justify-between bg-[#070b08]/85 backdrop-blur-md px-3 py-1 rounded-lg border border-[#1e2e22] text-[10px] text-slate-300 pointer-events-none">
          <div className="flex items-center gap-2.5">
            {play.players.map((p) => (
              <span key={p.id} className="flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color || '#facc15' }} />
                <span className="font-bold text-white text-[10px]">{p.label}</span>
              </span>
            ))}
          </div>
          <span className="text-neutral-400 font-mono text-[9px] font-bold tracking-wider">HALCONES PRO HUD</span>
        </div>
      </div>

      {/* 2. Next Gen Stats Dedicated Panel - OUTSIDE THE PLAYING FIELD */}
      {showAnalyticsHud && (
        <aside className="w-80 sm:w-88 xl:w-96 max-h-[85vh] bg-[#070d09]/98 backdrop-blur-2xl rounded-xl border border-[#1e3425] shadow-2xl flex flex-col z-20 overflow-hidden shrink-0 animate-in slide-in-from-right duration-200 ring-1 ring-white/5">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#1b2b20] bg-[#0b140e]/95 shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="font-black text-xs text-white tracking-wider uppercase font-display">
                Next Gen Stats
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-600/30 font-mono font-bold">
                TELEMETRÍA
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAnalyticsHud(false)}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-[#152319] transition-all"
              title="Ocultar panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 font-mono text-xs">
            {/* 1. Flag Pull / Tackle Milestone */}
            {flagPullEvent && flagPullEvent.occurred && (
              <div className="bg-[#190c10] border border-red-900/50 rounded-xl p-2.5 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-red-300 font-bold text-xs">
                    <Flag className="w-3.5 h-3.5 text-red-400" />
                    <span>
                      {flagPullEvent.isSack ? '💥 SACK APROXIMADO' : flagPullEvent.isTouchdown ? '🏆 TOUCHDOWN' : '🚩 RETIRO DE BANDERA'}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    flagPullEvent.isTouchdown
                      ? 'bg-amber-950 text-amber-300 border border-amber-600/40'
                      : 'bg-red-950 text-red-300 border border-red-600/40'
                  }`}>
                    {flagPullEvent.yardsGained >= 0 ? `+${flagPullEvent.yardsGained}` : flagPullEvent.yardsGained} YDS
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#0f0709] p-2 rounded-lg border border-red-950">
                  <div>
                    <span className="text-neutral-400 text-[10px] block">Momento</span>
                    <span className="text-white font-bold">{flagPullEvent.timeSec}s</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-[10px] block">Ubicación</span>
                    <span className="text-white font-bold">Yarda {flagPullEvent.yardLine}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Passing Window & QB Trajectory */}
            <div className="bg-[#0b140e] border border-[#1b2b20] rounded-xl p-2.5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold text-[11px] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>VENTANA DE PASE</span>
                </span>
                {analytics.isLaneObstructed ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800/40">
                    ⚠️ EN RIESGO
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                    ✓ DESPEJADO
                  </span>
                )}
              </div>

              {targetReceiver ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] bg-[#070d09] p-2 rounded-lg border border-[#152319]">
                    <div>
                      <span className="text-neutral-400 text-[10px] block">Receptor Objetivo</span>
                      <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: targetReceiver.color || '#10b981' }} />
                        {targetReceiver.label} ({targetReceiver.role})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-neutral-400 text-[10px] block">Separación</span>
                      <span className={`font-bold ${
                        analytics.targetSeparationStatus === 'open'
                          ? 'text-emerald-400'
                          : analytics.targetSeparationStatus === 'contested'
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}>
                        {analytics.targetSeparationYards} yds ({analytics.targetSeparationStatus === 'open' ? 'Libre' : analytics.targetSeparationStatus === 'contested' ? 'Ajustado' : 'Cubierto'})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] px-1">
                    <span className="text-neutral-400">YAC Proyectado (xYAC):</span>
                    <span className="text-white font-bold">+{analytics.expectedYacYards} yds</span>
                  </div>

                  {analytics.isLaneObstructed ? (
                    <div className="flex items-center gap-1.5 text-[10px] text-red-300 bg-red-950/60 p-1.5 rounded-lg border border-red-800/40">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>Intercepción en riesgo por <strong>{analytics.obstructingDefenderName || 'Defensor'}</strong></span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-800/40">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Carril directo QB ➜ Receptor 100% limpio</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[10px] text-neutral-400 text-center py-2 bg-[#070d09] rounded-lg border border-[#152319]">
                  💡 Haz clic en un receptor en el campo para enfocar la telemetría de tiro
                </div>
              )}
            </div>

            {/* 3. Time to Throw (TTT) & Rusher Pressure Clock */}
            <div className="bg-[#0b140e] border border-[#1b2b20] rounded-xl p-2.5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>LANZAMIENTO & RUSHER</span>
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  analytics.pressureStatus === 'safe'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                    : analytics.pressureStatus === 'pressure'
                    ? 'bg-amber-950 text-amber-300 border border-amber-600/40'
                    : 'bg-red-950 text-red-300 border border-red-600/40'
                }`}>
                  {analytics.pressureStatus === 'safe'
                    ? `+${analytics.pressureMarginSec}s SEGURO`
                    : analytics.pressureStatus === 'pressure'
                    ? 'PRESIÓN'
                    : 'SACK'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#070d09] p-2 rounded-lg border border-[#152319]">
                <div>
                  <span className="text-neutral-400 text-[10px] block">Tiempo Pase (TTT)</span>
                  <span className="text-cyan-300 font-bold">{analytics.timeToThrowSec}s</span>
                </div>
                <div>
                  <span className="text-neutral-400 text-[10px] block">Reloj Rusher (TTP)</span>
                  <span className="text-amber-300 font-bold">{analytics.timeToPressureSec}s</span>
                </div>
              </div>
            </div>

            {/* 4. Live Separation by Receiver */}
            <div className="bg-[#0b140e] border border-[#1b2b20] rounded-xl p-2.5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SEPARACIÓN DE RECEPTORES</span>
                </span>
              </div>

              <div className="space-y-1">
                {displayPlayers
                  .filter((p) => p.team === 'offense' && p.role !== 'QB')
                  .map((rec) => {
                    const recData = analytics.receiversAnalytics.get(rec.id);
                    const isSelected = selectedPlayerId === rec.id;
                    return (
                      <div
                        key={rec.id}
                        onClick={() => onSelectPlayer(rec)}
                        className={`flex items-center justify-between p-1.5 rounded-lg border text-[11px] cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#122318] border-emerald-500/60'
                            : 'bg-[#070d09] border-[#152319] hover:bg-[#0d1a11]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] text-black shrink-0"
                            style={{ backgroundColor: rec.color || '#facc15' }}
                          >
                            {rec.label}
                          </span>
                          <span className="text-white font-bold">{rec.customName || rec.role}</span>
                          {rec.delaySec && rec.delaySec > 0 && (
                            <span className="text-[9px] text-amber-400 bg-amber-950/60 px-1 rounded">
                              ⏱️ {rec.delaySec}s
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">
                            {recData ? `${recData.separationYards}y` : '--'}
                          </span>
                          {recData && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                recData.status === 'open'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/30'
                                  : recData.status === 'contested'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-600/30'
                                  : 'bg-red-950 text-red-300 border border-red-600/30'
                              }`}
                            >
                              {recData.status === 'open' ? 'Libre' : recData.status === 'contested' ? 'Ajustado' : 'Cubierto'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 5. Defensive Matchups (Man-to-Man or Zones) */}
            <div className="bg-[#0b140e] border border-[#1b2b20] rounded-xl p-2.5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-red-400" />
                  <span>{isManCoverage ? 'EMPAREJAMIENTOS PERSONAL' : 'COBERTURAS DE ZONA'}</span>
                </span>
              </div>

              {isManCoverage ? (
                <div className="space-y-1">
                  {displayPlayers
                    .filter((p) => p.team === 'defense')
                    .map((def) => {
                      const rec = def.role === 'RUSH' ? qbPlayer : defenderAssignments.get(def.id);
                      return (
                        <div
                          key={def.id}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-[#070d09] border border-[#152319] text-[11px]"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: def.color || '#ef4444' }} />
                            <span className="text-red-300 font-bold">{def.label}</span>
                            <span className="text-neutral-500 text-[10px]">({def.role})</span>
                          </div>
                          <span className="text-neutral-400 font-bold">➜</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-300 font-bold">{rec?.label || '--'}</span>
                            <span className="text-neutral-500 text-[10px]">({rec?.role || '--'})</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="space-y-1">
                  {displayZones.map((zone) => {
                    const def = displayPlayers.find((p) => p.id === zone.playerId);
                    return (
                      <div
                        key={zone.id}
                        onClick={() => def && onSelectPlayer(def)}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-[#070d09] border border-[#152319] text-[11px] cursor-pointer hover:bg-[#0d1a11]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color || '#a855f7' }} />
                          <span className="text-purple-300 font-bold">{zone.name}</span>
                        </div>
                        <span className="text-neutral-400 text-[10px]">
                          {Math.round(zone.rx * 2 * 0.5)}y × {Math.round(zone.ry * 2 * 0.5)}y
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
