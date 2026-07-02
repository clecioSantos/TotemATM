import { Product as SharedProduct, Order as SharedOrder } from '@totem/shared/types';

export type Product = SharedProduct;

export interface Order extends Omit<SharedOrder, 'address' | 'status'> {
  status: 'pending' | 'paid' | 'preparing' | 'ready' | 'delivering' | 'finished' | 'cancelled' | 'abandoned' | 'awating_customization';
  userName?: string;
  customerId?: string;
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    complement?: string;
  };
  deliveryMode?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  isScheduled?: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  requiresCustomerContact?: boolean;
  customerPhone?: string;
  customerEmail?: string;
}
