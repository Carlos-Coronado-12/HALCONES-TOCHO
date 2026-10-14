import { Point } from '../types/playbook';

/**
 * Calculates Euclidean distance between two points (in percentage space 0-100)
 */
export function getDistance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Computes total length of a polyline
 */
export function getPathLength(points: Point[]): number {
  if (points.length < 2) return 0;
  let len = 0;
  for (let i = 0; i < points.length - 1; i++) {
    len += getDistance(points[i], points[i + 1]);
  }
  return len;
}

/**
 * Gets position along a polyline at normalized progress t [0.0 - 1.0]
 */
export function getPositionAlongPath(points: Point[], t: number): { x: number; y: number; angle: number } {
  if (points.length === 0) return { x: 50, y: 50, angle: 0 };
  if (points.length === 1 || t <= 0) {
    const angle = points.length > 1 ? getAngle(points[0], points[1]) : 0;
    return { x: points[0].x, y: points[0].y, angle };
  }
  if (t >= 1) {
    const last = points[points.length - 1];
    const prev = points[points.length - 2];
    const angle = prev ? getAngle(prev, last) : 0;
    return { x: last.x, y: last.y, angle };
  }

  const totalLength = getPathLength(points);
  if (totalLength === 0) return { x: points[0].x, y: points[0].y, angle: 0 };

  return getPositionAtDistance(points, t * totalLength);
}

/**
 * Gets position along a polyline at an absolute distance in SVG units.
 * Guarantees 100% constant speed regardless of segment lengths.
 */
export function getPositionAtDistance(points: Point[], distance: number): { x: number; y: number; angle: number } {
  if (points.length === 0) return { x: 50, y: 50, angle: 0 };
  if (points.length === 1 || distance <= 0) {
    const angle = points.length > 1 ? getAngle(points[0], points[1]) : 0;
    return { x: points[0].x, y: points[0].y, angle };
  }

  let currentDist = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segmentLen = getDistance(p1, p2);

    if (currentDist + segmentLen >= distance || i === points.length - 2) {
      const remaining = Math.max(0, distance - currentDist);
      const segmentT = segmentLen > 0 ? Math.min(1, remaining / segmentLen) : 0;
      const x = p1.x + (p2.x - p1.x) * segmentT;
      const y = p1.y + (p2.y - p1.y) * segmentT;
      const angle = getAngle(p1, p2);
      return { x, y, angle };
    }
    currentDist += segmentLen;
  }

  const lastPoint = points[points.length - 1];
  const prevPoint = points[points.length - 2] || points[0];
  return { x: lastPoint.x, y: lastPoint.y, angle: getAngle(prevPoint, lastPoint) };
}

/**
 * Calculates angle in degrees from p1 to p2 (0 is up, 90 is right)
 */
export function getAngle(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/**
 * Generates an SVG path string from points, using smooth quadratic Bézier curves
 */
export function pointsToSvgPath(points: Point[]): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
  }
  
  const last = points[points.length - 1];
  const secondLast = points[points.length - 2];
  d += ` Q ${secondLast.x} ${secondLast.y}, ${last.x} ${last.y}`;
  
  return d;
}

/**
 * Calculates player position along a route taking into account:
 * 1. Initial pre-route delay / wait time at the snap (`initialDelaySec`)
 * 2. Intermediate point pauses (e.g. Stop & Go fake stops, zone settling, screen delay)
 * 3. Constant uniform physical sprinting speed along segments
 */
export function getPositionAtTime(
  points: Point[],
  timeSec: number,
  athleteSpeed: number,
  initialDelaySec: number = 0
): { x: number; y: number; angle: number; isPaused?: boolean } {
  if (!points || points.length === 0) return { x: 50, y: 50, angle: 0, isPaused: false };
  if (points.length === 1) {
    return { x: points[0].x, y: points[0].y, angle: 0, isPaused: timeSec <= initialDelaySec };
  }

  // If time has not passed the initial delay, player stays static at starting point
  if (timeSec <= initialDelaySec) {
    const startAngle = getAngle(points[0], points[1]);
    return { x: points[0].x, y: points[0].y, angle: startAngle, isPaused: true };
  }

  let remainingTime = timeSec - initialDelaySec;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segmentLen = getDistance(p1, p2);
    const segmentTime = athleteSpeed > 0 ? segmentLen / athleteSpeed : 0;

    // Is player currently traversing this segment?
    if (remainingTime < segmentTime) {
      const segmentT = segmentTime > 0 ? remainingTime / segmentTime : 0;
      const x = p1.x + (p2.x - p1.x) * segmentT;
      const y = p1.y + (p2.y - p1.y) * segmentT;
      const angle = getAngle(p1, p2);
      return { x, y, angle, isPaused: false };
    }

    remainingTime -= segmentTime;

    // Check if there is a pause/stop at point p2 (e.g., Stop & Go or static wait in zone)
    const pauseSec = p2.pauseDuration ?? (p2.action === 'stop_and_go' ? 0.6 : (p2.action === 'pause' ? 0.8 : 0));
    if (pauseSec > 0) {
      if (remainingTime < pauseSec) {
        // Player is paused at p2
        const nextPoint = points[i + 2] || p2;
        const angle = points[i + 2] ? getAngle(p2, nextPoint) : getAngle(p1, p2);
        return { x: p2.x, y: p2.y, angle, isPaused: true };
      }
      remainingTime -= pauseSec;
    }
  }

  // Player reached the final point of the route
  const lastPoint = points[points.length - 1];
  const prevPoint = points[points.length - 2] || points[0];
  return { x: lastPoint.x, y: lastPoint.y, angle: getAngle(prevPoint, lastPoint), isPaused: false };
}

/**
 * Preset route geometries relative to a player start point
 */
export type RoutePresetType = 
  | 'stop_and_go'
  | 'sluggo'
  | 'out_and_up'
  | 'whip'
  | 'delay_screen'
  | 'slant_in'
  | 'out'
  | 'in_dig'
  | 'curl'
  | 'post'
  | 'corner'
  | 'go_fly'
  | 'drag'
  | 'wheel'
  | 'flat'
  | 'hitch'
  | 'rusher_blitz';

export function generatePresetRoute(start: Point, type: RoutePresetType, isLeftSide: boolean = true): Point[] {
  const dir = isLeftSide ? 1 : -1;
  const { x, y } = start;

  switch (type) {
    case 'stop_and_go':
      return [
        { x, y, action: 'start' },
        { x: x, y: y - 10, action: 'stop_and_go', pauseDuration: 0.6 },
        { x: x + 2 * dir, y: y - 8 },
        { x: x + 4 * dir, y: y - 36, action: 'end' }
      ];
    case 'sluggo':
      return [
        { x, y, action: 'start' },
        { x: x + 6 * dir, y: y - 6, action: 'stop_and_go', pauseDuration: 0.5 },
        { x: x + 4 * dir, y: y - 34, action: 'end' }
      ];
    case 'out_and_up':
      return [
        { x, y, action: 'start' },
        { x: x, y: y - 8, action: 'cut' },
        { x: x - 8 * dir, y: y - 8, action: 'stop_and_go', pauseDuration: 0.5 },
        { x: x - 8 * dir, y: y - 34, action: 'end' }
      ];
    case 'whip':
      return [
        { x, y, action: 'start' },
        { x: x + 5 * dir, y: y - 4, action: 'stop_and_go', pauseDuration: 0.5 },
        { x: x - 12 * dir, y: y - 6, action: 'end' }
      ];
    case 'delay_screen':
      return [
        { x, y, action: 'pause', pauseDuration: 0.8 },
        { x: x - 8 * dir, y: y - 1, action: 'cut' },
        { x: x - 18 * dir, y: y + 2, action: 'end' }
      ];
    case 'slant_in':
      return [
        { x, y, action: 'start' },
        { x: x, y: y - 3 },
        { x: x + 16 * dir, y: y - 18, action: 'end' }
      ];
    case 'out':
      return [
        { x, y, action: 'start' },
        { x: x, y: y - 12, action: 'cut' },
        { x: x - 12 * dir, y: y - 12, action: 'end' }
      ];
    case 'in_dig':
      return [
        { x, y, action: 'start' },
        { x: x, y: y - 14, action: 'cut' },
        { x: x + 14 * dir, y: y - 14, action: 'end' }
      ];
    case 'curl':
      return [
        { x, y, action: 'start' },
        { x: x, y: y - 15 },
        { x: x + 3 * dir, y: y - 11, action: 'end' }
      ];
    case 'post':
      return [
        { x, y, action: 'start' },
        { x: x, y: y - 18, action: 'cut' },
        { x: x + 16 * dir, y: y - 36, action: 'end' }
      ];
    case 'corner':
      return [
        { x, y, action: 'start' },
        { x: x, y: y - 18, action: 'cut' },
        { x: x - 16 * dir, y: y - 34, action: 'end' }
      ];
    case 'go_fly':
      return [
        { x, y, action: 'start' },
        { x: x, y: y - 12 },
        { x: x, y: y - 38, action: 'end' }
      ];
    case 'drag':
      return [
        { x, y, action: 'start' },
        { x: x, y: y - 3, action: 'cut' },
        { x: x + 30 * dir, y: y - 4, action: 'end' }
      ];
    case 'wheel':
      return [
        { x, y, action: 'start' },
        { x: x - 6 * dir, y: y - 3 },
        { x: x - 10 * dir, y: y - 14 },
        { x: x - 8 * dir, y: y - 32, action: 'end' }
      ];
    case 'flat':
      return [
        { x, y, action: 'start' },
        { x: x - 5 * dir, y: y - 2 },
        { x: x - 14 * dir, y: y - 4, action: 'end' }
      ];
    case 'hitch':
      return [
        { x, y, action: 'start' },
        { x: x, y: y - 8 },
        { x: x, y: y - 6, action: 'end' }
      ];
    case 'rusher_blitz':
      return [
        { x, y, action: 'start' },
        { x: 50, y: y + 26, action: 'end' }
      ];
    default:
      return [{ x, y }];
  }
}

/**
 * Checks if a 2D point is inside a triangle (A, B, C)
 */
export function isPointInTriangle(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number
): boolean {
  const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
  const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3);
  const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

/**
 * Checks if a 2D point is inside an ellipse
 */
export function isPointInEllipse(
  px: number,
  py: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
): boolean {
  if (rx <= 0 || ry <= 0) return false;
  const dx = px - cx;
  const dy = py - cy;
  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1.0;
}

/**
 * Checks if a 2D point is inside a rectangle / box
 */
export function isPointInRect(
  px: number,
  py: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
): boolean {
  return Math.abs(px - cx) <= rx && Math.abs(py - cy) <= ry;
}

/**
 * Universal Zone Containment Test:
 * Tests if an offensive receiver (px, py) is inside a defensive zone shape (rectangle, circle, triangle).
 */
export function isPointInZone(
  px: number,
  py: number,
  zone: { cx: number; cy: number; rx: number; ry: number; shape?: 'rectangle' | 'circle' | 'triangle' }
): boolean {
  const shape = zone.shape || 'rectangle';
  if (shape === 'circle') {
    return isPointInEllipse(px, py, zone.cx, zone.cy, zone.rx, zone.ry);
  }
  if (shape === 'triangle') {
    return isPointInTriangle(
      px,
      py,
      zone.cx,
      zone.cy - zone.ry,
      zone.cx + zone.rx,
      zone.cy + zone.ry,
      zone.cx - zone.rx,
      zone.cy + zone.ry
    );
  }
  // Default rectangle
  return isPointInRect(px, py, zone.cx, zone.cy, zone.rx, zone.ry);
}

export interface PolylineProjection {
  point: Point;           // Closest point strictly lying on the polyline
  distance: number;       // Perpendicular distance from test point to polyline
  distanceAlong: number;  // Arc length along the polyline from start to this point
  t: number;              // Normalized progress along polyline [0.0 - 1.0]
  segmentIndex: number;   // Index of the segment [points[i], points[i+1]]
}

/**
 * Projects a 2D point onto a polyline.
 * Returns the exact closest point strictly lying ON the polyline,
 * along with the arc length distance and segment index.
 */
export function projectPointOntoPolyline(p: Point, points: Point[]): PolylineProjection {
  if (points.length === 0) {
    return { point: { x: p.x, y: p.y }, distance: 0, distanceAlong: 0, t: 0, segmentIndex: 0 };
  }
  if (points.length === 1) {
    return {
      point: { x: points[0].x, y: points[0].y },
      distance: getDistance(p, points[0]),
      distanceAlong: 0,
      t: 0,
      segmentIndex: 0,
    };
  }

  const totalLength = getPathLength(points);
  let minDistance = Infinity;
  let bestPoint: Point = { x: points[0].x, y: points[0].y };
  let bestDistanceAlong = 0;
  let bestSegmentIndex = 0;

  let accumulatedDist = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    const segLen = Math.sqrt(lenSq);

    let u = 0;
    if (lenSq > 0.00001) {
      u = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
      u = Math.max(0, Math.min(1, u));
    }

    const projX = a.x + u * dx;
    const projY = a.y + u * dy;
    const dist = Math.hypot(p.x - projX, p.y - projY);

    if (dist < minDistance) {
      minDistance = dist;
      bestPoint = { x: projX, y: projY };
      bestDistanceAlong = accumulatedDist + u * segLen;
      bestSegmentIndex = i;
    }

    accumulatedDist += segLen;
  }

  const t = totalLength > 0 ? Math.max(0, Math.min(1, bestDistanceAlong / totalLength)) : 0;

  return {
    point: bestPoint,
    distance: minDistance,
    distanceAlong: bestDistanceAlong,
    t,
    segmentIndex: bestSegmentIndex,
  };
}

/**
 * Strips any stop_and_go or pause waypoint from the points array,
 * returning the clean baseline trajectory polyline.
 */
export function getRouteBasePoints(points: Point[]): Point[] {
  if (points.length <= 2) return points;
  const filtered = points.filter(
    (p, idx) =>
      idx === 0 ||
      idx === points.length - 1 ||
      (p.action !== 'stop_and_go' && p.action !== 'pause' && (!p.pauseDuration || p.pauseDuration <= 0))
  );
  return filtered.length >= 2 ? filtered : points;
}

/**
 * Inserts or moves a Stop & Go pause waypoint along a route's baseline polyline.
 * Ensures the waypoint lies 100% strictly ON the trajectory polyline,
 * clamped between minProgress and maxProgress so it cannot slide off start or end.
 */
export function insertStopAlongPolyline(
  basePoints: Point[],
  targetPoint: Point,
  pauseDuration: number = 0.6
): Point[] {
  if (basePoints.length < 2) return basePoints;

  const totalLength = getPathLength(basePoints);
  if (totalLength <= 0.01) return basePoints;

  // Project target point onto the baseline route polyline
  const proj = projectPointOntoPolyline(targetPoint, basePoints);

  // Clamp distance along the route so it doesn't collide with start (player) or end (catch)
  const minDistance = Math.min(3.5, totalLength * 0.10);
  const maxDistance = Math.max(totalLength - 3.5, totalLength * 0.90);
  const clampedDist = Math.max(minDistance, Math.min(maxDistance, proj.distanceAlong));

  // Find which segment in basePoints contains clampedDist
  let currentDist = 0;
  let targetSegIdx = 0;
  let segRatio = 0;

  for (let i = 0; i < basePoints.length - 1; i++) {
    const segLen = getDistance(basePoints[i], basePoints[i + 1]);
    if (currentDist + segLen >= clampedDist || i === basePoints.length - 2) {
      targetSegIdx = i;
      const rem = Math.max(0, clampedDist - currentDist);
      segRatio = segLen > 0.0001 ? Math.min(1, rem / segLen) : 0;
      break;
    }
    currentDist += segLen;
  }

  const p1 = basePoints[targetSegIdx];
  const p2 = basePoints[targetSegIdx + 1];
  const stopX = p1.x + (p2.x - p1.x) * segRatio;
  const stopY = p1.y + (p2.y - p1.y) * segRatio;

  const stopPoint: Point = {
    x: stopX,
    y: stopY,
    action: 'stop_and_go',
    pauseDuration,
  };

  return [
    ...basePoints.slice(0, targetSegIdx + 1),
    stopPoint,
    ...basePoints.slice(targetSegIdx + 1),
  ];
}

