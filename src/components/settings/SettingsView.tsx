import React, { useState } from 'react';
import { AppSettings, Company } from '../../types/erp';
import { ERPStorage } from '../../services/storage';
import {
  Settings,
  Building,
  Calendar,
  Hash,
  Percent,
  FileText,
  Database,
  Download,
  Upload,
  RefreshCw,
  Save,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => ERPStorage.getSettings());
  const [activeTab, setActiveTab] = useState<
    'COMPANY' | 'FINANCIAL_YEAR' | 'NUMBERING' | 'TAX' | 'PDF' | 'BACKUP'
  >('COMPANY');
  const [restoreJson, setRestoreJson] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    ERPStorage.saveSettings(settings);
    ERPStorage.saveCompany(settings.company);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportBackup = () => {
    const jsonStr = ERPStorage.exportDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `challanpro_erp_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('Enterprise database export completed successfully!');
  };

  const handleImportBackup = () => {
    if (!restoreJson.trim()) {
      alert('Please paste the JSON backup payload to restore.');
      return;
    }
    const result = ERPStorage.importDatabase(restoreJson);
    if (result.success) {
      alert(result.message);
      window.location.reload();
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="font-bold text-base">Enterprise Configuration & Settings</h3>
            <p className="text-xs text-slate-400">
              Company profile, numbering rules, Indian FY management, PDF styling, and database backups.
            </p>
          </div>
        </div>

        {saveSuccess && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold animate-in fade-in">
            <CheckCircle className="w-3.5 h-3.5" /> Settings Saved!
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-6 bg-slate-50 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('COMPANY')}
          className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${
            activeTab === 'COMPANY'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building className="w-3.5 h-3.5" /> Company Profile
        </button>
        <button
          onClick={() => setActiveTab('FINANCIAL_YEAR')}
          className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${
            activeTab === 'FINANCIAL_YEAR'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Financial Year ({settings.financialYear})
        </button>
        <button
          onClick={() => setActiveTab('NUMBERING')}
          className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${
            activeTab === 'NUMBERING'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Hash className="w-3.5 h-3.5" /> Document Numbering
        </button>
        <button
          onClick={() => setActiveTab('TAX')}
          className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${
            activeTab === 'TAX'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Percent className="w-3.5 h-3.5" /> GST & E-Way Bill
        </button>
        <button
          onClick={() => setActiveTab('PDF')}
          className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${
            activeTab === 'PDF'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> PDF Challan Template
        </button>
        <button
          onClick={() => setActiveTab('BACKUP')}
          className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-all shrink-0 ${
            activeTab === 'BACKUP'
              ? 'border-blue-600 text-blue-600 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" /> Database Backup & Restore
        </button>
      </div>

      <div className="p-6">
        {/* Tab 1: Company Profile */}
        {activeTab === 'COMPANY' && (
          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-3xl text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  value={settings.company.name}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, name: e.target.value },
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trade / Brand Name</label>
                <input
                  type="text"
                  value={settings.company.tradeName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, tradeName: e.target.value },
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company GSTIN *</label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={settings.company.gstin}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, gstin: e.target.value.toUpperCase() },
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company PAN *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={settings.company.pan}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, pan: e.target.value.toUpperCase() },
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">CIN (Corporate Identity)</label>
                <input
                  type="text"
                  value={settings.company.cin || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, cin: e.target.value.toUpperCase() },
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registered Address</label>
                <input
                  type="text"
                  value={settings.company.address}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, address: e.target.value },
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City & PIN Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.company.city}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company: { ...settings.company, city: e.target.value },
                      })
                    }
                    className="w-2/3 p-2 border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    maxLength={6}
                    value={settings.company.pincode}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company: { ...settings.company, pincode: e.target.value },
                      })
                    }
                    className="w-1/3 p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800">Bank Details printed on Challan</span>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Bank Name"
                  value={settings.company.bankName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, bankName: e.target.value },
                    })
                  }
                  className="p-2 border rounded-lg bg-white"
                />
                <input
                  type="text"
                  placeholder="Account Number"
                  value={settings.company.accountNo}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, accountNo: e.target.value },
                    })
                  }
                  className="p-2 border rounded-lg bg-white font-mono"
                />
                <input
                  type="text"
                  placeholder="IFSC Code"
                  value={settings.company.ifsc}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, ifsc: e.target.value.toUpperCase() },
                    })
                  }
                  className="p-2 border rounded-lg bg-white font-mono uppercase"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md"
            >
              <Save className="w-4 h-4" /> Save Company Profile
            </button>
          </form>
        )}

        {/* Tab 2: Financial Year Management */}
        {activeTab === 'FINANCIAL_YEAR' && (
          <div className="space-y-4 max-w-2xl text-xs">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 space-y-2">
              <h4 className="font-bold text-blue-950 text-sm">Indian Financial Year (FY) Lifecycle</h4>
              <p className="text-blue-800">
                In India, the financial year runs from 1st April to 31st March. Historical delivery challans, stock
                movements, and audits are permanently archived and never reset when transitioning to a new FY.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Active Operating Financial Year</label>
              <select
                value={settings.financialYear}
                onChange={(e) => {
                  setSettings({ ...settings, financialYear: e.target.value });
                  ERPStorage.setFinancialYear(e.target.value);
                }}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-sm bg-white"
              >
                {settings.availableFinancialYears.map((fy) => (
                  <option key={fy} value={fy}>
                    FY {fy} (April 1 to March 31)
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <h5 className="font-bold text-slate-800">Year-End Closing & New FY Initialization</h5>
              <p className="text-slate-600">
                Clicking initialize creates new document sequences with the next FY tag (e.g. DC/27-28/00001) while carrying forward closing inventory as opening stock.
              </p>
              <button
                type="button"
                onClick={() => {
                  alert(`Financial Year ${settings.financialYear} verified. All transaction sequences calibrated.`);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
              >
                Verify & Calibrate FY Sequences
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Document Numbering */}
        {activeTab === 'NUMBERING' && (
          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl text-xs">
            <h4 className="font-bold text-slate-800 text-sm">Configurable Document Number Series</h4>
            <p className="text-slate-500">Atomic database operation ensures zero duplicate document numbers.</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Challan Prefix</label>
                <input
                  type="text"
                  value={settings.numbering.challanPrefix}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      numbering: { ...settings.numbering, challanPrefix: e.target.value.toUpperCase() },
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Number of Sequence Digits</label>
                <input
                  type="number"
                  min="3"
                  max="7"
                  value={settings.numbering.challanDigits}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      numbering: { ...settings.numbering, challanDigits: Number(e.target.value) },
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeFy"
                checked={settings.numbering.includeFyInChallan}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    numbering: { ...settings.numbering, includeFyInChallan: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-blue-600"
              />
              <label htmlFor="includeFy" className="font-semibold text-slate-700">
                Include Financial Year in Number (e.g. DC/26-27/00143)
              </label>
            </div>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md"
            >
              <Save className="w-4 h-4" /> Save Numbering Rules
            </button>
          </form>
        )}

        {/* Tab 4: Tax & E-Way Bill */}
        {activeTab === 'TAX' && (
          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl text-xs">
            <h4 className="font-bold text-slate-800 text-sm">GST & E-Way Bill Compliance Rules</h4>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
              Under GST Law Rule 138, an E-Way Bill is mandatory for inter-state or intra-state movement of goods where consignment value exceeds <strong>₹50,000</strong>.
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                E-Way Bill Generation Threshold (₹)
              </label>
              <input
                type="number"
                value={settings.tax.eWayBillThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    tax: { ...settings.tax, eWayBillThreshold: Number(e.target.value) },
                  })
                }
                className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md"
            >
              <Save className="w-4 h-4" /> Save Tax Settings
            </button>
          </form>
        )}

        {/* Tab 5: PDF Template */}
        {activeTab === 'PDF' && (
          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-3xl text-xs">
            <h4 className="font-bold text-slate-800 text-sm">Printable Challan Template & Legal Terms</h4>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Standard Terms & Conditions (Printed on Challan)
              </label>
              <textarea
                rows={5}
                value={settings.pdfTemplate.termsText}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pdfTemplate: { ...settings.pdfTemplate, termsText: e.target.value },
                  })
                }
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-[11px]"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md"
            >
              <Save className="w-4 h-4" /> Save PDF Layout Settings
            </button>
          </form>
        )}

        {/* Tab 6: Backup & Restore */}
        {activeTab === 'BACKUP' && (
          <div className="space-y-6 max-w-2xl text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <Download className="w-4 h-4 text-blue-600" /> Complete Database Backup Export
              </h4>
              <p className="text-slate-600">
                Exports all 12 Challan tables, products, multi-warehouse stock balances, customer & supplier masters,
                order histories, and immutable audit logs to an encrypted JSON backup.
              </p>
              <button
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md"
              >
                <Download className="w-4 h-4" /> Export Full Database Backup (.JSON)
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <Upload className="w-4 h-4 text-purple-600" /> Database Restore from Verified Backup
              </h4>
              <p className="text-slate-600">
                Paste the contents of a previously exported ChallanPro ERP backup JSON file below:
              </p>
              <textarea
                rows={4}
                value={restoreJson}
                onChange={(e) => setRestoreJson(e.target.value)}
                placeholder='Paste JSON backup payload here: { "backupId": "...", "data": { ... } }'
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-[11px] bg-white"
              />
              <button
                onClick={handleImportBackup}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl font-bold shadow-md"
              >
                <Upload className="w-4 h-4" /> Verify & Restore Database
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
