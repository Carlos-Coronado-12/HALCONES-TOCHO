import React, { useState, useEffect } from 'react';
import { X, Save, Shield, Zap, Sparkles, Check } from 'lucide-react';
import { Play, PlayCategory, PlayTag } from '../types/playbook';

interface PlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  play: Play;
  onSave: (updatedData: Partial<Play>) => void;
  targetCategory?: PlayCategory | null;
}

const AVAILABLE_TAGS: PlayTag[] = [
  'Zona Roja',
  '3ra & Largo',
  'Pase Rápido',
  'Pase Profundo',
  'RPO / Corrida',
  'Trick Play',
  'Anti-Blitz',
  'Cover 2',
  'Cover 1',
  'Cover 0 (Blitz)',
  'Extra Point (1pt)',
  'Extra Point (2pts)',
  '5v5',
  '7v7'
];

export const PlayModal: React.FC<PlayModalProps> = ({
  isOpen,
  onClose,
  play,
  onSave,
  targetCategory,
}) => {
  const [name, setName] = useState(play.name);
  const [category, setCategory] = useState<PlayCategory>(targetCategory || play.category);
  const [formationName, setFormationName] = useState(play.formationName || 'Spread 2x2');
  const [description, setDescription] = useState(play.description || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(play.tags || []);

  useEffect(() => {
    if (isOpen) {
      const cat = targetCategory || play.category;
      setCategory(cat);
      if (targetCategory === 'Defensiva' && play.category !== 'Defensiva') {
        setName(play.defenseName || (play.defenseScheme ? `Defensa ${play.defenseScheme.toUpperCase()}` : 'Esquema Defensivo Personalizado'));
        setFormationName(play.defenseFormationName || 'Defensa 2-3 Zona');
      } else if (targetCategory === 'Ofensiva' && play.category !== 'Ofensiva') {
        setName(play.offenseName || (play.name.includes('Defensa') ? 'Jugada Ofensiva Halcones' : play.name));
        setFormationName(play.formationName || 'Spread 2x2');
      } else {
        if (cat === 'Defensiva' && play.defenseName) {
          setName(play.defenseName);
          setFormationName(play.defenseFormationName || 'Defensa 2-3 Zona');
        } else if (cat === 'Ofensiva' && play.offenseName) {
          setName(play.offenseName);
          setFormationName(play.formationName || 'Spread 2x2');
        } else {
          setName(play.name);
          setFormationName(play.formationName || (cat === 'Defensiva' ? 'Defensa 2-3 Zona' : 'Spread 2x2'));
        }
      }
      setDescription(play.description || '');
      setSelectedTags(play.tags || []);
    }
  }, [isOpen, play, targetCategory]);

  if (!isOpen) return null;

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      category,
      formationName: formationName.trim(),
      description: description.trim(),
      tags: selectedTags,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-[#0e1611] border border-[#26382c] rounded-xl shadow-clean-lg overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#26382c] flex items-center justify-between bg-[#131c16]">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border ${
              category === 'Ofensiva'
                ? 'bg-tecmilenio-950 text-tecmilenio-400 border-tecmilenio-600/40'
                : category === 'Defensiva'
                  ? 'bg-red-950 text-red-400 border-red-600/40'
                  : 'bg-amber-950 text-amber-400 border-amber-600/40'
            }`}>
              {category === 'Ofensiva' ? (
                <Zap className="w-4 h-4" />
              ) : category === 'Defensiva' ? (
                <Shield className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight uppercase">
                {category === 'Ofensiva'
                  ? 'Guardar Ofensiva'
                  : category === 'Defensiva'
                    ? 'Guardar Defensiva'
                    : 'Guardar Jugada'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {category === 'Ofensiva'
                  ? 'Guarda jugadores ofensivos, rutas y pase QB'
                  : category === 'Defensiva'
                    ? 'Guarda posiciones defensivas, asignaciones y zonas'
                    : 'Personaliza asignaciones y clasificación'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#18241d] hover:bg-[#1f2e25] text-slate-400 hover:text-white transition-all border border-[#26382c]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {/* Play Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Nombre de la Jugada *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Slant & Go Shot"
              className="w-full px-3 py-2 bg-[#141e17] border border-[#26382c] rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-tecmilenio-500"
              id="input-play-name"
            />
          </div>

          {/* Category Toggle */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Clasificación Táctica *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('Ofensiva')}
                className={`py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  category === 'Ofensiva'
                    ? 'bg-tecmilenio-600 border-tecmilenio-500 text-white shadow-clean'
                    : 'bg-[#141e17] border-[#26382c] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Ofensiva
              </button>
              <button
                type="button"
                onClick={() => setCategory('Defensiva')}
                className={`py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  category === 'Defensiva'
                    ? 'bg-red-600 border-red-500 text-white shadow-clean'
                    : 'bg-[#141e17] border-[#26382c] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Defensiva
              </button>
              <button
                type="button"
                onClick={() => setCategory('Especiales')}
                className={`py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  category === 'Especiales'
                    ? 'bg-amber-600 border-amber-500 text-white shadow-clean'
                    : 'bg-[#141e17] border-[#26382c] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Especiales
              </button>
            </div>
          </div>

          {/* Formation Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Nombre de Formación
            </label>
            <input
              type="text"
              value={formationName}
              onChange={(e) => setFormationName(e.target.value)}
              placeholder="Ej. Spread 2x2, Trips Derecho..."
              className="w-full px-3 py-2 bg-[#141e17] border border-[#26382c] rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-tecmilenio-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Instrucciones y Asignaciones Tácticas
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. 1era Lectura: Receptor X en trayectoria Slant. Balón de descarga al Centro..."
              className="w-full px-3 py-2 bg-[#141e17] border border-[#26382c] rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-tecmilenio-500 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Etiquetas
            </label>
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1.5 bg-[#0c120e] rounded-lg border border-[#26382c]">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-tecmilenio-600 text-white font-bold'
                        : 'bg-[#18241d] text-slate-400 hover:text-slate-200 border border-[#26382c]'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#26382c]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-[#18241d] hover:bg-[#1f2e25] text-slate-300 text-xs font-medium border border-[#26382c] transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-tecmilenio-600 hover:bg-tecmilenio-500 text-white text-xs font-bold transition-all shadow-clean flex items-center gap-1.5"
              id="btn-confirm-save-modal"
            >
              <Save className="w-3.5 h-3.5" />
              Guardar Jugada
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
