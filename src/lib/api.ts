// ─── Config ───────────────────────────────────────────────────────────────────

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bio.cctamcc.site';

function normalizeApiUrl(value: string): string {
  let url = value.trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  // Guard against NEXT_PUBLIC_API_URL being set to https://domain.com/api
  if (url.endsWith('/api')) url = url.slice(0, -4);
  return url;
}

const API_URL = normalizeApiUrl(rawApiUrl);
const GUEST_CART_KEY = 'classic_closet_guest_cart_id';
const ACCESS_TOKEN_KEY = 'classic_closet_access_token';

// ─── Error class ──────────────────────────────────────────────────────────────

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

// ─── Storage helpers ──────────────────────────────────────────────────────────

/**
 * Returns the guest cart session ID, creating one on first call.
 * Lives in localStorage so it survives page navigation and refreshes.
 * This is what enables the Jumia/Amazon style "add to cart without login".
 */
export function getGuestCartId(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  let sessionId = window.localStorage.getItem(GUEST_CART_KEY);

  if (!sessionId) {
    sessionId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(GUEST_CART_KEY, sessionId);
  }

  return sessionId;
}

/** Clear guest cart ID after it has been merged into a user cart on login */
export function clearGuestCartId(): void {
  if (typeof window === 'undefined') return;
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
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

// ─── Core request ─────────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const isServer = typeof window === 'undefined';

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  // Always attach the guest cart session header — the backend reads this on
  // every cart and checkout request. Even authenticated users send it so the
  // backend can merge any pre-login cart items automatically on login.
  const guestCartId = getGuestCartId();
  if (guestCartId) headers['X-Cart-Session'] = guestCartId;

  // Attach access token if present — backend accepts both cookie and Bearer
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
      `Network error — cannot reach ${API_URL}. ` +
        'Check NEXT_PUBLIC_API_URL on the frontend and CORS/FRONTEND_URL on the backend.',
      0,
      networkError
    );
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

/** Used for auth endpoints that return an accessToken — saves it automatically */
async function authRequest<T>(path: string, body: unknown): Promise<T> {
  const data = await request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  saveAccessToken(data);
  // After login, the guest cart is merged server-side.
  // Clear the local guest cart ID so a new guest session starts clean.
  clearGuestCartId();
  return data;
}

// ─── Public API surface ───────────────────────────────────────────────────────

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, options);
}

export const api = {
  // Products — server-side compatible (no auth required)
  products: (query = '') => request<any>(`/api/products${query}`),
  product: (slug: string) => request<any>(`/api/products/${slug}`),

  // Auth
  register: (body: any) => authRequest<any>('/api/auth/register', body),
  login: (body: any) => authRequest<any>('/api/auth/login', body),
  me: () => request<any>('/api/auth/me'),
  logout: async () => {
    const result = await request<any>('/api/auth/logout', { method: 'POST' });
    clearAccessToken();
    clearGuestCartId();
    return result;
  },

  // Phone OTP verification (user must be logged in)
  sendPhoneOtp: () =>
    request<any>('/api/auth/phone/send-otp', { method: 'POST' }),
  verifyPhone: (code: string) =>
    request<any>('/api/auth/phone/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  // Cart — works for both guests and authenticated users.
  // The X-Cart-Session header is attached automatically by request().
  // Guests: cart persists in Postgres keyed by their sessionId UUID.
  // On login: the backend merges their guest cart into their user cart.
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

  // Checkout & payments — these require auth; redirect to /login?next=/checkout if 401
  checkout: (body: any) =>
    request<any>('/api/checkout', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  paystack: (orderId: string) =>
    request<any>(`/api/payments/paystack/initialize/${orderId}`, { method: 'POST' }),
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
