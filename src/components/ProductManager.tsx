import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Building2, 
  TrendingUp, 
  Sliders, 
  X, 
  Check, 
  RefreshCw, 
  Globe, 
  Database, 
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Layers,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { FundProduct, PortfolioItem, ProductType, DataSourcesStatus } from '../types';
import { PRELOADED_FUNDS } from '../data/fundsData';
import { formatINR } from '../utils/portfolioMath';

interface ProductManagerProps {
  items: PortfolioItem[];
  totalCapital: number;
  currency: 'INR' | 'USD';
  allocationMode: 'percent' | 'absolute';
  onUpdateAllocation: (fundId: string, value: number, mode: 'percent' | 'absolute') => void;
  onRemoveProduct: (fundId: string) => void;
  onAddProduct: (fund: FundProduct, initialPercent?: number) => void;
  onUpdateFund?: (updatedFund: FundProduct) => void;
  onEqualWeight: () => void;
}

export const ProductManager: React.FC<ProductManagerProps> = ({
  items,
  totalCapital,
  currency,
  allocationMode,
  onUpdateAllocation,
  onRemoveProduct,
  onAddProduct,
  onUpdateFund,
  onEqualWeight,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'apmi' | 'amfi' | 'curated' | 'custom'>('apmi');
  
  // Data Sources Status
  const [sourcesStatus, setSourcesStatus] = useState<DataSourcesStatus | null>(null);
  const [syncingFundId, setSyncingFundId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  // APMI Explorer state (supporting both PMS & AIF products)
  const [apmiSearch, setApmiSearch] = useState('');
  const [apmiProductType, setApmiProductType] = useState<'ALL' | 'PMS' | 'AIF'>('ALL');
  const [apmiServiceType, setApmiServiceType] = useState<'ALL' | 'Discretionary' | 'Non-Discretionary'>('ALL');
  const [apmiFilter, setApmiFilter] = useState<string>('ALL');
  const [apmiSortBy, setApmiSortBy] = useState<'aum' | 'y1' | 'y3' | 'y5' | 'm1'>('aum');
  const [apmiItems, setApmiItems] = useState<any[]>([]);
  const [apmiTotal, setApmiTotal] = useState(0);
  const [apmiPmsCount, setApmiPmsCount] = useState(0);
  const [apmiAifCount, setApmiAifCount] = useState(0);
  const [apmiAsOnDate, setApmiAsOnDate] = useState('31/07/2026');
  const [isLoadingApmi, setIsLoadingApmi] = useState(false);
  const [isAddingApmiId, setIsAddingApmiId] = useState<string | null>(null);

  // AMFI Search state
  const [amfiQuery, setAmfiQuery] = useState('');
  const [amfiResults, setAmfiResults] = useState<any[]>([]);
  const [isSearchingAmfi, setIsSearchingAmfi] = useState(false);
  const [amfiPreviewFund, setAmfiPreviewFund] = useState<FundProduct | null>(null);
  const [isLoadingAmfiPreview, setIsLoadingAmfiPreview] = useState(false);

  // Curated search filter
  const [curatedSearch, setCuratedSearch] = useState('');
  const [curatedFilter, setCuratedFilter] = useState<string>('all');

  // Custom scheme state
  const [customName, setCustomName] = useState('');
  const [customAmc, setCustomAmc] = useState('');
  const [customType, setCustomType] = useState<ProductType>('PMS');
  const [custom1Y, setCustom1Y] = useState(22.5);
  const [custom3Y, setCustom3Y] = useState(18.0);
  const [customSharpe, setCustomSharpe] = useState(1.35);

  const selectedFundIds = new Set(items.map((i) => i.fund.id));

  // Load Data Sources Status
  const loadSourcesStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/sources/status');
      if (res.ok) {
        const data = await res.json();
        setSourcesStatus(data);
        if (data.apmi?.asOnDate) {
          setApmiAsOnDate(data.apmi.asOnDate);
        }
      }
    } catch (e) {
      console.warn('Sources status check failed');
    }
  }, []);

  useEffect(() => {
    loadSourcesStatus();
  }, [loadSourcesStatus]);

  // Query APMI Strategies (PMS and AIF)
  const fetchApmiStrategies = useCallback(async () => {
    setIsLoadingApmi(true);
    try {
      const params = new URLSearchParams({
        strategy: apmiFilter,
        productType: apmiProductType,
        serviceType: apmiServiceType,
        q: apmiSearch,
        limit: '30',
        sortBy: apmiSortBy,
      });
      const res = await fetch(`/api/apmi/strategies?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setApmiItems(data.items || []);
        setApmiTotal(data.total || 0);
        if (data.pmsCount !== undefined) setApmiPmsCount(data.pmsCount);
        if (data.aifCount !== undefined) setApmiAifCount(data.aifCount);
        if (data.asOnDate) setApmiAsOnDate(data.asOnDate);
      }
    } catch (err) {
      console.error('APMI strategies fetch error:', err);
    } finally {
      setIsLoadingApmi(false);
    }
  }, [apmiFilter, apmiProductType, apmiServiceType, apmiSearch, apmiSortBy]);

  useEffect(() => {
    if (activeTab === 'apmi' && isModalOpen) {
      const timer = setTimeout(() => {
        fetchApmiStrategies();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isModalOpen, fetchApmiStrategies]);

  // Search AMFI Schemes
  useEffect(() => {
    if (activeTab === 'amfi' && amfiQuery.trim().length >= 2) {
      const timer = setTimeout(async () => {
        setIsSearchingAmfi(true);
        try {
          const res = await fetch(`/api/amfi/search?q=${encodeURIComponent(amfiQuery.trim())}`);
          if (res.ok) {
            const data = await res.json();
            setAmfiResults(data.schemes || []);
          }
        } catch (e) {
          console.error('AMFI search error:', e);
        } finally {
          setIsSearchingAmfi(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else if (amfiQuery.trim().length < 2) {
      setAmfiResults([]);
    }
  }, [amfiQuery, activeTab]);

  // Preview AMFI Scheme with live calculated returns
  const handlePreviewAmfi = async (schemeCode: number) => {
    setIsLoadingAmfiPreview(true);
    try {
      const res = await fetch(`/api/amfi/scheme/${schemeCode}`);
      if (res.ok) {
        const data = await res.json();
        setAmfiPreviewFund(data);
      }
    } catch (e) {
      console.error('Error fetching AMFI scheme details:', e);
    } finally {
      setIsLoadingAmfiPreview(false);
    }
  };

  // Add APMI Strategy to Portfolio
  const handleAddApmiStrategy = async (iaId: string) => {
    setIsAddingApmiId(iaId);
    try {
      const res = await fetch(`/api/apmi/strategy/${iaId}`);
      if (!res.ok) throw new Error('Failed to retrieve strategy data');
      const fund: FundProduct = await res.json();
      onAddProduct(fund, 15);
      showSyncAlert(`Added "${fund.shortName}" with live APMI disclosure data (${apmiAsOnDate})`);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error loading APMI strategy: ${err.message}`);
    } finally {
      setIsAddingApmiId(null);
    }
  };

  // Add AMFI Scheme to Portfolio
  const handleAddAmfiScheme = (fund: FundProduct) => {
    onAddProduct(fund, 15);
    showSyncAlert(`Added "${fund.shortName}" with live AMFI NAV (₹${fund.nav?.toFixed(2)} as of ${fund.navDate})`);
    setIsModalOpen(false);
    setAmfiPreviewFund(null);
    setAmfiQuery('');
  };

  // Live Refresh an individual fund in the portfolio
  const handleSyncFund = async (fund: FundProduct) => {
    if (!onUpdateFund) return;
    setSyncingFundId(fund.id);

    try {
      if (fund.source === 'AMFI' && fund.code) {
        // Extract AMFI code
        const code = fund.code.replace('amfi-', '').replace('AMFI-', '');
        const res = await fetch(`/api/amfi/scheme/${code}`);
        if (res.ok) {
          const freshFund: FundProduct = await res.json();
          // Preserve custom ID and existing fields
          onUpdateFund({
            ...freshFund,
            id: fund.id,
            code: fund.code,
          });
          showSyncAlert(`Updated ${fund.shortName} from AMFI (NAV: ₹${freshFund.nav?.toFixed(2)}, Date: ${freshFund.navDate})`);
        }
      } else if (fund.source === 'APMI') {
        // Extract IAID
        const idMatch = fund.code.match(/(\d+)/) || fund.id.match(/(\d+)/);
        const iaId = idMatch ? idMatch[1] : '1708';
        const res = await fetch(`/api/apmi/strategy/${iaId}`);
        if (res.ok) {
          const freshFund: FundProduct = await res.json();
          onUpdateFund({
            ...freshFund,
            id: fund.id,
            code: fund.code,
          });
          showSyncAlert(`Updated ${fund.shortName} from APMI official disclosure (${freshFund.navDate})`);
        }
      } else {
        showSyncAlert(`${fund.shortName} is a custom mandate.`);
      }
    } catch (err: any) {
      console.error('Error syncing fund:', err);
    } finally {
      setSyncingFundId(null);
    }
  };

  // Sync all funds in portfolio
  const handleSyncAllFunds = async () => {
    if (!onUpdateFund || items.length === 0) return;
    setIsSyncingAll(true);
    let count = 0;

    for (const item of items) {
      try {
        const fund = item.fund;
        if (fund.source === 'AMFI' && fund.code) {
          const code = fund.code.replace('amfi-', '').replace('AMFI-', '');
          const res = await fetch(`/api/amfi/scheme/${code}`);
          if (res.ok) {
            const fresh = await res.json();
            onUpdateFund({ ...fresh, id: fund.id, code: fund.code });
            count++;
          }
        } else if (fund.source === 'APMI') {
          const idMatch = fund.code.match(/(\d+)/) || fund.id.match(/(\d+)/);
          const iaId = idMatch ? idMatch[1] : '1708';
          const res = await fetch(`/api/apmi/strategy/${iaId}`);
          if (res.ok) {
            const fresh = await res.json();
            onUpdateFund({ ...fresh, id: fund.id, code: fund.code });
            count++;
          }
        }
      } catch (e) {
        console.warn('Sync failed for item', item.fund.shortName);
      }
    }

    setIsSyncingAll(false);
    showSyncAlert(`Successfully refreshed all ${count} portfolio funds against live AMFI & APMI portals.`);
  };

  const showSyncAlert = (msg: string) => {
    setSyncNotification(msg);
    setTimeout(() => {
      setSyncNotification(null);
    }, 4500);
  };

  // Add Custom Scheme
  const handleAddCustomScheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newFund: FundProduct = {
      id: `custom-${Date.now()}`,
      code: `CUST-${Math.floor(Math.random() * 10000)}`,
      name: customName,
      shortName: customName.length > 28 ? customName.slice(0, 28) + '...' : customName,
      type: customType,
      category: customType === 'PMS' ? 'High-Conviction PMS' : 'Specialized Fund',
      assetClass: customType === 'Debt / Liquid' ? 'Debt' : 'Equity',
      amc: customAmc || 'Private Wealth Portfolio',
      source: 'Custom',
      aumCr: 5000,
      expenseRatio: 1.5,
      returns: {
        m1: Number((custom1Y / 12).toFixed(1)),
        m3: Number((custom1Y / 4).toFixed(1)),
        m6: Number((custom1Y / 2).toFixed(1)),
        y1: custom1Y,
        y2: Number((custom3Y * 1.05).toFixed(1)),
        y3: custom3Y,
        y5: Number((custom3Y * 0.98).toFixed(1)),
        y7: Number((custom3Y * 0.95).toFixed(1)),
        y10: Number((custom3Y * 0.92).toFixed(1)),
      },
      rollingMetrics: { min: -5.0, max: 40.0, average: custom3Y, median: custom3Y },
      risk: {
        sharpe: customSharpe,
        sortino: Number((customSharpe * 1.35).toFixed(2)),
        standardDeviation: 14.2,
        beta: 0.92,
        alpha: 4.2,
        maxDrawdown: -14.0,
        treynor: 12.0,
      },
      sectors: [
        { sector: 'Financial Services', weight: 26.0 },
        { sector: 'Information Technology', weight: 15.0 },
        { sector: 'Capital Goods & Industrials', weight: 14.0 },
        { sector: 'Consumer Services & Discretionary', weight: 12.0 },
        { sector: 'Healthcare & Pharmaceuticals', weight: 10.0 },
        { sector: 'Others / Cash', weight: 23.0 },
      ],
      marketCap: { largeCap: 50, midCap: 35, smallCap: 12, cashDebt: 3 },
      topHoldings: [
        { name: 'ICICI Bank Ltd', sector: 'Financial Services', weight: 7.2 },
        { name: 'Infosys Ltd', sector: 'Information Technology', weight: 5.8 },
        { name: 'Titan Company Ltd', sector: 'Consumer Services & Discretionary', weight: 5.1 },
        { name: 'Bharat Forge Ltd', sector: 'Capital Goods & Industrials', weight: 4.6 },
        { name: 'HDFC Bank Ltd', sector: 'Financial Services', weight: 4.4 },
      ],
      lastSyncedAt: new Date().toISOString(),
    };

    onAddProduct(newFund, 15);
    setIsModalOpen(false);
    setCustomName('');
    setCustomAmc('');
    showSyncAlert(`Added custom mandate "${newFund.shortName}" to portfolio.`);
  };

  // Filter curated
  const filteredCuratedFunds = PRELOADED_FUNDS.filter((fund) => {
    const matchesSearch = 
      fund.name.toLowerCase().includes(curatedSearch.toLowerCase()) ||
      fund.amc.toLowerCase().includes(curatedSearch.toLowerCase()) ||
      fund.category.toLowerCase().includes(curatedSearch.toLowerCase()) ||
      fund.shortName.toLowerCase().includes(curatedSearch.toLowerCase());

    if (curatedFilter === 'all') return matchesSearch;
    if (curatedFilter === 'AMFI') return matchesSearch && fund.source === 'AMFI';
    if (curatedFilter === 'APMI') return matchesSearch && fund.source === 'APMI';
    if (curatedFilter === 'Equity') return matchesSearch && fund.assetClass === 'Equity';
    if (curatedFilter === 'Debt') return matchesSearch && fund.assetClass === 'Debt';
    if (curatedFilter === 'Hybrid') return matchesSearch && fund.assetClass === 'Hybrid';
    return matchesSearch;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Toast Notification */}
      {syncNotification && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md animate-in slide-in-from-top duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{syncNotification}</span>
          </div>
          <button 
            onClick={() => setSyncNotification(null)}
            className="text-emerald-200 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Live Data Sources Active Banner */}
      <div className="bg-slate-900 text-slate-300 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-white font-bold">AMFI Live:</span>
            <span className="text-slate-300">15,000+ Mutual Funds (NAV 11-Sep-2026)</span>
          </div>

          <div className="hidden sm:inline text-slate-600">•</div>

          <div className="flex items-center space-x-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            <span className="text-white font-bold">APMI Live:</span>
            <span className="text-slate-300">1,580+ PMS Approaches (SEBI Disclosures {apmiAsOnDate})</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onUpdateFund && items.length > 0 && (
            <button
              id="sync-all-funds-btn"
              onClick={handleSyncAllFunds}
              disabled={isSyncingAll}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition-colors disabled:opacity-50"
              title="Refresh all portfolio funds from AMFI & APMI live sources"
            >
              <RefreshCw className={`w-3 h-3 text-emerald-400 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Syncing...' : 'Sync All Live'}</span>
            </button>
          )}

          <a 
            href="https://www.amfiindia.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[11px] text-blue-400 hover:underline hidden md:inline"
          >
            AMFI Portal
          </a>
          <span className="text-slate-600 hidden md:inline">|</span>
          <a 
            href="https://www.apmiindia.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[11px] text-purple-400 hover:underline hidden md:inline"
          >
            APMI Portal
          </a>
        </div>
      </div>

      {/* Section Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">Portfolio Products & Allocation</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
              {items.length} Products Selected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional asset allocation with real-time AMFI Mutual Funds and APMI PMS performance disclosures
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="equal-weight-btn"
            onClick={onEqualWeight}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center space-x-1"
            title="Distribute weight equally across all selected products"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Equal Weight</span>
          </button>

          <button
            id="open-add-product-modal-btn"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add AMFI / APMI Product</span>
          </button>
        </div>
      </div>

      {/* Selected Products Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100/80 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Product / Strategy Name</th>
              <th className="py-3 px-3">Type & Source</th>
              <th className="py-3 px-3 text-right">Latest NAV / AUM</th>
              <th className="py-3 px-3 text-right">1Y Return</th>
              <th className="py-3 px-3 text-right">3Y CAGR</th>
              <th className="py-3 px-3 text-right">Sharpe</th>
              <th className="py-3 px-4 text-center w-52">Allocation Weight</th>
              <th className="py-3 px-4 text-right">Capital Allocated</th>
              <th className="py-3 px-3 text-center">Live Sync</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item) => {
              const fund = item.fund;
              const isAmfi = fund.source === 'AMFI';
              const isApmi = fund.source === 'APMI';
              const isSyncing = syncingFundId === fund.id;

              return (
                <tr key={fund.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* Name & AMC */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 line-clamp-1">{fund.shortName}</div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                      <span>{fund.amc}</span>
                      <span>•</span>
                      <span className="text-slate-400">{fund.category}</span>
                    </div>
                  </td>

                  {/* Type & Source Badges */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                            isAmfi
                              ? 'bg-blue-100 text-blue-800'
                              : isApmi
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {fund.source}
                        </span>
                        <span className="text-[11px] text-slate-600 font-medium">{fund.type}</span>
                      </div>
                      {fund.serviceType && (
                        <div>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border inline-block ${
                              fund.serviceType === 'Non-Discretionary'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                            title={
                              fund.serviceType === 'Non-Discretionary'
                                ? 'Non-Discretionary PMS: Client gives explicit trade-by-trade execution approvals'
                                : 'Discretionary PMS: Portfolio manager executes investment decisions independently'
                            }
                          >
                            {fund.serviceType === 'Non-Discretionary' ? 'NDPMS' : 'Discretionary'}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* NAV / AUM */}
                  <td className="py-3 px-3 text-right">
                    {fund.nav ? (
                      <div>
                        <div className="font-semibold text-slate-900">₹{fund.nav.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">{fund.navDate || 'AMFI'}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold text-slate-900">₹{fund.aumCr.toLocaleString()} Cr</div>
                        <div className="text-[10px] text-slate-400">{fund.navDate || 'APMI'}</div>
                      </div>
                    )}
                  </td>

                  {/* 1Y Return */}
                  <td className="py-3 px-3 text-right font-semibold">
                    {fund.returns.y1 != null ? (
                      <span className={fund.returns.y1 >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {fund.returns.y1 > 0 ? `+${fund.returns.y1}%` : `${fund.returns.y1}%`}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs italic" title="Scheme lacks 1-year ageing (excluded from return analytics)">—</span>
                    )}
                  </td>

                  {/* 3Y Return */}
                  <td className="py-3 px-3 text-right font-bold">
                    {fund.returns.y3 != null ? (
                      <span className="text-slate-900">{fund.returns.y3}%</span>
                    ) : (
                      <span className="text-slate-300 text-xs italic" title="Scheme lacks 3-year ageing (excluded from return analytics)">—</span>
                    )}
                  </td>

                  {/* Sharpe */}
                  <td className="py-3 px-3 text-right font-medium text-blue-700">
                    {fund.risk.sharpe}
                  </td>

                  {/* Allocation Input */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={item.allocationPercent}
                        onChange={(e) => onUpdateAllocation(fund.id, Number(e.target.value), 'percent')}
                        aria-label={`Allocation slider for ${fund.shortName}`}
                        className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                      <div className="flex items-center border border-slate-300 rounded-md bg-white overflow-hidden shadow-2xs w-20 shrink-0">
                        {allocationMode === 'percent' ? (
                          <>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={item.allocationPercent}
                              onChange={(e) => onUpdateAllocation(fund.id, Number(e.target.value), 'percent')}
                              aria-label={`Allocation percentage for ${fund.shortName}`}
                              className="w-full text-right text-xs font-bold text-slate-900 p-1 focus:outline-none"
                            />
                            <span className="text-slate-400 text-[11px] pr-1.5 font-bold">%</span>
                          </>
                        ) : (
                          <>
                            <span className="text-slate-400 text-[10px] pl-1 font-bold">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="25000"
                              value={item.allocationAmount}
                              onChange={(e) => onUpdateAllocation(fund.id, Number(e.target.value), 'absolute')}
                              aria-label={`Allocation amount for ${fund.shortName}`}
                              className="w-full text-right text-xs font-bold text-slate-900 p-1 focus:outline-none"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Capital Allocated */}
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatINR(item.allocationAmount, currency)}
                  </td>

                  {/* Live Sync Button */}
                  <td className="py-3 px-3 text-center">
                    {fund.source !== 'Custom' ? (
                      <button
                        onClick={() => handleSyncFund(fund)}
                        disabled={isSyncing}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-40"
                        title={`Pull freshest data from ${fund.source}`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-700' : ''}`} />
                      </button>
                    ) : (
                      <span className="text-slate-300 text-[10px]">—</span>
                    )}
                  </td>

                  {/* Remove Button */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onRemoveProduct(fund.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Remove product from proposal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ========================================== */}
      {/* PRODUCT SELECTION MODAL                    */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Add Products from AMFI & APMI Live Sources
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Browse official APMI PMS strategies (1,580+), search AMFI mutual funds (15,000+), or use curated models
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setAmfiPreviewFund(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab('apmi')}
                className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === 'apmi'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-extrabold uppercase">
                  APMI
                </span>
                <span>PMS & AIF Disclosures ({apmiTotal > 0 ? `${apmiTotal.toLocaleString()} Products` : '1,820+'})</span>
              </button>

              <button
                onClick={() => setActiveTab('amfi')}
                className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === 'amfi'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase">
                  AMFI
                </span>
                <span>Mutual Funds (15,000+)</span>
              </button>

              <button
                onClick={() => setActiveTab('curated')}
                className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === 'curated'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Curated Institutional Universe</span>
              </button>

              <button
                onClick={() => setActiveTab('custom')}
                className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === 'custom'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom Strategy / Mandate</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-50/50">
              
              {/* TAB 1: APMI PMS & AIF PRODUCTS */}
              {activeTab === 'apmi' && (
                <div className="space-y-4">
                  {/* Search and Multi-Tier Filters */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    {/* Search bar */}
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search PMS / AIF provider (e.g. Alfaaccurate, WhiteOak, ASK, Abakkus, Carnelian, 360 ONE) or Strategy name..."
                        value={apmiSearch}
                        onChange={(e) => setApmiSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Quick Manager Filter Chips */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 text-xs text-slate-500">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Quick Find:</span>
                      {[
                        { label: 'Alfaaccurate (AAA)', query: 'AlfAccurate' },
                        { label: 'SageOne (Samit Vartak)', query: 'SageOne' },
                        { label: 'WhiteOak', query: 'WhiteOak' },
                        { label: 'Abakkus', query: 'Abakkus' },
                        { label: 'ASK', query: 'ASK' },
                        { label: 'Marcellus', query: 'Marcellus' },
                        { label: 'Sundaram Alt', query: 'Sundaram Alternate' },
                        { label: '360 ONE', query: '360 ONE' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => setApmiSearch(item.query)}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap ${
                            apmiSearch.toLowerCase() === item.query.toLowerCase()
                              ? 'bg-purple-700 text-white border-purple-700'
                              : 'bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 border-slate-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                      {apmiSearch && (
                        <button
                          onClick={() => setApmiSearch('')}
                          className="text-[11px] text-rose-600 hover:underline shrink-0 ml-1 font-semibold"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Filter Row 1: Product Universe (PMS vs AIF) & Service Type */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-100">
                      {/* PMS vs AIF Pill Selector */}
                      <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg">
                        <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Product:</span>
                        <button
                          onClick={() => setApmiProductType('ALL')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                            apmiProductType === 'ALL'
                              ? 'bg-white text-purple-800 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          All Universe ({apmiTotal || '1,820+'})
                        </button>
                        <button
                          onClick={() => setApmiProductType('PMS')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center space-x-1 ${
                            apmiProductType === 'PMS'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>PMS</span>
                          {apmiPmsCount > 0 && <span className="opacity-80 text-[10px]">({apmiPmsCount})</span>}
                        </button>
                        <button
                          onClick={() => setApmiProductType('AIF')}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center space-x-1 ${
                            apmiProductType === 'AIF'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>AIF (Alternative)</span>
                          {apmiAifCount > 0 && <span className="opacity-80 text-[10px]">({apmiAifCount})</span>}
                        </button>
                      </div>

                      {/* Service Type Pill Selector */}
                      <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg">
                        <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Service:</span>
                        {(['ALL', 'Discretionary', 'Non-Discretionary'] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => setApmiServiceType(st)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                              apmiServiceType === st
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {st === 'ALL' ? 'All Services' : st === 'Discretionary' ? 'Discretionary' : 'Non-Disc.'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filter Row 2: Strategy Class (Equity, Debt, Hybrid, Multi Asset) */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 flex-wrap">
                      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Strategy:</span>
                        {['ALL', 'Equity', 'Debt', 'Hybrid', 'Multi Asset'].map((strat) => (
                          <button
                            key={strat}
                            onClick={() => setApmiFilter(strat)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                              apmiFilter === strat
                                ? 'bg-slate-800 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {strat}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center space-x-1.5 text-purple-700 font-medium text-xs">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>APMI Official SEBI Disclosures as on {apmiAsOnDate}</span>
                      </div>
                    </div>

                    {/* Sort controls */}
                    <div className="flex items-center space-x-2 text-xs text-slate-500 pt-1 border-t border-slate-100 flex-wrap">
                      <span className="font-medium text-slate-700">Sort By:</span>
                      <button
                        onClick={() => setApmiSortBy('aum')}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${apmiSortBy === 'aum' ? 'bg-purple-100 text-purple-800' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Highest AUM
                      </button>
                      <button
                        onClick={() => setApmiSortBy('y3')}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${apmiSortBy === 'y3' ? 'bg-purple-100 text-purple-800' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        3Y Return
                      </button>
                      <button
                        onClick={() => setApmiSortBy('y1')}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${apmiSortBy === 'y1' ? 'bg-purple-100 text-purple-800' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        1Y Return
                      </button>
                      <button
                        onClick={() => setApmiSortBy('y5')}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${apmiSortBy === 'y5' ? 'bg-purple-100 text-purple-800' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        5Y Return
                      </button>
                    </div>
                  </div>

                  {/* PMS & AIF Results Table */}
                  {isLoadingApmi ? (
                    <div className="py-12 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                      <p className="text-xs font-semibold">Pulling latest PMS & AIF disclosures from apmiindia.org...</p>
                    </div>
                  ) : apmiItems.length === 0 ? (
                    <div className="py-10 text-center bg-white rounded-xl border border-slate-200">
                      <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">No products found matching your search</p>
                      <p className="text-xs text-slate-400 mt-0.5">Try changing product universe (PMS/AIF) or clearing filters</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto max-h-[50vh]">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px] sticky top-0 border-b border-slate-200 z-10">
                            <tr>
                              <th className="py-2.5 px-3">Manager / Provider</th>
                              <th className="py-2.5 px-3">Approach / Scheme Name</th>
                              <th className="py-2.5 px-2">Universe</th>
                              <th className="py-2.5 px-2">Service</th>
                              <th className="py-2.5 px-2">Asset Class</th>
                              <th className="py-2.5 px-3 text-right">AUM (₹ Cr)</th>
                              <th className="py-2.5 px-2 text-right">1M</th>
                              <th className="py-2.5 px-2 text-right">1Y</th>
                              <th className="py-2.5 px-2 text-right">3Y</th>
                              <th className="py-2.5 px-2 text-right">5Y</th>
                              <th className="py-2.5 px-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {apmiItems.map((strat) => {
                              const isAdding = isAddingApmiId === strat.iaId;
                              const isAif = strat.productType === 'AIF';
                              return (
                                <tr key={strat.iaId || strat.iaName} className="hover:bg-purple-50/40 transition-colors">
                                  <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[180px] truncate" title={strat.provider}>
                                    {strat.provider}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[210px] truncate" title={strat.iaName}>
                                    <div>{strat.iaName}</div>
                                    <div className="text-[10px] text-slate-400 font-normal">{strat.category || `${strat.strategyType} Strategy`}</div>
                                  </td>
                                  {/* Universe Badge */}
                                  <td className="py-2.5 px-2 whitespace-nowrap">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                        isAif
                                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                          : 'bg-purple-100 text-purple-800 border border-purple-200'
                                      }`}
                                    >
                                      {strat.productType || 'PMS'}
                                    </span>
                                  </td>
                                  {/* Service Type Badge */}
                                  <td className="py-2.5 px-2 whitespace-nowrap">
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded border inline-block ${
                                        strat.serviceType === 'Non-Discretionary'
                                          ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
                                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium'
                                      }`}
                                      title={
                                        strat.serviceType === 'Non-Discretionary'
                                          ? 'Non-Discretionary: Requires explicit client trade approval'
                                          : 'Discretionary: Portfolio manager executes independently'
                                      }
                                    >
                                      {strat.serviceType === 'Non-Discretionary' ? 'NDPMS' : 'Discretionary'}
                                    </span>
                                  </td>
                                  {/* Strategy Class */}
                                  <td className="py-2.5 px-2 whitespace-nowrap">
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                                      {strat.strategyType}
                                    </span>
                                  </td>
                                  {/* AUM */}
                                  <td className="py-2.5 px-3 text-right font-bold text-slate-800 whitespace-nowrap">
                                    ₹{strat.aumCr > 0 ? strat.aumCr.toLocaleString() : '—'}
                                  </td>
                                  {/* 1M Return */}
                                  <td className="py-2.5 px-2 text-right text-slate-700 whitespace-nowrap">
                                    {strat.returns.m1 != null ? `${strat.returns.m1 > 0 ? '+' : ''}${strat.returns.m1}%` : <span className="text-slate-300">—</span>}
                                  </td>
                                  {/* 1Y Return with Ageing check */}
                                  <td className="py-2.5 px-2 text-right font-semibold whitespace-nowrap">
                                    {strat.returns.y1 != null ? (
                                      <span className={strat.returns.y1 >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                        {strat.returns.y1 > 0 ? `+${strat.returns.y1}%` : `${strat.returns.y1}%`}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300 text-[10px] italic" title="No 1Y Ageing (excluded from analytics)">—</span>
                                    )}
                                  </td>
                                  {/* 3Y Return with Ageing check */}
                                  <td className="py-2.5 px-2 text-right font-bold text-slate-900 whitespace-nowrap">
                                    {strat.returns.y3 != null ? (
                                      <span>{strat.returns.y3}%</span>
                                    ) : (
                                      <span className="text-slate-300 text-[10px] italic" title="No 3Y Ageing (excluded from analytics)">—</span>
                                    )}
                                  </td>
                                  {/* 5Y Return with Ageing check */}
                                  <td className="py-2.5 px-2 text-right font-medium text-slate-800 whitespace-nowrap">
                                    {strat.returns.y5 != null ? (
                                      <span>{strat.returns.y5}%</span>
                                    ) : (
                                      <span className="text-slate-300 text-[10px] italic" title="No 5Y Ageing (excluded from analytics)">—</span>
                                    )}
                                  </td>
                                  {/* Add Button */}
                                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                    <button
                                      onClick={() => handleAddApmiStrategy(strat.iaId)}
                                      disabled={isAdding}
                                      className={`px-2.5 py-1 rounded-md text-white text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                                        isAif
                                          ? 'bg-indigo-600 hover:bg-indigo-700'
                                          : 'bg-purple-600 hover:bg-purple-700'
                                      }`}
                                    >
                                      {isAdding ? 'Adding...' : `Add ${strat.productType || 'Strategy'}`}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: AMFI MUTUAL FUNDS SEARCH */}
              {activeTab === 'amfi' && (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Search 15,000+ AMFI Registered Mutual Funds (Live Registry)
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Search fund name or scheme code (e.g. Parag Parikh Flexi, Mirae Large, Nippon Small, HDFC Balance)..."
                        value={amfiQuery}
                        onChange={(e) => setAmfiQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      {isSearchingAmfi && (
                        <RefreshCw className="w-4 h-4 text-blue-600 animate-spin absolute right-3 top-3" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Direct API integration with AMFI mirror. Select any scheme to compute full trailing CAGR and risk metrics from historical daily NAVs.
                    </p>
                  </div>

                  {/* AMFI Scheme Live Preview Card */}
                  {amfiPreviewFund && (
                    <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 shadow-xs animate-in fade-in duration-150">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px]">
                              LIVE AMFI SCHEME
                            </span>
                            <span className="text-xs font-semibold text-slate-600">{amfiPreviewFund.category}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">{amfiPreviewFund.name}</h4>
                          <div className="text-xs text-slate-600 mt-0.5">
                            AMC: <span className="font-semibold text-slate-800">{amfiPreviewFund.amc}</span> • Scheme Code: {amfiPreviewFund.code}
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddAmfiScheme(amfiPreviewFund)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add to Proposal</span>
                        </button>
                      </div>

                      {/* Metrics Scorecard */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 mt-3.5 pt-3 border-t border-blue-200/60 text-xs">
                        <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                          <div className="text-[10px] text-slate-500 font-medium">Net Asset Value</div>
                          <div className="text-sm font-bold text-slate-900">₹{amfiPreviewFund.nav?.toFixed(2)}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">As of {amfiPreviewFund.navDate}</div>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                          <div className="text-[10px] text-slate-500 font-medium">1-Year Return</div>
                          <div className="text-sm font-bold text-emerald-600">+{amfiPreviewFund.returns.y1}%</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Absolute</div>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                          <div className="text-[10px] text-slate-500 font-medium">3-Year CAGR</div>
                          <div className="text-sm font-bold text-slate-900">{amfiPreviewFund.returns.y3}%</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Annualized</div>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                          <div className="text-[10px] text-slate-500 font-medium">5-Year CAGR</div>
                          <div className="text-sm font-bold text-slate-900">{amfiPreviewFund.returns.y5 || '—'}%</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Annualized</div>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                          <div className="text-[10px] text-slate-500 font-medium">Sharpe Ratio</div>
                          <div className="text-sm font-bold text-blue-700">{amfiPreviewFund.risk.sharpe}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Rf = 6.5%</div>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                          <div className="text-[10px] text-slate-500 font-medium">Volatility (StdDev)</div>
                          <div className="text-sm font-bold text-slate-800">{amfiPreviewFund.risk.standardDeviation}%</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Max DD: {amfiPreviewFund.risk.maxDrawdown}%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Results List */}
                  {isLoadingAmfiPreview && !amfiPreviewFund && (
                    <div className="py-8 text-center text-slate-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-1" />
                      <p className="text-xs">Computing trailing CAGR and risk metrics from AMFI historical NAVs...</p>
                    </div>
                  )}

                  {amfiResults.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-[45vh] overflow-y-auto">
                      {amfiResults.map((scheme) => (
                        <div
                          key={scheme.schemeCode}
                          className="p-3 hover:bg-blue-50/50 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                          onClick={() => handlePreviewAmfi(scheme.schemeCode)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900 text-xs truncate">
                              {scheme.schemeName}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              AMFI Code: <span className="font-mono text-slate-600">{scheme.schemeCode}</span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewAmfi(scheme.schemeCode);
                            }}
                            className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold transition-colors shrink-0"
                          >
                            Calculate & Preview
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {amfiQuery.trim().length >= 2 && amfiResults.length === 0 && !isSearchingAmfi && (
                    <div className="py-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                      <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                      <p className="text-xs">No matching schemes found in AMFI database</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CURATED UNIVERSE */}
              {activeTab === 'curated' && (
                <div className="space-y-4">
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search curated universe by name, AMC, or category..."
                        value={curatedSearch}
                        onChange={(e) => setCuratedSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                      {['all', 'AMFI', 'APMI', 'Equity', 'Hybrid', 'Debt'].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setCuratedFilter(filter)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                            curatedFilter === filter
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {filter === 'all' ? 'All Products' : filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fund Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredCuratedFunds.map((fund) => {
                      const isSelected = selectedFundIds.has(fund.id);

                      return (
                        <div
                          key={fund.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-blue-50/60 border-blue-300 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center space-x-1.5 mb-1">
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                                    fund.source === 'AMFI'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-purple-100 text-purple-800'
                                  }`}
                                >
                                  {fund.source}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {fund.type} • {fund.category}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                {fund.shortName}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">{fund.amc}</p>
                            </div>

                            <button
                              onClick={() => {
                                if (isSelected) {
                                  onRemoveProduct(fund.id);
                                } else {
                                  onAddProduct(fund, 15);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 shrink-0 ${
                                isSelected
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-slate-900 text-white hover:bg-blue-600'
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Selected</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Quick Stats */}
                          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                            <div>
                              <div className="text-[10px] text-slate-400">1Y Return</div>
                              <div className="text-xs font-bold text-emerald-600">+{fund.returns.y1}%</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400">3Y CAGR</div>
                              <div className="text-xs font-bold text-slate-900">{fund.returns.y3}%</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400">5Y CAGR</div>
                              <div className="text-xs font-bold text-slate-900">{fund.returns.y5 || '—'}%</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400">Sharpe</div>
                              <div className="text-xs font-bold text-blue-700">{fund.risk.sharpe}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: CUSTOM STRATEGY */}
              {activeTab === 'custom' && (
                <form onSubmit={handleAddCustomScheme} className="max-w-xl mx-auto bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Add Bespoke Strategy / Family Office Mandate</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure custom performance parameters for specialized PMS or private equity mandates
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Strategy / Mandate Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apex Multi-Cap Alpha Mandate"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Manager / AMC</label>
                        <input
                          type="text"
                          placeholder="e.g. Alpha Capital Advisors"
                          value={customAmc}
                          onChange={(e) => setCustomAmc(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Product Structure</label>
                        <select
                          value={customType}
                          onChange={(e) => setCustomType(e.target.value as ProductType)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="PMS">Portfolio Management Services (PMS)</option>
                          <option value="AIF">Alternative Investment Fund (AIF)</option>
                          <option value="Mutual Fund">Mutual Fund</option>
                          <option value="Debt / Liquid">Debt / Liquid Structure</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">1Y Return (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={custom1Y}
                          onChange={(e) => setCustom1Y(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">3Y CAGR (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={custom3Y}
                          onChange={(e) => setCustom3Y(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Sharpe Ratio</label>
                        <input
                          type="number"
                          step="0.05"
                          value={customSharpe}
                          onChange={(e) => setCustomSharpe(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                    >
                      Add Custom Mandate
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <div className="text-slate-500 flex items-center space-x-2">
                <Globe className="w-4 h-4 text-slate-400" />
                <span>Real-time Indian financial portal integrations: AMFI & APMI</span>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setAmfiPreviewFund(null);
                }}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
