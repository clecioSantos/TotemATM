export type OrderStatus = "pending" | "paid" | "preparing" | "ready" | "delivering" | "finished" | "cancelled";

export interface Product {
  id: string;
  companyId: string;
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
  companyId: string;
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
  companyId: string;
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

export interface Address {
  street: string;
  number: string;
  neighborhood: string;
  cityId: string;
  complement?: string;
}

export interface Order {
  id: string;
  companyId: string;
  items: OrderLineItem[];
  total: number;
  status: OrderStatus;
  customerName?: string;
  userName?: string;
  tableNumber?: string;
  createdAt: Date | { seconds: number; nanoseconds: number };
  deliveryFee?: number;
  address?: Address;
}

export interface OrderFormPayload {
  customerName: string;
  tableNumber: string;
  items: OrderLineItem[];
  total: number;
  status: OrderStatus;
  deliveryFee?: number;
  address?: Address;
}