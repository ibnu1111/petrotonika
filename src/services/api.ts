import api from '@/lib/api';
import { 
  RawMaterial, 
  FinishedProduct, 
  Supplier, 
  StockTransaction, 
  DashboardStats,
  ApiResponse,
  PaginatedResponse 
} from '@/types/inventory';

// Raw Materials API
export const rawMaterialsApi = {
  getAll: () => api.get<PaginatedResponse<RawMaterial>>('/rawmaterials'),
  getById: (id: number) => api.get<ApiResponse<RawMaterial>>(`/rawmaterials/${id}`),
  create: (data: Omit<RawMaterial, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<RawMaterial>>('/rawmaterials', data),
  update: (id: number, data: Partial<RawMaterial>) => 
    api.put<ApiResponse<RawMaterial>>(`/rawmaterials/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/rawmaterials/${id}`),
  getLowStock: () => api.get<PaginatedResponse<RawMaterial>>('/rawmaterials/low-stock'),
};

// Finished Products API
export const finishedProductsApi = {
  getAll: () => api.get<PaginatedResponse<FinishedProduct>>('/finishedproducts'),
  getById: (id: number) => api.get<ApiResponse<FinishedProduct>>(`/finishedproducts/${id}`),
  create: (data: Omit<FinishedProduct, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<FinishedProduct>>('/finishedproducts', data),
  update: (id: number, data: Partial<FinishedProduct>) => 
    api.put<ApiResponse<FinishedProduct>>(`/finishedproducts/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/finishedproducts/${id}`),
  getLowStock: () => api.get<PaginatedResponse<FinishedProduct>>('/finishedproducts/low-stock'),
};

// Suppliers API
export const suppliersApi = {
  getAll: () => api.get<PaginatedResponse<Supplier>>('/suppliers'),
  getById: (id: number) => api.get<ApiResponse<Supplier>>(`/suppliers/${id}`),
  create: (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<Supplier>>('/suppliers', data),
  update: (id: number, data: Partial<Supplier>) => 
    api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/suppliers/${id}`),
};

// Stock Transactions API
export const stockTransactionsApi = {
  getAll: (params?: { page?: number; limit?: number; type?: string }) => 
    api.get<PaginatedResponse<StockTransaction>>('/stock-transactions', { params }),
  getById: (id: number) => api.get<ApiResponse<StockTransaction>>(`/stock-transactions/${id}`),
  create: (data: Omit<StockTransaction, 'id' | 'createdAt' | 'user'>) => 
    api.post<ApiResponse<StockTransaction>>('/stock-transactions', data),
  getByItem: (itemId: number, itemType: string) => 
    api.get<PaginatedResponse<StockTransaction>>(`/stock-transactions/item/${itemId}/${itemType}`),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),
  getRecentTransactions: (limit = 10) => 
    api.get<ApiResponse<StockTransaction[]>>(`/dashboard/recent-transactions?limit=${limit}`),
  getLowStockAlerts: () => 
    api.get<ApiResponse<Record<string, unknown>[]>>('/dashboard/low-stock-alerts'),
};

// Auth API
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    api.post<ApiResponse<{ token: string; user: Record<string, unknown> }>>('/auth/login', credentials),
  me: () => api.get<ApiResponse<Record<string, unknown>>>('/auth/me'),
};
