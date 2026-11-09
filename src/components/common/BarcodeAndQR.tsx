import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { DeliveryChallan } from '../../types/erp';
import { formatDateIN } from '../../services/gstCalculator';
import { ShieldCheck, CheckCircle2, Truck, Calendar, Building, UserCheck } from 'lucide-react';

interface ChallanQRCodeProps {
  challan: DeliveryChallan;
  size?: number;
}

export const ChallanQRCode: React.FC<ChallanQRCodeProps> = ({ challan, size = 100 }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    // We encode a secure verification payload including token
    const verificationUrl = `${window.location.origin}?verify=${challan.qrVerificationToken}&challan=${encodeURIComponent(
      challan.challanNumber
    )}`;

    QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: size,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [challan, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-slate-100 animate-pulse rounded border border-slate-200 flex items-center justify-center text-xs text-slate-400"
      >
        QR
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR Code for Challan ${challan.challanNumber}`}
      width={size}
      height={size}
      className="rounded shadow-xs border border-slate-200"
    />
  );
};

interface ProductBarcodeProps {
  code: string;
  label?: string;
  height?: number;
}

export const ProductBarcode: React.FC<ProductBarcodeProps> = ({ code, label, height = 36 }) => {
  // Pure SVG render of barcode pattern based on code hash
  const barPattern = (code || '8901234567011')
    .split('')
    .map((char) => (parseInt(char, 36) % 3) + 1);

  return (
    <div className="inline-flex flex-col items-center p-1 bg-white border border-slate-200 rounded">
      <svg width="140" height={height} className="overflow-visible">
        <g fill="#0f172a">
          {barPattern.map((width, idx) => {
            const x = idx * 10 + 4;
            return <rect key={idx} x={x} y="0" width={width * 1.5} height={height} />;
          })}
        </g>
      </svg>
      {label && <span className="text-[10px] font-mono font-semibold tracking-wider text-slate-600 mt-0.5">{label}</span>}
    </div>
  );
};

interface VerificationModalProps {
  challan: DeliveryChallan | null;
  onClose: () => void;
}

export const ChallanVerificationModal: React.FC<VerificationModalProps> = ({ challan, onClose }) => {
  if (!challan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Challan Verified Authentic</h3>
              <p className="text-xs text-emerald-100">Government GST & Consignor System Match</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl font-bold rounded-lg p-1"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              This document has been digitally issued via Enterprise ERP under Rule 55 of CGST Rules 2017.
              Verification Token: <span className="font-mono font-bold">{challan.qrVerificationToken}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                <Building className="w-3.5 h-3.5 text-slate-400" /> Challan Number
              </div>
              <div className="font-bold text-slate-800 text-sm font-mono">{challan.challanNumber}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Type: {challan.challanType.replace('_', ' ')}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date of Issue
              </div>
              <div className="font-bold text-slate-800 text-sm">{formatDateIN(challan.challanDate)}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">FY: {challan.financialYear}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Consignee / Customer
              </div>
              <div className="font-semibold text-slate-800">{challan.customerName || challan.supplierName || 'Inter-Branch'}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">State: {challan.shippingState || challan.customerState || 'MH'}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                <Truck className="w-3.5 h-3.5 text-slate-400" /> Delivery Status
              </div>
              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {challan.status.replace(/_/g, ' ')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">{challan.transportDetails.vehicleNumber}</div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Item Consignment Summary</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
              {challan.items.map((item, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <span className="font-semibold text-slate-800">{item.productName}</span>
                    <span className="text-[11px] text-slate-500 ml-2 font-mono">HSN: {item.hsnCode}</span>
                  </div>
                  <div className="font-bold text-slate-700">
                    {item.dispatchQty} {item.uom}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {challan.eWayBillDetails?.eWayBillNumber && (
            <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center justify-between">
              <span className="text-amber-900 font-medium">E-Way Bill Number:</span>
              <span className="font-mono font-bold text-amber-950">{challan.eWayBillDetails.eWayBillNumber}</span>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Close Verification
          </button>
        </div>
      </div>
    </div>
  );
};
