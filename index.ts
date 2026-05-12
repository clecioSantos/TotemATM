export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  active: boolean;
  featured: boolean;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
}

export interface OrderLineItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  observation?: string;
}

export interface Order {
  id: string;
  items: OrderLineItem[];
  total: number;
  status: "pending" | "preparing" | "ready" | "finished";
  customerName?: string;
  tableNumber?: string;
  createdAt: Date;
}