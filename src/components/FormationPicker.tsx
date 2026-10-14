import React from 'react';
import { X, Layers, Zap, Shield, ChevronRight } from 'lucide-react';
import { FORMATION_PRESETS, FormationPreset } from '../constants/presets';

interface FormationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFormation: (formation: FormationPreset) => void;
}

export const FormationPicker: React.FC<FormationPickerProps> = ({
  isOpen,
  onClose,
  onSelectFormation,
}) => {
  if (!isOpen) return null;

  const offensivePresets = FORMATION_PRESETS.filter((p) => p.category === 'offense');
  const defensivePresets = FORMATION_PRESETS.filter((p) => p.category === 'defense');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#0e1611] border border-[#26382c] rounded-xl shadow-clean-lg overflow-hidden z-10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#26382c] flex items-center justify-between bg-[#131c16]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-tecmilenio-950 text-tecmilenio-400 border border-tecmilenio-600/40">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight uppercase">Formaciones Tácticas</h2>
              <p className="text-[11px] text-slate-400">Posiciona a los jugadores instantáneamente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#18241d] hover:bg-[#1f2e25] text-slate-400 hover:text-white transition-all border border-[#26382c]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Offensive Formations */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-tecmilenio-400" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-tecmilenio-400">
                Formaciones Ofensivas
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {offensivePresets.map((preset) => (
                <div
                  key={preset.name}
                  onClick={() => {
                    onSelectFormation(preset);
                    onClose();
                  }}
                  className="p-3 rounded-lg bg-[#131c16] hover:bg-[#18241d] border border-[#26382c] hover:border-tecmilenio-500/50 cursor-pointer transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-100 group-hover:text-tecmilenio-300 transition-colors">
                        {preset.name}
                      </h4>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-tecmilenio-400 transition-all" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                  <div className="mt-2.5 pt-1.5 border-t border-[#26382c] flex items-center justify-between text-[10px] text-slate-500">
                    <span>{preset.players.length} Jugadores</span>
                    <span className="text-tecmilenio-400 font-semibold group-hover:underline">Cargar</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Defensive Formations */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Shield className="w-3.5 h-3.5 text-red-400" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                Formaciones Defensivas
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {defensivePresets.map((preset) => (
                <div
                  key={preset.name}
                  onClick={() => {
                    onSelectFormation(preset);
                    onClose();
                  }}
                  className="p-3 rounded-lg bg-[#131c16] hover:bg-[#18241d] border border-[#26382c] hover:border-red-500/50 cursor-pointer transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-100 group-hover:text-red-300 transition-colors">
                        {preset.name}
                      </h4>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-400 transition-all" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                  <div className="mt-2.5 pt-1.5 border-t border-[#26382c] flex items-center justify-between text-[10px] text-slate-500">
                    <span>{preset.players.length} Jugadores</span>
                    <span className="text-red-400 font-semibold group-hover:underline">Cargar</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
