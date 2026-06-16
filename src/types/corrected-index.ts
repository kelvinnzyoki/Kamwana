// ─── Canonical type definitions ───────────────────────────────────────────────
// Single source of truth for all shared types.
// Import from '@/types' (home page, server components) or '@/lib/types' —
// both resolve to these same definitions.

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  image: string;
  images?: string[];
  category: string;
  badge?: string | null;
  stock: number;
  isActive: boolean;
  featured: boolean;
  sizes?: string[];
  colors?: string[];
};

export type CartItem = {
  id: string;
  quantity: number;
  price: string | number;
  size?: string | null;
  product: Product;
};

export type Cart = {
  id: string;
  items: CartItem[];
};

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  size?: string | null;
  quantity: number;
  price: string | number;
  total: string | number;
};

export type Payment = {
  id: string;
  status: string;
  provider: string;
  transactionRef?: string | null;
  paidAt?: string | null;
  failureReason?: string | null;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string | number;
  shippingCost: string | number;
  total: string | number;
  paymentMethod: 'MPESA' | 'PAYSTACK';
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payment?: Payment;
};
