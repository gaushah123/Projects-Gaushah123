import React, { useState } from 'react';
import { 
  User, 
  DollarSign, 
  ShieldAlert, 
  Clock, 
  Percent, 
  Scale, 
  CheckCircle2, 
  AlertTriangle,
  Sliders,
  Sparkles
} from 'lucide-react';
import { ClientProfile } from '../types';
import { formatINR } from '../utils/portfolioMath';

interface ClientConfigBarProps {
  client: ClientProfile;
  onUpdateClient: (updates: Partial<ClientProfile>) => void;
  allocationMode: 'percent' | 'absolute';
  onToggleAllocationMode: (mode: 'percent' | 'absolute') => void;
  totalAllocatedPercent: number;
  totalAllocatedAmount: number;
  onNormalizeTo100: () => void;
}

export const ClientConfigBar: React.FC<ClientConfigBarProps> = ({
  client,
  onUpdateClient,
  allocationMode,
  onToggleAllocationMode,
  totalAllocatedPercent,
  totalAllocatedAmount,
  onNormalizeTo100,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isFullyAllocated = Math.abs(totalAllocatedPercent - 100) < 0.1;
  const isOverAllocated = totalAllocatedPercent > 100.1;
  const isUnderAllocated = totalAllocatedPercent < 99.9;

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Client & Proposal Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 flex-1">
            
            {/* Client Name */}
            <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
              <User className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="w-full">
                <label htmlFor="client-name-input" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Client Name</label>
                <input
                  id="client-name-input"
                  type="text"
                  value={client.clientName}
                  onChange={(e) => onUpdateClient({ clientName: e.target.value })}
                  placeholder="e.g. Ramesh Shah"
                  className="w-full text-xs font-semibold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                />
              </div>
            </div>

            {/* Total Investment Capital */}
            <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
              <span className="text-sm font-bold text-slate-500 shrink-0">₹</span>
              <div className="w-full">
                <label htmlFor="client-capital-input" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Portfolio Capital</label>
                <div className="flex items-center">
                  <input
                    id="client-capital-input"
                    type="number"
                    step="50000"
                    min="10000"
                    value={client.totalInvestment}
                    onChange={(e) => onUpdateClient({ totalInvestment: Number(e.target.value) || 0 })}
                    className="w-full text-xs font-semibold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                  />
                  <span className="text-[11px] font-medium text-blue-600 ml-1 shrink-0">
                    ({formatINR(client.totalInvestment, client.currency)})
                  </span>
                </div>
              </div>
            </div>

            {/* Risk Profile */}
            <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
              <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="w-full">
                <label htmlFor="client-risk-select" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Risk Profile</label>
                <select
                  id="client-risk-select"
                  value={client.riskProfile}
                  onChange={(e) => onUpdateClient({ riskProfile: e.target.value as ClientProfile['riskProfile'] })}
                  className="w-full text-xs font-semibold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 cursor-pointer"
                >
                  <option value="Conservative">Conservative</option>
                  <option value="Moderately Conservative">Moderately Conservative</option>
                  <option value="Balanced">Balanced</option>
                  <option value="Growth">Growth</option>
                  <option value="Aggressive">Aggressive</option>
                </select>
              </div>
            </div>

            {/* Investment Horizon & Monthly SIP */}
            <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="w-full flex items-center justify-between">
                <div>
                  <label htmlFor="client-horizon-select" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Horizon</label>
                  <select
                    id="client-horizon-select"
                    value={client.investmentHorizonYears}
                    onChange={(e) => onUpdateClient({ investmentHorizonYears: Number(e.target.value) })}
                    className="text-xs font-semibold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 cursor-pointer"
                  >
                    <option value={3}>3 Years</option>
                    <option value={5}>5 Years</option>
                    <option value={7}>7 Years</option>
                    <option value={10}>10 Years</option>
                    <option value={15}>15 Years</option>
                    <option value={20}>20 Years</option>
                  </select>
                </div>
                <div className="text-right border-l border-slate-200 pl-2">
                  <label htmlFor="client-sip-input" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Monthly SIP</label>
                  <input
                    id="client-sip-input"
                    type="number"
                    step="5000"
                    value={client.monthlySip}
                    onChange={(e) => onUpdateClient({ monthlySip: Number(e.target.value) || 0 })}
                    className="w-16 text-right text-xs font-semibold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right: Allocation Mode Switch & Status */}
          <div className="flex items-center space-x-3 shrink-0 justify-between lg:justify-end">
            
            {/* Toggle % vs Amount */}
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                id="toggle-percent-mode-btn"
                onClick={() => onToggleAllocationMode('percent')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md font-medium transition-all ${
                  allocationMode === 'percent'
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Percent (%)</span>
              </button>
              <button
                id="toggle-amount-mode-btn"
                onClick={() => onToggleAllocationMode('absolute')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md font-medium transition-all ${
                  allocationMode === 'absolute'
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="font-bold text-xs">₹</span>
                <span>Amount (INR)</span>
              </button>
            </div>

            {/* Total Allocated Badge */}
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                isFullyAllocated
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : isOverAllocated
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {isFullyAllocated ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <div>
                <span className="font-bold">{totalAllocatedPercent}%</span>
                <span className="text-slate-600 ml-1 hidden sm:inline">({formatINR(totalAllocatedAmount, client.currency)})</span>
              </div>

              {!isFullyAllocated && (
                <button
                  id="rebalance-100-btn"
                  onClick={onNormalizeTo100}
                  className="ml-2 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold transition-colors shrink-0"
                  title="Scale weights proportionally to exactly 100%"
                >
                  Fix to 100%
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
