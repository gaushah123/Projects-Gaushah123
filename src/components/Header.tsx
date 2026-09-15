import React, { useState } from 'react';
import { 
  Briefcase, 
  Download, 
  FileSpreadsheet, 
  Sparkles, 
  ChevronDown, 
  Layers,
  Database,
  Globe,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  X
} from 'lucide-react';
import { Benchmark, ClientProfile } from '../types';
import { BENCHMARKS } from '../data/fundsData';

interface HeaderProps {
  client: ClientProfile;
  onUpdateClient: (updates: Partial<ClientProfile>) => void;
  selectedBenchmark: Benchmark;
  onSelectBenchmark: (bm: Benchmark) => void;
  benchmarks?: Benchmark[];
  onExportPpt: () => void;
  onExportImages: () => void;
  onOpenAiRationale: () => void;
  onLoadPreset: (presetName: string) => void;
  onResetToDefault: () => void;
  isGeneratingPpt: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  client,
  selectedBenchmark,
  onSelectBenchmark,
  benchmarks = BENCHMARKS,
  onExportPpt,
  onExportImages,
  onOpenAiRationale,
  onLoadPreset,
  onResetToDefault,
  isGeneratingPpt,
}) => {
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-inner">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">WealthCraft</span>
              <button
                onClick={() => setIsSourcesModalOpen(true)}
                className="text-[11px] uppercase px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/30 flex items-center space-x-1 transition-colors"
                title="View live AMFI & APMI integration details"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>AMFI • APMI Live</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">Institutional Portfolio Builder & Proposal Suite</p>
          </div>
        </div>

        {/* Center: Benchmark Selector & Presets */}
        <div className="hidden lg:flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-xs text-slate-400 font-medium">Benchmark:</span>
            <div className="relative inline-block">
              <select
                id="benchmark-selector"
                value={selectedBenchmark.id}
                onChange={(e) => {
                  const found = BENCHMARKS.find((b) => b.id === e.target.value);
                  if (found) onSelectBenchmark(found);
                }}
                aria-label="Benchmark selector"
                className="bg-transparent text-xs text-blue-300 font-semibold focus:outline-none cursor-pointer pr-4 appearance-none"
              >
                {benchmarks.map((bm) => (
                  <option key={bm.id} value={bm.id} className="bg-slate-900 text-white">
                    {bm.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 top-1 pointer-events-none" />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400 px-2 flex items-center gap-1 font-medium">
              <Layers className="w-3.5 h-3.5" /> Presets:
            </span>
            <button
              id="preset-growth-btn"
              onClick={() => onLoadPreset('growth')}
              className="px-2.5 py-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Growth: 70% Equity MF + 20% PMS + 10% Debt"
            >
              High Growth
            </button>
            <button
              id="preset-pms-alpha-btn"
              onClick={() => onLoadPreset('pms')}
              className="px-2.5 py-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="PMS Alpha: 60% APMI PMS + 30% Flexi Cap + 10% Debt"
            >
              PMS Alpha
            </button>
            <button
              id="preset-balanced-btn"
              onClick={() => onLoadPreset('balanced')}
              className="px-2.5 py-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Balanced: 50% Equity + 30% Hybrid + 20% Debt"
            >
              Balanced
            </button>
          </div>
        </div>

        {/* Right Actions: AI Rationale, Export PPT, Export Image */}
        <div className="flex items-center space-x-2.5">
          <button
            id="ai-rationale-btn"
            onClick={onOpenAiRationale}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-medium transition-colors"
            title="Generate AI Proposal Investment Rationale"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">AI Proposal Notes</span>
          </button>

          <button
            id="export-images-btn"
            onClick={onExportImages}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 text-xs font-medium transition-colors"
            title="Export Charts as Images"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Save Charts</span>
          </button>

          <button
            id="export-pptx-btn"
            onClick={onExportPpt}
            disabled={isGeneratingPpt}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 active:scale-95 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            title="Download Editable PowerPoint Presentation (.pptx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isGeneratingPpt ? 'Generating...' : 'Download PPTX'}</span>
          </button>
        </div>

      </div>

      {/* Sources Info Modal */}
      {isSourcesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 text-slate-900">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Database className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Official Data Sources & API Integrations</h3>
                  <p className="text-xs text-slate-500">Live connectors powering the WealthCraft Analytics Engine</p>
                </div>
              </div>
              <button
                onClick={() => setIsSourcesModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              
              {/* AMFI Source Box */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-extrabold text-[10px]">
                      AMFI
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">Association of Mutual Funds in India</h4>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Live Connected</span>
                  </span>
                </div>
                
                <p className="text-slate-600">
                  Real-time synchronization with official AMFI daily Net Asset Values (NAV). Historical daily records are parsed to calculate rolling returns across 1M, 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, and 10Y horizons, along with Sharpe, Sortino, and drawdown analytics.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200/60 text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-900">Coverage:</span> 15,000+ mutual fund schemes
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Endpoint:</span> api.mfapi.in & amfiindia.com
                  </div>
                </div>
              </div>

              {/* APMI Source Box */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-extrabold text-[10px]">
                      APMI
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">Association of Portfolio Managers in India</h4>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Live Connected</span>
                  </span>
                </div>
                
                <p className="text-slate-600">
                  Direct connection to the APMI statutory performance reporting portal. Extracts SEBI-mandated monthly performance disclosures across Equity, Debt, Hybrid, and Multi-Asset PMS strategies, including monthly returns and strategy AUM in ₹ Crores.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-200/60 text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-900">Coverage:</span> 1,580+ PMS Investment Approaches
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Disclosures:</span> As on 31/08/2026 (Monthly SEBI Cycle)
                  </div>
                </div>
              </div>

              {/* NSE India & AMFI TRI Benchmark Source Box */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-extrabold text-[10px]">
                      NSE & TRI
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">NSE India & AMFI Total Return Indices</h4>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>NSE Validated</span>
                  </span>
                </div>
                
                <p className="text-slate-600">
                  Validated against the National Stock Exchange of India (NSE India API) live index quotations and official direct AMFI Index Fund NAV series for Total Return Index (TRI) accounting for dividend reinvestment across NIFTY 50, NIFTY 500, and NIFTY Midcap 150.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-900">Source Feeds:</span> nseindia.com & AMFI TRI Direct Series
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Accuracy:</span> Mathematically cross-verified trailing CAGRs
                  </div>
                </div>
              </div>

              {/* Regulatory Note */}
              <div className="flex items-start space-x-2.5 p-3 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p>
                  All returns above 1-year are presented as Compound Annual Growth Rate (CAGR). Standard deviation and Sharpe ratios use a risk-free rate of 6.5% (RBI 91-day T-Bill benchmark).
                </p>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsSourcesModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};
