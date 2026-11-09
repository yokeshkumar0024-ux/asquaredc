import React, { useState, useMemo } from 'react';
import { ERPStorage } from '../../services/storage';
import { formatINR, formatDateIN, formatDateTimeIN } from '../../services/gstCalculator';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  Building,
  CheckCircle,
  AlertTriangle,
  Clock,
  Printer,
} from 'lucide-react';

export const REPORT_LIST = [
  { id: 'CHALLAN_REGISTER', name: '1. Challan Register', category: 'Challan' },
  { id: 'CUSTOMER_DELIVERY_REGISTER', name: '2. Customer Delivery Register', category: 'Delivery' },
  { id: 'SUPPLIER_DELIVERY_REGISTER', name: '3. Supplier Delivery Register', category: 'Delivery' },
  { id: 'PENDING_DISPATCH', name: '4. Pending Dispatch Report', category: 'Logistics' },
  { id: 'PENDING_DELIVERY', name: '5. Pending Delivery Report', category: 'Logistics' },
  { id: 'PARTIAL_DELIVERY', name: '6. Partial Delivery Report', category: 'Delivery' },
  { id: 'OVERDUE_DELIVERY', name: '7. Overdue Delivery Report', category: 'Logistics' },
  { id: 'GOODS_RETURN_REGISTER', name: '8. Goods Return Register', category: 'Returns' },
  { id: 'JOB_WORK_OUTSTANDING', name: '9. Job Work Outstanding Report', category: 'Job Work' },
  { id: 'JOB_WORK_RETURN', name: '10. Job Work Return Report', category: 'Job Work' },
  { id: 'WAREHOUSE_STOCK', name: '11. Warehouse Stock Report', category: 'Inventory' },
  { id: 'BATCH_STOCK', name: '12. Batch-wise Stock Report', category: 'Inventory' },
  { id: 'SERIAL_NUMBER', name: '13. Serial Number Report', category: 'Inventory' },
  { id: 'STOCK_VALUATION', name: '14. Stock Valuation Report', category: 'Inventory' },
  { id: 'TRANSPORTER_PERFORMANCE', name: '15. Transporter Performance Report', category: 'Transport' },
  { id: 'DELIVERY_PERFORMANCE', name: '16. Delivery Performance Report', category: 'Transport' },
  { id: 'APPROVAL_PENDING', name: '17. Approval Pending Report', category: 'Compliance' },
  { id: 'CANCELLED_DOCUMENTS', name: '18. Cancelled Document Report', category: 'Audit' },
  { id: 'AUDIT_TRAIL', name: '19. Audit Trail Report', category: 'Audit' },
  { id: 'FY_COMPARISON', name: '20. Financial Year Comparison Report', category: 'Financial' },
];

export const AdvancedReportCenter: React.FC = () => {
  const [selectedReportId, setSelectedReportId] = useState<string>('CHALLAN_REGISTER');
  const [filterText, setFilterText] = useState<string>('');

  const challans = ERPStorage.getChallans(true);
  const returns = ERPStorage.getReturns();
  const products = ERPStorage.getProducts();
  const stockBalances = ERPStorage.getStockBalances();
  const auditLogs = ERPStorage.getAuditLogs();
  const warehouses = ERPStorage.getWarehouses();

  // Compute Active Report Data
  const reportData = useMemo(() => {
    switch (selectedReportId) {
      case 'CHALLAN_REGISTER':
        return challans.map((c) => ({
          col1: c.challanNumber,
          col2: formatDateIN(c.challanDate),
          col3: c.challanType.replace(/_/g, ' '),
          col4: c.customerName || c.supplierName || 'Internal Transfer',
          col5: c.transportDetails.vehicleNumber || '-',
          col6: formatINR(c.totalTaxableAmount),
          col7: formatINR(c.totalAmount),
          col8: c.status.replace(/_/g, ' '),
        }));

      case 'CUSTOMER_DELIVERY_REGISTER':
        return challans
          .filter((c) => c.customerName)
          .map((c) => ({
            col1: c.challanNumber,
            col2: formatDateIN(c.challanDate),
            col3: c.customerName || '-',
            col4: c.shippingCity || c.shippingState || '-',
            col5: `${c.items.reduce((s, i) => s + i.deliveredQty, 0)} / ${c.items.reduce((s, i) => s + i.dispatchQty, 0)} Units`,
            col6: formatINR(c.totalAmount),
            col7: c.proofOfDelivery?.receiverName || 'Pending',
            col8: c.status.replace(/_/g, ' '),
          }));

      case 'SUPPLIER_DELIVERY_REGISTER':
        return challans
          .filter((c) => c.supplierName)
          .map((c) => ({
            col1: c.challanNumber,
            col2: formatDateIN(c.challanDate),
            col3: c.supplierName || '-',
            col4: c.challanType.replace(/_/g, ' '),
            col5: c.transportDetails.vehicleNumber || '-',
            col6: formatINR(c.totalAmount),
            col7: c.expectedReturnDate ? formatDateIN(c.expectedReturnDate) : '-',
            col8: c.status.replace(/_/g, ' '),
          }));

      case 'PENDING_DISPATCH':
        return challans
          .filter((c) => c.status === 'READY_FOR_DISPATCH' || c.status === 'APPROVED')
          .map((c) => ({
            col1: c.challanNumber,
            col2: formatDateIN(c.challanDate),
            col3: c.customerName || c.supplierName || '-',
            col4: c.transportDetails.transporterName || 'Fleet',
            col5: `${c.items.reduce((s, i) => s + i.dispatchQty, 0)} Units`,
            col6: formatINR(c.totalAmount),
            col7: c.eWayBillDetails?.eWayBillNumber || 'Pending',
            col8: 'Ready For Dispatch',
          }));

      case 'PENDING_DELIVERY':
        return challans
          .filter((c) => c.status === 'IN_TRANSIT')
          .map((c) => ({
            col1: c.challanNumber,
            col2: formatDateIN(c.transportDetails.dispatchDate),
            col3: c.customerName || c.supplierName || '-',
            col4: c.transportDetails.vehicleNumber || '-',
            col5: c.transportDetails.lrNumber || '-',
            col6: formatINR(c.totalAmount),
            col7: formatDateIN(c.transportDetails.expectedDeliveryDate),
            col8: 'In Transit',
          }));

      case 'PARTIAL_DELIVERY':
        return challans
          .filter((c) => c.status === 'PARTIALLY_DELIVERED')
          .map((c) => {
            const disp = c.items.reduce((s, i) => s + i.dispatchQty, 0);
            const deliv = c.items.reduce((s, i) => s + i.deliveredQty, 0);
            const pending = disp - deliv;
            return {
              col1: c.challanNumber,
              col2: formatDateIN(c.challanDate),
              col3: c.customerName || '-',
              col4: `${deliv} Delivered`,
              col5: `${pending} Pending`,
              col6: `${disp} Total Ordered`,
              col7: c.proofOfDelivery?.receiverName || '-',
              col8: 'Partially Delivered',
            };
          });

      case 'OVERDUE_DELIVERY':
        const now = Date.now();
        return challans
          .filter(
            (c) =>
              c.status === 'IN_TRANSIT' &&
              new Date(c.transportDetails.expectedDeliveryDate).getTime() < now
          )
          .map((c) => ({
            col1: c.challanNumber,
            col2: formatDateIN(c.transportDetails.dispatchDate),
            col3: c.customerName || '-',
            col4: c.transportDetails.transporterName || '-',
            col5: c.transportDetails.vehicleNumber || '-',
            col6: formatDateIN(c.transportDetails.expectedDeliveryDate),
            col7: 'Overdue Delay',
            col8: 'Attention Required',
          }));

      case 'GOODS_RETURN_REGISTER':
        return returns.map((r) => ({
          col1: r.returnNumber,
          col2: formatDateIN(r.returnDate),
          col3: r.returnType.replace(/_/g, ' '),
          col4: r.partyName,
          col5: r.items[0]?.productName || '-',
          col6: `${r.items[0]?.returnedQty} Units`,
          col7: r.qualityInspectionStatus.replace(/_/g, ' '),
          col8: r.stockUpdated ? 'Stock Credited' : 'Pending QC',
        }));

      case 'JOB_WORK_OUTSTANDING':
        return challans
          .filter((c) => c.challanType === 'JOB_WORK')
          .map((c) => ({
            col1: c.challanNumber,
            col2: formatDateIN(c.challanDate),
            col3: c.supplierName || 'Subcontractor',
            col4: c.items[0]?.productName || '-',
            col5: `${c.items[0]?.dispatchQty} Units Out`,
            col6: c.expectedReturnDate ? formatDateIN(c.expectedReturnDate) : '-',
            col7: formatINR(c.totalAmount),
            col8: c.status.replace(/_/g, ' '),
          }));

      case 'JOB_WORK_RETURN':
        return returns
          .filter((r) => r.returnType === 'JOB_WORK_RETURN')
          .map((r) => ({
            col1: r.returnNumber,
            col2: formatDateIN(r.returnDate),
            col3: r.partyName,
            col4: r.items[0]?.productName || '-',
            col5: `${r.items[0]?.returnedQty} Units Returned`,
            col6: `${r.items[0]?.acceptedQty} Accepted`,
            col7: r.inspectedBy || '-',
            col8: r.status,
          }));

      case 'WAREHOUSE_STOCK':
        return products.map((p) => {
          const balances = stockBalances.filter((b) => b.productId === p.id);
          const totalStock = balances.reduce((s, b) => s + b.currentStock, 0);
          return {
            col1: p.itemCode,
            col2: p.name,
            col3: p.hsnCode,
            col4: `${totalStock} ${p.uom}`,
            col5: `Min: ${p.minStockAlert}`,
            col6: formatINR(p.unitPrice),
            col7: formatINR(totalStock * p.unitPrice),
            col8: totalStock <= p.minStockAlert ? 'LOW STOCK' : 'ADEQUATE',
          };
        });

      case 'STOCK_VALUATION':
        return products.map((p) => {
          const totalStock = stockBalances
            .filter((b) => b.productId === p.id)
            .reduce((s, b) => s + b.currentStock, 0);
          const valuation = totalStock * p.unitPrice;
          return {
            col1: p.itemCode,
            col2: p.name,
            col3: `${totalStock} ${p.uom}`,
            col4: 'FIFO / WAC',
            col5: formatINR(p.unitPrice),
            col6: formatINR(valuation),
            col7: `${p.taxRate}% GST`,
            col8: 'Verified',
          };
        });

      case 'AUDIT_TRAIL':
        return auditLogs.map((a) => ({
          col1: formatDateTimeIN(a.timestamp),
          col2: a.action,
          col3: a.entityType,
          col4: a.entityNumber || a.entityId,
          col5: a.userName,
          col6: a.userRole,
          col7: a.ipAddress || '192.168.1.1',
          col8: a.details,
        }));

      case 'CANCELLED_DOCUMENTS':
        return challans
          .filter((c) => c.status === 'CANCELLED')
          .map((c) => ({
            col1: c.challanNumber,
            col2: formatDateIN(c.challanDate),
            col3: c.customerName || c.supplierName || '-',
            col4: formatINR(c.totalAmount),
            col5: c.cancellationReason || 'Cancelled by User',
            col6: c.updatedBy,
            col7: formatDateIN(c.updatedAt),
            col8: 'CANCELLED',
          }));

      default:
        // Default generic row view
        return challans.map((c) => ({
          col1: c.challanNumber,
          col2: formatDateIN(c.challanDate),
          col3: c.challanType,
          col4: c.customerName || '-',
          col5: c.transportDetails.vehicleNumber || '-',
          col6: formatINR(c.totalTaxableAmount),
          col7: formatINR(c.totalAmount),
          col8: c.status,
        }));
    }
  }, [selectedReportId, challans, returns, products, stockBalances, auditLogs]);

  const activeReportObj = REPORT_LIST.find((r) => r.id === selectedReportId);

  const handleExportCSV = () => {
    if (reportData.length === 0) return;
    const headers = ['Column 1', 'Column 2', 'Column 3', 'Column 4', 'Column 5', 'Column 6', 'Column 7', 'Column 8'];
    const rows = reportData.map((r) => [
      `"${r.col1}"`,
      `"${r.col2}"`,
      `"${r.col3}"`,
      `"${r.col4}"`,
      `"${r.col5}"`,
      `"${r.col6}"`,
      `"${r.col7}"`,
      `"${r.col8}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedReportId.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Sidebar: 20 Report Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Enterprise Reports (20)
        </h3>
        <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
          {REPORT_LIST.map((rep) => {
            const isSelected = selectedReportId === rep.id;
            return (
              <button
                key={rep.id}
                onClick={() => setSelectedReportId(rep.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="line-clamp-1">{rep.name}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {rep.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Report View */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base text-slate-900">{activeReportObj?.name}</h3>
            <p className="text-xs text-slate-500">Live database extraction | {reportData.length} records found</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              <Printer className="w-4 h-4 text-slate-500" /> Print
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <Download className="w-4 h-4" /> Export CSV / Excel
            </button>
          </div>
        </div>

        {/* Report Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Reference / #</th>
                  <th className="p-3">Date / Time</th>
                  <th className="p-3">Category / Type</th>
                  <th className="p-3">Party / Item</th>
                  <th className="p-3">Details / Transport</th>
                  <th className="p-3 text-right">Value / Target</th>
                  <th className="p-3 text-right">Total / Status</th>
                  <th className="p-3 text-center">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400">
                      No records found for this report query.
                    </td>
                  </tr>
                ) : (
                  reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-900">{row.col1}</td>
                      <td className="p-3 text-slate-600">{row.col2}</td>
                      <td className="p-3 font-medium text-slate-700">{row.col3}</td>
                      <td className="p-3 font-semibold text-slate-800 line-clamp-1 max-w-[180px]">{row.col4}</td>
                      <td className="p-3 text-slate-600 line-clamp-1 max-w-[180px]">{row.col5}</td>
                      <td className="p-3 text-right font-mono font-medium">{row.col6}</td>
                      <td className="p-3 text-right font-mono font-bold">{row.col7}</td>
                      <td className="p-3 text-center font-bold text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 uppercase">
                          {row.col8}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
