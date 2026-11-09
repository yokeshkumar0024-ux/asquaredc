export type ChallanType =
  | 'STANDARD_DELIVERY'
  | 'JOB_WORK'
  | 'STOCK_TRANSFER'
  | 'SALES_RETURN'
  | 'PURCHASE_RETURN'
  | 'GOODS_RETURN'
  | 'REPAIR_MAINTENANCE'
  | 'APPROVAL_BASIS'
  | 'SAMPLE_DELIVERY'
  | 'SCRAP_MOVEMENT'
  | 'NON_SALE_DELIVERY'
  | 'SUBCONTRACTING';

export type ChallanStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CORRECTION_REQUIRED'
  | 'READY_FOR_DISPATCH'
  | 'IN_TRANSIT'
  | 'PARTIALLY_DELIVERED'
  | 'DELIVERED'
  | 'CLOSED'
  | 'CANCELLED';

export type TransportMode = 'ROAD' | 'RAIL' | 'AIR' | 'SHIP' | 'COURIER' | 'OTHER';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'DEPT_MANAGER'
  | 'DISPATCH_MANAGER'
  | 'DATA_ENTRY_OPERATOR'
  | 'QUALITY_INSPECTOR'
  | 'AUDITOR'
  | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  branchId: string;
  avatar?: string;
  customerId?: string; // If role is CUSTOMER
}

export interface Company {
  id: string;
  name: string;
  tradeName: string;
  gstin: string;
  pan: string;
  cin?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  branchName: string;
  logoUrl?: string;
  subscriptionPlan: 'BASIC' | 'GROWTH' | 'ENTERPRISE';
  subscriptionExpiry: string;
  userLimit: number;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  phone: string;
  gstin?: string;
  isHeadOffice: boolean;
}

export interface Warehouse {
  id: string;
  companyId: string;
  branchId: string;
  name: string;
  code: string;
  address: string;
  managerName: string;
  contactNumber: string;
  capacitySqFt?: number;
  isActive: boolean;
}

export interface Customer {
  id: string;
  companyId: string;
  customerCode: string;
  name: string;
  gstin: string;
  pan: string;
  contactPerson: string;
  phone: string;
  email: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingStateCode: string;
  billingPincode: string;
  shippingAddresses: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    stateCode: string;
    pincode: string;
    contactPerson?: string;
    phone?: string;
    isDefault?: boolean;
  }[];
  paymentTerms: string;
  creditLimit: number;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  companyId: string;
  supplierCode: string;
  name: string;
  gstin: string;
  pan: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  branch: string;
  paymentTerms: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  companyId: string;
  itemCode: string;
  name: string;
  description: string;
  hsnCode: string;
  uom: string; // Unit of measurement: PCS, NOS, KG, MTR, BOX, SET
  unitPrice: number;
  taxRate: number; // e.g. 18 for 18% GST
  hasBatchTracking: boolean;
  hasSerialTracking: boolean;
  hasExpiryTracking: boolean;
  minStockAlert: number;
  barcode: string;
  category: string;
}

export interface ProductBatch {
  id: string;
  productId: string;
  warehouseId: string;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate?: string;
  quantity: number;
  costPrice: number;
}

export interface ProductSerial {
  id: string;
  productId: string;
  warehouseId: string;
  serialNumber: string;
  status: 'IN_STOCK' | 'DISPATCHED' | 'DELIVERED' | 'RETURNED' | 'DAMAGED';
  challanId?: string;
}

export interface StockBalance {
  id: string;
  productId: string;
  warehouseId: string;
  openingStock: number;
  currentStock: number;
  reservedStock: number;
  damagedStock: number;
  inTransitStock: number;
  valuationRate: number;
}

export interface StockLedgerEntry {
  id: string;
  companyId: string;
  warehouseId: string;
  productId: string;
  date: string;
  transactionType: 'CHALLAN_OUT' | 'CHALLAN_IN' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'RETURN_IN' | 'ADJUSTMENT' | 'OPENING';
  referenceNo: string;
  referenceId: string;
  inwardQty: number;
  outwardQty: number;
  balanceQty: number;
  remarks: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface ChallanItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  hsnCode: string;
  uom: string;
  orderedQty: number;
  dispatchQty: number; // For current challan
  deliveredQty: number;
  pendingQty: number;
  returnedQty: number;
  damagedQty: number;
  rejectedQty: number;
  unitPrice: number;
  taxRate: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalAmount: number;
  batchNumber?: string;
  serialNumbers?: string[];
  expiryDate?: string;
  remarks?: string;
}

export interface TransportDetails {
  transporterName: string;
  transporterGstin?: string;
  transporterId?: string;
  transportMode: TransportMode;
  vehicleNumber: string;
  vehicleType: string;
  driverName?: string;
  driverMobile?: string;
  lrNumber?: string; // Lorry Receipt
  grNumber?: string; // Goods Receipt
  lrDate?: string;
  dispatchDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  freightCharges?: number;
  freightPayableBy: 'CONSIGNOR' | 'CONSIGNEE' | 'TO_BE_BILLED';
  distanceKm?: number;
}

export interface EWayBillDetails {
  eWayBillNumber?: string;
  eWayBillDate?: string;
  validUntil?: string;
  supplyType: 'OUTWARD_SUPPLY' | 'JOB_WORK' | 'EXPORT' | 'EXHIBITION' | 'LINE_SALES' | 'RECIPIENT_UNKNOWN' | 'FOR_OWN_USE' | 'OTHERS';
  subType: string;
  docType: 'CHALLAN' | 'TAX_INVOICE' | 'BILL_OF_SUPPLY';
  transporterId?: string;
  transportDocNo?: string;
  transportDocDate?: string;
  approxDistanceKm: number;
  status: 'NOT_GENERATED' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  isApplicable: boolean;
  documentAttachment?: Attachment;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  category: 'CHALLAN' | 'EWAY_BILL' | 'POD' | 'INSPECTION' | 'INVOICE' | 'OTHER';
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface DeliveryAcknowledgement {
  id: string;
  challanId: string;
  deliveryDate: string;
  deliveryTime: string;
  receiverName: string;
  receiverMobile: string;
  receiverDesignation?: string;
  digitalSignatureUrl?: string; // Data URL or canvas capture
  photographUrl?: string;
  receivedQuantities: {
    productId: string;
    acceptedQty: number;
    shortageQty: number;
    damagedQty: number;
    rejectedQty: number;
    notes?: string;
  }[];
  isCompleteDelivery: boolean;
  remarks: string;
  createdAt: string;
  recordedBy: string;
}

export interface ApprovalStep {
  level: number;
  role: UserRole;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT_BACK';
  actionDate?: string;
  actionByUserId?: string;
  actionByUserName?: string;
  comments?: string;
}

export interface DeliveryChallan {
  id: string;
  companyId: string;
  branchId: string;
  sourceWarehouseId: string;
  destinationWarehouseId?: string; // For Stock Transfer
  challanNumber: string;
  financialYear: string; // e.g. "2026-27"
  challanType: ChallanType;
  challanPurpose: string;
  challanDate: string;
  status: ChallanStatus;

  // References
  referenceChallanNumber?: string;
  originalChallanReference?: string;
  returnAgainstChallan?: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  jobWorkOrderNumber?: string;

  // Party info
  customerId?: string;
  customerName?: string;
  customerGstin?: string;
  customerAddress?: string;
  customerState?: string;
  customerStateCode?: string;

  supplierId?: string;
  supplierName?: string;
  supplierGstin?: string;

  shippingAddressId?: string;
  shippingAddressText?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingStateCode?: string;
  shippingPincode?: string;

  // Dates
  expectedReturnDate?: string; // for Job Work / Approval / Samples
  actualReturnDate?: string;

  // Items
  items: ChallanItem[];

  // Financial totals
  totalTaxableAmount: number;
  totalCgstAmount: number;
  totalSgstAmount: number;
  totalIgstAmount: number;
  totalAmount: number;

  // Logistics & Compliance
  transportDetails: TransportDetails;
  eWayBillDetails: EWayBillDetails;

  // Proof of Delivery (POD)
  proofOfDelivery?: DeliveryAcknowledgement;

  // Instructions & Remarks
  deliveryInstructions?: string;
  specialRemarks?: string;
  cancellationReason?: string;

  // Workflow & Versioning
  approvalSteps: ApprovalStep[];
  currentApprovalLevel: number;
  version: number;
  revisionHistory: {
    version: number;
    amendedAt: string;
    amendedBy: string;
    reason: string;
    snapshot: string; // JSON snapshot of previous state
  }[];

  attachments: Attachment[];
  qrVerificationToken: string;
  isDeleted: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface PurchaseOrder {
  id: string;
  companyId: string;
  poNumber: string;
  financialYear: string;
  supplierId: string;
  supplierName: string;
  poDate: string;
  expectedDeliveryDate: string;
  items: {
    productId: string;
    productCode: string;
    productName: string;
    hsnCode: string;
    uom: string;
    orderedQty: number;
    receivedQty: number;
    pendingQty: number;
    unitPrice: number;
    taxRate: number;
    totalAmount: number;
  }[];
  totalAmount: number;
  terms: string;
  status: 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';
  challanIds: string[];
  createdAt: string;
}

export interface SalesOrder {
  id: string;
  companyId: string;
  soNumber: string;
  financialYear: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  deliveryDate: string;
  items: {
    productId: string;
    productCode: string;
    productName: string;
    hsnCode: string;
    uom: string;
    orderedQty: number;
    dispatchedQty: number;
    pendingQty: number;
    unitPrice: number;
    taxRate: number;
    totalAmount: number;
  }[];
  totalAmount: number;
  status: 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_DISPATCHED' | 'COMPLETED' | 'CANCELLED';
  challanIds: string[];
  createdAt: string;
}

export interface GoodsReturn {
  id: string;
  companyId: string;
  returnNumber: string;
  returnDate: string;
  returnType: 'CUSTOMER_RETURN' | 'SUPPLIER_RETURN' | 'JOB_WORK_RETURN' | 'REJECTED_MATERIAL' | 'DAMAGED_RETURN';
  originalChallanId: string;
  originalChallanNumber: string;
  partyName: string;
  partyType: 'CUSTOMER' | 'SUPPLIER';
  partyId: string;
  items: {
    productId: string;
    productName: string;
    uom: string;
    originalQty: number;
    returnedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    condition: 'RESALABLE' | 'REPAIRABLE' | 'SCRAP';
  }[];
  reasonForReturn: string;
  qualityInspectionStatus: 'PENDING_INSPECTION' | 'INSPECTED_ACCEPTED' | 'INSPECTED_REJECTED' | 'PARTIALLY_ACCEPTED';
  inspectedBy?: string;
  inspectionDate?: string;
  inspectionRemarks?: string;
  stockUpdated: boolean;
  remarks?: string;
  status: 'PENDING_INSPECTION' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  companyId: string;
  entityType: 'CHALLAN' | 'ORDER' | 'STOCK' | 'RETURN' | 'SETTINGS' | 'AUTH' | 'USER';
  entityId: string;
  entityNumber?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'DISPATCH' | 'DELIVER' | 'RETURN' | 'BACKUP' | 'RESTORE' | 'LOGIN';
  userId: string;
  userName: string;
  userRole: string;
  ipAddress?: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  companyId: string;
  userId?: string; // If targeting specific user or role
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  entityType?: 'CHALLAN' | 'ORDER' | 'STOCK' | 'RETURN';
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NumberingSettings {
  challanPrefix: string;
  challanSuffix: string;
  challanDigits: number;
  challanStartingNo: number;
  includeFyInChallan: boolean;
  poPrefix: string;
  soPrefix: string;
  returnPrefix: string;
  stockTransferPrefix: string;
}

export interface AppSettings {
  company: Company;
  financialYear: string; // e.g. "2026-27"
  availableFinancialYears: string[];
  numbering: NumberingSettings;
  approvalRules: {
    requireApprovalAboveAmount: number;
    strictSequentialApproval: boolean;
    autoApproveSampleChallan: boolean;
  };
  tax: {
    enableGst: boolean;
    eWayBillThreshold: number; // default ₹50,000 in India
    defaultTaxRate: number;
  };
  localization: {
    currency: string;
    dateFormat: string;
    timeZone: string;
    numberFormat: 'INDIAN' | 'INTERNATIONAL';
  };
  pdfTemplate: {
    headerColor: string;
    showBankDetails: boolean;
    showTerms: boolean;
    termsText: string;
    signatoryLabel: string;
  };
}
