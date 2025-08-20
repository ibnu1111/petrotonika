// Inventory Types for PT Petronika
export interface RawMaterial {
  id: number;
  name: string;
  code: string;
  description?: string;
  unit: string; // kg, liter, ton
  currentStock: number;
  minimumStock: number;
  price: number;
  supplierId: number;
  supplier?: Supplier;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinishedProduct {
  id: number;
  name: string; // DOP, DNIP, DOTP
  code: string;
  description?: string;
  unit: string; // drum, ton
  currentStock: number;
  minimumStock: number;
  price: number;
  productionCost?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: number;
  name: string;
  code: string;
  contact: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockTransaction {
  id: number;
  itemId: number;
  itemType: 'RAW_MATERIAL' | 'FINISHED_PRODUCT';
  transactionType: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  unit: string;
  reference?: string; // PO number, production batch, etc
  notes?: string;
  userId: number;
  user?: User;
  createdAt: Date;
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'VIEWER';
  isActive: boolean;
}

export interface StockMovement {
  item: string;
  type: 'IN' | 'OUT';
  quantity: number;
  unit: string;
  reference: string;
  date: Date;
  user: string;
}

export interface DashboardStats {
  totalRawMaterials: number;
  totalFinishedProducts: number;
  lowStockItems: number;
  todayTransactions: number;
  totalValue: number;
}

export interface Alert {
  id: number;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED' | 'SYSTEM';
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: Date;
}

export interface DashboardData {
  summary: {
    totalRawMaterials: number;
    totalFinishedProducts: number;
    totalSuppliers: number;
    totalTransactions: number;
    lowStockItems: number;
    outOfStockItems: number;
  };
  recentTransactions: StockTransaction[];
  alerts: Alert[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Report Types
export interface InventoryReport {
  totalValue: number;
  rawMaterials: RawMaterial[];
  finishedProducts: FinishedProduct[];
  lowStockItems: (RawMaterial | FinishedProduct)[];
  summary: {
    totalRawMaterials: number;
    totalFinishedProducts: number;
    totalValue: number;
    lowStockCount: number;
  };
}

// Transaction API Response
export interface TransactionApiData {
  id: number;
  itemId: number;
  itemType: string;
  transactionType: string;
  quantity: number;
  unit: string;
  reference: string;
  createdAt: string;
  userName: string;
}

// Stats API Response
export interface StatsApiData {
  totalRawMaterials: number;
  totalFinishedProducts: number;
  lowStockItems: number;
  todayTransactions: number;
  totalValue: number;
}

// Low Stock Alert API Response
export interface LowStockAlertData {
  id: number;
  name: string;
  code: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  type: 'RAW_MATERIAL' | 'FINISHED_PRODUCT';
}
