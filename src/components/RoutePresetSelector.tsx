import React from 'react';
import { X, Sparkles, CornerUpRight } from 'lucide-react';
import { Player, Route } from '../types/playbook';
import { generatePresetRoute, RoutePresetType } from '../utils/geometry';

interface RoutePresetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlayer: Player | null;
  players: Player[];
  onApplyPresetRoute: (playerId: string, route: Route) => void;
  onSelectPlayer: (player: Player) => void;
}

interface PresetOption {
  type: RoutePresetType;
  name: string;
  tag: string;
  description: string;
  actionType: 'run' | 'rush';
}

const ROUTE_OPTIONS: PresetOption[] = [
  { type: 'stop_and_go', name: 'Stop & Go (Hitch & Go)', tag: 'Doble Movimiento', description: 'Corre 5-7 yds, realiza una parada estática de 0.6s y acelera profundo al fondo.', actionType: 'run' },
  { type: 'sluggo', name: 'Sluggo (Slant & Go)', tag: 'Doble Movimiento', description: 'Corte en diagonal hacia el centro, parada y explosión vertical profunda.', actionType: 'run' },
  { type: 'out_and_up', name: 'Out & Up (Stop & Go Lateral)', tag: 'Doble Movimiento', description: 'Corte hacia la banda, amague/pausa estática y desmarque vertical por la línea.', actionType: 'run' },
  { type: 'whip', name: 'Whip / Pivot (Parada y Vuelta)', tag: 'Corte Rápido', description: 'Corte al centro con parada estática de 0.5s y cambio brusco hacia la banda.', actionType: 'run' },
  { type: 'delay_screen', name: 'Delay / Pantalla con Espera', tag: 'Retardo / Delay', description: 'Espera estática en el backfield 0.8s antes de recibir el pase pantalla.', actionType: 'run' },
  { type: 'slant_in', name: 'Slant (Diagonal al Centro)', tag: 'Ruta 2', description: 'Corte rápido hacia el centro del campo a 3-5 yardas.', actionType: 'run' },
  { type: 'out', name: 'Out (Escuadra a la Banda)', tag: 'Ruta 3', description: 'Corte a 90 grados hacia la línea lateral a 5-7 yardas.', actionType: 'run' },
  { type: 'in_dig', name: 'In / Dig (Escuadra al Centro)', tag: 'Ruta 4', description: 'Corte a 90 grados hacia el centro detrás de los defensivos.', actionType: 'run' },
  { type: 'curl', name: 'Curl / Gancho (Freno y Regreso)', tag: 'Ruta 5', description: 'Corre vertical y gira de regreso hacia el QB.', actionType: 'run' },
  { type: 'post', name: 'Post (Poste al Fondo Centro)', tag: 'Ruta 8', description: 'Ruta profunda con corte hacia los postes centrales.', actionType: 'run' },
  { type: 'corner', name: 'Corner / Bandera (Esquina)', tag: 'Ruta 7', description: 'Ruta profunda con corte hacia la esquina de anotación.', actionType: 'run' },
  { type: 'go_fly', name: 'Go / Fly (Pase Profundo Recto)', tag: 'Ruta 9', description: 'Velocidad máxima en línea recta hacia el fondo.', actionType: 'run' },
  { type: 'drag', name: 'Drag / Shallow Cross (Cruce Bajo)', tag: 'Ruta 1', description: 'Cruce horizontal por debajo de 3-4 yardas de profundidad.', actionType: 'run' },
  { type: 'wheel', name: 'Wheel (Ruta Rueda por la Banda)', tag: 'Especial', description: 'Escape lateral y aceleración vertical pegado a la banda.', actionType: 'run' },
  { type: 'flat', name: 'Flat (Ruta Plana Rápida)', tag: 'Ruta 0', description: 'Escape rápido a la zona lateral de scrimmage.', actionType: 'run' },
  { type: 'rusher_blitz', name: 'Rusher Blitz Directo', tag: 'Defensa', description: 'Carga explosiva directa hacia la posición del QB.', actionType: 'rush' },
];

export const RoutePresetSelector: React.FC<RoutePresetSelectorProps> = ({
  isOpen,
  onClose,
  selectedPlayer,
  players,
  onApplyPresetRoute,
  onSelectPlayer,
}) => {
  if (!isOpen) return null;

  const targetPlayer = selectedPlayer || players[0];

  const handleApply = (option: PresetOption) => {
    if (!targetPlayer) return;

    const isLeft = targetPlayer.x < 50;
    const points = generatePresetRoute({ x: targetPlayer.x, y: targetPlayer.y }, option.type, isLeft);

    const newRoute: Route = {
      id: `route_${targetPlayer.id}_${Date.now()}`,
      playerId: targetPlayer.id,
      actionType: option.actionType,
      points,
    };

    onApplyPresetRoute(targetPlayer.id, newRoute);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-[#0e1611] border border-[#26382c] rounded-xl shadow-clean-lg overflow-hidden z-10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#26382c] flex items-center justify-between bg-[#131c16]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-tecmilenio-950 text-tecmilenio-400 border border-tecmilenio-600/40">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight uppercase">Árbol de Rutas Tácticas</h2>
              <p className="text-[11px] text-slate-400">Asigna trayectorias estándar con un solo toque</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#18241d] hover:bg-[#1f2e25] text-slate-400 hover:text-white transition-all border border-[#26382c]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Player Selector Bar */}
        <div className="p-3 bg-[#0c120e] border-b border-[#26382c] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase mr-1">Aplicar a:</span>
          {players.map((p) => {
            const isTarget = targetPlayer?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPlayer(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  isTarget
                    ? 'bg-tecmilenio-600 text-white shadow-clean'
                    : 'bg-[#141e17] text-slate-300 hover:bg-[#18241d] border border-[#26382c]'
                }`}
              >
                <span>{p.label}</span>
                <span className="text-[10px] opacity-75">({p.role})</span>
              </button>
            );
          })}
        </div>

        {/* Routes Grid */}
        <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ROUTE_OPTIONS.map((opt) => (
            <div
              key={opt.type}
              onClick={() => handleApply(opt)}
              className="p-3 rounded-lg bg-[#131c16] hover:bg-[#18241d] border border-[#26382c] hover:border-tecmilenio-500/50 cursor-pointer transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-tecmilenio-950 text-tecmilenio-400 border border-tecmilenio-600/40">
                    {opt.tag}
                  </span>
                  <CornerUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-tecmilenio-400 transition-all" />
                </div>
                <h4 className="font-bold text-xs text-slate-100 group-hover:text-tecmilenio-300 transition-colors">
                  {opt.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                  {opt.description}
                </p>
              </div>
              <div className="mt-2 pt-1.5 border-t border-[#26382c] flex justify-end">
                <span className="text-[10px] text-tecmilenio-400 font-semibold group-hover:underline">
                  Trazar Ruta →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
