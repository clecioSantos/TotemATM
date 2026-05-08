export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  observations?: string;
}

export interface Order {
  id: string;
  orderNumber: number; // Ex: 123 (para o cliente ver)
  customerName?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'credit_card' | 'debit_card' | 'pix';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderDTO {
  items: Omit<OrderItem, 'totalPrice'>[];
  customerName?: string;
  paymentMethod: Order['paymentMethod'];
}