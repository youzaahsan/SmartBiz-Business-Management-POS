import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Business, StaffUser, Permission, UserRole } from '../types';
import { StorageService, initializeStorage } from '../services/storage';

interface AuthContextType {
  currentUser: StaffUser;
  currentBusiness: Business;
  allBusinesses: Business[];
  staffList: StaffUser[];
  isOffline: boolean;
  hasPermission: (perm: Permission) => boolean;
  switchBusiness: (businessId: string) => void;
  switchUserByPin: (pin: string) => boolean;
  switchUserDirectly: (userId: string) => void;
  updateBusinessProfile: (updated: Business) => void;
  refreshContext: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role permission defaults
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'create_sale',
    'cancel_sale',
    'apply_discount',
    'view_profit',
    'view_purchase_cost',
    'manage_products',
    'manage_customers',
    'manage_suppliers',
    'record_payment',
    'manage_expenses',
    'view_reports',
    'manage_staff',
    'manage_settings',
  ],
  MANAGER: [
    'create_sale',
    'cancel_sale',
    'apply_discount',
    'view_profit',
    'view_purchase_cost',
    'manage_products',
    'manage_customers',
    'manage_suppliers',
    'record_payment',
    'manage_expenses',
    'view_reports',
  ],
  CASHIER: [
    'create_sale',
    'apply_discount',
    'record_payment',
  ],
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentBusiness, setCurrentBusiness] = useState<Business>(() => {
    initializeStorage();
    return StorageService.getActiveBusiness();
  });

  const [currentUser, setCurrentUser] = useState<StaffUser>(() => {
    return StorageService.getActiveUser();
  });

  const [allBusinesses, setAllBusinesses] = useState<Business[]>(() => StorageService.getBusinesses());
  const [staffList, setStaffList] = useState<StaffUser[]>(() => StorageService.getStaff(currentBusiness.id));
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshContext = () => {
    const biz = StorageService.getActiveBusiness();
    const user = StorageService.getActiveUser();
    const businesses = StorageService.getBusinesses();
    const staff = StorageService.getStaff(biz.id);
    setCurrentBusiness(biz);
    setCurrentUser(user);
    setAllBusinesses(businesses);
    setStaffList(staff);
  };

  const switchBusiness = (businessId: string) => {
    StorageService.setActiveBusinessId(businessId);
    const newBiz = StorageService.getActiveBusiness();
    setCurrentBusiness(newBiz);
    const staff = StorageService.getStaff(newBiz.id);
    setStaffList(staff);
    if (staff.length > 0) {
      StorageService.setActiveUserId(staff[0].id);
      setCurrentUser(staff[0]);
    }
  };

  const switchUserByPin = (pin: string): boolean => {
    const staff = StorageService.getStaff(currentBusiness.id);
    const found = staff.find((s) => s.pin === pin && s.isActive);
    if (found) {
      StorageService.setActiveUserId(found.id);
      setCurrentUser(found);
      StorageService.logActivity({
        businessId: currentBusiness.id,
        userId: found.id,
        userName: found.name,
        userRole: found.role,
        action: 'Switched Active Staff User',
        entity: 'STAFF',
        entityId: found.id,
        details: `Logged in as ${found.name} (${found.role})`,
      });
      return true;
    }
    return false;
  };

  const switchUserDirectly = (userId: string) => {
    const staff = StorageService.getStaff(currentBusiness.id);
    const found = staff.find((s) => s.id === userId);
    if (found) {
      StorageService.setActiveUserId(found.id);
      setCurrentUser(found);
    }
  };

  const updateBusinessProfile = (updated: Business) => {
    StorageService.saveBusiness(updated);
    setCurrentBusiness(updated);
    setAllBusinesses(StorageService.getBusinesses());
  };

  const hasPermission = (perm: Permission): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.customPermissions && currentUser.customPermissions.includes(perm)) {
      return true;
    }
    const defaultPerms = ROLE_PERMISSIONS[currentUser.role] || [];
    return defaultPerms.includes(perm);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentBusiness,
        allBusinesses,
        staffList,
        isOffline,
        hasPermission,
        switchBusiness,
        switchUserByPin,
        switchUserDirectly,
        updateBusinessProfile,
        refreshContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
