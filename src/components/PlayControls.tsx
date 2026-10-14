import React, { useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  Repeat,
  Flag
} from 'lucide-react';
import { PlaybackState, FlagPullEvent } from '../types/playbook';

interface PlayControlsProps {
  playback: PlaybackState;
  onTogglePlay: () => void;
  onReset: () => void;
  onSeek: (progress: number) => void;
  onChangeSpeed: (speed: number) => void;
  onToggleLoop: () => void;
  onStep: (delta: number) => void;
  flagPullEvent?: FlagPullEvent | null;
  onToggleStopAtFlagPull?: () => void;
}

export const PlayControls: React.FC<PlayControlsProps> = ({
  playback,
  onTogglePlay,
  onReset,
  onSeek,
  onChangeSpeed,
  onToggleLoop,
  onStep,
  flagPullEvent,
  onToggleStopAtFlagPull,
}) => {
  const speeds = [0.5, 1.0, 1.5, 2.0];
  const trackRef = useRef<HTMLDivElement>(null);

  // Direct click or drag on custom timeline track
  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!trackRef.current) return;

    const updateProgress = (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
      onSeek(newProgress);
    };

    updateProgress(e.clientX);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      updateProgress(moveEvent.clientX);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const clampedProgress = Math.max(0, Math.min(1, playback.progress));
  const percentage = Math.round(clampedProgress * 100);
  const currentTime = (clampedProgress * 15.0).toFixed(1);
  const progressPercent = clampedProgress * 100;

  return (
    <footer 
      aria-label="Controles de simulación táctica"
      className="bg-[#070b08]/98 backdrop-blur-xl border-t border-[#1b2b20] px-3 sm:px-6 py-2 sm:py-2.5 flex flex-col gap-1.5 shadow-2xl z-20 select-none"
    >
      {/* Top row: High-Visibility Interactive Scrubber with Release Milestone */}
      <div className="flex items-center gap-2 sm:gap-3 w-full max-w-2xl mx-auto">
        {/* Current running time */}
        <span className="text-[11px] font-mono font-bold text-neutral-400 w-12 text-right shrink-0">
          {currentTime}s
        </span>
        
        {/* Custom Scrubber Track */}
        <div 
          ref={trackRef}
          onPointerDown={handleTrackPointerDown}
          className="relative flex-1 h-6 flex items-center cursor-pointer group select-none touch-none"
          title="Arrastra o haz clic para desplazar la simulación"
        >
          {/* Base Dark Track */}
          <div className="w-full h-2 bg-[#121d15] rounded-full overflow-hidden border border-[#1e3023] group-hover:h-2.5 transition-[height] duration-150 relative">
            {/* Active Tecmilenio Green Progress Bar */}
            <div 
              className="h-full bg-gradient-to-r from-[#008744] to-[#00c96b] rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Dynamic Opportune Pass Release Marker */}
          {flagPullEvent?.passReleaseTimeSec && (
            <div 
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-3.5 bg-amber-400 rounded-full pointer-events-none z-10 shadow-md ring-1 ring-amber-300"
              style={{ left: `${Math.min(98, Math.max(2, (flagPullEvent.passReleaseTimeSec / 15.0) * 100))}%` }}
              title={`🏈 Momento Óptimo de Pase del QB: ${flagPullEvent.passReleaseTimeSec.toFixed(1)}s (Ventana Abierta)`}
            />
          )}

          {/* Flag Pull / Tackle Marker */}
          {flagPullEvent && flagPullEvent.occurred && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSeek(flagPullEvent.progress);
              }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center cursor-pointer z-30 group/flag"
              style={{ left: `${Math.min(99, Math.max(1, flagPullEvent.progress * 100))}%` }}
              title={`🚩 Flag Pull Aprox: ${flagPullEvent.timeSec}s (Yarda ${flagPullEvent.yardLine})`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-red-600 ring-2 ring-red-400 shadow-lg flex items-center justify-center hover:scale-125 transition-transform animate-pulse">
                <span className="text-[9px] leading-none select-none">🚩</span>
              </div>
              <div className="hidden group-hover/flag:flex absolute bottom-full mb-1.5 px-2 py-1 rounded-lg bg-[#140608] border border-red-500 text-white text-[10px] whitespace-nowrap shadow-2xl z-50 flex-col items-center pointer-events-none">
                <span className="font-extrabold text-red-300">
                  {flagPullEvent.isSack ? '💥 SACK APROX' : flagPullEvent.isTouchdown ? '🏆 TOUCHDOWN' : '🚩 BANDERA RETIRADA'}
                </span>
                {flagPullEvent.tacklerLabel && !flagPullEvent.isTouchdown && (
                  <span className="text-[10px] font-bold text-amber-300">
                    por {flagPullEvent.tacklerName || flagPullEvent.tacklerLabel}
                  </span>
                )}
                <span className="text-[9px] text-neutral-300">
                  {flagPullEvent.timeSec}s • Yarda {flagPullEvent.yardLine} • {flagPullEvent.yardsGained >= 0 ? `+${flagPullEvent.yardsGained}` : flagPullEvent.yardsGained} yds
                </span>
              </div>
            </div>
          )}

          {/* Interactive Playhead Handle */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full ring-2 ring-[#00a859] shadow-xl pointer-events-none group-hover:scale-125 transition-transform z-20"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Status / Percentage Indicator */}
        <div className="flex items-center gap-1.5 w-16 shrink-0 justify-end">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#121c15] text-emerald-400 border border-[#1e3023]">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Flag Pull Live Notification Event Banner */}
      {flagPullEvent && flagPullEvent.occurred && Math.abs(clampedProgress - flagPullEvent.progress) < 0.035 && (
        <div className="w-full max-w-2xl mx-auto px-3 py-1 rounded-xl bg-[#20080d]/95 border border-red-500/80 shadow-lg flex items-center justify-between text-xs animate-in fade-in slide-in-from-bottom-1 duration-150">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base animate-bounce">{flagPullEvent.isSack ? '💥' : flagPullEvent.isTouchdown ? '🏆' : '🚩'}</span>
            <div>
              <span className="font-black text-red-300 uppercase tracking-wide text-[11px] sm:text-xs">
                {flagPullEvent.isSack ? '¡Sack al QB!' : flagPullEvent.isTouchdown ? '¡Anotación Touchdown!' : '¡Bandera Retirada a la Ofensiva!'}
              </span>
              <span className="text-neutral-300 text-[10px] sm:text-[11px] ml-1.5">
                a los <strong className="text-white font-mono">{flagPullEvent.timeSec}s</strong> en <strong className="text-white">Yarda {flagPullEvent.yardLine}</strong>
                {flagPullEvent.tacklerLabel && ` por ${flagPullEvent.tacklerName || flagPullEvent.tacklerLabel}`}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-950 text-red-200 border border-red-600/60 font-mono">
            {flagPullEvent.yardsGained >= 0 ? `+${flagPullEvent.yardsGained}` : flagPullEvent.yardsGained} YDS
          </span>
        </div>
      )}

      {/* Bottom row: Minimalist Centered Controls with Direct Speed Buttons */}
      <div className="flex items-center justify-between sm:justify-center max-w-2xl mx-auto w-full gap-1.5 sm:gap-3 flex-wrap">
        {/* Left cluster: Pre-Snap, Stepping, and Auto-Stop Toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={onReset}
            className="px-2.5 py-1.5 rounded-xl bg-[#121c15] hover:bg-[#1a291e] text-slate-300 transition-all border border-[#1e3023] flex items-center gap-1.5 text-xs font-semibold uppercase shadow-sm"
            title="Reiniciar a formación inicial (Pre-Snap) [R]"
            id="btn-sim-reset"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Pre-Snap</span>
          </button>

          <button
            onClick={() => onStep(-0.1)}
            className="p-1.5 rounded-xl bg-[#121c15] hover:bg-[#1a291e] text-slate-300 transition-all border border-[#1e3023]"
            title="Retroceder 10%"
            id="btn-step-back"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Parar en Bandera Toggle Button */}
          {onToggleStopAtFlagPull && (
            <button
              type="button"
              onClick={onToggleStopAtFlagPull}
              className={`px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                playback.stopAtFlagPull
                  ? 'bg-[#220b10] border-red-500/70 text-red-300 ring-1 ring-red-500/40'
                  : 'bg-[#121c15] border-[#1e3023] text-neutral-400 hover:text-slate-200'
              }`}
              title="Detener la simulación automáticamente en el momento en que quitan la bandera"
              id="btn-toggle-flag-stop"
            >
              <Flag className={`w-3.5 h-3.5 ${playback.stopAtFlagPull ? 'text-red-400 fill-red-400' : 'text-neutral-500'}`} />
              <span className="hidden sm:inline">
                {playback.stopAtFlagPull ? 'Auto-Parar Bandera' : 'Parar en Bandera'}
              </span>
            </button>
          )}
        </div>

        {/* Center: Big Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-2 px-5 sm:px-7 py-1.5 sm:py-2 rounded-xl font-extrabold text-xs sm:text-sm tracking-wide transition-all uppercase active:scale-[0.98] shadow-lg ${
            playback.isPlaying
              ? 'bg-[#b45309] hover:bg-[#d97706] text-white shadow-amber-950/40 ring-1 ring-amber-400'
              : 'bg-[#008744] hover:bg-[#00a859] text-white shadow-emerald-950/40 ring-1 ring-emerald-400'
          }`}
          title="Iniciar / Pausar simulación [Barra espaciadora]"
          id="btn-toggle-play"
        >
          {playback.isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pausar</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Simular</span>
            </>
          )}
        </button>

        {/* Right cluster: Step forward, Speeds, and Loop */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onStep(0.1)}
            className="p-1.5 rounded-xl bg-[#121c15] hover:bg-[#1a291e] text-slate-300 transition-all border border-[#1e3023]"
            title="Avanzar 10%"
            id="btn-step-forward"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Direct Speed Selector Pills */}
          <div className="flex items-center bg-[#0d1510] p-0.5 rounded-xl border border-[#1e3023]">
            {speeds.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChangeSpeed(s)}
                className={`px-1.5 sm:px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                  playback.speed === s
                    ? 'bg-[#008744] text-white shadow-sm'
                    : 'text-neutral-400 hover:text-slate-200'
                }`}
                title={`Velocidad ${s}x`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Loop toggle */}
          <button
            onClick={onToggleLoop}
            className={`p-1.5 sm:px-2 sm:py-1.5 rounded-xl border transition-all text-xs font-semibold flex items-center gap-1 uppercase ${
              playback.loop
                ? 'bg-[#00542a] border-emerald-500/60 text-emerald-300 shadow-sm'
                : 'bg-[#121c15] border-[#1e3023] text-neutral-400 hover:text-slate-200'
            }`}
            title="Repetir simulación en bucle continuo"
            id="btn-toggle-loop"
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
