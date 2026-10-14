import React, { useEffect, useMemo, useState } from 'react';
import { X, LayoutGrid } from 'lucide-react';
import { Player } from '../types/playbook';
import { pointsToSvgPath } from '../utils/geometry';
import {
  PASS_CONCEPTS,
  ConceptId,
  ConceptSide,
  generateConceptRoutes,
  getStrongSide,
} from '../utils/concepts';

interface ConceptSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  losY: number;
  onApplyConcept: (conceptId: ConceptId, side: ConceptSide) => void;
}

export const ConceptSelector: React.FC<ConceptSelectorProps> = ({
  isOpen,
  onClose,
  players,
  losY,
  onApplyConcept,
}) => {
  const [side, setSide] = useState<ConceptSide>(() => getStrongSide(players));

  // Default to the strong side every time the modal opens
  useEffect(() => {
    if (isOpen) setSide(getStrongSide(players));
  }, [isOpen, players]);

  const offense = useMemo(() => players.filter((p) => p.team === 'offense'), [players]);

  const previews = useMemo(
    () =>
      PASS_CONCEPTS.map((concept) => ({
        concept,
        routes: generateConceptRoutes(players, concept.id, side),
      })),
    [players, side]
  );

  if (!isOpen) return null;

  // Crop the preview around the LOS and the first ~20 yards
  const viewTop = losY - 44;
  const viewBox = `0 ${viewTop} 100 54`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-[#0e1611] border border-[#26382c] rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#26382c] flex items-center justify-between bg-[#131c16] gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#00542a] text-emerald-300 border border-emerald-500/40">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight uppercase">Conceptos de Pase</h2>
              <p className="text-[11px] text-slate-400">Asigna las rutas de toda la ofensiva con un solo clic</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Side selector */}
            <div className="flex items-center bg-[#0a0f0c] p-0.5 rounded-lg border border-[#26382c]">
              {(['left', 'right'] as ConceptSide[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  id={`btn-concept-side-${s}`}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase transition-all ${
                    side === s ? 'bg-[#008744] text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s === 'left' ? '◀ Izq' : 'Der ▶'}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#18241d] hover:bg-[#1f2e25] text-slate-400 hover:text-white transition-all border border-[#26382c]"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Concepts Grid */}
        <div className="p-4 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3">
          {previews.map(({ concept, routes }) => (
            <button
              key={concept.id}
              type="button"
              id={`concept-${concept.id}`}
              onClick={() => {
                onApplyConcept(concept.id, side);
                onClose();
              }}
              className="text-left rounded-lg bg-[#131c16] hover:bg-[#18241d] border border-[#26382c] hover:border-emerald-500/60 transition-all group overflow-hidden flex flex-col"
            >
              {/* Mini field preview */}
              <svg viewBox={viewBox} className="w-full aspect-[100/54] bg-[#030303] border-b border-[#26382c]">
                {[5, 10, 15, 20].map((yd) => (
                  <line
                    key={yd}
                    x1="0"
                    x2="100"
                    y1={losY - yd * 2}
                    y2={losY - yd * 2}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="0.4"
                  />
                ))}
                <line x1="0" x2="100" y1={losY} y2={losY} stroke="#38bdf8" strokeWidth="0.6" opacity="0.7" />

                {routes.map((r) => {
                  const end = r.points[r.points.length - 1];
                  return (
                    <g key={r.id}>
                      <path
                        d={pointsToSvgPath(r.points)}
                        fill="none"
                        stroke={r.color || '#facc15'}
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx={end.x} cy={end.y} r="1.1" fill={r.color || '#facc15'} />
                    </g>
                  );
                })}

                {offense.map((p) => (
                  <circle
                    key={p.id}
                    cx={p.x}
                    cy={p.y}
                    r="1.9"
                    fill="#020202"
                    stroke={p.color || '#facc15'}
                    strokeWidth="0.6"
                  />
                ))}
              </svg>

              <div className="p-2.5 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs text-slate-100 uppercase group-hover:text-emerald-300 transition-colors">
                    {concept.name}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#00542a] text-emerald-300 border border-emerald-500/40 whitespace-nowrap">
                    {concept.tag}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">{concept.description}</p>
                <span className="text-[9px] font-mono text-amber-300/90 uppercase">Rompe: {concept.beats}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-[#26382c] bg-[#0a0f0c] text-[10px] text-slate-500 font-mono">
          Los roles (#1, slot, checkdown, lado débil) se asignan solos según la alineación. Reemplaza las rutas ofensivas actuales · Ctrl+Z para deshacer.
        </div>
      </div>
    </div>
  );
};
