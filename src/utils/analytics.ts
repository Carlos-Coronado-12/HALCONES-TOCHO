import { Player, Route, NextGenAnalytics, ReceiverAnalytics } from '../types/playbook';
import { getDistance } from './geometry';
import { UNITS_PER_YARD, GOAL_LINE_Y } from './playTransforms';

/**
 * Calculates NFL Next Gen Stats & PFF-grade analytics for the live simulation.
 */
export function computeNextGenAnalytics(
  effectivePlayers: Player[],
  _effectiveRoutes: Route[],
  animatedPositions: Map<string, { x: number; y: number; angle: number }>,
  _progress: number,
  targetReceiver: Player | null,
  qbPlayer: Player | null,
  _losY: number,
  baseDurationSec: number = 15.0
): NextGenAnalytics {
  const offense = effectivePlayers.filter((p) => p.team === 'offense');
  const defense = effectivePlayers.filter((p) => p.team === 'defense');
  const receivers = offense.filter((p) => p.role !== 'QB');
  const rusher = defense.find((p) => p.role === 'RUSH') || defense[0];

  // 1. Time to Throw (TTT) Index
  // Pass release occurs around 32% into the play
  const releaseT = 0.32;
  const timeToThrowSec = +(releaseT * baseDurationSec).toFixed(2);

  // 2. Time to Pressure (TTP) from Rusher
  // Rusher starts at cone (7 yds ~ 14 SVG units behind LOS) and rushes towards QB dropback
  const rusherSpeedMultiplier = (rusher?.speedRating || 90) / 90;
  const rawRushTime = (2.75 / rusherSpeedMultiplier);
  const timeToPressureSec = +(rawRushTime).toFixed(2);

  // Pressure margin: positive means QB throws before rusher arrives
  const pressureMarginSec = +(timeToPressureSec - timeToThrowSec).toFixed(2);

  let pressureStatus: 'safe' | 'pressure' | 'sack' = 'safe';
  if (pressureMarginSec < 0.0) {
    pressureStatus = 'sack';
  } else if (pressureMarginSec <= 0.35) {
    pressureStatus = 'pressure';
  } else {
    pressureStatus = 'safe';
  }

  // 3. Live Receiver Separation Metrics
  const receiversAnalytics = new Map<string, ReceiverAnalytics>();

  receivers.forEach((rec) => {
    const recPos = animatedPositions.get(rec.id) || { x: rec.x, y: rec.y, angle: 0 };
    let nearestDefId: string | null = null;
    let minDistance = 9999;

    defense.forEach((def) => {
      const defPos = animatedPositions.get(def.id) || { x: def.x, y: def.y, angle: 0 };
      const dist = getDistance(recPos, defPos);
      if (dist < minDistance) {
        minDistance = dist;
        nearestDefId = def.id;
      }
    });

    const separationYards = +(minDistance / UNITS_PER_YARD).toFixed(1);
    let status: 'open' | 'contested' | 'covered' = 'open';

    if (separationYards >= 2.0) {
      status = 'open';
    } else if (separationYards >= 1.0) {
      status = 'contested';
    } else {
      status = 'covered';
    }

    receiversAnalytics.set(rec.id, {
      playerId: rec.id,
      separationYards,
      status,
      nearestDefenderId: nearestDefId,
      nearestDefenderDist: minDistance,
    });
  });

  // 4. Target Receiver Separation
  let targetSeparationYards: number | null = null;
  let targetSeparationStatus: 'open' | 'contested' | 'covered' | null = null;

  if (targetReceiver) {
    const targetData = receiversAnalytics.get(targetReceiver.id);
    if (targetData) {
      targetSeparationYards = targetData.separationYards;
      targetSeparationStatus = targetData.status;
    }
  }

  // 5. Passing Lane Obstruction (Corridor check between QB and Target)
  let isLaneObstructed = false;
  let obstructingDefenderName: string | null = null;

  if (targetReceiver && qbPlayer) {
    const qbPos = animatedPositions.get(qbPlayer.id) || { x: qbPlayer.x, y: qbPlayer.y, angle: 0 };
    const targetPos = animatedPositions.get(targetReceiver.id) || { x: targetReceiver.x, y: targetReceiver.y, angle: 0 };

    defense.forEach((def) => {
      if (def.id === rusher?.id) return; // Rusher behind LOS is not an interception lane risk in air
      const defPos = animatedPositions.get(def.id) || { x: def.x, y: def.y, angle: 0 };

      // Distance from point (defPos) to line segment (qbPos -> targetPos)
      const distToLine = pointToSegmentDistance(defPos, qbPos, targetPos);
      const yardsToLine = distToLine / UNITS_PER_YARD;

      // If a defender is within 1.2 yards of the direct throw ray and positioned between QB and receiver
      if (yardsToLine < 1.2) {
        const isBetweenY = (defPos.y <= qbPos.y && defPos.y >= targetPos.y) || (defPos.y >= qbPos.y && defPos.y <= targetPos.y);
        if (isBetweenY) {
          isLaneObstructed = true;
          obstructingDefenderName = def.customName || def.label;
        }
      }
    });
  }

  // 6. Expected YAC (Yards after catch to goal line)
  let expectedYacYards = 0;
  if (targetReceiver) {
    const targetPos = animatedPositions.get(targetReceiver.id) || { x: targetReceiver.x, y: targetReceiver.y, angle: 0 };
    const distanceToGoal = Math.max(0, targetPos.y - GOAL_LINE_Y);
    expectedYacYards = +(distanceToGoal / UNITS_PER_YARD).toFixed(1);
  }

  return {
    timeToThrowSec,
    timeToPressureSec,
    pressureMarginSec,
    pressureStatus,
    isLaneObstructed,
    obstructingDefenderName,
    targetSeparationYards,
    targetSeparationStatus,
    expectedYacYards,
    receiversAnalytics,
  };
}

function pointToSegmentDistance(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return getDistance(p, a);

  // Projection parameter t
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return getDistance(p, { x: projX, y: projY });
}
