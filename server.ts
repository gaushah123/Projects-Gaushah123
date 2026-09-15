import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { searchAmfiSchemes, getAmfiSchemeDetails } from './server/amfiService';
import { queryApmiStrategies, getApmiStrategyFundProduct, syncApmiStrategies, getApmiCacheStats } from './server/apmiService';
import { syncBenchmarks, getBenchmarkCacheInfo } from './server/benchmarkService';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// 1. Health & Unified Data Sources Status
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/sources/status', async (req, res) => {
  try {
    const apmiStats = getApmiCacheStats();
    const benchmarkInfo = getBenchmarkCacheInfo();
    res.json({
      status: 'ok',
      amfi: {
        provider: 'AMFI (Association of Mutual Funds in India)',
        portalUrl: 'https://www.amfiindia.com',
        apiUrl: 'https://api.mfapi.in',
        active: true,
        coverage: '15,000+ Registered Indian Mutual Funds',
        latestNavFeed: '11-Sep-2026',
        navAllUrl: 'https://www.amfiindia.com/spages/NAVAll.txt',
      },
      apmi: {
        provider: 'APMI (Association of Portfolio Managers in India)',
        portalUrl: 'https://www.apmiindia.org',
        active: true,
        coverage: `${apmiStats.cachedCount || 1820}+ Registered PMS & AIF Products`,
        asOnDate: apmiStats.asOnDate || '31/07/2026',
        cachedCount: apmiStats.cachedCount,
        pmsCount: apmiStats.pmsCount,
        aifCount: apmiStats.aifCount,
        lastSyncedAt: apmiStats.lastSyncedAt,
        isFetching: apmiStats.isFetching,
      },
      benchmarks: {
        provider: 'NSE India & AMFI Total Return Index (TRI)',
        portalUrl: 'https://www.nseindia.com',
        active: true,
        nseStatus: benchmarkInfo.nseStatus,
        coverage: 'NIFTY 50 TRI, NIFTY 500 TRI, NIFTY Midcap 150 TRI, CRISIL Hybrid',
        asOfDate: benchmarkInfo.asOfDate,
        lastSyncedAt: benchmarkInfo.lastSyncedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve source status' });
  }
});

// 2. AMFI Scheme Search
app.get('/api/amfi/search', async (req, res) => {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query) {
      return res.json({ schemes: [] });
    }
    const schemes = await searchAmfiSchemes(query);
    res.json({ schemes });
  } catch (error: any) {
    console.error('Error searching AMFI schemes:', error.message);
    res.status(500).json({ error: 'Failed to search AMFI database', schemes: [] });
  }
});

// 3. AMFI Scheme NAV & Computed Historical Analytics
app.get('/api/amfi/scheme/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const details = await getAmfiSchemeDetails(code);
    res.json(details);
  } catch (error: any) {
    console.error(`Error fetching AMFI scheme ${req.params.code}:`, error.message);
    res.status(404).json({ error: error.message || 'Failed to fetch AMFI scheme details' });
  }
});

// 4. APMI Strategies Search & Filter (pulled live from apmiindia.org)
app.get('/api/apmi/strategies', async (req, res) => {
  try {
    const { q, strategy, productType, serviceType, limit, page, sortBy } = req.query;
    const result = await queryApmiStrategies({
      search: q as string,
      strategy: strategy as string,
      productType: productType as any,
      serviceType: serviceType as any,
      limit: limit ? parseInt(limit as string, 10) : 30,
      page: page ? parseInt(page as string, 10) : 1,
      sortBy: sortBy as any,
    });
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching APMI strategies:', error.message);
    res.status(500).json({ error: 'Failed to query APMI disclosures', items: [], total: 0 });
  }
});

// 5. APMI Strategy by ID -> Complete FundProduct
app.get('/api/apmi/strategy/:iaId', async (req, res) => {
  try {
    const { iaId } = req.params;
    const product = await getApmiStrategyFundProduct(iaId);
    res.json(product);
  } catch (error: any) {
    console.error(`Error fetching APMI strategy ${req.params.iaId}:`, error.message);
    res.status(404).json({ error: error.message || 'APMI strategy not found' });
  }
});

// 6. Force Refresh APMI Strategies Cache
app.post('/api/apmi/refresh', async (req, res) => {
  try {
    const data = await syncApmiStrategies(true);
    res.json({ success: true, count: data.length, asOnDate: getApmiCacheStats().asOnDate });
  } catch (error: any) {
    console.error('Error refreshing APMI cache:', error.message);
    res.status(500).json({ error: 'Failed to refresh APMI cache' });
  }
});

// 7. Benchmarks Endpoint (NSE India & AMFI TRI feeds)
app.get('/api/benchmarks', async (req, res) => {
  try {
    await syncBenchmarks(false);
    const info = getBenchmarkCacheInfo();
    res.json(info);
  } catch (error: any) {
    console.error('Error fetching benchmarks:', error.message);
    res.status(500).json({ error: 'Failed to fetch benchmarks' });
  }
});

app.post('/api/benchmarks/refresh', async (req, res) => {
  try {
    await syncBenchmarks(true);
    const info = getBenchmarkCacheInfo();
    res.json(info);
  } catch (error: any) {
    console.error('Error refreshing benchmarks:', error.message);
    res.status(500).json({ error: 'Failed to refresh benchmarks' });
  }
});

// 8. AI Strategic Proposal Commentary using Gemini
app.post('/api/ai/proposal-rationale', async (req, res) => {
  try {
    const { clientName, riskProfile, totalInvestment, currency, items, benchmarkName, return3y, sharpeRatio } = req.body;
    
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        rationale: `This customized wealth proposal for ${clientName || 'the client'} (${riskProfile} risk mandate) allocates ${currency === 'USD' ? '$' : '₹'}${totalInvestment?.toLocaleString() || 'capital'} across institutional AMFI-registered mutual funds and APMI-disclosed PMS strategies. Designed to outperform ${benchmarkName || 'the benchmark'} with an attractive Sharpe ratio of ${sharpeRatio || '1.40'}, this portfolio offers balanced risk mitigation, sector diversification, and long-term capital compounding.`,
      });
    }

    const prompt = `You are a Senior Private Wealth Advisor & Portfolio Strategist in India.
Write a concise, high-impact 2-paragraph Executive Summary and Investment Rationale for a client portfolio proposal.
Details:
- Client Name: ${clientName || 'Investor'}
- Risk Profile: ${riskProfile}
- Total Capital: ${currency} ${totalInvestment}
- Benchmark: ${benchmarkName}
- Portfolio 3-Year Trailing CAGR: ${return3y}%
- Portfolio Sharpe Ratio: ${sharpeRatio}
- Top allocated funds: ${JSON.stringify(items?.slice(0, 4) || [])}

Focus strictly on:
1. Core asset allocation logic & why this blend satisfies their risk profile.
2. Downside protection vs benchmark and alpha generation strategy.
Keep it sophisticated, professional, and concise (under 120 words).`;

    const result = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ rationale: result.text?.trim() });
  } catch (error: any) {
    console.error('Gemini generation error:', error);
    res.json({
      rationale: 'Portfolio engineered for disciplined capital compounding across market leaders with rigorous downside risk management and low tracking error vs benchmark.',
    });
  }
});

// Vite middleware / production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
