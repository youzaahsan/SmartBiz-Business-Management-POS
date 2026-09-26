import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Calculator,
  Zap,
  Receipt,
  Users,
  Package,
  Boxes,
  Truck,
  Building2,
  CreditCard,
  Wallet,
  BarChart3,
  ShieldCheck,
  History,
  Settings,
  X,
  ChevronDown,
} from 'lucide-react';
import { StorageService } from '../../services/storage';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { currentUser, currentBusiness, hasPermission } = useAuth();

  const customers = StorageService.getCustomers(currentBusiness.id);
  const totalUdhaarCustomers = customers.filter((c) => c.totalDue > 0).length;

  const products = StorageService.getProducts(currentBusiness.id);
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minimumStock).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      id: 'calculator',
      label: 'Calculator',
      icon: Calculator,
      show: true,
    },
    {
      id: 'pos',
      label: 'Quick Sale',
      icon: Zap,
      show: true,
    },
    {
      id: 'invoices',
      label: 'Billing',
      icon: Receipt,
      show: true,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      show: true,
      badge: totalUdhaarCustomers > 0 ? `${totalUdhaarCustomers}` : undefined,
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      show: hasPermission('manage_products'),
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Boxes,
      show: hasPermission('manage_products'),
      badge: lowStockCount > 0 ? `${lowStockCount}` : undefined,
    },
    {
      id: 'purchases',
      label: 'Purchases',
      icon: Truck,
      show: hasPermission('manage_suppliers'),
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: Building2,
      show: hasPermission('manage_suppliers'),
    },
    {
      id: 'invoices',
      label: 'Payments',
      icon: CreditCard,
      show: true,
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: Wallet,
      show: hasPermission('manage_expenses'),
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      show: hasPermission('view_reports'),
    },
    {
      id: 'staff',
      label: 'Staff',
      icon: ShieldCheck,
      show: hasPermission('manage_staff'),
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      show: hasPermission('manage_settings') || currentUser.role === 'ADMIN',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      show: hasPermission('manage_settings') || currentUser.role === 'ADMIN',
    },
  ];

  const handleSelect = (viewId: string) => {
    onNavigate(viewId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-[#DED7CB] bg-[#EAE5DC] transition-all duration-300 ease-in-out md:static md:translate-x-0 anim-slide-left ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="flex h-20 items-center justify-between px-5 pt-3">
          <div
            onClick={() => handleSelect('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* 3 Rounded Bars Logo from screenshot */}
            <div className="flex items-end gap-1 h-8">
              <span className="w-2 h-5 rounded-full bg-[#B8A68D] shadow-xs"></span>
              <span className="w-2 h-7 rounded-full bg-[#8E7963] shadow-xs"></span>
              <span className="w-2 h-6 rounded-full bg-[#A28F77] shadow-xs"></span>
            </div>

            <div>
              <div className="font-extrabold text-xl text-[#2B2520] tracking-tight leading-none font-sans">
                SmartBiz
              </div>
              <div className="text-[10px] text-[#7A7268] font-medium tracking-wider mt-1">
                Manage &bull; Sell &bull; Grow
              </div>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#7A7268] hover:bg-[#DDD6C9] md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          {navItems
            .filter((item) => item.show)
            .map((item, index) => {
              const Icon = item.icon;
              // Check active status
              const isActive =
                activeView === item.id ||
                (item.label === 'Billing' && activeView === 'invoices') ||
                (item.label === 'Payments' && activeView === 'payments');

              return (
                <button
                  key={`${item.id}-${index}`}
                  onClick={() => handleSelect(item.id)}
                  className={`group relative flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#F7F4EE] text-[#2B2520] font-bold shadow-xs border border-[#DDD5C7]'
                      : 'text-[#5E554B] hover:bg-[#F2ECE2] hover:text-[#2B2520]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isActive
                          ? 'text-[#2B2520] scale-105'
                          : 'text-[#7A7268] group-hover:scale-105 group-hover:text-[#2B2520]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                        isActive
                          ? 'bg-[#E7DFD2] text-[#4A4136]'
                          : 'bg-[#E2DAD0] text-[#695F54]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-[#DED7CB] bg-[#E7E2D8]">
          <div className="flex items-center justify-between rounded-2xl p-2 hover:bg-[#DDD6C8] transition cursor-pointer">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8E7963] font-bold text-white text-xs shadow-xs border border-[#7D6A56]">
                YA
              </div>
              <div className="text-left">
                <div className="font-bold text-xs text-[#2B2520] leading-tight">
                  Youza Ahsan
                </div>
                <div className="text-[10px] text-[#7A7268] font-medium">
                  {currentUser.role === 'ADMIN' ? 'Admin' : currentUser.role}
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-[#7A7268]" />
          </div>

          <div className="mt-1 text-center text-[10px] text-[#8C8377] font-medium">
            SmartBiz v1.0.0
          </div>
        </div>
      </aside>
    </>
  );
};
