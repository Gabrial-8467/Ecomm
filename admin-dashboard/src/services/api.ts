const BASE_URL = '/api/v1';

export async function adminFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; message?: string }> {
  const token = localStorage.getItem('apex_admin_token') || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message || 'Admin API request failed');
  }

  return json;
}

export const adminApi = {
  // Auth
  login: (credentials: any) =>
    adminFetch<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => adminFetch<any>('/auth/me'),

  // Dashboard Metrics
  getDashboardMetrics: () => adminFetch<any>('/settings/dashboard-metrics'),

  // Products
  getProducts: (query = '') => adminFetch<any>(`/products${query ? `?${query}` : ''}`),
  createProduct: (payload: any) =>
    adminFetch<any>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Categories & Brands
  getCategories: () => adminFetch<any[]>('/categories'),
  getBrands: () => adminFetch<any[]>('/brands'),

  // Inventory & Stock
  getLiveStock: (query = '') => adminFetch<any[]>(`/inventory${query ? `?${query}` : ''}`),
  adjustStock: (payload: any) =>
    adminFetch<any>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getStockMovements: () => adminFetch<any[]>('/inventory/movements'),

  // Orders
  getOrders: () => adminFetch<any[]>('/orders'),
  updateOrderStatus: (id: string, status: string) =>
    adminFetch<any>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Physical Shop POS / Counter Billing
  createPosSale: (payload: any) =>
    adminFetch<any>('/billing/pos-order', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Legal & Grievances
  getLegalDoc: (type: string) => adminFetch<any>(`/legal/documents/${type}`),
  updateLegalDoc: (type: string, payload: any) =>
    adminFetch<any>(`/legal/documents/${type}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  listGrievances: () => adminFetch<any[]>('/legal/grievances'),
  updateGrievance: (id: string, payload: any) =>
    adminFetch<any>(`/legal/grievances/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Business Settings
  getSettings: () => adminFetch<any>('/settings'),
  updateSettings: (payload: any) =>
    adminFetch<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};
