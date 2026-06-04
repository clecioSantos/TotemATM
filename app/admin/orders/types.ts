import { Product as SharedProduct, Order as SharedOrder } from '@totem/shared/types';

export type Product = SharedProduct;

export interface Order extends Omit<SharedOrder, 'address' | 'status'> {
  status: 'pending' | 'paid' | 'preparing' | 'ready' | 'delivering' | 'finished' | 'cancelled';
  userName?: string;
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    complement?: string;
  };
}
