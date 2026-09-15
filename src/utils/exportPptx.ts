import pptxgen from 'pptxgenjs';
import { Benchmark, ClientProfile, MonteCarloResult, PortfolioAnalytics, PortfolioItem } from '../types';
import { formatINR } from './portfolioMath';

export async function exportProposalPptx(
  client: ClientProfile,
  items: PortfolioItem[],
  analytics: PortfolioAnalytics,
  benchmark: Benchmark,
  monteCarlo: MonteCarloResult
) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = client.advisorName;
  pptx.title = `Investment Portfolio Proposal - ${client.clientName}`;

  // Theme Colors
  const NAVY = '0F172A';
  const PRIMARY = '1E3A8A';
  const ACCENT = '2563EB';
  const SLATE = '475569';
  const LIGHT_BG = 'F8FAFC';
  const WHITE = 'FFFFFF';
  const SUCCESS = '059669';
  const BORDER_COLOR = 'CBD5E1';

  // ==========================================
  // SLIDE 1: Title / Cover Slide
  // ==========================================
  const slide1 = pptx.addSlide();
  slide1.background = { color: NAVY };

  // Decorative Accent bar
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.5,
    w: 0.15,
    h: 3.8,
    fill: { color: '38BDF8' },
  });

  slide1.addText('PORTFOLIO PROPOSAL & WEALTH STRATEGY', {
    x: 1.2,
    y: 1.4,
    w: 10.0,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: '38BDF8',
    charSpacing: 2,
  });

  slide1.addText(`Prepared for: ${client.clientName}`, {
    x: 1.2,
    y: 1.9,
    w: 11.0,
    h: 1.2,
    fontSize: 32,
    bold: true,
    color: WHITE,
  });

  slide1.addText(`Proposed Capital Allocation: ${formatINR(client.totalInvestment, client.currency)} | Risk Profile: ${client.riskProfile}`, {
    x: 1.2,
    y: 3.2,
    w: 11.0,
    h: 0.6,
    fontSize: 16,
    color: '94A3B8',
  });

  slide1.addText(`Benchmark: ${benchmark.name} | Data Sources: AMFI & APMI Disclosures`, {
    x: 1.2,
    y: 3.8,
    w: 11.0,
    h: 0.4,
    fontSize: 13,
    color: '64748B',
  });

  // Footer on cover
  slide1.addShape(pptx.ShapeType.line, {
    x: 1.2,
    y: 5.6,
    w: 10.5,
    h: 0,
    line: { color: '334155', width: 1 },
  });

  slide1.addText(`Advisory Firm / Advisor: ${client.advisorName}`, {
    x: 1.2,
    y: 5.8,
    w: 6.0,
    h: 0.4,
    fontSize: 12,
    color: 'CBD5E1',
  });

  slide1.addText(`Date: ${client.proposalDate}`, {
    x: 8.5,
    y: 5.8,
    w: 3.2,
    h: 0.4,
    fontSize: 12,
    color: '94A3B8',
    align: 'right',
  });

  // ==========================================
  // SLIDE 2: Executive Summary & Strategy
  // ==========================================
  const slide2 = pptx.addSlide();
  slide2.background = { color: LIGHT_BG };

  slide2.addText('EXECUTIVE SUMMARY & INVESTMENT RATIONALE', {
    x: 0.8,
    y: 0.6,
    w: 10.0,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: PRIMARY,
  });

  // Executive Summary Card
  slide2.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.2,
    w: 11.7,
    h: 2.2,
    fill: { color: WHITE },
    line: { color: BORDER_COLOR, width: 1 },
  });

  slide2.addText('Strategic Portfolio Philosophy', {
    x: 1.1,
    y: 1.4,
    w: 11.0,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: NAVY,
  });

  slide2.addText(client.executiveSummary, {
    x: 1.1,
    y: 1.8,
    w: 11.1,
    h: 1.4,
    fontSize: 12,
    color: SLATE,
    lineSpacing: 18,
  });

  // KPI Metrics Row
  const kpis = [
    { label: '3-Yr Trailing Return', value: `${analytics.returns.y3}%`, sub: `Vs ${benchmark.returns.y3}% Bench` },
    { label: 'Portfolio Sharpe Ratio', value: `${analytics.risk.sharpe}`, sub: `Risk-Free Rate: 6.5%` },
    { label: 'Portfolio Sortino Ratio', value: `${analytics.risk.sortino}`, sub: 'Downside Protection' },
    { label: 'Generated Alpha', value: `+${analytics.risk.alpha}%`, sub: `Beta: ${analytics.risk.beta}` },
  ];

  kpis.forEach((kpi, idx) => {
    const xPos = 0.8 + idx * 3.0;
    slide2.addShape(pptx.ShapeType.rect, {
      x: xPos,
      y: 3.7,
      w: 2.7,
      h: 2.0,
      fill: { color: WHITE },
      line: { color: BORDER_COLOR, width: 1 },
    });

    slide2.addText(kpi.label, {
      x: xPos + 0.2,
      y: 3.9,
      w: 2.3,
      h: 0.4,
      fontSize: 11,
      bold: true,
      color: '64748B',
    });

    slide2.addText(kpi.value, {
      x: xPos + 0.2,
      y: 4.4,
      w: 2.3,
      h: 0.6,
      fontSize: 24,
      bold: true,
      color: SUCCESS,
    });

    slide2.addText(kpi.sub, {
      x: xPos + 0.2,
      y: 5.1,
      w: 2.3,
      h: 0.3,
      fontSize: 10,
      color: '94A3B8',
    });
  });

  // ==========================================
  // SLIDE 3: Proposed Asset Allocation & Products
  // ==========================================
  const slide3 = pptx.addSlide();
  slide3.background = { color: LIGHT_BG };

  slide3.addText('RECOMMENDED PRODUCTS & CAPITAL ALLOCATION', {
    x: 0.8,
    y: 0.6,
    w: 10.0,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: PRIMARY,
  });

  // Table of Products
  const tableRows: pptxgen.TableRow[] = [
    [
      { text: 'Scheme / Strategy Name', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10 } },
      { text: 'Manager / AMC', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10 } },
      { text: 'Type', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10 } },
      { text: 'Source', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10 } },
      { text: 'Expense %', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10 } },
      { text: 'Allocation %', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10 } },
      { text: 'Amount', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10 } },
    ],
  ];

  items.forEach((item) => {
    tableRows.push([
      { text: item.fund.shortName, options: { fontSize: 10, color: NAVY, bold: true } },
      { text: item.fund.amc, options: { fontSize: 9, color: SLATE } },
      { text: item.fund.type, options: { fontSize: 9, color: SLATE } },
      { text: item.fund.source, options: { fontSize: 9, color: PRIMARY, bold: true } },
      { text: `${item.fund.expenseRatio}%`, options: { fontSize: 9, color: SLATE } },
      { text: `${item.allocationPercent}%`, options: { fontSize: 10, color: PRIMARY, bold: true } },
      { text: formatINR(item.allocationAmount, client.currency), options: { fontSize: 10, color: NAVY, bold: true } },
    ]);
  });

  // Total row
  tableRows.push([
    { text: 'TOTAL PORTFOLIO', options: { bold: true, fontSize: 10, fill: { color: 'E2E8F0' }, color: NAVY } },
    { text: '-', options: { fill: { color: 'E2E8F0' }, fontSize: 9 } },
    { text: '-', options: { fill: { color: 'E2E8F0' }, fontSize: 9 } },
    { text: '-', options: { fill: { color: 'E2E8F0' }, fontSize: 9 } },
    { text: '-', options: { fill: { color: 'E2E8F0' }, fontSize: 9 } },
    { text: `${analytics.totalAllocatedPercent}%`, options: { bold: true, fontSize: 10, fill: { color: 'E2E8F0' }, color: PRIMARY } },
    { text: formatINR(analytics.totalAllocatedAmount, client.currency), options: { bold: true, fontSize: 10, fill: { color: 'E2E8F0' }, color: SUCCESS } },
  ]);

  slide3.addTable(tableRows, {
    x: 0.8,
    y: 1.2,
    w: 11.7,
    colW: [3.4, 2.3, 1.3, 0.9, 1.0, 1.2, 1.6],
    border: { pt: 0.5, color: BORDER_COLOR },
  });

  // ==========================================
  // SLIDE 4: Trailing Returns vs Benchmark
  // ==========================================
  const slide4 = pptx.addSlide();
  slide4.background = { color: LIGHT_BG };

  slide4.addText(`TRAILING RETURNS COMPARISON (VS ${benchmark.name})`, {
    x: 0.8,
    y: 0.6,
    w: 10.0,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: PRIMARY,
  });

  const returnHeaders = ['Horizon', '1 Month', '3 Month', '6 Month', '1 Year', '2 Year', '3 Year', '5 Year', '7 Year', '10 Year'];
  const returnPeriods = ['m1', 'm3', 'm6', 'y1', 'y2', 'y3', 'y5', 'y7', 'y10'] as const;

  const returnTableRows: pptxgen.TableRow[] = [
    returnHeaders.map((h) => ({
      text: h,
      options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10, align: 'center' },
    })),
    [
      { text: 'Proposed Portfolio', options: { bold: true, fontSize: 10, color: PRIMARY } },
      ...returnPeriods.map((p) => ({
        text: `${analytics.returns[p]}%`,
        options: { bold: true, fontSize: 10, color: SUCCESS, align: 'center' as const },
      })),
    ],
    [
      { text: benchmark.name, options: { bold: true, fontSize: 10, color: SLATE } },
      ...returnPeriods.map((p) => ({
        text: `${benchmark.returns[p]}%`,
        options: { fontSize: 10, color: SLATE, align: 'center' as const },
      })),
    ],
    [
      { text: 'Alpha / Spread', options: { bold: true, fontSize: 10, fill: { color: 'F1F5F9' }, color: NAVY } },
      ...returnPeriods.map((p) => {
        const spread = Number((analytics.returns[p] - benchmark.returns[p]).toFixed(2));
        const color = spread >= 0 ? SUCCESS : 'DC2626';
        return {
          text: `${spread >= 0 ? '+' : ''}${spread}%`,
          options: { bold: true, fontSize: 10, fill: { color: 'F1F5F9' }, color, align: 'center' as const },
        };
      }),
    ],
  ];

  slide4.addTable(returnTableRows, {
    x: 0.8,
    y: 1.2,
    w: 11.7,
    colW: [2.2, 1.05, 1.05, 1.05, 1.05, 1.05, 1.05, 1.05, 1.05, 1.1],
    border: { pt: 0.5, color: BORDER_COLOR },
  });

  // Rolling Statistics Box
  slide4.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 3.6,
    w: 11.7,
    h: 2.2,
    fill: { color: WHITE },
    line: { color: BORDER_COLOR, width: 1 },
  });

  slide4.addText('Historical Rolling Return Distribution Analytics', {
    x: 1.1,
    y: 3.8,
    w: 10.0,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: NAVY,
  });

  const statItems = [
    { title: 'Average Return', port: `${analytics.rollingMetrics.average}%`, bench: `${benchmark.rollingMetrics.average}%` },
    { title: 'Median Return', port: `${analytics.rollingMetrics.median}%`, bench: `${benchmark.rollingMetrics.median}%` },
    { title: 'Maximum Return', port: `${analytics.rollingMetrics.max}%`, bench: `${benchmark.rollingMetrics.max}%` },
    { title: 'Minimum Return (Worst Period)', port: `${analytics.rollingMetrics.min}%`, bench: `${benchmark.rollingMetrics.min}%` },
  ];

  statItems.forEach((st, idx) => {
    const xPos = 1.1 + idx * 2.8;
    slide4.addText(st.title, { x: xPos, y: 4.3, w: 2.6, h: 0.3, fontSize: 10, color: '64748B', bold: true });
    slide4.addText(`Port: ${st.port}`, { x: xPos, y: 4.65, w: 2.6, h: 0.35, fontSize: 14, bold: true, color: PRIMARY });
    slide4.addText(`Bench: ${st.bench}`, { x: xPos, y: 5.05, w: 2.6, h: 0.3, fontSize: 10, color: '94A3B8' });
  });

  // ==========================================
  // SLIDE 5: Risk & Quantitative Scorecard
  // ==========================================
  const slide5 = pptx.addSlide();
  slide5.background = { color: LIGHT_BG };

  slide5.addText('RISK-ADJUSTED METRICS & VOLATILITY SCORECARD', {
    x: 0.8,
    y: 0.6,
    w: 10.0,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: PRIMARY,
  });

  const riskTableRows: pptxgen.TableRow[] = [
    [
      { text: 'Risk Parameter', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 11 } },
      { text: 'Proposed Portfolio', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 11, align: 'center' } },
      { text: `Benchmark (${benchmark.name})`, options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 11, align: 'center' } },
      { text: 'Interpretation & Advantage', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 11 } },
    ],
    [
      { text: 'Sharpe Ratio (Rf = 6.5%)', options: { bold: true, fontSize: 10 } },
      { text: `${analytics.risk.sharpe}`, options: { bold: true, color: PRIMARY, align: 'center' } },
      { text: `${benchmark.risk.sharpe}`, options: { color: SLATE, align: 'center' } },
      { text: 'Measures risk-adjusted excess return per unit of total risk', options: { fontSize: 9, color: SLATE } },
    ],
    [
      { text: 'Sortino Ratio', options: { bold: true, fontSize: 10 } },
      { text: `${analytics.risk.sortino}`, options: { bold: true, color: SUCCESS, align: 'center' } },
      { text: `${benchmark.risk.sortino}`, options: { color: SLATE, align: 'center' } },
      { text: 'Penalizes only downside volatility; highlights capital safety', options: { fontSize: 9, color: SLATE } },
    ],
    [
      { text: 'Annualized Volatility (Std Dev)', options: { bold: true, fontSize: 10 } },
      { text: `${analytics.risk.standardDeviation}%`, options: { bold: true, color: NAVY, align: 'center' } },
      { text: `${benchmark.risk.standardDeviation}%`, options: { color: SLATE, align: 'center' } },
      { text: 'Lower volatility achieved through cross-fund asset diversification', options: { fontSize: 9, color: SLATE } },
    ],
    [
      { text: 'Portfolio Beta', options: { bold: true, fontSize: 10 } },
      { text: `${analytics.risk.beta}`, options: { bold: true, color: PRIMARY, align: 'center' } },
      { text: '1.00', options: { color: SLATE, align: 'center' } },
      { text: 'Sensitivity to benchmark movements', options: { fontSize: 9, color: SLATE } },
    ],
    [
      { text: 'Generated Alpha', options: { bold: true, fontSize: 10 } },
      { text: `+${analytics.risk.alpha}%`, options: { bold: true, color: SUCCESS, align: 'center' } },
      { text: '0.00%', options: { color: SLATE, align: 'center' } },
      { text: 'Excess return generated over CAPM expected market return', options: { fontSize: 9, color: SLATE } },
    ],
    [
      { text: 'Maximum Historical Drawdown', options: { bold: true, fontSize: 10 } },
      { text: `${analytics.risk.maxDrawdown}%`, options: { bold: true, color: 'DC2626', align: 'center' } },
      { text: `${benchmark.risk.maxDrawdown}%`, options: { color: 'DC2626', align: 'center' } },
      { text: 'Maximum peak-to-trough decline during market corrections', options: { fontSize: 9, color: SLATE } },
    ],
  ];

  slide5.addTable(riskTableRows, {
    x: 0.8,
    y: 1.3,
    w: 11.7,
    colW: [3.4, 2.2, 2.5, 3.6],
    border: { pt: 0.5, color: BORDER_COLOR },
  });

  // ==========================================
  // SLIDE 6: Sector & Market Cap Allocation
  // ==========================================
  const slide6 = pptx.addSlide();
  slide6.background = { color: LIGHT_BG };

  slide6.addText('SECTORAL BREAKUP & MARKET CAP EXPOSURE', {
    x: 0.8,
    y: 0.6,
    w: 10.0,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: PRIMARY,
  });

  // Sector Table
  const sectorRows: pptxgen.TableRow[] = [
    [
      { text: 'Sector', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10 } },
      { text: 'Portfolio %', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10, align: 'center' } },
      { text: 'Benchmark %', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10, align: 'center' } },
      { text: 'Active Weight', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10, align: 'center' } },
    ],
  ];

  analytics.sectorBreakup.slice(0, 7).forEach((sec) => {
    const act = sec.activeWeight;
    const color = act >= 0 ? SUCCESS : 'DC2626';
    sectorRows.push([
      { text: sec.sector, options: { fontSize: 9, bold: true } },
      { text: `${sec.portfolioWeight}%`, options: { fontSize: 9, align: 'center', bold: true, color: PRIMARY } },
      { text: `${sec.benchmarkWeight}%`, options: { fontSize: 9, align: 'center' } },
      { text: `${act >= 0 ? '+' : ''}${act}%`, options: { fontSize: 9, align: 'center', bold: true, color } },
    ]);
  });

  slide6.addTable(sectorRows, {
    x: 0.8,
    y: 1.3,
    w: 6.8,
    colW: [2.8, 1.3, 1.3, 1.4],
    border: { pt: 0.5, color: BORDER_COLOR },
  });

  // Market Cap Box
  slide6.addShape(pptx.ShapeType.rect, {
    x: 8.0,
    y: 1.3,
    w: 4.5,
    h: 4.4,
    fill: { color: WHITE },
    line: { color: BORDER_COLOR, width: 1 },
  });

  slide6.addText('Market Capitalization Breakup', {
    x: 8.3,
    y: 1.5,
    w: 4.0,
    h: 0.35,
    fontSize: 13,
    bold: true,
    color: NAVY,
  });

  const mcItems = [
    { label: 'Large Cap (Top 100 - Golden)', val: `${analytics.marketCap.largeCap}%`, barW: analytics.marketCap.largeCap * 0.035, col: 'D4AF37' },
    { label: 'Mid Cap (101 - 250 - Rose Gold)', val: `${analytics.marketCap.midCap}%`, barW: analytics.marketCap.midCap * 0.035, col: 'B76E79' },
    { label: 'Small Cap (251+ - Platinum Silver)', val: `${analytics.marketCap.smallCap}%`, barW: analytics.marketCap.smallCap * 0.035, col: '94A3B8' },
    { label: 'Cash / Debt Equiv (Pearl White)', val: `${analytics.marketCap.cashDebt}%`, barW: analytics.marketCap.cashDebt * 0.035, col: 'CBD5E1' },
  ];

  mcItems.forEach((mc, i) => {
    const yP = 2.1 + i * 0.85;
    slide6.addText(`${mc.label}: ${mc.val}`, { x: 8.3, y: yP, w: 3.8, h: 0.3, fontSize: 10, bold: true, color: NAVY });
    slide6.addShape(pptx.ShapeType.rect, {
      x: 8.3,
      y: yP + 0.32,
      w: Math.max(0.1, mc.barW),
      h: 0.18,
      fill: { color: mc.col },
    });
  });

  // ==========================================
  // SLIDE 7: Top 10 Consolidated Holdings
  // ==========================================
  const slide7 = pptx.addSlide();
  slide7.background = { color: LIGHT_BG };

  slide7.addText('TOP 10 CONSOLIDATED PORTFOLIO HOLDINGS', {
    x: 0.8,
    y: 0.6,
    w: 10.0,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: PRIMARY,
  });

  const holdingsRows: pptxgen.TableRow[] = [
    [
      { text: '#', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 9, align: 'center' } },
      { text: 'Company Name', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10 } },
      { text: 'Sector', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10 } },
      { text: 'Portfolio Weight', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10, align: 'center' } },
      { text: 'Effective Value', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10, align: 'center' } },
      { text: 'Overlapping Funds Holding', options: { bold: true, fill: { color: NAVY }, color: WHITE, fontSize: 10 } },
    ],
  ];

  analytics.topHoldings.forEach((h, idx) => {
    holdingsRows.push([
      { text: `${idx + 1}`, options: { fontSize: 9, align: 'center' } },
      { text: h.name, options: { fontSize: 9, bold: true, color: NAVY } },
      { text: h.sector, options: { fontSize: 9, color: SLATE } },
      { text: `${h.combinedWeight}%`, options: { fontSize: 9, bold: true, color: PRIMARY, align: 'center' } },
      { text: formatINR(h.amount, client.currency), options: { fontSize: 9, bold: true, color: SUCCESS, align: 'center' } },
      { text: h.heldInFunds.join(', '), options: { fontSize: 8, color: '64748B' } },
    ]);
  });

  slide7.addTable(holdingsRows, {
    x: 0.8,
    y: 1.2,
    w: 11.7,
    colW: [0.6, 3.2, 2.5, 1.4, 1.6, 2.4],
    border: { pt: 0.5, color: BORDER_COLOR },
  });

  // ==========================================
  // SLIDE 8: Monte Carlo Predictive Analytics
  // ==========================================
  const slide8 = pptx.addSlide();
  slide8.background = { color: LIGHT_BG };

  slide8.addText('LONG-TERM PREDICTIVE ANALYTICS (MONTE CARLO SIMULATION)', {
    x: 0.8,
    y: 0.6,
    w: 11.0,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: PRIMARY,
  });

  // Summary card
  slide8.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.2,
    w: 11.7,
    h: 4.8,
    fill: { color: WHITE },
    line: { color: BORDER_COLOR, width: 1 },
  });

  slide8.addText(`Stochastic Simulation: 2,000 Iterations over ${client.investmentHorizonYears} Years`, {
    x: 1.1,
    y: 1.5,
    w: 10.0,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: NAVY,
  });

  const mcCards = [
    { label: 'Pessimistic Scenario (10th Percentile)', val: formatINR(monteCarlo.finalValues.p10, client.currency), sub: 'Severe Bear Market Phase', col: 'DC2626' },
    { label: 'Median Expected Corpus (50th Percentile)', val: formatINR(monteCarlo.finalValues.p50, client.currency), sub: `CAGR: ~${monteCarlo.projectedCagrP50}% p.a.`, col: PRIMARY },
    { label: 'Optimistic Scenario (90th Percentile)', val: formatINR(monteCarlo.finalValues.p90, client.currency), sub: 'Strong Compounding Bull Market', col: SUCCESS },
  ];

  mcCards.forEach((c, idx) => {
    const xP = 1.1 + idx * 3.8;
    slide8.addShape(pptx.ShapeType.rect, {
      x: xP,
      y: 2.1,
      w: 3.5,
      h: 2.0,
      fill: { color: LIGHT_BG },
      line: { color: BORDER_COLOR, width: 1 },
    });
    slide8.addText(c.label, { x: xP + 0.2, y: 2.3, w: 3.1, h: 0.4, fontSize: 10, bold: true, color: '64748B' });
    slide8.addText(c.val, { x: xP + 0.2, y: 2.8, w: 3.1, h: 0.6, fontSize: 20, bold: true, color: c.col });
    slide8.addText(c.sub, { x: xP + 0.2, y: 3.5, w: 3.1, h: 0.3, fontSize: 10, color: '94A3B8' });
  });

  slide8.addText(`Probability of Beating Inflation (6.0% p.a.): ${monteCarlo.inflationBeatProbability}%  |  Probability of Capital Loss: ${monteCarlo.lossProbability}%`, {
    x: 1.1,
    y: 4.6,
    w: 11.0,
    h: 0.4,
    fontSize: 13,
    bold: true,
    color: NAVY,
  });

  slide8.addText('Note: Monte Carlo simulations use geometric Brownian motion with log-normal returns based on historical portfolio volatility. Past performance does not guarantee future results.', {
    x: 1.1,
    y: 5.1,
    w: 11.0,
    h: 0.6,
    fontSize: 10,
    color: '94A3B8',
  });

  // ==========================================
  // SLIDE 9: Disclosures & Sign-off
  // ==========================================
  const slide9 = pptx.addSlide();
  slide9.background = { color: NAVY };

  slide9.addText('REGULATORY DISCLOSURES & CLIENT ACCEPTANCE', {
    x: 0.8,
    y: 0.8,
    w: 10.0,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: '38BDF8',
  });

  slide9.addText(
    'Mutual fund investments and Portfolio Management Services (PMS) are subject to market risks. Read all scheme and strategy related documents, disclosure documents, and risk disclosure statements carefully before investing.\n\nData sourced from AMFI (Association of Mutual Funds in India) and APMI (Association of Portfolio Managers in India) official disclosures. Historical returns are not an indicator of future returns.\n\nThis proposal is customized for informational and advisory discussion purposes based on the client profile provided.',
    {
      x: 0.8,
      y: 1.6,
      w: 11.5,
      h: 2.2,
      fontSize: 11,
      color: 'CBD5E1',
      lineSpacing: 18,
    }
  );

  slide9.addText(`Client Signature: _______________________      Date: ______________`, {
    x: 0.8,
    y: 4.5,
    w: 10.0,
    h: 0.4,
    fontSize: 12,
    color: WHITE,
  });

  slide9.addText(`Advisor Signature: _______________________     ARN / SEBI Reg: INP00000XXXX`, {
    x: 0.8,
    y: 5.2,
    w: 10.0,
    h: 0.4,
    fontSize: 12,
    color: WHITE,
  });

  const fileName = `Portfolio_Proposal_${client.clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;
  await pptx.writeFile({ fileName });
}
