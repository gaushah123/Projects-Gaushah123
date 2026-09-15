import React from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Image, 
  Download, 
  Check, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { captureAndDownloadElement } from '../utils/chartCapture';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPpt: () => void;
  isGeneratingPpt: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExportPpt,
  isGeneratingPpt,
}) => {
  if (!isOpen) return null;

  const chartExports = [
    {
      id: 'section-trailing-returns',
      name: 'Trailing Returns vs Benchmark Chart',
      file: 'wealthcraft-trailing-returns.png',
      desc: '1M, 3M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y bar chart & rolling statistics',
    },
    {
      id: 'section-sector-breakup',
      name: 'Sectoral Allocation & Tilts',
      file: 'wealthcraft-sector-breakup.png',
      desc: 'Active weights and benchmark comparison across all Indian sectors',
    },
    {
      id: 'section-asset-allocation',
      name: 'Asset Allocation & Market Cap',
      file: 'wealthcraft-asset-allocation.png',
      desc: 'Equity, Debt, Liquid, and Large/Mid/Small cap exposures',
    },
    {
      id: 'section-top-holdings',
      name: 'Top 10 Consolidated Holdings',
      file: 'wealthcraft-top-holdings.png',
      desc: 'Aggregated stock weights with multi-fund overlap details',
    },
    {
      id: 'section-monte-carlo',
      name: 'Monte Carlo Simulation Trajectory',
      file: 'wealthcraft-monte-carlo.png',
      desc: '10th to 90th percentile long-term wealth compounding fan chart',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Export Proposal Charts & Presentation
              </h3>
              <p className="text-xs text-slate-500">
                Download high-resolution graphic assets or editable presentation slides
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
        <div className="p-5 space-y-5">
          
          {/* Main PPT Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shadow-md">
            <div>
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-300" />
                <span className="font-bold text-sm">Full PowerPoint Proposal (.pptx)</span>
              </div>
              <p className="text-xs text-blue-200 mt-1 max-w-sm">
                5 customized slides with cover, executive summary, returns vs benchmark, risk metrics, and consolidated holdings.
              </p>
            </div>

            <button
              onClick={onExportPpt}
              disabled={isGeneratingPpt}
              className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold shrink-0 ml-3 shadow-xs transition-all disabled:opacity-50"
            >
              {isGeneratingPpt ? 'Building PPT...' : 'Download PPTX'}
            </button>
          </div>

          {/* Individual Chart Images */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-slate-400" />
              Download High-Res PNG Chart Images
            </h4>

            <div className="space-y-2">
              {chartExports.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 bg-slate-50/50 hover:bg-white flex items-center justify-between transition-colors text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                  </div>

                  <button
                    onClick={() => captureAndDownloadElement(item.id, item.file)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 transition-colors shrink-0 ml-3"
                    title={`Download ${item.name}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
