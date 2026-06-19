import { apiFetch } from '@/lib/api';

// ─── Admin API client ───────────────────────────────────────────────────────────
// All calls hit /api/admin/*, which is gated server-side by requireAdmin.
// A non-admin user calling any of these gets a 403 from the backend —
// the frontend additionally checks role before rendering the dashboard
// at all (see admin/layout.tsx).

export const adminApi = {
  stats: () => apiFetch<any>('/api/admin/stats'),

  orders: (params: { status?: string; search?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.search) qs.set('search', params.search);
    if (params.page) qs.set('page', String(params.page));
    return apiFetch<any>(`/api/admin/orders?${qs.toString()}`);
  },

  updateOrderStatus: (id: string, status: string) =>
    apiFetch<any>(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  products: (params: { search?: string; category?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.category) qs.set('category', params.category);
    if (params.page) qs.set('page', String(params.page));
    return apiFetch<any>(`/api/admin/products?${qs.toString()}`);
  },

  createProduct: (body: any) =>
    apiFetch<any>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateProduct: (id: string, body: any) =>
    apiFetch<any>(`/api/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteProduct: (id: string, hard = false) =>
    apiFetch<any>(`/api/admin/products/${id}${hard ? '?hard=true' : ''}`, {
      method: 'DELETE',
    }),

  customers: (params: { search?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.page) qs.set('page', String(params.page));
    return apiFetch<any>(`/api/admin/customers?${qs.toString()}`);
  },
};
