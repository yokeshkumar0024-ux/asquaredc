import React, { useState } from 'react';
import { SalesOrder, PurchaseOrder, Product } from '../../types/erp';
import { ERPStorage } from '../../services/storage';
import { formatINR, formatDateIN } from '../../services/gstCalculator';
import {
  ShoppingCart,
  Package,
  Plus,
  Send,
  CheckCircle,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface OrderManagementViewProps {
  onGenerateChallanFromSO: (so: SalesOrder) => void;
}

export const OrderManagementView: React.FC<OrderManagementViewProps> = ({ onGenerateChallanFromSO }) => {
  const [activeTab, setActiveTab] = useState<'SO' | 'PO'>('SO');
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() => ERPStorage.getSalesOrders());
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => ERPStorage.getPurchaseOrders());
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);

  // New SO Form State
  const customers = ERPStorage.getCustomers();
  const products = ERPStorage.getProducts();
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [orderDeliveryDate, setOrderDeliveryDate] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );
  const [orderItems, setOrderItems] = useState([
    {
      productId: products[0]?.id || '',
      qty: 10,
      price: products[0]?.unitPrice || 1000,
    },
  ]);

  const handleCreateSalesOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (!cust) return;

    const soItems = orderItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const subtotal = item.qty * item.price;
      const tax = (subtotal * (prod?.taxRate || 18)) / 100;
      return {
        productId: item.productId,
        productCode: prod?.itemCode || 'CODE',
        productName: prod?.name || 'Item',
        hsnCode: prod?.hsnCode || '84818030',
        uom: prod?.uom || 'PCS',
        orderedQty: item.qty,
        dispatchedQty: 0,
        pendingQty: item.qty,
        unitPrice: item.price,
        taxRate: prod?.taxRate || 18,
        totalAmount: subtotal + tax,
      };
    });

    const total = soItems.reduce((s, i) => s + i.totalAmount, 0);
    const newSO: SalesOrder = {
      id: `so_${Date.now()}`,
      companyId: ERPStorage.getActiveCompanyId(),
      soNumber: ERPStorage.getNextDocumentNumber('SO'),
      financialYear: ERPStorage.getFinancialYear(),
      customerId: cust.id,
      customerName: cust.name,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: orderDeliveryDate,
      items: soItems,
      totalAmount: total,
      status: 'CONFIRMED',
      challanIds: [],
      createdAt: new Date().toISOString(),
    };

    ERPStorage.saveSalesOrder(newSO);
    setSalesOrders(ERPStorage.getSalesOrders());
    setNewOrderModalOpen(false);
    alert(`Sales Order ${newSO.soNumber} created successfully! You can now generate Delivery Challans against it.`);
  };

  return (
    <div className="space-y-4">
      {/* Module Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('SO')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'SO' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-4 h-4" /> Customer Sales Orders ({salesOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('PO')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'PO' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" /> Supplier Purchase Orders ({purchaseOrders.length})
            </button>
          </div>
        </div>

        <div>
          <button
            onClick={() => setNewOrderModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" /> Create New Sales Order
          </button>
        </div>
      </div>

      {/* Content Tab */}
      {activeTab === 'SO' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">SO Number & Date</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Target Delivery Date</th>
                <th className="p-3.5 text-center">Ordered vs Dispatched</th>
                <th className="p-3.5 text-right">Order Value</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Direct Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesOrders.map((so) => {
                const totalOrdered = so.items.reduce((s, i) => s + i.orderedQty, 0);
                const totalDispatched = so.items.reduce((s, i) => s + i.dispatchedQty, 0);
                const isFullyDispatched = totalDispatched >= totalOrdered;

                return (
                  <tr key={so.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-blue-900">{so.soNumber}</div>
                      <div className="text-[11px] text-slate-500">{formatDateIN(so.orderDate)}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800">{so.customerName}</div>
                      <div className="text-[11px] text-slate-500">{so.items.length} line item(s)</div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-700">{formatDateIN(so.deliveryDate)}</td>
                    <td className="p-3.5 text-center">
                      <div className="font-mono font-bold text-slate-800">
                        {totalDispatched} / {totalOrdered} Units
                      </div>
                      <div className="w-24 bg-slate-200 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                        <div
                          className={`h-full ${isFullyDispatched ? 'bg-emerald-500' : 'bg-blue-600'}`}
                          style={{
                            width: `${totalOrdered > 0 ? (totalDispatched / totalOrdered) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      {formatINR(so.totalAmount)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isFullyDispatched
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {so.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {!isFullyDispatched ? (
                        <button
                          onClick={() => onGenerateChallanFromSO(so)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs mx-auto transition-all"
                        >
                          <Send className="w-3.5 h-3.5" /> Generate Challan
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-700 flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">PO Number & Date</th>
                <th className="p-3.5">Supplier / Vendor</th>
                <th className="p-3.5">Expected Delivery Date</th>
                <th className="p-3.5 text-center">Ordered vs Received</th>
                <th className="p-3.5 text-right">PO Total Value</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseOrders.map((po) => {
                const totalOrdered = po.items.reduce((s, i) => s + i.orderedQty, 0);
                const totalReceived = po.items.reduce((s, i) => s + i.receivedQty, 0);

                return (
                  <tr key={po.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-slate-900">{po.poNumber}</div>
                      <div className="text-[11px] text-slate-500">{formatDateIN(po.poDate)}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800">{po.supplierName}</div>
                      <div className="text-[11px] text-slate-500">{po.items.length} line item(s)</div>
                    </td>
                    <td className="p-3.5 font-medium">{formatDateIN(po.expectedDeliveryDate)}</td>
                    <td className="p-3.5 text-center">
                      <span className="font-mono font-bold text-slate-800">
                        {totalReceived} / {totalOrdered} Units
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      {formatINR(po.totalAmount)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {po.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New SO Modal */}
      {newOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Create New Customer Sales Order</h3>
            <form onSubmit={handleCreateSalesOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 font-medium"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Committed Delivery Date</label>
                <input
                  type="date"
                  required
                  value={orderDeliveryDate}
                  onChange={(e) => setOrderDeliveryDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Item & Quantity</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={orderItems[0].productId}
                    onChange={(e) => {
                      const prod = products.find((p) => p.id === e.target.value);
                      setOrderItems([{ productId: e.target.value, qty: orderItems[0].qty, price: prod?.unitPrice || 1000 }]);
                    }}
                    className="text-xs p-2 rounded-lg border border-slate-300"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={orderItems[0].qty}
                    onChange={(e) =>
                      setOrderItems([{ ...orderItems[0], qty: Number(e.target.value) }])
                    }
                    className="text-xs p-2 rounded-lg border border-slate-300 text-center font-bold"
                    placeholder="Quantity"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setNewOrderModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                >
                  Confirm & Create Sales Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
