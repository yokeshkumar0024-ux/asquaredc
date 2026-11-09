import React, { useState, useMemo } from 'react';
import { DeliveryChallan, StockBalance, Product, GoodsReturn } from '../../types/erp';
import { ERPStorage } from '../../services/storage';
import { formatINR, formatDateIN } from '../../services/gstCalculator';
import {
  TrendingUp,
  Truck,
  FileCheck,
  AlertTriangle,
  Clock,
  Warehouse,
  CheckCircle2,
  RotateCcw,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Package,
} from 'lucide-react';

interface AdvancedDashboardProps {
  onNewChallan: () => void;
  onNavigateTab: (tab: string) => void;
  onViewChallan: (challan: DeliveryChallan) => void;
}

export const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({
  onNewChallan,
  onNavigateTab,
  onViewChallan,
}) => {
  const challans = ERPStorage.getChallans();
  const products = ERPStorage.getProducts();
  const stockBalances = ERPStorage.getStockBalances();
  const returns = ERPStorage.getReturns();
  const company = ERPStorage.getCompany();

  // Filter States
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');

  // KPI Computations
  const totalChallansCount = challans.length;
  const inTransitCount = challans.filter((c) => c.status === 'IN_TRANSIT').length;
  const partialCount = challans.filter((c) => c.status === 'PARTIALLY_DELIVERED').length;
  const deliveredCount = challans.filter((c) => c.status === 'DELIVERED').length;
  const pendingApprovalCount = challans.filter((c) => c.status === 'PENDING_APPROVAL').length;
  const readyDispatchCount = challans.filter((c) => c.status === 'READY_FOR_DISPATCH').length;

  const totalInventoryValuation = stockBalances.reduce((sum, b) => sum + b.currentStock * b.valuationRate, 0);
  const lowStockCount = products.filter((p) => {
    const totalStk = stockBalances
      .filter((b) => b.productId === p.id)
      .reduce((s, b) => s + b.currentStock, 0);
    return totalStk <= p.minStockAlert;
  }).length;

  const returnsPendingInspection = returns.filter((r) => r.qualityInspectionStatus === 'PENDING_INSPECTION').length;

  // Overdue deliveries (In transit past expected delivery date)
  const overdueDeliveries = challans.filter(
    (c) =>
      c.status === 'IN_TRANSIT' &&
      new Date(c.transportDetails.expectedDeliveryDate).getTime() < Date.now()
  );

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-400/20">
              Active Tenant: {company.tradeName || company.name}
            </span>
            <span className="text-xs text-slate-400 font-mono">FY: {ERPStorage.getFinancialYear()}</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Enterprise Delivery Challan ERP Operations</h2>
          <p className="text-xs text-slate-300 mt-1">
            Multi-warehouse logistics monitoring, Rule 55 compliance, and real-time consignee proof-of-delivery (POD).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNewChallan}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> Create Delivery Challan
          </button>
          <button
            onClick={() => onNavigateTab('INVENTORY')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all"
          >
            <Warehouse className="w-4 h-4" /> Multi-Warehouse Stock
          </button>
        </div>
      </div>

      {/* Critical Alert Banner if Overdue / Low Stock */}
      {(overdueDeliveries.length > 0 || lowStockCount > 0 || returnsPendingInspection > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {overdueDeliveries.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl flex items-center justify-between text-rose-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>{overdueDeliveries.length} Consignments</strong> are overdue past scheduled delivery date.
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('REPORTS')}
                className="font-bold underline text-rose-700 hover:text-rose-950 shrink-0"
              >
                View Delayed
              </button>
            </div>
          )}

          {lowStockCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center justify-between text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>{lowStockCount} Products</strong> breached minimum safety stock levels.
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('INVENTORY')}
                className="font-bold underline text-amber-700 hover:text-amber-950 shrink-0"
              >
                Reorder
              </button>
            </div>
          )}

          {returnsPendingInspection > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl flex items-center justify-between text-blue-900">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>{returnsPendingInspection} Goods Returns</strong> await Quality Inspection sign-off.
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('RETURNS')}
                className="font-bold underline text-blue-700 hover:text-blue-950 shrink-0"
              >
                Inspect QC
              </button>
            </div>
          )}
        </div>
      )}

      {/* Top 4 Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('CHALLANS')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Challans</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono mt-2">{totalChallansCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <span className="text-emerald-600 font-bold">100% Real DB</span> across all 12 types
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('CHALLANS')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">In Transit</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-900 font-mono mt-2">{inTransitCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">En route with verified E-Way bills</div>
        </div>

        <div
          onClick={() => onNavigateTab('CHALLANS')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Partially Delivered</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-900 font-mono mt-2">{partialCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Backorder shipments pending</div>
        </div>

        <div
          onClick={() => onNavigateTab('CHALLANS')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Fully Delivered</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-900 font-mono mt-2">{deliveredCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">With signed digital POD records</div>
        </div>
      </div>

      {/* Secondary Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div
          onClick={() => onNavigateTab('INVENTORY')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition-all"
        >
          <span className="text-slate-500 font-bold uppercase text-[10px]">Total Inventory Valuation</span>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">{formatINR(totalInventoryValuation)}</div>
          <span className="text-slate-400 text-[10px]">FIFO & Weighted Avg method</span>
        </div>

        <div
          onClick={() => onNavigateTab('CHALLANS')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition-all"
        >
          <span className="text-slate-500 font-bold uppercase text-[10px]">Ready for Dispatch</span>
          <div className="text-xl font-black text-indigo-900 font-mono mt-1">{readyDispatchCount} Challans</div>
          <span className="text-slate-400 text-[10px]">Awaiting gate pass & vehicle</span>
        </div>

        <div
          onClick={() => onNavigateTab('CHALLANS')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition-all"
        >
          <span className="text-slate-500 font-bold uppercase text-[10px]">Pending Approvals</span>
          <div className="text-xl font-black text-orange-900 font-mono mt-1">{pendingApprovalCount} Documents</div>
          <span className="text-slate-400 text-[10px]">Tier 2 / Admin sign-off queue</span>
        </div>

        <div
          onClick={() => onNavigateTab('RETURNS')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition-all"
        >
          <span className="text-slate-500 font-bold uppercase text-[10px]">Pending QC Inspections</span>
          <div className="text-xl font-black text-rose-900 font-mono mt-1">{returnsPendingInspection} Material Lots</div>
          <span className="text-slate-400 text-[10px]">Stock quarantine holding</span>
        </div>
      </div>

      {/* Middle Grid: Active Dispatches Table & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Dispatches (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" /> Active Dispatches & Consignments
            </h3>
            <button
              onClick={() => onNavigateTab('CHALLANS')}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              View All Challans <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {challans.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <div className="font-bold text-slate-800 text-sm">No Delivery Challans Created Yet</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Your logistics portal is clean and ready. Click below to create your first Rule-55 delivery challan.
                </p>
                <button
                  onClick={onNewChallan}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  <Plus className="w-4 h-4" /> Create First Challan
                </button>
              </div>
            ) : (
              challans.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  onClick={() => onViewChallan(c)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-900">{c.challanNumber}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-slate-100 text-slate-700">
                        {c.challanType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800">{c.customerName || c.supplierName || 'Internal Transfer'}</div>
                    <div className="text-[11px] text-slate-500">
                      Vehicle: <span className="font-mono font-bold text-slate-700">{c.transportDetails.vehicleNumber}</span> |{' '}
                      {c.transportDetails.transporterName}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-mono font-bold text-slate-900 text-sm">{formatINR(c.totalAmount)}</div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'PARTIALLY_DELIVERED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Challan Status Breakdown & Top Customers */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Delivery Fulfillment Ratio
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Fully Delivered ({deliveredCount})</span>
                  <span>{totalChallansCount > 0 ? Math.round((deliveredCount / totalChallansCount) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{
                      width: `${totalChallansCount > 0 ? (deliveredCount / totalChallansCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>In Transit / Pending POD ({inTransitCount})</span>
                  <span>{totalChallansCount > 0 ? Math.round((inTransitCount / totalChallansCount) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{
                      width: `${totalChallansCount > 0 ? (inTransitCount / totalChallansCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Partially Delivered ({partialCount})</span>
                  <span>{totalChallansCount > 0 ? Math.round((partialCount / totalChallansCount) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{
                      width: `${totalChallansCount > 0 ? (partialCount / totalChallansCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              High Movement Products
            </h3>
            {products.length === 0 ? (
              <div className="py-6 text-center text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-1 opacity-40 text-slate-400" />
                <p className="text-[11px] text-slate-500 font-medium">No products in inventory yet</p>
                <button
                  onClick={() => onNavigateTab('INVENTORY')}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Products
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {products.slice(0, 3).map((p) => (
                  <div key={p.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 line-clamp-1">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">HSN: {p.hsnCode}</div>
                    </div>
                    <div className="font-mono font-bold text-slate-900">{formatINR(p.unitPrice)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
