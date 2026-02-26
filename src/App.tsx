import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Graph3D } from './components/Graph3D';
import { Graph3DData, GASResponse } from './types';
import { fetchDataFromGAS } from './services/dataService';
import { Brain, Layers, Info, Play, RefreshCw, Github, AlertCircle, Database, ExternalLink } from 'lucide-react';

export default function App() {
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('sheetId') || import.meta.env.VITE_SPREADSHEET_ID || '1Ek2NEW8gJzwQ_Z3RoP3bDHRKQpgPtqya3MjG8xEW_n8';
  });

  const [data, setData] = useState<Graph3DData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!spreadsheetId) return;
    
    setLoading(true);
    setError(null);
    
    const response: GASResponse = await fetchDataFromGAS(spreadsheetId);
    
    if (response.status === 'success' && response.data) {
      setData(response.data);
    } else {
      setError(response.message || 'Failed to fetch data from Google Spreadsheet.');
    }
    setLoading(false);
  }, [spreadsheetId]);

  useEffect(() => {
    if (spreadsheetId) {
      loadData();
    }
  }, [loadData, spreadsheetId]);

  const handleSheetIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpreadsheetId(e.target.value);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFC] text-zinc-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Brain size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">AIML4Me 3D</h1>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">3D Matrix Visualization</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/prasadbhawalkar/AIML4Me" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <Github size={20} />
            </a>
            <button 
              onClick={loadData}
              disabled={loading || !spreadsheetId}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-700 rounded-lg text-sm font-medium transition-all"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Left Column: Info */}
          <div className="lg:col-span-4 space-y-8">
            <section className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-3 text-indigo-700">
                <Database size={18} />
                <h3 className="font-semibold text-sm uppercase tracking-wider">Active Dataset</h3>
              </div>
              <p className="text-xs text-indigo-900/70 font-mono break-all mb-4">
                ID: {spreadsheetId}
              </p>
              <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Connected to Google Sheets
              </div>
            </section>

            <section className="p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div className="flex items-center gap-2 mb-4 text-zinc-700">
                <Info size={18} />
                <h3 className="font-semibold text-sm uppercase tracking-wider">Spreadsheet Schema</h3>
              </div>
              <div className="space-y-3 text-xs text-zinc-500 leading-relaxed">
                <p>Your spreadsheet should follow this format for each layer:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Row 1:</strong> Matrix Name (e.g., "Input Layer")</li>
                  <li><strong>Row 2:</strong> Dimensions (e.g., "3,3")</li>
                  <li><strong>Row 3:</strong> Shape (e.g., "rectangle", "circle", "triangle")</li>
                  <li><strong>Following Rows:</strong> Matrix values</li>
                </ul>
                <div className="pt-2">
                  <a 
                    href="https://script.google.com/home" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    Open Google Apps Script <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Visualization */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-zinc-800 flex items-center gap-2">
                <Layers size={18} className="text-indigo-600" />
                3D Matrix Visualization
              </h2>
              {data && (
                <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {data.layers.length} Layers Loaded
                </div>
              )}
            </div>

            <div className="relative min-h-[600px]">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-20 rounded-2xl"
                  >
                    <RefreshCw size={40} className="text-indigo-600 animate-spin mb-4" />
                    <p className="text-sm font-medium text-zinc-500">Fetching data from Google Sheets...</p>
                  </motion.div>
                ) : error ? (
                  <motion.div 
                    key="error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center"
                  >
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-800 mb-2">Visualization Error</h3>
                    <p className="text-sm text-zinc-500 max-w-md mb-6">{error}</p>
                    <button 
                      onClick={loadData}
                      className="px-6 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
                    >
                      Try Again
                    </button>
                  </motion.div>
                ) : data ? (
                  <motion.div 
                    key="viz"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Graph3D data={data} />
                  </motion.div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl">
                    <Database size={48} className="text-zinc-200 mb-4" />
                    <p className="text-sm text-zinc-400">No data loaded yet.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {data && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.layers.map((layer, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider truncate pr-2">
                        {layer.name}
                      </h4>
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-zinc-100 rounded-full text-zinc-500">
                        {layer.shape}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-indigo-600">{layer.rows}×{layer.cols}</span>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Dim</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 py-10 mt-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-zinc-500">
            AIML4Me 3D Visualization Playground
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-xs font-semibold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest">GAS Setup Guide</a>
            <a href="#" className="text-xs font-semibold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest">API Reference</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
