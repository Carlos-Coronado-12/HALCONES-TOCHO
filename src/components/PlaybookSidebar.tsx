import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Search, 
  Trash2, 
  Copy, 
  Shield, 
  Zap, 
  Folder, 
  BookOpen,
  CheckCircle2,
  Swords,
  Edit3
} from 'lucide-react';
import { Play, PlayCategory, DefenseScheme } from '../types/playbook';

interface PlaybookSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  plays: Play[];
  currentPlayId: string;
  activeDefenseScheme?: DefenseScheme;
  onSelectPlay: (play: Play) => void;
  onSelectDefenseScheme?: (scheme: DefenseScheme) => void;
  onDeletePlay: (playId: string) => void;
  onDuplicatePlay: (play: Play) => void;
  initialCategory?: 'ALL' | PlayCategory;
}

export const PlaybookSidebar: React.FC<PlaybookSidebarProps> = ({
  isOpen,
  onClose,
  plays,
  currentPlayId,
  activeDefenseScheme,
  onSelectPlay,
  onSelectDefenseScheme,
  onDeletePlay,
  onDuplicatePlay,
  initialCategory = 'ALL',
}) => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | PlayCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Sync initialCategory when sidebar opens
  useEffect(() => {
    if (isOpen && initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [isOpen, initialCategory]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    plays.forEach((p) => p.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [plays]);

  // Filtered plays list
  const filteredPlays = useMemo(() => {
    return plays.filter((play) => {
      if (activeCategory !== 'ALL' && play.category !== activeCategory) {
        return false;
      }
      if (selectedTag && (!play.tags || !play.tags.includes(selectedTag))) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = play.name.toLowerCase().includes(query);
        const matchDesc = play.description?.toLowerCase().includes(query);
        const matchFormation = play.formationName?.toLowerCase().includes(query);
        return matchName || matchDesc || matchFormation;
      }
      return true;
    });
  }, [plays, activeCategory, selectedTag, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 transition-opacity" 
        onClick={onClose} 
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-[#0e1611] border-r border-[#26382c] h-full flex flex-col shadow-clean-lg z-10">
        {/* Header */}
        <div className="p-4 border-b border-[#26382c] flex items-center justify-between bg-[#131c16]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-tecmilenio-950 text-tecmilenio-400 border border-tecmilenio-600/40">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight uppercase">
                {activeCategory === 'Ofensiva' ? 'Ofensivas Halcones' : activeCategory === 'Defensiva' ? 'Defensivas Halcones' : 'Playbook Tecmilenio'}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {activeCategory === 'ALL' ? `${plays.length} jugadas guardadas` : `${filteredPlays.length} jugadas ${activeCategory.toLowerCase()}s`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#18241d] hover:bg-[#1f2e25] text-slate-400 hover:text-white transition-all border border-[#26382c]"
            id="btn-close-playbook"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-3 border-b border-[#26382c] flex flex-col gap-2.5 bg-[#0c120e]">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar jugada, ruta o formación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 bg-[#141e17] border border-[#26382c] rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-tecmilenio-500"
              id="search-playbook-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Tabs: Ofensiva / Defensiva / Todas */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#141e17] rounded-lg border border-[#26382c]">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`py-1 text-xs font-semibold rounded transition-all ${
                activeCategory === 'ALL'
                  ? 'bg-slate-700 text-white shadow-clean'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="tab-cat-all"
            >
              Todas ({plays.length})
            </button>
            <button
              onClick={() => setActiveCategory('Ofensiva')}
              className={`py-1 text-xs font-semibold rounded transition-all flex items-center justify-center gap-1 ${
                activeCategory === 'Ofensiva'
                  ? 'bg-tecmilenio-600 text-white shadow-clean'
                  : 'text-tecmilenio-400 hover:bg-tecmilenio-950/40'
              }`}
              id="tab-cat-offense"
            >
              <Zap className="w-3 h-3" />
              Ofensivas
            </button>
            <button
              onClick={() => setActiveCategory('Defensiva')}
              className={`py-1 text-xs font-semibold rounded transition-all flex items-center justify-center gap-1 ${
                activeCategory === 'Defensiva'
                  ? 'bg-red-600 text-white shadow-clean'
                  : 'text-red-400 hover:bg-red-950/40'
              }`}
              id="tab-cat-defense"
            >
              <Shield className="w-3 h-3" />
              Defensivas
            </button>
          </div>

          {/* Tag Pills */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 transition-all ${
                  selectedTag === null
                    ? 'bg-tecmilenio-600 text-white font-bold'
                    : 'bg-[#18241d] text-slate-400 hover:text-slate-300 border border-[#26382c]'
                }`}
              >
                Todos los tags
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 transition-all ${
                    selectedTag === tag
                      ? 'bg-tecmilenio-600 text-white font-bold'
                      : 'bg-[#18241d] text-slate-400 hover:text-slate-300 border border-[#26382c]'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Plays List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredPlays.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Folder className="w-10 h-10 mb-2 stroke-1 text-slate-600" />
              <p className="text-xs font-medium">No se encontraron jugadas</p>
            </div>
          ) : (
            filteredPlays.map((play) => {
              const isSelected = play.id === currentPlayId;
              const isOffense = play.category === 'Ofensiva';
              const isDefense = play.category === 'Defensiva';
              
              // Determine if this defensive play is the active defense scheme
              const playScheme: DefenseScheme | undefined = play.defenseScheme || (
                play.id.includes('cover2') ? 'cover2' :
                play.id.includes('cover3') ? 'cover3' :
                play.id.includes('cover4') ? 'cover4' :
                play.id.includes('blitz') ? 'blitz' :
                play.id.includes('cover1') ? 'cover1' : undefined
              );
              const isActiveDefenseScheme = isDefense && playScheme && activeDefenseScheme === playScheme;

              return (
                <div
                  key={play.id}
                  onClick={() => {
                    onSelectPlay(play);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                    isActiveDefenseScheme
                      ? 'bg-[#221014] border-red-500 shadow-clean ring-1 ring-red-500/50'
                      : isSelected
                        ? 'bg-[#18241d] border-tecmilenio-500 shadow-clean'
                        : 'bg-[#131c16] border-[#26382c] hover:bg-[#18241d] hover:border-[#344c3c]'
                  }`}
                >
                  {/* Top: Category, Formation & Active Status */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          isOffense
                            ? 'bg-tecmilenio-950 text-tecmilenio-400 border-tecmilenio-600/40'
                            : 'bg-red-950/60 text-red-400 border-red-600/40'
                        }`}
                      >
                        {play.category}
                      </span>
                      {isActiveDefenseScheme && (
                        <span className="flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-red-600 text-white animate-pulse">
                          <CheckCircle2 className="w-2.5 h-2.5" /> DEFENSA RIVAL ACTIVA
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">
                      {play.formationName || 'Personalizada'}
                    </span>
                  </div>

                  {/* Play Title */}
                  <h3 className="font-bold text-xs text-slate-100 line-clamp-1">
                    {play.name}
                  </h3>

                  {/* Description snippet */}
                  {play.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {play.description}
                    </p>
                  )}

                  {/* Tags */}
                  {play.tags && play.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {play.tags.map((t) => (
                        <span key={t} className="text-[9px] px-1.5 py-0.2 rounded bg-[#0c120e] text-slate-400 border border-[#26382c]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Defensive Quick Actions Row: Choose as Opponent in 5v5 */}
                  {isDefense && onSelectDefenseScheme && playScheme && (
                    <div className="mt-2.5 pt-2 border-t border-[#26382c] flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectDefenseScheme(playScheme);
                          onClose();
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all uppercase shadow-md ${
                          isActiveDefenseScheme
                            ? 'bg-red-600 text-white ring-2 ring-red-400/40'
                            : 'bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/60 hover:text-white'
                        }`}
                        title="Usar esta defensa como rival en la simulación 5v5"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        <span>{isActiveDefenseScheme ? '✓ Defensa Seleccionada en 5v5' : '🛡️ Usar esta Defensa (5v5)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectPlay(play);
                          onClose();
                        }}
                        className="px-2 py-1.5 rounded-lg bg-[#18241d] hover:bg-[#203026] text-slate-300 hover:text-white text-xs font-semibold border border-[#26382c] flex items-center gap-1 transition-all"
                        title="Abrir y editar jugada defensiva"
                      >
                        <Edit3 className="w-3 h-3 text-slate-400" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                    </div>
                  )}

                  {/* Bottom: Play Meta & Secondary Actions */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#26382c]/60 text-[10px] text-slate-500">
                    <span>
                      {play.players.length} jugadores • {play.routes.length} rutas {play.zones && play.zones.length > 0 ? `• ${play.zones.length} zonas` : ''}
                    </span>
                    
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onDuplicatePlay(play)}
                        className="p-1 rounded hover:bg-[#1f2e25] text-slate-400 hover:text-slate-200 transition-colors"
                        title="Duplicar jugada"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Seguro que deseas eliminar la jugada "${play.name}"?`)) {
                            onDeletePlay(play.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition-colors"
                        title="Eliminar jugada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
