import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storage';
import { Business, StaffUser, UserRole, HardwareSettings } from '../../types';
import {
  Settings,
  Store,
  Users,
  Printer,
  Database,
  Save,
  CheckCircle,
  Plus,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  Volume2,
} from 'lucide-react';

export const SettingsManager: React.FC = () => {
  const {
    currentBusiness,
    allBusinesses,
    currentUser,
    switchBusiness,
    updateBusinessProfile,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'store' | 'branches' | 'staff' | 'hardware' | 'backup'>('store');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Business profile form
  const [storeName, setStoreName] = useState(currentBusiness.name);
  const [storePhone, setStorePhone] = useState(currentBusiness.phone || '');
  const [storeAddress, setStoreAddress] = useState(currentBusiness.address || '');
  const [storeCurrency, setStoreCurrency] = useState(currentBusiness.currency);
  const [storeCurrencySymbol, setStoreCurrencySymbol] = useState(currentBusiness.currencySymbol);
  const [storeTaxRate, setStoreTaxRate] = useState(String(currentBusiness.defaultTaxRate));
  const [storeTaxNumber, setStoreTaxNumber] = useState(currentBusiness.taxNumber || '');
  const [storeFooter, setStoreFooter] = useState(currentBusiness.invoiceFooterNote || '');
  const [storePaymentId, setStorePaymentId] = useState(currentBusiness.paymentIdentifier || '');
  const [storePaymentLabel, setStorePaymentLabel] = useState(currentBusiness.paymentIdentifierLabel || 'Scan QR / Bank Transfer');

  // Branch creation form
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');

  // Staff members list
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('CASHIER');
  const [staffPin, setStaffPin] = useState('');

  // Hardware settings
  const [hardware, setHardware] = useState<HardwareSettings>({
    printerType: 'thermal_80mm',
    autoPrintOnSale: true,
    openCashDrawer: false,
    barcodeScannerEnabled: true,
    barcodeScanPrefix: '',
    barcodeScanSuffix: 'Enter',
    soundFeedback: true,
  });

  const isSuperAdmin = currentUser.role === 'ADMIN';

  useEffect(() => {
    setStoreName(currentBusiness.name);
    setStorePhone(currentBusiness.phone || '');
    setStoreAddress(currentBusiness.address || '');
    setStoreCurrency(currentBusiness.currency);
    setStoreCurrencySymbol(currentBusiness.currencySymbol);
    setStoreTaxRate(String(currentBusiness.defaultTaxRate));
    setStoreTaxNumber(currentBusiness.taxNumber || '');
    setStoreFooter(currentBusiness.invoiceFooterNote || '');
    setStorePaymentId(currentBusiness.paymentIdentifier || '');
    setStorePaymentLabel(currentBusiness.paymentIdentifierLabel || 'Scan QR / Bank Transfer');

    const users = StorageService.getStaff(currentBusiness.id);
    setStaffList(users);

    const hw = StorageService.getHardwareSettings();
    setHardware(hw);
  }, [currentBusiness]);

  const handleSaveStoreProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    updateBusinessProfile({
      ...currentBusiness,
      name: storeName.trim(),
      phone: storePhone.trim() || currentBusiness.phone,
      address: storeAddress.trim() || currentBusiness.address,
      currency: storeCurrency.trim(),
      currencySymbol: storeCurrencySymbol.trim(),
      defaultTaxRate: parseFloat(storeTaxRate) || 0,
      taxNumber: storeTaxNumber.trim() || undefined,
      invoiceFooterNote: storeFooter.trim() || currentBusiness.invoiceFooterNote,
      paymentIdentifier: storePaymentId.trim() || undefined,
      paymentIdentifierLabel: storePaymentLabel.trim() || undefined,
    });

    setSuccessMessage('Store profile updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    const newBiz: Business = {
      id: `biz_${Date.now()}`,
      name: newBranchName.trim(),
      ownerName: currentBusiness.ownerName,
      address: newBranchAddress.trim() || 'Central Branch',
      phone: newBranchPhone.trim() || currentBusiness.phone,
      email: currentBusiness.email,
      currency: currentBusiness.currency,
      currencySymbol: currentBusiness.currencySymbol,
      defaultTaxRate: currentBusiness.defaultTaxRate,
      defaultDiscountRate: 0,
      invoicePrefix: `SB${allBusinesses.length + 1}-`,
      invoiceCounter: 1001,
      invoiceFooterNote: 'Thank you for your business!',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageService.saveBusiness(newBiz);

    setNewBranchName('');
    setNewBranchAddress('');
    setNewBranchPhone('');
    setSuccessMessage('New branch created successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleAddStaffMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim()) return;

    const now = new Date().toISOString();
    const newStaff: StaffUser = {
      id: `usr_${Date.now()}`,
      businessId: currentBusiness.id,
      name: staffName.trim(),
      email: staffEmail.trim(),
      phone: staffPhone.trim() || undefined,
      role: staffRole,
      pin: staffPin.trim() || '1234',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    StorageService.saveStaffUser(newStaff);
    setStaffList(StorageService.getStaff(currentBusiness.id));
    setShowAddStaff(false);
    setStaffName('');
    setStaffEmail('');
    setStaffPhone('');
    setStaffPin('');
    setSuccessMessage(`Staff member "${newStaff.name}" added as ${newStaff.role}`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleToggleStaffActive = (user: StaffUser) => {
    if (user.id === currentUser.id) {
      alert('You cannot deactivate your own account.');
      return;
    }
    const updated = { ...user, isActive: !user.isActive };
    StorageService.saveStaffUser(updated);
    setStaffList(StorageService.getStaff(currentBusiness.id));
  };

  const handleSaveHardware = (updated: HardwareSettings) => {
    setHardware(updated);
    StorageService.saveHardwareSettings(updated);
    setSuccessMessage('Hardware settings saved!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = StorageService.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SMARTBIZ_Backup_${currentBusiness.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    link.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const res = StorageService.importFullBackup(content);
        if (res.success) {
          alert('Backup restored successfully! The application will reload.');
          window.location.reload();
        } else {
          setErrorMessage(res.error || 'Failed to restore backup');
        }
      } catch (err) {
        setErrorMessage('Failed to read backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemoData = () => {
    if (
      confirm(
        'Warning: This will reset all current demo data to original sample store state. Continue?'
      )
    ) {
      StorageService.resetToDefault();
      window.location.reload();
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Store Settings &amp; Administration</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure branding, branches, thermal receipt printer, staff roles, and backups
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('store')}
          className={`flex items-center gap-2 border-b-2 py-2 px-4 font-bold whitespace-nowrap transition ${
            activeTab === 'store'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Store Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className={`flex items-center gap-2 border-b-2 py-2 px-4 font-bold whitespace-nowrap transition ${
            activeTab === 'branches'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Branches ({allBusinesses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 border-b-2 py-2 px-4 font-bold whitespace-nowrap transition ${
            activeTab === 'staff'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Staff &amp; Roles</span>
        </button>

        <button
          onClick={() => setActiveTab('hardware')}
          className={`flex items-center gap-2 border-b-2 py-2 px-4 font-bold whitespace-nowrap transition ${
            activeTab === 'hardware'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Printer className="h-4 w-4" />
          <span>Hardware &amp; Thermal Printer</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 border-b-2 py-2 px-4 font-bold whitespace-nowrap transition ${
            activeTab === 'backup'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Backup &amp; Restore</span>
        </button>
      </div>

      {/* Tab: Store Profile */}
      {activeTab === 'store' && (
        <div className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={handleSaveStoreProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Store / Business Name *:
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone:
                </label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tax / NTN / GST Reg #:
                </label>
                <input
                  type="text"
                  placeholder="e.g. NTN 1234567-8"
                  value={storeTaxNumber}
                  onChange={(e) => setStoreTaxNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Store Address:
              </label>
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Currency Symbol:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rs. or $ or €"
                  value={storeCurrencySymbol}
                  onChange={(e) => setStoreCurrencySymbol(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Currency Code:
                </label>
                <input
                  type="text"
                  required
                  placeholder="PKR, USD, etc."
                  value={storeCurrency}
                  onChange={(e) => setStoreCurrency(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Default Tax Rate (%):
                </label>
                <input
                  type="number"
                  min={0}
                  value={storeTaxRate}
                  onChange={(e) => setStoreTaxRate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* QR Payment Configuration */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 dark:border-indigo-900 dark:bg-indigo-950/30 space-y-2">
              <div className="font-bold text-indigo-900 dark:text-indigo-300">
                Payment QR Code &amp; UPI / Mobile Wallet
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-0.5 text-[10px]">
                    UPI / Account ID / Phone Number:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 03001234567@bank or business@upi"
                    value={storePaymentId}
                    onChange={(e) => setStorePaymentId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-0.5 text-[10px]">
                    Display Label:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. JazzCash / Easypaisa / Raast"
                    value={storePaymentLabel}
                    onChange={(e) => setStorePaymentLabel(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Receipt Footer Greeting Note:
              </label>
              <input
                type="text"
                placeholder="Thank you for shopping with us! Returns accepted within 7 days."
                value={storeFooter}
                onChange={(e) => setStoreFooter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-98"
              >
                <Save className="h-4 w-4" />
                <span>Save Store Profile</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Multi-Branch */}
      {activeTab === 'branches' && (
        <div className="space-y-4 max-w-3xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Active Branches &amp; Outlets
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Switch between branches or provision new retail outlets with distinct inventory.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allBusinesses.map((b) => (
                <div
                  key={b.id}
                  className={`rounded-2xl border p-4 text-xs transition ${
                    b.id === currentBusiness.id
                      ? 'border-indigo-600 bg-indigo-50/60 dark:border-indigo-500 dark:bg-indigo-950/40'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{b.name}</span>
                    {b.id === currentBusiness.id && (
                      <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        Active Branch
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 text-[11px] mb-3">
                    {b.address || 'Central Headquarters'} &bull; {b.phone || 'No phone'}
                  </div>

                  {b.id !== currentBusiness.id && (
                    <button
                      onClick={() => switchBusiness(b.id)}
                      className="rounded-xl border border-indigo-600 bg-white px-3 py-1.5 font-bold text-indigo-600 hover:bg-indigo-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                    >
                      Switch to this Branch
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Create Branch */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3">
              Create New Branch Outlet
            </h3>

            <form onSubmit={handleCreateBranch} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Branch Name *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SMARTBIZ — DHA Phase 5 Branch"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Branch Address:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Commercial Area Phase 5"
                    value={newBranchAddress}
                    onChange={(e) => setNewBranchAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 03215551234"
                    value={newBranchPhone}
                    onChange={(e) => setNewBranchPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Provision Branch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Staff & Roles */}
      {activeTab === 'staff' && (
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Store Team Members</h3>
              <p className="text-xs text-slate-500">Manage cashier, manager, and administrator permissions</p>
            </div>

            <button
              onClick={() => setShowAddStaff(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Staff Member</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Email / ID</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {staffList.map((st) => (
                  <tr key={st.id}>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{st.name}</td>
                    <td className="py-3 px-4">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        st.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : st.role === 'MANAGER'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {st.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{st.email}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        st.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {st.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStaffActive(st)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 underline"
                      >
                        {st.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Staff Modal */}
          {showAddStaff && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in">
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3">Add Staff Member</h3>
                <form onSubmit={handleAddStaffMember} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Full Name *:</label>
                    <input
                      type="text"
                      required
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="e.g. Usman Ali"
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Email / Username *:</label>
                    <input
                      type="email"
                      required
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="e.g. usman@store.com"
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Role *:</label>
                      <select
                        value={staffRole}
                        onChange={(e) => setStaffRole(e.target.value as UserRole)}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="CASHIER">Cashier</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Quick POS PIN:</label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="1234"
                        value={staffPin}
                        onChange={(e) => setStaffPin(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAddStaff(false)}
                      className="flex-1 rounded-xl border border-slate-200 py-2 font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-700"
                    >
                      Save Staff
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Hardware & Thermal Printer */}
      {activeTab === 'hardware' && (
        <div className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              POS Hardware &amp; Thermal Printer Configuration
            </h3>
            <p className="text-slate-500">Settings for 58mm (2-inch) and 80mm (3-inch) thermal ESC/POS receipt printers</p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Receipt Paper Format:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveHardware({ ...hardware, printerType: 'thermal_58mm' })}
                  className={`rounded-2xl border p-3 text-left transition ${
                    hardware.printerType === 'thermal_58mm'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800'
                  }`}
                >
                  <div className="text-sm font-bold">58mm (2-Inch)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Compact mobile/desktop thermal receipt</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveHardware({ ...hardware, printerType: 'thermal_80mm' })}
                  className={`rounded-2xl border p-3 text-left transition ${
                    hardware.printerType === 'thermal_80mm'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800'
                  }`}
                >
                  <div className="text-sm font-bold">80mm (3-Inch Standard)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Full POS counter receipt with wide columns</div>
                </button>
              </div>
            </div>

            <div className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hardware.autoPrintOnSale}
                  onChange={(e) => handleSaveHardware({ ...hardware, autoPrintOnSale: e.target.checked })}
                  className="rounded text-indigo-600 h-4 w-4"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Auto trigger print receipt window immediately upon checkout
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hardware.barcodeScannerEnabled}
                  onChange={(e) => handleSaveHardware({ ...hardware, barcodeScannerEnabled: e.target.checked })}
                  className="rounded text-indigo-600 h-4 w-4"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Enable hardware USB / Bluetooth barcode scanner listener
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hardware.soundFeedback}
                  onChange={(e) => handleSaveHardware({ ...hardware, soundFeedback: e.target.checked })}
                  className="rounded text-indigo-600 h-4 w-4"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Audible beep feedback on calculator keypad and barcode scan
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5 text-xs">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Data Safety, Backup &amp; Offline Portability
            </h3>
            <p className="text-slate-500">
              All your store data is safely stored in local browser persistence. Download a backup file regularly to keep a copy on your USB or device.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Download */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60 flex flex-col justify-between">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  Export Full Backup
                </div>
                <div className="text-[11px] text-slate-500 mb-4">
                  Downloads a JSON file containing all products, sales, customers, suppliers, ledgers, and settings.
                </div>
              </div>
              <button
                onClick={handleDownloadBackup}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 px-3 font-bold text-white hover:bg-indigo-700"
              >
                <Download className="h-4 w-4" />
                <span>Download Backup JSON</span>
              </button>
            </div>

            {/* Restore */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60 flex flex-col justify-between">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  Restore from File
                </div>
                <div className="text-[11px] text-slate-500 mb-4">
                  Upload an existing SMARTBIZ backup file to restore all store records.
                </div>
              </div>
              <label className="flex items-center justify-center gap-2 rounded-xl border border-indigo-600 bg-white py-2.5 px-3 font-bold text-indigo-600 hover:bg-indigo-50 cursor-pointer dark:bg-slate-900">
                <Upload className="h-4 w-4" />
                <span>Upload &amp; Restore</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-rose-600 dark:text-rose-400">Reset Initial Demo Data</div>
              <div className="text-[11px] text-slate-400">Restores default sample products and customers</div>
            </div>
            <button
              onClick={handleResetDemoData}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
            >
              Reset to Demo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
