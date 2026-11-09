import React from 'react';
import {
  LayoutDashboard,
  Truck,
  Warehouse,
  RotateCcw,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAudit: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAudit,
}) => {
  const navItems = [
    { id: 'DASHBOARD', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'CHALLANS', label: 'Delivery Challans (12 Types)', icon: Truck },
    { id: 'INVENTORY', label: 'Multi-Warehouse & Stock', icon: Warehouse },
    { id: 'RETURNS', label: 'Return Management & QC', icon: RotateCcw },
    { id: 'REPORTS', label: '20 Advanced Reports', icon: FileSpreadsheet },
    { id: 'SETTINGS', label: 'Settings & Backups', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 min-h-[calc(100vh-61px)]">
      {/* Navigation Links */}
      <div className="p-3 space-y-1 flex-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core ERP Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="pt-4 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Compliance & Verification
        </div>

        <button
          onClick={onOpenAudit}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-950/40 border border-emerald-500/20 transition-all"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>27-Pt System Audit Matrix</span>
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between font-mono font-bold text-slate-300">
          <span>Rule 55 CGST</span>
          <span className="text-emerald-400">VERIFIED</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Indian Enterprise Delivery Challan & Logistics ERP v2.4.0
        </p>
      </div>
    </aside>
  );
};
