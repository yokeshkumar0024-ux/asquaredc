import React, { useState } from 'react';
import { DeliveryChallan, UserRole } from '../../types/erp';
import { ERPStorage } from '../../services/storage';
import { formatINR, formatDateIN, formatDateTimeIN } from '../../services/gstCalculator';
import { ChallanQRCode } from '../common/BarcodeAndQR';
import {
  X,
  Printer,
  Copy,
  FileCheck,
  Ban,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  History,
  Paperclip,
  Share2,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface ChallanDetailModalProps {
  challan: DeliveryChallan;
  onClose: () => void;
  onEdit: (challan: DeliveryChallan) => void;
  onPrint: (challan: DeliveryChallan) => void;
  onOpenPOD: (challan: DeliveryChallan) => void;
  onVerifyQR: (challan: DeliveryChallan) => void;
  onRefresh: () => void;
}

export const ChallanDetailModal: React.FC<ChallanDetailModalProps> = ({
  challan,
  onClose,
  onEdit,
  onPrint,
  onOpenPOD,
  onVerifyQR,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'DELIVERY' | 'HISTORY' | 'ATTACHMENTS' | 'COMMUNICATION'>('DETAILS');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const currentUser = ERPStorage.getCurrentUser();

  const handleCancelChallan = () => {
    if (!cancelReason.trim()) {
      alert('Please enter a cancellation reason');
      return;
    }
    ERPStorage.cancelChallan(challan.id, cancelReason);
    setCancelModalOpen(false);
    onRefresh();
  };

  const handleDuplicate = () => {
    const duplicated: DeliveryChallan = {
      ...challan,
      id: `dc_${Date.now()}`,
      challanNumber: ERPStorage.getNextDocumentNumber(challan.challanType),
      status: 'READY_FOR_DISPATCH',
      challanDate: new Date().toISOString(),
      proofOfDelivery: undefined,
      version: 1,
      revisionHistory: [],
      items: challan.items.map((i) => ({
        ...i,
        deliveredQty: 0,
        pendingQty: i.dispatchQty,
        returnedQty: 0,
        damagedQty: 0,
        rejectedQty: 0,
      })),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
    };
    ERPStorage.saveChallan(duplicated, `Duplicated from ${challan.challanNumber}`);
    alert(`Challan duplicated successfully as ${duplicated.challanNumber}!`);
    onRefresh();
    onClose();
  };

  const handleApprovalAction = (action: 'APPROVE' | 'REJECT' | 'SENT_BACK') => {
    const nextSteps = [...challan.approvalSteps];
    const currentStep = nextSteps[nextSteps.length - 1];

    if (currentStep) {
      currentStep.status = action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'SENT_BACK';
      currentStep.actionDate = new Date().toISOString();
      currentStep.actionByUserId = currentUser.id;
      currentStep.actionByUserName = currentUser.name;
      currentStep.comments = approvalComment || `Action ${action} by ${currentUser.name}`;
    }

    if (action === 'APPROVE') {
      challan.status = 'READY_FOR_DISPATCH';
    } else if (action === 'REJECT') {
      challan.status = 'REJECTED';
    } else {
      challan.status = 'CORRECTION_REQUIRED';
    }

    ERPStorage.saveChallan(challan, `Approval workflow ${action}: ${approvalComment}`);
    ERPStorage.addNotification({
      title: `Challan ${action === 'APPROVE' ? 'Approved' : 'Actioned'}`,
      message: `Challan ${challan.challanNumber} was marked as ${action} by ${currentUser.name}`,
      type: action === 'APPROVE' ? 'SUCCESS' : 'WARNING',
      entityType: 'CHALLAN',
      entityId: challan.id,
    });

    setApprovalComment('');
    onRefresh();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">Delivered</span>;
      case 'PARTIALLY_DELIVERED':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">Partially Delivered</span>;
      case 'IN_TRANSIT':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">In Transit</span>;
      case 'READY_FOR_DISPATCH':
        return <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold">Ready for Dispatch</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">Cancelled</span>;
      case 'PENDING_APPROVAL':
        return <span className="px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">Pending Approval</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-6 border border-slate-200">
        {/* Header Bar */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-bold text-lg text-emerald-400">{challan.challanNumber}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold uppercase">
                  {challan.challanType.replace(/_/g, ' ')}
                </span>
                {getStatusBadge(challan.status)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Issued on {formatDateIN(challan.challanDate)} | Version v{challan.version}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrint(challan)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>
            <button
              onClick={handleDuplicate}
              title="Duplicate Challan"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition-all"
            >
              <Copy className="w-3.5 h-3.5" /> Duplicate
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('DETAILS')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'DETAILS'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Challan Details
          </button>
          <button
            onClick={() => setActiveTab('DELIVERY')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'DELIVERY'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Partial Delivery & POD ({challan.items.reduce((s, i) => s + i.deliveredQty, 0)}/
            {challan.items.reduce((s, i) => s + i.dispatchQty, 0)})
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'HISTORY'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Revision Changelog ({challan.revisionHistory?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('ATTACHMENTS')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'ATTACHMENTS'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Attachments ({challan.attachments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('COMMUNICATION')}
            className={`py-3 px-4 border-b-2 transition-all ${
              activeTab === 'COMMUNICATION'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Dispatch Alerts
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {activeTab === 'DETAILS' && (
            <>
              {/* Party & Transport Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Consignee / Party</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {challan.customerName || challan.supplierName || 'Internal Warehouse Transfer'}
                  </div>
                  {challan.customerGstin && (
                    <div className="font-mono text-slate-600">GSTIN: {challan.customerGstin}</div>
                  )}
                  <div className="text-slate-600">{challan.shippingAddressText || challan.customerAddress}</div>
                  <div className="text-slate-500 font-medium">State: {challan.shippingState} (Code: {challan.shippingStateCode})</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Logistics & Transporter</span>
                  <div className="font-bold text-slate-900">{challan.transportDetails.transporterName || 'Self Transport'}</div>
                  <div className="font-mono font-semibold text-slate-800">
                    Vehicle: {challan.transportDetails.vehicleNumber || 'Unassigned'}
                  </div>
                  <div className="text-slate-600">LR / GR No: {challan.transportDetails.lrNumber || '-'}</div>
                  <div className="text-slate-600">Mode: {challan.transportDetails.transportMode}</div>
                  {challan.transportDetails.driverName && (
                    <div className="text-slate-500">Driver: {challan.transportDetails.driverName} ({challan.transportDetails.driverMobile})</div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">E-Way Bill & Verification</span>
                  <div className="font-mono font-bold text-slate-900">
                    {challan.eWayBillDetails?.eWayBillNumber ? `EWB: ${challan.eWayBillDetails.eWayBillNumber}` : 'No EWB Required'}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <ChallanQRCode challan={challan} size={50} />
                    <div>
                      <button
                        onClick={() => onVerifyQR(challan)}
                        className="text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Verify Authenticity
                      </button>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{challan.qrVerificationToken}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Consignment Line Items
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Product</th>
                        <th className="p-2.5 text-center">HSN</th>
                        <th className="p-2.5 text-center">Dispatched</th>
                        <th className="p-2.5 text-center">Delivered</th>
                        <th className="p-2.5 text-center">Pending</th>
                        <th className="p-2.5 text-right">Taxable</th>
                        <th className="p-2.5 text-right">GST</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {challan.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium">
                            {item.productName}
                            {item.batchNumber && (
                              <div className="text-[10px] text-slate-400 font-mono">Batch: {item.batchNumber}</div>
                            )}
                          </td>
                          <td className="p-2.5 text-center font-mono">{item.hsnCode}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                            {item.dispatchQty} {item.uom}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-emerald-700">
                            {item.deliveredQty} {item.uom}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-amber-700">
                            {item.pendingQty} {item.uom}
                          </td>
                          <td className="p-2.5 text-right font-mono">{formatINR(item.taxableAmount)}</td>
                          <td className="p-2.5 text-right font-mono text-slate-500">
                            {formatINR(item.cgstAmount + item.sgstAmount + item.igstAmount)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold">{formatINR(item.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={2} className="p-2.5 uppercase text-slate-600">Grand Total</td>
                        <td className="p-2.5 text-center font-mono">
                          {challan.items.reduce((s, i) => s + i.dispatchQty, 0)}
                        </td>
                        <td className="p-2.5 text-center font-mono text-emerald-700">
                          {challan.items.reduce((s, i) => s + i.deliveredQty, 0)}
                        </td>
                        <td className="p-2.5 text-center font-mono text-amber-700">
                          {challan.items.reduce((s, i) => s + i.pendingQty, 0)}
                        </td>
                        <td className="p-2.5 text-right font-mono">{formatINR(challan.totalTaxableAmount)}</td>
                        <td className="p-2.5 text-right font-mono">
                          {formatINR(challan.totalCgstAmount + challan.totalSgstAmount + challan.totalIgstAmount)}
                        </td>
                        <td className="p-2.5 text-right font-mono text-blue-900">{formatINR(challan.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Approval Workflow Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-blue-600" /> Multi-Tier Approval Workflow
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">Role: {currentUser.role}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {challan.approvalSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex-1 min-w-[200px] p-2.5 bg-white rounded-lg border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Tier {step.level}: {step.role}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            step.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : step.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>
                      {step.actionByUserName && (
                        <div className="text-[11px] text-slate-600">By: {step.actionByUserName}</div>
                      )}
                      {step.actionDate && (
                        <div className="text-[10px] text-slate-400">{formatDateTimeIN(step.actionDate)}</div>
                      )}
                      {step.comments && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-1 rounded border border-slate-100">
                          "{step.comments}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {challan.status === 'PENDING_APPROVAL' && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <input
                      type="text"
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      placeholder="Add approval comment or correction notes..."
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleApprovalAction('SENT_BACK')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold"
                      >
                        Send Back for Correction
                      </button>
                      <button
                        onClick={() => handleApprovalAction('REJECT')}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprovalAction('APPROVE')}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                      >
                        Approve Challan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'DELIVERY' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div>
                  <h4 className="text-xs font-bold text-blue-950">Partial Delivery & Proof of Delivery (POD)</h4>
                  <p className="text-xs text-blue-700">
                    Track partial shipments, received quantities, shortages, and digital consignee signatures.
                  </p>
                </div>
                {challan.status !== 'CANCELLED' && challan.status !== 'DELIVERED' && (
                  <button
                    onClick={() => onOpenPOD(challan)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <FileCheck className="w-4 h-4" /> Record Delivery / Consignee POD
                  </button>
                )}
              </div>

              {challan.proofOfDelivery ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Acknowledged Proof of Delivery
                    </span>
                    <span className="font-mono text-slate-500">
                      Delivered: {formatDateIN(challan.proofOfDelivery.deliveryDate)} at {challan.proofOfDelivery.deliveryTime}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <span className="text-slate-500 font-semibold">Receiver Name:</span>
                      <div className="font-bold text-slate-800">{challan.proofOfDelivery.receiverName}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold">Mobile:</span>
                      <div className="font-mono">{challan.proofOfDelivery.receiverMobile || '-'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold">Designation:</span>
                      <div>{challan.proofOfDelivery.receiverDesignation || '-'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold">Completion Status:</span>
                      <div className="font-bold text-emerald-700">
                        {challan.proofOfDelivery.isCompleteDelivery ? '100% Fully Delivered' : 'Partially Delivered'}
                      </div>
                    </div>
                  </div>

                  {challan.proofOfDelivery.remarks && (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                      <strong>Remarks:</strong> {challan.proofOfDelivery.remarks}
                    </div>
                  )}

                  {challan.proofOfDelivery.digitalSignatureUrl && (
                    <div>
                      <span className="text-slate-500 font-semibold block mb-1">Consignee Digital Signature:</span>
                      <img
                        src={challan.proofOfDelivery.digitalSignatureUrl}
                        alt="Digital Signature"
                        className="h-14 bg-white p-2 border border-slate-300 rounded-lg shadow-2xs"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                  No Proof of Delivery (POD) recorded yet for this challan. Click above to record receipt.
                </div>
              )}
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Revision & Amendment Changelog
              </h4>
              {challan.revisionHistory && challan.revisionHistory.length > 0 ? (
                <div className="space-y-3">
                  {challan.revisionHistory.map((rev, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900">Revision Version v{rev.version}</span>
                        <span className="text-slate-400 font-mono">{formatDateTimeIN(rev.amendedAt)}</span>
                      </div>
                      <div className="text-slate-700">Amended by: <strong>{rev.amendedBy}</strong></div>
                      <div className="text-slate-600 italic">Reason: {rev.reason}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-lg border">
                  Original release version v1. No revisions amended yet.
                </p>
              )}
            </div>
          )}

          {activeTab === 'ATTACHMENTS' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Associated Digital Documents
              </h4>
              {challan.attachments && challan.attachments.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {challan.attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-bold text-slate-800">{att.fileName}</div>
                          <div className="text-[10px] text-slate-400">
                            {(att.fileSize / 1024).toFixed(0)} KB | {att.category}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                        View
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-lg border">
                  No scanned document attachments uploaded yet.
                </p>
              )}
            </div>
          )}

          {activeTab === 'COMMUNICATION' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-emerald-700" /> WhatsApp & Email Dispatch Alert Generator
                </h4>
                <p className="text-emerald-800">
                  Ready-to-send template with tracking link, transporter name, and vehicle details:
                </p>
                <div className="bg-white p-3 rounded-lg border border-emerald-300 font-mono text-[11px] text-slate-800 whitespace-pre-line select-all">
                  {`Dear ${challan.customerName || 'Customer'},\nYour consignment under Delivery Challan ${challan.challanNumber} has been dispatched via ${challan.transportDetails.transporterName || 'Fleet'} (Vehicle: ${challan.transportDetails.vehicleNumber || 'Pending'}).\nLR Number: ${challan.transportDetails.lrNumber || 'N/A'}.\nTrack status & verify authentic challan here: ${window.location.origin}?verify=${challan.qrVerificationToken}\nRegards, Operations Team`}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Dear ${challan.customerName || 'Customer'},\nYour consignment under Delivery Challan ${challan.challanNumber} has been dispatched via ${challan.transportDetails.transporterName || 'Fleet'} (Vehicle: ${challan.transportDetails.vehicleNumber || 'Pending'}). LR: ${challan.transportDetails.lrNumber || 'N/A'}. Track: ${window.location.origin}?verify=${challan.qrVerificationToken}`
                      );
                      alert('Message copied to clipboard!');
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold"
                  >
                    Copy Message Text
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {challan.status !== 'CANCELLED' && (
              <button
                onClick={() => setCancelModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <Ban className="w-3.5 h-3.5" /> Cancel Challan
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(challan)}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all"
            >
              Edit / Amend
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Cancellation Prompt Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h4 className="font-bold text-base text-red-600 flex items-center gap-1.5">
              <Ban className="w-5 h-5" /> Cancel Delivery Challan
            </h4>
            <p className="text-xs text-slate-600">
              Please enter the official reason for cancelling {challan.challanNumber}. This action is logged permanently in the audit trail.
            </p>
            <textarea
              rows={3}
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Order cancelled by client / incorrect product specified / vehicle breakdown..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Never mind
              </button>
              <button
                onClick={handleCancelChallan}
                className="px-4 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-xs"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
