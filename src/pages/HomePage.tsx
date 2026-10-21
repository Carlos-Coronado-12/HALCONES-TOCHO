import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from '../types/playbook';
import { UserStudyStats } from '../types/study';
import { 
  Play as PlayIcon, 
  FolderLock, 
  GraduationCap, 
  Settings, 
  Flame, 
  ArrowRight, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface HomePageProps {
  plays: Play[];
  currentPlay: Play;
  studyStats: UserStudyStats;
  onSelectPlay: (play: Play) => void;
  onOpenExportModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  plays,
  currentPlay,
  studyStats,
  onSelectPlay,
  onOpenExportModal,
}) => {
  const navigate = useNavigate();
  const totalAnswered = studyStats.totalAnswered;
  const accuracy = totalAnswered > 0 ? Math.round((studyStats.correctAnswers / totalAnswered) * 100) : 0;

  return (
    <div className="flex-1 w-full h-screen overflow-y-auto bg-[#070d09] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8 relative select-none">
      {/* Stadium Grid & Subtle Ambient Glow Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 25%, rgba(0, 168, 89, 0.25) 0%, transparent 60%),
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 32px 32px, 32px 32px'
        }}
      />

      {/* Main Centered Content Container */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center space-y-7 my-auto py-6 animate-in fade-in duration-300">
        
        {/* 1. Header / Logo Block */}
        <div className="flex flex-col items-center space-y-3">
          {/* Halcones Eagle Head Logo with Glowing Aura */}
          <div className="relative group cursor-pointer" onClick={() => navigate('/pizarra')}>
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-[#00a859]/30 to-emerald-400/20 rounded-full blur-xl opacity-70 group-hover:opacity-100 transition-opacity" />
            <img
              src={`${import.meta.env.BASE_URL}halcones-logo-clean.png`}
              alt="Halcones Logo"
              className="relative w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-[0_10px_20px_rgba(0,168,89,0.4)] group-hover:scale-105 transition-transform duration-200"
            />
          </div>

          {/* Title Banner */}
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase font-display leading-none drop-shadow-md">
              Halcones <span className="text-emerald-400">Tocho</span>
            </h1>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-black uppercase tracking-widest text-emerald-300 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Flag Football Tactics
            </div>
          </div>
        </div>

        {/* 2. Vertically Stacked Menu Action Buttons */}
        <div className="w-full space-y-3.5">

          {/* Button 1: JUGAR / PIZARRA TÁCTICA */}
          <button
            type="button"
            onClick={() => navigate('/pizarra')}
            className="w-full group relative flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-[#0d2a17] to-[#12381f] hover:from-[#11381f] hover:to-[#174828] border-2 border-emerald-500/60 hover:border-emerald-400 shadow-xl shadow-emerald-950/80 transition-all duration-150 active:scale-[0.98]"
            id="btn-menu-pizarra"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-slate-950 flex items-center justify-center font-black shadow-md group-hover:scale-110 transition-transform">
                <PlayIcon className="w-5 h-5 fill-slate-950 ml-0.5" />
              </div>
              <div className="text-left">
                <div className="text-base sm:text-lg font-black text-white tracking-wide uppercase group-hover:text-emerald-200 transition-colors">
                  Pizarra Táctica
                </div>
                <div className="text-[11px] text-emerald-400/90 font-mono font-medium">
                  Diseño 5v5 & Simulación
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Button 2: CASILLERO / BIBLIOTECA */}
          <button
            type="button"
            onClick={() => navigate('/casillero')}
            className="w-full group relative flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-[#0d1c2a] to-[#112438] hover:from-[#11263c] hover:to-[#16314c] border-2 border-sky-500/60 hover:border-sky-400 shadow-xl shadow-sky-950/60 transition-all duration-150 active:scale-[0.98]"
            id="btn-menu-casillero"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-slate-950 flex items-center justify-center font-black shadow-md group-hover:scale-110 transition-transform">
                <FolderLock className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <div className="text-base sm:text-lg font-black text-white tracking-wide uppercase group-hover:text-sky-200 transition-colors">
                  Casillero (Playbook)
                </div>
                <div className="text-[11px] text-sky-400/90 font-mono font-medium">
                  {plays.length} Jugadas Guardadas
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-sky-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Button 3: ACADEMIA IFAF / MODO ESTUDIO */}
          <button
            type="button"
            onClick={() => navigate('/academia')}
            className="w-full group relative flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-[#2a220d] to-[#382d11] hover:from-[#352b12] hover:to-[#483a15] border-2 border-amber-500/60 hover:border-amber-400 shadow-xl shadow-amber-950/60 transition-all duration-150 active:scale-[0.98]"
            id="btn-menu-academia"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black shadow-md group-hover:scale-110 transition-transform">
                <GraduationCap className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <div className="text-base sm:text-lg font-black text-white tracking-wide uppercase group-hover:text-amber-200 transition-colors">
                  Halcones Academy
                </div>
                <div className="text-[11px] text-amber-300/90 font-mono font-medium">
                  Reglamento IFAF & Rutas 1-9
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Button 4: OPCIONES / RESPALDO */}
          <button
            type="button"
            onClick={onOpenExportModal}
            className="w-full group relative flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[#0f1812] hover:bg-[#16251b] border border-[#233c29] hover:border-slate-500 shadow-lg transition-all duration-150 active:scale-[0.98]"
            id="btn-menu-opciones"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#182a1d] text-slate-300 flex items-center justify-center font-black">
                <Settings className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-200 tracking-wider uppercase">
                  Opciones y Respaldo
                </div>
                <div className="text-[10px] text-neutral-400 font-mono">
                  Sincronización Cloud & JSON
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
          </button>

        </div>

        {/* 3. Bottom Quick Resume & Stats Pill */}
        <div className="w-full pt-2 flex flex-col items-center space-y-2">
          {/* Quick Resume Card for Current Play */}
          <button
            type="button"
            onClick={() => {
              onSelectPlay(currentPlay);
              navigate('/pizarra');
            }}
            className="w-full p-2.5 rounded-xl bg-[#0c1810]/90 border border-emerald-500/30 hover:border-emerald-400/70 text-xs flex items-center justify-between transition-all group shadow-md"
            title="Continuar editando la última jugada"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                Última
              </span>
              <span className="font-extrabold text-white truncate max-w-[200px]">
                {currentPlay.name}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline">
                ({currentPlay.formationName})
              </span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 font-bold text-[11px] shrink-0">
              <span>Continuar</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Quick Stats Ribbon */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 font-medium">
            <div className="flex items-center gap-1 text-orange-400 font-bold">
              <Flame className="w-3.5 h-3.5 fill-orange-400" />
              <span>Racha: {studyStats.currentStreak}</span>
            </div>
            <span>•</span>
            <div className="text-slate-300">
              Precisión: <strong className="text-emerald-400 font-bold">{accuracy}%</strong>
            </div>
            <span>•</span>
            <div className="text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span>Halcones v1.0</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
