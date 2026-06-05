export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  originalPrice?: number | string | null;
  image: string;
  images?: string[];
  category: string;
  badge?: string | null;
  stock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  averageRating?: number | string;
  totalReviews?: number;
};
