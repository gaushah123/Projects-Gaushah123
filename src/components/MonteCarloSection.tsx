import React, { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Sparkles, 
  Sliders, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Download,
  HelpCircle,
  RefreshCw 
} from 'lucide-react';
import { ClientProfile, MonteCarloResult, PortfolioAnalytics } from '../types';
import { runMonteCarloSimulation } from '../utils/monteCarlo';
import { formatINR } from '../utils/portfolioMath';

interface MonteCarloSectionProps {
  client: ClientProfile;
  analytics: PortfolioAnalytics;
  onCaptureChart?: (elementId: string, filename: string) => void;
}

export const MonteCarloSection: React.FC<MonteCarloSectionProps> = ({
  client,
  analytics,
  onCaptureChart,
}) => {
  // Configurable simulation params
  const defaultExpectedReturn = Math.max(8, Math.min(25, analytics.returns.y3 || 15.0));
  const defaultVol = Math.max(6, Math.min(25, analytics.risk.standardDeviation || 13.5));

  const [horizonYears, setHorizonYears] = useState(client.investmentHorizonYears || 10);
  const [expectedReturn, setExpectedReturn] = useState(defaultExpectedReturn);
  const [volatility, setVolatility] = useState(defaultVol);
  const [inflationRate, setInflationRate] = useState(6.0);
  const [includeSip, setIncludeSip] = useState(client.monthlySip > 0);
  const [simKey, setSimKey] = useState(0);

  // Run simulation memoized or on re-run trigger
  const monteCarloResult: MonteCarloResult = useMemo(() => {
    return runMonteCarloSimulation({
      initialCapital: client.totalInvestment,
      monthlySip: includeSip ? client.monthlySip : 0,
      horizonYears,
      expectedAnnualReturnPercent: expectedReturn,
      annualVolatilityPercent: volatility,
      inflationRatePercent: inflationRate,
      numSimulations: 2000,
    });
  }, [
    client.totalInvestment,
    client.monthlySip,
    includeSip,
    horizonYears,
    expectedReturn,
    volatility,
    inflationRate,
    simKey,
  ]);

  // Format data for chart
  const chartData = monteCarloResult.years.map((year, idx) => ({
    year: `Yr ${year}`,
    'Bear Market (10th %ile)': monteCarloResult.p10[idx],
    'P25': monteCarloResult.p25[idx],
    'Median Trajectory (50th %ile)': monteCarloResult.p50[idx],
    'P75': monteCarloResult.p75[idx],
    'Bull Market (90th %ile)': monteCarloResult.p90[idx],
  }));

  const totalInvested = client.totalInvestment + (includeSip ? client.monthlySip * 12 * horizonYears : 0);

  return (
    <div id="section-monte-carlo" className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Long-Term Predictive Analytics (Monte Carlo Simulation)
            </h3>
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              2,000 Stochastic Iterations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Log-normal geometric Brownian motion modeling 10th to 90th percentile terminal wealth ranges
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSimKey((k) => k + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center space-x-1"
            title="Re-run 2,000 stochastic paths"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Re-simulate</span>
          </button>

          {onCaptureChart && (
            <button
              onClick={() => onCaptureChart('section-monte-carlo', 'monte-carlo-simulation.png')}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Save Monte Carlo Simulation as Image"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Control Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        
        {/* Horizon */}
        <div>
          <div className="flex justify-between font-semibold text-slate-700 mb-1">
            <span>Horizon</span>
            <span className="font-bold text-blue-700">{horizonYears} Years</span>
          </div>
          <input
            type="range"
            min="3"
            max="25"
            value={horizonYears}
            onChange={(e) => setHorizonYears(Number(e.target.value))}
            className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Expected CAGR */}
        <div>
          <div className="flex justify-between font-semibold text-slate-700 mb-1">
            <span>Expected Mean CAGR</span>
            <span className="font-bold text-emerald-700">{expectedReturn}%</span>
          </div>
          <input
            type="range"
            min="8"
            max="24"
            step="0.5"
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(Number(e.target.value))}
            className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Annual Volatility */}
        <div>
          <div className="flex justify-between font-semibold text-slate-700 mb-1">
            <span>Portfolio Volatility (σ)</span>
            <span className="font-bold text-indigo-700">{volatility}%</span>
          </div>
          <input
            type="range"
            min="6"
            max="25"
            step="0.5"
            value={volatility}
            onChange={(e) => setVolatility(Number(e.target.value))}
            className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* SIP Switch */}
        <div className="flex flex-col justify-between">
          <span className="font-semibold text-slate-700">Monthly SIP ({formatINR(client.monthlySip, client.currency)})</span>
          <label className="flex items-center space-x-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={includeSip}
              onChange={(e) => setIncludeSip(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
            />
            <span className="text-slate-600 font-medium">Include in Projection</span>
          </label>
        </div>

      </div>

      {/* Outcome Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Pessimistic Bear */}
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 shadow-2xs">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
            Pessimistic (10th Percentile)
          </div>
          <div className="text-xl font-black text-rose-900 mt-1">
            {formatINR(monteCarloResult.finalValues.p10, client.currency)}
          </div>
          <p className="text-[11px] text-rose-700/80 mt-1">
            Expected value in prolonged bear market / high volatility cycles
          </p>
        </div>

        {/* Median Expected */}
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 shadow-2xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            Median Projection (50th Percentile)
          </div>
          <div className="text-xl font-black text-blue-900 mt-1">
            {formatINR(monteCarloResult.finalValues.p50, client.currency)}
          </div>
          <p className="text-[11px] text-blue-700/80 mt-1">
            CAGR: ~{monteCarloResult.projectedCagrP50}% p.a. (Total invested: {formatINR(totalInvested, client.currency)})
          </p>
        </div>

        {/* Optimistic Bull */}
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Optimistic (90th Percentile)
          </div>
          <div className="text-xl font-black text-emerald-900 mt-1">
            {formatINR(monteCarloResult.finalValues.p90, client.currency)}
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1">
            Compounding potential during favorable economic growth periods
          </p>
        </div>

      </div>

      {/* Trajectory Fan Chart */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="bullGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="medianGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="bearGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
            <YAxis 
              tick={{ fontSize: 11, fill: '#64748B' }} 
              stroke="#CBD5E1" 
              tickFormatter={(val) => formatINR(val, client.currency)} 
            />
            <Tooltip
              formatter={(val: any) => [formatINR(val, client.currency), '']}
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#1E293B',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Area 
              type="monotone" 
              dataKey="Bull Market (90th %ile)" 
              stroke="#059669" 
              fillOpacity={1} 
              fill="url(#bullGrad)" 
              strokeWidth={2} 
            />
            <Area 
              type="monotone" 
              dataKey="Median Trajectory (50th %ile)" 
              stroke="#2563EB" 
              fillOpacity={1} 
              fill="url(#medianGrad)" 
              strokeWidth={2.5} 
            />
            <Area 
              type="monotone" 
              dataKey="Bear Market (10th %ile)" 
              stroke="#E11D48" 
              fillOpacity={1} 
              fill="url(#bearGrad)" 
              strokeWidth={2} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Confidence Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold text-emerald-900">
              {monteCarloResult.inflationBeatProbability}% Probability
            </span>
            <span className="text-emerald-700 ml-1">of outperforming 6% annual inflation</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <ShieldAlert className="w-5 h-5 text-slate-500 shrink-0" />
          <div>
            <span className="font-bold text-slate-900">
              {monteCarloResult.lossProbability}% Capital Loss Risk
            </span>
            <span className="text-slate-600 ml-1">over the full {horizonYears}-year holding period</span>
          </div>
        </div>
      </div>

    </div>
  );
};
