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

export interface Condiment {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  enabled: boolean;
  categoryIds: string[];
  createdAt: Date | { seconds: number; nanoseconds: number };
}

export interface Category {
  id: string;
  name: string;
}

export interface CartItem extends Product {
  productId: string;
  quantity: number;
  observation?: string;
  condiments?: Condiment[];
}

export interface OrderLineItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  observation?: string;
  condiments?: Condiment[];
}

export interface Order {
  id: string;
  items: OrderLineItem[];
  total: number;
  status: OrderStatus;
  customerName?: string;
  tableNumber?: string;
  createdAt: Date | { seconds: number; nanoseconds: number };
}

export interface OrderFormPayload {
  customerName: string;
  tableNumber: string;
  items: OrderLineItem[];
  total: number;
  status: OrderStatus;
}