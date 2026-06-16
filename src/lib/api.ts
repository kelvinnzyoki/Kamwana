const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
  if (typeof window !== 'undefined')
    window.localStorage.removeItem(GUEST_CART_KEY);
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
  if (typeof window !== 'undefined')
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

// ─── Auto-refresh ─────────────────────────────────────────────────────────────
// On 401: attempt POST /api/auth/refresh, save the new access token, then
// retry the original request once. Concurrent 401s share a single in-flight
// refresh promise to avoid race conditions.
//
// FIX: removed the global redirect-to-/login on failed refresh.
//
// Root cause of "every page redirects to login": the Navbar calls
// api.me() on EVERY page to determine whether to show "Sign in" or the
// user menu. For a guest (no session), /api/auth/me returns 401. The old
// code then tried /api/auth/refresh, which ALSO fails for a guest (no
// refresh cookie), and called redirectToLogin() — yanking every guest off
// every page just for the Navbar checking auth status.
//
// 401 after a failed refresh simply means "not logged in", which is the
// NORMAL state for guests browsing the shop. Pages that actually REQUIRE
// auth (checkout, orders, account) already handle this themselves via
// their own useEffect redirects or inline "please sign in" CTAs — that
// page-level handling is the correct place for this decision, not a
// global interceptor.

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

async function request<T>(
  path: string,
  options: RequestInit = {},
  _isRetry = false
): Promise<T> {
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const isServer = typeof window === 'undefined';

  // Only skip the refresh interceptor for the auth-flow endpoints themselves.
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

    // Not logged in / session truly expired. Clear the stale access token
    // and let the CALLER decide what to do — do not redirect globally.
    clearAccessToken();
    throw new ApiRequestError('Not authenticated', 401, {});
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
  const data = await request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  saveAccessToken(data);
  clearGuestCartId();
  return data;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  return request<T>(path, options);
}

export const api = {
  products: (query = '') => request<any>(`/api/products${query}`),
  product: (slug: string) => request<any>(`/api/products/${slug}`),

  register: (body: any) => authRequest<any>('/api/auth/register', body),
  login: (body: any) => authRequest<any>('/api/auth/login', body),
  me: () => request<any>('/api/auth/me'),
  updateProfile: (body: { name: string }) =>
    request<any>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  logout: async () => {
    // FIX: try/finally — ALWAYS clear local state, even if the network
    // call fails (CORS hiccup, offline, browser blocking the request).
    //
    // The Bearer token in localStorage takes precedence over cookies in
    // getUserFromRequest() on the backend. If clearAccessToken() never
    // ran because the request threw before reaching this line, the old
    // access token stays in localStorage and is sent on every subsequent
    // request — the user appears "still logged in" in THIS browser for
    // up to 15 minutes (until the access token naturally expires),
    // regardless of what happened to the cookies server-side.
    try {
      return await request<any>('/api/auth/logout', { method: 'POST' });
    } finally {
      clearAccessToken();
      clearGuestCartId();
    }
  },

  sendPhoneOtp: () =>
    request<any>('/api/auth/phone/send-otp', { method: 'POST' }),
  verifyPhone: (code: string) =>
    request<any>('/api/auth/phone/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  sendEmailOtp: () =>
    request<any>('/api/auth/email/send-otp', { method: 'POST' }),
  verifyEmail: (code: string) =>
    request<any>('/api/auth/email/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  cart: () => request<any>('/api/cart'),
  addCart: (productId: string, quantity = 1, size?: string) =>
    request<any>('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, size }),
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
  order: (id: string) => request<any>(`/api/orders/${id}`),

  newsletter: (email: string) =>
    request<any>('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};
