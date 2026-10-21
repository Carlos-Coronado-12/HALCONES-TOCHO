import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, PlayCategory } from '../types/playbook';
import { 
  Layers, 
  Search, 
  Plus, 
  Copy, 
  Trash2, 
  FolderLock, 
  ChevronRight, 
  ArrowLeft 
} from 'lucide-react';

interface LibraryPageProps {
  plays: Play[];
  currentPlay: Play;
  onSelectPlay: (play: Play) => void;
  onNewPlay: () => void;
  onDuplicatePlay: (play: Play) => void;
  onDeletePlay: (playId: string) => void;
  onToggleFavorite?: (playId: string) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  plays,
  currentPlay,
  onSelectPlay,
  onNewPlay,
  onDuplicatePlay,
  onDeletePlay,
}) => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'ALL' | PlayCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered plays
  const filteredPlays = useMemo(() => {
    return plays.filter((p) => {
      const matchesCategory = activeCategory === 'ALL' || p.category === activeCategory;
      const matchesSearch = searchQuery === '' || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.formationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [plays, activeCategory, searchQuery]);

  const handleOpenInBoard = (play: Play) => {
    onSelectPlay(play);
    navigate('/pizarra');
  };

  return (
    <div className="flex-1 w-full h-screen overflow-hidden bg-[#070d09] text-slate-100 flex flex-col select-none">
      {/* Top Navigation Bar */}
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-slate-950 font-black shadow-md">
              <FolderLock className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-wide uppercase">
                Casillero de Jugadas
              </h1>
              <p className="text-[10px] text-sky-400 font-mono">
                {plays.length} Jugadas registradas en el Playbook
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onNewPlay();
              navigate('/pizarra');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-md shadow-emerald-950/60 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Jugada</span>
          </button>

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

      {/* Filter and Search Ribbon */}
      <div className="px-4 py-3 bg-[#0a140e] border-b border-[#182a1d] flex flex-wrap items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5">
          {(['ALL', 'Ofensiva', 'Defensiva', 'Especiales'] as const).map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                    : 'bg-[#101b13] hover:bg-[#17281c] text-slate-300 border border-[#1e3424]'
                }`}
              >
                {cat === 'ALL' ? 'Todas' : cat}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:min-w-[260px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o formación..."
            className="w-full bg-[#070e0a] border border-[#1d3323] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
          />
        </div>
      </div>

      {/* Plays Grid Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {filteredPlays.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <FolderLock className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No se encontraron jugadas</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Intenta cambiar los filtros o crea una nueva jugada para tu casillero táctico.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {filteredPlays.map((play) => {
              const isCurrent = play.id === currentPlay.id;
              const isOffense = play.category === 'Ofensiva';

              return (
                <div
                  key={play.id}
                  className={`rounded-2xl border p-4 transition-all flex flex-col justify-between group ${
                    isCurrent
                      ? 'bg-gradient-to-b from-[#0c2417] to-[#08170e] border-emerald-500 shadow-lg shadow-emerald-950/60'
                      : 'bg-[#0b140e] hover:bg-[#0f1b13] border-[#1c3021] hover:border-sky-500/50 shadow-md'
                  }`}
                >
                  <div>
                    {/* Header: Category & Formation */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isOffense
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                      }`}>
                        {play.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {play.formationName || 'Spread'}
                      </span>
                    </div>

                    {/* Play Name */}
                    <h3 className="text-base font-extrabold text-white mb-1 group-hover:text-sky-300 transition-colors">
                      {play.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {play.description || 'Sin notas tácticas agregadas.'}
                    </p>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-[#18281d] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onDuplicatePlay(play)}
                        className="p-1.5 rounded-lg bg-[#111f15] hover:bg-[#1a2d20] text-slate-300 hover:text-white transition-all"
                        title="Duplicar jugada"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Eliminar "${play.name}" del casillero?`)) {
                            onDeletePlay(play.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-[#201014] hover:bg-[#31141c] text-rose-400/80 hover:text-rose-300 transition-all"
                        title="Eliminar jugada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenInBoard(play)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
                    >
                      <span>Abrir en Pizarra</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
