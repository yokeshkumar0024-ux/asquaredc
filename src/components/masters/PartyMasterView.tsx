import React, { useState } from 'react';
import { Customer, Supplier } from '../../types/erp';
import { ERPStorage } from '../../services/storage';
import { formatINR, formatDateIN } from '../../services/gstCalculator';
import {
  Users,
  Briefcase,
  Plus,
  Building,
  Phone,
  Mail,
  CreditCard,
  History,
  CheckCircle,
} from 'lucide-react';

export const PartyMasterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'SUPPLIERS'>('CUSTOMERS');
  const [customers, setCustomers] = useState<Customer[]>(() => ERPStorage.getCustomers());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => ERPStorage.getSuppliers());
  const [selectedSupplierHistory, setSelectedSupplierHistory] = useState<Supplier | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states for new supplier/customer
  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [stateCode, setStateCode] = useState('27');
  const [pincode, setPincode] = useState('400001');

  // Supplier Bank Details
  const [bankName, setBankName] = useState('State Bank of India');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');

  const challans = ERPStorage.getChallans();
  const returns = ERPStorage.getReturns();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const compId = ERPStorage.getActiveCompanyId();

    if (activeTab === 'CUSTOMERS') {
      const newCust: Customer = {
        id: `cust_${Date.now()}`,
        companyId: compId,
        customerCode: `CUST-${Date.now().toString().slice(-4)}`,
        name,
        gstin,
        pan,
        contactPerson,
        phone,
        email,
        billingAddress: address,
        billingCity: city,
        billingState: state,
        billingStateCode: stateCode,
        billingPincode: pincode,
        shippingAddresses: [
          {
            id: `ship_${Date.now()}`,
            title: 'Primary Works / Site',
            address,
            city,
            state,
            stateCode,
            pincode,
            isDefault: true,
          },
        ],
        paymentTerms,
        creditLimit: 2500000,
        isActive: true,
      };
      ERPStorage.saveCustomer(newCust);
      setCustomers(ERPStorage.getCustomers());
      alert(`Customer ${newCust.name} added to master directory!`);
    } else {
      const newSupp: Supplier = {
        id: `supp_${Date.now()}`,
        companyId: compId,
        supplierCode: `SUPP-${Date.now().toString().slice(-4)}`,
        name,
        gstin,
        pan,
        contactPerson,
        phone,
        email,
        address,
        city,
        state,
        stateCode,
        pincode,
        bankName,
        accountNo,
        ifsc,
        branch: city,
        paymentTerms,
        isActive: true,
      };
      ERPStorage.saveSupplier(newSupp);
      setSuppliers(ERPStorage.getSuppliers());
      alert(`Supplier ${newSupp.name} registered with GSTIN & Bank details!`);
    }

    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'CUSTOMERS' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" /> Customers Directory ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'SUPPLIERS' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Suppliers & Job Workers ({suppliers.length})
          </button>
        </div>

        <button
          onClick={() => {
            setName('');
            setGstin('');
            setPan('');
            setAccountNo('');
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> Add New {activeTab === 'CUSTOMERS' ? 'Customer' : 'Supplier'}
        </button>
      </div>

      {/* Grid of Cards */}
      {activeTab === 'CUSTOMERS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">
                    {c.customerCode}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 mt-1 line-clamp-1">{c.name}</h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Active
                </span>
              </div>

              <div className="space-y-1 text-slate-600">
                <div className="font-mono font-semibold text-slate-800">GSTIN: {c.gstin}</div>
                <div>{c.contactPerson}</div>
                <div className="flex items-center gap-1 text-slate-500">
                  <Phone className="w-3 h-3" /> {c.phone}
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <Mail className="w-3 h-3" /> {c.email}
                </div>
                <div className="text-slate-500 pt-1 border-t border-slate-100 line-clamp-2">
                  {c.billingAddress}, {c.billingCity} ({c.billingState})
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Credit Limit:</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(c.creditLimit)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                    {s.supplierCode}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 mt-1 line-clamp-1">{s.name}</h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Verified
                </span>
              </div>

              <div className="space-y-1 text-slate-600">
                <div className="font-mono font-semibold text-slate-800">GSTIN: {s.gstin}</div>
                <div>Contact: {s.contactPerson} ({s.phone})</div>
                <div className="text-slate-500">{s.address}, {s.city} ({s.state})</div>
              </div>

              {/* Bank Details Box */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] space-y-0.5 font-mono">
                <div className="text-slate-500 font-sans font-bold text-[10px] uppercase">Bank Account</div>
                <div className="font-bold text-slate-800">{s.bankName}</div>
                <div>A/C: {s.accountNo}</div>
                <div>IFSC: {s.ifsc}</div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500">{s.paymentTerms}</span>
                <button
                  onClick={() => setSelectedSupplierHistory(s)}
                  className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  <History className="w-3.5 h-3.5" /> View Ledger History
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Supplier Transaction History Modal */}
      {selectedSupplierHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Transaction & Job Work History: {selectedSupplierHistory.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">GSTIN: {selectedSupplierHistory.gstin}</p>
              </div>
              <button
                onClick={() => setSelectedSupplierHistory(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase">Related Job Work & Supply Challans</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                {challans.filter((c) => c.supplierId === selectedSupplierHistory.id).length === 0 ? (
                  <p className="p-4 text-center text-slate-400">No challans recorded against this supplier yet.</p>
                ) : (
                  challans
                    .filter((c) => c.supplierId === selectedSupplierHistory.id)
                    .map((c) => (
                      <div key={c.id} className="p-3 border-b flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <span className="font-mono font-bold text-blue-900">{c.challanNumber}</span>
                          <span className="text-slate-500 ml-2">{formatDateIN(c.challanDate)}</span>
                          <div className="text-[11px] text-slate-600">{c.challanPurpose}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900">{formatINR(c.totalAmount)}</div>
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">{c.status}</span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSupplierHistory(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Master Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <h3 className="font-bold text-base text-slate-900">
              Add New {activeTab === 'CUSTOMERS' ? 'Customer' : 'Supplier'} Master
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Legal Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Larsen & Toubro Engineering"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN *</label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="27AABCT1234F1Z5"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PAN Number *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="AABCT1234F"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Name"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98200 12345"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="procurement@company.com"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registered Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot No., MIDC / Industrial Area"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State Code</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono text-center"
                  />
                </div>
              </div>

              {activeTab === 'SUPPLIERS' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800">Supplier Bank Details for Remittance</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Bank Name"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="p-1.5 border rounded bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      className="p-1.5 border rounded bg-white font-mono"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="IFSC Code (e.g. SBIN0001234)"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    className="w-full p-1.5 border rounded bg-white font-mono uppercase"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                >
                  Save Master Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
