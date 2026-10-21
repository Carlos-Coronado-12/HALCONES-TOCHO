import React, { useState, useMemo } from 'react';
import { StudyCategory, UserStudyStats } from '../../types/study';
import { IFAF_QUIZ_QUESTIONS } from '../../constants/fundamentalsData';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Flame, 
  Filter,
  Sparkles
} from 'lucide-react';

interface FundamentalsQuizProps {
  stats: UserStudyStats;
  onUpdateStats: (newStats: UserStudyStats) => void;
}

export const FundamentalsQuiz: React.FC<FundamentalsQuizProps> = ({ stats, onUpdateStats }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | StudyCategory>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // Filter questions based on category
  const filteredQuestions = useMemo(() => {
    if (selectedCategory === 'all') return IFAF_QUIZ_QUESTIONS;
    return IFAF_QUIZ_QUESTIONS.filter((q) => q.category === selectedCategory);
  }, [selectedCategory]);

  const currentQ = filteredQuestions[currentIndex] || filteredQuestions[0];

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Loop or restart
      setCurrentIndex(0);
    }
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQ.correctIndex;
    const newStreak = isCorrect ? stats.currentStreak + 1 : 0;
    const newBestStreak = Math.max(stats.bestStreak, newStreak);

    // Update session score
    setQuizScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    // Update global persistent stats
    const cat = currentQ.category;
    const prevCatScore = stats.categoryScores[cat] || { answered: 0, correct: 0 };

    const updatedStats: UserStudyStats = {
      ...stats,
      totalAnswered: stats.totalAnswered + 1,
      correctAnswers: stats.correctAnswers + (isCorrect ? 1 : 0),
      currentStreak: newStreak,
      bestStreak: newBestStreak,
      categoryScores: {
        ...stats.categoryScores,
        [cat]: {
          answered: prevCatScore.answered + 1,
          correct: prevCatScore.correct + (isCorrect ? 1 : 0),
        },
      },
    };

    onUpdateStats(updatedStats);

    if (isCorrect && newStreak > 0 && newStreak % 5 === 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2500);
    }
  };

  const handleResetQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setQuizScore({ correct: 0, total: 0 });
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'basico':
        return 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30';
      case 'intermedio':
        return 'bg-amber-950/70 text-amber-400 border-amber-500/30';
      case 'avanzado':
        return 'bg-rose-950/70 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
      {/* Top Filter and Streaks Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a120c] border border-[#1b2b20] p-3 rounded-2xl shadow-lg">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 font-bold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            Tema:
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setCurrentIndex(0);
              setIsAnswered(false);
              setSelectedOption(null);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                : 'bg-[#121f16] hover:bg-[#1a2d20] text-slate-300 border border-[#223828]'
            }`}
          >
            Todos ({IFAF_QUIZ_QUESTIONS.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ifaf_rules');
              setCurrentIndex(0);
              setIsAnswered(false);
              setSelectedOption(null);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === 'ifaf_rules'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                : 'bg-[#121f16] hover:bg-[#1a2d20] text-slate-300 border border-[#223828]'
            }`}
          >
            Reglas IFAF
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('route_tree');
              setCurrentIndex(0);
              setIsAnswered(false);
              setSelectedOption(null);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === 'route_tree'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                : 'bg-[#121f16] hover:bg-[#1a2d20] text-slate-300 border border-[#223828]'
            }`}
          >
            Árbol de Rutas
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('coverage_defense');
              setCurrentIndex(0);
              setIsAnswered(false);
              setSelectedOption(null);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === 'coverage_defense'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                : 'bg-[#121f16] hover:bg-[#1a2d20] text-slate-300 border border-[#223828]'
            }`}
          >
            Coberturas & Sacks
          </button>
        </div>

        {/* Streaks & Accuracy Counter */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-950/50 border border-orange-500/40 text-orange-300 font-extrabold text-xs">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
            <span>Racha: {stats.currentStreak}</span>
            {stats.bestStreak > 0 && (
              <span className="text-[10px] text-orange-200/70 font-normal">
                (Récord: {stats.bestStreak})
              </span>
            )}
          </div>

          <div className="text-xs text-slate-300 font-mono bg-[#111f15] px-2.5 py-1 rounded-xl border border-[#213a27]">
            {currentIndex + 1}/{filteredQuestions.length}
            {quizScore.total > 0 && (
              <span className="text-emerald-400 font-bold ml-1.5">
                ({quizScore.correct}/{quizScore.total})
              </span>
            )}
          </div>
        </div>
      </div>

      {showCelebration && (
        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-2xl bg-gradient-to-r from-orange-500/20 via-amber-500/30 to-orange-500/20 border border-orange-500/40 text-orange-200 text-xs font-black uppercase tracking-wider animate-bounce shadow-lg">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>¡Racha en Fuego de {stats.currentStreak} Aciertos Seguidos!</span>
          <Sparkles className="w-4 h-4 text-yellow-300" />
        </div>
      )}

      {/* Main Question Card */}
      <div className="bg-[#0b140e] border border-[#1d2f22] rounded-3xl p-5 sm:p-7 shadow-2xl relative flex flex-col justify-between">
        {/* Category & Difficulty Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              {currentQ.category === 'ifaf_rules'
                ? 'Reglamento IFAF 5v5'
                : currentQ.category === 'route_tree'
                ? 'Técnica de Rutas'
                : 'Lectura Defensiva'}
            </span>
            <span className={`text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${getDifficultyBadge(currentQ.difficulty)}`}>
              {currentQ.difficulty}
            </span>
          </div>

          {currentQ.ruleRef && (
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Ref: {currentQ.ruleRef}
            </span>
          )}
        </div>

        {/* The Question Text */}
        <h3 className="text-base sm:text-lg font-bold text-white mb-4 leading-snug">
          {currentQ.question}
        </h3>

        {/* Visual Route Diagram when routePoints are defined */}
        {currentQ.routePoints && currentQ.routePoints.length >= 2 && (
          <div className="mb-6 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full max-w-[360px] aspect-[4/3] rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-[#09180e] to-[#040a06] p-2 relative shadow-xl overflow-hidden group">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full select-none"
              >
                <defs>
                  <pattern id="quizFieldGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                  </pattern>
                  <marker id="quizArrowHead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
                  </marker>
                  <filter id="quizGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#34d399" floodOpacity="0.9" />
                  </filter>
                </defs>

                {/* Grass Grid */}
                <rect width="100" height="100" fill="url(#quizFieldGrid)" />

                {/* Sidelines & Boundaries */}
                <rect x="5" y="5" width="90" height="90" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" rx="2" />

                {/* Yard lines */}
                <line x1="5" y1="20" x2="95" y2="20" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" strokeDasharray="1,1" />
                <text x="7" y="19" fill="rgba(255,255,255,0.3)" fontSize="3" fontWeight="bold">15 YDS (PROFUNDO)</text>

                <line x1="5" y1="45" x2="95" y2="45" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" strokeDasharray="1,1" />
                <text x="7" y="44" fill="rgba(255,255,255,0.3)" fontSize="3" fontWeight="bold">10 YDS (INTERMEDIO)</text>

                <line x1="5" y1="65" x2="95" y2="65" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" strokeDasharray="1,1" />
                <text x="7" y="64" fill="rgba(255,255,255,0.3)" fontSize="3" fontWeight="bold">5 YDS (CORTO)</text>

                {/* Line of Scrimmage (LOS) */}
                <line x1="5" y1="80" x2="95" y2="80" stroke="#00a859" strokeWidth="1.2" />
                <text x="7" y="79" fill="#00bf65" fontSize="3.2" fontWeight="black">L.O.S. (LÍNEA DE GOLPEO)</text>

                {/* Sidelines indications */}
                <text x="96" y="50" fill="rgba(255,255,255,0.25)" fontSize="2.8" transform="rotate(90 96,50)" textAnchor="middle">
                  BANDA LATERAL (OUTSIDE)
                </text>
                <text x="4" y="50" fill="rgba(255,255,255,0.25)" fontSize="2.8" transform="rotate(-90 4,50)" textAnchor="middle">
                  CENTRO DEL CAMPO (INSIDE)
                </text>

                {/* The Drawn Route Path */}
                <path
                  d={currentQ.routePoints.reduce((acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  markerEnd="url(#quizArrowHead)"
                  filter="url(#quizGlow)"
                />

                {/* Starting Player Circle */}
                <circle cx={currentQ.routePoints[0].x} cy={currentQ.routePoints[0].y} r="3.2" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
                <text x={currentQ.routePoints[0].x} y={currentQ.routePoints[0].y + 5.5} fill="#94a3b8" fontSize="2.8" textAnchor="middle" fontWeight="black">
                  WR
                </text>
              </svg>

              <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-[10px] font-mono font-black text-emerald-300 shadow-md">
                Diagrama de Ruta
              </div>
            </div>
          </div>
        )}

        {/* Options Grid */}
        <div className="space-y-3 mb-6">
          {currentQ.options.map((opt, idx) => {
            const isChosen = selectedOption === idx;
            const isCorrect = idx === currentQ.correctIndex;
            let btnStyle = 'bg-[#101b14] hover:bg-[#15251b] border-[#1f3325] text-slate-200';

            if (isAnswered) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-950/60 font-bold';
              } else if (isChosen && !isCorrect) {
                btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-lg font-bold';
              } else {
                btnStyle = 'bg-[#0d1610] opacity-50 border-[#18271d] text-slate-400';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${btnStyle}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    isAnswered && isCorrect
                      ? 'bg-emerald-500 text-slate-950'
                      : isAnswered && isChosen
                      ? 'bg-rose-500 text-white'
                      : 'bg-[#18281d] text-slate-300'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-xs sm:text-sm leading-relaxed">
                    {opt}
                  </span>
                </div>

                {isAnswered && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                {isAnswered && isChosen && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback / Pedagogical Explanation Box */}
        {isAnswered && (
          <div className={`p-4 sm:p-5 rounded-2xl border mb-5 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            selectedOption === currentQ.correctIndex
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-100'
              : 'bg-rose-950/60 border-rose-500/50 text-rose-100'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-2 font-black text-sm sm:text-base">
              <div className="flex items-center gap-2">
                {selectedOption === currentQ.correctIndex ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>¡Correcto! Excelente lectura de juego.</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <span>Respuesta Incorrecta. Fíjate en el fundamento:</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4">
              {currentQ.explanation}
            </p>

            {/* Direct Prominent Action Button inside Feedback */}
            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/80 active:scale-[0.98] transition-all"
            >
              <span>{currentIndex < filteredQuestions.length - 1 ? 'Siguiente Pregunta' : 'Finalizar Ronda'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}

        {/* Action Controls (Next Question / Reset) */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1a2c1f]">
          <button
            type="button"
            onClick={handleResetQuiz}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-all font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar Quiz
          </button>

          {isAnswered ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/80 transition-all active:scale-95"
            >
              <span>{currentIndex < filteredQuestions.length - 1 ? 'Siguiente Pregunta' : 'Finalizar Ronda'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-xs text-slate-500 italic">
              Selecciona una opción para validar tu conocimiento
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
