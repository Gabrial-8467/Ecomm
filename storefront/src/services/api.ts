const BASE_URL = '/api/v1';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; message?: string }> {
  const sessionId = localStorage.getItem('apex_session_id') || `sess_${Math.random().toString(36).substring(2)}`;
  localStorage.setItem('apex_session_id', sessionId);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-id': sessionId,
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || 'Network request failed');
  }

  return json;
}

export const api = {
  // Products
  getProducts: (query = '') => apiFetch<any>(`/products${query ? `?${query}` : ''}`),
  getProductBySlug: (slug: string) => apiFetch<any>(`/products/${slug}`),

  // Categories & Brands
  getCategories: (dept = '') => apiFetch<any[]>(`/categories${dept ? `?department=${dept}` : ''}`),
  getBrands: () => apiFetch<any[]>('/brands'),

  // Cart
  getCart: () => apiFetch<any>('/cart'),
  addToCart: (productId: string, variantId: string, quantity = 1) =>
    apiFetch<any>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, variantId, quantity }),
    }),
  updateCartItem: (id: string, quantity: number) =>
    apiFetch<any>(`/cart/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),
  removeCartItem: (id: string) =>
    apiFetch<any>(`/cart/items/${id}`, {
      method: 'DELETE',
    }),

  // Orders & Checkout
  getCheckoutSummary: (items: any[], couponCode?: string) =>
    apiFetch<any>('/orders/summary', {
      method: 'POST',
      body: JSON.stringify({ items, couponCode }),
    }),
  createOrder: (payload: any) =>
    apiFetch<any>('/orders/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  verifyPayment: (payload: any) =>
    apiFetch<any>('/orders/verify-payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Legal & Grievances
  getLegalDoc: (type: string) => apiFetch<any>(`/legal/documents/${type}`),
  submitGrievance: (data: any) =>
    apiFetch<any>('/legal/grievances', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  trackGrievance: (ticketNumber: string) =>
    apiFetch<any>(`/legal/grievances/track/${ticketNumber}`),
  recordConsent: (purpose: string, hasConsented: boolean) =>
    apiFetch<any>('/legal/consent', {
      method: 'POST',
      body: JSON.stringify({ purpose, hasConsented }),
    }),

  // Store Settings
  getStoreSettings: () => apiFetch<any>('/settings'),
};
