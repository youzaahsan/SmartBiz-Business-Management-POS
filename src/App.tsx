import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { SmartCalculator } from './components/calculator/SmartCalculator';
import { QuickSale } from './components/pos/QuickSale';
import { InvoiceList } from './components/pos/InvoiceList';
import { CustomerList } from './components/customers/CustomerList';
import { ProductList } from './components/products/ProductList';
import { InventoryOverview } from './components/inventory/InventoryOverview';
import { SupplierList } from './components/suppliers/SupplierList';
import { PurchaseList } from './components/purchases/PurchaseList';
import { ReturnsManager } from './components/returns/ReturnsManager';
import { ExpenseList } from './components/expenses/ExpenseList';
import { ProfitReports } from './components/reports/ProfitReports';
import { SettingsManager } from './components/settings/SettingsManager';

function AppContent() {
  const { currentBusiness } = useAuth();
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showQuickCalcModal, setShowQuickCalcModal] = useState<boolean>(false);

  // Transfer items from calculator to POS cart
  const [convertedItemsFromCalc, setConvertedItemsFromCalc] = useState<
    { name: string; quantity: number; price: number; total: number }[]
  >([]);

  const handleConvertToBill = (
    items: { name: string; quantity: number; price: number; total: number }[]
  ) => {
    setConvertedItemsFromCalc(items);
    setActiveView('pos');
    setShowQuickCalcModal(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-warm-sand text-[#2B2520] font-sans">
      {/* Sidebar for desktop & tablet */}
      <Sidebar
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          setMobileMenuOpen(false);
        }}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main App Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onNavigate={(view) => setActiveView(view)}
          onOpenCalculator={() => setShowQuickCalcModal(true)}
          onToggleSidebar={() => setMobileMenuOpen((prev) => !prev)}
        />

        {/* View Content Area with subtle page transition */}
        <main key={activeView} className="flex-1 overflow-y-auto pb-16 md:pb-0 anim-fade-in">
          {activeView === 'dashboard' && (
            <ExecutiveDashboard onNavigate={(view) => setActiveView(view)} />
          )}

          {activeView === 'calculator' && (
            <div className="max-w-6xl mx-auto py-2">
              <SmartCalculator
                onConvertToBill={handleConvertToBill}
                onNavigate={(view) => setActiveView(view)}
              />
            </div>
          )}

          {activeView === 'pos' && (
            <QuickSale
              initialCartItems={convertedItemsFromCalc}
              onClearInitialItems={() => setConvertedItemsFromCalc([])}
            />
          )}

          {activeView === 'invoices' && (
            <InvoiceList onNavigateToReturns={() => setActiveView('returns')} />
          )}

          {activeView === 'customers' && <CustomerList />}

          {activeView === 'products' && (
            <ProductList onNavigateToStockIn={() => setActiveView('purchases')} />
          )}

          {activeView === 'inventory' && (
            <InventoryOverview onNavigateToPurchases={() => setActiveView('purchases')} />
          )}

          {activeView === 'suppliers' && (
            <SupplierList onNavigateToPurchases={() => setActiveView('purchases')} />
          )}

          {activeView === 'purchases' && <PurchaseList />}

          {activeView === 'returns' && <ReturnsManager />}

          {activeView === 'expenses' && <ExpenseList />}

          {activeView === 'reports' && <ProfitReports />}

          {activeView === 'settings' && <SettingsManager />}
        </main>

        {/* Bottom Navigation for Mobile */}
        <BottomNav
          activeView={activeView}
          onNavigate={(view) => setActiveView(view)}
          onOpenMenu={() => setMobileMenuOpen(true)}
        />
      </div>

      {/* Quick Floating Calculator Modal */}
      {showQuickCalcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95">
            <SmartCalculator
              isModal={true}
              onClose={() => setShowQuickCalcModal(false)}
              onConvertToBill={handleConvertToBill}
              onNavigate={(view) => {
                setActiveView(view);
                setShowQuickCalcModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
