const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const API_URL =
  rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')
    ? rawApiUrl.replace(/\/$/, '')
    : `https://${rawApiUrl.replace(/\/$/, '')}`;

export class ApiRequestError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.data = data;
  }
}

function getGuestCartId() {
  if (typeof window === 'undefined') return '';

  const key = 'clasiccloset_guest_cart_id';
  let id = window.localStorage.getItem(key);

  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }

  return id;
}

function getAccessToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('clasiccloset_access_token') || '';
}

function saveAccessToken(data: any) {
  if (typeof window === 'undefined') return;
  const token = data?.data?.accessToken || data?.accessToken;
  if (token) window.localStorage.setItem('clasiccloset_access_token', token);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const isServer = typeof window === 'undefined';

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const guestCartId = getGuestCartId();
  if (guestCartId) headers.set('X-Cart-Session', guestCartId);

  const accessToken = getAccessToken();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
    ...(isServer ? { next: { revalidate: 60 } } : { cache: 'no-store' }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (data as any)?.message ||
      (data as any)?.error ||
      `API request failed with status ${res.status}`;

    throw new ApiRequestError(message, res.status, data);
  }

  return data as T;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, options);
}

async function authRequest(path: string, body?: any) {
  const data = await request<any>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
  saveAccessToken(data);
  return data;
}

export const api = {
  products: (q = '') => request<any>(`/api/products${q}`),
  product: (slug: string) => request<any>(`/api/products/${slug}`),

  register: (body: any) => authRequest('/api/auth/register', body),
  login: (body: any) => authRequest('/api/auth/login', body),
  me: () => request<any>('/api/auth/me'),
  logout: async () => {
    const data = await request<any>('/api/auth/logout', { method: 'POST' });
    if (typeof window !== 'undefined') window.localStorage.removeItem('clasiccloset_access_token');
    return data;
  },

  // Canonical verification methods
  sendEmailCode: (email: string) =>
    authRequest('/api/auth/send-email-code', { email }),
  verifyEmailCode: (email: string, code: string) =>
    authRequest('/api/auth/verify-email-code', { email, code }),
  sendPhoneCode: (phone: string) =>
    authRequest('/api/auth/send-phone-code', { phone }),
  verifyPhoneCode: (phone: string, code: string) =>
    authRequest('/api/auth/verify-phone-code', { phone, code }),

  // Backward-compatible aliases used by different login page versions
  verifyEmail: (code: string, email?: string) =>
    authRequest('/api/auth/verify-email-code', { email, code }),
  verifyPhone: (code: string, phone?: string) =>
    authRequest('/api/auth/verify-phone-code', { phone, code }),
  sendEmailOtp: (email?: string) =>
    authRequest('/api/auth/send-email-code', email ? { email } : {}),
  sendPhoneOtp: (phone?: string) =>
    authRequest('/api/auth/send-phone-code', phone ? { phone } : {}),
  verifyEmailOtp: (code: string, email?: string) =>
    authRequest('/api/auth/verify-email-code', { email, code }),
  verifyPhoneOtp: (code: string, phone?: string) =>
    authRequest('/api/auth/verify-phone-code', { phone, code }),

  cart: () => request<any>('/api/cart'),
  addCart: (productId: string, quantity = 1) =>
    request<any>('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),
  updateCart: (id: string, quantity: number) =>
    request<any>(`/api/cart/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
  removeCart: (id: string) =>
    request<any>(`/api/cart/items/${id}`, { method: 'DELETE' }),

  checkout: (body: any) =>
    request<any>('/api/checkout', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  paystack: (orderId: string) =>
    request<any>(`/api/payments/paystack/initialize/${orderId}`, {
      method: 'POST',
    }),
  verifyPaystack: (reference: string) =>
    request<any>(`/api/payments/paystack/verify/${reference}`),
  mpesa: (orderId: string, phoneNumber: string) =>
    request<any>(`/api/payments/mpesa/stk/${orderId}`, {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    }),

  orders: () => request<any>('/api/orders/mine'),
  newsletter: (email: string) =>
    request<any>('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};
