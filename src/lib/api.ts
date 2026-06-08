const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const API_URL =
  rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')
    ? rawApiUrl.replace(/\/$/, '')
    : `https://${rawApiUrl.replace(/\/$/, '')}`;

const ACCESS_TOKEN_KEY = 'classic_closet_access_token';
const GUEST_CART_KEY = 'classic_closet_guest_cart_id';

export class ApiRequestError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.data = data;
  }
}

function isBrowser() {
  return typeof window !== 'undefined';
}

function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function saveAccessToken(data: unknown) {
  if (!isBrowser()) return;
  const token = (data as any)?.data?.accessToken || (data as any)?.accessToken;
  if (typeof token === 'string' && token.length > 20) localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

function clearAccessToken() {
  if (isBrowser()) localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function getGuestCartId(): string | null {
  if (!isBrowser()) return null;
  let id = localStorage.getItem(GUEST_CART_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_CART_KEY, id);
  }
  return id;
}

function clearGuestCartId() {
  if (isBrowser()) localStorage.removeItem(GUEST_CART_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const token = getAccessToken();
  const guestCartId = getGuestCartId();
  const isServer = typeof window === 'undefined';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (guestCartId) headers['X-Cart-Session'] = guestCartId;

  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers,
      ...(isServer ? { next: { revalidate: 60 } } : { cache: 'no-store' }),
    });
  } catch (err) {
    throw new ApiRequestError(`Network error — cannot reach ${API_URL}`, 0, err);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) clearAccessToken();
    throw new ApiRequestError((data as any)?.message || `Request failed with status ${response.status}`, response.status, data);
  }

  return data as T;
}

async function authRequest<T>(path: string, body: unknown): Promise<T> {
  const data = await request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  saveAccessToken(data);
  clearGuestCartId();
  return data;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, options);
}

export const api = {
  products: (q = '') => request<any>(`/api/products${q}`),
  product: (slug: string) => request<any>(`/api/products/${slug}`),

  register: (body: any) => authRequest<any>('/api/auth/register', body),
  login: (body: any) => authRequest<any>('/api/auth/login', body),

  // Verification helpers used by the login/signup page.
  // The aliases keep older page.tsx versions compiling while using the same backend routes.
  sendEmailCode: (email: string) =>
    request<any>('/api/auth/send-email-code', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyEmailCode: (target: string, code: string) =>
    request<any>('/api/auth/verify-email-code', { method: 'POST', body: JSON.stringify({ target, code }) }),
  sendPhoneCode: (phone: string) =>
    request<any>('/api/auth/send-phone-code', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyPhoneCode: (target: string, code: string) =>
    request<any>('/api/auth/verify-phone-code', { method: 'POST', body: JSON.stringify({ target, code }) }),
  verifyEmail: (email: string) =>
    request<any>('/api/auth/send-email-code', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyPhone: (phone: string) =>
    request<any>('/api/auth/send-phone-code', { method: 'POST', body: JSON.stringify({ phone }) }),

  me: () => request<any>('/api/auth/me'),
  logout: async () => {
    const result = await request<any>('/api/auth/logout', { method: 'POST' });
    clearAccessToken();
    clearGuestCartId();
    return result;
  },

  cart: () => request<any>('/api/cart'),
  addCart: (productId: string, quantity = 1) =>
    request<any>('/api/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  updateCart: (id: string, quantity: number) =>
    request<any>(`/api/cart/items/${id}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  removeCart: (id: string) => request<any>(`/api/cart/items/${id}`, { method: 'DELETE' }),

  checkout: (body: any) => request<any>('/api/checkout', { method: 'POST', body: JSON.stringify(body) }),
  paystack: (orderId: string) => request<any>(`/api/payments/paystack/initialize/${orderId}`, { method: 'POST' }),
  verifyPaystack: (reference: string) => request<any>(`/api/payments/paystack/verify/${reference}`),
  mpesa: (orderId: string, phoneNumber: string) =>
    request<any>(`/api/payments/mpesa/stk/${orderId}`, { method: 'POST', body: JSON.stringify({ phoneNumber }) }),

  orders: () => request<any>('/api/orders/mine'),
  newsletter: (email: string) =>
    request<any>('/api/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email }) }),
};
