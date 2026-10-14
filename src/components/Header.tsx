import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Save, 
  Plus, 
  Share2, 
  Download, 
  Layers,
  Shield, 
  Zap, 
  Swords,
  ChevronDown,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { Play, PlayCategory, FieldViewMode, DefenseScheme } from '../types/playbook';
import { DEFENSE_SCHEMES_DATA } from '../constants/presets';

interface HeaderProps {
  currentPlay: Play;
  viewMode: FieldViewMode;
  onChangeViewMode: (mode: FieldViewMode) => void;
  defenseScheme: DefenseScheme;
  onChangeDefenseScheme?: (scheme: DefenseScheme) => void;
  onOpenSidebar: () => void;
  onOpenSaveModal: () => void;
  onNewPlay: () => void;
  onOpenFormationPicker: () => void;
  onExportImage: () => void;
  onOpenExportModal: () => void;
  isDirty?: boolean;
  onLoadOffense: () => void;
  onSaveOffense: () => void;
  onLoadDefense: () => void;
  onSaveDefense: () => void;
  onExportOffenseJson?: () => void;
  onExportDefenseJson?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPlay,
  viewMode,
  onChangeViewMode,
  defenseScheme,
  onOpenSidebar,
  onOpenSaveModal,
  onNewPlay,
  onOpenFormationPicker,
  onExportImage,
  onOpenExportModal,
  isDirty,
  onLoadOffense,
  onSaveOffense,
  onLoadDefense,
  onSaveDefense,
  onExportOffenseJson,
  onExportDefenseJson,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExportMenuOpen]);

  const isOffenseView = viewMode === 'offense';
  const isDefenseView = viewMode === 'defense';
  const isMatchupView = viewMode === 'matchup';

  const displayedTitle = isDefenseView
    ? currentPlay.defenseName || (currentPlay.category === 'Defensiva' ? currentPlay.name : (DEFENSE_SCHEMES_DATA[defenseScheme]?.name || 'Defensa Personalizada'))
    : isOffenseView
      ? currentPlay.offenseName || (currentPlay.category === 'Ofensiva' ? currentPlay.name : 'Jugada Ofensiva')
      : currentPlay.offenseName || currentPlay.name;

  const displayedCategory: PlayCategory | '5v5' = isDefenseView
    ? 'Defensiva'
    : isOffenseView
      ? 'Ofensiva'
      : isMatchupView
        ? '5v5'
        : currentPlay.category;

  const displayedFormation = isDefenseView
    ? currentPlay.defenseFormationName || (DEFENSE_SCHEMES_DATA[defenseScheme]?.name || 'Defensa 2-3 Zona')
    : currentPlay.formationName || 'Spread 2x2';

  const getCategoryBadge = (cat: PlayCategory | '5v5') => {
    switch (cat) {
      case 'Ofensiva':
        return 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30';
      case 'Defensiva':
        return 'bg-red-950/80 text-red-400 border border-red-500/30';
      case '5v5':
        return 'bg-blue-950/80 text-blue-400 border border-blue-500/30';
      case 'Especiales':
        return 'bg-amber-950/80 text-amber-400 border border-amber-500/30';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#080d0a]/95 backdrop-blur-xl border-b border-[#1b2b20] px-3 sm:px-4 py-2 flex items-center justify-between shadow-2xl gap-2">
      {/* 1. Left: Branding & Playbook Drawer Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#121c15] hover:bg-[#1a291e] text-slate-200 flex items-center gap-2 transition-all border border-[#203426] shadow-sm group"
          title="Abrir Playbook y Biblioteca de Jugadas"
          id="btn-open-playbook"
        >
          <Menu className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline font-bold text-xs tracking-wider uppercase">Playbook</span>
        </button>

        {/* Tecmilenio Halcones Athletic Logo Badge */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-[#00a859] to-[#00542a] border border-emerald-400/50 flex items-center justify-center font-black text-white text-sm tracking-tighter shadow-md">
            H
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-xs sm:text-sm tracking-wide text-white uppercase font-display">
                Halcones
              </span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-[#00542a] text-emerald-300 border border-emerald-500/40 uppercase">
                Tocho
              </span>
            </div>
            <p className="text-[9px] text-neutral-400 font-mono mt-0.5">TACTICAL BOARD</p>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-[#1b2b20] hidden sm:block" />
        
        {/* Current Play Info */}
        <div className="flex flex-col max-w-[120px] sm:max-w-[160px] lg:max-w-xs truncate">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs sm:text-sm font-bold text-slate-100 truncate tracking-tight uppercase" title={displayedTitle}>
              {displayedTitle}
            </h1>
            {isDirty && (
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" title="Cambios sin guardar" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${getCategoryBadge(displayedCategory)}`}>
              {displayedCategory === '5v5' ? '5v5 Duelo' : displayedCategory}
            </span>
            <span className="text-[10px] text-neutral-400 truncate hidden sm:inline font-mono">
              {displayedFormation}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Center: Segmented View Mode Control (Ofensa | Defensa | 5v5 Duelo) */}
      <div className="flex items-center gap-1 bg-[#0c140f] p-1 rounded-xl border border-[#1e3023] shadow-inner">
        <button
          type="button"
          onClick={() => onChangeViewMode('offense')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all uppercase ${
            viewMode === 'offense'
              ? 'bg-[#008744] text-white shadow-md'
              : 'text-neutral-400 hover:text-slate-200'
          }`}
          title="Ver únicamente la Ofensiva"
          id="btn-view-offense"
        >
          <Zap className="w-3.5 h-3.5 text-yellow-300" />
          <span className="hidden md:inline">Ofensa</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeViewMode('defense')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all uppercase ${
            viewMode === 'defense'
              ? 'bg-[#b91c1c] text-white shadow-md'
              : 'text-neutral-400 hover:text-slate-200'
          }`}
          title="Ver únicamente la Defensiva"
          id="btn-view-defense"
        >
          <Shield className="w-3.5 h-3.5 text-red-300" />
          <span className="hidden md:inline">Defensa</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeViewMode('matchup')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all uppercase ${
            viewMode === 'matchup'
              ? 'bg-[#3b82f6] text-white shadow-md'
              : 'text-neutral-400 hover:text-slate-200'
          }`}
          title="Simular Duelo Completo 5v5 (Ofensa vs Defensa)"
          id="btn-view-matchup"
        >
          <Swords className="w-3.5 h-3.5 text-sky-200" />
          <span>5v5</span>
        </button>

      </div>

      {/* 3. Right: Tactical Actions & Separated Offense/Defense Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* GRUPO SEPARADO OFENSIVA: Cargar & Guardar (Solo visible en modo Ofensa) */}
        {viewMode === 'offense' && (
          <div className="flex items-center bg-[#071d10] border border-emerald-600/40 hover:border-emerald-500/60 rounded-xl p-0.5 sm:p-1 shadow-sm gap-1 transition-all">
            <div className="flex items-center gap-1 pl-1 sm:pl-1.5 pr-0.5 sm:pr-1 py-0.5 text-emerald-400 font-extrabold text-[11px] uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-yellow-300" />
              <span className="hidden xl:inline">Ofensa</span>
            </div>
            <button
              type="button"
              onClick={onLoadOffense}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0e2c18] hover:bg-[#153e24] text-emerald-200 text-xs font-bold transition-all border border-emerald-500/30 hover:border-emerald-400/60 shadow-sm"
              title="Cargar jugada ofensiva guardada del Playbook"
              id="btn-load-offense"
            >
              <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Cargar</span>
            </button>
            <button
              type="button"
              onClick={onSaveOffense}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-[#008744] hover:bg-[#00a859] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              title="Guardar ofensiva actual por separado"
              id="btn-save-offense"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guardar</span>
            </button>
          </div>
        )}

        {/* GRUPO SEPARADO DEFENSIVA: Cargar & Guardar (Solo visible en modo Defensa) */}
        {viewMode === 'defense' && (
          <div className="flex items-center bg-[#20090d] border border-red-600/40 hover:border-red-500/60 rounded-xl p-0.5 sm:p-1 shadow-sm gap-1 transition-all">
            <div className="flex items-center gap-1 pl-1 sm:pl-1.5 pr-0.5 sm:pr-1 py-0.5 text-red-400 font-extrabold text-[11px] uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden xl:inline">Defensa</span>
            </div>
            <button
              type="button"
              onClick={onLoadDefense}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#2e0f14] hover:bg-[#3f161c] text-red-200 text-xs font-bold transition-all border border-red-500/30 hover:border-red-400/60 shadow-sm"
              title="Cargar jugada o cobertura defensiva guardada"
              id="btn-load-defense"
            >
              <FolderOpen className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Cargar</span>
            </button>
            <button
              type="button"
              onClick={onSaveDefense}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-[#b91c1c] hover:bg-[#dc2626] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              title="Guardar defensiva actual por separado"
              id="btn-save-defense"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guardar</span>
            </button>
          </div>
        )}

        {/* Formations Preset Button */}
        <button
          onClick={onOpenFormationPicker}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#121c15] hover:bg-[#1a291e] text-slate-200 text-xs font-semibold border border-[#203426] transition-all uppercase"
          title="Elegir Formación Táctica"
          id="btn-formations"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">Formaciones</span>
        </button>

        {/* New Play Button */}
        <button
          onClick={onNewPlay}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-[#121c15] hover:bg-[#1a291e] text-slate-200 text-xs font-semibold border border-[#203426] transition-all uppercase"
          title="Crear Nueva Jugada en Blanco"
          id="btn-new-play"
        >
          <Plus className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden sm:inline">Nueva</span>
        </button>

        {/* Consolidated Export Dropdown Menu */}
        <div className="relative" ref={exportMenuRef}>
          <button
            type="button"
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-[#121c15] hover:bg-[#1a291e] text-slate-200 text-xs font-semibold border border-[#203426] transition-all uppercase"
            title="Opciones de exportación y respaldo"
            id="btn-export-dropdown"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Exportar</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {isExportMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 bg-[#090f0c] border border-[#203426] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setIsExportMenuOpen(false);
                  onExportImage();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-slate-200 hover:bg-[#152319] hover:text-white transition-all"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-bold">Tarjeta Táctica (PNG)</div>
                  <div className="text-[10px] text-neutral-400">Descargar imagen en alta resolución</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsExportMenuOpen(false);
                  onOpenExportModal();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-slate-200 hover:bg-[#152319] hover:text-white transition-all"
              >
                <Share2 className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="font-bold">Playbook Completo (JSON)</div>
                  <div className="text-[10px] text-neutral-400">Exportar o sincronizar todo</div>
                </div>
              </button>

              {onExportOffenseJson && (
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExportOffenseJson();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-emerald-300 hover:bg-[#0c2314] hover:text-white transition-all border-t border-[#1b2b20]"
                >
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <div>
                    <div className="font-bold">Exportar Sólo Ofensivas (JSON)</div>
                    <div className="text-[10px] text-neutral-400">Descarga archivo sólo con ofensa</div>
                  </div>
                </button>
              )}

              {onExportDefenseJson && (
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExportDefenseJson();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-red-300 hover:bg-[#250d11] hover:text-white transition-all"
                >
                  <Shield className="w-4 h-4 text-red-400" />
                  <div>
                    <div className="font-bold">Exportar Sólo Defensivas (JSON)</div>
                    <div className="text-[10px] text-neutral-400">Descarga archivo sólo con defensa</div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Save Full Play Button */}
        <button
          onClick={onOpenSaveModal}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs shadow-md transition-all uppercase tracking-wider active:scale-[0.98] ${
            isDirty
              ? 'bg-[#00a859] hover:bg-[#00bf65] text-white shadow-emerald-950/60 ring-1 ring-emerald-300'
              : 'bg-[#122418] hover:bg-[#1a3423] text-emerald-300 border border-emerald-600/30'
          }`}
          title="Guardar Jugada Completa"
          id="btn-save-play"
        >
          {isDirty ? (
            <Save className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
          )}
          <span>{isDirty ? 'Guardar' : 'Guardado'}</span>
        </button>
      </div>
    </header>
  );
};
