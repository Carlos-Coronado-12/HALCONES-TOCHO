import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Halcones Tocho Playbook Uncaught Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    try {
      // Clear current play / storage if corrupted
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  private handleHardReset = () => {
    try {
      localStorage.removeItem('halcones_tocho_playbook_plays');
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-[#070b08] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-black">
          <div className="max-w-md w-full bg-[#0c140f] border border-red-900/60 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-600/40 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-white uppercase font-display tracking-wide">
                Interrupción en el Tablero
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Ocurrió un error al procesar la combinación de jugada ofensiva y defensiva. Puedes recargar para restaurar la pizarra.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full bg-[#060907] border border-neutral-800 rounded-lg p-2.5 text-left text-[11px] font-mono text-red-300 max-h-24 overflow-y-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#008744] hover:bg-[#00a859] text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recargar Pizarra</span>
              </button>
              <button
                type="button"
                onClick={this.handleHardReset}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/50 text-xs font-bold transition-all"
                title="Restaura todas las jugadas a los valores iniciales de fábrica"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Fábrica</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
