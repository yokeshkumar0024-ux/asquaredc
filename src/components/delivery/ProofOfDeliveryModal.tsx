import React, { useState, useRef, useEffect } from 'react';
import { DeliveryChallan } from '../../types/erp';
import { ERPStorage } from '../../services/storage';
import { PenTool, CheckCircle, AlertTriangle, Camera, Trash2 } from 'lucide-react';

interface ProofOfDeliveryModalProps {
  challan: DeliveryChallan;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProofOfDeliveryModal: React.FC<ProofOfDeliveryModalProps> = ({ challan, onClose, onSuccess }) => {
  const [receiverName, setReceiverName] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');
  const [receiverDesignation, setReceiverDesignation] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryTime, setDeliveryTime] = useState(
    new Date().toTimeString().split(' ')[0].substring(0, 5)
  );
  const [remarks, setRemarks] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  const [quantities, setQuantities] = useState(
    challan.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      dispatchQty: item.dispatchQty,
      uom: item.uom,
      acceptedQty: item.pendingQty > 0 ? item.pendingQty : item.dispatchQty,
      shortageQty: 0,
      damagedQty: 0,
      rejectedQty: 0,
      notes: '',
    }))
  );

  // Digital Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleQtyChange = (
    index: number,
    field: 'acceptedQty' | 'shortageQty' | 'damagedQty' | 'rejectedQty',
    val: number
  ) => {
    setQuantities((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      item[field] = Math.max(0, val);
      // Auto-balance if accepted adjusted
      if (field === 'acceptedQty') {
        const remaining = item.dispatchQty - item[field];
        if (remaining > 0 && item.shortageQty === 0 && item.damagedQty === 0 && item.rejectedQty === 0) {
          item.shortageQty = remaining;
        }
      }
      next[index] = item;
      return next;
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiverName.trim()) {
      alert('Please enter Receiver Name');
      return;
    }

    let signatureDataUrl = '';
    if (canvasRef.current && hasSignature) {
      signatureDataUrl = canvasRef.current.toDataURL('image/png');
    }

    ERPStorage.recordDeliveryAcknowledgement({
      challanId: challan.id,
      deliveryDate,
      deliveryTime,
      receiverName,
      receiverMobile,
      receiverDesignation,
      digitalSignatureUrl: signatureDataUrl,
      photographUrl: photoUrl,
      receivedQuantities: quantities.map((q) => ({
        productId: q.productId,
        acceptedQty: Number(q.acceptedQty) || 0,
        shortageQty: Number(q.shortageQty) || 0,
        damagedQty: Number(q.damagedQty) || 0,
        rejectedQty: Number(q.rejectedQty) || 0,
        notes: q.notes,
      })),
      remarks,
    });

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 border border-slate-200">
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Proof of Delivery (POD) & Delivery Acknowledgment</h3>
            <p className="text-xs text-slate-300">
              Challan: <span className="font-mono font-semibold text-emerald-400">{challan.challanNumber}</span> |
              Party: {challan.customerName || challan.supplierName}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl font-bold">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Receiver Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receiver Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Receiver Mobile No.</label>
              <input
                type="tel"
                value={receiverMobile}
                onChange={(e) => setReceiverMobile(e.target.value)}
                placeholder="e.g. 98200 12345"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation / Role</label>
              <input
                type="text"
                value={receiverDesignation}
                onChange={(e) => setReceiverDesignation(e.target.value)}
                placeholder="e.g. Stores In-Charge"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Delivery Date</label>
              <input
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Delivery Time</label>
              <input
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Item Quantities Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Delivered vs Accepted Quantities Breakdown
              </label>
              <span className="text-[11px] text-slate-500">Log any shortages, damaged or rejected items</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {quantities.map((q, idx) => (
                <div key={idx} className="p-3 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800">{q.productName}</span>
                    <span className="text-xs bg-slate-200 px-2 py-0.5 rounded font-mono font-medium">
                      Dispatched: {q.dispatchQty} {q.uom}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Accepted Qty
                      </span>
                      <input
                        type="number"
                        min="0"
                        max={q.dispatchQty}
                        value={q.acceptedQty}
                        onChange={(e) => handleQtyChange(idx, 'acceptedQty', Number(e.target.value))}
                        className="w-full mt-1 p-1.5 border border-emerald-300 rounded font-mono text-center font-bold bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Shortage Qty
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={q.shortageQty}
                        onChange={(e) => handleQtyChange(idx, 'shortageQty', Number(e.target.value))}
                        className="w-full mt-1 p-1.5 border border-amber-300 rounded font-mono text-center font-bold bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-red-600">Damaged Qty</span>
                      <input
                        type="number"
                        min="0"
                        value={q.damagedQty}
                        onChange={(e) => handleQtyChange(idx, 'damagedQty', Number(e.target.value))}
                        className="w-full mt-1 p-1.5 border border-red-300 rounded font-mono text-center font-bold bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-rose-700">Rejected Qty</span>
                      <input
                        type="number"
                        min="0"
                        value={q.rejectedQty}
                        onChange={(e) => handleQtyChange(idx, 'rejectedQty', Number(e.target.value))}
                        className="w-full mt-1 p-1.5 border border-rose-300 rounded font-mono text-center font-bold bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signature Canvas Pad */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-blue-600" /> Digital Signature Pad (Sign with Finger / Mouse)
              </label>
              {hasSignature && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear Signature
                </button>
              )}
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden p-1 relative">
              <canvas
                ref={canvasRef}
                width={560}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-28 cursor-crosshair touch-none"
              />
              {!hasSignature && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400">
                  Draw consignee / receiver signature here
                </div>
              )}
            </div>
          </div>

          {/* Photo Upload & Preview */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-slate-500" /> Delivery Photo Proof (Optional)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt="Delivery Proof"
                  className="w-12 h-12 object-cover rounded-lg border border-slate-300"
                />
              )}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Consignee Delivery Remarks & Endorsement
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Material received in intact condition, gate entry stamped and verified."
              className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              Submit Proof of Delivery (POD)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
