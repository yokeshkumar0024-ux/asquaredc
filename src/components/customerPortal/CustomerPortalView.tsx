import React, { useState } from 'react';
import { DeliveryChallan, Customer } from '../../types/erp';
import { ERPStorage } from '../../services/storage';
import { formatINR, formatDateIN } from '../../services/gstCalculator';
import {
  Building2,
  FileText,
  Printer,
  Truck,
  CheckCircle,
  FileCheck,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

interface CustomerPortalViewProps {
  onPrintChallan: (challan: DeliveryChallan) => void;
  onOpenPOD: (challan: DeliveryChallan) => void;
  onVerifyQR: (challan: DeliveryChallan) => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  onPrintChallan,
  onOpenPOD,
  onVerifyQR,
}) => {
  const customers = ERPStorage.getCustomers();
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || 'cust_01');
  const allChallans = ERPStorage.getChallans();

  const customer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
  // Filter challans strictly for this customer (Tenant and account isolation)
  const customerChallans = allChallans.filter(
    (c) => c.customerId === customer?.id || (c.customerName && c.customerName.includes(customer?.name || ''))
  );

  return (
    <div className="space-y-5">
      {/* Customer Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure Customer Self-Service Portal
          </div>
          <h2 className="text-xl font-black tracking-tight">{customer?.name}</h2>
          <div className="flex flex-wrap gap-x-4 text-xs text-slate-300 font-mono mt-1">
            <span>GSTIN: {customer?.gstin}</span>
            <span>Customer Code: {customer?.customerCode}</span>
            <span>Billing State: {customer?.billingState} ({customer?.billingStateCode})</span>
          </div>
        </div>

        {/* Account Switcher for Demo / Multi-client simulation */}
        <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-xs">
          <label className="block text-slate-300 text-[11px] font-semibold mb-1">
            Switch Customer Account Preview:
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="bg-slate-900 text-white font-bold p-2 rounded-lg border border-slate-700 focus:outline-none"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 font-bold uppercase text-[10px]">Total Consignments</span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">{customerChallans.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-blue-600 font-bold uppercase text-[10px]">In Transit Deliveries</span>
          <div className="text-2xl font-black text-blue-900 font-mono mt-1">
            {customerChallans.filter((c) => c.status === 'IN_TRANSIT' || c.status === 'READY_FOR_DISPATCH').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-amber-600 font-bold uppercase text-[10px]">Partially Received</span>
          <div className="text-2xl font-black text-amber-900 font-mono mt-1">
            {customerChallans.filter((c) => c.status === 'PARTIALLY_DELIVERED').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-emerald-600 font-bold uppercase text-[10px]">Delivered & Acknowledged</span>
          <div className="text-2xl font-black text-emerald-900 font-mono mt-1">
            {customerChallans.filter((c) => c.status === 'DELIVERED').length}
          </div>
        </div>
      </div>

      {/* Customer Challans List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Authorized Consignment Challans
          </h3>
          <span className="text-xs text-slate-500">
            Strict tenant-isolated view for {customer?.name}
          </span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3.5">Challan # & Date</th>
              <th className="p-3.5">Shipping Destination</th>
              <th className="p-3.5">Vehicle & Transporter</th>
              <th className="p-3.5 text-center">Receipt Progress</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-center">Customer Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customerChallans.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  No delivery challans issued for this customer account yet.
                </td>
              </tr>
            ) : (
              customerChallans.map((c) => {
                const totalDisp = c.items.reduce((s, i) => s + i.dispatchQty, 0);
                const totalDeliv = c.items.reduce((s, i) => s + i.deliveredQty, 0);

                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-blue-900">{c.challanNumber}</div>
                      <div className="text-[11px] text-slate-500">{formatDateIN(c.challanDate)}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800 line-clamp-1">{c.shippingAddressText || c.customerAddress}</div>
                      <div className="text-[11px] text-slate-500">{c.shippingCity || c.shippingState}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-mono font-bold text-slate-800">{c.transportDetails.vehicleNumber || 'Pending'}</div>
                      <div className="text-[11px] text-slate-500">{c.transportDetails.transporterName || 'Fleet'}</div>
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="font-mono font-bold text-slate-800">
                        {totalDeliv} / {totalDisp} Units
                      </div>
                      <div className="w-24 bg-slate-200 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                        <div
                          className={`h-full ${totalDeliv === totalDisp ? 'bg-emerald-500' : 'bg-blue-600'}`}
                          style={{
                            width: `${totalDisp > 0 ? (totalDeliv / totalDisp) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </td>

                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onPrintChallan(c)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" /> PDF
                        </button>
                        {c.status !== 'DELIVERED' && c.status !== 'CANCELLED' && (
                          <button
                            onClick={() => onOpenPOD(c)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
                          >
                            <FileCheck className="w-3.5 h-3.5" /> Sign & Acknowledge (POD)
                          </button>
                        )}
                        <button
                          onClick={() => onVerifyQR(c)}
                          className="p-1 text-slate-400 hover:text-emerald-700 rounded"
                          title="Verify Government QR Code"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
