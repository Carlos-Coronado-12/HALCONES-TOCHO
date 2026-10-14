import React, { useState } from 'react';
import { 
  Move, 
  PenTool, 
  Shield, 
  Scissors, 
  Sparkles, 
  UserPlus, 
  Undo2, 
  LayoutGrid, 
  FlipHorizontal, 
  Magnet, 
  Square, 
  Circle, 
  Triangle,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ToolMode, ZoneShape } from '../types/playbook';

interface ToolbarProps {
  currentMode: ToolMode;
  onSelectMode: (mode: ToolMode) => void;
  zoneShape?: ZoneShape;
  onSelectZoneShape?: (shape: ZoneShape) => void;
  onOpenPresetRoutes: () => void;
  onOpenConcepts: () => void;
  onFlipPlay: () => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  onClearRoutes: () => void;
  onResetFormation?: () => void;
  onAddPlayer: () => void;
  canUndo?: boolean;
  onUndo?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentMode,
  onSelectMode,
  zoneShape = 'rectangle',
  onSelectZoneShape,
  onOpenPresetRoutes,
  onOpenConcepts,
  onFlipPlay,
  snapEnabled,
  onToggleSnap,
  onClearRoutes,
  onResetFormation,
  onAddPlayer,
  canUndo,
  onUndo,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const drawTools = [
    {
      id: 'select' as ToolMode,
      label: 'Mover',
      tooltip: 'Mover Fichas',
      shortcut: 'S',
      icon: Move,
      color: 'text-slate-200',
      activeBg: 'bg-[#008744] text-white shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400',
    },
    {
      id: 'draw' as ToolMode,
      label: 'Ruta',
      tooltip: 'Dibujar Ruta de Carrera',
      shortcut: 'D',
      icon: PenTool,
      color: 'text-yellow-400',
      activeBg: 'bg-amber-600 text-white shadow-lg shadow-amber-950/60 ring-1 ring-amber-400',
    },
    {
      id: 'draw_zone' as ToolMode,
      label: 'Zona',
      tooltip: 'Asignar Zona de Cobertura',
      shortcut: 'Z',
      icon: Shield,
      color: 'text-purple-400',
      activeBg: 'bg-purple-600 text-white shadow-lg shadow-purple-950/60 ring-1 ring-purple-400',
    },
    {
      id: 'erase_route' as ToolMode,
      label: 'Borrar',
      tooltip: 'Eliminar Ruta o Zona',
      shortcut: 'E',
      icon: Scissors,
      color: 'text-red-400',
      activeBg: 'bg-red-600 text-white shadow-lg shadow-red-950/60 ring-1 ring-red-400',
    },
  ];

  return (
    <aside
      aria-label="Barra de Herramientas Tácticas"
      className="absolute left-2 sm:left-4 top-3 sm:top-1/2 sm:-translate-y-1/2 z-30 select-none transition-all duration-200"
    >
      <div className="bg-[#090f0c]/95 backdrop-blur-xl border border-[#203426] shadow-2xl rounded-2xl p-1.5 sm:p-2 flex flex-col gap-2 ring-1 ring-white/5">
        {/* Toggle Collapse Button Header */}
        <div className="flex items-center justify-between px-1.5 pb-1 border-b border-[#1b2b20]">
          {!isCollapsed && (
            <span className="text-[10px] font-black tracking-wider uppercase text-emerald-400 font-display">
              Tácticas
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-[#16231a] transition-all ml-auto"
            title={isCollapsed ? 'Expandir barra' : 'Colapsar barra'}
            id="btn-collapse-toolbar"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 1. Core Drawing Tools */}
        <div className="flex flex-col gap-1">
          {drawTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = currentMode === tool.id;

            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectMode(tool.id)}
                className={`flex items-center gap-2 p-2 rounded-xl transition-all relative group text-left ${
                  isActive
                    ? tool.activeBg
                    : 'text-slate-300 hover:bg-[#152219] hover:text-white'
                }`}
                title={`${tool.tooltip} [${tool.shortcut}]`}
                id={`tool-${tool.id}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : tool.color}`} />
                {!isCollapsed && (
                  <div className="flex items-center justify-between flex-1 gap-2 overflow-hidden">
                    <span className="text-xs font-semibold tracking-tight truncate leading-none">
                      {tool.label}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded ${
                        isActive ? 'bg-black/30 text-white' : 'bg-[#141e17] text-neutral-400'
                      }`}
                    >
                      {tool.shortcut}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Zone Shape Sub-selector (When Zone mode is active) */}
        {currentMode === 'draw_zone' && onSelectZoneShape && !isCollapsed && (
          <div className="p-1.5 rounded-xl bg-purple-950/40 border border-purple-800/40 flex flex-col gap-1 animate-in fade-in duration-150">
            <span className="text-[9px] font-bold uppercase text-purple-300 tracking-wider">
              Forma de zona
            </span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { shape: 'rectangle' as const, label: 'Rect', icon: Square },
                { shape: 'circle' as const, label: 'Círc', icon: Circle },
                { shape: 'triangle' as const, label: 'Tri', icon: Triangle },
              ].map((s) => {
                const isShapeActive = zoneShape === s.shape;
                const ShapeIcon = s.icon;
                return (
                  <button
                    key={s.shape}
                    type="button"
                    onClick={() => onSelectZoneShape(s.shape)}
                    className={`flex flex-col items-center justify-center p-1 rounded-lg border transition-all ${
                      isShapeActive
                        ? 'bg-purple-600 border-purple-400 text-white font-bold'
                        : 'bg-[#121c15] border-[#223528] text-slate-400 hover:text-white'
                    }`}
                    title={s.label}
                  >
                    <ShapeIcon className="w-3 h-3 mb-0.5" />
                    <span className="text-[8px] leading-none">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="w-full border-t border-[#1b2b20]" />

        {/* 2. Tactical Actions (Concepts, Routes, Mirror, +Player) */}
        <div className={`grid ${isCollapsed ? 'grid-cols-1' : 'grid-cols-2'} gap-1`}>
          <button
            type="button"
            onClick={onOpenConcepts}
            className="flex items-center gap-1.5 p-2 rounded-xl bg-[#121c15] hover:bg-[#1a291e] text-slate-200 border border-[#1e2f23] hover:border-amber-500/50 transition-all text-left group"
            title="Conceptos tácticos con 1 clic (Smash, Flood, Mesh, etc.) [C]"
            id="btn-concepts"
          >
            <LayoutGrid className="w-4 h-4 text-amber-400 shrink-0" />
            {!isCollapsed && <span className="text-[11px] font-bold text-slate-200">Conceptos</span>}
          </button>

          <button
            type="button"
            onClick={onOpenPresetRoutes}
            className="flex items-center gap-1.5 p-2 rounded-xl bg-[#121c15] hover:bg-[#1a291e] text-slate-200 border border-[#1e2f23] hover:border-emerald-500/50 transition-all text-left group"
            title="Árbol de rutas estándar (Slant, Out, Post, In, etc.)"
            id="btn-route-tree"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            {!isCollapsed && <span className="text-[11px] font-bold text-slate-200">Rutas</span>}
          </button>

          <button
            type="button"
            onClick={onFlipPlay}
            className="flex items-center gap-1.5 p-2 rounded-xl bg-[#121c15] hover:bg-[#1a291e] text-slate-200 border border-[#1e2f23] hover:border-violet-500/50 transition-all text-left group"
            title="Espejear jugada izquierda ↔ derecha [M]"
            id="btn-flip-play"
          >
            <FlipHorizontal className="w-4 h-4 text-violet-400 shrink-0" />
            {!isCollapsed && <span className="text-[11px] font-bold text-slate-200">Espejo</span>}
          </button>

          <button
            type="button"
            onClick={onAddPlayer}
            className="flex items-center gap-1.5 p-2 rounded-xl bg-[#121c15] hover:bg-[#1a291e] text-slate-200 border border-[#1e2f23] hover:border-sky-500/50 transition-all text-left group"
            title="Añadir jugador adicional al campo"
            id="btn-add-player"
          >
            <UserPlus className="w-4 h-4 text-sky-400 shrink-0" />
            {!isCollapsed && <span className="text-[11px] font-bold text-slate-200">+ Ficha</span>}
          </button>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-[#1b2b20]" />

        {/* 3. Snapping Magnet Toggle */}
        <button
          type="button"
          onClick={onToggleSnap}
          role="switch"
          aria-checked={snapEnabled}
          className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
            snapEnabled
              ? 'bg-[#0f281a] border-emerald-500/50 text-emerald-300'
              : 'bg-[#121c15] border-[#1e2f23] text-neutral-400 hover:text-slate-200'
          }`}
          title="Imantar cortes a yardas exactas (5, 10, 15) [G]"
          id="btn-toggle-snap"
        >
          <div className="flex items-center gap-2">
            <Magnet className={`w-4 h-4 shrink-0 ${snapEnabled ? 'text-emerald-400' : 'text-neutral-500'}`} />
            {!isCollapsed && <span className="text-[11px] font-bold">Imán yardas</span>}
          </div>
          {!isCollapsed && (
            <span
              className={`w-6 h-3.5 rounded-full relative transition-colors ${
                snapEnabled ? 'bg-[#00a859]' : 'bg-[#233527]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${
                  snapEnabled ? 'left-3' : 'left-0.5'
                }`}
              />
            </span>
          )}
        </button>

        {/* 4. Bottom Utilities: Undo, Reset Formation, Clear Routes */}
        <div className="flex items-center gap-1 pt-1 border-t border-[#1b2b20]">
          {canUndo && (
            <button
              type="button"
              onClick={onUndo}
              className="p-2 flex-1 rounded-xl bg-[#121c15] hover:bg-[#1a291e] text-amber-400 border border-[#1e2f23] transition-all flex items-center justify-center"
              title="Deshacer trazo anterior (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onResetFormation && (
            <button
              type="button"
              onClick={onResetFormation}
              className="p-2 flex-1 rounded-xl bg-[#121c15] hover:bg-[#1a291e] text-slate-300 border border-[#1e2f23] transition-all flex items-center justify-center"
              title="Reiniciar posiciones de formación"
              id="btn-reset-formation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClearRoutes}
            className="p-2 flex-1 rounded-xl bg-[#121c15] hover:bg-red-950/50 text-red-400 border border-[#1e2f23] hover:border-red-800/50 transition-all flex items-center justify-center"
            title="Borrar todas las rutas del campo"
            id="btn-clear-routes"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
