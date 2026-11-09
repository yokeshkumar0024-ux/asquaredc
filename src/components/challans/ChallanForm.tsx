import React, { useState, useEffect } from 'react';
import {
  ChallanType,
  DeliveryChallan,
  ChallanItem,
  TransportMode,
  Product,
  Warehouse,
} from '../../types/erp';
import { ERPStorage } from '../../services/storage';
import { calculateItemTaxes, formatINR, INDIAN_STATES, getStateNameByCode } from '../../services/gstCalculator';
import {
  Building2,
  Calendar,
  Truck,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';

interface ChallanFormProps {
  initialChallan?: DeliveryChallan | null;
  onSave: (savedChallan: DeliveryChallan) => void;
  onCancel: () => void;
}

export const CHALLAN_TYPE_INFO: Record<
  ChallanType,
  { label: string; description: string; requiresReturnDate: boolean; isStockTransfer: boolean; badgeColor: string }
> = {
  STANDARD_DELIVERY: {
    label: 'Standard Delivery Challan',
    description: 'Outward goods delivery against customer sales or commercial supply contract.',
    requiresReturnDate: false,
    isStockTransfer: false,
    badgeColor: 'bg-blue-100 text-blue-800',
  },
  JOB_WORK: {
    label: 'Job Work Challan',
    description: 'Material sent to job worker for machining, coating, assembly or processing (Section 143).',
    requiresReturnDate: true,
    isStockTransfer: false,
    badgeColor: 'bg-amber-100 text-amber-800',
  },
  STOCK_TRANSFER: {
    label: 'Stock Transfer Challan',
    description: 'Internal inter-branch or inter-warehouse stock movement between company locations.',
    requiresReturnDate: false,
    isStockTransfer: true,
    badgeColor: 'bg-purple-100 text-purple-800',
  },
  SALES_RETURN: {
    label: 'Sales Return Challan',
    description: 'Customer returning rejected, surplus or defective goods with reference to original supply.',
    requiresReturnDate: false,
    isStockTransfer: false,
    badgeColor: 'bg-rose-100 text-rose-800',
  },
  PURCHASE_RETURN: {
    label: 'Purchase Return Challan',
    description: 'Returning defective raw materials or components back to vendor/supplier.',
    requiresReturnDate: false,
    isStockTransfer: false,
    badgeColor: 'bg-orange-100 text-orange-800',
  },
  GOODS_RETURN: {
    label: 'Goods Return Challan',
    description: 'General material return movement across parties or project sites.',
    requiresReturnDate: false,
    isStockTransfer: false,
    badgeColor: 'bg-red-100 text-red-800',
  },
  REPAIR_MAINTENANCE: {
    label: 'Repair & Maintenance Challan',
    description: 'Equipment, motors or tools sent for servicing, calibration or overhaul.',
    requiresReturnDate: true,
    isStockTransfer: false,
    badgeColor: 'bg-teal-100 text-teal-800',
  },
  APPROVAL_BASIS: {
    label: 'Approval Basis Challan',
    description: 'Goods sent on sale-or-return approval basis (must return or invoice within 6 months).',
    requiresReturnDate: true,
    isStockTransfer: false,
    badgeColor: 'bg-indigo-100 text-indigo-800',
  },
  SAMPLE_DELIVERY: {
    label: 'Sample Delivery Challan',
    description: 'Free trade samples sent for testing, quality evaluation, or customer demonstration.',
    requiresReturnDate: false,
    isStockTransfer: false,
    badgeColor: 'bg-cyan-100 text-cyan-800',
  },
  SCRAP_MOVEMENT: {
    label: 'Scrap Movement Challan',
    description: 'Movement of metal turnings, rejected castings or scrap to recycler/yard with weighbridge slip.',
    requiresReturnDate: false,
    isStockTransfer: false,
    badgeColor: 'bg-slate-200 text-slate-800',
  },
  NON_SALE_DELIVERY: {
    label: 'Non-Sale Delivery Challan',
    description: 'Goods transported for exhibitions, trade fairs, demonstrations or warranty replacement.',
    requiresReturnDate: false,
    isStockTransfer: false,
    badgeColor: 'bg-emerald-100 text-emerald-800',
  },
  SUBCONTRACTING: {
    label: 'Subcontracting Challan',
    description: 'Materials & sub-assemblies dispatched to certified subcontractor under manufacturing agreement.',
    requiresReturnDate: true,
    isStockTransfer: false,
    badgeColor: 'bg-violet-100 text-violet-800',
  },
};

export const ChallanForm: React.FC<ChallanFormProps> = ({
  initialChallan,
  onSave,
  onCancel,
}) => {
  const company = ERPStorage.getCompany();
  const warehouses = ERPStorage.getWarehouses();
  const branches = ERPStorage.getBranches();
  const products = ERPStorage.getProducts();

  // Basic Details
  const [challanType, setChallanType] = useState<ChallanType>(
    initialChallan?.challanType || 'STANDARD_DELIVERY'
  );
  const [challanNumber, setChallanNumber] = useState<string>(
    initialChallan?.challanNumber || ERPStorage.getNextDocumentNumber('STANDARD_DELIVERY')
  );
  const [financialYear, setFinancialYear] = useState<string>(
    initialChallan?.financialYear || ERPStorage.getFinancialYear()
  );
  const [challanDate, setChallanDate] = useState<string>(
    initialChallan?.challanDate ? initialChallan.challanDate.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [challanPurpose, setChallanPurpose] = useState<string>(
    initialChallan?.challanPurpose || ''
  );
  const [sourceWarehouseId, setSourceWarehouseId] = useState<string>(
    initialChallan?.sourceWarehouseId || warehouses[0]?.id || 'wh_01'
  );
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<string>(
    initialChallan?.destinationWarehouseId || (warehouses[1]?.id || '')
  );

  // References
  const [referenceChallanNumber, setReferenceChallanNumber] = useState<string>(
    initialChallan?.referenceChallanNumber || ''
  );
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>(
    initialChallan?.expectedReturnDate || ''
  );

  // Direct Consignee / Party Details (No Party Masters needed)
  const [customerName, setCustomerName] = useState<string>(
    initialChallan?.customerName || initialChallan?.supplierName || ''
  );
  const [customerGstin, setCustomerGstin] = useState<string>(
    initialChallan?.customerGstin || initialChallan?.supplierGstin || ''
  );
  const [customerAddress, setCustomerAddress] = useState<string>(
    initialChallan?.customerAddress || ''
  );
  const [shippingAddressText, setShippingAddressText] = useState<string>(
    initialChallan?.shippingAddressText || ''
  );
  const [shippingCity, setShippingCity] = useState<string>(
    initialChallan?.shippingCity || ''
  );
  const [shippingState, setShippingState] = useState<string>(
    initialChallan?.shippingState || company.state
  );
  const [shippingStateCode, setShippingStateCode] = useState<string>(
    initialChallan?.shippingStateCode || company.stateCode
  );

  // Items
  const [items, setItems] = useState<ChallanItem[]>(() => {
    if (initialChallan?.items && initialChallan.items.length > 0) {
      return initialChallan.items;
    }
    // Default first item line
    const p1 = products[0];
    const taxable = (p1?.unitPrice || 1000) * 1;
    const taxes = calculateItemTaxes(taxable, p1?.taxRate || 18, company.stateCode, company.stateCode);
    return [
      {
        id: 'item_1',
        productId: p1?.id || 'prod_01',
        productCode: p1?.itemCode || 'ITM-01',
        productName: p1?.name || '',
        hsnCode: p1?.hsnCode || '84818030',
        uom: p1?.uom || 'PCS',
        orderedQty: 1,
        dispatchQty: 1,
        deliveredQty: 0,
        pendingQty: 1,
        returnedQty: 0,
        damagedQty: 0,
        rejectedQty: 0,
        unitPrice: p1?.unitPrice || 1000,
        taxRate: p1?.taxRate || 18,
        taxableAmount: taxable,
        ...taxes,
        batchNumber: '',
      },
    ];
  });

  // Transport Details
  const [transporterName, setTransporterName] = useState<string>(
    initialChallan?.transportDetails?.transporterName || ''
  );
  const [transporterGstin, setTransporterGstin] = useState<string>(
    initialChallan?.transportDetails?.transporterGstin || ''
  );
  const [transportMode, setTransportMode] = useState<TransportMode>(
    initialChallan?.transportDetails?.transportMode || 'ROAD'
  );
  const [vehicleNumber, setVehicleNumber] = useState<string>(
    initialChallan?.transportDetails?.vehicleNumber || ''
  );
  const [vehicleType, setVehicleType] = useState<string>(
    initialChallan?.transportDetails?.vehicleType || ''
  );
  const [driverName, setDriverName] = useState<string>(
    initialChallan?.transportDetails?.driverName || ''
  );
  const [driverMobile, setDriverMobile] = useState<string>(
    initialChallan?.transportDetails?.driverMobile || ''
  );
  const [lrNumber, setLrNumber] = useState<string>(
    initialChallan?.transportDetails?.lrNumber || ''
  );
  const [distanceKm, setDistanceKm] = useState<number>(
    initialChallan?.transportDetails?.distanceKm || 0
  );
  const [freightCharges, setFreightCharges] = useState<number>(
    initialChallan?.transportDetails?.freightCharges || 0
  );

  // E-Way Bill
  const [eWayBillNumber, setEWayBillNumber] = useState<string>(
    initialChallan?.eWayBillDetails?.eWayBillNumber || ''
  );

  // Instructions & Remarks
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>(
    initialChallan?.deliveryInstructions || ''
  );
  const [specialRemarks, setSpecialRemarks] = useState<string>(
    initialChallan?.specialRemarks || ''
  );

  // Auto regenerate document number if type changes on new challan
  const handleTypeChange = (newType: ChallanType) => {
    setChallanType(newType);
    if (!initialChallan) {
      setChallanNumber(ERPStorage.getNextDocumentNumber(newType));
    }
  };

  // Recalculate taxes for all items whenever shipping state code changes
  useEffect(() => {
    setItems((prev) =>
      prev.map((item) => {
        const taxable = item.dispatchQty * item.unitPrice;
        const taxes = calculateItemTaxes(taxable, item.taxRate, company.stateCode, shippingStateCode || company.stateCode);
        return {
          ...item,
          taxableAmount: taxable,
          ...taxes,
        };
      })
    );
  }, [shippingStateCode, company.stateCode]);

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) => {
      const next = [...prev];
      const taxable = next[index].dispatchQty * prod.unitPrice;
      const taxes = calculateItemTaxes(taxable, prod.taxRate, company.stateCode, shippingStateCode || company.stateCode);

      next[index] = {
        ...next[index],
        productId: prod.id,
        productCode: prod.itemCode,
        productName: prod.name,
        hsnCode: prod.hsnCode,
        uom: prod.uom,
        unitPrice: prod.unitPrice,
        taxRate: prod.taxRate,
        taxableAmount: taxable,
        ...taxes,
      };
      return next;
    });
  };

  const handleQtyPriceChange = (index: number, field: 'dispatchQty' | 'unitPrice', val: number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      item[field] = Math.max(0, val);
      if (field === 'dispatchQty') {
        item.orderedQty = item.dispatchQty;
        item.pendingQty = item.dispatchQty;
      }
      const taxable = item.dispatchQty * item.unitPrice;
      const taxes = calculateItemTaxes(taxable, item.taxRate, company.stateCode, shippingStateCode || company.stateCode);
      next[index] = {
        ...item,
        taxableAmount: taxable,
        ...taxes,
      };
      return next;
    });
  };

  const handleItemFieldChange = (index: number, field: string, val: any) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: val };
      if (field === 'taxRate') {
        const taxable = item.dispatchQty * item.unitPrice;
        const taxes = calculateItemTaxes(taxable, Number(val), company.stateCode, shippingStateCode || company.stateCode);
        item.taxRate = Number(val);
        item.taxableAmount = taxable;
        item.cgstRate = taxes.cgstRate;
        item.cgstAmount = taxes.cgstAmount;
        item.sgstRate = taxes.sgstRate;
        item.sgstAmount = taxes.sgstAmount;
        item.igstRate = taxes.igstRate;
        item.igstAmount = taxes.igstAmount;
        item.totalAmount = taxable + taxes.cgstAmount + taxes.sgstAmount + taxes.igstAmount;
      }
      next[index] = item;
      return next;
    });
  };

  const addItemRow = () => {
    const p1 = products[0];
    const taxable = 1000;
    const taxes = calculateItemTaxes(taxable, 18, company.stateCode, shippingStateCode || company.stateCode);

    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}`,
        productId: p1?.id || `prod_${Date.now()}`,
        productCode: p1?.itemCode || `ITM-${prev.length + 1}`,
        productName: p1?.name || '',
        hsnCode: p1?.hsnCode || '84818030',
        uom: p1?.uom || 'PCS',
        orderedQty: 1,
        dispatchQty: 1,
        deliveredQty: 0,
        pendingQty: 1,
        returnedQty: 0,
        damagedQty: 0,
        rejectedQty: 0,
        unitPrice: p1?.unitPrice || 1000,
        taxRate: p1?.taxRate || 18,
        taxableAmount: taxable,
        ...taxes,
        totalAmount: taxable + taxes.cgstAmount + taxes.sgstAmount + taxes.igstAmount,
        batchNumber: '',
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Grand Totals
  const totalTaxable = items.reduce((sum, item) => sum + item.taxableAmount, 0);
  const totalCgst = items.reduce((sum, item) => sum + item.cgstAmount, 0);
  const totalSgst = items.reduce((sum, item) => sum + item.sgstAmount, 0);
  const totalIgst = items.reduce((sum, item) => sum + item.igstAmount, 0);
  const grandTotal = items.reduce((sum, item) => sum + item.totalAmount, 0);

  // E-Way Bill Requirement Check (> ₹50,000 threshold)
  const isEWayBillRequired = grandTotal >= 50000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert('Please add at least one item line to the challan.');
      return;
    }

    if (CHALLAN_TYPE_INFO[challanType].isStockTransfer && sourceWarehouseId === destinationWarehouseId) {
      alert('For Stock Transfer, Destination Warehouse must be different from Source Warehouse.');
      return;
    }

    const newChallan: DeliveryChallan = {
      id: initialChallan?.id || `dc_${Date.now()}`,
      companyId: company.id,
      branchId: branches[0]?.id || 'br_01',
      sourceWarehouseId,
      destinationWarehouseId: CHALLAN_TYPE_INFO[challanType].isStockTransfer ? destinationWarehouseId : undefined,
      challanNumber,
      financialYear,
      challanType,
      challanPurpose: challanPurpose || CHALLAN_TYPE_INFO[challanType].description,
      challanDate: new Date(challanDate).toISOString(),
      status: initialChallan?.status || 'READY_FOR_DISPATCH',

      referenceChallanNumber,
      expectedReturnDate: CHALLAN_TYPE_INFO[challanType].requiresReturnDate ? expectedReturnDate : undefined,

      customerName: customerName.trim() || 'Direct Consignee',
      customerGstin: customerGstin.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      customerState: shippingState,
      customerStateCode: shippingStateCode,

      shippingAddressText: shippingAddressText.trim() || customerAddress.trim() || 'Site Address',
      shippingCity: shippingCity.trim() || shippingState,
      shippingState,
      shippingStateCode,

      items,
      totalTaxableAmount: totalTaxable,
      totalCgstAmount: totalCgst,
      totalSgstAmount: totalSgst,
      totalIgstAmount: totalIgst,
      totalAmount: grandTotal,

      transportDetails: {
        transporterName,
        transporterGstin,
        transportMode,
        vehicleNumber,
        vehicleType,
        driverName,
        driverMobile,
        lrNumber,
        dispatchDate: new Date().toISOString(),
        expectedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        freightCharges,
        freightPayableBy: 'CONSIGNOR',
        distanceKm,
      },

      eWayBillDetails: {
        eWayBillNumber: eWayBillNumber || undefined,
        eWayBillDate: eWayBillNumber ? new Date().toISOString() : undefined,
        validUntil: eWayBillNumber ? new Date(Date.now() + 86400000 * 3).toISOString() : undefined,
        approxDistanceKm: distanceKm,
        status: eWayBillNumber ? 'ACTIVE' : 'NOT_GENERATED',
        isApplicable: isEWayBillRequired,
        supplyType: 'OUTWARD_SUPPLY',
        subType: challanType.replace(/_/g, ' '),
        docType: 'CHALLAN',
      },

      deliveryInstructions,
      specialRemarks,

      approvalSteps: initialChallan?.approvalSteps || [
        {
          level: 1,
          role: 'DATA_ENTRY_OPERATOR',
          status: 'APPROVED',
          actionDate: new Date().toISOString(),
          actionByUserName: ERPStorage.getCurrentUser().name,
          comments: 'Initial document entered and verified',
        },
      ],
      currentApprovalLevel: initialChallan?.currentApprovalLevel || 1,
      version: initialChallan?.version || 1,
      revisionHistory: initialChallan?.revisionHistory || [],
      attachments: initialChallan?.attachments || [],
      qrVerificationToken: initialChallan?.qrVerificationToken || `VFY-${challanNumber.replace(/\//g, '-')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      isDeleted: false,
      createdAt: initialChallan?.createdAt || new Date().toISOString(),
      createdBy: initialChallan?.createdBy || ERPStorage.getCurrentUser().name,
      updatedAt: new Date().toISOString(),
      updatedBy: ERPStorage.getCurrentUser().name,
    };

    // Auto-register typed products in catalog if not already existing
    items.forEach((item) => {
      const existing = products.find((p) => p.id === item.productId || (p.name && item.productName && p.name.toLowerCase() === item.productName.toLowerCase()));
      if (!existing && item.productName && item.productName.trim()) {
        const prodId = item.productId || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
        item.productId = prodId;
        ERPStorage.saveProduct({
          id: prodId,
          companyId: company.id,
          itemCode: item.productCode || `ITM-${Date.now().toString().slice(-4)}`,
          name: item.productName.trim(),
          description: `${item.productName.trim()} - HSN ${item.hsnCode}`,
          hsnCode: item.hsnCode || '84818030',
          uom: item.uom || 'PCS',
          unitPrice: item.unitPrice || 0,
          taxRate: item.taxRate || 18,
          hasBatchTracking: true,
          hasSerialTracking: false,
          hasExpiryTracking: false,
          minStockAlert: 5,
          barcode: `890${Date.now().toString().slice(-10)}`,
          category: 'General Goods',
        });
      }
    });

    // Save and adjust stock
    ERPStorage.saveChallan(newChallan, initialChallan ? 'Edited challan parameters' : 'Created new Delivery Challan');

    // Deduct stock for outbound challan
    items.forEach((item) => {
      ERPStorage.recordStockAdjustment(
        sourceWarehouseId,
        item.productId,
        -item.dispatchQty,
        `Outward dispatch against Challan ${newChallan.challanNumber}`
      );
    });

    onSave(newChallan);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Top Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold">
              {initialChallan ? `Edit Challan ${initialChallan.challanNumber}` : 'Create New Delivery Challan'}
            </h2>
            <p className="text-xs text-slate-300">
              Configure stock movement, party details, item lines, transport, and e-way bill compliance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 bg-blue-600/40 text-blue-300 rounded-full border border-blue-400/30">
            FY: {financialYear}
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
          >
            <Save className="w-4 h-4" /> Save & Generate Challan
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Section 1: Challan Type & Category */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            1. Select Challan Type (12 Enterprise Workflows)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {(Object.keys(CHALLAN_TYPE_INFO) as ChallanType[]).map((type) => {
              const info = CHALLAN_TYPE_INFO[type];
              const isSelected = challanType === type;
              return (
                <button
                  type="button"
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase self-start mb-1 ${info.badgeColor}`}
                  >
                    {type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">{info.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
            ℹ️ {CHALLAN_TYPE_INFO[challanType].description}
          </p>
        </div>

        {/* Section 2: Document Identifiers & Warehouses */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Challan Number</label>
            <input
              type="text"
              required
              value={challanNumber}
              onChange={(e) => setChallanNumber(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Challan Date</label>
            <input
              type="date"
              required
              value={challanDate}
              onChange={(e) => setChallanDate(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Source Dispatch Warehouse <span className="text-red-500">*</span>
            </label>
            <select
              value={sourceWarehouseId}
              onChange={(e) => setSourceWarehouseId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>

          {CHALLAN_TYPE_INFO[challanType].isStockTransfer ? (
            <div>
              <label className="block text-xs font-semibold text-purple-800 mb-1">
                Destination Receiving Warehouse <span className="text-red-500">*</span>
              </label>
              <select
                value={destinationWarehouseId}
                onChange={(e) => setDestinationWarehouseId(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-purple-300 bg-purple-50/50 focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold text-purple-900"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Challan Purpose / Remarks
              </label>
              <input
                type="text"
                value={challanPurpose}
                onChange={(e) => setChallanPurpose(e.target.value)}
                placeholder="e.g. Sales supply / Warranty test"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Section 2: Consignee & Party Details (Direct Input) */}
        {!CHALLAN_TYPE_INFO[challanType].isStockTransfer && (
          <div className="border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" /> 2. Consignee / Party & Destination Details
              </label>
              <span className="text-[11px] text-slate-500">Direct Entry (No party master setup needed)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Consignee / Party Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Tata Motors Ltd / Precision Engineering Works"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Party GSTIN (Optional)</label>
                <input
                  type="text"
                  maxLength={15}
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 27AAACT2727Q1ZT"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination State & Code</label>
                <select
                  value={shippingStateCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setShippingStateCode(code);
                    setShippingState(getStateNameByCode(code));
                  }}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {Object.entries(INDIAN_STATES).map(([code, name]) => (
                    <option key={code} value={code}>
                      {code} - {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination City</label>
                <input
                  type="text"
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  placeholder="e.g. Pune / Bengaluru"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Billed-To Office Address</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Corporate / registered billing address"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shipped-To / Site Delivery Address</label>
                <input
                  type="text"
                  value={shippingAddressText}
                  onChange={(e) => setShippingAddressText(e.target.value)}
                  placeholder="Factory gate / site unloading address"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>

            {CHALLAN_TYPE_INFO[challanType].requiresReturnDate && (
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-900">
                    Mandatory Expected Return Date
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Required under GST Section 143 for Job Work / Approval / Tool Maintenance tracking.
                  </p>
                </div>
                <input
                  type="date"
                  required
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="text-xs p-2 rounded-lg border border-amber-300 bg-white font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Section 4: Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> 3. Consignment Items & GST Slabs
            </label>
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold border border-blue-200 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Another Item Line
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3 w-8">#</th>
                  <th className="p-3">Product Name & Description</th>
                  <th className="p-3 text-center w-24">HSN/SAC</th>
                  <th className="p-3 text-center w-28">Dispatch Qty</th>
                  <th className="p-3 text-center w-16">UOM</th>
                  <th className="p-3 text-right w-28">Unit Rate (₹)</th>
                  <th className="p-3 text-right w-28">Taxable (₹)</th>
                  <th className="p-3 text-center w-24">GST %</th>
                  <th className="p-3 text-right w-28">Total (₹)</th>
                  <th className="p-3 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 space-y-1.5 min-w-[220px]">
                      <input
                        type="text"
                        required
                        value={item.productName}
                        onChange={(e) => handleItemFieldChange(idx, 'productName', e.target.value)}
                        placeholder="Type item name / description *"
                        className="w-full text-xs p-1.5 border border-slate-300 rounded-lg font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      {products.length > 0 && (
                        <select
                          value={products.some((p) => p.name === item.productName) ? item.productId : ''}
                          onChange={(e) => {
                            if (e.target.value) handleProductChange(idx, e.target.value);
                          }}
                          className="w-full text-[10px] p-1 border border-slate-200 rounded text-slate-500 bg-slate-50"
                        >
                          <option value="">Or select from registered catalog...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.itemCode})
                            </option>
                          ))}
                        </select>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={item.batchNumber || ''}
                          onChange={(e) => handleItemFieldChange(idx, 'batchNumber', e.target.value)}
                          placeholder="Batch / Heat No."
                          className="w-1/2 text-[10px] p-1 border border-slate-200 rounded font-mono"
                        />
                        <input
                          type="text"
                          value={item.remarks || ''}
                          onChange={(e) => handleItemFieldChange(idx, 'remarks', e.target.value)}
                          placeholder="Line remarks"
                          className="w-1/2 text-[10px] p-1 border border-slate-200 rounded"
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={item.hsnCode}
                        onChange={(e) => handleItemFieldChange(idx, 'hsnCode', e.target.value)}
                        placeholder="HSN"
                        className="w-full p-1.5 border border-slate-300 rounded text-center font-mono font-bold text-xs"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="1"
                        value={item.dispatchQty}
                        onChange={(e) => handleQtyPriceChange(idx, 'dispatchQty', Number(e.target.value))}
                        className="w-full p-1.5 border border-blue-300 rounded text-center font-mono font-bold text-slate-900 bg-white"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={item.uom}
                        onChange={(e) => handleItemFieldChange(idx, 'uom', e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded text-center font-mono font-bold text-xs bg-white"
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
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleQtyPriceChange(idx, 'unitPrice', Number(e.target.value))}
                        className="w-full p-1.5 border border-slate-300 rounded text-right font-mono"
                      />
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">{item.taxableAmount.toFixed(2)}</td>
                    <td className="p-3">
                      <select
                        value={item.taxRate}
                        onChange={(e) => handleItemFieldChange(idx, 'taxRate', Number(e.target.value))}
                        className="w-full p-1.5 border border-slate-300 rounded text-center font-mono font-bold text-slate-700 bg-white"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-blue-900">{item.totalAmount.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end">
            <div className="w-80 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Taxable Value:</span>
                <span className="font-bold text-slate-900">{formatINR(totalTaxable)}</span>
              </div>
              {totalCgst > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">CGST Amount:</span>
                  <span className="font-semibold">{formatINR(totalCgst)}</span>
                </div>
              )}
              {totalSgst > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">SGST Amount:</span>
                  <span className="font-semibold">{formatINR(totalSgst)}</span>
                </div>
              )}
              {totalIgst > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">IGST Amount (Inter-State):</span>
                  <span className="font-semibold">{formatINR(totalIgst)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-black text-blue-950">
                <span>Grand Consignment Value:</span>
                <span>{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Transport & E-Way Bill Details */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" /> 4. Transport, Vehicle & E-Way Bill Compliance
            </label>
            {isEWayBillRequired ? (
              <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> E-Way Bill Mandatory (Value &gt; ₹50,000)
              </span>
            ) : (
              <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                Under ₹50,000 Threshold
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transporter Name</label>
              <input
                type="text"
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                placeholder="e.g. VRL / GATI / TCI Express"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transport Mode</label>
              <select
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value as TransportMode)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ROAD">Road</option>
                <option value="RAIL">Rail</option>
                <option value="AIR">Air</option>
                <option value="SHIP">Ship</option>
                <option value="COURIER">Courier</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vehicle Registration No.
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="e.g. MH 04 GP 8812"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Type / Model</label>
              <input
                type="text"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                placeholder="e.g. Tata Ultra 1518 Closed"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Driver Name & Mobile</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Driver Name"
                  className="w-1/2 text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={driverMobile}
                  onChange={(e) => setDriverMobile(e.target.value)}
                  placeholder="Mobile"
                  className="w-1/2 text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LR / GR Number</label>
              <input
                type="text"
                value={lrNumber}
                onChange={(e) => setLrNumber(e.target.value)}
                placeholder="Lorry Receipt No."
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Distance (KM)</label>
              <input
                type="number"
                min="1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-Way Bill Number (12 Digits)
              </label>
              <input
                type="text"
                maxLength={12}
                value={eWayBillNumber}
                onChange={(e) => setEWayBillNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 281098456123"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 6: Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Instructions</label>
            <textarea
              rows={2}
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              placeholder="e.g. Handle with care, forklift unloading at Bay 2 only."
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Special Internal Remarks</label>
            <textarea
              rows={2}
              value={specialRemarks}
              onChange={(e) => setSpecialRemarks(e.target.value)}
              placeholder="e.g. Advance payment received, inspected by plant manager."
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            Cancel & Return
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-lg transition-all"
          >
            <CheckCircle className="w-4 h-4" /> Save & Generate Delivery Challan
          </button>
        </div>
      </form>
    </div>
  );
};
