import React, { useState } from 'react';
import { DEFENSIVE_COVERAGES_GUIDE } from '../../constants/fundamentalsData';
import { CoverageConcept } from '../../types/study';
import { Shield, CheckCircle, AlertTriangle, Target } from 'lucide-react';

export const CoverageGuide: React.FC = () => {
  const [selectedCoverage, setSelectedCoverage] = useState<CoverageConcept>(DEFENSIVE_COVERAGES_GUIDE[0]); // Default Cover 2

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
      {/* Coverage Schemes List */}
      <div className="lg:col-span-5 flex flex-col gap-3">
        <div className="bg-[#0b140e] border border-[#1b2b20] rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Esquemas Defensivos (Lecturas)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Identifica la cobertura rival antes del snap contando los <strong>Safeties en el fondo</strong> y la distancia de los <strong>Cornerbacks</strong>.
          </p>

          <div className="space-y-2 mb-4">
            {DEFENSIVE_COVERAGES_GUIDE.map((cov) => {
              const isSelected = selectedCoverage.id === cov.id;
              return (
                <button
                  key={cov.id}
                  type="button"
                  onClick={() => setSelectedCoverage(cov)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-700/10 border-emerald-400 text-white shadow-md'
                      : 'bg-[#101b14] hover:bg-[#15251b] border-[#1d3023] text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-extrabold text-xs sm:text-sm text-slate-100">
                      {cov.name}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono">
                      {cov.type === 'zone' ? 'Zona' : 'Hombre a Hombre'} • {cov.safetiesCount} Safety{cov.safetiesCount !== 1 ? 's' : ''} profundo{cov.safetiesCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    cov.safetiesCount === 2 ? 'bg-sky-950 text-sky-400 border border-sky-500/30' : cov.safetiesCount === 1 ? 'bg-amber-950 text-amber-400 border border-amber-500/30' : 'bg-red-950 text-red-400 border border-red-500/30'
                  }`}>
                    {cov.safetiesCount === 2 ? '2-High' : cov.safetiesCount === 1 ? '1-High' : '0-High (Blitz)'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Description & Coaching Tips */}
          <div className="bg-[#121f17] border border-[#233a2a] rounded-xl p-3.5 space-y-3">
            <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              ¿Cómo Atacarla Ofensivamente?
            </h4>
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-200">Conceptos Beater Clave:</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedCoverage.bestBeaters.map((b, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Canvas Diagram & Analysis */}
      <div className="lg:col-span-7 flex flex-col justify-between bg-[#070d09] border border-[#1c2e22] rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="text-sm font-extrabold text-white">
                Distribución de Zonas: {selectedCoverage.name}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">5 Defensores IFAF</span>
          </div>

          {/* Tactical Field Diagram */}
          <div className="w-full max-w-[460px] aspect-[16/10] mx-auto relative rounded-xl border border-emerald-600/30 overflow-hidden shadow-inner mb-4">
            <svg
              viewBox="0 0 100 80"
              className="w-full h-full select-none"
              style={{ background: 'radial-gradient(ellipse at center, #1b3d26 0%, #0e2215 100%)' }}
            >
              {/* LOS */}
              <line x1="5" y1="65" x2="95" y2="65" stroke="#00a859" strokeWidth="1.2" />
              <text x="7" y="63" fill="#00bf65" fontSize="3" fontWeight="bold">LOS</text>

              {/* Rush Line (7 yards) */}
              <line x1="5" y1="52" x2="95" y2="52" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="2,2" />
              <text x="7" y="50" fill="#ef4444" fontSize="2.8" fontWeight="bold">LÍNEA DE RUSH (7 YARDAS IFAF)</text>

              {/* Rusher */}
              <g transform="translate(50, 52)">
                <circle r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                <text x="0" y="1.2" fill="#ffffff" fontSize="2.8" fontWeight="black" textAnchor="middle">R</text>
              </g>

              {/* Render Zones based on Cover */}
              {selectedCoverage.id === 'cover2' && (
                <>
                  {/* Deep Half 1 */}
                  <rect x="10" y="10" width="38" height="32" rx="4" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth="1" strokeDasharray="2,2" />
                  <text x="29" y="27" fill="#c084fc" fontSize="3" fontWeight="bold" textAnchor="middle">Deep Half (S1)</text>

                  {/* Deep Half 2 */}
                  <rect x="52" y="10" width="38" height="32" rx="4" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth="1" strokeDasharray="2,2" />
                  <text x="71" y="27" fill="#c084fc" fontSize="3" fontWeight="bold" textAnchor="middle">Deep Half (S2)</text>

                  {/* Flat Left */}
                  <rect x="8" y="44" width="28" height="18" rx="3" fill="rgba(244, 63, 94, 0.2)" stroke="#f43f5e" strokeWidth="1" />
                  <text x="22" y="54" fill="#fb7185" fontSize="2.8" fontWeight="bold" textAnchor="middle">Flat Izq (CB1)</text>

                  {/* Flat Right */}
                  <rect x="64" y="44" width="28" height="18" rx="3" fill="rgba(244, 63, 94, 0.2)" stroke="#f43f5e" strokeWidth="1" />
                  <text x="78" y="54" fill="#fb7185" fontSize="2.8" fontWeight="bold" textAnchor="middle">Flat Der (CB2)</text>
                </>
              )}

              {selectedCoverage.id === 'cover3' && (
                <>
                  {/* Third 1 */}
                  <rect x="8" y="10" width="26" height="32" rx="3" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth="1" strokeDasharray="2,2" />
                  <text x="21" y="27" fill="#c084fc" fontSize="2.8" fontWeight="bold" textAnchor="middle">1/3 Izq (CB1)</text>

                  {/* Third 2 Center */}
                  <rect x="37" y="10" width="26" height="32" rx="3" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth="1" strokeDasharray="2,2" />
                  <text x="50" y="27" fill="#c084fc" fontSize="2.8" fontWeight="bold" textAnchor="middle">1/3 Centro (FS)</text>

                  {/* Third 3 */}
                  <rect x="66" y="10" width="26" height="32" rx="3" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth="1" strokeDasharray="2,2" />
                  <text x="79" y="27" fill="#c084fc" fontSize="2.8" fontWeight="bold" textAnchor="middle">1/3 Der (CB2)</text>

                  {/* Underneath Center */}
                  <rect x="30" y="44" width="40" height="18" rx="3" fill="rgba(244, 63, 94, 0.2)" stroke="#f43f5e" strokeWidth="1" />
                  <text x="50" y="54" fill="#fb7185" fontSize="2.8" fontWeight="bold" textAnchor="middle">Hook / Curl (LB/S2)</text>
                </>
              )}

              {selectedCoverage.id === 'cover1' && (
                <>
                  {/* Deep Safety */}
                  <g transform="translate(50, 20)">
                    <circle r="4.5" fill="#a855f7" stroke="#ffffff" strokeWidth="1.2" />
                    <text x="0" y="1.2" fill="#ffffff" fontSize="2.8" fontWeight="black" textAnchor="middle">FS</text>
                  </g>
                  <text x="50" y="29" fill="#c084fc" fontSize="2.8" fontWeight="bold" textAnchor="middle">Safety Libre Profundo</text>

                  {/* 3 Man to Man CBs */}
                  <g transform="translate(20, 58)">
                    <circle r="3.8" fill="#f43f5e" stroke="#ffffff" strokeWidth="1" />
                    <text x="0" y="1" fill="#ffffff" fontSize="2.4" fontWeight="bold" textAnchor="middle">CB</text>
                  </g>
                  <g transform="translate(35, 58)">
                    <circle r="3.8" fill="#f43f5e" stroke="#ffffff" strokeWidth="1" />
                    <text x="0" y="1" fill="#ffffff" fontSize="2.4" fontWeight="bold" textAnchor="middle">LB</text>
                  </g>
                  <g transform="translate(80, 58)">
                    <circle r="3.8" fill="#f43f5e" stroke="#ffffff" strokeWidth="1" />
                    <text x="0" y="1" fill="#ffffff" fontSize="2.4" fontWeight="bold" textAnchor="middle">CB</text>
                  </g>
                  <text x="50" y="73" fill="#fda4af" fontSize="2.8" fontWeight="bold" textAnchor="middle">Marcación Personal 1 vs 1 en la línea</text>
                </>
              )}

              {selectedCoverage.id === 'blitz_cover0' && (
                <>
                  <text x="50" y="25" fill="#ef4444" fontSize="3.5" fontWeight="black" textAnchor="middle">
                    ¡SIN SEGURIDAD PROFUNDA! (0 SAFETIES)
                  </text>
                  {/* All 4 defenders in tight man */}
                  <g transform="translate(18, 58)"><circle r="3.8" fill="#f43f5e" /><text x="0" y="1" fill="#fff" fontSize="2.4" textAnchor="middle">1v1</text></g>
                  <g transform="translate(36, 58)"><circle r="3.8" fill="#f43f5e" /><text x="0" y="1" fill="#fff" fontSize="2.4" textAnchor="middle">1v1</text></g>
                  <g transform="translate(64, 58)"><circle r="3.8" fill="#f43f5e" /><text x="0" y="1" fill="#fff" fontSize="2.4" textAnchor="middle">1v1</text></g>
                  <g transform="translate(82, 58)"><circle r="3.8" fill="#f43f5e" /><text x="0" y="1" fill="#fff" fontSize="2.4" textAnchor="middle">1v1</text></g>
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Strengths & Weaknesses Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-2 uppercase tracking-wider text-[11px]">
              <CheckCircle className="w-3.5 h-3.5" />
              Fortalezas de la Defensa
            </div>
            <ul className="space-y-1 text-slate-300">
              {selectedCoverage.strengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20">
            <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-2 uppercase tracking-wider text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              Debilidades / Espacios Libres
            </div>
            <ul className="space-y-1 text-slate-300">
              {selectedCoverage.weaknesses.map((w, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
