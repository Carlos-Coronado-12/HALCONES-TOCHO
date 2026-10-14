import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  FileJson, 
  Check, 
  RotateCcw, 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  AlertCircle,
  CheckCircle2,
  Zap,
  Shield
} from 'lucide-react';
import { Play } from '../types/playbook';
import { exportPlaybookToJson, exportPlaysByCategory, importPlaybookFromJson } from '../utils/storage';
import { isFirebaseConfigured } from '../services/firebase';
import { uploadAllPlaysToCloud, fetchPlaysFromCloud } from '../services/cloudPlaybook';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  plays: Play[];
  onImportPlays: (updatedPlays: Play[]) => void;
  onResetToDefaults: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  plays,
  onImportPlays,
  onResetToDefaults,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const hasFirebase = isFirebaseConfigured();

  const handleExport = () => {
    exportPlaybookToJson(plays);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const updated = importPlaybookFromJson(text, plays);
        onImportPlays(updated);
        setStatusMessage('¡Playbook importado exitosamente desde archivo!');
        setTimeout(() => setStatusMessage(null), 3500);
      } catch (err) {
        alert('Error al leer el archivo JSON. Verifica que sea un archivo válido de Halcones Playbook.');
      }
    };
    reader.readAsText(file);
  };

  const handleUploadToFirebase = async () => {
    if (!hasFirebase) return;
    setIsCloudLoading(true);
    try {
      const count = await uploadAllPlaysToCloud(plays);
      setStatusMessage(`¡${count} jugadas sincronizadas en Cloud Firestore con éxito!`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      alert('Error al subir a Firebase. Revisa las reglas de seguridad de Firestore.');
    } finally {
      setIsCloudLoading(false);
    }
  };

  const handleDownloadFromFirebase = async () => {
    if (!hasFirebase) return;
    setIsCloudLoading(true);
    try {
      const cloudPlays = await fetchPlaysFromCloud();
      if (cloudPlays && cloudPlays.length > 0) {
        onImportPlays(cloudPlays);
        setStatusMessage(`¡${cloudPlays.length} jugadas descargadas y sincronizadas desde la nube!`);
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        alert('No se encontraron jugadas en la colección de Firestore.');
      }
    } catch (err) {
      alert('Error al descargar de Firebase.');
    } finally {
      setIsCloudLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-[#090f0c] border border-[#203426] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#1b2b20] flex items-center justify-between bg-[#0e1711]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-600/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight uppercase font-display">
                Nube & Respaldo Táctico
              </h2>
              <p className="text-[11px] text-neutral-400">
                Sincronización en tiempo real y respaldo de jugadas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#142017] hover:bg-[#1b2c1f] text-neutral-400 hover:text-white transition-all border border-[#203426]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-4 space-y-3 max-h-[80vh] overflow-y-auto">
          {statusMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* 1. Firebase Cloud Section */}
          <div className="p-3.5 rounded-xl bg-[#0f1912] border border-[#1e3023] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-xs text-white uppercase tracking-wide">
                  Google Firebase (Firestore)
                </h4>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  hasFirebase
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-950/80 text-amber-300 border-amber-600/40'
                }`}
              >
                {hasFirebase ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Conectado</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    <span>Configuración pendiente</span>
                  </>
                )}
              </span>
            </div>

            {hasFirebase ? (
              <div>
                <p className="text-[11px] text-neutral-300 mb-2.5">
                  Tus jugadas se sincronizan automáticamente en la nube. Puedes subir tu colección completa o descargarla en cualquier momento.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleUploadToFirebase}
                    disabled={isCloudLoading}
                    className="py-2 px-2.5 rounded-xl bg-[#008744] hover:bg-[#00a859] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>{isCloudLoading ? 'Subiendo...' : 'Subir a la Nube'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadFromFirebase}
                    disabled={isCloudLoading}
                    className="py-2 px-2.5 rounded-xl bg-[#142217] hover:bg-[#1b2f20] disabled:opacity-50 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CloudDownload className="w-4 h-4" />
                    <span>{isCloudLoading ? 'Descargando...' : 'Bajar de la Nube'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-[#090f0c] border border-amber-800/30 text-[11px] text-neutral-300 space-y-1">
                <p className="font-semibold text-amber-300">
                  ¿Cómo conectar tu proyecto de Firebase?
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-neutral-400 text-[10px]">
                  <li>Ve a <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline">console.firebase.google.com</a> y abre tu proyecto.</li>
                  <li>En Configuración (⚙️) $\to$ Apps $\to$ Web (`&lt;/&gt;`), copia tus credenciales.</li>
                  <li>Pégalas en el archivo <span className="font-mono text-emerald-300">.env.local</span> que creamos en tu proyecto.</li>
                </ol>
              </div>
            )}
          </div>

          {/* 2. File Backup (.JSON) */}
          <div className="p-3.5 rounded-xl bg-[#0f1912] border border-[#1e3023] space-y-2">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-sky-400" />
              <h4 className="font-bold text-xs text-white uppercase tracking-wide">
                Archivo Local (.JSON)
              </h4>
            </div>
            <p className="text-[11px] text-neutral-400">
              Descarga un archivo con tus {plays.length} jugadas para guardarlo en tu computadora o compartirlo manualmente por WhatsApp/Drive.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="py-1.5 px-2 rounded-xl bg-[#142217] hover:bg-[#1c3021] text-white border border-[#233829] font-bold text-xs flex items-center justify-center gap-1 transition-all"
                  title="Exportar todas las jugadas"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Todas ({plays.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportPlaysByCategory(plays, 'Ofensiva')}
                  className="py-1.5 px-2 rounded-xl bg-[#0d2315] hover:bg-[#153822] text-emerald-300 border border-emerald-600/40 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                  title="Exportar sólo jugadas ofensivas"
                >
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Ofensivas</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportPlaysByCategory(plays, 'Defensiva')}
                  className="py-1.5 px-2 rounded-xl bg-[#230d11] hover:bg-[#38151b] text-red-300 border border-red-600/40 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                  title="Exportar sólo jugadas defensivas"
                >
                  <Shield className="w-3.5 h-3.5 text-red-400" />
                  <span>Defensivas</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-1.5 px-3 rounded-xl bg-[#142217] hover:bg-[#1c3021] text-white border border-[#233829] font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Importar Archivo JSON</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Reset Defaults */}
          <div className="p-3 rounded-xl bg-red-950/20 border border-red-800/30 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs text-red-300">Restaurar Jugadas Base</h4>
              <p className="text-[10px] text-red-200/60 mt-0.5">
                Recupera las jugadas predeterminadas de Halcones Tecmilenio.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Deseas restaurar las jugadas base de Halcones?')) {
                  onResetToDefaults();
                  onClose();
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#141d17] hover:bg-red-950/40 text-red-400 border border-red-800/40 font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ml-3"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
