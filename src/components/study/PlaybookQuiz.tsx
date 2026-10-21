import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Play, PlayerRole } from '../../types/playbook';
import { UserStudyStats } from '../../types/study';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  ArrowRight, 
  UserCheck, 
  Sparkles,
  Zap 
} from 'lucide-react';

interface PlaybookQuizProps {
  plays: Play[];
  stats: UserStudyStats;
  onUpdateStats: (newStats: UserStudyStats) => void;
}

interface DynamicQuestion {
  play: Play;
  role: PlayerRole;
  playerLabel: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const PlaybookQuiz: React.FC<PlaybookQuizProps> = ({ plays, stats, onUpdateStats }) => {
  const [selectedRole, setSelectedRole] = useState<'ALL' | PlayerRole>('ALL');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  // Generate dynamic questions from the active plays in Halcones Playbook
  const generatedQuestions = useMemo<DynamicQuestion[]>(() => {
    if (!plays || plays.length === 0) return [];
    const questions: DynamicQuestion[] = [];

    plays.forEach((play) => {
      // 1. Questions about WR / Center / RB routes (excluyendo QB para que no pregunte por su ruta de receptor)
      play.players.forEach((player) => {
        if (player.role !== 'QB') {
          const playerRoute = play.routes.find((r) => r.playerId === player.id);
          if (playerRoute && playerRoute.points && playerRoute.points.length >= 2) {
            // Determine general route direction/type
            const pStart = playerRoute.points[0];
            const pEnd = playerRoute.points[playerRoute.points.length - 1];
            const deltaX = pEnd.x - pStart.x;
            const deltaY = pStart.y - pEnd.y; // positive is downfield

            let routeName = 'Ruta Personalizada';
            if (deltaY > 15 && Math.abs(deltaX) < 10) routeName = 'Go / Vertical Profunda';
            else if (deltaX > 15 && deltaY > 5) routeName = 'Out / Corner hacia la derecha';
            else if (deltaX < -15 && deltaY > 5) routeName = 'Out / Corner hacia la izquierda';
            else if (Math.abs(deltaX) > 15 && deltaY < 5) routeName = 'Drag / Shallow horizontal';
            else if (deltaY < 8 && deltaY > 2) routeName = 'Hitch / Flat corta';
            else routeName = 'Corte en ángulo';

            const distractors = [
              'Slant rápido al centro de 3 pasos',
              'Poste profundo atacando al Safety',
              'Bloqueo de pase / Pantalla corta detrás de la línea',
              'Wheel route saliendo a la banda y acelerando a fondo',
              'Gancho (Curl) a 6 yardas regresando al QB'
            ].filter((d) => d !== routeName);

            const shuffledOptions = [routeName, distractors[0], distractors[1], distractors[2]]
              .sort(() => Math.random() - 0.5);

            questions.push({
              play,
              role: player.role,
              playerLabel: player.label || player.role,
              question: `En la jugada ofensiva "${play.name}" (${play.formationName}), ¿cuál es la trayectoria de ${player.label || player.role}?`,
              options: shuffledOptions,
              correctIndex: shuffledOptions.indexOf(routeName),
              explanation: `En esta jugada, el jugador ${player.label || player.role} tiene como asignación ejecutar: ${routeName}. Mantén la sincronía con el QB al momento del quiebre.`,
            });
          }
        }

        // 2. Questions about QB reads
        if (player.role === 'QB') {
          // Find primary read
          const firstReadPlayer = play.players.find((p) => p.readProgression === 1);
          if (firstReadPlayer) {
            const options = [
              `Receptor ${firstReadPlayer.label} (1ª Lectura / Primary)`,
              `Centro C en ruta de escape (Checkdown)`,
              `Receptor opuesto profundo`,
              `Lanzar balón fuera para evitar el sack`
            ].sort(() => Math.random() - 0.5);

            questions.push({
              play,
              role: 'QB',
              playerLabel: 'QB',
              question: `Como Quarterback en "${play.name}", ¿quién es tu PRIMERA LECTURA (Primary Read) según el diseño táctico?`,
              options,
              correctIndex: options.findIndex((o) => o.includes(firstReadPlayer.label)),
              explanation: `Tu primera opción marcada en la pizarra es ${firstReadPlayer.label}. Si la cobertura lo cierra, debes pasar a tu segunda progresión inmediatamente antes de los 2.0 segundos.`,
            });
          }
        }
      });
    });

    // If no questions could be dynamically derived, provide fallback playbook challenges
    if (questions.length === 0) {
      questions.push({
        play: plays[0],
        role: 'QB',
        playerLabel: 'QB',
        question: `En la formación Spread 2x2 de Halcones, ¿cuál es el espaciado correcto de los receptores exteriores X y Z?`,
        options: [
          'Pegados al Centro a 2 yardas',
          'Abiertos a los números cerca de la línea lateral para estirar la defensa',
          'En el backfield detrás del QB',
          'Uno detrás del otro en fila india'
        ],
        correctIndex: 1,
        explanation: 'Los receptores exteriores X y Z deben abrirse hacia las bandas para obligar a los defensivos a separarse y generar ventanas en el centro.',
      });
    }

    return questions;
  }, [plays]);

  // Filter questions by selected role
  const filteredQuestions = useMemo(() => {
    if (selectedRole === 'ALL') return generatedQuestions;
    return generatedQuestions.filter((q) => q.role === selectedRole);
  }, [generatedQuestions, selectedRole]);

  const currentQ = filteredQuestions[currentIndex] || filteredQuestions[0];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQ.correctIndex;
    const newStreak = isCorrect ? stats.currentStreak + 1 : 0;
    const newBestStreak = Math.max(stats.bestStreak, newStreak);

    const prevScore = stats.categoryScores['playbook_halcones'] || { answered: 0, correct: 0 };

    onUpdateStats({
      ...stats,
      totalAnswered: stats.totalAnswered + 1,
      correctAnswers: stats.correctAnswers + (isCorrect ? 1 : 0),
      currentStreak: newStreak,
      bestStreak: newBestStreak,
      completedPlaybookTests: stats.completedPlaybookTests + 1,
      categoryScores: {
        ...stats.categoryScores,
        playbook_halcones: {
          answered: prevScore.answered + 1,
          correct: prevScore.correct + (isCorrect ? 1 : 0),
        },
      },
    });

    // Auto-advance to next question
    if (autoAdvance) {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = setTimeout(() => {
        handleNext();
      }, isCorrect ? 1500 : 3000);
    }
  };

  const handleNext = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
    setSelectedOption(null);
    setIsAnswered(false);
    setShowHint(false);
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto h-full">
      {/* Role Picker Bar */}
      <div className="bg-[#0b140e] border border-[#1b2b20] p-3 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-300 font-bold flex items-center gap-1 mr-1">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            Evaluar Posición:
          </span>
          {(['ALL', 'QB', 'WR1', 'WR2', 'WR3', 'C', 'RB'] as const).map((r) => {
            const isSelected = selectedRole === r;
            const label = r === 'ALL' ? 'Todos' : r === 'WR1' ? 'WR (X)' : r === 'WR2' ? 'Slot (H)' : r === 'WR3' ? 'WR (Z)' : r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setSelectedRole(r as any);
                  setCurrentIndex(0);
                  setIsAnswered(false);
                  setSelectedOption(null);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'bg-[#121f16] hover:bg-[#1a2d20] text-slate-300 border border-[#223828]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-advance toggle */}
          <button
            type="button"
            onClick={() => {
              if (autoAdvance && autoAdvanceTimerRef.current) {
                clearTimeout(autoAdvanceTimerRef.current);
                autoAdvanceTimerRef.current = null;
              }
              setAutoAdvance(!autoAdvance);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              autoAdvance 
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                : 'bg-[#121c15] text-slate-400 border border-[#1b2b20]'
            }`}
            title="Avanzar automáticamente a la siguiente pregunta tras responder"
          >
            <Zap className={`w-3.5 h-3.5 ${autoAdvance ? 'text-emerald-400 fill-emerald-400' : 'text-slate-500'}`} />
            <span>Auto: {autoAdvance ? 'ON' : 'OFF'}</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-emerald-300 font-mono bg-[#111f15] px-3 py-1 rounded-xl border border-[#213a27]">
            <span>Reto {currentIndex + 1} de {filteredQuestions.length || 1}</span>
          </div>
        </div>
      </div>

      {/* Main Challenge Card in 2-Column Responsive Layout */}
      <div className="bg-[#0b140e] border border-[#1d2f22] rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left Column: Play Banner & Tactical Canvas Snapshot */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1a2c1f]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black uppercase">
                  {currentQ.play.category}
                </span>
                <h4 className="text-sm font-extrabold text-white truncate max-w-[200px]">
                  {currentQ.play.name}
                </h4>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                <strong className="text-emerald-300">{currentQ.play.formationName || 'Spread'}</strong>
              </div>
            </div>

            {/* Tactical Canvas Snapshot Preview */}
            <div className="w-full bg-[#070d09] border border-[#1b2d20] rounded-2xl p-2.5 flex items-center justify-center shadow-inner">
              <div className="w-full aspect-[4/3] max-h-[220px] relative rounded-xl border border-emerald-500/20 overflow-hidden">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full select-none"
                  style={{ background: 'radial-gradient(ellipse at center, #132f1d 0%, #08160d 100%)' }}
                >
                  {/* LOS */}
                  <line x1="5" y1="78" x2="95" y2="78" stroke="#00a859" strokeWidth="1.2" />
                  <text x="7" y="76" fill="#00bf65" fontSize="3" fontWeight="bold">LOS</text>

                  {/* Draw Routes of the Play */}
                  {currentQ.play.routes.map((route, rIdx) => {
                    if (!route.points || route.points.length < 2) return null;
                    const pathStr = route.points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                    const isTargetPlayer = route.playerId.toLowerCase().includes(currentQ.role.toLowerCase());
                    return (
                      <path
                        key={rIdx}
                        d={pathStr}
                        fill="none"
                        stroke={isTargetPlayer ? '#facc15' : 'rgba(52, 211, 153, 0.4)'}
                        strokeWidth={isTargetPlayer ? '2.8' : '1.2'}
                        strokeDasharray={isTargetPlayer ? undefined : '2,2'}
                      />
                    );
                  })}

                  {/* Draw Players of the Play */}
                  {currentQ.play.players.map((p) => {
                    const isTarget = p.role === currentQ.role;
                    return (
                      <g key={p.id} transform={`translate(${p.x}, ${p.y})`}>
                        <circle
                          r={isTarget ? '4.8' : '3.6'}
                          fill={isTarget ? '#facc15' : (p.color || '#38bdf8')}
                          stroke="#ffffff"
                          strokeWidth={isTarget ? '1.5' : '0.8'}
                        />
                        <text
                          x="0"
                          y="1.2"
                          fill="#000000"
                          fontSize={isTarget ? '3' : '2.4'}
                          fontWeight="900"
                          textAnchor="middle"
                        >
                          {p.label || p.role}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Target Role & Hint Pill */}
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                Jugador: {currentQ.playerLabel}
              </span>

              {!isAnswered ? (
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-1 text-xs text-amber-300/90 hover:text-amber-200 transition-all font-semibold"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showHint ? 'Ocultar Pista' : 'Ver Pista'}</span>
                </button>
              ) : null}
            </div>

            {showHint && !isAnswered && (
              <div className="p-2.5 rounded-xl bg-[#15241a] border border-[#233a2a] text-[11px] text-amber-200 leading-snug animate-in fade-in duration-150">
                Observa el círculo y la línea <strong>amarilla</strong> en la pizarra para deducir la dirección del corte o la lectura.
              </div>
            )}
          </div>

          {/* Right Column: Prompt Question, Options A/B/C/D & Feedback */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full">
            <div>
              {/* Question Title */}
              <h3 className="text-sm sm:text-base font-bold text-white mb-3 leading-snug">
                {currentQ.question}
              </h3>

              {/* Multiple Choice Options List */}
              <div className="space-y-2 mb-3">
                {currentQ.options.map((opt, idx) => {
                  const isChosen = selectedOption === idx;
                  const isCorrect = idx === currentQ.correctIndex;
                  let style = 'bg-[#101b14] hover:bg-[#15251b] border-[#1f3325] text-slate-200';

                  if (isAnswered) {
                    if (isCorrect) {
                      style = 'bg-emerald-950/80 border-emerald-400 text-emerald-200 font-bold';
                    } else if (isChosen && !isCorrect) {
                      style = 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold';
                    } else {
                      style = 'bg-[#0d1610] opacity-50 border-[#18271d] text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(idx)}
                      disabled={isAnswered}
                      className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${style}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                          isAnswered && isCorrect
                            ? 'bg-emerald-500 text-slate-950'
                            : isAnswered && isChosen
                            ? 'bg-rose-500 text-white'
                            : 'bg-[#18281d] text-slate-300'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-xs sm:text-sm leading-tight">
                          {opt}
                        </span>
                      </div>

                      {isAnswered && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {isAnswered && isChosen && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Explanation */}
              {isAnswered && (
                <div className={`p-3 rounded-xl border mb-3 animate-in fade-in duration-150 ${
                  selectedOption === currentQ.correctIndex
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-100'
                    : 'bg-rose-950/50 border-rose-500/40 text-rose-100'
                }`}>
                  <div className="flex items-center justify-between gap-1.5 mb-1 text-xs font-extrabold">
                    <div className="flex items-center gap-1.5">
                      {selectedOption === currentQ.correctIndex ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>¡Correcto! Buena memoria táctica.</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Fundamento táctico:</span>
                        </>
                      )}
                    </div>
                    {autoAdvance && (
                      <span className="text-[10px] text-emerald-300 font-mono animate-pulse">
                        Avanzando...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 leading-snug mb-2.5">
                    {currentQ.explanation}
                  </p>

                  {/* Direct Action Button right inside feedback */}
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all"
                  >
                    <span>{currentIndex < filteredQuestions.length - 1 ? 'Siguiente Pregunta' : 'Finalizar Ronda'}</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              )}
            </div>

            {/* Footer Next Button */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1a2c1f]">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>Playbook de Halcones</span>
              </div>

              {isAnswered && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/80 transition-all active:scale-95"
                >
                  <span>Siguiente Jugada</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

