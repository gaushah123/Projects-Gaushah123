import React, { useState } from 'react';
import { Sparkles, X, Check, RefreshCw, Copy, CheckCheck } from 'lucide-react';
import { Benchmark, ClientProfile, PortfolioAnalytics, PortfolioItem } from '../types';

interface AiRationaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientProfile;
  onUpdateClient: (updates: Partial<ClientProfile>) => void;
  analytics: PortfolioAnalytics;
  benchmark: Benchmark;
  items: PortfolioItem[];
}

export const AiRationaleModal: React.FC<AiRationaleModalProps> = ({
  isOpen,
  onClose,
  client,
  onUpdateClient,
  analytics,
  benchmark,
  items,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGenerateRationale = async () => {
    setIsGenerating(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ai/proposal-rationale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: client.clientName,
          riskProfile: client.riskProfile,
          totalInvestment: client.totalInvestment,
          currency: client.currency,
          items: items.map((i) => ({ name: i.fund.shortName, weight: i.allocationPercent })),
          benchmarkName: benchmark.name,
          return3y: analytics.returns.y3,
          sharpeRatio: analytics.risk.sharpe,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate proposal notes');
      const data = await res.json();
      if (data.rationale) {
        onUpdateClient({ executiveSummary: data.rationale });
      }
    } catch (err: any) {
      setErrorMsg('Could not connect to AI advisor service. Using customized template.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(client.executiveSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                AI Investment Proposal Rationale
              </h3>
              <p className="text-xs text-slate-500">
                Generate strategic portfolio commentary tailored for {client.clientName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {/* Quick Context Chips */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
              Profile: <strong>{client.riskProfile}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium">
              Benchmark: <strong>{benchmark.name}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium">
              3Y Return: <strong>{analytics.returns.y3}%</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-medium">
              Sharpe: <strong>{analytics.risk.sharpe}</strong>
            </span>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="executive-summary-textarea" className="text-xs font-semibold text-slate-700">
                Executive Summary & Strategic Rationale (Included on PPT Slide 2)
              </label>
              <button
                onClick={handleCopy}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center space-x-1"
              >
                {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <textarea
              id="executive-summary-textarea"
              rows={6}
              value={client.executiveSummary}
              onChange={(e) => onUpdateClient({ executiveSummary: e.target.value })}
              className="w-full p-3 text-xs leading-relaxed border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              placeholder="Strategic portfolio commentary..."
            />
          </div>

          <p className="text-[11px] text-slate-500">
            Tip: You can edit or refine the text directly. When you export to PowerPoint (.pptx), this narrative will be included in the presentation.
          </p>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleGenerateRationale}
            disabled={isGenerating}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Drafting Notes...' : 'Regenerate with AI'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
