// Re-export from the canonical type file so imports from either
// '@/lib/types' or '@/types' resolve to the same definitions.
export type {
  Product,
  CartItem,
  Cart,
  OrderItem,
  Payment,
  Order,
} from '@/types';
