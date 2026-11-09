import React, { useState, useEffect } from 'react';
import { ERPStorage } from './services/storage';
import { DeliveryChallan } from './types/erp';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { AdvancedDashboard } from './components/dashboard/AdvancedDashboard';
import { ChallanList } from './components/challans/ChallanList';
import { ChallanForm } from './components/challans/ChallanForm';
import { ChallanDetailModal } from './components/challans/ChallanDetailModal';
import { ChallanPrintView } from './components/challans/ChallanPrintView';
import { ChallanVerificationModal } from './components/common/BarcodeAndQR';
import { ProofOfDeliveryModal } from './components/delivery/ProofOfDeliveryModal';
import { WarehouseInventoryView } from './components/inventory/WarehouseInventoryView';
import { ReturnManagementView } from './components/returns/ReturnManagementView';
import { AdvancedReportCenter } from './components/reports/AdvancedReportCenter';
import { SettingsView } from './components/settings/SettingsView';
import { SystemAuditChecklistModal } from './components/audit/SystemAuditChecklistModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('DASHBOARD');
  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => ERPStorage.getActiveCompanyId());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals
  const [challanFormOpen, setChallanFormOpen] = useState(false);
  const [editingChallan, setEditingChallan] = useState<DeliveryChallan | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<DeliveryChallan | null>(null);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [podModalOpen, setPodModalOpen] = useState(false);
  const [verifyQRModalOpen, setVerifyQRModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  // Check URL query parameters for direct QR scan verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verify');
    if (verifyToken) {
      const challans = ERPStorage.getChallans(true);
      const match = challans.find((c) => c.qrVerificationToken === verifyToken);
      if (match) {
        setSelectedChallan(match);
        setVerifyQRModalOpen(true);
      }
    }
  }, []);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleCompanyChange = (compId: string) => {
    ERPStorage.setActiveCompanyId(compId);
    setActiveCompanyId(compId);
    triggerRefresh();
  };

  const handleOpenNewChallan = () => {
    setEditingChallan(null);
    setChallanFormOpen(true);
  };

  const handleEditChallan = (challan: DeliveryChallan) => {
    setEditingChallan(challan);
    setDetailModalOpen(false);
    setChallanFormOpen(true);
  };

  const handleViewChallan = (challan: DeliveryChallan) => {
    setSelectedChallan(challan);
    setDetailModalOpen(true);
  };

  const handlePrintChallan = (challan: DeliveryChallan) => {
    setSelectedChallan(challan);
    setPrintModalOpen(true);
  };

  const handleOpenPOD = (challan: DeliveryChallan) => {
    setSelectedChallan(challan);
    setPodModalOpen(true);
  };

  const handleVerifyQR = (challan: DeliveryChallan) => {
    setSelectedChallan(challan);
    setVerifyQRModalOpen(true);
  };

  const companies = ERPStorage.getCompanies();
  const challans = ERPStorage.getChallans();
  const notifications = ERPStorage.getNotifications();
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const currentCompany = ERPStorage.getCompany();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Header
        companies={companies}
        activeCompanyId={activeCompanyId}
        onCompanyChange={handleCompanyChange}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setNotificationDrawerOpen(true)}
        onOpenAudit={() => setAuditModalOpen(true)}
        onGlobalSearch={(term) => {
          if (term.trim()) {
            setActiveTab('CHALLANS');
          }
        }}
      />

      {/* Main Body Layout */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAudit={() => setAuditModalOpen(true)}
        />

        {/* Content Area */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {challanFormOpen ? (
            <ChallanForm
              initialChallan={editingChallan}
              onSave={(saved) => {
                setChallanFormOpen(false);
                triggerRefresh();
                setSelectedChallan(saved);
                setPrintModalOpen(true); // Offer print preview immediately!
              }}
              onCancel={() => setChallanFormOpen(false)}
            />
          ) : (
            <>
              {activeTab === 'DASHBOARD' && (
                <AdvancedDashboard
                  onNewChallan={handleOpenNewChallan}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onViewChallan={handleViewChallan}
                />
              )}

              {activeTab === 'CHALLANS' && (
                <ChallanList
                  challans={challans}
                  onNewChallan={handleOpenNewChallan}
                  onViewChallan={handleViewChallan}
                  onPrintChallan={handlePrintChallan}
                  onOpenPOD={handleOpenPOD}
                  onVerifyQR={handleVerifyQR}
                />
              )}

              {activeTab === 'INVENTORY' && <WarehouseInventoryView />}

              {activeTab === 'RETURNS' && <ReturnManagementView />}

              {activeTab === 'REPORTS' && <AdvancedReportCenter />}

              {activeTab === 'SETTINGS' && <SettingsView />}
            </>
          )}
        </main>
      </div>

      {/* Modals & Overlays */}
      {detailModalOpen && selectedChallan && (
        <ChallanDetailModal
          challan={selectedChallan}
          onClose={() => setDetailModalOpen(false)}
          onEdit={handleEditChallan}
          onPrint={handlePrintChallan}
          onOpenPOD={handleOpenPOD}
          onVerifyQR={handleVerifyQR}
          onRefresh={triggerRefresh}
        />
      )}

      {printModalOpen && selectedChallan && (
        <ChallanPrintView
          challan={selectedChallan}
          company={currentCompany}
          onClose={() => setPrintModalOpen(false)}
        />
      )}

      {podModalOpen && selectedChallan && (
        <ProofOfDeliveryModal
          challan={selectedChallan}
          onClose={() => setPodModalOpen(false)}
          onSuccess={() => {
            triggerRefresh();
            // Refresh selected challan
            const updated = ERPStorage.getChallanById(selectedChallan.id);
            if (updated) setSelectedChallan(updated);
          }}
        />
      )}

      {verifyQRModalOpen && selectedChallan && (
        <ChallanVerificationModal
          challan={selectedChallan}
          onClose={() => setVerifyQRModalOpen(false)}
        />
      )}

      {auditModalOpen && (
        <SystemAuditChecklistModal onClose={() => setAuditModalOpen(false)} />
      )}

      <NotificationDrawer
        notifications={notifications}
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        onRefresh={triggerRefresh}
      />
    </div>
  );
}
