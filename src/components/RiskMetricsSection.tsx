import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Compass, 
  Flame, 
  ShieldAlert, 
  TrendingUp, 
  Info,
  Layers
} from 'lucide-react';
import { Benchmark, PortfolioAnalytics } from '../types';

interface RiskMetricsSectionProps {
  analytics: PortfolioAnalytics;
  benchmark: Benchmark;
}

export const RiskMetricsSection: React.FC<RiskMetricsSectionProps> = ({
  analytics,
  benchmark,
}) => {
  const riskCards = [
    {
      name: 'Sharpe Ratio',
      value: analytics.risk.sharpe,
      benchmarkValue: benchmark.risk.sharpe,
      unit: '',
      better: 'higher',
      description: 'Excess return per unit of total risk (Rf = 6.5%). Values > 1.2 indicate strong risk efficiency.',
      icon: ShieldCheck,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    {
      name: 'Sortino Ratio',
      value: analytics.risk.sortino,
      benchmarkValue: benchmark.risk.sortino,
      unit: '',
      better: 'higher',
      description: 'Penalizes only harmful downside volatility, ignoring upside swings.',
      icon: Compass,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      name: 'Annualized Volatility (Std Dev)',
      value: `${analytics.risk.standardDeviation}%`,
      benchmarkValue: `${benchmark.risk.standardDeviation}%`,
      unit: '',
      better: 'lower',
      description: 'Annualized dispersion of portfolio returns. Cross-asset diversification lowers volatility.',
      icon: Activity,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
    {
      name: 'Portfolio Beta',
      value: analytics.risk.beta,
      benchmarkValue: '1.00',
      unit: '',
      better: 'moderate',
      description: `Sensitivity relative to ${benchmark.name}. < 1 indicates lower systematic market swings.`,
      icon: Layers,
      color: 'text-purple-700 bg-purple-50 border-purple-200',
    },
    {
      name: 'Generated Alpha',
      value: `+${analytics.risk.alpha}%`,
      benchmarkValue: '0.00%',
      unit: '',
      better: 'higher',
      description: 'Excess return generated beyond the CAPM benchmark expectation.',
      icon: Flame,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      name: 'Max Historical Drawdown',
      value: `${analytics.risk.maxDrawdown}%`,
      benchmarkValue: `${benchmark.risk.maxDrawdown}%`,
      unit: '',
      better: 'closer_to_zero',
      description: 'Deepest peak-to-trough decline experienced in historical market stress tests.',
      icon: ShieldAlert,
      color: 'text-rose-700 bg-rose-50 border-rose-200',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              Risk & Quantitative Efficiency Scorecard
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical risk parameters benchmarked against {benchmark.name} using standardized 6.5% risk-free rate
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {riskCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.name}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-2xs"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-lg border ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">{card.name}</span>
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {card.value}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Benchmark</div>
                  <div className="text-xs font-bold text-slate-600">{card.benchmarkValue}</div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
