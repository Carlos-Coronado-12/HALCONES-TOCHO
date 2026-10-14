import { Player, Route, FlagPullEvent, DefenseScheme, ZoneCoverage, Point } from '../types/playbook';
import { getDistance, getPositionAtTime, getAngle } from './geometry';
import { GOAL_LINE_Y, UNITS_PER_YARD } from './playTransforms';
import { DEFENSE_SCHEMES_DATA } from '../constants/presets';

export const BASE_DURATION_SEC = 15.0; // Play lasts up to 15 seconds (or until flag pull)
export const BASE_SPRINT_SPEED = 14.5; // units per second (~7.25 yds/s)
export const FLAG_PULL_RADIUS = 3.2;   // ~1.6 yards reach for flag pull

// Límite estricto de patrullaje en zonas defensivas: no salirse más de ~3-4 yarditas (3.5 yds = 7 unidades SVG)
export const ZONE_MAX_MARGIN_YARDS = 0; // Margen 0: el defensivo no puede salirse de su cuadro bajo ninguna circunstancia
export const ZONE_MAX_MARGIN_UNITS = 0;

/**
 * Verifica si un punto está estrictamente dentro del perímetro de la zona (margen = 0)
 */
export function isPointInsideZoneStrict(
  p: { x: number; y: number },
  zone: ZoneCoverage
): boolean {
  if (zone.shape === 'circle') {
    const rx = Math.max(0.5, zone.rx);
    const ry = Math.max(0.5, zone.ry);
    const dx = p.x - zone.cx;
    const dy = p.y - zone.cy;
    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1.0;
  }
  if (zone.shape === 'triangle') {
    const p1 = { x: zone.cx, y: zone.cy - zone.ry };
    const p2 = { x: zone.cx + zone.rx, y: zone.cy + zone.ry };
    const p3 = { x: zone.cx - zone.rx, y: zone.cy + zone.ry };
    const d1 = (p.x - p2.x) * (p1.y - p2.y) - (p1.x - p2.x) * (p.y - p2.y);
    const d2 = (p.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p.y - p3.y);
    const d3 = (p.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p.y - p1.y);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNeg && hasPos);
  }
  // Default: Rectangle
  const minX = zone.cx - zone.rx;
  const maxX = zone.cx + zone.rx;
  const minY = zone.cy - zone.ry;
  const maxY = zone.cy + zone.ry;
  return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
}

/**
 * Acota estrictamente un punto dentro del cuadro o figura de la zona (margen = 0, sin salirse del cuadro)
 */
export function clampPointStrictlyToZone(
  p: { x: number; y: number },
  zone: ZoneCoverage
): { x: number; y: number } {
  if (zone.shape === 'circle') {
    const rx = Math.max(0.5, zone.rx);
    const ry = Math.max(0.5, zone.ry);
    const dx = p.x - zone.cx;
    const dy = p.y - zone.cy;
    const distNormSq = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
    if (distNormSq > 1.0) {
      const factor = 1.0 / Math.sqrt(distNormSq);
      return {
        x: zone.cx + dx * factor,
        y: zone.cy + dy * factor,
      };
    }
    return { x: p.x, y: p.y };
  }

  // Rectangle
  const minX = zone.cx - zone.rx;
  const maxX = zone.cx + zone.rx;
  const minY = zone.cy - zone.ry;
  const maxY = zone.cy + zone.ry;
  return {
    x: Math.max(minX, Math.min(maxX, p.x)),
    y: Math.max(minY, Math.min(maxY, p.y)),
  };
}

/**
 * Verifica si un punto está dentro del perímetro de la zona (estricto con soporte de margen opcional)
 */
export function isPointInsideZoneWithMargin(
  p: { x: number; y: number },
  zone: ZoneCoverage,
  marginUnits: number = 0
): boolean {
  if (marginUnits === 0) return isPointInsideZoneStrict(p, zone);
  if (zone.shape === 'circle') {
    const rx = zone.rx + marginUnits;
    const ry = zone.ry + marginUnits;
    const dx = p.x - zone.cx;
    const dy = p.y - zone.cy;
    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1.0;
  }
  const minX = zone.cx - zone.rx - marginUnits;
  const maxX = zone.cx + zone.rx + marginUnits;
  const minY = zone.cy - zone.ry - marginUnits;
  const maxY = zone.cy + zone.ry + marginUnits;
  return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
}

/**
 * Acota estrictamente las coordenadas dentro del perímetro de la zona asignada
 */
export function clampPointToZone(
  p: { x: number; y: number },
  zone: ZoneCoverage,
  marginUnits: number = 0
): { x: number; y: number } {
  if (marginUnits === 0) return clampPointStrictlyToZone(p, zone);
  const minX = Math.max(1, zone.cx - zone.rx - marginUnits);
  const maxX = Math.min(99, zone.cx + zone.rx + marginUnits);
  const minY = Math.max(1, zone.cy - zone.ry - marginUnits);
  const maxY = Math.min(139, zone.cy + zone.ry + marginUnits);

  if (zone.shape === 'circle') {
    const rx = zone.rx + marginUnits;
    const ry = zone.ry + marginUnits;
    const dx = p.x - zone.cx;
    const dy = p.y - zone.cy;
    const distNormSq = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
    if (distNormSq > 1.0) {
      const factor = 1.0 / Math.sqrt(distNormSq);
      return {
        x: Math.max(1, Math.min(99, zone.cx + dx * factor)),
        y: Math.max(1, Math.min(139, zone.cy + dy * factor)),
      };
    }
    return {
      x: Math.max(1, Math.min(99, p.x)),
      y: Math.max(1, Math.min(139, p.y)),
    };
  }

  return {
    x: Math.max(minX, Math.min(maxX, p.x)),
    y: Math.max(minY, Math.min(maxY, p.y)),
  };
}

export interface ComputeFlagPullParams {
  effectivePlayers: Player[];
  effectiveRoutes: Route[];
  losY: number;
  targetReceiverId?: string | null;
  defenseScheme?: DefenseScheme;
  zones?: ZoneCoverage[];
  defenderZoneMap?: Map<string, ZoneCoverage>;
  defenderAssignments?: Map<string, Player>;
}

/**
 * Calculates total route duration (including initial delay and intermediate pauses)
 */
export function getRouteDuration(
  points: Point[],
  speed: number,
  delaySec: number = 0
): number {
  if (!points || points.length < 2 || speed <= 0) return delaySec;
  let totalTime = delaySec;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segmentLen = getDistance(p1, p2);
    totalTime += segmentLen / speed;
    const pauseSec = p2.pauseDuration ?? (p2.action === 'stop_and_go' ? 0.6 : (p2.action === 'pause' ? 0.8 : 0));
    totalTime += pauseSec;
  }
  return totalTime;
}

/**
 * Consistently selects target receiver (user selected or primary read / WR1)
 */
export function getTargetReceiver(
  offensePlayers: Player[],
  qbId: string | undefined,
  effectiveRoutes: Route[],
  selectedPlayerId?: string | null
): Player | null {
  const receivers = offensePlayers.filter((p) => p.id !== qbId);
  if (receivers.length === 0) return null;

  if (selectedPlayerId) {
    const selected = receivers.find((r) => r.id === selectedPlayerId);
    if (selected) return selected;
  }

  return (
    receivers.find((r) => r.readProgression === 1) ||
    receivers.find((r) => r.role === 'WR1') ||
    receivers.find((r) => {
      const route = effectiveRoutes.find((rt) => rt.playerId === r.id);
      return route && route.points.length >= 2;
    }) ||
    receivers[0]
  );
}

/**
 * Dynamically finds the MOST OPPORTUNE MOMENT for the QB to release the pass:
 * 1. Checks rusher pressure to know how much pocket time the QB has before getting sacked.
 * 2. Scans receiver's route progression (looking for cuts, breaks, and settling in open space).
 * 3. Scans defender separation to identify when the receiver is most open with the cleanest passing window.
 * 4. Releases the ball at that exact optimal moment!
 */
export function calculatePassTimings(
  qb: Player | null,
  qbRoute: Route | null | undefined,
  targetReceiver: Player | null,
  targetRoute: Route | null | undefined,
  targetSpeed: number,
  defensePlayers: Player[] = [],
  losY: number = 78
): {
  releaseTimeSec: number;
  qbReleasePos: { x: number; y: number };
  catchTimeSec: number;
  targetCatchPos: { x: number; y: number };
} {
  const qbSpeed = qb ? BASE_SPRINT_SPEED * ((qb.speedRating || 88) / 88) : BASE_SPRINT_SPEED;

  const getQbPosAt = (t: number): { x: number; y: number } => {
    if (qbRoute && qbRoute.points && qbRoute.points.length >= 2) {
      return getPositionAtTime(qbRoute.points, t, qbSpeed, qb?.delaySec || 0);
    }
    return qb ? { x: qb.x, y: qb.y } : { x: 50, y: 92 };
  };

  const getReceiverPosAt = (t: number): { x: number; y: number; angle: number; isPaused?: boolean } => {
    if (targetReceiver && targetRoute && targetRoute.points && targetRoute.points.length >= 2) {
      return getPositionAtTime(targetRoute.points, t, targetSpeed, targetReceiver.delaySec || 0);
    }
    return {
      x: targetReceiver ? targetReceiver.x : 50,
      y: targetReceiver ? targetReceiver.y : 50,
      angle: 0,
    };
  };

  // 1. Calculate Rusher Threat / Pocket Clock
  const rusher = defensePlayers.find((p) => p.role === 'RUSH');
  let tSack = 8.0; // Default plenty of pocket time if no rusher
  if (rusher) {
    const rusherSpeed = BASE_SPRINT_SPEED * ((rusher.speedRating || 88) / 88);
    // Find time when rusher reaches QB
    for (let t = 0.5; t <= 8.0; t += 0.05) {
      const qbPos = getQbPosAt(t);
      const distToQb = getDistance({ x: rusher.x, y: rusher.y }, qbPos);
      const distRun = t * rusherSpeed;
      if (distRun >= distToQb - FLAG_PULL_RADIUS) {
        tSack = t;
        break;
      }
    }
  }

  // Maximum time QB can hold the ball before being sacked or forced out
  const maxReleaseTime = Math.max(0.9, Math.min(6.5, tSack - 0.25));
  const minReleaseTime = 0.85; // Minimum dropback & foot plant time

  // 2. Identify Route Cut Points (where receiver breaks / changes direction)
  const cutTimes: number[] = [];
  if (targetRoute && targetRoute.points && targetRoute.points.length >= 3) {
    let accumulatedTime = targetReceiver?.delaySec || 0;
    for (let i = 0; i < targetRoute.points.length - 1; i++) {
      const p1 = targetRoute.points[i];
      const p2 = targetRoute.points[i + 1];
      const segLen = getDistance(p1, p2);
      accumulatedTime += segLen / targetSpeed;
      if (i > 0) {
        // Point i was a cut / turn
        cutTimes.push(accumulatedTime);
      }
    }
  }

  // 3. Scan candidate release times in pocket window (0.05s increments)
  let bestReleaseTime = 1.2;
  let bestCatchTime = 1.8;
  let bestScore = -9999;
  let bestCatchPos = targetReceiver ? { x: targetReceiver.x, y: targetReceiver.y } : { x: 50, y: 50 };

  const nonRushDefenders = defensePlayers.filter((p) => p.role !== 'RUSH');

  for (let tCand = minReleaseTime; tCand <= maxReleaseTime; tCand += 0.05) {
    const qbPos = getQbPosAt(tCand);
    const recPos = getReceiverPosAt(tCand);
    const passDist = Math.max(6, getDistance(qbPos, recPos));
    const flightDurationSec = Math.max(0.4, Math.min(1.6, passDist / 30.0));
    const tCatch = tCand + flightDurationSec;
    const catchPos = getReceiverPosAt(tCatch);

    // Score Component A: Separation from Defenders at Catch Point
    let minDefenderDist = 999;
    for (const def of nonRushDefenders) {
      const defDist = getDistance({ x: def.x, y: def.y }, catchPos);
      if (defDist < minDefenderDist) {
        minDefenderDist = defDist;
      }
    }

    const separationScore = Math.min(12, minDefenderDist * 1.8);

    // Score Component B: Route Cut Anticipation Bonus
    // High bonus for throwing on time right as receiver breaks out of their cut!
    let cutBonus = 0;
    for (const ct of cutTimes) {
      const dtCut = Math.abs(tCand - ct);
      if (dtCut < 0.28) {
        cutBonus = 6.0;
        break;
      }
    }

    // Score Component C: Settled / Paused in Soft Spot of Zone
    let pauseBonus = 0;
    if (catchPos.isPaused) {
      pauseBonus = 4.0;
    }

    // Score Component D: Positive Downfield Yardage Gained
    const depthYards = (losY - catchPos.y) / UNITS_PER_YARD;
    const depthBonus = Math.max(-4, Math.min(6, depthYards * 0.35));

    // Score Component E: Pocket Safety Penalty
    let pocketPenalty = 0;
    const timeUntilSack = tSack - tCand;
    if (timeUntilSack < 0.4) {
      pocketPenalty = 10.0; // Imminent sack!
    } else if (timeUntilSack < 0.7) {
      pocketPenalty = 3.5;
    }

    // Total Opportunity Score
    const totalScore = separationScore + cutBonus + pauseBonus + depthBonus - pocketPenalty;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestReleaseTime = tCand;
      bestCatchTime = tCatch;
      bestCatchPos = { x: catchPos.x, y: catchPos.y };
    }
  }

  bestReleaseTime = +bestReleaseTime.toFixed(2);
  bestCatchTime = +bestCatchTime.toFixed(2);
  const qbReleasePos = getQbPosAt(bestReleaseTime);

  return {
    releaseTimeSec: bestReleaseTime,
    qbReleasePos,
    catchTimeSec: bestCatchTime,
    targetCatchPos: bestCatchPos,
  };
}

/**
 * Computes the live position of the ball carrier:
 * - Follows assigned route completely and seamlessly.
 * - When the route trajectory finishes ("al acabarse la trayectoria"):
 *   Immediately continues sprinting forward towards the opponent's endzone (Touchdown)
 *   starting from the EXACT last point of the route at full speed, with 0 lateral jump or teleportation!
 */
export function getCarrierLivePosition(
  carrier: Player,
  route: Route | null | undefined,
  speed: number,
  delaySec: number,
  t: number,
  catchTimeSec: number
): { x: number; y: number; angle: number } {
  if (t <= 0) {
    return { x: carrier.x, y: carrier.y, angle: 0 };
  }

  // Pre-snap motion support
  let effectiveT = t;
  let effectiveCatchTime = catchTimeSec;
  if (carrier.hasMotion) {
    const motionTargetX = carrier.motionTargetX ?? (carrier.x < 50 ? carrier.x + 30 : carrier.x - 30);
    const motionDurationSec = 0.5;
    if (t < motionDurationSec) {
      const motionT = t / motionDurationSec;
      return {
        x: carrier.x + (motionTargetX - carrier.x) * motionT,
        y: carrier.y,
        angle: motionTargetX > carrier.x ? 0 : 180,
      };
    }
    effectiveT = Math.max(0, t - motionDurationSec);
    effectiveCatchTime = Math.max(0, catchTimeSec - motionDurationSec);
  }

  const hasRoute = Boolean(route && route.points && route.points.length >= 2);

  if (hasRoute && route) {
    const routeDuration = getRouteDuration(route.points, speed, delaySec);
    const lastPoint = route.points[route.points.length - 1];
    const prevPoint = route.points[route.points.length - 2] || lastPoint;
    const routeEndAngle = getAngle(prevPoint, lastPoint);

    // 1. While within the route trajectory duration:
    // ALWAYS smoothly follow the route points directly!
    // No lateral jumping, no snapping back, preserves exact drawn trajectory.
    if (effectiveT < routeDuration) {
      return getPositionAtTime(route.points, effectiveT, speed, delaySec);
    }

    // 2. Trajectory has completed (effectiveT >= routeDuration):
    // If the pass hasn't been caught yet, hold position at route endpoint
    if (effectiveT < effectiveCatchTime) {
      return {
        x: lastPoint.x,
        y: lastPoint.y,
        angle: routeEndAngle,
      };
    }

    // 3. Trajectory finished & ball caught: SPRINT TO TOUCHDOWN!
    // Starts continuously from the EXACT lastPoint.x and lastPoint.y with 0 jump.
    const sprintStartTime = Math.max(routeDuration, effectiveCatchTime);
    const tSprint = Math.max(0, effectiveT - sprintStartTime);
    const sprintDist = tSprint * speed;

    // Strictly preserve exact horizontal X coordinate from the route's last point! Zero lateral shift.
    const currentX = Math.max(2, Math.min(98, lastPoint.x));
    // Seamlessly continue running straight towards the opponent's endzone (y decreasing towards 0)
    const currentY = Math.max(2, lastPoint.y - sprintDist);

    // Smoothly blend heading angle from the route's exit angle toward -90 (endzone north) over 0.25s
    const blend = Math.min(1, Math.max(0, tSprint / 0.25));
    let diff = -90 - routeEndAngle;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    const currentAngle = routeEndAngle + diff * blend;

    return {
      x: currentX,
      y: currentY,
      angle: currentAngle,
    };
  }

  // Fallback if player has no route:
  if (effectiveT < effectiveCatchTime) {
    return { x: carrier.x, y: carrier.y, angle: 0 };
  }

  const tSprint = Math.max(0, effectiveT - effectiveCatchTime);
  const sprintDist = tSprint * speed;
  return {
    x: carrier.x,
    y: Math.max(2, carrier.y - sprintDist),
    angle: -90,
  };
}

export interface ComputeDefenderPosParams {
  defender: Player;
  defSpeed: number;
  t: number;
  losY: number;
  releaseTimeSec: number;
  catchTimeSec: number;
  targetCatchPos: { x: number; y: number };
  getCarrierPos: (time: number) => { x: number; y: number };
  qbPos: (time: number) => { x: number; y: number };
  assignedZone?: ZoneCoverage;
  assignedReceiverPos?: (time: number) => { x: number; y: number };
  route?: Route;
  getOffensiveThreats?: (time: number) => Array<{ id: string; x: number; y: number; isCarrier?: boolean }>;
}

/**
 * Continuous physical integration for defenders:
 * 1. ALWAYS moves at strictly `defSpeed` (never teleports, jumps, or snaps!).
 * 2. Si el defensor tiene zona asignada:
 *    - NO PUEDE SALIRSE DE SU CUADRO bajo ninguna circunstancia (pase lo que pase).
 *    - Ataca a cualquier jugador ofensivo (portador o receptores) que ingrese o cruce por su zona.
 *    - Si nadie está en su zona, se queda vigilando adentro de su cuadro.
 * 3. Before the pass is thrown (t < releaseTimeSec), ONLY the rusher can cross the Line of Scrimmage.
 *    Non-rushers are physically held on their side of the LOS (y <= losY - 0.5).
 * 4. Once the pass is thrown / caught, defenders without assigned zone cross the line at full speed in pursuit!
 */
export function computeDefenderPositionAtTime({
  defender,
  defSpeed,
  t,
  losY,
  releaseTimeSec,
  catchTimeSec,
  targetCatchPos,
  getCarrierPos,
  qbPos,
  assignedZone,
  assignedReceiverPos,
  route,
  getOffensiveThreats,
}: ComputeDefenderPosParams): { x: number; y: number; angle: number } {
  if (t <= 0) {
    if (assignedZone && isPointInsideZoneStrict({ x: defender.x, y: defender.y }, assignedZone)) {
      const clamped = clampPointStrictlyToZone({ x: defender.x, y: defender.y }, assignedZone);
      return { x: clamped.x, y: clamped.y, angle: 90 };
    }
    return { x: defender.x, y: defender.y, angle: 90 };
  }

  // Numerical physical integration with fixed timestep dt = 0.025s (40 Hz)
  const dt = 0.025;
  const totalSteps = Math.floor(t / dt);
  let curX = defender.x;
  let curY = defender.y;
  let curAngle = 90;

  const isRusher = defender.role === 'RUSH';

  // Si tiene zona asignada, verificamos si ya empezó dentro o si ingresa
  let hasEnteredZone = assignedZone ? isPointInsideZoneStrict({ x: defender.x, y: defender.y }, assignedZone) : false;

  const getTargetAtTime = (stepTime: number): { x: number; y: number } => {
    // 0. El Rusher SIEMPRE se queda con el QB: es cobertura personal directa contra el QB en todo momento
    if (isRusher) {
      return qbPos(stepTime);
    }

    // 1. COMPORTAMIENTO ESTRICTO DE ZONA DEFENSIVA:
    // "cuando un defensivo este asignado a su zona, no se puede salir de su cuadro,
    // la idea es que se queden ahi pase lo que pase , y vayan a por el que sea que pase por su zona"
    if (assignedZone) {
      // Identificar todas las amenazas ofensivas activas en este instante
      const allThreats = getOffensiveThreats
        ? getOffensiveThreats(stepTime)
        : [
            { id: 'carrier', x: getCarrierPos(stepTime).x, y: getCarrierPos(stepTime).y, isCarrier: stepTime >= catchTimeSec },
            { id: 'qb', x: qbPos(stepTime).x, y: qbPos(stepTime).y, isCarrier: stepTime < releaseTimeSec },
          ];

      // Filtrar únicamente los jugadores ofensivos que están DENTRO de su zona asignada
      const threatsInZone = allThreats.filter((th) => isPointInsideZoneStrict({ x: th.x, y: th.y }, assignedZone));

      // Prioridad 1: Portador del balón dentro de la zona -> Ir directo a por él para jalar la bandera
      const carrierInZone = threatsInZone.find((th) => th.isCarrier);
      if (carrierInZone) {
        return clampPointStrictlyToZone(carrierInZone, assignedZone);
      }

      // Prioridad 2: Balón en el aire hacia esta zona -> Anticipar corte al punto de atrapada
      if (stepTime >= releaseTimeSec && stepTime < catchTimeSec) {
        if (isPointInsideZoneStrict(targetCatchPos, assignedZone)) {
          return clampPointStrictlyToZone(targetCatchPos, assignedZone);
        }
      }

      // Prioridad 3: Uno o más receptores ofensivos cruzando o dentro de la zona -> Atacar al receptor más cercano en la zona
      if (threatsInZone.length > 0) {
        let closest = threatsInZone[0];
        let minDist = Math.hypot(curX - closest.x, curY - closest.y);
        for (let i = 1; i < threatsInZone.length; i++) {
          const d = Math.hypot(curX - threatsInZone[i].x, curY - threatsInZone[i].y);
          if (d < minDist) {
            minDist = d;
            closest = threatsInZone[i];
          }
        }
        return clampPointStrictlyToZone(closest, assignedZone);
      }

      // Prioridad 4: No hay ofensivos en su zona -> Permanecer en su cuadro vigilando pase lo que pase
      // Si aún no ha completado el retroceso hacia su zona, dirigirse al centro
      const playFocus = stepTime >= catchTimeSec ? getCarrierPos(stepTime) : qbPos(stepTime);
      const patrolPoint = {
        x: assignedZone.cx + (playFocus.x - assignedZone.cx) * 0.35,
        y: assignedZone.cy + (playFocus.y - assignedZone.cy) * 0.35,
      };
      return clampPointStrictlyToZone(patrolPoint, assignedZone);
    }

    // --- COBERTURA PERSONAL O SIN ZONA (Defensores sin zona asignada) ---
    // 2. After ball is caught: ALL other non-zone defenders pursue ball carrier
    if (stepTime >= catchTimeSec) {
      return getCarrierPos(stepTime);
    }

    // 3. Ball in flight between release and catch: break toward catch point
    if (stepTime >= releaseTimeSec) {
      return targetCatchPos;
    }

    // Non-rusher in Man coverage
    if (assignedReceiverPos) {
      const rPos = assignedReceiverPos(stepTime);
      return {
        x: rPos.x,
        y: Math.min(losY - 0.5, rPos.y - 2.0),
      };
    }

    // Non-rusher on scripted route
    if (route && route.points && route.points.length >= 2) {
      const rPos = getPositionAtTime(route.points, stepTime, defSpeed, defender.delaySec || 0);
      return {
        x: rPos.x,
        y: Math.min(losY - 0.5, rPos.y),
      };
    }

    return { x: defender.x, y: defender.y };
  };

  // Step through time physically
  for (let s = 1; s <= totalSteps; s++) {
    const stepTime = s * dt;
    const target = getTargetAtTime(stepTime);

    const dx = target.x - curX;
    const dy = target.y - curY;
    const dist = Math.hypot(dx, dy);
    const maxMove = defSpeed * dt;

    if (dist > 0.001) {
      const move = Math.min(dist, maxMove);
      curX += (dx / dist) * move;
      curY += (dy / dist) * move;
      curAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    }

    // Rule: Non-rushers physically cannot cross LOS before pass release!
    if (!isRusher && stepTime < releaseTimeSec) {
      curY = Math.min(losY - 0.5, curY);
    }

    // CLAMPING ESTRICTO A LA ZONA ASIGNADA (Sin salirse jamás de su cuadro)
    if (assignedZone) {
      if (hasEnteredZone || s >= 10 || isPointInsideZoneStrict({ x: curX, y: curY }, assignedZone)) {
        hasEnteredZone = true;
        const clamped = clampPointStrictlyToZone({ x: curX, y: curY }, assignedZone);
        curX = clamped.x;
        curY = clamped.y;
      }
    }
  }

  // Remainder timestep
  const remTime = t - totalSteps * dt;
  if (remTime > 0.0001) {
    const target = getTargetAtTime(t);
    const dx = target.x - curX;
    const dy = target.y - curY;
    const dist = Math.hypot(dx, dy);
    const maxMove = defSpeed * remTime;

    if (dist > 0.001) {
      const move = Math.min(dist, maxMove);
      curX += (dx / dist) * move;
      curY += (dy / dist) * move;
      curAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    }

    if (!isRusher && t < releaseTimeSec) {
      curY = Math.min(losY - 0.5, curY);
    }

    if (assignedZone) {
      if (hasEnteredZone || isPointInsideZoneStrict({ x: curX, y: curY }, assignedZone)) {
        hasEnteredZone = true;
        const clamped = clampPointStrictlyToZone({ x: curX, y: curY }, assignedZone);
        curX = clamped.x;
        curY = clamped.y;
      }
    }
  }

  // Final check: si tiene zona asignada, asegurar estrictamente que las coordenadas estén dentro del cuadro
  if (assignedZone && (hasEnteredZone || t >= 0.25)) {
    const clamped = clampPointStrictlyToZone({ x: curX, y: curY }, assignedZone);
    curX = clamped.x;
    curY = clamped.y;
  }

  return { x: curX, y: curY, angle: curAngle };
}

/**
 * Accurately calculates the exact moment and location where a defender pulls the flag
 * from the ball-carrier, or sacks the QB before throw, or scores a touchdown.
 * Play runs up to 15 seconds or stops when a flag pull occurs.
 */
export function computeFlagPullEvent({
  effectivePlayers,
  effectiveRoutes,
  losY,
  targetReceiverId,
  defenseScheme = 'cover2',
  zones,
  defenderZoneMap: providedZoneMap,
  defenderAssignments: providedAssignments,
}: ComputeFlagPullParams): FlagPullEvent {
  const isManCoverage = defenseScheme === 'cover1' || defenseScheme === 'blitz';

  // Build effective zones if not provided
  let effectiveZones: ZoneCoverage[] = zones || [];
  if ((!zones || zones.length === 0) && !isManCoverage) {
    const defSchemeData = DEFENSE_SCHEMES_DATA[defenseScheme] || DEFENSE_SCHEMES_DATA.cover2;
    effectiveZones = defSchemeData.zones || [];
  }

  // Build defender zone map with robust player mapping
  const defenderZoneMap = providedZoneMap || new Map<string, ZoneCoverage>();
  if (!providedZoneMap && !isManCoverage) {
    effectiveZones.forEach((z) => {
      defenderZoneMap.set(z.playerId, z);
      const matchingPlayer = effectivePlayers.find(
        (p) =>
          p.id === z.playerId ||
          (z.playerId.startsWith('def_') && p.role?.toLowerCase() === z.playerId.replace('def_', '').toLowerCase()) ||
          (p.team === 'defense' && p.role === (z as any).role)
      );
      if (matchingPlayer) {
        defenderZoneMap.set(matchingPlayer.id, z);
      }
    });
  }

  // Build defender assignments for man coverage if not provided
  const defenderAssignments = providedAssignments || new Map<string, Player>();
  if (!providedAssignments && isManCoverage) {
    const offenseReceivers = effectivePlayers.filter((p) => p.team === 'offense' && p.role !== 'QB');
    const sortedReceivers = [...offenseReceivers].sort((a, b) => a.x - b.x);
    const defensePlayers = effectivePlayers.filter((p) => p.team === 'defense');
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

  const offensePlayers = effectivePlayers.filter((p) => p.team === 'offense');
  const defensePlayers = effectivePlayers.filter((p) => p.team === 'defense');

  const qb = offensePlayers.find((p) => p.role === 'QB') || offensePlayers[0] || null;
  const qbRoute = qb ? effectiveRoutes.find((r) => r.playerId === qb.id) : null;
  const qbSpeed = qb ? BASE_SPRINT_SPEED * ((qb.speedRating || 88) / 88) : BASE_SPRINT_SPEED;

  // Determine Target Receiver (selected or primary read)
  const targetReceiver = getTargetReceiver(offensePlayers, qb?.id, effectiveRoutes, targetReceiverId);
  const targetRoute = targetReceiver ? effectiveRoutes.find((r) => r.playerId === targetReceiver.id) : null;
  const targetSpeed = targetReceiver ? BASE_SPRINT_SPEED * ((targetReceiver.speedRating || 88) / 88) : BASE_SPRINT_SPEED;

  // Pass timing calculation: DYNAMIC OPPORTUNE THROW MOMENT
  const { releaseTimeSec, targetCatchPos, catchTimeSec } = calculatePassTimings(
    qb,
    qbRoute,
    targetReceiver,
    targetRoute,
    targetSpeed,
    defensePlayers,
    losY
  );

  // If there are NO defenders on the field, no flag can ever be pulled!
  if (defensePlayers.length === 0) {
    const carrier = targetReceiver || qb || offensePlayers[0];
    return {
      occurred: false,
      isSack: false,
      isTouchdown: true,
      progress: 1.0,
      timeSec: BASE_DURATION_SEC,
      yardLine: 0,
      yardsGained: +((losY - GOAL_LINE_Y) / UNITS_PER_YARD).toFixed(1),
      carrierId: carrier?.id || 'off_carrier',
      carrierLabel: carrier?.label || 'WR',
      carrierName: carrier?.customName || carrier?.label || 'Receptor',
      location: { x: carrier ? carrier.x : 50, y: GOAL_LINE_Y },
      closestDefenderDistYards: 99,
      passReleaseTimeSec: releaseTimeSec,
      passCatchTimeSec: catchTimeSec,
    };
  }

  // QB position across time
  const getQbPosAtTime = (time: number): { x: number; y: number } => {
    if (qbRoute && qbRoute.points.length >= 2) {
      return getPositionAtTime(qbRoute.points, time, qbSpeed, qb?.delaySec || 0);
    }
    return qb ? { x: qb.x, y: qb.y } : { x: 50, y: 92 };
  };

  // Live Carrier position across time
  const getCarrierPos = (time: number): { x: number; y: number } => {
    const carrier = targetReceiver || qb;
    if (!carrier) return { x: 50, y: 50 };
    return getCarrierLivePosition(
      carrier,
      targetReceiver ? targetRoute : qbRoute,
      targetReceiver ? targetSpeed : qbSpeed,
      carrier.delaySec || 0,
      time,
      catchTimeSec
    );
  };

  // Pre-calculate defender trackers
  const defenderTrackers = defensePlayers.map((def) => {
    const route = effectiveRoutes.find((r) => r.playerId === def.id);
    const speed = BASE_SPRINT_SPEED * ((def.speedRating || 88) / 88);
    const assignedZone = defenderZoneMap?.get(def.id);
    const assignedReceiver = defenderAssignments?.get(def.id);
    const assignedReceiverRoute = assignedReceiver ? effectiveRoutes.find((r) => r.playerId === assignedReceiver.id) : null;
    const assignedReceiverSpeed = assignedReceiver ? BASE_SPRINT_SPEED * ((assignedReceiver.speedRating || 88) / 88) : BASE_SPRINT_SPEED;

    const assignedReceiverPos = assignedReceiver
      ? (time: number) => {
          if (assignedReceiverRoute && assignedReceiverRoute.points && assignedReceiverRoute.points.length >= 2) {
            return getPositionAtTime(assignedReceiverRoute.points, Math.max(0, time - 0.15), assignedReceiverSpeed, assignedReceiver.delaySec || 0);
          }
          return { x: assignedReceiver.x, y: assignedReceiver.y };
        }
      : undefined;

    return {
      player: def,
      speed,
      route,
      assignedZone,
      assignedReceiverPos,
    };
  });

  // Discrete collision search along playback timeline (dt = 0.03s, up to 15s)
  const dt = 0.03;
  const maxSteps = Math.floor(BASE_DURATION_SEC / dt);
  let minDistanceSoFar = 9999;

  const getOffensiveThreatsAtTime = (time: number) => {
    const isPostCatch = time >= catchTimeSec;
    return offensePlayers.map((p) => {
      const isCarrier = isPostCatch ? p.id === targetReceiver?.id : p.id === qb?.id;
      let pos: { x: number; y: number };
      if (p.id === targetReceiver?.id) {
        pos = getCarrierPos(time);
      } else if (p.id === qb?.id) {
        pos = getQbPosAtTime(time);
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

  for (let i = 1; i <= maxSteps; i++) {
    const t = +(i * dt).toFixed(2);
    const qbPos = getQbPosAtTime(t);

    // 1. SACK CHECK (Before pass release: ONLY the Rusher can sack the QB)
    if (t < releaseTimeSec && qb) {
      for (const dtItem of defenderTrackers) {
        if (dtItem.player.role !== 'RUSH') continue;

        const defPos = computeDefenderPositionAtTime({
          defender: dtItem.player,
          defSpeed: dtItem.speed,
          t,
          losY,
          releaseTimeSec,
          catchTimeSec,
          targetCatchPos,
          getCarrierPos,
          qbPos: getQbPosAtTime,
          assignedZone: dtItem.assignedZone,
          assignedReceiverPos: dtItem.assignedReceiverPos,
          route: dtItem.route,
          getOffensiveThreats: getOffensiveThreatsAtTime,
        });

        const dist = getDistance(defPos, qbPos);
        if (dist <= FLAG_PULL_RADIUS) {
          const yardLine = Math.max(0, Math.round((qbPos.y - GOAL_LINE_Y) / UNITS_PER_YARD));
          const yardsGained = +((losY - qbPos.y) / UNITS_PER_YARD).toFixed(1);
          return {
            occurred: true,
            isSack: true,
            isTouchdown: false,
            progress: +(t / BASE_DURATION_SEC).toFixed(3),
            timeSec: t,
            yardLine,
            yardsGained,
            carrierId: qb.id,
            carrierLabel: qb.label || 'QB',
            carrierName: qb.customName || 'Quarterback',
            tacklerId: dtItem.player.id,
            tacklerLabel: dtItem.player.label,
            tacklerName: dtItem.player.customName || dtItem.player.label,
            location: { x: +qbPos.x.toFixed(1), y: +qbPos.y.toFixed(1) },
            closestDefenderDistYards: +(dist / UNITS_PER_YARD).toFixed(1),
            passReleaseTimeSec: releaseTimeSec,
            passCatchTimeSec: catchTimeSec,
          };
        }
      }
    }

    // 2. BALL IN FLIGHT
    if (t >= releaseTimeSec && t < catchTimeSec) {
      continue;
    }

    // 3. RUN AFTER CATCH & DEFENSIVE PURSUIT
    if (t >= catchTimeSec) {
      const carrier = targetReceiver || qb;
      if (!carrier) continue;

      const carrierPos = getCarrierPos(t);

      // Check Touchdown: Carrier crossed goal line without being tackled
      if (carrierPos.y <= GOAL_LINE_Y) {
        const yardsGained = +((losY - GOAL_LINE_Y) / UNITS_PER_YARD).toFixed(1);
        return {
          occurred: true,
          isSack: false,
          isTouchdown: true,
          progress: +(t / BASE_DURATION_SEC).toFixed(3),
          timeSec: t,
          yardLine: 0,
          yardsGained,
          carrierId: carrier.id,
          carrierLabel: carrier.label,
          carrierName: carrier.customName || carrier.label,
          location: { x: +carrierPos.x.toFixed(1), y: +carrierPos.y.toFixed(1) },
          closestDefenderDistYards: +(minDistanceSoFar / UNITS_PER_YARD).toFixed(1),
          passReleaseTimeSec: releaseTimeSec,
          passCatchTimeSec: catchTimeSec,
        };
      }

      // Check all defenders in pursuit
      for (const dtItem of defenderTrackers) {
        // El rusher siempre se queda con el QB y no persigue a receptores campo abajo
        if (dtItem.player.role === 'RUSH' && carrier.id !== qb?.id) {
          continue;
        }

        const defPos = computeDefenderPositionAtTime({
          defender: dtItem.player,
          defSpeed: dtItem.speed,
          t,
          losY,
          releaseTimeSec,
          catchTimeSec,
          targetCatchPos,
          getCarrierPos,
          qbPos: getQbPosAtTime,
          assignedZone: dtItem.assignedZone,
          assignedReceiverPos: dtItem.assignedReceiverPos,
          route: dtItem.route,
          getOffensiveThreats: getOffensiveThreatsAtTime,
        });

        const dist = getDistance(defPos, carrierPos);
        const distYards = +(dist / UNITS_PER_YARD).toFixed(1);

        if (dist < minDistanceSoFar) {
          minDistanceSoFar = dist;
        }

        // FLAG PULL SUCCESSFUL: Defender physically reached the ball carrier!
        if (dist <= FLAG_PULL_RADIUS) {
          const yardLine = Math.max(0, Math.round((carrierPos.y - GOAL_LINE_Y) / UNITS_PER_YARD));
          const yardsGained = +((losY - carrierPos.y) / UNITS_PER_YARD).toFixed(1);
          return {
            occurred: true,
            isSack: false,
            isTouchdown: false,
            progress: +(t / BASE_DURATION_SEC).toFixed(3),
            timeSec: t,
            yardLine,
            yardsGained,
            carrierId: carrier.id,
            carrierLabel: carrier.label,
            carrierName: carrier.customName || carrier.label,
            tacklerId: dtItem.player.id,
            tacklerLabel: dtItem.player.label,
            tacklerName: dtItem.player.customName || dtItem.player.label,
            location: { x: +carrierPos.x.toFixed(1), y: +carrierPos.y.toFixed(1) },
            closestDefenderDistYards: distYards,
            passReleaseTimeSec: releaseTimeSec,
            passCatchTimeSec: catchTimeSec,
          };
        }
      }
    }
  }

  // Play finished at 15s without tackle
  const finalCarrier = targetReceiver || qb || offensePlayers[0];
  const finalPos = getCarrierPos(BASE_DURATION_SEC);
  const isTD = finalPos.y <= GOAL_LINE_Y;

  return {
    occurred: false,
    isSack: false,
    isTouchdown: isTD,
    progress: 1.0,
    timeSec: BASE_DURATION_SEC,
    yardLine: Math.max(0, Math.round((finalPos.y - GOAL_LINE_Y) / UNITS_PER_YARD)),
    yardsGained: +((losY - finalPos.y) / UNITS_PER_YARD).toFixed(1),
    carrierId: finalCarrier?.id || 'off_carrier',
    carrierLabel: finalCarrier?.label || 'WR',
    carrierName: finalCarrier?.customName || 'Receptor',
    location: { x: +finalPos.x.toFixed(1), y: +finalPos.y.toFixed(1) },
    closestDefenderDistYards: +(minDistanceSoFar / UNITS_PER_YARD).toFixed(1),
    passReleaseTimeSec: releaseTimeSec,
    passCatchTimeSec: catchTimeSec,
  };
}
