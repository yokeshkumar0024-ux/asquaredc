import React, { useState, useMemo } from 'react';
import { DeliveryChallan, ChallanType, ChallanStatus } from '../../types/erp';
import { CHALLAN_TYPE_INFO } from './ChallanForm';
import { formatINR, formatDateIN } from '../../services/gstCalculator';
import {
  Search,
  Filter,
  Plus,
  Printer,
  FileCheck,
  Eye,
  Download,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react';

interface ChallanListProps {
  challans: DeliveryChallan[];
  onNewChallan: () => void;
  onViewChallan: (challan: DeliveryChallan) => void;
  onPrintChallan: (challan: DeliveryChallan) => void;
  onOpenPOD: (challan: DeliveryChallan) => void;
  onVerifyQR: (challan: DeliveryChallan) => void;
}

export const ChallanList: React.FC<ChallanListProps> = ({
  challans,
  onNewChallan,
  onViewChallan,
  onPrintChallan,
  onOpenPOD,
  onVerifyQR,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Filtered List
  const filteredChallans = useMemo(() => {
    return challans.filter((c) => {
      if (selectedType !== 'ALL' && c.challanType !== selectedType) return false;
      if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNum = c.challanNumber.toLowerCase().includes(q);
        const matchParty = (c.customerName || c.supplierName || '').toLowerCase().includes(q);
        const matchVehicle = (c.transportDetails?.vehicleNumber || '').toLowerCase().includes(q);
        const matchLR = (c.transportDetails?.lrNumber || '').toLowerCase().includes(q);
        const matchEWB = (c.eWayBillDetails?.eWayBillNumber || '').toLowerCase().includes(q);
        const matchItems = c.items.some((i) => i.productName.toLowerCase().includes(q) || i.productCode.toLowerCase().includes(q));
        if (!matchNum && !matchParty && !matchVehicle && !matchLR && !matchEWB && !matchItems) {
          return false;
        }
      }

      return true;
    });
  }, [challans, selectedType, selectedStatus, searchTerm]);

  const handleExportCSV = () => {
    const headers = [
      'Challan Number',
      'Date',
      'FY',
      'Type',
      'Party Name',
      'Status',
      'Taxable Value',
      'Total Amount',
      'Vehicle No',
      'E-Way Bill',
    ];

    const rows = filteredChallans.map((c) => [
      `"${c.challanNumber}"`,
      `"${c.challanDate.split('T')[0]}"`,
      `"${c.financialYear}"`,
      `"${c.challanType}"`,
      `"${c.customerName || c.supplierName || 'Internal'}"`,
      `"${c.status}"`,
      c.totalTaxableAmount,
      c.totalAmount,
      `"${c.transportDetails.vehicleNumber || ''}"`,
      `"${c.eWayBillDetails.eWayBillNumber || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `challan_register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: ChallanStatus) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Delivered</span>;
      case 'PARTIALLY_DELIVERED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Partially Delivered</span>;
      case 'IN_TRANSIT':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">In Transit</span>;
      case 'READY_FOR_DISPATCH':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">Ready for Dispatch</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">Cancelled</span>;
      case 'PENDING_APPROVAL':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800">Pending Approval</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Challan #, Customer, Vehicle, LR, Product..."
              className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Challan Types (12)</option>
              {Object.keys(CHALLAN_TYPE_INFO).map((type) => (
                <option key={type} value={type}>
                  {CHALLAN_TYPE_INFO[type as ChallanType].label}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="PARTIALLY_DELIVERED">Partially Delivered</option>
              <option value="DELIVERED">Fully Delivered</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>

          <button
            onClick={onNewChallan}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" /> New Delivery Challan
          </button>
        </div>
      </div>

      {/* Challans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/70 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Challan Details</th>
                <th className="p-3.5">Type & Purpose</th>
                <th className="p-3.5">Consignee / Destination</th>
                <th className="p-3.5">Transport & Vehicle</th>
                <th className="p-3.5 text-center">Items & Delivery</th>
                <th className="p-3.5 text-right">Consignment Value</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChallans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800">No Delivery Challans Found</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {challans.length === 0
                        ? 'Your delivery register is empty. Click below to create your first consignment challan.'
                        : 'No documents match the current filter or search criteria.'}
                    </p>
                    <button
                      onClick={onNewChallan}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      <Plus className="w-4 h-4" /> Create Delivery Challan
                    </button>
                  </td>
                </tr>
              ) : (
                filteredChallans.map((c) => {
                  const totalDispatch = c.items.reduce((s, i) => s + i.dispatchQty, 0);
                  const totalDelivered = c.items.reduce((s, i) => s + i.deliveredQty, 0);
                  const isEWayBill = Boolean(c.eWayBillDetails?.eWayBillNumber);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-blue-900 text-xs">{c.challanNumber}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{formatDateIN(c.challanDate)}</div>
                        <span className="text-[10px] text-slate-400 font-mono">FY: {c.financialYear}</span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            CHALLAN_TYPE_INFO[c.challanType]?.badgeColor || 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {c.challanType.replace(/_/g, ' ')}
                        </span>
                        <div className="text-[11px] text-slate-600 line-clamp-1 mt-1 max-w-[200px]" title={c.challanPurpose}>
                          {c.challanPurpose}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 line-clamp-1 max-w-[220px]">
                          {c.customerName || c.supplierName || 'Inter-Branch Stock Transfer'}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[220px]">
                          {c.shippingCity || c.shippingState || c.customerState || 'Internal'}
                        </div>
                        {c.customerGstin && (
                          <div className="text-[10px] text-slate-400 font-mono">GSTIN: {c.customerGstin}</div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-800">
                          {c.transportDetails.vehicleNumber || 'Self Pickup'}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {c.transportDetails.transporterName || 'Fleet'}
                        </div>
                        {isEWayBill && (
                          <span className="inline-block text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 mt-0.5">
                            EWB: {c.eWayBillDetails.eWayBillNumber}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="font-mono font-bold text-slate-800">
                          {totalDelivered} / {totalDispatch} Units
                        </div>
                        <div className="w-24 bg-slate-200 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                          <div
                            className={`h-full ${totalDelivered === totalDispatch ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{
                              width: `${totalDispatch > 0 ? (totalDelivered / totalDispatch) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">{c.items.length} line item(s)</span>
                      </td>

                      <td className="p-3.5 text-right font-mono">
                        <div className="font-bold text-slate-900">{formatINR(c.totalAmount)}</div>
                        <div className="text-[10px] text-slate-400">Tax: {formatINR(c.totalCgstAmount + c.totalSgstAmount + c.totalIgstAmount)}</div>
                      </td>

                      <td className="p-3.5 text-center">{getStatusBadge(c.status)}</td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewChallan(c)}
                            title="View Challan Details & Workflow"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onPrintChallan(c)}
                            title="Print / Save Triplicate GST Challan"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {c.status !== 'DELIVERED' && c.status !== 'CANCELLED' && (
                            <button
                              onClick={() => onOpenPOD(c)}
                              title="Record Proof of Delivery (POD)"
                              className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            >
                              <FileCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onVerifyQR(c)}
                            title="Verify Authentic QR Code"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
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
    </div>
  );
};
