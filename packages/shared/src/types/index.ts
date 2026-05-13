export type OrderStatus = "pending" | "preparing" | "ready" | "finished";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  active: boolean;
  featured: boolean;
  createdAt: Date | { seconds: number; nanoseconds: number };
}

export interface Category {
  id: string;
  name: string;
}

export interface CartItem extends Product {
  quantity: number;
  observation?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date | { seconds: number; nanoseconds: number };
}