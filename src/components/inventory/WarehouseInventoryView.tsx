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
  Package,
  X,
} from 'lucide-react';

export const WarehouseInventoryView: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const warehouses = ERPStorage.getWarehouses();
  const products = ERPStorage.getProducts();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || 'wh_01');
  const [activeSubTab, setActiveSubTab] = useState<'STOCK' | 'LEDGER'>('STOCK');

  // Stock Adjustment Modal
  const [stockAdjustmentModalOpen, setStockAdjustmentModalOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState(products[0]?.id || '');
  const [adjustType, setAdjustType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [adjustQty, setAdjustQty] = useState(5);
  const [adjustReason, setAdjustReason] = useState('Physical audit variance');

  // New Product Modal
  const [newProductModalOpen, setNewProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newHsnCode, setNewHsnCode] = useState('84818030');
  const [newUom, setNewUom] = useState('PCS');
  const [newUnitPrice, setNewUnitPrice] = useState<number>(1000);
  const [newTaxRate, setNewTaxRate] = useState<number>(18);
  const [newOpeningStock, setNewOpeningStock] = useState<number>(10);
  const [newMinStockAlert, setNewMinStockAlert] = useState<number>(5);
  const [newCategory, setNewCategory] = useState('General Goods');

  const stockBalances = ERPStorage.getStockBalances();
  const stockLedger = ERPStorage.getStockLedger();

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId) {
      alert('Please select a product.');
      return;
    }
    const qty = adjustType === 'ADD' ? adjustQty : -adjustQty;
    ERPStorage.recordStockAdjustment(selectedWarehouseId, adjustProductId, qty, adjustReason);
    setStockAdjustmentModalOpen(false);
    setRefreshTrigger((prev) => prev + 1);
    alert(`Stock adjustment of ${qty > 0 ? '+' : ''}${qty} units recorded in ledger.`);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      alert('Please enter a product name.');
      return;
    }

    const prodId = `prod_${Date.now()}`;
    const itemCode = newItemCode.trim() || `ITM-${Date.now().toString().slice(-4)}`;
    const newProduct: Product = {
      id: prodId,
      companyId: ERPStorage.getActiveCompanyId(),
      itemCode,
      name: newProductName.trim(),
      description: `${newProductName.trim()} - HSN ${newHsnCode}`,
      hsnCode: newHsnCode.trim() || '84818030',
      uom: newUom,
      unitPrice: Number(newUnitPrice) || 0,
      taxRate: Number(newTaxRate) || 18,
      hasBatchTracking: true,
      hasSerialTracking: false,
      hasExpiryTracking: false,
      minStockAlert: Number(newMinStockAlert) || 5,
      barcode: `890${Date.now().toString().slice(-10)}`,
      category: newCategory.trim() || 'General Goods',
    };

    ERPStorage.saveProduct(newProduct);

    if (newOpeningStock > 0) {
      ERPStorage.recordStockAdjustment(
        selectedWarehouseId,
        prodId,
        Number(newOpeningStock),
        'Opening Stock Balance Entry'
      );
    }

    // Reset form
    setNewProductName('');
    setNewItemCode('');
    setNewOpeningStock(10);
    setNewUnitPrice(1000);
    setNewProductModalOpen(false);
    setRefreshTrigger((prev) => prev + 1);
    alert(`Product "${newProduct.name}" registered successfully with ${newOpeningStock} units opening stock!`);
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
              Manager: <strong>{currentWH?.managerName || 'Operations Lead'}</strong> | Contact: {currentWH?.contactNumber || 'Available'} | Capacity: {currentWH?.capacitySqFt?.toLocaleString('en-IN') || '10,000'} sq.ft.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right mr-2 hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Stock Valuation</span>
            <div className="text-lg font-black text-slate-900 font-mono">{formatINR(totalValuation)}</div>
          </div>

          <button
            onClick={() => setNewProductModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>

          <button
            onClick={() => {
              if (products.length === 0) {
                alert('Please register at least one product first before recording stock adjustments.');
                setNewProductModalOpen(true);
                return;
              }
              if (!adjustProductId) setAdjustProductId(products[0]?.id || '');
              setStockAdjustmentModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
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
          Stock Balances & Safety Alerts ({products.length})
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
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-slate-800 text-sm">No Products Registered Yet</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Your inventory is completely empty. Click 'Add Product' to enter your own items, HSN codes, and opening stock.
                    </p>
                    <button
                      onClick={() => setNewProductModalOpen(true)}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      <Plus className="w-4 h-4" /> Add First Product
                    </button>
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
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

                      <td className="p-3.5 text-center font-mono text-blue-600">
                        {bal.inTransitStock} {prod.uom}
                      </td>

                      <td className="p-3.5 text-right font-mono">{formatINR(bal.valuationRate)}</td>

                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        {formatINR(lineValuation)}
                      </td>

                      <td className="p-3.5 text-center">
                        {isLowStock ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Reorder
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Real-Time Movement Ledger */}
      {activeSubTab === 'LEDGER' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Date & Time</th>
                <th className="p-3.5">Product Name</th>
                <th className="p-3.5 text-center">Type</th>
                <th className="p-3.5 text-center">Inward (+)</th>
                <th className="p-3.5 text-center">Outward (-)</th>
                <th className="p-3.5 text-center">Balance Stock</th>
                <th className="p-3.5">Reason / Reference Document</th>
                <th className="p-3.5">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockLedger.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-slate-800 text-sm">No Inventory Movements Recorded Yet</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Every stock inward, dispatch challan, goods return, and physical adjustment is automatically logged here with a timestamp.
                    </p>
                  </td>
                </tr>
              ) : (
                stockLedger.map((entry) => {
                  const prod = products.find((p) => p.id === entry.productId);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono text-slate-500">{formatDateTimeIN(entry.createdAt || entry.date)}</td>
                      <td className="p-3.5 font-bold text-slate-900">{prod?.name || entry.productId}</td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            entry.inwardQty > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {entry.transactionType || (entry.inwardQty > 0 ? 'INWARD' : 'OUTWARD')}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-emerald-700">
                        {entry.inwardQty > 0 ? `+${entry.inwardQty}` : '-'}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-rose-700">
                        {entry.outwardQty > 0 ? `-${entry.outwardQty}` : '-'}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-900">{entry.balanceQty}</td>
                      <td className="p-3.5 text-slate-700">{entry.remarks || entry.referenceNo || 'Adjustment'}</td>
                      <td className="p-3.5 text-slate-500">{entry.userName}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Add New Product */}
      {newProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" /> Register New Product / Inventory Item
              </h3>
              <button onClick={() => setNewProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product / Item Name *</label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. Mild Steel Flange 150mm"
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Item Code / SKU</label>
                  <input
                    type="text"
                    value={newItemCode}
                    onChange={(e) => setNewItemCode(e.target.value)}
                    placeholder="e.g. MS-FLG-150"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HSN / SAC Code *</label>
                  <input
                    type="text"
                    required
                    value={newHsnCode}
                    onChange={(e) => setNewHsnCode(e.target.value)}
                    placeholder="e.g. 73072100"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measure (UOM)</label>
                  <select
                    value={newUom}
                    onChange={(e) => setNewUom(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                  >
                    <option value="PCS">PCS</option>
                    <option value="NOS">NOS</option>
                    <option value="KGS">KGS</option>
                    <option value="MTR">MTR</option>
                    <option value="BOX">BOX</option>
                    <option value="SET">SET</option>
                    <option value="LTR">LTR</option>
                    <option value="PKT">PKT</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold text-right"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST Tax Rate (%)</label>
                  <select
                    value={newTaxRate}
                    onChange={(e) => setNewTaxRate(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-center"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Opening Stock (Units)</label>
                  <input
                    type="number"
                    min="0"
                    value={newOpeningStock}
                    onChange={(e) => setNewOpeningStock(Number(e.target.value))}
                    className="w-full p-2 border border-blue-300 rounded-lg font-mono font-bold text-center bg-blue-50/50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Safety Alert Stock</label>
                  <input
                    type="number"
                    min="1"
                    value={newMinStockAlert}
                    onChange={(e) => setNewMinStockAlert(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Raw Material, Finished Goods, Spares"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setNewProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md"
                >
                  Save & Register Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Stock Adjustment Modal */}
      {stockAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-blue-600" /> Inventory Stock Adjustment
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Reconcile physical stock with warehouse book ledger. Every adjustment is immutably logged.
            </p>

            <form onSubmit={handleApplyAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product</label>
                <select
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-bold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.itemCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('ADD')}
                    className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                      adjustType === 'ADD'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Inward (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('DEDUCT')}
                    className={`py-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                      adjustType === 'DEDUCT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300'
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
