import React, { useState } from 'react';
import { DeliveryChallan, Company } from '../../types/erp';
import { formatINR, formatDateIN, formatDateTimeIN, numberToIndianWords, getStateNameByCode } from '../../services/gstCalculator';
import { ChallanQRCode } from '../common/BarcodeAndQR';
import { Printer, X, Download, ShieldCheck } from 'lucide-react';

interface ChallanPrintViewProps {
  challan: DeliveryChallan;
  company: Company;
  onClose: () => void;
}

export const ChallanPrintView: React.FC<ChallanPrintViewProps> = ({ challan, company, onClose }) => {
  const [copyType, setCopyType] = useState<'ORIGINAL' | 'DUPLICATE' | 'TRIPLICATE' | 'ALL'>('ORIGINAL');

  const copyLabels = {
    ORIGINAL: 'ORIGINAL FOR CONSIGNEE',
    DUPLICATE: 'DUPLICATE FOR TRANSPORTER',
    TRIPLICATE: 'TRIPLICATE FOR CONSIGNOR',
  };

  const handlePrint = () => {
    window.print();
  };

  const renderSingleChallanSheet = (type: 'ORIGINAL' | 'DUPLICATE' | 'TRIPLICATE') => {
    const isJobWork = challan.challanType === 'JOB_WORK';
    const isInterBranch = challan.challanType === 'STOCK_TRANSFER';

    return (
      <div
        key={type}
        className="bg-white border-2 border-slate-900 p-8 rounded-none text-slate-900 shadow-xl max-w-4xl mx-auto mb-10 print:mb-0 print:border-none print:shadow-none print:p-4 text-xs font-sans leading-normal page-break-after"
      >
        {/* Top Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
          <div className="flex items-center gap-4">
            {company.logoUrl && (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-16 h-16 object-cover rounded border border-slate-300"
              />
            )}
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">{company.name}</h1>
              <p className="text-[11px] text-slate-600 font-medium">{company.address}, {company.city} - {company.pincode}</p>
              <div className="flex flex-wrap gap-x-4 text-[11px] font-mono mt-0.5 font-semibold text-slate-800">
                <span>GSTIN: {company.gstin}</span>
                <span>PAN: {company.pan}</span>
                <span>State: {company.state} (Code: {company.stateCode})</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block border border-slate-900 px-3 py-1 font-bold text-[10px] tracking-wider uppercase bg-slate-100">
              {copyLabels[type]}
            </span>
            <div className="text-sm font-black mt-2 tracking-wide uppercase text-blue-900">
              DELIVERY CHALLAN
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              (Issued under Rule 55 of CGST Rules, 2017)
            </p>
          </div>
        </div>

        {/* Challan Meta & Transport Grid */}
        <div className="grid grid-cols-2 border-b-2 border-slate-900 text-[11px]">
          {/* Left Column: Document Details */}
          <div className="p-3 border-r-2 border-slate-900 space-y-1">
            <div className="grid grid-cols-3">
              <span className="text-slate-500 font-semibold">Challan No:</span>
              <span className="col-span-2 font-mono font-bold text-sm text-slate-900">{challan.challanNumber}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="text-slate-500 font-semibold">Challan Date:</span>
              <span className="col-span-2 font-bold">{formatDateIN(challan.challanDate)}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="text-slate-500 font-semibold">Challan Type:</span>
              <span className="col-span-2 font-bold uppercase text-blue-900 bg-blue-50 px-1 py-0.5 rounded inline-block">
                {challan.challanType.replace(/_/g, ' ')}
              </span>
            </div>
            {challan.salesOrderNumber && (
              <div className="grid grid-cols-3">
                <span className="text-slate-500 font-semibold">Ref Sales Order:</span>
                <span className="col-span-2 font-mono font-medium">{challan.salesOrderNumber}</span>
              </div>
            )}
            {challan.expectedReturnDate && (
              <div className="grid grid-cols-3">
                <span className="text-slate-500 font-semibold">Expected Return:</span>
                <span className="col-span-2 font-bold text-amber-700">{formatDateIN(challan.expectedReturnDate)}</span>
              </div>
            )}
            {challan.challanPurpose && (
              <div className="grid grid-cols-3">
                <span className="text-slate-500 font-semibold">Purpose:</span>
                <span className="col-span-2 text-slate-700 italic">{challan.challanPurpose}</span>
              </div>
            )}
          </div>

          {/* Right Column: Transport & E-Way Bill */}
          <div className="p-3 space-y-1">
            <div className="grid grid-cols-3">
              <span className="text-slate-500 font-semibold">E-Way Bill No:</span>
              <span className="col-span-2 font-mono font-bold text-slate-900">
                {challan.eWayBillDetails?.eWayBillNumber || 'NOT APPLICABLE (< ₹50K)'}
              </span>
            </div>
            <div className="grid grid-cols-3">
              <span className="text-slate-500 font-semibold">Transporter:</span>
              <span className="col-span-2 font-medium">{challan.transportDetails.transporterName || 'Self Transport'}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="text-slate-500 font-semibold">Vehicle No:</span>
              <span className="col-span-2 font-mono font-bold text-slate-900 uppercase">
                {challan.transportDetails.vehicleNumber || '-'}
              </span>
            </div>
            <div className="grid grid-cols-3">
              <span className="text-slate-500 font-semibold">LR / GR No & Dt:</span>
              <span className="col-span-2 font-mono">
                {challan.transportDetails.lrNumber || '-'} {challan.transportDetails.lrDate ? `(${formatDateIN(challan.transportDetails.lrDate)})` : ''}
              </span>
            </div>
            <div className="grid grid-cols-3">
              <span className="text-slate-500 font-semibold">Mode of Transport:</span>
              <span className="col-span-2 font-medium">{challan.transportDetails.transportMode}</span>
            </div>
          </div>
        </div>

        {/* Consignee Billing & Shipping Address */}
        <div className="grid grid-cols-2 border-b-2 border-slate-900 text-[11px]">
          <div className="p-3 border-r-2 border-slate-900">
            <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-500 mb-1">
              CONSIGNEE (BILLED TO)
            </h4>
            <div className="font-bold text-slate-900 text-sm">
              {challan.customerName || challan.supplierName || 'Branch Consignee'}
            </div>
            <div className="text-slate-700 mt-0.5 whitespace-pre-line">
              {challan.customerAddress || 'Internal Corporate Transfer'}
            </div>
            <div className="mt-1 font-mono font-semibold">
              GSTIN: {challan.customerGstin || 'UNREGISTERED'}
            </div>
            <div>
              State: {challan.customerState || company.state} (Code: {challan.customerStateCode || company.stateCode})
            </div>
          </div>

          <div className="p-3">
            <h4 className="font-bold uppercase text-[10px] tracking-wider text-slate-500 mb-1">
              DISPATCHED / SHIPPED TO
            </h4>
            <div className="font-bold text-slate-900 text-sm">
              {challan.customerName || challan.supplierName || 'Branch Receiving Depot'}
            </div>
            <div className="text-slate-700 mt-0.5 whitespace-pre-line">
              {challan.shippingAddressText || challan.customerAddress || 'Factory Gate'}
            </div>
            <div className="mt-1">
              Destination City: {challan.shippingCity || challan.shippingState || '-'}
            </div>
            <div className="font-mono">
              State: {challan.shippingState || challan.customerState || company.state} (Code: {challan.shippingStateCode || challan.customerStateCode || company.stateCode})
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border-b-2 border-slate-900">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-900 font-bold uppercase text-[10px] text-slate-800">
                <th className="p-2 border-r border-slate-400 text-center w-8">#</th>
                <th className="p-2 border-r border-slate-400">Description of Goods</th>
                <th className="p-2 border-r border-slate-400 text-center w-20">HSN/SAC</th>
                <th className="p-2 border-r border-slate-400 text-right w-16">Qty</th>
                <th className="p-2 border-r border-slate-400 text-center w-12">UOM</th>
                <th className="p-2 border-r border-slate-400 text-right w-20">Rate (₹)</th>
                <th className="p-2 border-r border-slate-400 text-right w-24">Taxable Amt</th>
                <th className="p-2 border-r border-slate-400 text-center w-14">GST %</th>
                <th className="p-2 text-right w-24">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {challan.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                  <td className="p-2 border-r border-slate-300">
                    <div className="font-bold text-slate-900">{item.productName}</div>
                    {item.batchNumber && (
                      <div className="text-[10px] text-slate-500 font-mono">
                        Batch: {item.batchNumber} {item.serialNumbers?.length ? `| Serials: ${item.serialNumbers.join(', ')}` : ''}
                      </div>
                    )}
                    {item.remarks && <div className="text-[10px] text-slate-600 italic">{item.remarks}</div>}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-center font-mono">{item.hsnCode}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono font-bold">{item.dispatchQty}</td>
                  <td className="p-2 border-r border-slate-300 text-center">{item.uom}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono">{item.unitPrice.toFixed(2)}</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono">{item.taxableAmount.toFixed(2)}</td>
                  <td className="p-2 border-r border-slate-300 text-center font-mono">{item.taxRate}%</td>
                  <td className="p-2 text-right font-mono font-bold">{item.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 bg-slate-50 font-bold">
                <td colSpan={3} className="p-2 border-r border-slate-400 text-right uppercase">
                  Sub-Total:
                </td>
                <td className="p-2 border-r border-slate-400 text-right font-mono font-black">
                  {challan.items.reduce((acc, curr) => acc + curr.dispatchQty, 0)}
                </td>
                <td className="p-2 border-r border-slate-400"></td>
                <td className="p-2 border-r border-slate-400"></td>
                <td className="p-2 border-r border-slate-400 text-right font-mono">
                  {challan.totalTaxableAmount.toFixed(2)}
                </td>
                <td className="p-2 border-r border-slate-400"></td>
                <td className="p-2 text-right font-mono font-black">
                  {challan.totalAmount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* GST Breakup & Total in Words */}
        <div className="grid grid-cols-3 border-b-2 border-slate-900 text-[11px]">
          <div className="col-span-2 p-3 border-r-2 border-slate-900 space-y-2">
            <div>
              <span className="font-semibold text-slate-500 uppercase text-[10px]">Total Amount in Words:</span>
              <div className="font-bold text-slate-900 mt-0.5 italic">
                {numberToIndianWords(challan.totalAmount)}
              </div>
            </div>
            {isJobWork && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-900">
                <strong>Statutory Job Work Declaration:</strong> Material dispatched for job work processing under
                Section 143 of CGST Act 2017. Return of finished goods/waste mandatory within 1 year.
              </div>
            )}
            {challan.deliveryInstructions && (
              <div>
                <span className="font-semibold text-slate-500">Delivery Instructions:</span>
                <p className="text-slate-700">{challan.deliveryInstructions}</p>
              </div>
            )}
          </div>

          <div className="p-3 space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-600">Taxable Value:</span>
              <span className="font-semibold">{formatINR(challan.totalTaxableAmount)}</span>
            </div>
            {challan.totalCgstAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">CGST Amount:</span>
                <span className="font-semibold">{formatINR(challan.totalCgstAmount)}</span>
              </div>
            )}
            {challan.totalSgstAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">SGST Amount:</span>
                <span className="font-semibold">{formatINR(challan.totalSgstAmount)}</span>
              </div>
            )}
            {challan.totalIgstAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">IGST Amount:</span>
                <span className="font-semibold">{formatINR(challan.totalIgstAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-900 pt-1 text-sm font-black">
              <span>Grand Total:</span>
              <span className="text-blue-900">{formatINR(challan.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Signatures & QR Code */}
        <div className="grid grid-cols-3 pt-4 text-[11px]">
          {/* QR Verification Box */}
          <div className="flex items-center gap-3 pr-2">
            <ChallanQRCode challan={challan} size={76} />
            <div className="text-[10px] text-slate-600">
              <div className="flex items-center gap-1 font-bold text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" /> Scan to Verify
              </div>
              <p className="mt-0.5">Instant tamper-proof status verification</p>
              <p className="font-mono font-semibold text-[9px] mt-0.5">{challan.qrVerificationToken}</p>
            </div>
          </div>

          {/* Receiver's Signature */}
          <div className="border-l border-r border-slate-300 px-4 flex flex-col justify-between h-28">
            <div className="text-[10px] font-bold uppercase text-slate-500">
              RECEIVER'S ENDORSEMENT & SIGNATURE
            </div>
            {challan.proofOfDelivery?.digitalSignatureUrl ? (
              <div className="my-auto">
                <img
                  src={challan.proofOfDelivery.digitalSignatureUrl}
                  alt="Receiver Signature"
                  className="h-10 max-w-[120px] object-contain"
                />
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                  Signed by: {challan.proofOfDelivery.receiverName} on {formatDateIN(challan.proofOfDelivery.deliveryDate)}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 text-[10px] my-auto">
                (Sign & Stamp on Receipt)
              </div>
            )}
            <div className="text-[10px] text-slate-500 border-t border-slate-300 pt-1">
              Date & Mobile No:
            </div>
          </div>

          {/* Authorized Signatory */}
          <div className="pl-4 flex flex-col justify-between h-28 text-right">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-700">
                For {company.name}
              </div>
              <p className="text-[9px] text-slate-400">Authorized Signatory</p>
            </div>
            <div className="text-center self-end w-36 border-b border-slate-400 pb-1 mb-1">
              <span className="text-[10px] font-serif text-slate-700 italic">Digitally Signed</span>
            </div>
            <div className="text-[10px] font-semibold text-slate-600">
              Store / Dispatch Officer
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 pt-2 border-t border-slate-300 text-[9px] text-slate-500 flex justify-between items-center">
          <span>Software: ChallanPro ERP System | Triplicate GST Compliant Form</span>
          <span>Printed on {formatDateTimeIN(new Date().toISOString())}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs p-4 print:p-0 print:bg-white print:static">
      {/* Control Bar - hidden when printing */}
      <div className="max-w-4xl mx-auto mb-4 bg-slate-800 text-white p-3 rounded-xl flex items-center justify-between shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-300">Copy Selection:</span>
          <div className="flex bg-slate-700 p-0.5 rounded-lg text-xs font-medium">
            {(['ORIGINAL', 'DUPLICATE', 'TRIPLICATE', 'ALL'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setCopyType(type)}
                className={`px-3 py-1 rounded-md transition-all ${
                  copyType === type ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable Sheet(s) */}
      <div className="print:m-0">
        {copyType === 'ALL' ? (
          <>
            {renderSingleChallanSheet('ORIGINAL')}
            {renderSingleChallanSheet('DUPLICATE')}
            {renderSingleChallanSheet('TRIPLICATE')}
          </>
        ) : (
          renderSingleChallanSheet(copyType)
        )}
      </div>
    </div>
  );
};
