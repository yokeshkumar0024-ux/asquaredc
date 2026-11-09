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
  currentUser: User;
  onUserChange: (user: User) => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenAudit: () => void;
  onGlobalSearch: (term: string) => void;
  isCustomerPortalActive: boolean;
  onToggleCustomerPortal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  companies,
  activeCompanyId,
  onCompanyChange,
  currentUser,
  onUserChange,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenAudit,
  onGlobalSearch,
  isCustomerPortalActive,
  onToggleCustomerPortal,
}) => {
  const users = ERPStorage.getUsers();
  const currentCompany = companies.find((c) => c.id === activeCompanyId) || companies[0];

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

          {/* Tenant Switcher */}
          <div className="hidden md:flex items-center gap-1.5 pl-4 border-l border-slate-200">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={activeCompanyId}
              onChange={(e) => onCompanyChange(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg py-1.5 px-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tradeName || c.name} (GSTIN: {c.gstin.slice(0, 5)}...)
                </option>
              ))}
            </select>
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

        {/* Right: Actions, FY, Role Switcher & Notifications */}
        <div className="flex items-center gap-3">
          {/* Customer Portal Toggle */}
          <button
            onClick={onToggleCustomerPortal}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isCustomerPortalActive
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {isCustomerPortalActive ? 'Exit Customer View' : 'Customer Portal'}
          </button>

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

          {/* User & Role Switcher */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-900 block leading-tight">{currentUser.name}</span>
              <span className="text-[10px] font-mono font-bold text-blue-600 block uppercase">
                {currentUser.role.replace(/_/g, ' ')}
              </span>
            </div>

            <select
              value={currentUser.id}
              onChange={(e) => {
                const matched = users.find((u) => u.id === e.target.value);
                if (matched) onUserChange(matched);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold text-slate-700"
              title="Switch Active Session Role"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.role.replace(/_/g, ' ')} ({u.name.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
