const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bio.cctamcc.site';

function normalizeApiUrl(value: string) {
  let url = value.trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  // If the env was accidentally set to https://domain.com/api, avoid /api/api/...
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

function getGuestCartId() {
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

function getAccessToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) || undefined;
}

function saveAccessToken(data: any) {
  if (typeof window === 'undefined') return;
  const token = data?.data?.accessToken;
  if (token) window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

function clearAccessToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const isServer = typeof window === 'undefined';

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const guestCartId = getGuestCartId();
  if (guestCartId) headers['X-Cart-Session'] = guestCartId;

  const accessToken = getAccessToken();
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers,
      ...(isServer ? { next: { revalidate: 60 } } : { cache: 'no-store' }),
    });
  } catch (error) {
    throw new ApiRequestError(
      `Network error connecting to ${API_URL}. Check NEXT_PUBLIC_API_URL on frontend and CORS/FRONTEND_URL on backend.`,
      0,
      error
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiRequestError(
      (data as any)?.message || `API request failed with status ${response.status}`,
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
  return data;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, options);
}

export const api = {
  products: (query = '') => request<any>(`/api/products${query}`),
  product: (slug: string) => request<any>(`/api/products/${slug}`),

  register: (body: any) => authRequest<any>('/api/auth/register', body),
  login: (body: any) => authRequest<any>('/api/auth/login', body),
  me: () => request<any>('/api/auth/me'),
  logout: async () => {
    const result = await request<any>('/api/auth/logout', { method: 'POST' });
    clearAccessToken();
    return result;
  },

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
    request<any>(`/api/payments/paystack/initialize/${orderId}`, { method: 'POST' }),
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
