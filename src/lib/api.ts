const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bio.cctamcc.site';

const API_URL =
  rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')
    ? rawApiUrl.replace(/\/$/, '')
    : `https://${rawApiUrl.replace(/\/$/, '')}`;

export class ApiRequestError extends Error {
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

function getAccessToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('classic_closet_access_token') || undefined;
}

function saveAccessToken(data: any) {
  if (typeof window === 'undefined') return;
  const token = data?.data?.accessToken;
  if (token) window.localStorage.setItem('classic_closet_access_token', token);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const guestCartId = getGuestCartId();
  const accessToken = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(guestCartId ? { 'X-Cart-Session': guestCartId } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const isServer = typeof window === 'undefined';

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers,
      ...(isServer ? { next: { revalidate: 60 } } : { cache: 'no-store' }),
    });
  } catch {
    throw new ApiRequestError(
      'Network error. Check NEXT_PUBLIC_API_URL and backend CORS FRONTEND_URL.',
      0,
      null
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiRequestError(data.message || `API request failed: ${res.status}`, res.status, data);
  }

  return data as T;
}

async function authRequest<T>(path: string, body: any): Promise<T> {
  const data = await request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  saveAccessToken(data);
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
  me: () => request<any>('/api/auth/me'),
  logout: async () => {
    const r = await request<any>('/api/auth/logout', { method: 'POST' });
    if (typeof window !== 'undefined') window.localStorage.removeItem('classic_closet_access_token');
    return r;
  },

  cart: () => request<any>('/api/cart'),
  addCart: (productId: string, quantity = 1) =>
    request<any>('/api/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  updateCart: (id: string, quantity: number) =>
    request<any>(`/api/cart/items/${id}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  removeCart: (id: string) => request<any>(`/api/cart/items/${id}`, { method: 'DELETE' }),

  checkout: (body: any) => request<any>('/api/checkout', { method: 'POST', body: JSON.stringify(body) }),
  paystack: (orderId: string) => request<any>(`/api/payments/paystack/initialize/${orderId}`, { method: 'POST' }),
  mpesa: (orderId: string, phoneNumber: string) =>
    request<any>(`/api/payments/mpesa/stk/${orderId}`, { method: 'POST', body: JSON.stringify({ phoneNumber }) }),
  orders: () => request<any>('/api/orders/mine'),
  newsletter: (email: string) => request<any>('/api/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email }) }),
};
