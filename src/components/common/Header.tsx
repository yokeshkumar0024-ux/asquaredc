import React from 'react';
import { Company, User } from '../../types/erp';
import { ERPStorage } from '../../services/storage';
import {
  Building2,
  User as UserIcon,
  Bell,
  Search,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  companies: Company[];
  activeCompanyId: string;
  onCompanyChange: (id: string) => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenAudit: () => void;
  onGlobalSearch: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  companies,
  activeCompanyId,
  onCompanyChange,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenAudit,
  onGlobalSearch,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Branding & Multi-Company Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
              CP
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-slate-900 block leading-tight">
                ChallanPro ERP
              </span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Rule 55 Compliant
              </span>
            </div>
          </div>

          {/* Tenant / Company Header Display */}
          <div className="hidden md:flex items-center gap-1.5 pl-4 border-l border-slate-200">
            <Building2 className="w-4 h-4 text-slate-400" />
            {companies.length > 1 ? (
              <select
                value={activeCompanyId}
                onChange={(e) => onCompanyChange(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg py-1.5 px-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tradeName || c.name} {c.gstin ? `(${c.gstin})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-bold text-slate-800">
                {companies[0]?.tradeName || companies[0]?.name || 'My Company'}
                {companies[0]?.gstin ? ` (${companies[0].gstin})` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Center: Global Quick Search */}
        <div className="hidden lg:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              onChange={(e) => onGlobalSearch(e.target.value)}
              placeholder="Global Search (Challan #, GSTIN, Vehicle, Product)..."
              className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Right: Audit & Notifications */}
        <div className="flex items-center gap-3">
          {/* 27-Point System Audit */}
          <button
            onClick={onOpenAudit}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>27-Pt Audit</span>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Clean Admin Badge */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
              A
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-slate-900 block leading-tight">Admin Console</span>
              <span className="text-[10px] text-emerald-600 font-semibold block">Online</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
