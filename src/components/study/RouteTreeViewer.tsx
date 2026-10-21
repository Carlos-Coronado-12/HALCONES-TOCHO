import React, { useState, useEffect } from 'react';
import { RouteDefinition } from '../../types/study';
import { OFFICIAL_ROUTE_TREE } from '../../constants/fundamentalsData';
import { RotateCcw, Sparkles, Compass } from 'lucide-react';

interface RouteTreeViewerProps {
  onTestRoute?: (routeNumber: number) => void;
}

export const RouteTreeViewer: React.FC<RouteTreeViewerProps> = () => {
  const [selectedRoute, setSelectedRoute] = useState<RouteDefinition>(OFFICIAL_ROUTE_TREE[1]); // Default Slant (2)
  const [animProgress, setAnimProgress] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);

  // Animation loop for the route runner
  useEffect(() => {
    if (!isAnimating) return;
    let startTimestamp: number | null = null;
    const duration = 2200; // ms for one full run
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      setAnimProgress(progress);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        // Pause briefly at the catch point then loop
        setTimeout(() => {
          startTimestamp = null;
          animationFrameId = requestAnimationFrame(step);
        }, 600);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [selectedRoute, isAnimating]);

  // Compute interpolated runner position along pathPoints
  const getRunnerPos = () => {
    const pts = selectedRoute.pathPoints;
    if (!pts || pts.length < 2) return { x: 50, y: 80 };
    if (pts.length === 2) {
      return {
        x: pts[0].x + (pts[1].x - pts[0].x) * animProgress,
        y: pts[0].y + (pts[1].y - pts[0].y) * animProgress,
      };
    }
    // 3 points (Start -> Stem/Cut -> End)
    if (animProgress <= 0.45) {
      const p = animProgress / 0.45;
      return {
        x: pts[0].x + (pts[1].x - pts[0].x) * p,
        y: pts[0].y + (pts[1].y - pts[0].y) * p,
      };
    } else {
      const p = (animProgress - 0.45) / 0.55;
      return {
        x: pts[1].x + (pts[2].x - pts[1].x) * p,
        y: pts[1].y + (pts[2].y - pts[1].y) * p,
      };
    }
  };

  const runnerPos = getRunnerPos();

  // Helper to generate SVG polyline path string
  const svgPathD = () => {
    const pts = selectedRoute.pathPoints;
    if (!pts || pts.length === 0) return '';
    return pts.reduce((acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
      {/* Route Selector Numbers Bar & List */}
      <div className="lg:col-span-5 flex flex-col gap-3">
        <div className="bg-[#0b140e] border border-[#1b2b20] rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Catálogo Numérico (Route Tree)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
              IFAF Standard
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Los números pares rompen hacia <strong>adentro</strong> (centro del campo) y los números impares rompen hacia <strong>afuera</strong> (la banda lateral).
          </p>

          {/* Quick Route Number Badges (1 - 9 + Special) */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {OFFICIAL_ROUTE_TREE.map((r) => {
              const isSelected = selectedRoute.number === r.number;
              const isEven = r.number !== 0 && r.number % 2 === 0 && r.number < 10;
              return (
                <button
                  key={r.number}
                  type="button"
                  onClick={() => {
                    setSelectedRoute(r);
                    setAnimProgress(0);
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border text-center ${
                    isSelected
                      ? 'bg-gradient-to-b from-emerald-500/30 to-emerald-700/20 border-emerald-400 text-white shadow-lg shadow-emerald-950/50 scale-[1.03]'
                      : 'bg-[#101b14] hover:bg-[#16271c] border-[#1d3023] text-slate-300'
                  }`}
                >
                  <span className={`text-base font-extrabold ${isSelected ? 'text-emerald-300' : isEven ? 'text-sky-300' : 'text-amber-300'}`}>
                    {r.number}
                  </span>
                  <span className="text-[10px] font-medium truncate w-full mt-0.5 opacity-90">
                    {r.name.split('/')[0].trim()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed Coaching Box for Selected Route */}
          <div className="bg-[#121f17] border border-[#233a2a] rounded-xl p-3.5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950">
                    RUTA #{selectedRoute.number}
                  </span>
                  <h4 className="text-base font-extrabold text-white">
                    {selectedRoute.name}
                  </h4>
                </div>
                <div className="text-[11px] text-emerald-400/90 font-mono mt-0.5">
                  Alias: {selectedRoute.alias || 'Estándar'} • Profundidad: {selectedRoute.depthYards}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedRoute.description}
            </p>

            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-200">
              <div className="flex items-center gap-1.5 font-bold mb-1 text-emerald-300 text-[11px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Consejo Clave del Coach
              </div>
              <p className="text-[11px] text-slate-300">
                {selectedRoute.keyCoachingPoint}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Mini-Field Canvas SVG */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center bg-[#070d09] border border-[#1c2e22] rounded-2xl p-4 relative overflow-hidden shadow-2xl">
        <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-[#111e15] border border-[#213828] text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            Vista Táctica del Corte
          </span>
        </div>

        <div className="absolute top-3 right-4 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsAnimating(!isAnimating);
            }}
            className="px-2.5 py-1 rounded-lg bg-[#122318] hover:bg-[#1a3222] border border-[#243c2c] text-xs text-emerald-300 font-semibold transition-all flex items-center gap-1"
          >
            {isAnimating ? 'Pausar' : 'Reanudar'}
          </button>
          <button
            type="button"
            onClick={() => setAnimProgress(0)}
            className="p-1 rounded-lg bg-[#122318] hover:bg-[#1a3222] border border-[#243c2c] text-slate-300 transition-all"
            title="Reiniciar carrera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tactical Field SVG */}
        <div className="w-full max-w-[480px] aspect-[4/3] relative rounded-xl border border-emerald-600/30 overflow-hidden shadow-inner my-2">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full select-none"
            style={{
              background: 'radial-gradient(ellipse at center, #1b3d26 0%, #0e2215 100%)',
            }}
          >
            <defs>
              {/* Pattern for yard stripes */}
              <pattern id="yardGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
              </pattern>
              {/* Glow filter for route line */}
              <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#34d399" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* Grass texture overlay */}
            <rect width="100" height="100" fill="url(#yardGrid)" />

            {/* Field Boundary Lines & Sidelines */}
            <rect x="5" y="5" width="90" height="90" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />

            {/* Yard lines and markers */}
            {/* End Zone or 10 yds downfield */}
            <line x1="5" y1="20" x2="95" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" strokeDasharray="1,1" />
            <text x="7" y="19" fill="rgba(255,255,255,0.3)" fontSize="3.5" fontWeight="bold">15 YDS (PROFUNDO)</text>

            <line x1="5" y1="45" x2="95" y2="45" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" strokeDasharray="1,1" />
            <text x="7" y="44" fill="rgba(255,255,255,0.3)" fontSize="3.5" fontWeight="bold">10 YDS (INTERMEDIO)</text>

            <line x1="5" y1="65" x2="95" y2="65" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" strokeDasharray="1,1" />
            <text x="7" y="64" fill="rgba(255,255,255,0.3)" fontSize="3.5" fontWeight="bold">5 YDS (CORTO)</text>

            {/* Line of Scrimmage (LOS) */}
            <line x1="5" y1="80" x2="95" y2="80" stroke="#00a859" strokeWidth="1.2" />
            <text x="7" y="79" fill="#00bf65" fontSize="3.5" fontWeight="black" letterSpacing="0.2">
              L.O.S. (LÍNEA DE GOLPEO)
            </text>

            {/* Hash Marks */}
            <line x1="42" y1="20" x2="45" y2="20" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
            <line x1="55" y1="20" x2="58" y2="20" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
            <line x1="42" y1="45" x2="45" y2="45" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
            <line x1="55" y1="45" x2="58" y2="45" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
            <line x1="42" y1="65" x2="45" y2="65" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
            <line x1="55" y1="65" x2="58" y2="65" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />

            {/* Sidelines Labels */}
            <text x="2" y="50" fill="rgba(255,255,255,0.2)" fontSize="2.8" transform="rotate(-90 2,50)" textAnchor="middle">
              BANDA IZQ (CENTRO)
            </text>
            <text x="98" y="50" fill="rgba(255,255,255,0.2)" fontSize="2.8" transform="rotate(90 98,50)" textAnchor="middle">
              BANDA DER (OUTSIDE)
            </text>

            {/* The Drawn Route Path */}
            <path
              d={svgPathD()}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#routeGlow)"
            />

            {/* Route Points Circles (Start, Cut, End) */}
            {selectedRoute.pathPoints.map((pt, idx) => (
              <g key={idx}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={idx === 0 ? 3.5 : 2.5}
                  fill={idx === 0 ? '#facc15' : idx === selectedRoute.pathPoints.length - 1 ? '#ef4444' : '#38bdf8'}
                  stroke="#ffffff"
                  strokeWidth="0.8"
                />
                {idx === 0 && (
                  <text x={pt.x} y={pt.y + 7} fill="#facc15" fontSize="3" fontWeight="bold" textAnchor="middle">
                    Snap (WR)
                  </text>
                )}
                {idx === 1 && selectedRoute.pathPoints.length > 2 && (
                  <text x={pt.x + 5} y={pt.y - 1} fill="#38bdf8" fontSize="2.8" fontWeight="bold">
                    Corte ({selectedRoute.depthYards.split(' ')[0]}y)
                  </text>
                )}
                {idx === selectedRoute.pathPoints.length - 1 && (
                  <text x={pt.x} y={pt.y - 4} fill="#f87171" fontSize="3" fontWeight="bold" textAnchor="middle">
                    Catch / Balón
                  </text>
                )}
              </g>
            ))}

            {/* Dynamic Animated Runner Marker */}
            <g transform={`translate(${runnerPos.x}, ${runnerPos.y})`}>
              <circle r="4.2" fill="#00a859" stroke="#ffffff" strokeWidth="1.2" />
              <text x="0" y="1.2" fill="#ffffff" fontSize="3.2" fontWeight="900" textAnchor="middle">
                WR
              </text>
              {/* Speed wake pulse */}
              <circle r="6" fill="none" stroke="#34d399" strokeWidth="0.6" opacity="0.6" className="animate-ping" />
            </g>
          </svg>
        </div>

        {/* Bottom Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300 mt-2 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span>Inicio (Snap en LOS)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Punto de Quiebre / Corte</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span>Punto de Atrapar (Catch)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
