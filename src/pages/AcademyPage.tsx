import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from '../types/playbook';
import { UserStudyStats } from '../types/study';
import { RouteTreeViewer } from '../components/study/RouteTreeViewer';
import { FundamentalsQuiz } from '../components/study/FundamentalsQuiz';
import { PlaybookQuiz } from '../components/study/PlaybookQuiz';
import { CoverageGuide } from '../components/study/CoverageGuide';
import { 
  ArrowLeft, 
  Layers, 
  GraduationCap, 
  BookOpen, 
  Compass, 
  Shield, 
  Flame, 
  Trophy, 
  RotateCcw,
  Sparkles 
} from 'lucide-react';

interface AcademyPageProps {
  plays: Play[];
  studyStats: UserStudyStats;
  onUpdateStudyStats: (newStats: UserStudyStats) => void;
}

type TabType = 'fundamentals' | 'route_tree' | 'coverages' | 'playbook' | 'profile';

export const AcademyPage: React.FC<AcademyPageProps> = ({
  plays,
  studyStats,
  onUpdateStudyStats,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('fundamentals');

  const totalAnswered = studyStats.totalAnswered;
  const accuracy = totalAnswered > 0 ? Math.round((studyStats.correctAnswers / totalAnswered) * 100) : 0;

  const getPlayerRank = () => {
    if (studyStats.correctAnswers >= 30) return { title: 'Capitán Táctico Halcón', color: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-500/40' };
    if (studyStats.correctAnswers >= 15) return { title: 'Veterano de Pizarra', color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-500/40' };
    if (studyStats.correctAnswers >= 5) return { title: 'Titular en Desarrollo', color: 'text-sky-400', bg: 'bg-sky-950/60 border-sky-500/40' };
    return { title: 'Novato de Flag', color: 'text-slate-300', bg: 'bg-slate-900 border-slate-700' };
  };

  const rank = getPlayerRank();

  return (
    <div className="flex-1 w-full h-screen overflow-hidden bg-[#070d09] text-slate-100 flex flex-col select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-[#080f0a]/95 backdrop-blur-xl border-b border-[#1b2b20] px-4 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#122216] hover:bg-[#1a3422] border border-emerald-500/30 text-emerald-300 font-extrabold text-xs uppercase tracking-wider transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menú Principal</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-md">
              <GraduationCap className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold text-white tracking-wide uppercase">
                  Halcones Academy
                </h1>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  IFAF 5v5
                </span>
              </div>
              <p className="text-[10px] text-amber-300/80 font-mono">
                Reglamento oficial & estudio de playbook
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Stats Pill */}
          <div className="hidden sm:flex items-center gap-3 bg-[#111f15] border border-[#203626] px-3 py-1.5 rounded-2xl text-xs">
            <div className="flex items-center gap-1.5 text-orange-400 font-extrabold">
              <Flame className="w-4 h-4 fill-orange-400" />
              <span>{studyStats.currentStreak} Racha</span>
            </div>
            <div className="w-px h-3.5 bg-slate-700" />
            <div className="text-slate-300 font-medium">
              Precisión: <strong className="text-emerald-400 font-bold">{accuracy}%</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/pizarra')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#101f16] hover:bg-[#183122] border border-[#23422d] text-slate-200 font-bold text-xs uppercase tracking-wider transition-all"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Ir a Pizarra</span>
          </button>
        </div>
      </header>

      {/* Tabs Switcher */}
      <div className="px-4 py-2 border-b border-[#142318] bg-[#09120c] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('fundamentals')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'fundamentals'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-300 hover:text-white hover:bg-[#121f16]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Reglamento IFAF & Quiz</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('route_tree')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'route_tree'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-300 hover:text-white hover:bg-[#121f16]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Árbol de Rutas 1-9</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('coverages')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'coverages'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-300 hover:text-white hover:bg-[#121f16]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Coberturas Defensivas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('playbook')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'playbook'
              ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-md font-black'
              : 'text-amber-300 hover:text-amber-200 hover:bg-[#1a1c12]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Test Playbook Halcones ({plays.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ml-auto ${
            activeTab === 'profile'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white hover:bg-[#121f16]'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Mi Nivel ({studyStats.correctAnswers} pts)</span>
        </button>
      </div>

      {/* Main Tab View Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto h-full">
          {activeTab === 'fundamentals' && (
            <FundamentalsQuiz stats={studyStats} onUpdateStats={onUpdateStudyStats} />
          )}

          {activeTab === 'route_tree' && (
            <RouteTreeViewer />
          )}

          {activeTab === 'coverages' && (
            <CoverageGuide />
          )}

          {activeTab === 'playbook' && (
            <PlaybookQuiz plays={plays} stats={studyStats} onUpdateStats={onUpdateStudyStats} />
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in duration-150">
              {/* Rank Banner */}
              <div className={`p-6 rounded-3xl border flex items-center gap-4 ${rank.bg}`}>
                <div className="w-14 h-14 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-center shrink-0">
                  <Trophy className={`w-8 h-8 ${rank.color}`} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Rango Actual de Estudio</div>
                  <h3 className={`text-xl font-black ${rank.color}`}>{rank.title}</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Has completado {studyStats.totalAnswered} retos de estudio con un {accuracy}% de respuestas correctas.
                  </p>
                </div>
              </div>

              {/* Stats Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#0b140e] border border-[#1c2e22] p-3.5 rounded-2xl text-center">
                  <div className="text-[11px] text-slate-400 font-medium">Aciertos Totales</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{studyStats.correctAnswers}</div>
                </div>

                <div className="bg-[#0b140e] border border-[#1c2e22] p-3.5 rounded-2xl text-center">
                  <div className="text-[11px] text-slate-400 font-medium">Mejor Racha</div>
                  <div className="text-2xl font-black text-orange-400 mt-1">{studyStats.bestStreak} 🔥</div>
                </div>

                <div className="bg-[#0b140e] border border-[#1c2e22] p-3.5 rounded-2xl text-center">
                  <div className="text-[11px] text-slate-400 font-medium">Tests Playbook</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">{studyStats.completedPlaybookTests}</div>
                </div>

                <div className="bg-[#0b140e] border border-[#1c2e22] p-3.5 rounded-2xl text-center">
                  <div className="text-[11px] text-slate-400 font-medium">Precisión</div>
                  <div className="text-2xl font-black text-sky-400 mt-1">{accuracy}%</div>
                </div>
              </div>

              {/* Reset Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-[#1a2c1f]">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('¿Seguro que deseas reiniciar tus estadísticas de estudio a cero?')) {
                      onUpdateStudyStats({
                        totalAnswered: 0,
                        correctAnswers: 0,
                        currentStreak: 0,
                        bestStreak: 0,
                        completedPlaybookTests: 0,
                        categoryScores: {
                          ifaf_rules: { answered: 0, correct: 0 },
                          route_tree: { answered: 0, correct: 0 },
                          coverage_defense: { answered: 0, correct: 0 },
                          playbook_halcones: { answered: 0, correct: 0 },
                        },
                      });
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs text-rose-400/80 hover:text-rose-300 transition-all font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reiniciar mis estadísticas
                </button>

                <div className="text-xs text-slate-500">
                  Guardado localmente en tu dispositivo
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
