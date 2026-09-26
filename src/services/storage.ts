import {
  Business,
  StaffUser,
  Product,
  Customer,
  Supplier,
  Invoice,
  InvoiceItem,
  PaymentRecord,
  CustomerLedgerEntry,
  SupplierLedgerEntry,
  Purchase,
  Expense,
  ReturnTransaction,
  CalculationRecord,
  ActivityLog,
  HardwareSettings,
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from '../types';

const STORAGE_KEYS = {
  BUSINESSES: 'smartbiz_businesses',
  ACTIVE_BUSINESS_ID: 'smartbiz_active_business_id',
  USERS: 'smartbiz_users',
  ACTIVE_USER_ID: 'smartbiz_active_user_id',
  PRODUCTS: 'smartbiz_products',
  CUSTOMERS: 'smartbiz_customers',
  SUPPLIERS: 'smartbiz_suppliers',
  INVOICES: 'smartbiz_invoices',
  PAYMENTS: 'smartbiz_payments',
  CUSTOMER_LEDGER: 'smartbiz_customer_ledger',
  SUPPLIER_LEDGER: 'smartbiz_supplier_ledger',
  PURCHASES: 'smartbiz_purchases',
  EXPENSES: 'smartbiz_expenses',
  RETURNS: 'smartbiz_returns',
  CALCULATIONS: 'smartbiz_calculations',
  ACTIVITY_LOGS: 'smartbiz_activity_logs',
  HARDWARE_SETTINGS: 'smartbiz_hardware_settings',
};

// Safe getItem / setItem helpers
function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
}

function writeStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
}

// Default Seed Data
const DEFAULT_BUSINESS: Business = {
  id: 'biz_default',
  name: 'SmartBiz Store',
  ownerName: 'Youza Ahsan',
  phone: '+92 300 1234567',
  email: 'youza@smartbiz.io',
  address: 'Shop # 14-16, Commercial Plaza, Main Market',
  currency: 'PKR',
  currencySymbol: 'Rs.',
  taxNumber: 'GST-9921-848',
  defaultTaxRate: 0,
  defaultDiscountRate: 0,
  invoicePrefix: 'SB-',
  invoiceCounter: 1005,
  invoiceFooterNote: 'Thank you for your business! Please visit us again. Developed & Designed by Youza Ahsan',
  paymentIdentifier: 'smartbiz@nayapay',
  paymentIdentifierLabel: 'Raast / Nayapay / EasyPaisa',
  createdAt: '2026-09-01T08:00:00.000Z',
  updatedAt: '2026-09-23T08:00:00.000Z',
};

const DEFAULT_USERS: StaffUser[] = [
  {
    id: 'user_admin',
    businessId: 'biz_default',
    name: 'Youza Ahsan',
    email: 'youza@smartbiz.io',
    role: 'ADMIN',
    pin: '1234',
    phone: '+92 300 1234567',
    isActive: true,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'user_manager',
    businessId: 'biz_default',
    name: 'Bilal Tariq',
    email: 'bilal@smartmart.biz',
    role: 'MANAGER',
    pin: '2222',
    phone: '+92 321 9876543',
    isActive: true,
    createdAt: '2026-09-05T09:00:00.000Z',
    updatedAt: '2026-09-05T09:00:00.000Z',
  },
  {
    id: 'user_cashier',
    businessId: 'biz_default',
    name: 'Hamza Khan',
    email: 'hamza@smartmart.biz',
    role: 'CASHIER',
    pin: '1111',
    phone: '+92 333 4455667',
    isActive: true,
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-10T10:00:00.000Z',
  },
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    businessId: 'biz_default',
    name: 'Premium White Sugar',
    sku: 'SUG-001',
    barcode: '890123456001',
    category: 'Grocery',
    unit: 'KG',
    purchasePrice: 150,
    retailPrice: 180,
    wholesalePrice: 165,
    specialPrice: 160,
    stockQuantity: 45,
    minimumStock: 15,
    description: 'Refined granulated white sugar',
    isFavorite: true,
    favoriteOrder: 1,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'prod_2',
    businessId: 'biz_default',
    name: 'Super Kernel Basmati Rice',
    sku: 'RCE-002',
    barcode: '890123456002',
    category: 'Grains & Pulses',
    unit: 'KG',
    purchasePrice: 280,
    retailPrice: 340,
    wholesalePrice: 310,
    specialPrice: 300,
    stockQuantity: 60,
    minimumStock: 20,
    description: 'Aromatic aged long grain basmati rice',
    isFavorite: true,
    favoriteOrder: 2,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'prod_3',
    businessId: 'biz_default',
    name: 'Pure Cooking Oil (Pouch)',
    sku: 'OIL-003',
    barcode: '890123456003',
    category: 'Oils & Ghee',
    unit: 'Ltr',
    purchasePrice: 480,
    retailPrice: 550,
    wholesalePrice: 520,
    specialPrice: 510,
    stockQuantity: 8,
    minimumStock: 15, // LOW STOCK ALERT
    description: 'Heart healthy vegetable cooking oil',
    isFavorite: true,
    favoriteOrder: 3,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'prod_4',
    businessId: 'biz_default',
    name: 'Full Cream Milk (Tetra Pack)',
    sku: 'MLK-004',
    barcode: '890123456004',
    category: 'Dairy',
    unit: 'Ltr',
    purchasePrice: 240,
    retailPrice: 280,
    wholesalePrice: 260,
    specialPrice: 255,
    stockQuantity: 32,
    minimumStock: 10,
    description: '100% natural homogenized dairy milk',
    isFavorite: true,
    favoriteOrder: 4,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'prod_5',
    businessId: 'biz_default',
    name: 'Chakki Fresh Atta (Flour)',
    sku: 'FLR-005',
    barcode: '890123456005',
    category: 'Grains & Pulses',
    unit: 'KG',
    purchasePrice: 110,
    retailPrice: 140,
    wholesalePrice: 125,
    specialPrice: 120,
    stockQuantity: 4,
    minimumStock: 12, // LOW STOCK ALERT
    description: 'Stone ground whole wheat atta',
    isFavorite: true,
    favoriteOrder: 5,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'prod_6',
    businessId: 'biz_default',
    name: 'Mineral Drinking Water 1.5L',
    sku: 'WTR-006',
    barcode: '890123456006',
    category: 'Beverages',
    unit: 'Pcs',
    purchasePrice: 65,
    retailPrice: 90,
    wholesalePrice: 75,
    specialPrice: 70,
    stockQuantity: 85,
    minimumStock: 24,
    description: 'Purified mineral bottled water',
    isFavorite: true,
    favoriteOrder: 6,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'prod_7',
    businessId: 'biz_default',
    name: 'Danedar Black Tea 400g',
    sku: 'TEA-007',
    barcode: '890123456007',
    category: 'Beverages',
    unit: 'Pack',
    purchasePrice: 560,
    retailPrice: 680,
    wholesalePrice: 620,
    specialPrice: 600,
    stockQuantity: 22,
    minimumStock: 8,
    description: 'Rich aroma strong blend tea',
    isFavorite: true,
    favoriteOrder: 7,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'prod_8',
    businessId: 'biz_default',
    name: 'Iodized Table Salt 800g',
    sku: 'SLT-008',
    barcode: '890123456008',
    category: 'Spices & Seasoning',
    unit: 'Pack',
    purchasePrice: 40,
    retailPrice: 60,
    wholesalePrice: 50,
    specialPrice: 45,
    stockQuantity: 50,
    minimumStock: 15,
    description: 'Free flow iodized kitchen salt',
    isFavorite: false,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
];

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust_walkin',
    businessId: 'biz_default',
    name: 'Walk-in Customer',
    phone: '0000000000',
    customerType: 'Walk-in',
    totalPurchases: 15200,
    totalPaid: 15200,
    totalDue: 0,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'cust_1',
    businessId: 'biz_default',
    name: 'Ali Khan',
    phone: '03001234567',
    email: 'ali.khan@gmail.com',
    address: 'House 42, Street 8, Sector F-10, Islamabad',
    customerType: 'Regular',
    totalPurchases: 85500,
    totalPaid: 72000,
    totalDue: 13500, // UDHAAR / DUE BALANCE
    creditLimit: 25000,
    notes: 'Trusted customer. Settles bill every month.',
    createdAt: '2026-09-02T10:00:00.000Z',
    updatedAt: '2026-09-22T14:30:00.000Z',
  },
  {
    id: 'cust_2',
    businessId: 'biz_default',
    name: 'Hassan Raza',
    phone: '03215556677',
    email: 'hassan.raza@yahoo.com',
    address: 'Flat 3B, Al-Noor Heights',
    customerType: 'Regular',
    totalPurchases: 34200,
    totalPaid: 30000,
    totalDue: 4200, // UDHAAR
    creditLimit: 15000,
    notes: 'Regular household buyer',
    createdAt: '2026-09-05T12:00:00.000Z',
    updatedAt: '2026-09-20T16:00:00.000Z',
  },
  {
    id: 'cust_3',
    businessId: 'biz_default',
    name: 'Metro Fast Food & Cafe',
    phone: '03338889900',
    email: 'orders@metrocafe.pk',
    address: 'Main Commercial Market, Block C',
    customerType: 'Wholesale',
    totalPurchases: 145000,
    totalPaid: 145000,
    totalDue: 0,
    creditLimit: 50000,
    notes: 'Bulk purchaser of sugar, oil, rice',
    createdAt: '2026-09-03T11:00:00.000Z',
    updatedAt: '2026-09-21T18:00:00.000Z',
  },
];

const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 'supp_1',
    businessId: 'biz_default',
    name: 'National Commodity Traders',
    company: 'NCT Grains & Sugar Pvt Ltd',
    phone: '03017778899',
    email: 'sales@nct-traders.com',
    address: 'Grain Market Wholesale Depot, Lahore',
    totalPurchases: 250000,
    totalPaid: 210000,
    totalDue: 40000, // Amount owed to supplier
    notes: 'Supplies Sugar, Basmati Rice, Atta',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 'supp_2',
    businessId: 'biz_default',
    name: 'Habib & Sons Edible Oils',
    company: 'Habib Oil Mills Distribution',
    phone: '03224441122',
    email: 'orders@habiboils.pk',
    address: 'Industrial Area Unit 4',
    totalPurchases: 180000,
    totalPaid: 180000,
    totalDue: 0,
    notes: 'Cooking oil pouches and cans',
    createdAt: '2026-09-02T09:00:00.000Z',
    updatedAt: '2026-09-18T14:00:00.000Z',
  },
];

const DEFAULT_CUSTOMER_LEDGER: CustomerLedgerEntry[] = [
  {
    id: 'c_led_1',
    businessId: 'biz_default',
    customerId: 'cust_1',
    type: 'OPENING_BALANCE',
    referenceId: 'op_1',
    referenceNumber: 'OPENING',
    debit: 5000,
    credit: 0,
    balance: 5000,
    notes: 'Previous month remaining balance',
    date: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'c_led_2',
    businessId: 'biz_default',
    customerId: 'cust_1',
    type: 'SALE',
    referenceId: 'inv_1001',
    referenceNumber: 'SB-1001',
    debit: 15500,
    credit: 0,
    balance: 20500,
    notes: 'Invoice SB-1001',
    date: '2026-09-10T12:30:00.000Z',
  },
  {
    id: 'c_led_3',
    businessId: 'biz_default',
    customerId: 'cust_1',
    type: 'PAYMENT',
    referenceId: 'pay_1',
    referenceNumber: 'PAY-1001',
    debit: 0,
    credit: 12000,
    balance: 8500,
    notes: 'Partial payment received via Cash',
    date: '2026-09-15T15:00:00.000Z',
  },
  {
    id: 'c_led_4',
    businessId: 'biz_default',
    customerId: 'cust_1',
    type: 'SALE',
    referenceId: 'inv_1003',
    referenceNumber: 'SB-1003',
    debit: 5000,
    credit: 0,
    balance: 13500,
    notes: 'Invoice SB-1003 (Credit sale)',
    date: '2026-09-22T14:30:00.000Z',
  },
];

const DEFAULT_SUPPLIER_LEDGER: SupplierLedgerEntry[] = [
  {
    id: 's_led_1',
    businessId: 'biz_default',
    supplierId: 'supp_1',
    type: 'OPENING_BALANCE',
    referenceId: 's_op_1',
    referenceNumber: 'OPENING',
    debit: 0,
    credit: 40000,
    balance: 40000,
    notes: 'Carried forward supplier balance',
    date: '2026-09-01T08:00:00.000Z',
  },
];

const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    businessId: 'biz_default',
    title: 'Shop Rent - September',
    amount: 35000,
    category: 'Rent',
    paymentMethod: 'BANK_TRANSFER',
    date: '2026-09-05T10:00:00.000Z',
    notes: 'Monthly plaza rental paid to landlord',
    recordedByUserId: 'user_admin',
    recordedByUserName: 'Muhammad Ahsan',
    createdAt: '2026-09-05T10:00:00.000Z',
  },
  {
    id: 'exp_2',
    businessId: 'biz_default',
    title: 'Electricity Bill',
    amount: 14200,
    category: 'Electricity',
    paymentMethod: 'QR_ONLINE',
    date: '2026-09-12T11:00:00.000Z',
    notes: 'IESCO commercial meter bill',
    recordedByUserId: 'user_admin',
    recordedByUserName: 'Muhammad Ahsan',
    createdAt: '2026-09-12T11:00:00.000Z',
  },
  {
    id: 'exp_3',
    businessId: 'biz_default',
    title: 'Delivery Motorcycle Fuel',
    amount: 2500,
    category: 'Transport',
    paymentMethod: 'CASH',
    date: '2026-09-18T16:00:00.000Z',
    notes: 'Weekly fuel for customer deliveries',
    recordedByUserId: 'user_manager',
    recordedByUserName: 'Bilal Tariq',
    createdAt: '2026-09-18T16:00:00.000Z',
  },
];

const DEFAULT_HARDWARE: HardwareSettings = {
  printerType: 'thermal_80mm',
  autoPrintOnSale: false,
  openCashDrawer: false,
  barcodeScannerEnabled: true,
  barcodeScanPrefix: '',
  barcodeScanSuffix: 'Enter',
  soundFeedback: true,
};

function createDefaultInvoices(): Invoice[] {
  const now = Date.now();
  const dToday1 = new Date(now - 2 * 60 * 60 * 1000).toISOString();
  const dToday2 = new Date(now - 4 * 60 * 60 * 1000).toISOString();
  const dToday3 = new Date(now - 6 * 60 * 60 * 1000).toISOString();
  const dYesterday = new Date(now - 26 * 60 * 60 * 1000).toISOString();
  const d3Days = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
  const d5Days = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();
  const d9Days = new Date(now - 9 * 24 * 60 * 60 * 1000).toISOString();
  const d16Days = new Date(now - 16 * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'inv_1008',
      businessId: 'biz_default',
      invoiceNumber: 'SB-1008',
      customerId: 'cust_walkin',
      customerName: 'Walk-in Customer',
      customerPhone: '0000000000',
      userId: 'user_cashier',
      userName: 'Hamza Khan',
      items: [
        {
          id: 'item_8_1',
          productId: 'prod_6',
          productName: 'Mineral Drinking Water 1.5L',
          sku: 'WTR-006',
          unit: 'Pcs',
          purchasePrice: 65,
          unitPrice: 90,
          priceType: 'retail',
          quantity: 4,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 360,
        },
        {
          id: 'item_8_2',
          productId: 'prod_7',
          productName: 'Danedar Black Tea 400g',
          sku: 'TEA-007',
          unit: 'Pack',
          purchasePrice: 560,
          unitPrice: 680,
          priceType: 'retail',
          quantity: 2,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 1360,
        },
      ],
      subtotal: 1720,
      taxTotal: 0,
      billDiscountType: 'fixed',
      billDiscountValue: 0,
      billDiscountAmount: 0,
      grandTotal: 1720,
      paidAmount: 1720,
      dueAmount: 0,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      status: 'COMPLETED',
      notes: 'Cash Sale',
      grossProfit: 340,
      totalCost: 1380,
      createdAt: dToday1,
      updatedAt: dToday1,
    },
    {
      id: 'inv_1007',
      businessId: 'biz_default',
      invoiceNumber: 'SB-1007',
      customerId: 'cust_1',
      customerName: 'Ali Khan',
      customerPhone: '03001234567',
      userId: 'user_admin',
      userName: 'Muhammad Ahsan',
      items: [
        {
          id: 'item_7_1',
          productId: 'prod_3',
          productName: 'Super Kernel Basmati Rice',
          sku: 'RCE-003',
          unit: 'KG',
          purchasePrice: 320,
          unitPrice: 380,
          priceType: 'retail',
          quantity: 10,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 3800,
        },
        {
          id: 'item_7_2',
          productId: 'prod_2',
          productName: 'Pure Cooking Oil 1L',
          sku: 'OIL-002',
          unit: 'Ltr',
          purchasePrice: 480,
          unitPrice: 540,
          priceType: 'retail',
          quantity: 3,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 1620,
        },
      ],
      subtotal: 5420,
      taxTotal: 0,
      billDiscountType: 'fixed',
      billDiscountValue: 0,
      billDiscountAmount: 0,
      grandTotal: 5420,
      paidAmount: 5420,
      dueAmount: 0,
      paymentMethod: 'CARD',
      paymentStatus: 'PAID',
      status: 'COMPLETED',
      notes: 'Paid via Card',
      grossProfit: 780,
      totalCost: 4640,
      createdAt: dToday2,
      updatedAt: dToday2,
    },
    {
      id: 'inv_1006',
      businessId: 'biz_default',
      invoiceNumber: 'SB-1006',
      customerId: 'cust_2',
      customerName: 'Hassan Raza',
      customerPhone: '03215556677',
      userId: 'user_manager',
      userName: 'Bilal Tariq',
      items: [
        {
          id: 'item_6_1',
          productId: 'prod_1',
          productName: 'Premium White Sugar',
          sku: 'SUG-001',
          unit: 'KG',
          purchasePrice: 150,
          unitPrice: 180,
          priceType: 'retail',
          quantity: 5,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 900,
        },
        {
          id: 'item_6_2',
          productId: 'prod_5',
          productName: 'Chakki Fresh Atta (Flour)',
          sku: 'FLR-005',
          unit: 'KG',
          purchasePrice: 110,
          unitPrice: 140,
          priceType: 'retail',
          quantity: 5,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 700,
        },
      ],
      subtotal: 1600,
      taxTotal: 0,
      billDiscountType: 'fixed',
      billDiscountValue: 0,
      billDiscountAmount: 0,
      grandTotal: 1600,
      paidAmount: 1600,
      dueAmount: 0,
      paymentMethod: 'QR_ONLINE',
      paymentStatus: 'PAID',
      status: 'COMPLETED',
      notes: 'Online QR payment',
      grossProfit: 300,
      totalCost: 1300,
      createdAt: dToday3,
      updatedAt: dToday3,
    },
    {
      id: 'inv_1005',
      businessId: 'biz_default',
      invoiceNumber: 'SB-1005',
      customerId: 'cust_3',
      customerName: 'Metro Fast Food & Cafe',
      customerPhone: '03338889900',
      userId: 'user_admin',
      userName: 'Muhammad Ahsan',
      items: [
        {
          id: 'item_5_1',
          productId: 'prod_1',
          productName: 'Premium White Sugar',
          sku: 'SUG-001',
          unit: 'KG',
          purchasePrice: 150,
          unitPrice: 165,
          priceType: 'wholesale',
          quantity: 40,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 6600,
        },
        {
          id: 'item_5_2',
          productId: 'prod_2',
          productName: 'Pure Cooking Oil 1L',
          sku: 'OIL-002',
          unit: 'Ltr',
          purchasePrice: 480,
          unitPrice: 500,
          priceType: 'wholesale',
          quantity: 15,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 7500,
        },
      ],
      subtotal: 14100,
      taxTotal: 0,
      billDiscountType: 'fixed',
      billDiscountValue: 0,
      billDiscountAmount: 0,
      grandTotal: 14100,
      paidAmount: 14100,
      dueAmount: 0,
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PAID',
      status: 'COMPLETED',
      notes: 'Bank Transfer',
      grossProfit: 900,
      totalCost: 13200,
      createdAt: dYesterday,
      updatedAt: dYesterday,
    },
    {
      id: 'inv_1004',
      businessId: 'biz_default',
      invoiceNumber: 'SB-1004',
      customerId: 'cust_walkin',
      customerName: 'Walk-in Customer',
      customerPhone: '0000000000',
      userId: 'user_cashier',
      userName: 'Hamza Khan',
      items: [
        {
          id: 'item_4_1',
          productId: 'prod_7',
          productName: 'Danedar Black Tea 400g',
          sku: 'TEA-007',
          unit: 'Pack',
          purchasePrice: 560,
          unitPrice: 680,
          priceType: 'retail',
          quantity: 3,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 2040,
        },
        {
          id: 'item_4_2',
          productId: 'prod_8',
          productName: 'Iodized Table Salt 800g',
          sku: 'SLT-008',
          unit: 'Pack',
          purchasePrice: 40,
          unitPrice: 60,
          priceType: 'retail',
          quantity: 5,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 300,
        },
      ],
      subtotal: 2340,
      taxTotal: 0,
      billDiscountType: 'fixed',
      billDiscountValue: 0,
      billDiscountAmount: 0,
      grandTotal: 2340,
      paidAmount: 2340,
      dueAmount: 0,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      status: 'COMPLETED',
      grossProfit: 460,
      totalCost: 1880,
      createdAt: d3Days,
      updatedAt: d3Days,
    },
    {
      id: 'inv_1003',
      businessId: 'biz_default',
      invoiceNumber: 'SB-1003',
      customerId: 'cust_1',
      customerName: 'Ali Khan',
      customerPhone: '03001234567',
      userId: 'user_admin',
      userName: 'Muhammad Ahsan',
      items: [
        {
          id: 'item_3_1',
          productId: 'prod_4',
          productName: 'Dal Chana Special 1KG',
          sku: 'DAL-004',
          unit: 'KG',
          purchasePrice: 240,
          unitPrice: 290,
          priceType: 'retail',
          quantity: 10,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 2900,
        },
        {
          id: 'item_3_2',
          productId: 'prod_1',
          productName: 'Premium White Sugar',
          sku: 'SUG-001',
          unit: 'KG',
          purchasePrice: 150,
          unitPrice: 180,
          priceType: 'retail',
          quantity: 12,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 2160,
        },
      ],
      subtotal: 5060,
      taxTotal: 0,
      billDiscountType: 'fixed',
      billDiscountValue: 60,
      billDiscountAmount: 60,
      grandTotal: 5000,
      paidAmount: 0,
      dueAmount: 5000,
      paymentMethod: 'UDHAAR_CREDIT',
      paymentStatus: 'UNPAID',
      status: 'COMPLETED',
      notes: 'Credit sale recorded to ledger',
      grossProfit: 800,
      totalCost: 4200,
      createdAt: d5Days,
      updatedAt: d5Days,
    },
    {
      id: 'inv_1002',
      businessId: 'biz_default',
      invoiceNumber: 'SB-1002',
      customerId: 'cust_3',
      customerName: 'Metro Fast Food & Cafe',
      customerPhone: '03338889900',
      userId: 'user_manager',
      userName: 'Bilal Tariq',
      items: [
        {
          id: 'item_2_1',
          productId: 'prod_3',
          productName: 'Super Kernel Basmati Rice',
          sku: 'RCE-003',
          unit: 'KG',
          purchasePrice: 320,
          unitPrice: 350,
          priceType: 'wholesale',
          quantity: 30,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 10500,
        },
      ],
      subtotal: 10500,
      taxTotal: 0,
      billDiscountType: 'fixed',
      billDiscountValue: 0,
      billDiscountAmount: 0,
      grandTotal: 10500,
      paidAmount: 10500,
      dueAmount: 0,
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PAID',
      status: 'COMPLETED',
      grossProfit: 900,
      totalCost: 9600,
      createdAt: d9Days,
      updatedAt: d9Days,
    },
    {
      id: 'inv_1001',
      businessId: 'biz_default',
      invoiceNumber: 'SB-1001',
      customerId: 'cust_1',
      customerName: 'Ali Khan',
      customerPhone: '03001234567',
      userId: 'user_admin',
      userName: 'Muhammad Ahsan',
      items: [
        {
          id: 'item_1_1',
          productId: 'prod_2',
          productName: 'Pure Cooking Oil 1L',
          sku: 'OIL-002',
          unit: 'Ltr',
          purchasePrice: 480,
          unitPrice: 540,
          priceType: 'retail',
          quantity: 20,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 10800,
        },
        {
          id: 'item_1_2',
          productId: 'prod_7',
          productName: 'Danedar Black Tea 400g',
          sku: 'TEA-007',
          unit: 'Pack',
          purchasePrice: 560,
          unitPrice: 680,
          priceType: 'retail',
          quantity: 7,
          discountType: 'fixed',
          discountValue: 0,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 4760,
        },
      ],
      subtotal: 15560,
      taxTotal: 0,
      billDiscountType: 'fixed',
      billDiscountValue: 60,
      billDiscountAmount: 60,
      grandTotal: 15500,
      paidAmount: 7000,
      dueAmount: 8500,
      paymentMethod: 'CASH',
      paymentStatus: 'PARTIAL',
      status: 'COMPLETED',
      notes: 'Partial payment settled',
      grossProfit: 1980,
      totalCost: 13520,
      createdAt: d16Days,
      updatedAt: d16Days,
    },
  ];
}

// Initialize default data if not present
export function initializeStorage(): void {
  const existingBiz = readStorage<Business[]>(STORAGE_KEYS.BUSINESSES, []);
  if (existingBiz.length === 0) {
    writeStorage(STORAGE_KEYS.BUSINESSES, [DEFAULT_BUSINESS]);
    writeStorage(STORAGE_KEYS.ACTIVE_BUSINESS_ID, DEFAULT_BUSINESS.id);
    writeStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    writeStorage(STORAGE_KEYS.ACTIVE_USER_ID, DEFAULT_USERS[0].id);
    writeStorage(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    writeStorage(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
    writeStorage(STORAGE_KEYS.SUPPLIERS, DEFAULT_SUPPLIERS);
    writeStorage(STORAGE_KEYS.CUSTOMER_LEDGER, DEFAULT_CUSTOMER_LEDGER);
    writeStorage(STORAGE_KEYS.SUPPLIER_LEDGER, DEFAULT_SUPPLIER_LEDGER);
    writeStorage(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
    writeStorage(STORAGE_KEYS.HARDWARE_SETTINGS, DEFAULT_HARDWARE);
    writeStorage(STORAGE_KEYS.INVOICES, createDefaultInvoices());
    writeStorage(STORAGE_KEYS.PURCHASES, []);
    writeStorage(STORAGE_KEYS.PAYMENTS, []);
    writeStorage(STORAGE_KEYS.RETURNS, []);
    writeStorage(STORAGE_KEYS.CALCULATIONS, []);
    writeStorage(STORAGE_KEYS.ACTIVITY_LOGS, [
      {
        id: 'act_init',
        businessId: DEFAULT_BUSINESS.id,
        userId: DEFAULT_USERS[0].id,
        userName: DEFAULT_USERS[0].name,
        userRole: 'ADMIN',
        action: 'System Initialized',
        entity: 'SETTINGS',
        entityId: DEFAULT_BUSINESS.id,
        details: 'SmartBiz database and initial inventory initialized successfully',
        createdAt: new Date().toISOString(),
      },
    ]);
  }
}

// Storage Access Class
export const StorageService = {
  // BUSINESS
  getBusinesses(): Business[] {
    return readStorage<Business[]>(STORAGE_KEYS.BUSINESSES, []);
  },
  getActiveBusiness(): Business {
    const list = this.getBusinesses();
    const activeId = readStorage<string>(STORAGE_KEYS.ACTIVE_BUSINESS_ID, list[0]?.id || '');
    return list.find((b) => b.id === activeId) || list[0] || DEFAULT_BUSINESS;
  },
  saveBusiness(business: Business): void {
    const list = this.getBusinesses();
    const idx = list.findIndex((b) => b.id === business.id);
    if (idx >= 0) {
      list[idx] = { ...business, updatedAt: new Date().toISOString() };
    } else {
      list.push(business);
    }
    writeStorage(STORAGE_KEYS.BUSINESSES, list);
  },
  setActiveBusinessId(id: string): void {
    writeStorage(STORAGE_KEYS.ACTIVE_BUSINESS_ID, id);
  },

  // USERS / STAFF
  getStaff(businessId: string): StaffUser[] {
    const list = readStorage<StaffUser[]>(STORAGE_KEYS.USERS, []);
    return list.filter((u) => u.businessId === businessId);
  },
  getAllStaff(): StaffUser[] {
    return readStorage<StaffUser[]>(STORAGE_KEYS.USERS, []);
  },
  getActiveUser(): StaffUser {
    const all = this.getAllStaff();
    const activeId = readStorage<string>(STORAGE_KEYS.ACTIVE_USER_ID, all[0]?.id || '');
    const user = all.find((u) => u.id === activeId) || all[0] || DEFAULT_USERS[0];
    if (user.role === 'ADMIN' && (user.name === 'Muhammad Ahsan' || !user.name)) {
      user.name = 'Youza Ahsan';
    }
    return user;
  },
  setActiveUserId(id: string): void {
    writeStorage(STORAGE_KEYS.ACTIVE_USER_ID, id);
  },
  saveStaffUser(user: StaffUser): void {
    const all = this.getAllStaff();
    const idx = all.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      all[idx] = { ...user, updatedAt: new Date().toISOString() };
    } else {
      all.push(user);
    }
    writeStorage(STORAGE_KEYS.USERS, all);
  },
  deleteStaffUser(id: string): void {
    const all = this.getAllStaff().filter((u) => u.id !== id);
    writeStorage(STORAGE_KEYS.USERS, all);
  },

  // PRODUCTS
  getProducts(businessId: string): Product[] {
    const all = readStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    return all.filter((p) => p.businessId === businessId);
  },
  saveProduct(product: Product, actor?: { id: string; name: string; role: UserRole }): void {
    const all = readStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const idx = all.findIndex((p) => p.id === product.id);
    const now = new Date().toISOString();
    const isNew = idx < 0;

    if (idx >= 0) {
      all[idx] = { ...product, updatedAt: now };
    } else {
      all.push({ ...product, createdAt: now, updatedAt: now });
    }
    writeStorage(STORAGE_KEYS.PRODUCTS, all);

    if (actor) {
      this.logActivity({
        businessId: product.businessId,
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role,
        action: isNew ? 'Created Product' : 'Updated Product',
        entity: 'PRODUCT',
        entityId: product.id,
        details: `${product.name} (SKU: ${product.sku}, Stock: ${product.stockQuantity})`,
      });
    }
  },
  deleteProduct(id: string, businessId: string, actor?: { id: string; name: string; role: UserRole }): void {
    const all = readStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const prod = all.find((p) => p.id === id);
    const filtered = all.filter((p) => p.id !== id);
    writeStorage(STORAGE_KEYS.PRODUCTS, filtered);

    if (actor && prod) {
      this.logActivity({
        businessId,
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role,
        action: 'Deleted Product',
        entity: 'PRODUCT',
        entityId: id,
        details: `Deleted product: ${prod.name}`,
      });
    }
  },

  // CUSTOMERS
  getCustomers(businessId: string): Customer[] {
    const all = readStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    return all.filter((c) => c.businessId === businessId);
  },
  saveCustomer(customer: Customer, actor?: { id: string; name: string; role: UserRole }): Customer {
    const all = readStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const idx = all.findIndex((c) => c.id === customer.id);
    const now = new Date().toISOString();
    const isNew = idx < 0;
    let savedCustomer: Customer;

    if (idx >= 0) {
      savedCustomer = { ...customer, updatedAt: now };
      all[idx] = savedCustomer;
    } else {
      savedCustomer = { ...customer, createdAt: now, updatedAt: now };
      all.push(savedCustomer);
    }
    writeStorage(STORAGE_KEYS.CUSTOMERS, all);

    if (actor) {
      this.logActivity({
        businessId: customer.businessId,
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role,
        action: isNew ? 'Created Customer' : 'Updated Customer',
        entity: 'CUSTOMER',
        entityId: customer.id,
        details: `${customer.name} (Phone: ${customer.phone}, Due: ${customer.totalDue})`,
      });
    }
    return savedCustomer;
  },

  // SUPPLIERS
  getSuppliers(businessId: string): Supplier[] {
    const all = readStorage<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
    return all.filter((s) => s.businessId === businessId);
  },
  saveSupplier(supplier: Supplier, actor?: { id: string; name: string; role: UserRole }): Supplier {
    const all = readStorage<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
    const idx = all.findIndex((s) => s.id === supplier.id);
    const now = new Date().toISOString();
    const isNew = idx < 0;
    let saved: Supplier;

    if (idx >= 0) {
      saved = { ...supplier, updatedAt: now };
      all[idx] = saved;
    } else {
      saved = { ...supplier, createdAt: now, updatedAt: now };
      all.push(saved);
    }
    writeStorage(STORAGE_KEYS.SUPPLIERS, all);

    if (actor) {
      this.logActivity({
        businessId: supplier.businessId,
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role,
        action: isNew ? 'Created Supplier' : 'Updated Supplier',
        entity: 'SUPPLIER',
        entityId: supplier.id,
        details: `${supplier.name} (Phone: ${supplier.phone}, Company: ${supplier.company || 'N/A'})`,
      });
    }
    return saved;
  },

  // INVOICES & POS TRANSACTIONS (ATOMIC OPERATION)
  getInvoices(businessId: string): Invoice[] {
    let all = readStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    if (all.length === 0) {
      all = createDefaultInvoices();
      writeStorage(STORAGE_KEYS.INVOICES, all);
    }
    return all.filter((i) => i.businessId === businessId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createSaleTransaction(params: {
    businessId: string;
    customerId: string;
    customerName: string;
    customerPhone?: string;
    userId: string;
    userName: string;
    userRole: UserRole;
    items: InvoiceItem[];
    billDiscountType: 'percentage' | 'fixed';
    billDiscountValue: number;
    paymentMethod: PaymentMethod;
    paidAmount: number;
    notes?: string;
  }): { success: boolean; invoice?: Invoice; error?: string } {
    const {
      businessId,
      customerId,
      customerName,
      customerPhone,
      userId,
      userName,
      userRole,
      items,
      billDiscountType,
      billDiscountValue,
      paymentMethod,
      paidAmount,
      notes,
    } = params;

    if (!items || items.length === 0) {
      return { success: false, error: 'No items in sale' };
    }

    const products = this.getProducts(businessId);
    const allProducts = readStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);

    // 1. Stock check: ensure every product has enough inventory
    for (const item of items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) {
        return { success: false, error: `Product "${item.productName}" not found` };
      }
      if (prod.stockQuantity < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${prod.name}". Available: ${prod.stockQuantity} ${prod.unit}, Requested: ${item.quantity} ${prod.unit}`,
        };
      }
    }

    // 2. Server-side validation of line items & financial recalculation
    let subtotal = 0;
    let totalCost = 0;
    const validatedItems: InvoiceItem[] = items.map((item) => {
      const prod = products.find((p) => p.id === item.productId)!;
      const unitPrice = item.unitPrice > 0 ? item.unitPrice : prod.retailPrice;
      const cost = prod.purchasePrice;

      let itemDiscount = 0;
      if (item.discountType === 'percentage') {
        itemDiscount = (unitPrice * item.quantity * (item.discountValue || 0)) / 100;
      } else {
        itemDiscount = Math.min(item.discountValue || 0, unitPrice * item.quantity);
      }

      const lineTotal = Math.max(0, unitPrice * item.quantity - itemDiscount);
      subtotal += lineTotal;
      totalCost += cost * item.quantity;

      return {
        ...item,
        purchasePrice: cost,
        unitPrice,
        discountAmount: itemDiscount,
        total: lineTotal,
      };
    });

    // 3. Bill discount calculation
    let billDiscountAmount = 0;
    if (billDiscountType === 'percentage') {
      billDiscountAmount = (subtotal * (billDiscountValue || 0)) / 100;
    } else {
      billDiscountAmount = Math.min(billDiscountValue || 0, subtotal);
    }

    const grandTotal = Math.max(0, subtotal - billDiscountAmount);
    const safePaid = Math.max(0, Math.min(paidAmount, grandTotal));
    const dueAmount = Math.max(0, grandTotal - safePaid);

    let paymentStatus: PaymentStatus = 'PAID';
    if (dueAmount === 0) {
      paymentStatus = 'PAID';
    } else if (safePaid > 0) {
      paymentStatus = 'PARTIAL';
    } else {
      paymentStatus = 'UNPAID';
    }

    const grossProfit = grandTotal - totalCost;

    // 4. Generate sequential invoice number safely
    const business = this.getActiveBusiness();
    const nextCounter = (business.invoiceCounter || 1000) + 1;
    const invoiceNumber = `${business.invoicePrefix || 'SB-'}${nextCounter}`;
    this.saveBusiness({ ...business, invoiceCounter: nextCounter });

    const now = new Date().toISOString();
    const invoiceId = `inv_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newInvoice: Invoice = {
      id: invoiceId,
      businessId,
      invoiceNumber,
      customerId,
      customerName,
      customerPhone,
      userId,
      userName,
      items: validatedItems,
      subtotal,
      billDiscountType,
      billDiscountValue,
      billDiscountAmount,
      taxTotal: 0,
      grandTotal,
      paidAmount: safePaid,
      dueAmount,
      paymentMethod,
      paymentStatus,
      status: 'COMPLETED',
      notes,
      grossProfit,
      totalCost,
      createdAt: now,
      updatedAt: now,
    };

    // 5. ATOMIC WRITE: Deduct Stock
    for (const item of validatedItems) {
      const idx = allProducts.findIndex((p) => p.id === item.productId);
      if (idx >= 0) {
        allProducts[idx].stockQuantity = Math.max(0, allProducts[idx].stockQuantity - item.quantity);
        allProducts[idx].updatedAt = now;
      }
    }
    writeStorage(STORAGE_KEYS.PRODUCTS, allProducts);

    // 6. Save Invoice
    const allInvoices = readStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    allInvoices.push(newInvoice);
    writeStorage(STORAGE_KEYS.INVOICES, allInvoices);

    // 7. Update Customer & Ledger (if registered customer or has due)
    if (customerId && customerId !== 'cust_walkin') {
      const customers = this.getCustomers(businessId);
      const cust = customers.find((c) => c.id === customerId);
      if (cust) {
        const newTotalPurchases = (cust.totalPurchases || 0) + grandTotal;
        const newTotalPaid = (cust.totalPaid || 0) + safePaid;
        const newTotalDue = (cust.totalDue || 0) + dueAmount;

        this.saveCustomer({
          ...cust,
          totalPurchases: newTotalPurchases,
          totalPaid: newTotalPaid,
          totalDue: newTotalDue,
        });

        // Add Customer Ledger Entry (Sale)
        const currentBalance = cust.totalDue + dueAmount;
        this.addCustomerLedgerEntry({
          businessId,
          customerId,
          type: 'SALE',
          referenceId: invoiceId,
          referenceNumber: invoiceNumber,
          debit: grandTotal,
          credit: safePaid,
          balance: currentBalance,
          notes: safePaid < grandTotal ? `Partial payment Rs. ${safePaid}, Due Rs. ${dueAmount}` : 'Full payment received',
          date: now,
        });
      }
    }

    // 8. Record Payment entry if any money was paid
    if (safePaid > 0) {
      this.recordPayment({
        businessId,
        invoiceId,
        customerId,
        type: 'SALE_PAYMENT',
        amount: safePaid,
        paymentMethod,
        reference: invoiceNumber,
        notes: `Payment for bill ${invoiceNumber}`,
        recordedByUserId: userId,
        recordedByUserName: userName,
        createdAt: now,
      });
    }

    // 9. Activity Log
    this.logActivity({
      businessId,
      userId,
      userName,
      userRole,
      action: 'Created Sale Invoice',
      entity: 'INVOICE',
      entityId: invoiceId,
      details: `${invoiceNumber}: Total Rs. ${grandTotal} (${paymentStatus}), Customer: ${customerName}`,
    });

    return { success: true, invoice: newInvoice };
  },

  // CUSTOMER LEDGER & PAYMENTS
  getCustomerLedger(customerId: string): CustomerLedgerEntry[] {
    const all = readStorage<CustomerLedgerEntry[]>(STORAGE_KEYS.CUSTOMER_LEDGER, []);
    return all.filter((l) => l.customerId === customerId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  addCustomerLedgerEntry(entry: Omit<CustomerLedgerEntry, 'id'>): void {
    const all = readStorage<CustomerLedgerEntry[]>(STORAGE_KEYS.CUSTOMER_LEDGER, []);
    const newEntry: CustomerLedgerEntry = {
      ...entry,
      id: `c_led_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };
    all.push(newEntry);
    writeStorage(STORAGE_KEYS.CUSTOMER_LEDGER, all);
  },

  recordCustomerPayment(params: {
    businessId: string;
    customerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    recordedByUserId: string;
    recordedByUserName: string;
    userRole: UserRole;
  }): { success: boolean; error?: string } {
    const { businessId, customerId, amount, paymentMethod, notes, recordedByUserId, recordedByUserName, userRole } = params;

    if (amount <= 0) return { success: false, error: 'Payment amount must be greater than zero' };

    const customers = this.getCustomers(businessId);
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return { success: false, error: 'Customer not found' };

    const now = new Date().toISOString();
    const newTotalPaid = (cust.totalPaid || 0) + amount;
    const newTotalDue = Math.max(0, (cust.totalDue || 0) - amount);

    this.saveCustomer({
      ...cust,
      totalPaid: newTotalPaid,
      totalDue: newTotalDue,
    });

    // Add to ledger
    this.addCustomerLedgerEntry({
      businessId,
      customerId,
      type: 'PAYMENT',
      referenceId: `pay_${Date.now()}`,
      referenceNumber: `REC-${Date.now().toString().slice(-4)}`,
      debit: 0,
      credit: amount,
      balance: newTotalDue,
      notes: notes || `Payment received via ${paymentMethod}`,
      date: now,
    });

    // Record Payment
    this.recordPayment({
      businessId,
      customerId,
      type: 'CUSTOMER_PAYMENT',
      amount,
      paymentMethod,
      notes: notes || `Customer payment from ${cust.name}`,
      recordedByUserId,
      recordedByUserName,
      createdAt: now,
    });

    this.logActivity({
      businessId,
      userId: recordedByUserId,
      userName: recordedByUserName,
      userRole,
      action: 'Recorded Customer Payment',
      entity: 'PAYMENT',
      entityId: customerId,
      details: `Received Rs. ${amount} from ${cust.name} (${paymentMethod}). New balance due: Rs. ${newTotalDue}`,
    });

    return { success: true };
  },

  // SUPPLIER PURCHASES & LEDGER
  getPurchases(businessId: string): Purchase[] {
    const all = readStorage<Purchase[]>(STORAGE_KEYS.PURCHASES, []);
    return all.filter((p) => p.businessId === businessId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createPurchaseTransaction(params: {
    businessId: string;
    supplierId: string;
    supplierName: string;
    items: {
      productId: string;
      productName: string;
      sku: string;
      unit: string;
      quantity: number;
      purchasePrice: number;
    }[];
    paidAmount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    userId: string;
    userName: string;
    userRole: UserRole;
  }): { success: boolean; error?: string } {
    const { businessId, supplierId, supplierName, items, paidAmount, paymentMethod, notes, userId, userName, userRole } = params;

    if (!items || items.length === 0) return { success: false, error: 'No items in purchase' };

    let grandTotal = 0;
    const validatedItems = items.map((i) => {
      const lineTotal = i.quantity * i.purchasePrice;
      grandTotal += lineTotal;
      return { ...i, total: lineTotal };
    });

    const safePaid = Math.max(0, Math.min(paidAmount, grandTotal));
    const dueAmount = Math.max(0, grandTotal - safePaid);

    const now = new Date().toISOString();
    const purchaseId = `po_${Date.now()}`;
    const purchaseNumber = `PO-${Date.now().toString().slice(-4)}`;

    const newPurchase: Purchase = {
      id: purchaseId,
      businessId,
      purchaseNumber,
      supplierId,
      supplierName,
      items: validatedItems,
      subtotal: grandTotal,
      tax: 0,
      discount: 0,
      grandTotal,
      paidAmount: safePaid,
      dueAmount,
      paymentMethod,
      paymentStatus: dueAmount === 0 ? 'PAID' : safePaid > 0 ? 'PARTIAL' : 'UNPAID',
      notes,
      recordedByUserId: userId,
      recordedByUserName: userName,
      createdAt: now,
    };

    // 1. ATOMIC: Increase Product Stock & Update Purchase Price
    const allProducts = readStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    for (const item of validatedItems) {
      const idx = allProducts.findIndex((p) => p.id === item.productId);
      if (idx >= 0) {
        allProducts[idx].stockQuantity += item.quantity;
        allProducts[idx].purchasePrice = item.purchasePrice; // update latest cost
        allProducts[idx].updatedAt = now;
      }
    }
    writeStorage(STORAGE_KEYS.PRODUCTS, allProducts);

    // 2. Save Purchase
    const allPurchases = readStorage<Purchase[]>(STORAGE_KEYS.PURCHASES, []);
    allPurchases.push(newPurchase);
    writeStorage(STORAGE_KEYS.PURCHASES, allPurchases);

    // 3. Update Supplier & Ledger
    const suppliers = this.getSuppliers(businessId);
    const supp = suppliers.find((s) => s.id === supplierId);
    if (supp) {
      const newTotalPurchases = (supp.totalPurchases || 0) + grandTotal;
      const newTotalPaid = (supp.totalPaid || 0) + safePaid;
      const newTotalDue = (supp.totalDue || 0) + dueAmount;

      this.saveSupplier({
        ...supp,
        totalPurchases: newTotalPurchases,
        totalPaid: newTotalPaid,
        totalDue: newTotalDue,
      });

      // Supplier ledger
      const allSuppLedger = readStorage<SupplierLedgerEntry[]>(STORAGE_KEYS.SUPPLIER_LEDGER, []);
      allSuppLedger.push({
        id: `s_led_${Date.now()}`,
        businessId,
        supplierId,
        type: 'PURCHASE',
        referenceId: purchaseId,
        referenceNumber: purchaseNumber,
        debit: safePaid,
        credit: grandTotal,
        balance: newTotalDue,
        notes: `Purchase ${purchaseNumber}`,
        date: now,
      });
      writeStorage(STORAGE_KEYS.SUPPLIER_LEDGER, allSuppLedger);
    }

    // 4. Activity Log
    this.logActivity({
      businessId,
      userId,
      userName,
      userRole,
      action: 'Created Purchase Order',
      entity: 'PURCHASE',
      entityId: purchaseId,
      details: `${purchaseNumber}: Stock In from ${supplierName}. Total: Rs. ${grandTotal}`,
    });

    return { success: true };
  },

  getSupplierLedger(supplierId: string): SupplierLedgerEntry[] {
    const all = readStorage<SupplierLedgerEntry[]>(STORAGE_KEYS.SUPPLIER_LEDGER, []);
    return all.filter((l) => l.supplierId === supplierId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  recordSupplierPayment(params: {
    businessId: string;
    supplierId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    recordedByUserId: string;
    recordedByUserName: string;
    userRole: UserRole;
  }): { success: boolean; error?: string } {
    const { businessId, supplierId, amount, paymentMethod, notes, recordedByUserId, recordedByUserName, userRole } = params;

    if (amount <= 0) return { success: false, error: 'Payment amount must be greater than zero' };

    const suppliers = this.getSuppliers(businessId);
    const supp = suppliers.find((s) => s.id === supplierId);
    if (!supp) return { success: false, error: 'Supplier not found' };

    const now = new Date().toISOString();
    const newTotalPaid = (supp.totalPaid || 0) + amount;
    const newTotalDue = Math.max(0, (supp.totalDue || 0) - amount);

    this.saveSupplier({
      ...supp,
      totalPaid: newTotalPaid,
      totalDue: newTotalDue,
    });

    // Supplier ledger
    const allSuppLedger = readStorage<SupplierLedgerEntry[]>(STORAGE_KEYS.SUPPLIER_LEDGER, []);
    allSuppLedger.push({
      id: `s_led_${Date.now()}`,
      businessId,
      supplierId,
      type: 'PAYMENT',
      referenceId: `pay_${Date.now()}`,
      referenceNumber: `PAY-${Date.now().toString().slice(-4)}`,
      debit: amount,
      credit: 0,
      balance: newTotalDue,
      notes: notes || `Supplier payment via ${paymentMethod}`,
      date: now,
    });
    writeStorage(STORAGE_KEYS.SUPPLIER_LEDGER, allSuppLedger);

    this.recordPayment({
      businessId,
      supplierId,
      type: 'SUPPLIER_PAYMENT',
      amount,
      paymentMethod,
      notes: notes || `Payment to supplier ${supp.name}`,
      recordedByUserId,
      recordedByUserName,
      createdAt: now,
    });

    this.logActivity({
      businessId,
      userId: recordedByUserId,
      userName: recordedByUserName,
      userRole,
      action: 'Paid Supplier',
      entity: 'PAYMENT',
      entityId: supplierId,
      details: `Paid Rs. ${amount} to ${supp.name} (${paymentMethod}). Remaining owed: Rs. ${newTotalDue}`,
    });

    return { success: true };
  },

  // RETURNS & REFUNDS (ATOMIC OPERATION)
  getReturns(businessId: string): ReturnTransaction[] {
    const all = readStorage<ReturnTransaction[]>(STORAGE_KEYS.RETURNS, []);
    return all.filter((r) => r.businessId === businessId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  processReturn(params: {
    businessId: string;
    invoiceId: string;
    itemsToReturn: {
      productId: string;
      quantity: number;
      restockEligible: boolean;
    }[];
    reason: string;
    refundMethod: PaymentMethod;
    userId: string;
    userName: string;
    userRole: UserRole;
  }): { success: boolean; error?: string } {
    const { businessId, invoiceId, itemsToReturn, reason, refundMethod, userId, userName, userRole } = params;

    const invoices = this.getInvoices(businessId);
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return { success: false, error: 'Invoice not found' };

    let totalRefundAmount = 0;
    const returnItemsDetailed = [];
    const allProducts = readStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const now = new Date().toISOString();

    for (const ret of itemsToReturn) {
      const lineItem = inv.items.find((i) => i.productId === ret.productId);
      if (!lineItem) {
        return { success: false, error: 'Item does not belong to this invoice' };
      }

      const alreadyReturned = lineItem.returnedQuantity || 0;
      const maxReturnable = lineItem.quantity - alreadyReturned;

      if (ret.quantity <= 0 || ret.quantity > maxReturnable) {
        return {
          success: false,
          error: `Cannot return ${ret.quantity} for "${lineItem.productName}". Max returnable: ${maxReturnable}`,
        };
      }

      // Proportional unit price after discount
      const effectiveUnitPrice = lineItem.total / lineItem.quantity;
      const refundForLine = effectiveUnitPrice * ret.quantity;
      totalRefundAmount += refundForLine;

      returnItemsDetailed.push({
        productId: ret.productId,
        productName: lineItem.productName,
        returnedQuantity: ret.quantity,
        refundUnitPrice: effectiveUnitPrice,
        totalRefund: refundForLine,
        restockEligible: ret.restockEligible,
      });

      // Update lineItem returnedQuantity
      lineItem.returnedQuantity = alreadyReturned + ret.quantity;

      // ATOMIC: Restock inventory if eligible
      if (ret.restockEligible) {
        const pIdx = allProducts.findIndex((p) => p.id === ret.productId);
        if (pIdx >= 0) {
          allProducts[pIdx].stockQuantity += ret.quantity;
          allProducts[pIdx].updatedAt = now;
        }
      }
    }

    writeStorage(STORAGE_KEYS.PRODUCTS, allProducts);

    // Update Invoice status & profit
    const allItemsFullyReturned = inv.items.every((it) => (it.returnedQuantity || 0) >= it.quantity);
    inv.status = allItemsFullyReturned ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    inv.updatedAt = now;
    const allInvoices = readStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const invIdx = allInvoices.findIndex((i) => i.id === invoiceId);
    if (invIdx >= 0) allInvoices[invIdx] = inv;
    writeStorage(STORAGE_KEYS.INVOICES, allInvoices);

    // Save Return Transaction
    const returnTxId = `ret_${Date.now()}`;
    const returnRecord: ReturnTransaction = {
      id: returnTxId,
      businessId,
      invoiceId,
      invoiceNumber: inv.invoiceNumber,
      customerId: inv.customerId,
      customerName: inv.customerName,
      items: returnItemsDetailed,
      totalRefundAmount,
      reason,
      refundMethod,
      recordedByUserId: userId,
      recordedByUserName: userName,
      createdAt: now,
    };
    const allReturns = readStorage<ReturnTransaction[]>(STORAGE_KEYS.RETURNS, []);
    allReturns.push(returnRecord);
    writeStorage(STORAGE_KEYS.RETURNS, allReturns);

    // Adjust Customer Ledger & balance if registered customer
    if (inv.customerId && inv.customerId !== 'cust_walkin') {
      const customers = this.getCustomers(businessId);
      const cust = customers.find((c) => c.id === inv.customerId);
      if (cust) {
        const newTotalDue = Math.max(0, (cust.totalDue || 0) - totalRefundAmount);
        this.saveCustomer({ ...cust, totalDue: newTotalDue });

        this.addCustomerLedgerEntry({
          businessId,
          customerId: inv.customerId,
          type: 'RETURN',
          referenceId: returnTxId,
          referenceNumber: `RET-${inv.invoiceNumber}`,
          debit: 0,
          credit: totalRefundAmount,
          balance: newTotalDue,
          notes: `Return on ${inv.invoiceNumber}: ${reason}`,
          date: now,
        });
      }
    }

    this.logActivity({
      businessId,
      userId,
      userName,
      userRole,
      action: 'Processed Return',
      entity: 'RETURN',
      entityId: returnTxId,
      details: `Returned items for ${inv.invoiceNumber}. Total Refund: Rs. ${totalRefundAmount}`,
    });

    return { success: true };
  },

  // EXPENSES
  getExpenses(businessId: string): Expense[] {
    const all = readStorage<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    return all.filter((e) => e.businessId === businessId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  saveExpense(expense: Expense, actor?: { id: string; name: string; role: UserRole }): void {
    const all = readStorage<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const idx = all.findIndex((e) => e.id === expense.id);
    if (idx >= 0) {
      all[idx] = expense;
    } else {
      all.push(expense);
    }
    writeStorage(STORAGE_KEYS.EXPENSES, all);

    if (actor) {
      this.logActivity({
        businessId: expense.businessId,
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role,
        action: 'Recorded Expense',
        entity: 'EXPENSE',
        entityId: expense.id,
        details: `${expense.title}: Rs. ${expense.amount} (${expense.category})`,
      });
    }
  },
  deleteExpense(id: string): void {
    const all = readStorage<Expense[]>(STORAGE_KEYS.EXPENSES, []).filter((e) => e.id !== id);
    writeStorage(STORAGE_KEYS.EXPENSES, all);
  },

  // CALCULATIONS HISTORY
  getCalculations(businessId: string): CalculationRecord[] {
    const all = readStorage<CalculationRecord[]>(STORAGE_KEYS.CALCULATIONS, []);
    return all.filter((c) => c.businessId === businessId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  saveCalculation(calc: CalculationRecord): void {
    const all = readStorage<CalculationRecord[]>(STORAGE_KEYS.CALCULATIONS, []);
    all.unshift(calc);
    // keep maximum 200 calculations
    if (all.length > 200) all.length = 200;
    writeStorage(STORAGE_KEYS.CALCULATIONS, all);
  },
  deleteCalculation(id: string): void {
    const all = readStorage<CalculationRecord[]>(STORAGE_KEYS.CALCULATIONS, []).filter((c) => c.id !== id);
    writeStorage(STORAGE_KEYS.CALCULATIONS, all);
  },
  clearCalculations(businessId: string): void {
    const all = readStorage<CalculationRecord[]>(STORAGE_KEYS.CALCULATIONS, []).filter((c) => c.businessId !== businessId);
    writeStorage(STORAGE_KEYS.CALCULATIONS, all);
  },

  // ACTIVITY LOGS
  getActivityLogs(businessId: string): ActivityLog[] {
    const all = readStorage<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
    return all.filter((a) => a.businessId === businessId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  logActivity(log: Omit<ActivityLog, 'id' | 'createdAt'>): void {
    const all = readStorage<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
    const newLog: ActivityLog = {
      ...log,
      id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    all.unshift(newLog);
    if (all.length > 500) all.length = 500;
    writeStorage(STORAGE_KEYS.ACTIVITY_LOGS, all);
  },

  // PAYMENTS RECORD LOG
  getPayments(businessId: string): PaymentRecord[] {
    const all = readStorage<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, []);
    return all.filter((p) => p.businessId === businessId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  recordPayment(payment: Omit<PaymentRecord, 'id'>): void {
    const all = readStorage<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, []);
    const newPay: PaymentRecord = {
      ...payment,
      id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };
    all.push(newPay);
    writeStorage(STORAGE_KEYS.PAYMENTS, all);
  },

  // HARDWARE SETTINGS
  getHardwareSettings(): HardwareSettings {
    return readStorage<HardwareSettings>(STORAGE_KEYS.HARDWARE_SETTINGS, DEFAULT_HARDWARE);
  },
  saveHardwareSettings(settings: HardwareSettings): void {
    writeStorage(STORAGE_KEYS.HARDWARE_SETTINGS, settings);
  },

  // EXPORT / IMPORT ALL DATA
  exportFullBackup(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        businesses: readStorage(STORAGE_KEYS.BUSINESSES, []),
        users: readStorage(STORAGE_KEYS.USERS, []),
        products: readStorage(STORAGE_KEYS.PRODUCTS, []),
        customers: readStorage(STORAGE_KEYS.CUSTOMERS, []),
        suppliers: readStorage(STORAGE_KEYS.SUPPLIERS, []),
        invoices: readStorage(STORAGE_KEYS.INVOICES, []),
        payments: readStorage(STORAGE_KEYS.PAYMENTS, []),
        customerLedger: readStorage(STORAGE_KEYS.CUSTOMER_LEDGER, []),
        supplierLedger: readStorage(STORAGE_KEYS.SUPPLIER_LEDGER, []),
        purchases: readStorage(STORAGE_KEYS.PURCHASES, []),
        expenses: readStorage(STORAGE_KEYS.EXPENSES, []),
        returns: readStorage(STORAGE_KEYS.RETURNS, []),
        calculations: readStorage(STORAGE_KEYS.CALCULATIONS, []),
        activityLogs: readStorage(STORAGE_KEYS.ACTIVITY_LOGS, []),
        hardwareSettings: readStorage(STORAGE_KEYS.HARDWARE_SETTINGS, DEFAULT_HARDWARE),
      },
    };
    return JSON.stringify(backup, null, 2);
  },

  importFullBackup(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data || !Array.isArray(parsed.data.businesses) || !Array.isArray(parsed.data.products)) {
        return { success: false, error: 'Invalid backup file structure' };
      }
      const d = parsed.data;
      if (d.businesses) writeStorage(STORAGE_KEYS.BUSINESSES, d.businesses);
      if (d.users) writeStorage(STORAGE_KEYS.USERS, d.users);
      if (d.products) writeStorage(STORAGE_KEYS.PRODUCTS, d.products);
      if (d.customers) writeStorage(STORAGE_KEYS.CUSTOMERS, d.customers);
      if (d.suppliers) writeStorage(STORAGE_KEYS.SUPPLIERS, d.suppliers);
      if (d.invoices) writeStorage(STORAGE_KEYS.INVOICES, d.invoices);
      if (d.payments) writeStorage(STORAGE_KEYS.PAYMENTS, d.payments);
      if (d.customerLedger) writeStorage(STORAGE_KEYS.CUSTOMER_LEDGER, d.customerLedger);
      if (d.supplierLedger) writeStorage(STORAGE_KEYS.SUPPLIER_LEDGER, d.supplierLedger);
      if (d.purchases) writeStorage(STORAGE_KEYS.PURCHASES, d.purchases);
      if (d.expenses) writeStorage(STORAGE_KEYS.EXPENSES, d.expenses);
      if (d.returns) writeStorage(STORAGE_KEYS.RETURNS, d.returns);
      if (d.calculations) writeStorage(STORAGE_KEYS.CALCULATIONS, d.calculations);
      if (d.activityLogs) writeStorage(STORAGE_KEYS.ACTIVITY_LOGS, d.activityLogs);
      if (d.hardwareSettings) writeStorage(STORAGE_KEYS.HARDWARE_SETTINGS, d.hardwareSettings);

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Invalid JSON file' };
    }
  },

  resetToDefault(): void {
    localStorage.clear();
    initializeStorage();
  },
};
