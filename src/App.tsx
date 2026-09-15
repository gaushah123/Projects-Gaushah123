import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Benchmark, 
  ClientProfile, 
  FundProduct, 
  PortfolioItem 
} from './types';
import { BENCHMARKS, PRELOADED_FUNDS } from './data/fundsData';
import { calculatePortfolioAnalytics } from './utils/portfolioMath';
import { runMonteCarloSimulation } from './utils/monteCarlo';
import { exportProposalPptx } from './utils/exportPptx';
import { captureAndDownloadElement } from './utils/chartCapture';

import { Header } from './components/Header';
import { ClientConfigBar } from './components/ClientConfigBar';
import { ProductManager } from './components/ProductManager';
import { TrailingReturnsSection } from './components/TrailingReturnsSection';
import { RiskMetricsSection } from './components/RiskMetricsSection';
import { SectorAndAllocationSection } from './components/SectorAndAllocationSection';
import { TopHoldingsSection } from './components/TopHoldingsSection';
import { MonteCarloSection } from './components/MonteCarloSection';
import { AiRationaleModal } from './components/AiRationaleModal';
import { ExportModal } from './components/ExportModal';

export default function App() {
  // 1. Client Profile State
  const [client, setClient] = useState<ClientProfile>({
    clientName: 'Ramesh Shah',
    advisorName: 'WealthCraft Advisory Services',
    totalInvestment: 5000000, // 50 Lakhs INR
    currency: 'INR',
    riskProfile: 'Growth',
    investmentHorizonYears: 10,
    monthlySip: 25000,
    executiveSummary: 'This portfolio proposal for Ramesh Shah is tailored for a Growth risk mandate. It combines top-tier AMFI-registered flexi-cap and mid-cap mutual funds with an APMI-disclosed high-conviction PMS strategy to maximize risk-adjusted alpha over NIFTY 500 TRI with disciplined downside protection.',
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  });

  // 2. Benchmarks State (loaded with verified NSE & AMFI TRI data)
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>(BENCHMARKS);
  const [selectedBenchmark, setSelectedBenchmark] = useState<Benchmark>(
    BENCHMARKS.find((b) => b.id === 'nifty-500-tri') || BENCHMARKS[0]
  );

  // Sync latest benchmark quotations and returns from official NSE India & AMFI API
  useEffect(() => {
    let isMounted = true;
    async function loadFreshBenchmarks() {
      try {
        const res = await fetch('/api/benchmarks');
        if (res.ok) {
          const data = await res.json();
          if (data.benchmarks && Array.isArray(data.benchmarks) && isMounted) {
            setBenchmarks(data.benchmarks);
            setSelectedBenchmark((prev) => {
              const fresh = data.benchmarks.find((b: Benchmark) => b.id === prev.id);
              return fresh || prev;
            });
          }
        }
      } catch (e) {
        console.warn('Could not sync live benchmarks, using verified fallback:', e);
      }
    }
    loadFreshBenchmarks();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Allocation Input Mode (% vs Absolute Currency)
  const [allocationMode, setAllocationMode] = useState<'percent' | 'absolute'>('percent');

  // 4. Initial Portfolio Items (default high-alpha balanced mix)
  const [items, setItems] = useState<PortfolioItem[]>(() => {
    const f1 = PRELOADED_FUNDS.find((f) => f.id === 'ppfc-amfi-122639') || PRELOADED_FUNDS[0];
    const f2 = PRELOADED_FUNDS.find((f) => f.id === 'whiteoak-pms-apmi-01') || PRELOADED_FUNDS[4];
    const f3 = PRELOADED_FUNDS.find((f) => f.id === 'mirae-large-mid-120012') || PRELOADED_FUNDS[1];
    const f4 = PRELOADED_FUNDS.find((f) => f.id === 'hdfc-short-term-101234') || PRELOADED_FUNDS[7];

    return [
      { fund: f1, allocationPercent: 35, allocationAmount: 1750000 },
      { fund: f2, allocationPercent: 25, allocationAmount: 1250000 },
      { fund: f3, allocationPercent: 25, allocationAmount: 1250000 },
      { fund: f4, allocationPercent: 15, allocationAmount: 750000 },
    ];
  });

  // 5. Modal states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGeneratingPpt, setIsGeneratingPpt] = useState(false);

  // Synchronize client updates
  const handleUpdateClient = useCallback((updates: Partial<ClientProfile>) => {
    setClient((prev) => {
      const updated = { ...prev, ...updates };
      // If total capital changes, update items allocation amounts
      if (updates.totalInvestment && updates.totalInvestment !== prev.totalInvestment) {
        setItems((currentItems) =>
          currentItems.map((item) => ({
            ...item,
            allocationAmount: Math.round((item.allocationPercent / 100) * (updates.totalInvestment || prev.totalInvestment)),
          }))
        );
      }
      return updated;
    });
  }, []);

  // Update allocation for a single product (syncing % and Amount)
  const handleUpdateAllocation = useCallback((fundId: string, value: number, mode: 'percent' | 'absolute') => {
    setItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.fund.id !== fundId) return item;

        if (mode === 'percent') {
          const clampedPercent = Math.max(0, Math.min(100, value));
          const amount = Math.round((clampedPercent / 100) * client.totalInvestment);
          return { ...item, allocationPercent: clampedPercent, allocationAmount: amount };
        } else {
          const clampedAmount = Math.max(0, value);
          const percent = client.totalInvestment > 0 
            ? Number(((clampedAmount / client.totalInvestment) * 100).toFixed(1))
            : 0;
          return { ...item, allocationAmount: clampedAmount, allocationPercent: percent };
        }
      });
    });
  }, [client.totalInvestment]);

  // Add Product to portfolio
  const handleAddProduct = useCallback((fund: FundProduct, initialPercent: number = 10) => {
    setItems((prevItems) => {
      if (prevItems.some((i) => i.fund.id === fund.id)) return prevItems;

      const newAmount = Math.round((initialPercent / 100) * client.totalInvestment);
      return [...prevItems, { fund, allocationPercent: initialPercent, allocationAmount: newAmount }];
    });
  }, [client.totalInvestment]);

  // Remove product
  const handleRemoveProduct = useCallback((fundId: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.fund.id !== fundId));
  }, []);

  // Equal Weighting across all selected products
  const handleEqualWeight = useCallback(() => {
    if (items.length === 0) return;
    const equalPct = Number((100 / items.length).toFixed(1));
    setItems((prevItems) =>
      prevItems.map((item, idx) => {
        const pct = idx === prevItems.length - 1 
          ? Number((100 - equalPct * (prevItems.length - 1)).toFixed(1))
          : equalPct;
        return {
          ...item,
          allocationPercent: pct,
          allocationAmount: Math.round((pct / 100) * client.totalInvestment),
        };
      })
    );
  }, [items.length, client.totalInvestment]);

  // Normalize current weights to exactly 100%
  const handleNormalizeTo100 = useCallback(() => {
    const currentSum = items.reduce((acc, i) => acc + i.allocationPercent, 0);
    if (currentSum <= 0) return;

    setItems((prevItems) => {
      let accumulated = 0;
      return prevItems.map((item, idx) => {
        if (idx === prevItems.length - 1) {
          const finalPct = Number((100 - accumulated).toFixed(1));
          return {
            ...item,
            allocationPercent: Math.max(0, finalPct),
            allocationAmount: Math.round((Math.max(0, finalPct) / 100) * client.totalInvestment),
          };
        }
        const scaledPct = Number(((item.allocationPercent / currentSum) * 100).toFixed(1));
        accumulated += scaledPct;
        return {
          ...item,
          allocationPercent: scaledPct,
          allocationAmount: Math.round((scaledPct / 100) * client.totalInvestment),
        };
      });
    });
  }, [items, client.totalInvestment]);

  // Update single fund data in portfolio (e.g. after live AMFI / APMI sync)
  const handleUpdateFund = useCallback((updatedFund: FundProduct) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.fund.id === updatedFund.id) {
          return { ...item, fund: updatedFund };
        }
        return item;
      })
    );
  }, []);

  // Quick preset loading
  const handleLoadPreset = useCallback((presetName: string) => {
    let newSelection: { id: string; pct: number }[] = [];

    if (presetName === 'growth') {
      newSelection = [
        { id: 'ppfc-amfi-122639', pct: 35 },
        { id: 'mirae-large-mid-120012', pct: 25 },
        { id: 'nippon-smallcap-118778', pct: 15 },
        { id: 'whiteoak-pms-apmi-01', pct: 15 },
        { id: 'hdfc-short-term-101234', pct: 10 },
      ];
      handleUpdateClient({ riskProfile: 'Growth' });
    } else if (presetName === 'pms') {
      newSelection = [
        { id: 'whiteoak-pms-apmi-01', pct: 35 },
        { id: 'marcellus-cc-apmi-02', pct: 25 },
        { id: 'ppfc-amfi-122639', pct: 20 },
        { id: 'motilal-ntdop-apmi-03', pct: 10 },
        { id: 'hdfc-short-term-101234', pct: 10 },
      ];
      handleUpdateClient({ riskProfile: 'Aggressive' });
    } else {
      // Balanced
      newSelection = [
        { id: 'icici-baf-120152', pct: 40 },
        { id: 'ppfc-amfi-122639', pct: 25 },
        { id: 'hdfc-short-term-101234', pct: 25 },
        { id: 'nippon-smallcap-118778', pct: 10 },
      ];
      handleUpdateClient({ riskProfile: 'Balanced' });
    }

    const newItems: PortfolioItem[] = [];
    newSelection.forEach(({ id, pct }) => {
      const fund = PRELOADED_FUNDS.find((f) => f.id === id);
      if (fund) {
        newItems.push({
          fund,
          allocationPercent: pct,
          allocationAmount: Math.round((pct / 100) * client.totalInvestment),
        });
      }
    });

    setItems(newItems);
  }, [client.totalInvestment, handleUpdateClient]);

  // Reset to initial default
  const handleResetToDefault = useCallback(() => {
    handleLoadPreset('growth');
  }, [handleLoadPreset]);

  // Total allocated calculations
  const totalAllocatedPercent = useMemo(() => {
    return Number(items.reduce((acc, i) => acc + i.allocationPercent, 0).toFixed(1));
  }, [items]);

  const totalAllocatedAmount = useMemo(() => {
    return items.reduce((acc, i) => acc + i.allocationAmount, 0);
  }, [items]);

  // Portfolio Analytics Engine
  const analytics = useMemo(() => {
    return calculatePortfolioAnalytics(items, selectedBenchmark, client.totalInvestment);
  }, [items, selectedBenchmark, client.totalInvestment]);

  // Export to PowerPoint (.pptx)
  const handleExportPpt = async () => {
    setIsGeneratingPpt(true);
    try {
      const mcResult = runMonteCarloSimulation({
        initialCapital: client.totalInvestment,
        monthlySip: client.monthlySip,
        horizonYears: client.investmentHorizonYears,
        expectedAnnualReturnPercent: analytics.returns.y3 || 15.0,
        annualVolatilityPercent: analytics.risk.standardDeviation || 13.5,
        inflationRatePercent: 6.0,
        numSimulations: 1000,
      });

      await exportProposalPptx(
        client,
        items,
        analytics,
        selectedBenchmark,
        mcResult
      );
    } catch (err) {
      console.error('Failed to export PPTX:', err);
    } finally {
      setIsGeneratingPpt(false);
    }
  };

  // Capture specific chart image
  const handleCaptureChart = (elementId: string, filename: string) => {
    captureAndDownloadElement(elementId, filename);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased">
      
      {/* 1. Top Navigation Bar */}
      <Header
        client={client}
        onUpdateClient={handleUpdateClient}
        selectedBenchmark={selectedBenchmark}
        onSelectBenchmark={setSelectedBenchmark}
        benchmarks={benchmarks}
        onExportPpt={handleExportPpt}
        onExportImages={() => setIsExportModalOpen(true)}
        onOpenAiRationale={() => setIsAiModalOpen(true)}
        onLoadPreset={handleLoadPreset}
        onResetToDefault={handleResetToDefault}
        isGeneratingPpt={isGeneratingPpt}
      />

      {/* 2. Client Parameter & Allocation Mode Ribbon */}
      <ClientConfigBar
        client={client}
        onUpdateClient={handleUpdateClient}
        allocationMode={allocationMode}
        onToggleAllocationMode={setAllocationMode}
        totalAllocatedPercent={totalAllocatedPercent}
        totalAllocatedAmount={totalAllocatedAmount}
        onNormalizeTo100={handleNormalizeTo100}
      />

      {/* 3. Main Application Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Product Manager & Selection */}
        <ProductManager
          items={items}
          totalCapital={client.totalInvestment}
          currency={client.currency}
          allocationMode={allocationMode}
          onUpdateAllocation={handleUpdateAllocation}
          onRemoveProduct={handleRemoveProduct}
          onAddProduct={handleAddProduct}
          onUpdateFund={handleUpdateFund}
          onEqualWeight={handleEqualWeight}
        />

        {/* Trailing Returns vs Selected Benchmark & Rolling Statistics */}
        <TrailingReturnsSection
          analytics={analytics}
          benchmark={selectedBenchmark}
          benchmarks={benchmarks}
          currency={client.currency}
          onSelectBenchmark={setSelectedBenchmark}
          onCaptureChart={handleCaptureChart}
        />

        {/* Quantitative Risk Scorecard (Sharpe, Sortino, Std Dev, Beta, Alpha) */}
        <RiskMetricsSection
          analytics={analytics}
          benchmark={selectedBenchmark}
        />

        {/* Sectoral Breakdown vs Benchmark, Asset Allocation & Market Cap */}
        <SectorAndAllocationSection
          analytics={analytics}
          benchmark={selectedBenchmark}
          totalCapital={client.totalInvestment}
          currency={client.currency}
          onCaptureChart={handleCaptureChart}
        />

        {/* Top 10 Consolidated Portfolio Holdings with Fund Overlap */}
        <TopHoldingsSection
          analytics={analytics}
          currency={client.currency}
          onCaptureChart={handleCaptureChart}
        />

        {/* Long-Term Monte Carlo Simulation & Stochastic Predictive Analytics */}
        <MonteCarloSection
          client={client}
          analytics={analytics}
          onCaptureChart={handleCaptureChart}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>WealthCraft Institutional Portfolio Builder • AMFI & APMI Disclosed Data Engine</span>
          <span>Standardized Risk-Free Rate: 6.50% (91-day T-Bill) • Benchmark: {selectedBenchmark.name}</span>
        </div>
      </footer>

      {/* AI Proposal Notes Modal */}
      <AiRationaleModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        client={client}
        onUpdateClient={handleUpdateClient}
        analytics={analytics}
        benchmark={selectedBenchmark}
        items={items}
      />

      {/* Image & PPT Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportPpt={handleExportPpt}
        isGeneratingPpt={isGeneratingPpt}
      />

    </div>
  );
}
