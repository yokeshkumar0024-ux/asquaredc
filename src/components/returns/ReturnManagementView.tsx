import React, { useState } from 'react';
import { GoodsReturn, Product } from '../../types/erp';
import { ERPStorage } from '../../services/storage';
import { formatDateIN, formatDateTimeIN } from '../../services/gstCalculator';
import {
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Plus,
  ShieldAlert,
  FileCheck2,
  Calendar,
} from 'lucide-react';

export const ReturnManagementView: React.FC = () => {
  const [returns, setReturns] = useState<GoodsReturn[]>(() => ERPStorage.getReturns());
  const [newReturnModalOpen, setNewReturnModalOpen] = useState(false);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [activeReturn, setActiveReturn] = useState<GoodsReturn | null>(null);

  // Inspection form state
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [acceptedQty, setAcceptedQty] = useState(0);
  const [rejectedQty, setRejectedQty] = useState(0);

  // New return form state
  const challans = ERPStorage.getChallans();
  const [selectedChallanId, setSelectedChallanId] = useState(challans[0]?.id || '');
  const [returnType, setReturnType] = useState<GoodsReturn['returnType']>('CUSTOMER_RETURN');
  const [reasonForReturn, setReasonForReturn] = useState('');
  const [returnItemQty, setReturnItemQty] = useState(1);

  const handleOpenInspection = (ret: GoodsReturn) => {
    setActiveReturn(ret);
    const item = ret.items[0];
    setAcceptedQty(item?.returnedQty || 0);
    setRejectedQty(0);
    setInspectionNotes('');
    setInspectModalOpen(true);
  };

  const handleCompleteInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReturn) return;

    const currentUser = ERPStorage.getCurrentUser();
    const item = activeReturn.items[0];

    // Update Return record
    const updatedReturn: GoodsReturn = {
      ...activeReturn,
      items: [
        {
          ...item,
          acceptedQty,
          rejectedQty,
        },
      ],
      qualityInspectionStatus:
        rejectedQty === 0
          ? 'INSPECTED_ACCEPTED'
          : acceptedQty === 0
          ? 'INSPECTED_REJECTED'
          : 'PARTIALLY_ACCEPTED',
      inspectedBy: currentUser.name,
      inspectionDate: new Date().toISOString(),
      inspectionRemarks: inspectionNotes,
      stockUpdated: true,
      status: 'COMPLETED',
    };

    // CREDIT STOCK TO WAREHOUSE ONLY NOW (as mandated in rule #7)
    if (acceptedQty > 0) {
      const warehouses = ERPStorage.getWarehouses();
      const whId = warehouses[0]?.id || 'wh_01';
      ERPStorage.recordStockAdjustment(
        whId,
        item.productId,
        acceptedQty,
        `Goods Return Inspection Accepted (${updatedReturn.returnNumber} from ${updatedReturn.partyName})`
      );
    }

    ERPStorage.saveReturn(updatedReturn);
    setReturns(ERPStorage.getReturns());
    setInspectModalOpen(false);
    alert(`Quality Inspection completed! ${acceptedQty} units credited to warehouse inventory.`);
  };

  const handleCreateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const ch = challans.find((c) => c.id === selectedChallanId);
    if (!ch) return;

    const firstItem = ch.items[0];
    const newReturn: GoodsReturn = {
      id: `ret_${Date.now()}`,
      companyId: ERPStorage.getActiveCompanyId(),
      returnNumber: ERPStorage.getNextDocumentNumber('RET'),
      returnDate: new Date().toISOString().split('T')[0],
      returnType,
      originalChallanId: ch.id,
      originalChallanNumber: ch.challanNumber,
      partyName: ch.customerName || ch.supplierName || 'Internal Party',
      partyType: ch.supplierId ? 'SUPPLIER' : 'CUSTOMER',
      partyId: ch.customerId || ch.supplierId || 'party_01',
      items: [
        {
          productId: firstItem?.productId || 'prod_01',
          productName: firstItem?.productName || 'Product',
          uom: firstItem?.uom || 'PCS',
          originalQty: firstItem?.dispatchQty || 1,
          returnedQty: returnItemQty,
          acceptedQty: 0,
          rejectedQty: 0,
          condition: 'REPAIRABLE',
        },
      ],
      reasonForReturn,
      qualityInspectionStatus: 'PENDING_INSPECTION',
      stockUpdated: false, // NOT yet updated until inspection!
      status: 'PENDING_INSPECTION',
      createdAt: new Date().toISOString(),
    };

    ERPStorage.saveReturn(newReturn);
    setReturns(ERPStorage.getReturns());
    setNewReturnModalOpen(false);
    alert(`Goods Return ${newReturn.returnNumber} created and queued for Quality Inspection!`);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-blue-600" /> Return Management & Quality Inspection (QC)
          </h3>
          <p className="text-xs text-slate-500">
            Customer returns, job work returns, and defect quarantines. Inventory is updated only upon QC sign-off.
          </p>
        </div>

        <button
          onClick={() => setNewReturnModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> Log New Return Inward
        </button>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3.5">Return # & Date</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Party & Original DC</th>
              <th className="p-3.5">Returned Material</th>
              <th className="p-3.5 text-center">Quantities (Ret / Acc / Rej)</th>
              <th className="p-3.5 text-center">QC Status</th>
              <th className="p-3.5 text-center">Stock Updated?</th>
              <th className="p-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {returns.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-500">
                  <RotateCcw className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800">No Goods Returns Logged Yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Customer returns, rejected materials, and job work returns with quality inspection status will be listed here.
                  </p>
                </td>
              </tr>
            ) : (
              returns.map((ret) => {
              const item = ret.items[0];
              const isPending = ret.qualityInspectionStatus === 'PENDING_INSPECTION';

              return (
                <tr key={ret.id} className="hover:bg-slate-50">
                  <td className="p-3.5">
                    <div className="font-mono font-bold text-blue-900">{ret.returnNumber}</div>
                    <div className="text-[11px] text-slate-500">{formatDateIN(ret.returnDate)}</div>
                  </td>

                  <td className="p-3.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-700">
                      {ret.returnType.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <div className="font-bold text-slate-800">{ret.partyName}</div>
                    <div className="text-[11px] font-mono text-slate-500">Ref DC: {ret.originalChallanNumber}</div>
                  </td>

                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800">{item?.productName}</div>
                    <div className="text-[11px] text-slate-500 italic max-w-xs line-clamp-1">
                      Reason: {ret.reasonForReturn}
                    </div>
                  </td>

                  <td className="p-3.5 text-center font-mono">
                    <span className="font-bold text-slate-800">{item?.returnedQty}</span> /{' '}
                    <span className="font-bold text-emerald-600">{item?.acceptedQty}</span> /{' '}
                    <span className="font-bold text-rose-600">{item?.rejectedQty}</span>
                  </td>

                  <td className="p-3.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isPending
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {ret.qualityInspectionStatus.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="p-3.5 text-center">
                    {ret.stockUpdated ? (
                      <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Credited
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Pending QC</span>
                    )}
                  </td>

                  <td className="p-3.5 text-center">
                    {isPending ? (
                      <button
                        onClick={() => handleOpenInspection(ret)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 mx-auto"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" /> Inspect (QC)
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs">Inspected by {ret.inspectedBy}</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
          </tbody>
        </table>
      </div>

      {/* QC Inspection Modal */}
      {inspectModalOpen && activeReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-600" /> Quality Assurance Inspection Sign-Off
            </h3>
            <p className="text-xs text-slate-600">
              Return No: <strong className="font-mono">{activeReturn.returnNumber}</strong> | Material:{' '}
              {activeReturn.items[0]?.productName}
            </p>

            <form onSubmit={handleCompleteInspection} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-700 mb-1">Accepted Qty</label>
                  <input
                    type="number"
                    min="0"
                    max={activeReturn.items[0]?.returnedQty}
                    value={acceptedQty}
                    onChange={(e) => setAcceptedQty(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-emerald-300 font-mono font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-rose-700 mb-1">Rejected Qty</label>
                  <input
                    type="number"
                    min="0"
                    max={activeReturn.items[0]?.returnedQty}
                    value={rejectedQty}
                    onChange={(e) => setRejectedQty(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-rose-300 font-mono font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quality Inspection Certificate Remarks
                </label>
                <textarea
                  rows={3}
                  required
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="e.g. Dimensions and crack test verified. Material acceptable for reuse/rework."
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setInspectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                >
                  Approve QC & Credit Warehouse Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Return Modal */}
      {newReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Record Inward Goods Return</h3>
            <form onSubmit={handleCreateReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Original Delivery Challan</label>
                <select
                  value={selectedChallanId}
                  onChange={(e) => setSelectedChallanId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                >
                  {challans.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.challanNumber} - {ch.customerName || ch.supplierName} ({formatDateIN(ch.challanDate)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Return Type</label>
                <select
                  value={returnType}
                  onChange={(e) => setReturnType(e.target.value as GoodsReturn['returnType'])}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                >
                  <option value="CUSTOMER_RETURN">Customer Return</option>
                  <option value="JOB_WORK_RETURN">Job Work Return</option>
                  <option value="SUPPLIER_RETURN">Supplier Return</option>
                  <option value="REJECTED_MATERIAL">Rejected Material Return</option>
                  <option value="DAMAGED_RETURN">Damaged Goods Return</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Returned Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={returnItemQty}
                  onChange={(e) => setReturnItemQty(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono font-bold text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Return</label>
                <textarea
                  rows={2}
                  required
                  value={reasonForReturn}
                  onChange={(e) => setReasonForReturn(e.target.value)}
                  placeholder="e.g. Dimensions out of tolerance / coating blemish"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setNewReturnModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                >
                  Save Inward & Submit for QC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
