export type { Product } from '@totem/shared/types';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'finished';

export interface OrderLineItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  observation?: string;
}

export interface Order {
  id: string;
  items: OrderLineItem[];
  total: number;
  status: OrderStatus;
  customerName?: string;
  tableNumber?: string;
  createdAt: Date;
}

export interface OrderFormPayload {
  customerName: string;
  tableNumber: string;
  items: OrderLineItem[];
  total: number;
  status: OrderStatus;
}
