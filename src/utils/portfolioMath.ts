import { Benchmark, MarketCapBreakup, PortfolioAnalytics, PortfolioItem } from '../types';

export const RISK_FREE_RATE = 6.5; // 6.5% standard Indian RBI Repo / 91-Day T-Bill

export function calculatePortfolioAnalytics(
  items: PortfolioItem[],
  benchmark: Benchmark,
  totalClientInvestment: number
): PortfolioAnalytics {
  const totalAllocatedAmount = items.reduce((sum, item) => sum + (item.allocationAmount || 0), 0);
  const totalAllocatedPercent = items.reduce((sum, item) => sum + (item.allocationPercent || 0), 0);

  // If no allocation yet, return zeroed analytics
  if (items.length === 0 || totalAllocatedAmount <= 0) {
    return {
      totalAllocatedPercent: 0,
      totalAllocatedAmount: 0,
      returns: { m1: null, m3: null, m6: null, y1: null, y2: null, y3: null, y5: null, y7: null, y10: null },
      rollingMetrics: { min: 0, max: 0, average: 0, median: 0 },
      risk: { sharpe: 0, sortino: 0, standardDeviation: 0, beta: 1, alpha: 0, maxDrawdown: 0, treynor: 0 },
      sectorBreakup: [],
      marketCap: { largeCap: 0, midCap: 0, smallCap: 0, cashDebt: 100 },
      assetAllocation: { equity: 0, debt: 0, hybrid: 0, commodity: 0, cash: 100 },
      topHoldings: [],
    };
  }

  // Calculate normalized weights (sum to 1)
  const normalizedItems = items.map((item) => ({
    ...item,
    weight: item.allocationAmount / totalAllocatedAmount,
  }));

  // 1. Weighted Trailing Returns (Excluding schemes without ageing from weight calculation)
  const periods = ['m1', 'm3', 'm6', 'y1', 'y2', 'y3', 'y5', 'y7', 'y10'] as const;
  const returns = {} as PortfolioAnalytics['returns'];

  for (const period of periods) {
    // Filter to items that have valid ageing data for this period
    const eligibleItems = normalizedItems.filter((item) => {
      const ret = item.fund.returns?.[period];
      return ret !== null && ret !== undefined && !isNaN(ret);
    });

    if (eligibleItems.length === 0) {
      returns[period] = null;
      continue;
    }

    // Sum of eligible weights
    const totalEligibleWeight = eligibleItems.reduce((acc, curr) => acc + curr.weight, 0);

    if (totalEligibleWeight <= 0) {
      returns[period] = null;
      continue;
    }

    // Re-normalize weights among eligible items so excluded items' weights are not considered
    const weightedRet = eligibleItems.reduce((acc, curr) => {
      const fundRet = curr.fund.returns[period] as number;
      const normalizedWeight = curr.weight / totalEligibleWeight;
      return acc + fundRet * normalizedWeight;
    }, 0);

    returns[period] = Number(weightedRet.toFixed(2));
  }

  // 2. Rolling Metrics (Average, Max, Min, Median)
  const itemsWithRolling = normalizedItems.filter((c) => {
    return c.fund.rollingMetrics != null || (c.fund.returns.y3 !== null || c.fund.returns.y1 !== null);
  });
  const totalRollingWeight = itemsWithRolling.reduce((acc, c) => acc + c.weight, 0);

  const getMetric = (extractor: (item: typeof normalizedItems[0]) => number): number => {
    if (itemsWithRolling.length === 0 || totalRollingWeight <= 0) return 0;
    const val = itemsWithRolling.reduce((acc, c) => {
      const itemVal = extractor(c);
      return acc + itemVal * (c.weight / totalRollingWeight);
    }, 0);
    return Number(val.toFixed(2));
  };

  const rollingMetrics = {
    min: getMetric((c) => c.fund.rollingMetrics?.min ?? (c.fund.returns.y1 ?? 0) * 0.7),
    max: getMetric((c) => c.fund.rollingMetrics?.max ?? (c.fund.returns.y1 ?? 15) * 1.4),
    average: getMetric((c) => c.fund.rollingMetrics?.average ?? c.fund.returns.y3 ?? c.fund.returns.y1 ?? 12),
    median: getMetric((c) => c.fund.rollingMetrics?.median ?? c.fund.returns.y3 ?? c.fund.returns.y1 ?? 12),
  };

  // 3. Risk Metrics with Portfolio Diversification Benefit
  // Standard Deviation accounting for correlation benefit
  let varianceSum = 0;
  for (let i = 0; i < normalizedItems.length; i++) {
    for (let j = 0; j < normalizedItems.length; j++) {
      const w1 = normalizedItems[i].weight;
      const w2 = normalizedItems[j].weight;
      const sd1 = normalizedItems[i].fund.risk.standardDeviation;
      const sd2 = normalizedItems[j].fund.risk.standardDeviation;
      
      let corr = 1.0;
      if (i !== j) {
        const a1 = normalizedItems[i].fund.assetClass;
        const a2 = normalizedItems[j].fund.assetClass;
        if (a1 === 'Debt' && a2 === 'Equity') corr = 0.15;
        else if (a1 === 'Equity' && a2 === 'Debt') corr = 0.15;
        else if (a1 === 'Hybrid' || a2 === 'Hybrid') corr = 0.55;
        else corr = 0.72; // inter-equity correlation
      }
      varianceSum += w1 * w2 * sd1 * sd2 * corr;
    }
  }
  const portfolioSD = Math.sqrt(Math.max(0.1, varianceSum));

  const weightedBeta = normalizedItems.reduce((acc, c) => acc + c.fund.risk.beta * c.weight, 0);
  const weightedMaxDD = normalizedItems.reduce((acc, c) => acc + c.fund.risk.maxDrawdown * c.weight, 0);

  // Return base for Sharpe & Sortino (fall back to y1, m6 if y3 is not aged yet)
  const baseReturn = returns.y3 ?? returns.y1 ?? returns.m6 ?? 12.0;
  const sharpe = portfolioSD > 0 ? (baseReturn - RISK_FREE_RATE) / portfolioSD : 0;
  
  // Sortino (using downside dev ~ 0.65 * SD for equities, 0.4 for hybrid/debt)
  const downsideDeviation = portfolioSD * 0.68;
  const sortino = downsideDeviation > 0 ? (baseReturn - RISK_FREE_RATE) / downsideDeviation : 0;
  
  // Alpha vs selected benchmark
  const benchmarkBaseReturn = benchmark.returns.y3 ?? benchmark.returns.y1 ?? benchmark.returns.m6 ?? 12.0;
  const expectedReturnCapm = RISK_FREE_RATE + weightedBeta * (benchmarkBaseReturn - RISK_FREE_RATE);
  const alpha = baseReturn - expectedReturnCapm;

  const treynor = weightedBeta > 0 ? (baseReturn - RISK_FREE_RATE) / weightedBeta : 0;

  const risk = {
    sharpe: Number(sharpe.toFixed(2)),
    sortino: Number(sortino.toFixed(2)),
    standardDeviation: Number(portfolioSD.toFixed(2)),
    beta: Number(weightedBeta.toFixed(2)),
    alpha: Number(alpha.toFixed(2)),
    maxDrawdown: Number(weightedMaxDD.toFixed(2)),
    treynor: Number(treynor.toFixed(2)),
  };

  // 4. Sector Breakdown vs Benchmark
  const sectorMap = new Map<string, number>();
  normalizedItems.forEach((item) => {
    item.fund.sectors.forEach((sec) => {
      const current = sectorMap.get(sec.sector) || 0;
      sectorMap.set(sec.sector, current + sec.weight * item.weight);
    });
  });

  // Also include any benchmark sectors not in portfolio
  benchmark.sectors.forEach((sec) => {
    if (!sectorMap.has(sec.sector)) {
      sectorMap.set(sec.sector, 0);
    }
  });

  const benchmarkSectorMap = new Map<string, number>();
  benchmark.sectors.forEach((s) => benchmarkSectorMap.set(s.sector, s.weight));

  const sectorBreakup = Array.from(sectorMap.entries())
    .map(([sector, portWeight]) => {
      const bWeight = benchmarkSectorMap.get(sector) || 0;
      const pWeight = Number(portWeight.toFixed(2));
      return {
        sector,
        portfolioWeight: pWeight,
        benchmarkWeight: Number(bWeight.toFixed(2)),
        activeWeight: Number((pWeight - bWeight).toFixed(2)),
      };
    })
    .sort((a, b) => b.portfolioWeight - a.portfolioWeight);

  // 5. Market Cap Breakup
  const marketCap: MarketCapBreakup = {
    largeCap: Number(normalizedItems.reduce((acc, c) => acc + c.fund.marketCap.largeCap * c.weight, 0).toFixed(1)),
    midCap: Number(normalizedItems.reduce((acc, c) => acc + c.fund.marketCap.midCap * c.weight, 0).toFixed(1)),
    smallCap: Number(normalizedItems.reduce((acc, c) => acc + c.fund.marketCap.smallCap * c.weight, 0).toFixed(1)),
    cashDebt: Number(normalizedItems.reduce((acc, c) => acc + c.fund.marketCap.cashDebt * c.weight, 0).toFixed(1)),
  };

  // 6. Asset Allocation
  const assetAllocation = {
    equity: 0,
    debt: 0,
    hybrid: 0,
    commodity: 0,
    cash: 0,
  };
  normalizedItems.forEach((item) => {
    const ac = item.fund.assetClass;
    if (ac === 'Equity') {
      assetAllocation.equity += item.weight * (100 - item.fund.marketCap.cashDebt);
      assetAllocation.cash += item.weight * item.fund.marketCap.cashDebt;
    } else if (ac === 'Debt') {
      assetAllocation.debt += item.weight * 100;
    } else if (ac === 'Hybrid') {
      assetAllocation.hybrid += item.weight * 40;
      assetAllocation.equity += item.weight * 35;
      assetAllocation.debt += item.weight * 25;
    } else {
      assetAllocation.cash += item.weight * 100;
    }
  });

  // Normalize asset allocation to 100%
  const totalAssets = assetAllocation.equity + assetAllocation.debt + assetAllocation.hybrid + assetAllocation.commodity + assetAllocation.cash;
  if (totalAssets > 0) {
    assetAllocation.equity = Number(((assetAllocation.equity / totalAssets) * 100).toFixed(1));
    assetAllocation.debt = Number(((assetAllocation.debt / totalAssets) * 100).toFixed(1));
    assetAllocation.hybrid = Number(((assetAllocation.hybrid / totalAssets) * 100).toFixed(1));
    assetAllocation.commodity = Number(((assetAllocation.commodity / totalAssets) * 100).toFixed(1));
    assetAllocation.cash = Number((100 - (assetAllocation.equity + assetAllocation.debt + assetAllocation.hybrid + assetAllocation.commodity)).toFixed(1));
  }

  // 7. Consolidated Top 10 Stock Holdings
  const stockMap = new Map<string, { sector: string; combinedWeight: number; heldInFunds: Set<string> }>();

  normalizedItems.forEach((item) => {
    item.fund.topHoldings.forEach((stock) => {
      const existing = stockMap.get(stock.name);
      const effectiveWeight = stock.weight * item.weight;
      if (existing) {
        existing.combinedWeight += effectiveWeight;
        existing.heldInFunds.add(item.fund.shortName);
      } else {
        stockMap.set(stock.name, {
          sector: stock.sector,
          combinedWeight: effectiveWeight,
          heldInFunds: new Set([item.fund.shortName]),
        });
      }
    });
  });

  const topHoldings = Array.from(stockMap.entries())
    .map(([name, data]) => {
      const weight = Number(data.combinedWeight.toFixed(2));
      const amount = Math.round((weight / 100) * totalClientInvestment);
      return {
        name,
        sector: data.sector,
        combinedWeight: weight,
        amount,
        fundCount: data.heldInFunds.size,
        heldInFunds: Array.from(data.heldInFunds),
      };
    })
    .sort((a, b) => b.combinedWeight - a.combinedWeight)
    .slice(0, 10);

  return {
    totalAllocatedPercent: Number(totalAllocatedPercent.toFixed(1)),
    totalAllocatedAmount: Math.round(totalAllocatedAmount),
    returns,
    rollingMetrics,
    risk,
    sectorBreakup,
    marketCap,
    assetAllocation,
    topHoldings,
  };
}

export function formatINR(val: number, currency: 'INR' | 'USD' = 'INR'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  }
  
  if (Math.abs(val) >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(val) >= 100000) {
    return `₹${(val / 100000).toFixed(2)} Lakh`;
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}
