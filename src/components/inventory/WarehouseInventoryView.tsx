import React, { useState } from 'react';
import { Warehouse, Product, StockBalance, StockLedgerEntry } from '../../types/erp';
import { ERPStorage } from '../../services/storage';
import { formatINR, formatDateIN, formatDateTimeIN } from '../../services/gstCalculator';
import { ProductBarcode } from '../common/BarcodeAndQR';
import {
  Warehouse as WarehouseIcon,
  Layers,
  ArrowUpDown,
  AlertTriangle,
  History,
  Plus,
  Minus,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react';

export const WarehouseInventoryView: React.FC = () => {
  const warehouses = ERPStorage.getWarehouses();
  const products = ERPStorage.getProducts();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || 'wh_01');
  const [activeSubTab, setActiveSubTab] = useState<'STOCK' | 'LEDGER' | 'BATCHES'>('STOCK');
  const [stockAdjustmentModalOpen, setStockAdjustmentModalOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState(products[0]?.id || '');
  const [adjustType, setAdjustType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [adjustQty, setAdjustQty] = useState(5);
  const [adjustReason, setAdjustReason] = useState('Physical audit variance');

  const stockBalances = ERPStorage.getStockBalances();
  const stockLedger = ERPStorage.getStockLedger();

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = adjustType === 'ADD' ? adjustQty : -adjustQty;
    ERPStorage.recordStockAdjustment(selectedWarehouseId, adjustProductId, qty, adjustReason);
    setStockAdjustmentModalOpen(false);
    alert(`Stock adjustment of ${qty > 0 ? '+' : ''}${qty} units recorded in ledger.`);
  };

  const currentWH = warehouses.find((w) => w.id === selectedWarehouseId);

  // Compute Total Inventory Valuation for selected warehouse
  const whBalances = stockBalances.filter((b) => b.warehouseId === selectedWarehouseId);
  const totalValuation = whBalances.reduce((sum, b) => sum + b.currentStock * b.valuationRate, 0);

  return (
    <div className="space-y-4">
      {/* Top Warehouse Switcher & Summary Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <WarehouseIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Active Warehouse:</label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="text-sm font-bold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manager: <strong>{currentWH?.managerName}</strong> | Contact: {currentWH?.contactNumber} | Capacity: {currentWH?.capacitySqFt?.toLocaleString('en-IN')} sq.ft.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Stock Valuation</span>
            <div className="text-lg font-black text-slate-900 font-mono">{formatINR(totalValuation)}</div>
          </div>

          <button
            onClick={() => setStockAdjustmentModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <ArrowUpDown className="w-4 h-4" /> Stock Adjustment
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold w-fit">
        <button
          onClick={() => setActiveSubTab('STOCK')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeSubTab === 'STOCK' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Stock Balances & Safety Alerts
        </button>
        <button
          onClick={() => setActiveSubTab('LEDGER')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeSubTab === 'LEDGER' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Real-Time Movement Ledger ({stockLedger.length})
        </button>
      </div>

      {/* Tab 1: Warehouse Stock Balances */}
      {activeSubTab === 'STOCK' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Product Details & Barcode</th>
                <th className="p-3.5 text-center">HSN</th>
                <th className="p-3.5 text-center">Opening Stock</th>
                <th className="p-3.5 text-center">Available Stock</th>
                <th className="p-3.5 text-center">Reserved</th>
                <th className="p-3.5 text-center">In Transit</th>
                <th className="p-3.5 text-right">Valuation Rate</th>
                <th className="p-3.5 text-right">Total Value</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((prod) => {
                const bal = whBalances.find((b) => b.productId === prod.id) || {
                  openingStock: 0,
                  currentStock: 0,
                  reservedStock: 0,
                  damagedStock: 0,
                  inTransitStock: 0,
                  valuationRate: prod.unitPrice,
                };

                const isLowStock = bal.currentStock <= prod.minStockAlert;
                const lineValuation = bal.currentStock * bal.valuationRate;

                return (
                  <tr key={prod.id} className="hover:bg-slate-50">
                    <td className="p-3.5 space-y-1">
                      <div className="font-bold text-slate-900">{prod.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-500">{prod.itemCode}</span>
                        <ProductBarcode code={prod.barcode} height={20} />
                      </div>
                    </td>

                    <td className="p-3.5 text-center font-mono">{prod.hsnCode}</td>

                    <td className="p-3.5 text-center font-mono font-medium text-slate-600">
                      {bal.openingStock} {prod.uom}
                    </td>

                    <td className="p-3.5 text-center font-mono font-bold text-base text-slate-900">
                      {bal.currentStock} {prod.uom}
                    </td>

                    <td className="p-3.5 text-center font-mono text-slate-500">
                      {bal.reservedStock} {prod.uom}
                    </td>

                    <td className="p-3.5 text-center font-mono text-blue-600 font-semibold">
                      {bal.inTransitStock} {prod.uom}
                    </td>

                    <td className="p-3.5 text-right font-mono">{formatINR(bal.valuationRate)}</td>

                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      {formatINR(lineValuation)}
                    </td>

                    <td className="p-3.5 text-center">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> Reorder Alert (&lt; {prod.minStockAlert})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Adequate Stock
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Stock Movement Ledger */}
      {activeSubTab === 'LEDGER' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Txn Type & Ref</th>
                <th className="p-3.5">Product</th>
                <th className="p-3.5 text-center">Inward (+)</th>
                <th className="p-3.5 text-center">Outward (-)</th>
                <th className="p-3.5 text-center">Balance</th>
                <th className="p-3.5">Audit Remarks & User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No ledger entries recorded yet. Dispatches and adjustments will appear here.
                  </td>
                </tr>
              ) : (
                stockLedger.map((entry) => {
                  const prod = products.find((p) => p.id === entry.productId);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {formatDateTimeIN(entry.date)}
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-blue-900">{entry.referenceNo}</span>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">{entry.transactionType}</div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {prod?.name || 'Product'}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-emerald-600">
                        {entry.inwardQty > 0 ? `+${entry.inwardQty}` : '-'}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-rose-600">
                        {entry.outwardQty > 0 ? `-${entry.outwardQty}` : '-'}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-900">
                        {entry.balanceQty}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div>{entry.remarks}</div>
                        <div className="text-[10px] text-slate-400">By: {entry.userName}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {stockAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-blue-600" /> Stock Adjustment at {currentWH?.name}
            </h3>
            <form onSubmit={handleApplyAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product</label>
                <select
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.itemCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('ADD')}
                    className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                      adjustType === 'ADD'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-300 text-slate-600'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Inward (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('DEDUCT')}
                    className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                      adjustType === 'DEDUCT'
                        ? 'border-rose-600 bg-rose-50 text-rose-800 shadow-xs'
                        : 'border-slate-300 text-slate-600'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" /> Outward (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono font-bold text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Adjustment</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Physical inventory count variance / testing sample"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStockAdjustmentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                >
                  Apply & Record in Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
