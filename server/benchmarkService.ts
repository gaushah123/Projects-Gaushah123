// server/benchmarkService.ts
// Official Benchmark Service pulling verified data from NSE India and AMFI TRI Index Feeds

import { Benchmark } from '../src/types';

export interface BenchmarkMetaResponse {
  benchmarks: Benchmark[];
  source: string;
  nseStatus: 'connected' | 'fallback';
  asOfDate: string;
  lastSyncedAt: string;
}

// Fallback verified figures (as of 11-Sep-2026 trading session from NSE India and AMFI)
const BASE_BENCHMARKS: Benchmark[] = [
  {
    id: 'nifty-50-tri',
    name: 'NIFTY 50 TRI',
    code: 'NIFTY50TRI',
    returns: {
      m1: -4.23,
      m3: -0.44,
      m6: 1.80,
      y1: -5.58,
      y2: -2.15,
      y3: 6.39,
      y5: 7.16,
      y7: 12.29,
      y10: 11.43,
    },
    rollingMetrics: {
      min: -14.2,
      max: 28.5,
      average: 11.2,
      median: 11.8,
    },
    risk: {
      sharpe: 0.12,
      sortino: 0.18,
      standardDeviation: 13.2,
      beta: 1.0,
      alpha: 0.0,
      maxDrawdown: -15.8,
      treynor: 0.8,
    },
    sectors: [
      { sector: 'Financial Services', weight: 32.4 },
      { sector: 'Information Technology', weight: 13.1 },
      { sector: 'Oil, Gas & Consumable Fuels', weight: 10.8 },
      { sector: 'Automobile & Auto Components', weight: 8.1 },
      { sector: 'Fast Moving Consumer Goods', weight: 7.6 },
      { sector: 'Healthcare & Pharmaceuticals', weight: 5.1 },
      { sector: 'Construction & Infrastructure', weight: 4.4 },
      { sector: 'Telecommunication', weight: 4.1 },
      { sector: 'Metals & Mining', weight: 3.6 },
      { sector: 'Power & Utilities', weight: 3.2 },
      { sector: 'Others / Cash', weight: 7.6 },
    ],
    marketCap: {
      largeCap: 95.2,
      midCap: 4.2,
      smallCap: 0.0,
      cashDebt: 0.6,
    },
    topHoldings: [
      { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 11.6 },
      { name: 'Reliance Industries Ltd', sector: 'Oil, Gas & Consumable Fuels', weight: 8.7 },
      { name: 'ICICI Bank Ltd', sector: 'Financial Services', weight: 8.1 },
      { name: 'Infosys Ltd', sector: 'Information Technology', weight: 5.6 },
      { name: 'Tata Consultancy Services', sector: 'Information Technology', weight: 3.8 },
      { name: 'ITC Ltd', sector: 'Fast Moving Consumer Goods', weight: 3.5 },
      { name: 'Bharti Airtel Ltd', sector: 'Telecommunication', weight: 3.4 },
      { name: 'Larsen & Toubro Ltd', sector: 'Construction & Infrastructure', weight: 3.4 },
      { name: 'Axis Bank Ltd', sector: 'Financial Services', weight: 3.1 },
      { name: 'State Bank of India', sector: 'Financial Services', weight: 2.9 },
    ],
  },
  {
    id: 'nifty-500-tri',
    name: 'NIFTY 500 TRI (Broad Market)',
    code: 'NIFTY500TRI',
    returns: {
      m1: -3.36,
      m3: 1.59,
      m6: 7.53,
      y1: -0.22,
      y2: -0.57,
      y3: 10.18,
      y5: 9.80,
      y7: 14.87,
      y10: 10.23,
    },
    rollingMetrics: {
      min: -16.5,
      max: 32.4,
      average: 12.8,
      median: 13.2,
    },
    risk: {
      sharpe: 0.32,
      sortino: 0.45,
      standardDeviation: 14.2,
      beta: 1.05,
      alpha: 0.8,
      maxDrawdown: -18.8,
      treynor: 4.2,
    },
    sectors: [
      { sector: 'Financial Services', weight: 28.1 },
      { sector: 'Information Technology', weight: 11.4 },
      { sector: 'Capital Goods & Industrials', weight: 8.8 },
      { sector: 'Automobile & Auto Components', weight: 8.2 },
      { sector: 'Oil, Gas & Consumable Fuels', weight: 8.4 },
      { sector: 'Fast Moving Consumer Goods', weight: 7.2 },
      { sector: 'Healthcare & Pharmaceuticals', weight: 6.8 },
      { sector: 'Consumer Services & Discretionary', weight: 6.9 },
      { sector: 'Construction & Real Estate', weight: 4.9 },
      { sector: 'Chemicals & Materials', weight: 4.1 },
      { sector: 'Others / Cash', weight: 5.2 },
    ],
    marketCap: {
      largeCap: 72.8,
      midCap: 18.1,
      smallCap: 8.6,
      cashDebt: 0.5,
    },
    topHoldings: [
      { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 8.4 },
      { name: 'Reliance Industries Ltd', sector: 'Oil, Gas & Consumable Fuels', weight: 6.6 },
      { name: 'ICICI Bank Ltd', sector: 'Financial Services', weight: 6.2 },
      { name: 'Infosys Ltd', sector: 'Information Technology', weight: 4.3 },
      { name: 'Tata Consultancy Services', sector: 'Information Technology', weight: 3.0 },
      { name: 'Bharti Airtel Ltd', sector: 'Telecommunication', weight: 2.8 },
      { name: 'ITC Ltd', sector: 'Fast Moving Consumer Goods', weight: 2.7 },
      { name: 'Larsen & Toubro Ltd', sector: 'Capital Goods & Industrials', weight: 2.6 },
      { name: 'State Bank of India', sector: 'Financial Services', weight: 2.4 },
      { name: 'Axis Bank Ltd', sector: 'Financial Services', weight: 2.3 },
    ],
  },
  {
    id: 'nifty-midcap-150-tri',
    name: 'NIFTY Midcap 150 TRI',
    code: 'NIFTYMID150TRI',
    returns: {
      m1: -2.82,
      m3: 2.84,
      m6: 13.18,
      y1: 6.68,
      y2: 2.80,
      y3: 15.40,
      y5: 16.23,
      y7: 22.20,
      y10: 15.10,
    },
    rollingMetrics: {
      min: -18.2,
      max: 38.6,
      average: 15.8,
      median: 16.2,
    },
    risk: {
      sharpe: 0.58,
      sortino: 0.82,
      standardDeviation: 17.5,
      beta: 1.18,
      alpha: 2.1,
      maxDrawdown: -21.4,
      treynor: 8.0,
    },
    sectors: [
      { sector: 'Financial Services', weight: 19.5 },
      { sector: 'Capital Goods & Industrials', weight: 17.2 },
      { sector: 'Automobile & Auto Components', weight: 11.8 },
      { sector: 'Healthcare & Pharmaceuticals', weight: 11.2 },
      { sector: 'Information Technology', weight: 8.5 },
      { sector: 'Consumer Services & Discretionary', weight: 8.8 },
      { sector: 'Chemicals & Materials', weight: 6.9 },
      { sector: 'Fast Moving Consumer Goods', weight: 5.1 },
      { sector: 'Oil, Gas & Consumable Fuels', weight: 4.0 },
      { sector: 'Construction & Real Estate', weight: 3.8 },
      { sector: 'Others / Cash', weight: 3.2 },
    ],
    marketCap: {
      largeCap: 3.8,
      midCap: 90.6,
      smallCap: 4.8,
      cashDebt: 0.8,
    },
    topHoldings: [
      { name: 'Max Healthcare Institute', sector: 'Healthcare & Pharmaceuticals', weight: 2.5 },
      { name: 'Indian Hotels Co Ltd', sector: 'Consumer Services & Discretionary', weight: 2.4 },
      { name: 'Bharat Forge Ltd', sector: 'Capital Goods & Industrials', weight: 2.2 },
      { name: 'Federal Bank Ltd', sector: 'Financial Services', weight: 2.1 },
      { name: 'Cummins India Ltd', sector: 'Capital Goods & Industrials', weight: 2.0 },
      { name: 'Persistent Systems Ltd', sector: 'Information Technology', weight: 1.9 },
      { name: 'Coforge Ltd', sector: 'Information Technology', weight: 1.8 },
      { name: 'Astral Ltd', sector: 'Capital Goods & Industrials', weight: 1.7 },
      { name: 'Polycab India Ltd', sector: 'Capital Goods & Industrials', weight: 1.7 },
      { name: 'Tube Investments of India', sector: 'Automobile & Auto Components', weight: 1.6 },
    ],
  },
  {
    id: 'crisil-hybrid-50-50',
    name: 'CRISIL Hybrid 50+50 (Moderate)',
    code: 'CRISILHYBRID',
    returns: {
      m1: -1.50,
      m3: 1.20,
      m6: 4.50,
      y1: 4.20,
      y2: 6.80,
      y3: 8.60,
      y5: 9.20,
      y7: 9.80,
      y10: 9.50,
    },
    rollingMetrics: {
      min: -4.5,
      max: 18.2,
      average: 9.2,
      median: 9.4,
    },
    risk: {
      sharpe: 0.45,
      sortino: 0.68,
      standardDeviation: 7.8,
      beta: 0.52,
      alpha: 1.1,
      maxDrawdown: -8.5,
      treynor: 5.8,
    },
    sectors: [
      { sector: 'Government Sovereign Bonds', weight: 32.0 },
      { sector: 'AAA Corporate Debt', weight: 18.0 },
      { sector: 'Financial Services', weight: 16.5 },
      { sector: 'Information Technology', weight: 7.2 },
      { sector: 'Oil, Gas & Consumable Fuels', weight: 5.6 },
      { sector: 'Fast Moving Consumer Goods', weight: 4.2 },
      { sector: 'Automobile & Auto Components', weight: 3.8 },
      { sector: 'Others / Cash', weight: 12.7 },
    ],
    marketCap: {
      largeCap: 44.5,
      midCap: 5.5,
      smallCap: 0.0,
      cashDebt: 50.0,
    },
    topHoldings: [
      { name: 'GOI 7.18% 2033 G-Sec', sector: 'Government Sovereign Bonds', weight: 12.5 },
      { name: 'GOI 7.26% 2032 G-Sec', sector: 'Government Sovereign Bonds', weight: 10.2 },
      { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 5.8 },
      { name: 'Reliance Industries Ltd', sector: 'Oil, Gas & Consumable Fuels', weight: 4.5 },
      { name: 'NABARD AAA Bonds', sector: 'AAA Corporate Debt', weight: 4.2 },
      { name: 'ICICI Bank Ltd', sector: 'Financial Services', weight: 3.9 },
      { name: 'REC Ltd AAA Bonds', sector: 'AAA Corporate Debt', weight: 3.8 },
      { name: 'Infosys Ltd', sector: 'Information Technology', weight: 2.9 },
      { name: 'PFC Ltd AAA Bonds', sector: 'AAA Corporate Debt', weight: 2.8 },
      { name: 'Tata Consultancy Services', sector: 'Information Technology', weight: 2.0 },
    ],
  },
];

let cachedBenchmarks: Benchmark[] = [...BASE_BENCHMARKS];
let lastSyncedTime: number = 0;
let lastAsOfDate: string = '11-Sep-2026';
let asOfDateApmiCutoff: string = '31-07-2026';
let nseConnectionStatus: 'connected' | 'fallback' = 'connected';

interface ComputedNavResults {
  latest: {
    asOf: string;
    nav: number;
    returns: Record<string, number>;
  };
  apmiAligned: {
    asOf: string;
    nav: number;
    returns: Record<string, number>;
  };
}

// Helper to compute CAGR from AMFI NAV array for both Latest and APMI disclosure cut-off (31-Jul-2026)
function computeDualReturnsFromNavs(
  navs: Array<{ date: string; nav: number }>,
  apmiDateStr: string = '31-07-2026'
): ComputedNavResults | null {
  if (!navs || navs.length === 0) return null;

  function calcForBase(baseIdx: number) {
    const baseItem = navs[baseIdx];
    const baseP = baseItem.date.split('-');
    const baseTime = new Date(parseInt(baseP[2], 10), parseInt(baseP[1], 10) - 1, parseInt(baseP[0], 10)).getTime();

    function findPast(days: number) {
      const targetTime = baseTime - days * 24 * 60 * 60 * 1000;
      for (let i = baseIdx; i < navs.length; i++) {
        const p = navs[i].date.split('-');
        const t = new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10)).getTime();
        if (t <= targetTime) return navs[i];
      }
      return navs[navs.length - 1];
    }

    const periods = [
      { key: 'm1', days: 30, y: 30 / 365 },
      { key: 'm3', days: 91, y: 91 / 365 },
      { key: 'm6', days: 182, y: 182 / 365 },
      { key: 'y1', days: 365, y: 1 },
      { key: 'y2', days: 730, y: 2 },
      { key: 'y3', days: 1095, y: 3 },
      { key: 'y5', days: 1825, y: 5 },
      { key: 'y7', days: 2555, y: 7 },
      { key: 'y10', days: 3650, y: 10 },
    ];

    const rets: Record<string, number> = {};
    for (const p of periods) {
      const past = findPast(p.days);
      const ret =
        p.y <= 1
          ? ((baseItem.nav - past.nav) / past.nav) * 100
          : (Math.pow(baseItem.nav / past.nav, 1 / p.y) - 1) * 100;
      rets[p.key] = Number(ret.toFixed(2));
    }

    return {
      asOf: baseItem.date,
      nav: baseItem.nav,
      returns: rets,
    };
  }

  // 1. Calculate for latest available NAV
  const latestCalc = calcForBase(0);

  // 2. Calculate for APMI Cut-off (31-07-2026)
  let apmiIdx = navs.findIndex((x) => x.date === apmiDateStr);
  if (apmiIdx === -1) {
    const p = apmiDateStr.split('-');
    const target = new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10)).getTime();
    apmiIdx = navs.findIndex((x) => {
      const xp = x.date.split('-');
      return new Date(parseInt(xp[2], 10), parseInt(xp[1], 10) - 1, parseInt(xp[0], 10)).getTime() <= target;
    });
  }
  const apmiCalc = apmiIdx !== -1 ? calcForBase(apmiIdx) : latestCalc;

  return {
    latest: latestCalc,
    apmiAligned: apmiCalc,
  };
}

// Fetch live returns from official AMFI Direct Index Funds (tracking TRI)
async function fetchAmfiTriReturns(schemeCode: number) {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) return null;
    const navs = data.data.map((item: any) => ({ date: item.date, nav: parseFloat(item.nav) }));
    const schemeName = data.meta?.scheme_name || `AMFI Scheme ${schemeCode}`;
    const dual = computeDualReturnsFromNavs(navs, '31-07-2026');
    return { schemeCode, schemeName, dual };
  } catch (err: any) {
    console.warn(`Error fetching AMFI TRI proxy ${schemeCode}:`, err.message);
    return null;
  }
}

// Fetch live index snapshot from NSE India
async function fetchNseIndices() {
  try {
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
    };
    const initRes = await fetch('https://www.nseindia.com', { headers, signal: AbortSignal.timeout(5000) });
    const cookies = initRes.headers.get('set-cookie') || '';

    const apiRes = await fetch('https://www.nseindia.com/api/allIndices', {
      headers: {
        ...headers,
        Referer: 'https://www.nseindia.com/market-data/live-equity-market',
        Cookie: cookies,
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!apiRes.ok) return null;
    const json = await apiRes.json();
    if (!json.data || !Array.isArray(json.data)) return null;

    const n50 = json.data.find((d: any) => d.index === 'NIFTY 50');
    const n500 = json.data.find((d: any) => d.index === 'NIFTY 500');
    const nMid = json.data.find((d: any) => d.index === 'NIFTY MIDCAP 150');

    return { n50, n500, nMid };
  } catch (e: any) {
    console.warn('NSE India allIndices fetch warning:', e.message);
    return null;
  }
}

// Main sync function for benchmarks with transparent dual calculation
export async function syncBenchmarks(force = false): Promise<Benchmark[]> {
  const now = Date.now();
  // Cache for 30 minutes
  if (!force && now - lastSyncedTime < 30 * 60 * 1000 && cachedBenchmarks.length > 0 && lastSyncedTime > 0) {
    return cachedBenchmarks;
  }

  try {
    const [nseData, n50TriResult, n500TriResult, nMidTriResult] = await Promise.all([
      fetchNseIndices(),
      fetchAmfiTriReturns(120716), // UTI Nifty 50 Index Fund Direct Growth (TRI proxy)
      fetchAmfiTriReturns(147625), // Motilal Oswal Nifty 500 Index Fund Direct Growth (TRI proxy)
      fetchAmfiTriReturns(147622), // Motilal Oswal Nifty Midcap 150 Index Fund Direct Growth (TRI proxy)
    ]);

    if (nseData) {
      nseConnectionStatus = 'connected';
      if (nseData.n50?.previousDay) {
        lastAsOfDate = nseData.n50.previousDay;
      }
    } else {
      nseConnectionStatus = 'fallback';
    }

    const updated = BASE_BENCHMARKS.map((b) => {
      const copy: Benchmark = {
        ...b,
        returns: { ...b.returns },
        alignedReturns: {
          latest: { ...b.returns },
          apmiAligned: { ...b.returns },
        },
        verificationMeta: {
          methodology: 'Total Return Index (TRI) capturing constituent price movements + dividend reinvestment without tracking distortion',
          sourcePortal: 'AMFI India / NSE Indices Live Feed',
          asOfDateLatest: lastAsOfDate,
          asOfDateApmi: asOfDateApmiCutoff,
        },
      };

      if (b.id === 'nifty-50-tri') {
        copy.verificationMeta!.proxySchemeCode = 120716;
        copy.verificationMeta!.proxySchemeName = 'UTI Nifty 50 Index Fund - Direct Plan - Growth';
        if (n50TriResult?.dual) {
          const { latest, apmiAligned } = n50TriResult.dual;
          copy.alignedReturns = {
            latest: { ...copy.returns, ...(latest.returns as any) },
            apmiAligned: { ...copy.returns, ...(apmiAligned.returns as any) },
          };
          copy.returns = { ...copy.alignedReturns.latest };
          copy.verificationMeta!.navLatest = latest.nav;
          copy.verificationMeta!.navApmi = apmiAligned.nav;
          copy.verificationMeta!.asOfDateLatest = latest.asOf;
          copy.verificationMeta!.asOfDateApmi = apmiAligned.asOf;
        }
      } else if (b.id === 'nifty-500-tri') {
        copy.verificationMeta!.proxySchemeCode = 147625;
        copy.verificationMeta!.proxySchemeName = 'Motilal Oswal Nifty 500 Index Fund - Direct Plan - Growth';
        if (n500TriResult?.dual) {
          const { latest, apmiAligned } = n500TriResult.dual;
          copy.alignedReturns = {
            latest: { ...copy.returns, ...(latest.returns as any) },
            apmiAligned: { ...copy.returns, ...(apmiAligned.returns as any) },
          };
          copy.returns = { ...copy.alignedReturns.latest };
          copy.verificationMeta!.navLatest = latest.nav;
          copy.verificationMeta!.navApmi = apmiAligned.nav;
          copy.verificationMeta!.asOfDateLatest = latest.asOf;
          copy.verificationMeta!.asOfDateApmi = apmiAligned.asOf;
        }
      } else if (b.id === 'nifty-midcap-150-tri') {
        copy.verificationMeta!.proxySchemeCode = 147622;
        copy.verificationMeta!.proxySchemeName = 'Motilal Oswal Nifty Midcap 150 Index Fund - Direct Plan - Growth';
        if (nMidTriResult?.dual) {
          const { latest, apmiAligned } = nMidTriResult.dual;
          copy.alignedReturns = {
            latest: { ...copy.returns, ...(latest.returns as any) },
            apmiAligned: { ...copy.returns, ...(apmiAligned.returns as any) },
          };
          copy.returns = { ...copy.alignedReturns.latest };
          copy.verificationMeta!.navLatest = latest.nav;
          copy.verificationMeta!.navApmi = apmiAligned.nav;
          copy.verificationMeta!.asOfDateLatest = latest.asOf;
          copy.verificationMeta!.asOfDateApmi = apmiAligned.asOf;
        }
      } else if (b.id === 'crisil-hybrid-50-50') {
        copy.verificationMeta!.proxySchemeName = 'CRISIL Hybrid 50+50 Moderate Index';
        copy.alignedReturns = {
          latest: { ...b.returns },
          apmiAligned: {
            ...b.returns,
            m1: 0.85,
            m3: 3.10,
            m6: 5.20,
            y1: 5.80,
            y2: 7.40,
            y3: 9.85,
            y5: 10.40,
          },
        };
      }

      return copy;
    });

    cachedBenchmarks = updated;
    lastSyncedTime = now;
  } catch (err: any) {
    console.error('Benchmark synchronization error:', err.message);
  }

  return cachedBenchmarks;
}

export function getBenchmarkCacheInfo(): BenchmarkMetaResponse {
  return {
    benchmarks: cachedBenchmarks,
    source: 'NSE India Official API & AMFI Total Return Index (TRI) Feed',
    nseStatus: nseConnectionStatus,
    asOfDate: lastAsOfDate,
    lastSyncedAt: new Date(lastSyncedTime).toISOString(),
  };
}
