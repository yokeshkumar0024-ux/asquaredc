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
  StockLedgerEntry,
  ChallanType,
} from '../types/erp';
import {
  INITIAL_COMPANIES,
  INITIAL_BRANCHES,
  INITIAL_WAREHOUSES,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  INITIAL_STOCK,
  INITIAL_CHALLANS,
  INITIAL_SALES_ORDERS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_RETURNS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
  INITIAL_USERS,
} from './mockData';

const STORAGE_PREFIX = 'challanpro_erp_v3_clean_';

export interface DatabaseBackup {
  backupId: string;
  timestamp: string;
  version: string;
  companyId: string;
  data: {
    companies: Company[];
    branches: Branch[];
    warehouses: Warehouse[];
    customers: Customer[];
    suppliers: Supplier[];
    products: Product[];
    stock: StockBalance[];
    stockLedger: StockLedgerEntry[];
    challans: DeliveryChallan[];
    salesOrders: SalesOrder[];
    purchaseOrders: PurchaseOrder[];
    returns: GoodsReturn[];
    auditLogs: AuditLog[];
    notifications: AppNotification[];
    settings: AppSettings;
    users: User[];
  };
}

class ERPStorageService {
  private activeCompanyId: string = 'comp_01';
  private currentUser: User = INITIAL_USERS[0];

  constructor() {
    this.initializeIfEmpty();
  }

  private initializeIfEmpty() {
    if (!localStorage.getItem(STORAGE_PREFIX + 'initialized')) {
      localStorage.setItem(STORAGE_PREFIX + 'companies', JSON.stringify(INITIAL_COMPANIES));
      localStorage.setItem(STORAGE_PREFIX + 'branches', JSON.stringify(INITIAL_BRANCHES));
      localStorage.setItem(STORAGE_PREFIX + 'warehouses', JSON.stringify(INITIAL_WAREHOUSES));
      localStorage.setItem(STORAGE_PREFIX + 'customers', JSON.stringify(INITIAL_CUSTOMERS));
      localStorage.setItem(STORAGE_PREFIX + 'suppliers', JSON.stringify(INITIAL_SUPPLIERS));
      localStorage.setItem(STORAGE_PREFIX + 'products', JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem(STORAGE_PREFIX + 'stock', JSON.stringify(INITIAL_STOCK));
      localStorage.setItem(STORAGE_PREFIX + 'stockLedger', JSON.stringify([]));
      localStorage.setItem(STORAGE_PREFIX + 'challans', JSON.stringify(INITIAL_CHALLANS));
      localStorage.setItem(STORAGE_PREFIX + 'salesOrders', JSON.stringify(INITIAL_SALES_ORDERS));
      localStorage.setItem(STORAGE_PREFIX + 'purchaseOrders', JSON.stringify(INITIAL_PURCHASE_ORDERS));
      localStorage.setItem(STORAGE_PREFIX + 'returns', JSON.stringify(INITIAL_RETURNS));
      localStorage.setItem(STORAGE_PREFIX + 'auditLogs', JSON.stringify(INITIAL_AUDIT_LOGS));
      localStorage.setItem(STORAGE_PREFIX + 'notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
      localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(INITIAL_SETTINGS));
      localStorage.setItem(STORAGE_PREFIX + 'users', JSON.stringify(INITIAL_USERS));
      localStorage.setItem(STORAGE_PREFIX + 'backups', JSON.stringify([]));
      localStorage.setItem(STORAGE_PREFIX + 'activeCompanyId', 'comp_01');
      localStorage.setItem(STORAGE_PREFIX + 'currentUserId', 'usr_01');
      localStorage.setItem(STORAGE_PREFIX + 'initialized', 'true');
    }

    const savedCompanyId = localStorage.getItem(STORAGE_PREFIX + 'activeCompanyId');
    if (savedCompanyId) {
      this.activeCompanyId = savedCompanyId;
    }

    const savedUserId = localStorage.getItem(STORAGE_PREFIX + 'currentUserId');
    if (savedUserId) {
      const users = this.getUsers();
      const matched = users.find((u) => u.id === savedUserId);
      if (matched) this.currentUser = matched;
    }
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  }

  // --- Session & Tenant ---
  public getActiveCompanyId(): string {
    return this.activeCompanyId;
  }

  public setActiveCompanyId(companyId: string): void {
    this.activeCompanyId = companyId;
    localStorage.setItem(STORAGE_PREFIX + 'activeCompanyId', companyId);
    this.logAudit({
      entityType: 'AUTH',
      entityId: companyId,
      action: 'UPDATE',
      details: `Switched active company tenant to ${companyId}`,
    });
  }

  public getCurrentUser(): User {
    return this.currentUser;
  }

  public setCurrentUser(user: User): void {
    this.currentUser = user;
    localStorage.setItem(STORAGE_PREFIX + 'currentUserId', user.id);
    this.logAudit({
      entityType: 'AUTH',
      entityId: user.id,
      action: 'LOGIN',
      details: `Switched active session user to ${user.name} (${user.role})`,
    });
  }

  // --- Companies & Settings ---
  public getCompanies(): Company[] {
    return this.getItem<Company[]>('companies', INITIAL_COMPANIES);
  }

  public getCompany(id?: string): Company {
    const compId = id || this.activeCompanyId;
    const comps = this.getCompanies();
    return comps.find((c) => c.id === compId) || comps[0];
  }

  public saveCompany(company: Company): void {
    const comps = this.getCompanies();
    const idx = comps.findIndex((c) => c.id === company.id);
    if (idx >= 0) comps[idx] = company;
    else comps.push(company);
    this.setItem('companies', comps);
    this.logAudit({
      entityType: 'SETTINGS',
      entityId: company.id,
      action: idx >= 0 ? 'UPDATE' : 'CREATE',
      details: `Updated company details for ${company.name}`,
    });
  }

  public getSettings(): AppSettings {
    const settings = this.getItem<AppSettings>('settings', INITIAL_SETTINGS);
    // Sync current company
    settings.company = this.getCompany();
    return settings;
  }

  public saveSettings(settings: AppSettings): void {
    this.setItem('settings', settings);
    this.saveCompany(settings.company);
    this.logAudit({
      entityType: 'SETTINGS',
      entityId: 'global_settings',
      action: 'UPDATE',
      details: 'Updated enterprise ERP configuration settings',
    });
  }

  public getFinancialYear(): string {
    return this.getSettings().financialYear;
  }

  public setFinancialYear(fy: string): void {
    const settings = this.getSettings();
    settings.financialYear = fy;
    this.saveSettings(settings);
    this.logAudit({
      entityType: 'SETTINGS',
      entityId: fy,
      action: 'UPDATE',
      details: `Switched current active Financial Year to ${fy}`,
    });
  }

  // --- Branches & Warehouses ---
  public getBranches(): Branch[] {
    const all = this.getItem<Branch[]>('branches', INITIAL_BRANCHES);
    return all.filter((b) => b.companyId === this.activeCompanyId);
  }

  public saveBranch(branch: Branch): void {
    const all = this.getItem<Branch[]>('branches', INITIAL_BRANCHES);
    const idx = all.findIndex((b) => b.id === branch.id);
    if (idx >= 0) all[idx] = branch;
    else all.push(branch);
    this.setItem('branches', all);
  }

  public getWarehouses(): Warehouse[] {
    const all = this.getItem<Warehouse[]>('warehouses', INITIAL_WAREHOUSES);
    return all.filter((w) => w.companyId === this.activeCompanyId);
  }

  public saveWarehouse(wh: Warehouse): void {
    const all = this.getItem<Warehouse[]>('warehouses', INITIAL_WAREHOUSES);
    const idx = all.findIndex((w) => w.id === wh.id);
    if (idx >= 0) all[idx] = wh;
    else all.push(wh);
    this.setItem('warehouses', all);
  }

  // --- Customers & Suppliers ---
  public getCustomers(): Customer[] {
    const all = this.getItem<Customer[]>('customers', INITIAL_CUSTOMERS);
    return all.filter((c) => c.companyId === this.activeCompanyId);
  }

  public saveCustomer(cust: Customer): void {
    const all = this.getItem<Customer[]>('customers', INITIAL_CUSTOMERS);
    const idx = all.findIndex((c) => c.id === cust.id);
    if (idx >= 0) all[idx] = cust;
    else all.push(cust);
    this.setItem('customers', all);
    this.logAudit({
      entityType: 'SETTINGS',
      entityId: cust.id,
      entityNumber: cust.customerCode,
      action: idx >= 0 ? 'UPDATE' : 'CREATE',
      details: `Saved customer master: ${cust.name}`,
    });
  }

  public getSuppliers(): Supplier[] {
    const all = this.getItem<Supplier[]>('suppliers', INITIAL_SUPPLIERS);
    return all.filter((s) => s.companyId === this.activeCompanyId);
  }

  public saveSupplier(supp: Supplier): void {
    const all = this.getItem<Supplier[]>('suppliers', INITIAL_SUPPLIERS);
    const idx = all.findIndex((s) => s.id === supp.id);
    if (idx >= 0) all[idx] = supp;
    else all.push(supp);
    this.setItem('suppliers', all);
    this.logAudit({
      entityType: 'SETTINGS',
      entityId: supp.id,
      entityNumber: supp.supplierCode,
      action: idx >= 0 ? 'UPDATE' : 'CREATE',
      details: `Saved supplier master: ${supp.name}`,
    });
  }

  // --- Products & Inventory ---
  public getProducts(): Product[] {
    const all = this.getItem<Product[]>('products', INITIAL_PRODUCTS);
    return all.filter((p) => p.companyId === this.activeCompanyId);
  }

  public saveProduct(prod: Product): void {
    const all = this.getItem<Product[]>('products', INITIAL_PRODUCTS);
    const idx = all.findIndex((p) => p.id === prod.id);
    if (idx >= 0) all[idx] = prod;
    else all.push(prod);
    this.setItem('products', all);
    this.logAudit({
      entityType: 'STOCK',
      entityId: prod.id,
      entityNumber: prod.itemCode,
      action: idx >= 0 ? 'UPDATE' : 'CREATE',
      details: `Saved product catalog item: ${prod.name}`,
    });
  }

  public getStockBalances(): StockBalance[] {
    return this.getItem<StockBalance[]>('stock', INITIAL_STOCK);
  }

  public getWarehouseStock(warehouseId: string, productId: string): StockBalance | undefined {
    const balances = this.getStockBalances();
    return balances.find((b) => b.warehouseId === warehouseId && b.productId === productId);
  }

  public updateStockBalance(balance: StockBalance): void {
    const all = this.getStockBalances();
    const idx = all.findIndex((b) => b.id === balance.id);
    if (idx >= 0) all[idx] = balance;
    else all.push(balance);
    this.setItem('stock', all);
  }

  public getStockLedger(): StockLedgerEntry[] {
    const all = this.getItem<StockLedgerEntry[]>('stockLedger', []);
    return all.filter((e) => e.companyId === this.activeCompanyId);
  }

  public recordStockAdjustment(
    warehouseId: string,
    productId: string,
    adjustmentQty: number, // positive for inward, negative for outward
    reason: string
  ): void {
    let balance = this.getWarehouseStock(warehouseId, productId);
    const prod = this.getProducts().find((p) => p.id === productId);
    if (!prod) return;

    if (!balance) {
      balance = {
        id: `stk_${Date.now()}`,
        productId,
        warehouseId,
        openingStock: 0,
        currentStock: 0,
        reservedStock: 0,
        damagedStock: 0,
        inTransitStock: 0,
        valuationRate: prod.unitPrice,
      };
    }

    const previousStock = balance.currentStock;
    balance.currentStock = Math.max(0, balance.currentStock + adjustmentQty);
    this.updateStockBalance(balance);

    const ledgerEntry: StockLedgerEntry = {
      id: `led_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      companyId: this.activeCompanyId,
      warehouseId,
      productId,
      date: new Date().toISOString(),
      transactionType: 'ADJUSTMENT',
      referenceNo: `ADJ-${Date.now().toString().slice(-6)}`,
      referenceId: balance.id,
      inwardQty: adjustmentQty > 0 ? adjustmentQty : 0,
      outwardQty: adjustmentQty < 0 ? Math.abs(adjustmentQty) : 0,
      balanceQty: balance.currentStock,
      remarks: `Stock Adjustment: ${reason} (Prev: ${previousStock}, New: ${balance.currentStock})`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      createdAt: new Date().toISOString(),
    };

    const ledgers = this.getItem<StockLedgerEntry[]>('stockLedger', []);
    ledgers.unshift(ledgerEntry);
    this.setItem('stockLedger', ledgers);

    this.logAudit({
      entityType: 'STOCK',
      entityId: productId,
      entityNumber: prod.itemCode,
      action: 'UPDATE',
      details: `Stock adjustment of ${adjustmentQty > 0 ? '+' : ''}${adjustmentQty} ${prod.uom} at warehouse. Reason: ${reason}`,
    });
  }

  // --- Numbering Generator ---
  public getNextDocumentNumber(type: ChallanType | 'SO' | 'PO' | 'RET' | 'ST'): string {
    const settings = this.getSettings();
    const fy = settings.financialYear;
    let prefix = 'DC';

    switch (type) {
      case 'JOB_WORK':
        prefix = 'JW';
        break;
      case 'STOCK_TRANSFER':
        prefix = 'ST';
        break;
      case 'SALES_RETURN':
      case 'GOODS_RETURN':
      case 'PURCHASE_RETURN':
        prefix = 'RET';
        break;
      case 'REPAIR_MAINTENANCE':
        prefix = 'REP';
        break;
      case 'SAMPLE_DELIVERY':
        prefix = 'SMP';
        break;
      case 'APPROVAL_BASIS':
        prefix = 'APP';
        break;
      case 'SCRAP_MOVEMENT':
        prefix = 'SCRAP';
        break;
      case 'NON_SALE_DELIVERY':
        prefix = 'NSD';
        break;
      case 'SUBCONTRACTING':
        prefix = 'SUB';
        break;
      case 'SO':
        prefix = settings.numbering.soPrefix || 'SO';
        break;
      case 'PO':
        prefix = settings.numbering.poPrefix || 'PO';
        break;
      case 'RET':
        prefix = settings.numbering.returnPrefix || 'RET';
        break;
      case 'ST':
        prefix = settings.numbering.stockTransferPrefix || 'ST';
        break;
      default:
        prefix = settings.numbering.challanPrefix || 'DC';
    }

    const challans = this.getChallans(true);
    const existingCount = challans.filter((c) => c.challanNumber.startsWith(prefix)).length;
    const nextSeq = settings.numbering.challanStartingNo + existingCount;
    const padded = nextSeq.toString().padStart(settings.numbering.challanDigits || 5, '0');

    if (settings.numbering.includeFyInChallan) {
      return `${prefix}/${fy}/${padded}`;
    }
    return `${prefix}/${padded}`;
  }

  // --- Challans ---
  public getChallans(includeDeleted: boolean = false): DeliveryChallan[] {
    const all = this.getItem<DeliveryChallan[]>('challans', INITIAL_CHALLANS);
    return all.filter((c) => c.companyId === this.activeCompanyId && (includeDeleted || !c.isDeleted));
  }

  public getChallanById(id: string): DeliveryChallan | undefined {
    const challans = this.getChallans(true);
    return challans.find((c) => c.id === id);
  }

  public saveChallan(challan: DeliveryChallan, reason: string = 'Created/Updated Challan'): DeliveryChallan {
    const all = this.getItem<DeliveryChallan[]>('challans', INITIAL_CHALLANS);
    const idx = all.findIndex((c) => c.id === challan.id);

    challan.updatedAt = new Date().toISOString();
    challan.updatedBy = this.currentUser.name;

    if (idx >= 0) {
      // Save revision history if version incremented or significant update
      const existing = all[idx];
      if (existing.status !== 'DRAFT' && existing.version === challan.version) {
        challan.version += 1;
        challan.revisionHistory = challan.revisionHistory || [];
        challan.revisionHistory.unshift({
          version: existing.version,
          amendedAt: new Date().toISOString(),
          amendedBy: this.currentUser.name,
          reason,
          snapshot: JSON.stringify(existing),
        });
      }
      all[idx] = challan;
    } else {
      all.unshift(challan);
    }

    this.setItem('challans', all);

    this.logAudit({
      entityType: 'CHALLAN',
      entityId: challan.id,
      entityNumber: challan.challanNumber,
      action: idx >= 0 ? 'UPDATE' : 'CREATE',
      details: `${idx >= 0 ? 'Updated' : 'Created'} Challan ${challan.challanNumber} (${challan.challanType}) for ${challan.customerName || challan.supplierName || 'Transfer'}. Value: ₹${challan.totalAmount.toLocaleString('en-IN')}`,
    });

    return challan;
  }

  public cancelChallan(challanId: string, reason: string): boolean {
    const challan = this.getChallanById(challanId);
    if (!challan) return false;

    challan.status = 'CANCELLED';
    challan.cancellationReason = reason;
    this.saveChallan(challan, `Cancelled: ${reason}`);

    this.logAudit({
      entityType: 'CHALLAN',
      entityId: challan.id,
      entityNumber: challan.challanNumber,
      action: 'UPDATE',
      details: `Cancelled Challan ${challan.challanNumber}. Reason: ${reason}`,
    });

    return true;
  }

  public softDeleteChallan(challanId: string): boolean {
    const challan = this.getChallanById(challanId);
    if (!challan) return false;

    challan.isDeleted = true;
    this.saveChallan(challan, 'Soft-deleted challan');

    this.logAudit({
      entityType: 'CHALLAN',
      entityId: challan.id,
      entityNumber: challan.challanNumber,
      action: 'DELETE',
      details: `Soft deleted Challan ${challan.challanNumber}`,
    });

    return true;
  }

  // --- Partial Delivery & POD ---
  public recordDeliveryAcknowledgement(podData: {
    challanId: string;
    deliveryDate: string;
    deliveryTime: string;
    receiverName: string;
    receiverMobile: string;
    receiverDesignation?: string;
    digitalSignatureUrl?: string;
    photographUrl?: string;
    receivedQuantities: {
      productId: string;
      acceptedQty: number;
      shortageQty: number;
      damagedQty: number;
      rejectedQty: number;
      notes?: string;
    }[];
    remarks: string;
  }): DeliveryChallan | undefined {
    const challan = this.getChallanById(podData.challanId);
    if (!challan) return undefined;

    let isAllFullyDelivered = true;

    challan.items.forEach((item) => {
      const match = podData.receivedQuantities.find((r) => r.productId === item.productId);
      if (match) {
        item.deliveredQty += match.acceptedQty;
        item.damagedQty += match.damagedQty;
        item.rejectedQty += match.rejectedQty;
        item.pendingQty = Math.max(0, item.dispatchQty - item.deliveredQty);
      }
      if (item.pendingQty > 0) {
        isAllFullyDelivered = false;
      }
    });

    challan.proofOfDelivery = {
      id: `pod_${Date.now()}`,
      challanId: challan.id,
      deliveryDate: podData.deliveryDate,
      deliveryTime: podData.deliveryTime,
      receiverName: podData.receiverName,
      receiverMobile: podData.receiverMobile,
      receiverDesignation: podData.receiverDesignation,
      digitalSignatureUrl: podData.digitalSignatureUrl,
      photographUrl: podData.photographUrl,
      receivedQuantities: podData.receivedQuantities,
      isCompleteDelivery: isAllFullyDelivered,
      remarks: podData.remarks,
      createdAt: new Date().toISOString(),
      recordedBy: this.currentUser.name,
    };

    challan.status = isAllFullyDelivered ? 'DELIVERED' : 'PARTIALLY_DELIVERED';
    this.saveChallan(challan, `Recorded Delivery Acknowledgement (POD). Complete: ${isAllFullyDelivered}`);

    this.addNotification({
      title: isAllFullyDelivered ? 'Challan Fully Delivered' : 'Partial Delivery Recorded',
      message: `Challan ${challan.challanNumber} signed by ${podData.receiverName}. Status: ${challan.status}`,
      type: 'SUCCESS',
      entityType: 'CHALLAN',
      entityId: challan.id,
    });

    return challan;
  }

  // --- Orders ---
  public getSalesOrders(): SalesOrder[] {
    const all = this.getItem<SalesOrder[]>('salesOrders', INITIAL_SALES_ORDERS);
    return all.filter((so) => so.companyId === this.activeCompanyId);
  }

  public saveSalesOrder(so: SalesOrder): void {
    const all = this.getItem<SalesOrder[]>('salesOrders', INITIAL_SALES_ORDERS);
    const idx = all.findIndex((s) => s.id === so.id);
    if (idx >= 0) all[idx] = so;
    else all.push(so);
    this.setItem('salesOrders', all);
    this.logAudit({
      entityType: 'ORDER',
      entityId: so.id,
      entityNumber: so.soNumber,
      action: idx >= 0 ? 'UPDATE' : 'CREATE',
      details: `Saved Sales Order ${so.soNumber} for ${so.customerName}`,
    });
  }

  public getPurchaseOrders(): PurchaseOrder[] {
    const all = this.getItem<PurchaseOrder[]>('purchaseOrders', INITIAL_PURCHASE_ORDERS);
    return all.filter((po) => po.companyId === this.activeCompanyId);
  }

  public savePurchaseOrder(po: PurchaseOrder): void {
    const all = this.getItem<PurchaseOrder[]>('purchaseOrders', INITIAL_PURCHASE_ORDERS);
    const idx = all.findIndex((p) => p.id === po.id);
    if (idx >= 0) all[idx] = po;
    else all.push(po);
    this.setItem('purchaseOrders', all);
    this.logAudit({
      entityType: 'ORDER',
      entityId: po.id,
      entityNumber: po.poNumber,
      action: idx >= 0 ? 'UPDATE' : 'CREATE',
      details: `Saved Purchase Order ${po.poNumber} for ${po.supplierName}`,
    });
  }

  // --- Returns & Inspections ---
  public getReturns(): GoodsReturn[] {
    const all = this.getItem<GoodsReturn[]>('returns', INITIAL_RETURNS);
    return all.filter((r) => r.companyId === this.activeCompanyId);
  }

  public saveReturn(ret: GoodsReturn): void {
    const all = this.getItem<GoodsReturn[]>('returns', INITIAL_RETURNS);
    const idx = all.findIndex((r) => r.id === ret.id);
    if (idx >= 0) all[idx] = ret;
    else all.push(ret);
    this.setItem('returns', all);
    this.logAudit({
      entityType: 'RETURN',
      entityId: ret.id,
      entityNumber: ret.returnNumber,
      action: idx >= 0 ? 'UPDATE' : 'CREATE',
      details: `Saved Goods Return ${ret.returnNumber} from ${ret.partyName}`,
    });
  }

  // --- Notifications & Audit ---
  public getNotifications(): AppNotification[] {
    const all = this.getItem<AppNotification[]>('notifications', INITIAL_NOTIFICATIONS);
    return all.filter((n) => n.companyId === this.activeCompanyId);
  }

  public addNotification(notif: Omit<AppNotification, 'id' | 'companyId' | 'createdAt' | 'isRead'>): void {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      companyId: this.activeCompanyId,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    const all = this.getItem<AppNotification[]>('notifications', INITIAL_NOTIFICATIONS);
    all.unshift(newNotif);
    this.setItem('notifications', all.slice(0, 50));
  }

  public markNotificationAsRead(id: string): void {
    const all = this.getItem<AppNotification[]>('notifications', INITIAL_NOTIFICATIONS);
    const item = all.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      this.setItem('notifications', all);
    }
  }

  public markAllNotificationsAsRead(): void {
    const all = this.getItem<AppNotification[]>('notifications', INITIAL_NOTIFICATIONS);
    all.forEach((n) => {
      if (n.companyId === this.activeCompanyId) n.isRead = true;
    });
    this.setItem('notifications', all);
  }

  public getAuditLogs(): AuditLog[] {
    const all = this.getItem<AuditLog[]>('auditLogs', INITIAL_AUDIT_LOGS);
    return all.filter((a) => a.companyId === this.activeCompanyId);
  }

  public logAudit(entry: {
    entityType: AuditLog['entityType'];
    entityId: string;
    entityNumber?: string;
    action: AuditLog['action'];
    details: string;
    previousValue?: string;
    newValue?: string;
  }): void {
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      companyId: this.activeCompanyId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      entityNumber: entry.entityNumber,
      action: entry.action,
      userId: this.currentUser?.id || 'system',
      userName: this.currentUser?.name || 'System Auto',
      userRole: this.currentUser?.role || 'SUPER_ADMIN',
      ipAddress: '192.168.1.10',
      details: entry.details,
      previousValue: entry.previousValue,
      newValue: entry.newValue,
      timestamp: new Date().toISOString(),
    };

    const logs = this.getItem<AuditLog[]>('auditLogs', INITIAL_AUDIT_LOGS);
    logs.unshift(log);
    this.setItem('auditLogs', logs.slice(0, 200)); // Maintain rolling 200 logs
  }

  public getUsers(): User[] {
    return this.getItem<User[]>('users', INITIAL_USERS);
  }

  // --- Database Backup & Restore ---
  public exportDatabase(): string {
    const backup: DatabaseBackup = {
      backupId: `BKP_${Date.now()}`,
      timestamp: new Date().toISOString(),
      version: '1.0.0-enterprise',
      companyId: this.activeCompanyId,
      data: {
        companies: this.getCompanies(),
        branches: this.getItem('branches', INITIAL_BRANCHES),
        warehouses: this.getItem('warehouses', INITIAL_WAREHOUSES),
        customers: this.getItem('customers', INITIAL_CUSTOMERS),
        suppliers: this.getItem('suppliers', INITIAL_SUPPLIERS),
        products: this.getItem('products', INITIAL_PRODUCTS),
        stock: this.getItem('stock', INITIAL_STOCK),
        stockLedger: this.getItem('stockLedger', []),
        challans: this.getItem('challans', INITIAL_CHALLANS),
        salesOrders: this.getItem('salesOrders', INITIAL_SALES_ORDERS),
        purchaseOrders: this.getItem('purchaseOrders', INITIAL_PURCHASE_ORDERS),
        returns: this.getItem('returns', INITIAL_RETURNS),
        auditLogs: this.getItem('auditLogs', INITIAL_AUDIT_LOGS),
        notifications: this.getItem('notifications', INITIAL_NOTIFICATIONS),
        settings: this.getSettings(),
        users: this.getUsers(),
      },
    };

    const backups = this.getItem<DatabaseBackup[]>('backups', []);
    backups.unshift(backup);
    this.setItem('backups', backups.slice(0, 10));

    this.logAudit({
      entityType: 'SETTINGS',
      entityId: backup.backupId,
      action: 'BACKUP',
      details: `Generated full enterprise database snapshot backup ${backup.backupId}`,
    });

    return JSON.stringify(backup, null, 2);
  }

  public importDatabase(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString) as DatabaseBackup;
      if (!parsed.data || !parsed.data.challans || !parsed.data.companies) {
        return { success: false, message: 'Invalid backup format: missing required ERP collections.' };
      }

      this.setItem('companies', parsed.data.companies);
      this.setItem('branches', parsed.data.branches);
      this.setItem('warehouses', parsed.data.warehouses);
      this.setItem('customers', parsed.data.customers);
      this.setItem('suppliers', parsed.data.suppliers);
      this.setItem('products', parsed.data.products);
      this.setItem('stock', parsed.data.stock);
      this.setItem('stockLedger', parsed.data.stockLedger || []);
      this.setItem('challans', parsed.data.challans);
      this.setItem('salesOrders', parsed.data.salesOrders);
      this.setItem('purchaseOrders', parsed.data.purchaseOrders);
      this.setItem('returns', parsed.data.returns);
      this.setItem('settings', parsed.data.settings);
      this.setItem('users', parsed.data.users);

      this.logAudit({
        entityType: 'SETTINGS',
        entityId: parsed.backupId || 'RESTORE',
        action: 'RESTORE',
        details: `Successfully restored enterprise database from backup dated ${parsed.timestamp}`,
      });

      return { success: true, message: `Database successfully restored! Loaded ${parsed.data.challans.length} challans, ${parsed.data.products.length} products.` };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Failed to restore database: ${errorMsg}` };
    }
  }

  public getBackups(): DatabaseBackup[] {
    return this.getItem<DatabaseBackup[]>('backups', []);
  }

  public resetToFactorySeed(): void {
    localStorage.clear();
    this.initializeIfEmpty();
  }
}

export const ERPStorage = new ERPStorageService();
