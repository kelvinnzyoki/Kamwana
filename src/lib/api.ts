const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const API_URL =
  rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')
    ? rawApiUrl.replace(/\/$/, '')
    : `https://${rawApiUrl.replace(/\/$/, '')}`;

class ApiRequestError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.data = data;
  }
}

function getGuestCartId() {
  if (typeof window === 'undefined') return undefined;

  const key = 'classic_closet_guest_cart_id';
  let sessionId = window.localStorage.getItem(key);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    window.localStorage.setItem(key, sessionId);
  }

  return sessionId;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const guestCartId = getGuestCartId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(guestCartId ? { 'X-Cart-Session': guestCartId } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiRequestError(data.message || `API request failed: ${res.status}`, res.status, data);
  }

  return data as T;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, options);
}

export const api = {
  products: (q = '') => request<any>(`/api/products${q}`),

  product: (slug: string) => request<any>(`/api/products/${slug}`),

  register: (body: any) =>
    request<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: any) =>
    request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: () => request<any>('/api/auth/me'),

  logout: () =>
    request<any>('/api/auth/logout', {
      method: 'POST',
    }),

  sendEmailCode: (email: string) =>
    request<any>('/api/auth/send-email-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyEmailCode: (target: string, code: string) =>
    request<any>('/api/auth/verify-email-code', {
      method: 'POST',
      body: JSON.stringify({ target, code }),
    }),

  sendPhoneCode: (phone: string) =>
    request<any>('/api/auth/send-phone-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyPhoneCode: (target: string, code: string) =>
    request<any>('/api/auth/verify-phone-code', {
      method: 'POST',
      body: JSON.stringify({ target, code }),
    }),

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
    request<any>(`/api/cart/items/${id}`, {
      method: 'DELETE',
    }),

  checkout: (body: any) =>
    request<any>('/api/checkout', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  paystack: (orderId: string) =>
    request<any>(`/api/payments/paystack/initialize/${orderId}`, {
      method: 'POST',
    }),

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

export { ApiRequestError };
