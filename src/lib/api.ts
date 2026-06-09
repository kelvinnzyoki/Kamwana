const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bio.cctamcc.site';

function normalizeApiUrl(value: string): string {
  let url = value.trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  if (url.endsWith('/api')) url = url.slice(0, -4);
  return url;
}

const API_URL = normalizeApiUrl(rawApiUrl);
const GUEST_CART_KEY = 'classic_closet_guest_cart_id';
const ACCESS_TOKEN_KEY = 'classic_closet_access_token';

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

export function getGuestCartId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  let id = window.localStorage.getItem(GUEST_CART_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(GUEST_CART_KEY, id);
  }
  return id;
}

export function clearGuestCartId(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(GUEST_CART_KEY);
}

function getAccessToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) || undefined;
}

function saveAccessToken(data: unknown): void {
  if (typeof window === 'undefined') return;
  const token = (data as any)?.data?.accessToken;
  if (token) window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

function clearAccessToken(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

// ─── Auto-refresh ─────────────────────────────────────────────────────────────
// On 401: attempt POST /api/auth/refresh (sends httpOnly refresh_token cookie),
// save the new access token, then retry the original request once.
// If refresh fails: clear tokens and redirect to /login.
//
// FIX: only skip the interceptor for login/register/refresh themselves.
// The previous `path.includes('/api/auth/')` was blocking refresh for /api/auth/me
// — the most-called authenticated route — causing the 15-min hard logout.

let activeRefresh: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return false;
    saveAccessToken(await res.json());
    return true;
  } catch {
    return false;
  }
}

function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  const current = window.location.pathname + window.location.search;
  if (!current.startsWith('/login')) {
    window.location.href = `/login?next=${encodeURIComponent(current)}`;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  _isRetry = false
): Promise<T> {
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const isServer = typeof window === 'undefined';

  // Only skip the refresh interceptor for the three auth-flow endpoints.
  // All other /api/auth/* routes (me, logout, phone/verify, email/verify)
  // should still auto-refresh if their access token has expired.
  const skipRefresh =
    path.includes('/api/auth/login') ||
    path.includes('/api/auth/register') ||
    path.includes('/api/auth/refresh');

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const guestCartId = getGuestCartId();
  if (guestCartId) headers['X-Cart-Session'] = guestCartId;
  const accessToken = getAccessToken();
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers,
      ...(isServer ? { next: { revalidate: 60 } } : { cache: 'no-store' }),
    });
  } catch (networkError) {
    throw new ApiRequestError(
      `Network error — cannot reach ${API_URL}. Check NEXT_PUBLIC_API_URL.`,
      0,
      networkError
    );
  }

  if (response.status === 401 && !_isRetry && !skipRefresh) {
    if (!activeRefresh) {
      activeRefresh = doRefresh().finally(() => {
        activeRefresh = null;
      });
    }
    const refreshed = await activeRefresh;
    if (refreshed) return request<T>(path, options, true);
    clearAccessToken();
    redirectToLogin();
    throw new ApiRequestError('Session expired — please sign in again', 401, {});
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiRequestError(
      (data as any)?.message || `Request failed with status ${response.status}`,
      response.status,
      data
    );
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
  // Products
  products: (query = '') => request<any>(`/api/products${query}`),
  product: (slug: string) => request<any>(`/api/products/${slug}`),

  // Auth
  register: (body: any) => authRequest<any>('/api/auth/register', body),
  login: (body: any) => authRequest<any>('/api/auth/login', body),
  me: () => request<any>('/api/auth/me'),
  logout: async () => {
    const r = await request<any>('/api/auth/logout', { method: 'POST' });
    clearAccessToken();
    clearGuestCartId();
    return r;
  },

  // Phone verification
  sendPhoneOtp: () =>
    request<any>('/api/auth/phone/send-otp', { method: 'POST' }),
  verifyPhone: (code: string) =>
    request<any>('/api/auth/phone/verify', { method: 'POST', body: JSON.stringify({ code }) }),

  // Email verification
  sendEmailOtp: () =>
    request<any>('/api/auth/email/send-otp', { method: 'POST' }),
  verifyEmail: (code: string) =>
    request<any>('/api/auth/email/verify', { method: 'POST', body: JSON.stringify({ code }) }),

  // Cart — works for guests and authenticated users
  cart: () => request<any>('/api/cart'),
  addCart: (productId: string, quantity = 1) =>
    request<any>('/api/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  updateCart: (id: string, quantity: number) =>
    request<any>(`/api/cart/items/${id}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  removeCart: (id: string) =>
    request<any>(`/api/cart/items/${id}`, { method: 'DELETE' }),

  // Checkout & payments
  checkout: (body: any) =>
    request<any>('/api/checkout', { method: 'POST', body: JSON.stringify(body) }),
  paystack: (orderId: string) =>
    request<any>(`/api/payments/paystack/initialize/${orderId}`, { method: 'POST' }),
  verifyPaystack: (reference: string) =>
    request<any>(`/api/payments/paystack/verify/${reference}`),
  mpesa: (orderId: string, phoneNumber: string) =>
    request<any>(`/api/payments/mpesa/stk/${orderId}`, {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    }),

  // Orders
  orders: () => request<any>('/api/orders/mine'),
  order: (id: string) => request<any>(`/api/orders/${id}`),

  // Newsletter
  newsletter: (email: string) =>
    request<any>('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};
