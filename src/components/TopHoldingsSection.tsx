import React from 'react';
import { 
  Building2, 
  Layers, 
  TrendingUp, 
  HelpCircle,
  Download 
} from 'lucide-react';
import { PortfolioAnalytics } from '../types';
import { formatINR } from '../utils/portfolioMath';

interface TopHoldingsSectionProps {
  analytics: PortfolioAnalytics;
  currency: 'INR' | 'USD';
  onCaptureChart?: (elementId: string, filename: string) => void;
}

export const TopHoldingsSection: React.FC<TopHoldingsSectionProps> = ({
  analytics,
  currency,
  onCaptureChart,
}) => {
  const top10 = analytics.topHoldings;
  const totalTop10Weight = top10.reduce((acc, h) => acc + h.combinedWeight, 0);

  return (
    <div id="section-top-holdings" className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Top 10 Consolidated Portfolio Holdings
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
              {totalTop10Weight.toFixed(1)}% Concentration
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated underlying stock exposures calculated across all selected AMFI mutual funds and APMI PMS strategies
          </p>
        </div>

        {onCaptureChart && (
          <button
            onClick={() => onCaptureChart('section-top-holdings', 'top-holdings.png')}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors self-start sm:self-auto"
            title="Save Top Holdings as Image"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-[10px] uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-4">Company Name</th>
              <th className="py-2.5 px-3">Sector</th>
              <th className="py-2.5 px-3 text-right">Combined Weight</th>
              <th className="py-2.5 px-4 text-right">Effective Value</th>
              <th className="py-2.5 px-4">Overlapping Strategies Holding Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {top10.map((holding, idx) => (
              <tr key={holding.name} className="hover:bg-slate-50/80 transition-colors">
                
                <td className="py-3 px-3 text-center font-bold text-slate-400">
                  {idx + 1}
                </td>

                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">{holding.name}</div>
                </td>

                <td className="py-3 px-3">
                  <span className="text-slate-600 font-medium">{holding.sector}</span>
                </td>

                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <span className="font-black text-slate-900">{holding.combinedWeight}%</span>
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0 hidden sm:block">
                      <div 
                        className="h-full bg-blue-600 rounded-full" 
                        style={{ width: `${Math.min(100, holding.combinedWeight * 10)}%` }} 
                      />
                    </div>
                  </div>
                </td>

                <td className="py-3 px-4 text-right font-bold text-emerald-700">
                  {formatINR(holding.amount, currency)}
                </td>

                <td className="py-3 px-4">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {holding.fundCount} {holding.fundCount === 1 ? 'Fund' : 'Funds'}
                    </span>
                    {holding.heldInFunds.map((fundName) => (
                      <span
                        key={fundName}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-100 font-medium"
                      >
                        {fundName}
                      </span>
                    ))}
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <span>
            Combined Top 10 represents <strong>{totalTop10Weight.toFixed(1)}%</strong> of the proposed equity portfolio.
          </span>
        </div>
        <span className="text-slate-500 text-[11px] hidden sm:inline">
          Calculated using daily AMFI folio disclosures
        </span>
      </div>

    </div>
  );
};
