import {
  Company,
  Branch,
  Warehouse,
  Customer,
  Supplier,
  Product,
  DeliveryChallan,
  PurchaseOrder,
  SalesOrder,
  GoodsReturn,
  AuditLog,
  AppNotification,
  AppSettings,
  User,
  StockBalance,
} from '../types/erp';

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp_01',
    name: 'Enterprise Logistics & Delivery Portal',
    tradeName: 'Delivery Challan ERP',
    gstin: '',
    pan: '',
    cin: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '',
    bankName: '',
    accountNo: '',
    ifsc: '',
    branchName: 'Main Branch',
    logoUrl: '',
    subscriptionPlan: 'ENTERPRISE',
    subscriptionExpiry: '2030-12-31',
    userLimit: 50,
  },
];

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'br_01',
    companyId: 'comp_01',
    name: 'Main Branch',
    code: 'BR-01',
    address: '',
    city: '',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '',
    phone: '',
    isHeadOffice: true,
  },
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh_01',
    companyId: 'comp_01',
    branchId: 'br_01',
    name: 'Main Warehouse',
    code: 'WH-01',
    address: '',
    managerName: 'Warehouse Manager',
    contactNumber: '',
    capacitySqFt: 10000,
    isActive: true,
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_STOCK: StockBalance[] = [];

export const INITIAL_CHALLANS: DeliveryChallan[] = [];

export const INITIAL_SALES_ORDERS: SalesOrder[] = [];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [];

export const INITIAL_RETURNS: GoodsReturn[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_01',
    name: 'Administrator',
    email: 'admin@portal.local',
    role: 'SUPER_ADMIN',
    department: 'ERP Operations',
    branchId: 'br_01',
  },
];

export const INITIAL_SETTINGS: AppSettings = {
  company: INITIAL_COMPANIES[0],
  financialYear: '2026-27',
  availableFinancialYears: ['2024-25', '2025-26', '2026-27', '2027-28'],
  numbering: {
    challanPrefix: 'DC',
    challanSuffix: '',
    challanDigits: 5,
    challanStartingNo: 1,
    includeFyInChallan: true,
    poPrefix: 'PO',
    soPrefix: 'SO',
    returnPrefix: 'RET',
    stockTransferPrefix: 'ST',
  },
  approvalRules: {
    requireApprovalAboveAmount: 50000,
    strictSequentialApproval: true,
    autoApproveSampleChallan: false,
  },
  tax: {
    enableGst: true,
    eWayBillThreshold: 50000,
    defaultTaxRate: 18,
  },
  localization: {
    currency: 'INR',
    dateFormat: 'dd/MM/yyyy',
    timeZone: 'Asia/Kolkata',
    numberFormat: 'INDIAN',
  },
  pdfTemplate: {
    headerColor: '#1e3a8a',
    showBankDetails: true,
    showTerms: true,
    termsText:
      '1. Goods dispatched under this Delivery Challan remain the property of the Consignor until fully billed or settled.\n2. Any breakage, damage or shortage must be endorsed on the Lorry Receipt / Proof of Delivery document immediately upon receipt.\n3. Material sent for Job Work must be returned within the statutory period under Section 143 of CGST Act 2017.',
    signatoryLabel: 'Authorized Signatory',
  },
};
