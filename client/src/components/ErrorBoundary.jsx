import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught runtime component crash:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="bg-slate-800 border border-red-500/30 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Something went wrong</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                The interface encountered an unexpected error while rendering this section.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-700/60 text-left text-xs font-mono text-red-300 max-h-40 overflow-y-auto">
                <p className="font-bold">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-slate-400 mt-1.5 whitespace-pre-wrap leading-tight">
                    {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-5 py-2 bg-vu-gold hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

