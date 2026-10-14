import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Scissors, 
  Shield, 
  Timer, 
  PauseCircle, 
  Sparkles, 
  Square, 
  Circle, 
  Triangle,
  SlidersHorizontal,
  Route as RouteIcon,
  Check
} from 'lucide-react';
import { Player, PlayerRole, Route, ZoneCoverage } from '../types/playbook';
import { getPositionAlongPath, getRouteBasePoints, insertStopAlongPolyline } from '../utils/geometry';

interface PlayerDrawerProps {
  player: Player | null;
  route?: Route | null;
  zone?: ZoneCoverage | null;
  onClose: () => void;
  onUpdatePlayer: (updated: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  onClearPlayerRoute: (playerId: string) => void;
  onUpdateRoute?: (updated: Route) => void;
  onUpdateZone?: (zone: ZoneCoverage) => void;
  onDeleteZone?: (zoneId: string) => void;
  onOpenPresetRoutes?: () => void;
}

const ROLES: { role: PlayerRole; label: string }[] = [
  { role: 'QB', label: 'Quarterback (QB)' },
  { role: 'C', label: 'Centro (C)' },
  { role: 'WR1', label: 'Receptor X (Exterior)' },
  { role: 'WR2', label: 'Receptor Z (Exterior)' },
  { role: 'WR3', label: 'Receptor Slot (Y/H)' },
  { role: 'RB', label: 'Corredor (RB)' },
  { role: 'RUSH', label: 'Rusher (R)' },
  { role: 'CB1', label: 'Esquinero 1 (CB)' },
  { role: 'CB2', label: 'Esquinero 2 (CB)' },
  { role: 'S1', label: 'Free Safety (FS)' },
  { role: 'S2', label: 'Strong Safety (SS)' },
  { role: 'LB', label: 'Linebacker (LB)' },
  { role: 'CUSTOM', label: 'Personalizado' },
];

export const PlayerDrawer: React.FC<PlayerDrawerProps> = ({
  player,
  route,
  zone,
  onClose,
  onUpdatePlayer,
  onDeletePlayer,
  onClearPlayerRoute,
  onUpdateRoute,
  onUpdateZone,
  onDeleteZone,
  onOpenPresetRoutes,
}) => {
  if (!player) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'advanced'>('profile');

  const [label, setLabel] = useState(player.label);
  const [role, setRole] = useState<PlayerRole>(player.role);
  const [jerseyNumber, setJerseyNumber] = useState(player.jerseyNumber || '');
  const [customName, setCustomName] = useState(player.customName || '');
  const [team, setTeam] = useState(player.team);

  const [speedRating, setSpeedRating] = useState<number>(player.speedRating || 88);
  const [readProgression, setReadProgression] = useState<1 | 2 | 3 | undefined>(player.readProgression);
  const [hasMotion, setHasMotion] = useState<boolean>(player.hasMotion || false);
  const [delaySec, setDelaySec] = useState<number>(player.delaySec || 0);

  useEffect(() => {
    setLabel(player.label);
    setRole(player.role);
    setJerseyNumber(player.jerseyNumber || '');
    setCustomName(player.customName || '');
    setTeam(player.team);
    setSpeedRating(player.speedRating || 88);
    setReadProgression(player.readProgression);
    setHasMotion(player.hasMotion || false);
    setDelaySec(player.delaySec || 0);
  }, [player]);

  const handleSave = () => {
    onUpdatePlayer({
      ...player,
      label: label.trim() || player.label,
      role,
      jerseyNumber: jerseyNumber.trim(),
      customName: customName.trim(),
      team,
      speedRating,
      readProgression: team === 'offense' && role !== 'QB' ? readProgression : undefined,
      hasMotion: team === 'offense' ? hasMotion : false,
      delaySec: delaySec > 0 ? delaySec : undefined,
    });
    onClose();
  };

  // Check if route has an active stop and go or pause point
  const hasRoute = !!route && route.points.length >= 2;
  const stopPointIdx = route?.points.findIndex(
    (p, idx) => idx > 0 && (p.action === 'stop_and_go' || p.action === 'pause' || (p.pauseDuration && p.pauseDuration > 0))
  ) ?? -1;
  const isStopAndGoActive = stopPointIdx > 0;
  const currentPauseDuration = isStopAndGoActive && route?.points[stopPointIdx].pauseDuration ? route.points[stopPointIdx].pauseDuration! : 0.6;

  const handleToggleStopAndGo = () => {
    if (!route || !onUpdateRoute) return;

    if (isStopAndGoActive) {
      // Remove stop point and restore clean baseline trajectory
      const basePoints = getRouteBasePoints(route.points);
      onUpdateRoute({ ...route, points: basePoints });
    } else {
      const basePoints = getRouteBasePoints(route.points);
      if (basePoints.length >= 2) {
        // Place initial stop point at natural double-move break (~45% along route trajectory)
        const initialStopPos = getPositionAlongPath(basePoints, 0.45);
        const newPoints = insertStopAlongPolyline(basePoints, initialStopPos, 0.6);
        onUpdateRoute({ ...route, points: newPoints });
      }
    }
  };

  const handleSetPauseDuration = (sec: number) => {
    if (!route || !onUpdateRoute) return;
    if (stopPointIdx > 0) {
      const newPoints = route.points.map((p, idx) => {
        if (idx === stopPointIdx) {
          return { ...p, pauseDuration: sec, action: 'stop_and_go' as const };
        }
        return p;
      });
      onUpdateRoute({ ...route, points: newPoints });
    }
  };

  const handleAssignZonePreset = (type: 'flat' | 'hook' | 'deep_half' | 'deep_third' | 'quarter') => {
    if (!onUpdateZone) return;
    let cx = player.x;
    let cy = 45;
    let rx = 18;
    let ry = 12;
    let name = 'Zona';

    if (type === 'flat') {
      cx = player.x < 50 ? 20 : 80;
      cy = 60;
      rx = 16;
      ry = 9;
      name = player.x < 50 ? 'Flat Izq' : 'Flat Der';
    } else if (type === 'hook') {
      cx = player.x < 35 ? 35 : player.x > 65 ? 65 : 50;
      cy = 58;
      rx = 18;
      ry = 10;
      name = 'Hook / Curl';
    } else if (type === 'deep_half') {
      cx = player.x < 50 ? 28 : 72;
      cy = 30;
      rx = 22;
      ry = 14;
      name = player.x < 50 ? 'Deep Half Izq' : 'Deep Half Der';
    } else if (type === 'deep_third') {
      cx = player.x < 35 ? 18 : player.x > 65 ? 82 : 50;
      cy = 28;
      rx = 16;
      ry = 15;
      name = player.x < 35 ? 'Deep 1/3 Izq' : player.x > 65 ? 'Deep 1/3 Der' : 'Deep 1/3 Centro';
    } else if (type === 'quarter') {
      cx = player.x;
      cy = 30;
      rx = 12;
      ry = 15;
      name = `Quarter 1/4 (${player.label})`;
    }

    const newZone: ZoneCoverage = {
      id: zone?.id || `zone_${player.id}_${Date.now()}`,
      playerId: player.id,
      name,
      cx,
      cy,
      rx,
      ry,
      color: player.color || '#a855f7',
    };

    onUpdateZone(newZone);
  };

  return (
    <aside 
      aria-label="Panel de configuración de jugador"
      className="fixed bottom-3 sm:bottom-auto sm:top-14 right-2 sm:right-4 z-40 w-[94vw] sm:w-84 max-w-sm bg-[#090f0c]/98 backdrop-blur-2xl border border-[#203426] sm:rounded-2xl shadow-2xl p-3 sm:p-3.5 transition-all max-h-[88vh] overflow-y-auto ring-1 ring-white/10"
    >
      {/* Header with Player Badge */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#1b2b20]">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs text-black shadow-md shrink-0"
            style={{ backgroundColor: player.color || '#facc15' }}
          >
            {label}
          </div>
          <div className="overflow-hidden">
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wide truncate">
              {customName || `Jugador ${label}`}
            </h3>
            <p className="text-[10px] text-neutral-400 font-mono">
              {team === 'offense' ? 'Ofensiva' : 'Defensiva'} • {speedRating} SPD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-[#142017] text-neutral-400 hover:text-white hover:bg-[#1b2c1f] transition-all"
            title="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Esenciales vs Avanzado */}
      <div className="flex items-center gap-1 p-1 bg-[#0c140f] rounded-xl border border-[#1b2b20] my-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'profile'
              ? 'bg-[#008744] text-white shadow-md'
              : 'text-neutral-400 hover:text-slate-200'
          }`}
        >
          <RouteIcon className="w-3.5 h-3.5" />
          <span>Perfil & Rutas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('advanced')}
          className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'advanced'
              ? 'bg-[#008744] text-white shadow-md'
              : 'text-neutral-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Simulación</span>
        </button>
      </div>

      {/* TAB 1: Profile & Tactical Routes */}
      {activeTab === 'profile' && (
        <div className="space-y-2.5 animate-in fade-in duration-150">
          {/* Quick Route Preset Big Action Button */}
          {team === 'offense' && onOpenPresetRoutes && (
            <button
              type="button"
              onClick={onOpenPresetRoutes}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-900/60 to-[#0e2417] hover:from-emerald-800/80 hover:to-[#12301f] text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-between shadow-md transition-all group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Asignar Ruta Predefinida (Slant, Out...)</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded font-mono border border-emerald-600/30">
                VER ▾
              </span>
            </button>
          )}

          {/* Label, Number & Name */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[9px] font-bold uppercase text-neutral-400 mb-1">
                Ficha
              </label>
              <input
                type="text"
                maxLength={4}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-2 py-1.5 bg-[#121c15] border border-[#1e2f23] rounded-lg text-xs text-white uppercase text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-neutral-400 mb-1">
                Dorsal
              </label>
              <input
                type="text"
                maxLength={3}
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                placeholder="7"
                className="w-full px-2 py-1.5 bg-[#121c15] border border-[#1e2f23] rounded-lg text-xs text-white text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase text-neutral-400 mb-1">
                Equipo
              </label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value as 'offense' | 'defense')}
                className="w-full px-1.5 py-1.5 bg-[#121c15] border border-[#1e2f23] rounded-lg text-xs text-white font-bold"
              >
                <option value="offense">Ofensa</option>
                <option value="defense">Defensa</option>
              </select>
            </div>
          </div>

          {/* Role Selector */}
          <div>
            <label className="block text-[9px] font-bold uppercase text-neutral-400 mb-1">
              Posición / Rol Táctico
            </label>
            <select
              value={role}
              onChange={(e) => {
                const r = e.target.value as PlayerRole;
                setRole(r);
                if (r === 'QB') setLabel('QB');
                else if (r === 'C') setLabel('C');
                else if (r === 'WR1') setLabel('X');
                else if (r === 'WR2') setLabel('Z');
                else if (r === 'WR3') setLabel('Y');
                else if (r === 'RUSH') setLabel('R');
              }}
              className="w-full px-2 py-1.5 bg-[#121c15] border border-[#1e2f23] rounded-lg text-xs text-slate-200"
            >
              {ROLES.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Route Options (Stop & Go) */}
          {hasRoute && team === 'offense' && (
            <div className="p-2.5 rounded-xl bg-[#121c15] border border-[#1e2f23] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <PauseCircle className={`w-4 h-4 ${isStopAndGoActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                  <div>
                    <span className="text-[10px] font-bold text-slate-200 uppercase block">
                      Stop & Go / Finta
                    </span>
                    <span className="text-[8px] text-neutral-400 block">
                      Pausa en el corte antes de acelerar
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleStopAndGo}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    isStopAndGoActive
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-[#18261d] text-slate-300 hover:text-white border border-[#25392b]'
                  }`}
                >
                  {isStopAndGoActive ? 'Activado 🛑' : '+ Añadir'}
                </button>
              </div>

              {isStopAndGoActive && (
                <div className="pt-1.5 border-t border-[#1e2f23]">
                  <label className="block text-[8px] font-bold uppercase text-neutral-400 mb-1">
                    Duración de pausa:
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {[0.4, 0.6, 0.8, 1.0].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => handleSetPauseDuration(dur)}
                        className={`py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                          Math.abs(currentPauseDuration - dur) < 0.05
                            ? 'bg-[#008744] text-white border border-emerald-400'
                            : 'bg-[#18261d] text-neutral-400 hover:text-white border border-[#25392b]'
                        }`}
                      >
                        {dur}s
                      </button>
                    ))}
                  </div>
                  <p className="text-[8px] text-amber-400/90 flex items-center gap-1 mt-1 font-medium">
                    <span>💡</span>
                    <span>Arrastra el botón STOP en el campo para deslizarlo por la ruta</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Defensive Zone Options */}
          {team === 'defense' && role !== 'RUSH' && (
            <div className="p-2.5 rounded-xl bg-[#121c15] border border-[#1e2f23] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Shield className={`w-4 h-4 ${zone ? 'text-purple-400' : 'text-neutral-400'}`} />
                  <div>
                    <span className="text-[10px] font-bold text-slate-200 uppercase block">
                      Cobertura de Zona
                    </span>
                    <span className="text-[8px] text-neutral-400 block">
                      {zone ? zone.name : 'Hombre a hombre'}
                    </span>
                  </div>
                </div>
                {zone && onDeleteZone && (
                  <button
                    type="button"
                    onClick={() => onDeleteZone(zone.id)}
                    className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-950/60 text-red-300 border border-red-800/40 hover:bg-red-900/60"
                  >
                    Quitar
                  </button>
                )}
              </div>

              {/* Zone Shape Switcher */}
              {zone && onUpdateZone && (
                <div className="pt-1.5 border-t border-[#1e2f23]">
                  <label className="block text-[8px] font-bold uppercase text-neutral-400 mb-1">
                    Forma de Zona:
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { shape: 'rectangle' as const, label: 'Cuadro', icon: Square },
                      { shape: 'circle' as const, label: 'Círculo', icon: Circle },
                      { shape: 'triangle' as const, label: 'Triángulo', icon: Triangle },
                    ].map((s) => {
                      const isShape = (zone.shape || 'rectangle') === s.shape;
                      const SIcon = s.icon;
                      return (
                        <button
                          key={s.shape}
                          type="button"
                          onClick={() => onUpdateZone({ ...zone, shape: s.shape })}
                          className={`p-1 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all ${
                            isShape
                              ? 'bg-purple-600 border border-purple-300 text-white shadow-sm'
                              : 'bg-[#18261d] text-neutral-400 border border-[#25392b] hover:text-white'
                          }`}
                        >
                          <SIcon className="w-3 h-3" />
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Preset Zones */}
              <div className="pt-1.5 border-t border-[#1e2f23]">
                <label className="block text-[8px] font-bold uppercase text-neutral-400 mb-1">
                  Zonas Predefinidas:
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => handleAssignZonePreset('flat')}
                    className="p-1 rounded-lg text-[9px] font-bold bg-[#18261d] hover:bg-[#203427] text-cyan-300 border border-cyan-800/30 text-left"
                  >
                    Flat (0-5y)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignZonePreset('hook')}
                    className="p-1 rounded-lg text-[9px] font-bold bg-[#18261d] hover:bg-[#203427] text-amber-300 border border-amber-800/30 text-left"
                  >
                    Hook / Curl
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignZonePreset('deep_half')}
                    className="p-1 rounded-lg text-[9px] font-bold bg-[#18261d] hover:bg-[#203427] text-purple-300 border border-purple-800/30 text-left"
                  >
                    Deep Half
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignZonePreset('deep_third')}
                    className="p-1 rounded-lg text-[9px] font-bold bg-[#18261d] hover:bg-[#203427] text-emerald-300 border border-emerald-800/30 text-left"
                  >
                    Deep 1/3
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Simulation Timings & Attributes */}
      {activeTab === 'advanced' && (
        <div className="space-y-2.5 animate-in fade-in duration-150">
          {/* Speed Rating Slider */}
          <div className="p-2.5 rounded-xl bg-[#121c15] border border-[#1e2f23]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-200">
                ⚡ Velocidad Atleta
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30">
                {speedRating} SPD
              </span>
            </div>
            <input
              type="range"
              min={70}
              max={99}
              value={speedRating}
              onChange={(e) => setSpeedRating(Number(e.target.value))}
              className="w-full h-1.5 bg-[#0a0f0c] rounded-lg appearance-none cursor-pointer accent-[#00a859]"
            />
            <div className="flex justify-between text-[8px] font-mono text-neutral-500 mt-1">
              <span>70 (Promedio)</span>
              <span>88 (Estándar)</span>
              <span>99 (Élite / 4.3s)</span>
            </div>
          </div>

          {/* Pre-Snap Delay (Espera estática al snap) */}
          <div className="p-2.5 rounded-xl bg-[#121c15] border border-[#1e2f23]">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold uppercase text-slate-200">
                  Retardo al Snap
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                delaySec > 0 
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/40' 
                  : 'bg-[#0a0f0c] text-neutral-400 border-[#203025]'
              }`}>
                {delaySec > 0 ? `${delaySec.toFixed(1)}s espera` : 'Inmediato (0s)'}
              </span>
            </div>
            <p className="text-[8px] text-neutral-400 mb-2">
              Espera inmóvil antes de salir en su ruta (ideal para engaños, delays o pantallas).
            </p>
            <div className="grid grid-cols-4 gap-1">
              {[
                { val: 0, label: '0s' },
                { val: 0.5, label: '0.5s' },
                { val: 0.8, label: '0.8s' },
                { val: 1.2, label: '1.2s' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setDelaySec(opt.val)}
                  className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                    delaySec === opt.val
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-[#18261d] text-neutral-400 border border-[#25392b] hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* QB Progression Read (Offensive receivers) */}
          {team === 'offense' && role !== 'QB' && (
            <div className="p-2.5 rounded-xl bg-[#121c15] border border-[#1e2f23]">
              <label className="block text-[10px] font-bold uppercase text-slate-200 mb-1.5">
                🎯 Progresión de Lectura QB
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { val: 1 as const, label: '❶ 1ª Lectura' },
                  { val: 2 as const, label: '❷ 2ª Lectura' },
                  { val: 3 as const, label: '❸ Checkdown' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setReadProgression(readProgression === opt.val ? undefined : opt.val)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      readProgression === opt.val
                        ? 'bg-[#008744] text-white border border-emerald-400'
                        : 'bg-[#18261d] text-neutral-400 border border-[#25392b] hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pre-Snap Motion Toggle */}
          {team === 'offense' && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#121c15] border border-[#1e2f23]">
              <div>
                <span className="text-[10px] font-bold text-slate-200 uppercase block">Movimiento Pre-Snap</span>
                <span className="text-[8px] text-neutral-400 block">Cruza la formación antes del snap</span>
              </div>
              <button
                type="button"
                onClick={() => setHasMotion(!hasMotion)}
                className={`w-9 h-5 rounded-full transition-colors relative ${
                  hasMotion ? 'bg-[#00a859]' : 'bg-[#2a3a2f]'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                    hasMotion ? 'left-4' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer Utility Actions */}
      <div className="pt-2.5 mt-2.5 border-t border-[#1b2b20] flex items-center gap-1.5">
        {route && (
          <button
            type="button"
            onClick={() => onClearPlayerRoute(player.id)}
            className="p-1.5 rounded-lg bg-[#142017] hover:bg-[#1b2c1f] text-amber-400 border border-[#1e2f23] text-xs font-semibold flex items-center gap-1 transition-all"
            title="Borrar ruta de este jugador"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="text-[10px]">Ruta</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onDeletePlayer(player.id);
            onClose();
          }}
          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 text-xs font-semibold flex items-center gap-1 transition-all"
          title="Eliminar jugador del campo"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="text-[10px]">Quitar</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-1.5 px-3 rounded-lg bg-[#008744] hover:bg-[#00a859] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1 ml-auto uppercase tracking-wide"
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Listo</span>
        </button>
      </div>
    </aside>
  );
};
