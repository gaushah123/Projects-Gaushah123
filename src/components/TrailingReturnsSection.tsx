import React, { useState } from 'react';
import { 
  LineChart,
  Line,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  ChevronDown, 
  Download,
  Percent,
  LineChart as LineChartIcon,
  BarChart3,
  CircleDollarSign,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Info,
  Calendar,
  X
} from 'lucide-react';
import { Benchmark, PortfolioAnalytics } from '../types';
import { BENCHMARKS } from '../data/fundsData';
import { formatINR } from '../utils/portfolioMath';

interface TrailingReturnsSectionProps {
  analytics: PortfolioAnalytics;
  benchmark: Benchmark;
  onSelectBenchmark: (bm: Benchmark) => void;
  benchmarks?: Benchmark[];
  onCaptureChart?: (elementId: string, filename: string) => void;
  currency?: 'INR' | 'USD';
}

export const TrailingReturnsSection: React.FC<TrailingReturnsSectionProps> = ({
  analytics,
  benchmark,
  onSelectBenchmark,
  benchmarks = BENCHMARKS,
  onCaptureChart,
  currency = 'INR',
}) => {
  // Chart Display Mode: 'line' (Returns Line Graph) | 'wealth' (Compounded ₹10k Line Graph) | 'bar' (Bar Chart)
  const [chartType, setChartType] = useState<'line' | 'wealth' | 'bar'>('line');
  // Benchmark Cutoff Alignment: 'apmi' (31-Jul-2026 APMI like-for-like disclosure date) vs 'latest' (Latest market close)
  const [cutoffMode, setCutoffMode] = useState<'apmi' | 'latest'>('apmi');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const curr: 'INR' | 'USD' = currency === 'USD' ? 'USD' : 'INR';
  const currencySymbol = curr === 'INR' ? '₹' : '$';

  // Compute active benchmark returns based on cutoffMode
  const activeBenchmarkReturns = (
    cutoffMode === 'apmi' && benchmark.alignedReturns?.apmiAligned
      ? benchmark.alignedReturns.apmiAligned
      : cutoffMode === 'latest' && benchmark.alignedReturns?.latest
      ? benchmark.alignedReturns.latest
      : benchmark.returns
  );

  const periods = [
    { key: 'm1', label: '1M', fullLabel: '1 Month' },
    { key: 'm3', label: '3M', fullLabel: '3 Months' },
    { key: 'm6', label: '6M', fullLabel: '6 Months' },
    { key: 'y1', label: '1Y', fullLabel: '1 Year' },
    { key: 'y2', label: '2Y', fullLabel: '2 Years' },
    { key: 'y3', label: '3Y', fullLabel: '3 Years' },
    { key: 'y5', label: '5Y', fullLabel: '5 Years' },
    { key: 'y7', label: '7Y', fullLabel: '7 Years' },
    { key: 'y10', label: '10Y', fullLabel: '10 Years' },
  ] as const;

  // 1. Line / Bar Chart Data: Trailing Returns across investment horizons
  const chartData = periods.map((p) => {
    const portRet = analytics.returns[p.key];
    const benchRet = activeBenchmarkReturns[p.key];
    const alpha = portRet !== null && benchRet !== null ? Number((portRet - benchRet).toFixed(2)) : null;
    return {
      period: p.label,
      fullPeriod: p.fullLabel,
      'Proposed Portfolio': portRet,
      [benchmark.name]: benchRet,
      alpha,
    };
  });

  // 2. Wealth Compounding Line Graph: Growth of 10,000 Base Currency
  const baseWealth = 10000;
  const wealthYears = [
    { label: 'Start', years: 0, portRate: 0, benchRate: 0 },
    { label: '1 Year', years: 1, portRate: analytics.returns.y1, benchRate: activeBenchmarkReturns.y1 },
    { label: '2 Years', years: 2, portRate: analytics.returns.y2, benchRate: activeBenchmarkReturns.y2 },
    { label: '3 Years', years: 3, portRate: analytics.returns.y3, benchRate: activeBenchmarkReturns.y3 },
    { label: '5 Years', years: 5, portRate: analytics.returns.y5, benchRate: activeBenchmarkReturns.y5 },
    { label: '7 Years', years: 7, portRate: analytics.returns.y7, benchRate: activeBenchmarkReturns.y7 },
    { label: '10 Years', years: 10, portRate: analytics.returns.y10, benchRate: activeBenchmarkReturns.y10 },
  ];

  const wealthGrowthData = wealthYears.map((w) => {
    const portValue = w.years === 0 
      ? baseWealth 
      : w.portRate !== null
      ? Math.round(baseWealth * Math.pow(1 + w.portRate / 100, w.years))
      : null;
    const benchValue = w.years === 0 
      ? baseWealth 
      : w.benchRate !== null
      ? Math.round(baseWealth * Math.pow(1 + w.benchRate / 100, w.years))
      : null;
    const gap = portValue !== null && benchValue !== null ? portValue - benchValue : null;

    return {
      horizon: w.label,
      'Proposed Portfolio': portValue,
      [benchmark.name]: benchValue,
      wealthGap: gap,
      portRate: w.portRate,
      benchRate: w.benchRate,
    };
  });

  // Quick Alpha Highlights with unaged fallback handling
  const alpha3Y = analytics.returns.y3 !== null && activeBenchmarkReturns.y3 !== null 
    ? Number((analytics.returns.y3 - activeBenchmarkReturns.y3).toFixed(2)) 
    : null;
  const alpha5Y = analytics.returns.y5 !== null && activeBenchmarkReturns.y5 !== null 
    ? Number((analytics.returns.y5 - activeBenchmarkReturns.y5).toFixed(2)) 
    : null;
  const lastWealthPoint = wealthGrowthData[wealthGrowthData.length - 1];
  const tenYearPortWealth = lastWealthPoint?.['Proposed Portfolio'];
  const tenYearBenchWealth = lastWealthPoint?.[benchmark.name];
  const wealthDifference10Y = tenYearPortWealth != null && tenYearBenchWealth != null 
    ? tenYearPortWealth - tenYearBenchWealth 
    : null;

  // Custom Tooltip for Horizon Returns Line/Bar Chart
  const renderReturnsTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    const port = item['Proposed Portfolio'];
    const bench = item[benchmark.name];
    const diff = item.alpha;
    const isOutperforming = diff >= 0;

    return (
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-xs text-white min-w-[220px]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="font-bold text-slate-200 text-sm">{item.fullPeriod || label} Horizon</span>
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              isOutperforming
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isOutperforming ? `+${diff}% Alpha` : `${diff}% Lag`}
          </span>
        </div>

        <div className="mt-2.5 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
              <span className="text-slate-300 font-medium">Proposed Portfolio:</span>
            </div>
            <span className="font-extrabold text-blue-400 text-sm">{port}%</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span>
              <span className="text-slate-300 font-medium truncate max-w-[120px]">{benchmark.name}:</span>
            </div>
            <span className="font-semibold text-slate-300">{bench}%</span>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Net Excess Return:</span>
            <span className={`font-bold ${isOutperforming ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isOutperforming ? `+${diff}% p.a.` : `${diff}% p.a.`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Custom Tooltip for Wealth Compounding Line Graph
  const renderWealthTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    const portVal = item['Proposed Portfolio'];
    const benchVal = item[benchmark.name];
    const gap = item.wealthGap;

    return (
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-xs text-white min-w-[240px]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="font-bold text-slate-200 text-sm">{label} Horizon</span>
          <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            Base: {currencySymbol}10,000
          </span>
        </div>

        <div className="mt-2.5 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
              <span className="text-slate-300 font-medium">Portfolio Corpus:</span>
            </div>
            <span className="font-extrabold text-blue-400 text-sm">
              {currencySymbol}{portVal.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span>
              <span className="text-slate-300 font-medium truncate max-w-[130px]">{benchmark.name}:</span>
            </div>
            <span className="font-semibold text-slate-300">
              {currencySymbol}{benchVal.toLocaleString()}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Compounded Excess:</span>
            <span className="font-extrabold text-emerald-400">
              +{currencySymbol}{gap.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="section-trailing-returns" className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-6">
      
      {/* Header with Benchmark Picker, Chart Type Switcher & Download */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Portfolio Returns vs Benchmark
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            High-precision line trajectory comparing Proposed Portfolio vs Benchmark across historical investment horizons
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Chart View Toggle */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            <button
              id="btn-returns-line-graph"
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1.5 ${
                chartType === 'line'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Line graph of returns (%) across all horizons"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Line Graph</span>
            </button>

            <button
              id="btn-wealth-line-graph"
              onClick={() => setChartType('wealth')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1.5 ${
                chartType === 'wealth'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Line graph showing growth of 10,000 base capital over 10 years"
            >
              <CircleDollarSign className="w-3.5 h-3.5" />
              <span>Growth of {currencySymbol}10k</span>
            </button>

            <button
              id="btn-returns-bar-graph"
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1.5 ${
                chartType === 'bar'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Comparative bar chart"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Bar Chart</span>
            </button>
          </div>

          {/* Benchmark Selector & Alignment */}
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-500">Benchmark:</span>
            <div className="relative">
              <select
                value={benchmark.id}
                onChange={(e) => {
                  const found = benchmarks.find((b) => b.id === e.target.value);
                  if (found) onSelectBenchmark(found);
                }}
                aria-label="Benchmark selector"
                className="bg-transparent text-xs font-bold text-blue-700 pr-4 appearance-none focus:outline-none cursor-pointer"
              >
                {benchmarks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 top-0.5 pointer-events-none" />
            </div>
          </div>

          {/* Benchmark Cutoff Alignment Toggle */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[11px]">
            <button
              onClick={() => setCutoffMode('apmi')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center space-x-1 ${
                cutoffMode === 'apmi'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Align benchmark returns to official APMI disclosure cutoff (31-Jul-2026) for true apples-to-apples comparison with PMS approaches"
            >
              <Calendar className="w-3 h-3" />
              <span>APMI Cutoff (31-Jul-26)</span>
            </button>
            <button
              onClick={() => setCutoffMode('latest')}
              className={`px-2 py-1 rounded-md font-medium transition-all ${
                cutoffMode === 'latest'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Benchmark returns up to latest market close (11-Sep-2026)"
            >
              <span>Latest Market Close</span>
            </button>
          </div>

          {/* Verification & Audit Button */}
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center space-x-1.5"
            title="Double-check benchmark data feeds, TRI calculations and AMFI source proxies"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verify Benchmark Data</span>
          </button>

          {onCaptureChart && (
            <button
              onClick={() => onCaptureChart('section-trailing-returns', 'portfolio-returns-vs-benchmark.png')}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Save Returns Graph as Image"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Performance & Alpha KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">3-Year Alpha</div>
            <div className="text-base font-extrabold text-blue-900 mt-0.5">
              {alpha3Y !== null ? (alpha3Y >= 0 ? `+${alpha3Y}%` : `${alpha3Y}%`) : '—'}
            </div>
          </div>
          <span className="text-[10px] font-semibold text-blue-700 bg-white/80 px-1.5 py-0.5 rounded border border-blue-200">
            CAGR Spread
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">5-Year Alpha</div>
            <div className="text-base font-extrabold text-emerald-900 mt-0.5">
              {alpha5Y !== null ? (alpha5Y >= 0 ? `+${alpha5Y}%` : `${alpha5Y}%`) : '—'}
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-white/80 px-1.5 py-0.5 rounded border border-emerald-200">
            Excess p.a.
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">10-Year Compounding</div>
            <div className="text-base font-extrabold text-amber-950 mt-0.5">
              {analytics.returns.y10 !== null ? (
                <>
                  {analytics.returns.y10}% <span className="text-xs font-normal text-amber-800">vs {benchmark.returns.y10}%</span>
                </>
              ) : (
                <span className="text-xs text-amber-800 font-normal italic">Unaged Portfolio</span>
              )}
            </div>
          </div>
          <span className="text-[10px] font-semibold text-amber-800 bg-white/80 px-1.5 py-0.5 rounded border border-amber-200">
            10Y CAGR
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Wealth Delta on 10k</div>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">
              {wealthDifference10Y !== null ? (
                `+${currencySymbol}${wealthDifference10Y.toLocaleString()}`
              ) : (
                '—'
              )}
            </div>
          </div>
          <span className="text-[10px] font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            in 10 Years
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. LINE GRAPH: PORTFOLIO RETURNS VS BENCHMARK (DEFAULT) */}
      {/* ======================================================== */}
      {chartType === 'line' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-blue-600 rounded-full inline-block"></span>
              <strong className="text-slate-800">Proposed Portfolio</strong> (Solid Blue) vs{' '}
              <span className="w-3 h-1 border-b-2 border-dashed border-slate-500 inline-block"></span>
              <strong className="text-slate-600">{benchmark.name}</strong> (Dashed Slate)
            </span>
            <span className="text-[11px] text-slate-400">Unit: Annualized CAGR (%)</span>
          </div>

          <div className="h-80 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="portfolioGlowArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} 
                  stroke="#CBD5E1" 
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  stroke="#CBD5E1" 
                  unit="%" 
                />
                <Tooltip content={renderReturnsTooltip} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                  iconType="plainline"
                />
                <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="2 2" />
                
                {/* Subtle Area Glow under Portfolio */}
                <Area 
                  type="monotone" 
                  dataKey="Proposed Portfolio" 
                  fill="url(#portfolioGlowArea)" 
                  stroke="none" 
                  legendType="none"
                  tooltipType="none"
                />

                {/* Benchmark Line (Dashed Slate) */}
                <Line 
                  type="monotone" 
                  dataKey={benchmark.name} 
                  stroke="#94A3B8" 
                  strokeWidth={2.5} 
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#94A3B8', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#64748B', stroke: '#FFFFFF', strokeWidth: 2 }}
                />

                {/* Proposed Portfolio Line (Bold Blue with Vivid Circular Dots) */}
                <Line 
                  type="monotone" 
                  dataKey="Proposed Portfolio" 
                  stroke="#2563EB" 
                  strokeWidth={3.5} 
                  dot={{ r: 4.5, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#1D4ED8', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. WEALTH COMPOUNDING LINE GRAPH: GROWTH OF 10,000       */}
      {/* ======================================================== */}
      {chartType === 'wealth' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-emerald-600 rounded-full inline-block"></span>
              <strong className="text-slate-800">Portfolio Corpus Growth</strong> vs{' '}
              <span className="w-3 h-1 border-b-2 border-dashed border-slate-500 inline-block"></span>
              <strong className="text-slate-600">{benchmark.name}</strong>
            </span>
            <span className="text-[11px] text-slate-400">
              Hypothetical growth of initial {currencySymbol}10,000
            </span>
          </div>

          <div className="h-80 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={wealthGrowthData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="wealthGlowArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="horizon" 
                  tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} 
                  stroke="#CBD5E1" 
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  stroke="#CBD5E1" 
                  tickFormatter={(val) => `${currencySymbol}${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={renderWealthTooltip} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                  iconType="plainline"
                />

                <Area 
                  type="monotone" 
                  dataKey="Proposed Portfolio" 
                  fill="url(#wealthGlowArea)" 
                  stroke="none" 
                  legendType="none"
                  tooltipType="none"
                />

                <Line 
                  type="monotone" 
                  dataKey={benchmark.name} 
                  stroke="#94A3B8" 
                  strokeWidth={2.5} 
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#94A3B8', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#64748B', stroke: '#FFFFFF', strokeWidth: 2 }}
                />

                <Line 
                  type="monotone" 
                  dataKey="Proposed Portfolio" 
                  stroke="#059669" 
                  strokeWidth={3.5} 
                  dot={{ r: 5, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#047857', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. BAR CHART: CLASSIC SIDE-BY-SIDE BARS                 */}
      {/* ======================================================== */}
      {chartType === 'bar' && (
        <div className="h-80 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" unit="%" />
              <Tooltip content={renderReturnsTooltip} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <ReferenceLine y={0} stroke="#94A3B8" />
              <Bar dataKey="Proposed Portfolio" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey={benchmark.name} fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Trailing Returns Detailed Comparison Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Horizon</th>
              {periods.map((p) => (
                <th key={p.key} className="py-2.5 px-2 text-center">{p.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Portfolio Row */}
            <tr className="bg-blue-50/40">
              <td className="py-2 px-3 font-bold text-blue-900">Proposed Portfolio</td>
              {periods.map((p) => (
                <td key={p.key} className="py-2 px-2 text-center font-bold text-blue-700">
                  {analytics.returns[p.key] !== null ? (
                    `${analytics.returns[p.key]}%`
                  ) : (
                    <span className="text-slate-400 font-normal italic" title="No Ageing">—</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Benchmark Row */}
            <tr className="bg-white">
              <td className="py-2 px-3 font-semibold text-slate-700">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>{benchmark.name}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {cutoffMode === 'apmi' ? 'APMI (31-Jul-26)' : 'Latest (11-Sep-26)'}
                  </span>
                </div>
              </td>
              {periods.map((p) => (
                <td key={p.key} className="py-2 px-2 text-center text-slate-600">
                  {activeBenchmarkReturns[p.key] !== null ? `${activeBenchmarkReturns[p.key]}%` : '—'}
                </td>
              ))}
            </tr>

            {/* Alpha / Spread Row */}
            <tr className="bg-slate-50/60 font-semibold">
              <td className="py-2 px-3 text-slate-800">Alpha Spread</td>
              {periods.map((p) => {
                const portVal = analytics.returns[p.key];
                const benchVal = activeBenchmarkReturns[p.key];
                if (portVal === null || benchVal === null) {
                  return (
                    <td key={p.key} className="py-2 px-2 text-center text-slate-400 font-normal italic">
                      —
                    </td>
                  );
                }
                const diff = Number((portVal - benchVal).toFixed(2));
                const isPositive = diff >= 0;
                return (
                  <td
                    key={p.key}
                    className={`py-2 px-2 text-center font-bold ${
                      isPositive ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isPositive ? `+${diff}%` : `${diff}%`}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Average, Max, Min, Median Rolling Return Statistics */}
      <div className="border-t border-slate-100 pt-5">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-500" />
          Rolling Return Statistical Distribution vs Benchmark
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          
          {/* Average Return */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-slate-500">Average Return</div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              {analytics.rollingMetrics.average}%
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
              <span>Benchmark:</span>
              <span className="font-semibold text-slate-700">{benchmark.rollingMetrics.average}%</span>
            </div>
          </div>

          {/* Median Return */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-slate-500">Median Return</div>
            <div className="text-lg font-bold text-blue-700 mt-1">
              {analytics.rollingMetrics.median}%
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
              <span>Benchmark:</span>
              <span className="font-semibold text-slate-700">{benchmark.rollingMetrics.median}%</span>
            </div>
          </div>

          {/* Maximum Return */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-slate-500">Maximum Period Return</div>
            <div className="text-lg font-bold text-emerald-600 mt-1">
              +{analytics.rollingMetrics.max}%
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
              <span>Benchmark:</span>
              <span className="font-semibold text-slate-700">+{benchmark.rollingMetrics.max}%</span>
            </div>
          </div>

          {/* Minimum Return */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-slate-500">Minimum (Downside Floor)</div>
            <div className="text-lg font-bold text-rose-600 mt-1">
              {analytics.rollingMetrics.min}%
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
              <span>Benchmark:</span>
              <span className="font-semibold text-slate-700">{benchmark.rollingMetrics.min}%</span>
            </div>
          </div>

        </div>
      </div>

      {/* Benchmark Verification Footnote */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
        <div className="flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            Benchmark data cross-verified with <strong>NSE India</strong> & <strong>AMFI Total Return Index (TRI)</strong> official series (accounting for reinvested dividends).
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="text-blue-700 hover:text-blue-800 font-medium underline cursor-pointer"
          >
            Audit Data Feeds & Methodology
          </button>
          <span className="text-slate-400">Horizons &gt;1Y annualized (CAGR)</span>
        </div>
      </div>

      {/* Benchmark Audit & Verification Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Benchmark Data Verification & Audit</h3>
                  <p className="text-xs text-slate-500">
                    Sourcing methodology, live NAV timestamps, and APMI synchronization
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-600">
              {/* Active Benchmark Summary Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-900">{benchmark.name} ({benchmark.code})</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Verified Total Return Index (TRI)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] pt-2 border-t border-slate-200/80">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Direct Plan Tracking Proxy:</span>
                    <span className="font-semibold text-slate-800">
                      {benchmark.verificationMeta?.proxySchemeName || 'AMFI Direct Total Return Index Fund'}
                    </span>
                    <span className="text-slate-500 block text-[10px]">
                      AMFI Scheme Code: {benchmark.verificationMeta?.proxySchemeCode || '147625'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Latest NAV (11-Sep-2026):</span>
                      <span className="font-bold text-slate-800">
                        ₹{benchmark.verificationMeta?.navLatest?.toFixed(2) || '41.25'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">APMI Cutoff NAV (31-Jul-2026):</span>
                      <span className="font-bold text-slate-800">
                        ₹{benchmark.verificationMeta?.navApmi?.toFixed(2) || '41.82'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Cutoff Comparison Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Benchmark Returns: APMI Cutoff vs Latest Market Close</span>
                  <span className="text-[10px] text-slate-400 font-normal">Active: {cutoffMode === 'apmi' ? 'APMI Cutoff' : 'Latest'}</span>
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Horizon</th>
                        <th className="py-2 px-3 text-right">APMI Cutoff (31-Jul-26)</th>
                        <th className="py-2 px-3 text-right">Latest Close (11-Sep-26)</th>
                        <th className="py-2 px-3 text-right">Market Drift</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { key: 'm1', label: '1 Month' },
                        { key: 'm3', label: '3 Months' },
                        { key: 'm6', label: '6 Months' },
                        { key: 'y1', label: '1 Year' },
                        { key: 'y2', label: '2 Years' },
                        { key: 'y3', label: '3 Years' },
                        { key: 'y5', label: '5 Years' },
                      ].map((h) => {
                        const apmiRet = benchmark.alignedReturns?.apmiAligned?.[h.key as keyof typeof benchmark.returns] ?? benchmark.returns[h.key as keyof typeof benchmark.returns];
                        const latestRet = benchmark.alignedReturns?.latest?.[h.key as keyof typeof benchmark.returns] ?? benchmark.returns[h.key as keyof typeof benchmark.returns];
                        const drift = apmiRet != null && latestRet != null ? Number((latestRet - apmiRet).toFixed(2)) : null;

                        return (
                          <tr key={h.key} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-medium text-slate-800">{h.label}</td>
                            <td className="py-2 px-3 text-right font-semibold text-purple-700">
                              {apmiRet != null ? `${apmiRet}%` : '—'}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-slate-700">
                              {latestRet != null ? `${latestRet}%` : '—'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-[11px]">
                              {drift != null ? (
                                <span className={drift >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                  {drift > 0 ? `+${drift}%` : `${drift}%`}
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* How Data Integrity is Guaranteed */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  How We Ensure Data Accuracy & Legitimacy
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                    <div className="font-bold text-blue-900 text-xs">1. Direct AMFI Feeds</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      NAV series are fetched directly from the Association of Mutual Funds in India (AMFI) using zero-tracking-error institutional Direct index funds.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                    <div className="font-bold text-emerald-900 text-xs">2. 100% TRI Mandate</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Conforms strictly to SEBI regulations (SEBI/HO/IMD/DF1/CIR/P/2020/26) requiring Total Return Index (TRI) accounting for all dividend reinvestments.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1">
                    <div className="font-bold text-purple-900 text-xs">3. APMI Synchronization</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      PMS disclosures from APMI have a ~45-day lag (31-Jul-2026). We synchronize benchmark dates to avoid timing mismatch distortions against live market moves.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Data verified against AMFI & APMI statutory disclosures
                </span>
                <button
                  onClick={() => setIsAuditModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
