import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  PieChart as PieIcon, 
  Layers, 
  Download,
  Building,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
  CircleDot
} from 'lucide-react';
import { Benchmark, PortfolioAnalytics } from '../types';
import { formatINR } from '../utils/portfolioMath';

interface SectorAndAllocationSectionProps {
  analytics: PortfolioAnalytics;
  benchmark: Benchmark;
  totalCapital?: number;
  currency?: 'INR' | 'USD';
  onCaptureChart?: (elementId: string, filename: string) => void;
}

export const SectorAndAllocationSection: React.FC<SectorAndAllocationSectionProps> = ({
  analytics,
  benchmark,
  totalCapital = 5000000,
  currency = 'INR',
  onCaptureChart,
}) => {
  const curr: 'INR' | 'USD' = currency === 'USD' ? 'USD' : 'INR';
  // Tab state in the allocation card: 'marketCap' or 'assetClass'
  const [allocationTab, setAllocationTab] = useState<'marketCap' | 'assetClass'>('marketCap');
  // Market cap view mode: 'overall' or 'equityOnly'
  const [marketCapScope, setMarketCapScope] = useState<'overall' | 'equityOnly'>('overall');
  // Chart visual style: 'donut' or 'solid'
  const [pieStyle, setPieStyle] = useState<'donut' | 'solid'>('donut');

  // Top 8 sectors for the bar chart
  const sectorChartData = analytics.sectorBreakup.slice(0, 8).map((s) => ({
    name: s.sector.length > 18 ? s.sector.slice(0, 18) + '...' : s.sector,
    fullName: s.sector,
    'Proposed Portfolio': s.portfolioWeight,
    [benchmark.name]: s.benchmarkWeight,
    activeWeight: s.activeWeight,
  }));

  // Raw Market Cap Data
  const mc = analytics.marketCap;
  const equityTotal = mc.largeCap + mc.midCap + mc.smallCap;

  // Re-normalized equity values if equityOnly mode is active
  const largeVal = marketCapScope === 'overall' 
    ? mc.largeCap 
    : equityTotal > 0 ? Number(((mc.largeCap / equityTotal) * 100).toFixed(1)) : 0;
  
  const midVal = marketCapScope === 'overall' 
    ? mc.midCap 
    : equityTotal > 0 ? Number(((mc.midCap / equityTotal) * 100).toFixed(1)) : 0;
  
  const smallVal = marketCapScope === 'overall' 
    ? mc.smallCap 
    : equityTotal > 0 ? Number(((mc.smallCap / equityTotal) * 100).toFixed(1)) : 0;

  const cashVal = marketCapScope === 'overall' ? mc.cashDebt : 0;

  // Market Cap Pie Data with Golden, Rose Gold, Platinum Silver & Subtle Pearl White palette
  const marketCapPieData = [
    {
      name: 'Large Cap',
      code: 'LARGE',
      value: largeVal,
      fill: 'url(#goldGradient)',
      previewColor: '#D4AF37',
      labelColor: '#966F12',
      bgBadge: 'bg-amber-500/10 text-amber-900 border-amber-300/80',
      subtitle: 'Top 100 Market Leaders • High Liquidity & Stability',
      rankInfo: '1 - 100 Rank',
    },
    {
      name: 'Mid Cap',
      code: 'MID',
      value: midVal,
      fill: 'url(#roseGoldGradient)',
      previewColor: '#B76E79',
      labelColor: '#8C4B54',
      bgBadge: 'bg-rose-500/10 text-rose-950 border-rose-300/80',
      subtitle: '101st - 250th Ranked • Rapid Scaling & High Growth',
      rankInfo: '101 - 250 Rank',
    },
    {
      name: 'Small Cap',
      code: 'SMALL',
      value: smallVal,
      fill: 'url(#platinumGradient)',
      previewColor: '#A8B2C1',
      labelColor: '#475569',
      bgBadge: 'bg-slate-500/10 text-slate-800 border-slate-300',
      subtitle: '251st+ Emerging Alpha • Agile Innovators & Disruptors',
      rankInfo: '251+ Rank',
    },
    ...(cashVal > 0 ? [{
      name: 'Cash / Debt Equiv.',
      code: 'CASH',
      value: cashVal,
      fill: 'url(#pearlWhiteGradient)',
      previewColor: '#CBD5E1',
      labelColor: '#64748B',
      bgBadge: 'bg-slate-100 text-slate-700 border-slate-200',
      subtitle: 'Liquidity & Tactical Reserves • Capital Shielding',
      rankInfo: 'Preservation',
    }] : []),
  ].filter((item) => item.value > 0);

  // Asset Allocation Pie Data
  const assetData = [
    { name: 'Equity', value: analytics.assetAllocation.equity, color: '#2563EB' },
    { name: 'Debt', value: analytics.assetAllocation.debt, color: '#059669' },
    { name: 'Hybrid', value: analytics.assetAllocation.hybrid, color: '#8B5CF6' },
    { name: 'Cash / Liquid', value: analytics.assetAllocation.cash, color: '#64748B' },
  ].filter((item) => item.value > 0);

  // Custom Metallic Tooltip for Market Cap Pie
  const renderMarketCapTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0].payload;
    const allocatedAmt = totalCapital > 0 ? (d.value / 100) * totalCapital : 0;

    return (
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-xs text-white min-w-[210px] animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center space-x-2">
          <span 
            className="w-3.5 h-3.5 rounded-full border border-white/70 shadow-xs shrink-0" 
            style={{ backgroundColor: d.previewColor }}
          />
          <span className="font-bold text-sm text-white tracking-tight">{d.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono ml-auto">
            {d.rankInfo}
          </span>
        </div>
        <div className="mt-2.5 space-y-1.5 pt-2 border-t border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-[11px]">Portfolio Share:</span>
            <span className="font-extrabold text-base" style={{ color: d.previewColor }}>
              {d.value}%
            </span>
          </div>
          {totalCapital > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[11px]">Capital Value:</span>
              <span className="font-semibold text-slate-200">
                {formatINR(allocatedAmt, curr)}
              </span>
            </div>
          )}
          <div className="text-[10px] text-slate-400 pt-1 leading-relaxed border-t border-slate-800/60">
            {d.subtitle}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* 1. Sectoral Breakup vs Benchmark (7 cols on lg screens) */}
      <div id="section-sector-breakup" className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Sectoral Allocation vs {benchmark.name}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Portfolio sector weightings compared to benchmark with active over/underweight positioning
              </p>
            </div>

            {onCaptureChart && (
              <button
                onClick={() => onCaptureChart('section-sector-breakup', 'sector-breakup.png')}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                title="Save Sector Allocation as Image"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sector Bar Chart */}
          <div className="h-64 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorChartData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  angle={-20} 
                  textAnchor="end" 
                  interval={0}
                  stroke="#CBD5E1" 
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val}%`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                <Bar dataKey="Proposed Portfolio" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey={benchmark.name} fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Active Weights Table */}
        <div className="border-t border-slate-100 pt-3 mt-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Top Active Sector Tilts vs Benchmark
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {analytics.sectorBreakup.slice(0, 4).map((sec) => {
              const isOver = sec.activeWeight >= 0;
              return (
                <div key={sec.sector} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-800 line-clamp-1">{sec.sector}</div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xs font-bold text-slate-900">{sec.portfolioWeight}%</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isOver ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isOver ? `+${sec.activeWeight}%` : `${sec.activeWeight}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Market Cap Breakup (Large, Mid & Small) & Asset Class (5 cols on lg screens) */}
      <div 
        id="section-market-cap-breakup" 
        className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between"
      >
        <div>
          {/* Header with Luxury Badge & Controls */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-3 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {allocationTab === 'marketCap' ? 'Market Capitalization' : 'Asset Allocation'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {allocationTab === 'marketCap' 
                  ? 'Large, Mid & Small Cap break-up across overall portfolio' 
                  : 'Overall allocation across Equity, Debt & Cash equivalents'}
              </p>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              {onCaptureChart && (
                <button
                  onClick={() => onCaptureChart('section-market-cap-breakup', 'market-cap-breakup.png')}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  title="Save Breakup Chart as Image"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Primary View Switcher: Market Cap vs Asset Class */}
          <div className="flex items-center justify-between pt-2 pb-1 gap-2 flex-wrap">
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
              <button
                id="tab-market-cap-btn"
                onClick={() => setAllocationTab('marketCap')}
                className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center space-x-1.5 ${
                  allocationTab === 'marketCap'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Large / Mid / Small</span>
              </button>
              <button
                id="tab-asset-class-btn"
                onClick={() => setAllocationTab('assetClass')}
                className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center space-x-1.5 ${
                  allocationTab === 'assetClass'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Asset Class</span>
              </button>
            </div>

            {/* Sub-controls when in Market Cap mode */}
            {allocationTab === 'marketCap' && (
              <div className="flex items-center space-x-2 text-[11px]">
                {/* Scope selector */}
                <div className="inline-flex rounded-md bg-slate-100 p-0.5 border border-slate-200">
                  <button
                    onClick={() => setMarketCapScope('overall')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      marketCapScope === 'overall'
                        ? 'bg-amber-500 text-white shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Calculate percentages against total portfolio including cash/debt"
                  >
                    Overall Portfolio
                  </button>
                  <button
                    onClick={() => setMarketCapScope('equityOnly')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      marketCapScope === 'equityOnly'
                        ? 'bg-amber-500 text-white shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Normalize to 100% across Equity Large, Mid and Small cap only"
                  >
                    Equity Only
                  </button>
                </div>

                {/* Donut vs Solid toggle */}
                <button
                  onClick={() => setPieStyle(pieStyle === 'donut' ? 'solid' : 'donut')}
                  className="px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-medium transition-colors"
                  title="Toggle Donut or Solid Pie view"
                >
                  {pieStyle === 'donut' ? 'Solid Pie' : 'Donut'}
                </button>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* TAB 1: MARKET CAP PIE (GOLD, ROSE GOLD, PLATINUM, WHITE) */}
          {/* ======================================================== */}
          {allocationTab === 'marketCap' ? (
            <div className="space-y-4 mt-2">
              
              {/* The Metallic Pie Chart Container */}
              <div className="relative h-52 w-full flex items-center justify-center bg-radial from-slate-50/80 to-white rounded-xl border border-amber-100/60 p-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    {/* SVG Metallic Linear Gradients */}
                    <defs>
                      {/* 1. Imperial Champagne Gold */}
                      <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#F6E6B4" />
                        <stop offset="35%" stopColor="#E5C158" />
                        <stop offset="70%" stopColor="#C59B27" />
                        <stop offset="100%" stopColor="#966F12" />
                      </linearGradient>

                      {/* 2. Luminous Rose Gold */}
                      <linearGradient id="roseGoldGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FAD4D8" />
                        <stop offset="35%" stopColor="#D48B96" />
                        <stop offset="70%" stopColor="#B76E79" />
                        <stop offset="100%" stopColor="#7E3F48" />
                      </linearGradient>

                      {/* 3. Platinum / Sterling Silver */}
                      <linearGradient id="platinumGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#F8FAFC" />
                        <stop offset="35%" stopColor="#CBD5E1" />
                        <stop offset="70%" stopColor="#94A3B8" />
                        <stop offset="100%" stopColor="#64748B" />
                      </linearGradient>

                      {/* 4. Subtle Pearl White / Alabaster */}
                      <linearGradient id="pearlWhiteGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="45%" stopColor="#F1F5F9" />
                        <stop offset="80%" stopColor="#E2E8F0" />
                        <stop offset="100%" stopColor="#CBD5E1" />
                      </linearGradient>
                    </defs>

                    <Pie
                      data={marketCapPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={pieStyle === 'donut' ? 48 : 0}
                      outerRadius={74}
                      paddingAngle={pieStyle === 'donut' ? 2.5 : 1}
                      dataKey="value"
                      stroke="#FFFFFF"
                      strokeWidth={2.5}
                      animationDuration={800}
                    >
                      {marketCapPieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fill} 
                          className="hover:opacity-90 transition-opacity cursor-pointer focus:outline-none"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={renderMarketCapTooltip} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Label */}
                {pieStyle === 'donut' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-700/80">
                      Dominant Cap
                    </span>
                    <span className="text-sm font-black text-slate-900 leading-tight">
                      {largeVal >= midVal && largeVal >= smallVal 
                        ? 'Large Cap' 
                        : midVal >= smallVal 
                        ? 'Mid Cap' 
                        : 'Small Cap'}
                    </span>
                    <span className="text-[11px] font-extrabold text-amber-800">
                      {Math.max(largeVal, midVal, smallVal)}%
                    </span>
                  </div>
                )}
              </div>

              {/* 4 Premium Metallic Breakdown Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                
                {/* 1. Large Cap (Golden) */}
                <div className="p-2.5 rounded-xl border border-amber-300/80 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-xs"></span>
                      <span className="text-xs font-bold text-amber-950">Large Cap</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                      Gold
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-base font-black text-amber-950">{largeVal}%</span>
                    {totalCapital > 0 && (
                      <span className="text-[10px] font-bold text-amber-800/80">
                        {formatINR((largeVal / 100) * totalCapital, curr)}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-amber-900/70 mt-0.5 line-clamp-1">
                    Top 100 Bluechips • Stable Anchor
                  </p>
                </div>

                {/* 2. Mid Cap (Rose Gold) */}
                <div className="p-2.5 rounded-xl border border-rose-300/80 bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-rose-300 to-rose-500 shadow-xs"></span>
                      <span className="text-xs font-bold text-rose-950">Mid Cap</span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded">
                      Rose Gold
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-base font-black text-rose-950">{midVal}%</span>
                    {totalCapital > 0 && (
                      <span className="text-[10px] font-bold text-rose-800/80">
                        {formatINR((midVal / 100) * totalCapital, curr)}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-rose-900/70 mt-0.5 line-clamp-1">
                    101–250 Rank • High Growth
                  </p>
                </div>

                {/* 3. Small Cap (Platinum / Silver) */}
                <div className="p-2.5 rounded-xl border border-slate-300 bg-gradient-to-br from-slate-50 via-white to-slate-100/60 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 shadow-xs"></span>
                      <span className="text-xs font-bold text-slate-800">Small Cap</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-200/80 px-1.5 py-0.5 rounded">
                      Silver
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-base font-black text-slate-900">{smallVal}%</span>
                    {totalCapital > 0 && (
                      <span className="text-[10px] font-bold text-slate-600">
                        {formatINR((smallVal / 100) * totalCapital, curr)}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                    251+ Emerging • High Alpha
                  </p>
                </div>

                {/* 4. Cash & Debt (Subtle Pearl White) */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-400/60 shadow-xs"></span>
                      <span className="text-xs font-bold text-slate-700">Cash / Debt</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      Pearl White
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-base font-black text-slate-800">{cashVal}%</span>
                    {totalCapital > 0 && (
                      <span className="text-[10px] font-bold text-slate-500">
                        {formatINR((cashVal / 100) * totalCapital, curr)}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    Defensive Cushion & Yield
                  </p>
                </div>

              </div>

              {/* Metallic Barbell Balance Gauge */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="font-semibold text-slate-600 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                    <span>Stability: <strong className="text-amber-900">{largeVal}%</strong></span>
                  </span>
                  <span className="font-semibold text-slate-600">
                    Growth Alpha (Mid+Small): <strong className="text-rose-900">{(midVal + smallVal).toFixed(1)}%</strong>
                  </span>
                </div>

                {/* Segmented Gradient Bar */}
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ 
                      width: `${largeVal}%`, 
                      background: 'linear-gradient(90deg, #F6E6B4, #C59B27)' 
                    }}
                    title={`Large Cap: ${largeVal}%`}
                  />
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ 
                      width: `${midVal}%`, 
                      background: 'linear-gradient(90deg, #FAD4D8, #B76E79)' 
                    }}
                    title={`Mid Cap: ${midVal}%`}
                  />
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ 
                      width: `${smallVal}%`, 
                      background: 'linear-gradient(90deg, #CBD5E1, #94A3B8)' 
                    }}
                    title={`Small Cap: ${smallVal}%`}
                  />
                  {cashVal > 0 && (
                    <div 
                      className="h-full transition-all duration-300"
                      style={{ 
                        width: `${cashVal}%`, 
                        background: '#E2E8F0' 
                      }}
                      title={`Cash/Debt: ${cashVal}%`}
                    />
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* ======================================================== */
            /* TAB 2: ASSET ALLOCATION DONUT (EQUITY, DEBT, CASH)      */
            /* ======================================================== */
            <div className="space-y-4 mt-2">
              <div className="h-52 w-full relative flex items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100 p-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    >
                      {assetData.map((entry, index) => (
                        <Cell key={`asset-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, '']}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '8px',
                        color: '#FFF',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Equity Asset</span>
                  <span className="text-base font-black text-slate-900">{analytics.assetAllocation.equity}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                {assetData.map((item) => (
                  <div key={item.name} className="flex items-center space-x-2 text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 truncate">{item.name}</span>
                    <span className="font-bold text-slate-900 ml-auto">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Regulatory / Methodology Note */}
        <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
          <span>SEBI Categorization: AMFI Semiannual Review</span>
          <span className="font-semibold text-slate-500">Weight-Adjusted</span>
        </div>

      </div>

    </div>
  );
};
