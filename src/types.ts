export type ProductType = 'Mutual Fund' | 'PMS' | 'AIF' | 'Debt / Liquid';

export type AssetClass = 'Equity' | 'Debt' | 'Hybrid' | 'Commodity' | 'Cash';

export interface HoldingStock {
  name: string;
  ticker?: string;
  sector: string;
  weight: number; // percentage in fund
}

export interface SectorWeight {
  sector: string;
  weight: number; // percentage
}

export interface MarketCapBreakup {
  largeCap: number; // %
  midCap: number;   // %
  smallCap: number; // %
  cashDebt: number; // %
}

export type PeriodKey = 'm1' | 'm3' | 'm6' | 'y1' | 'y2' | 'y3' | 'y5' | 'y7' | 'y10';

export interface TrailingReturns {
  m1: number | null;
  m3: number | null;
  m6: number | null;
  y1: number | null;
  y2: number | null;
  y3: number | null;
  y5: number | null;
  y7: number | null;
  y10: number | null;
}

export interface FundProduct {
  id: string;
  code: string; // AMFI Code or APMI Reg ID
  name: string;
  shortName: string;
  type: ProductType;
  serviceType?: 'Discretionary' | 'Non-Discretionary' | 'Advisory';
  category: string;
  assetClass: AssetClass;
  amc: string;
  source: 'AMFI' | 'APMI' | 'Custom';
  aumCr: number; // in ₹ Crores
  expenseRatio: number; // %
  nav?: number;
  navDate?: string;
  lastSyncedAt?: string;
  
  // Trailing Returns in % (null if scheme lacks ageing)
  returns: TrailingReturns;

  // Historical Rolling Returns Analytics
  rollingMetrics?: {
    min: number;
    max: number;
    average: number;
    median: number;
  };

  // Risk Parameters
  risk: {
    sharpe: number;
    sortino: number;
    standardDeviation: number; // annualized volatility %
    beta: number;
    alpha: number;
    maxDrawdown: number;
    treynor: number;
  };

  // Sectoral Allocation
  sectors: SectorWeight[];

  // Market Cap
  marketCap: MarketCapBreakup;

  // Top 10 Holdings
  topHoldings: HoldingStock[];
}

export interface BenchmarkVerificationMeta {
  proxySchemeCode?: number;
  proxySchemeName?: string;
  methodology?: string;
  sourcePortal?: string;
  asOfDateLatest?: string;
  asOfDateApmi?: string;
  navLatest?: number;
  navApmi?: number;
}

export interface Benchmark {
  id: string;
  name: string;
  code: string;
  returns: TrailingReturns;
  alignedReturns?: {
    apmiAligned: TrailingReturns;
    latest: TrailingReturns;
  };
  verificationMeta?: BenchmarkVerificationMeta;
  rollingMetrics: {
    min: number;
    max: number;
    average: number;
    median: number;
  };
  risk: {
    sharpe: number;
    sortino: number;
    standardDeviation: number;
    beta: number;
    alpha: number;
    maxDrawdown: number;
    treynor: number;
  };
  sectors: SectorWeight[];
  marketCap: MarketCapBreakup;
  topHoldings: HoldingStock[];
}

export interface PortfolioItem {
  fund: FundProduct;
  allocationPercent: number; // e.g. 20 for 20%
  allocationAmount: number;  // e.g. 200000
}

export interface ClientProfile {
  clientName: string;
  advisorName: string;
  proposalDate: string;
  totalInvestment: number;
  currency: 'INR' | 'USD';
  riskProfile: 'Conservative' | 'Moderately Conservative' | 'Balanced' | 'Growth' | 'Aggressive';
  investmentHorizonYears: number;
  monthlySip: number;
  executiveSummary: string;
}

export interface PortfolioAnalytics {
  totalAllocatedPercent: number;
  totalAllocatedAmount: number;
  returns: TrailingReturns;
  rollingMetrics: {
    min: number;
    max: number;
    average: number;
    median: number;
  };
  risk: {
    sharpe: number;
    sortino: number;
    standardDeviation: number;
    beta: number;
    alpha: number;
    maxDrawdown: number;
    treynor: number;
  };
  sectorBreakup: {
    sector: string;
    portfolioWeight: number;
    benchmarkWeight: number;
    activeWeight: number;
  }[];
  marketCap: MarketCapBreakup;
  assetAllocation: {
    equity: number;
    debt: number;
    hybrid: number;
    commodity: number;
    cash: number;
  };
  topHoldings: {
    name: string;
    sector: string;
    combinedWeight: number;
    amount: number;
    fundCount: number;
    heldInFunds: string[];
  }[];
}

export interface MonteCarloResult {
  years: number[];
  p10: number[]; // 10th percentile (conservative)
  p25: number[];
  p50: number[]; // 50th percentile (median)
  p75: number[];
  p90: number[]; // 90th percentile (optimistic)
  expectedMean: number[];
  finalValues: {
    p10: number;
    p50: number;
    p90: number;
    mean: number;
  };
  lossProbability: number;
  inflationBeatProbability: number;
  projectedCagrP50: number;
}

export interface DataSourcesStatus {
  status: string;
  amfi: {
    provider: string;
    portalUrl: string;
    apiUrl: string;
    active: boolean;
    coverage: string;
    latestNavFeed: string;
    navAllUrl: string;
  };
  apmi: {
    provider: string;
    portalUrl: string;
    active: boolean;
    coverage: string;
    asOnDate: string;
    cachedCount: number;
    pmsCount?: number;
    aifCount?: number;
    lastSyncedAt: string | null;
    isFetching: boolean;
  };
}

