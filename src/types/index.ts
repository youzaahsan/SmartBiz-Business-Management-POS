export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER';

export type Permission =
  | 'create_sale'
  | 'cancel_sale'
  | 'apply_discount'
  | 'view_profit'
  | 'view_purchase_cost'
  | 'manage_products'
  | 'manage_customers'
  | 'manage_suppliers'
  | 'record_payment'
  | 'manage_expenses'
  | 'view_reports'
  | 'manage_staff'
  | 'manage_settings';

export interface StaffUser {
  id: string;
  businessId: string;
  name: string;
  email: string;
  role: UserRole;
  pin: string; // 4-digit quick pin for POS
  phone?: string;
  isActive: boolean;
  customPermissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  currencySymbol: string;
  taxNumber?: string;
  defaultTaxRate: number; // e.g. 5 for 5%
  defaultDiscountRate: number;
  invoicePrefix: string;
  invoiceCounter: number;
  invoiceFooterNote: string;
  paymentIdentifier?: string; // UPI ID or IBAN or QR code data
  paymentIdentifierLabel?: string; // e.g. "UPI ID" or "Bank Transfer"
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string; // e.g. 'KG', 'Ltr', 'Pcs', 'Pack', 'Box'
  purchasePrice: number; // Cost price (hidden from cashier)
  retailPrice: number;
  wholesalePrice: number;
  specialPrice: number;
  stockQuantity: number;
  minimumStock: number; // Reorder alert threshold
  description?: string;
  imageUrl?: string;
  isFavorite?: boolean;
  favoriteOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  customerType: 'Regular' | 'Wholesale' | 'VIP' | 'Walk-in';
  totalPurchases: number;
  totalPaid: number;
  totalDue: number; // Current outstanding Udhaar balance
  creditLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  totalPurchases: number;
  totalPaid: number;
  totalDue: number; // Amount owed to supplier
  createdAt: string;
  updatedAt: string;
}

export type PriceType = 'retail' | 'wholesale' | 'special';

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  purchasePrice: number; // recorded at sale time for profit calculation
  unitPrice: number; // selected selling price
  priceType: PriceType;
  quantity: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  returnedQuantity?: number;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'QR_ONLINE' | 'BANK_TRANSFER' | 'UDHAAR_CREDIT';
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';
export type InvoiceStatus = 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export interface Invoice {
  id: string;
  businessId: string;
  invoiceNumber: string; // e.g. SB-1001
  customerId: string;
  customerName: string;
  customerPhone?: string;
  userId: string; // Staff who billed
  userName: string;
  items: InvoiceItem[];
  subtotal: number;
  billDiscountType: 'percentage' | 'fixed';
  billDiscountValue: number;
  billDiscountAmount: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: InvoiceStatus;
  notes?: string;
  grossProfit: number; // calculated server-side/transactionally
  totalCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  businessId: string;
  invoiceId?: string;
  customerId?: string;
  supplierId?: string;
  type: 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT' | 'SALE_PAYMENT';
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  recordedByUserId: string;
  recordedByUserName: string;
  createdAt: string;
}

export interface CustomerLedgerEntry {
  id: string;
  businessId: string;
  customerId: string;
  type: 'SALE' | 'PAYMENT' | 'RETURN' | 'OPENING_BALANCE';
  referenceId: string; // invoiceId or paymentId or returnId
  referenceNumber: string; // e.g. INV-1001
  debit: number; // Bill amount (increases balance owed)
  credit: number; // Payment received or refund (decreases balance owed)
  balance: number; // Running balance after this entry
  notes?: string;
  date: string;
}

export interface SupplierLedgerEntry {
  id: string;
  businessId: string;
  supplierId: string;
  type: 'PURCHASE' | 'PAYMENT' | 'RETURN' | 'OPENING_BALANCE';
  referenceId: string;
  referenceNumber: string;
  debit: number; // Payments made to supplier (decreases balance owed)
  credit: number; // Purchases received from supplier (increases balance owed)
  balance: number;
  notes?: string;
  date: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  purchasePrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  businessId: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  recordedByUserId: string;
  recordedByUserName: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  businessId: string;
  title: string;
  amount: number;
  category: 'Rent' | 'Electricity' | 'Salaries' | 'Transport' | 'Supplies' | 'Maintenance' | 'Food' | 'Marketing' | 'Other';
  paymentMethod: PaymentMethod;
  date: string;
  notes?: string;
  recordedByUserId: string;
  recordedByUserName: string;
  createdAt: string;
}

export interface ReturnItem {
  productId: string;
  productName: string;
  returnedQuantity: number;
  refundUnitPrice: number;
  totalRefund: number;
  restockEligible: boolean;
}

export interface ReturnTransaction {
  id: string;
  businessId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: ReturnItem[];
  totalRefundAmount: number;
  reason: string;
  refundMethod: PaymentMethod;
  recordedByUserId: string;
  recordedByUserName: string;
  createdAt: string;
}

export interface CalculationRecord {
  id: string;
  businessId: string;
  userId: string;
  expression: string;
  result: number;
  calculationType: 'General' | 'Shopping' | 'Customer' | 'GST' | 'Discount' | 'Markup' | 'Profit' | 'Other';
  category: string;
  itemDetails?: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  notes?: string;
  isFavorite?: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: 'INVOICE' | 'PRODUCT' | 'CUSTOMER' | 'SUPPLIER' | 'PURCHASE' | 'PAYMENT' | 'RETURN' | 'EXPENSE' | 'STAFF' | 'SETTINGS';
  entityId: string;
  details: string;
  createdAt: string;
}

export interface HardwareSettings {
  printerType: 'thermal_58mm' | 'thermal_80mm' | 'standard_a4';
  autoPrintOnSale: boolean;
  openCashDrawer: boolean;
  barcodeScannerEnabled: boolean;
  barcodeScanPrefix: string;
  barcodeScanSuffix: string;
  soundFeedback: boolean;
}
