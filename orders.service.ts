import { Order, CreateOrderDTO, OrderStatus } from './order';
import * as admin from 'firebase-admin';
import { getAdminDb } from './firebase-admin.config';

export class OrdersService {
  private collection = getAdminDb().collection('orders');

  async createOrder(data: CreateOrderDTO): Promise<string> {
    const orderNumber = Math.floor(100 + Math.random() * 900); // Gerador simples de senha
    
    const items = data.items.map(item => ({
      ...item,
      totalPrice: item.unitPrice * item.quantity
    }));

    const newOrder: Partial<Order> = {
      ...data,
      items,
      orderNumber,
      status: 'pending',
      totalAmount: items.reduce((acc, item) => acc + item.totalPrice, 0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await this.collection.add(newOrder);
    return docRef.id;
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    await this.collection.doc(orderId).update({
      status,
      updatedAt: new Date(),
    });
  }

  async getActiveOrders(): Promise<Order[]> {
    const snapshot = await this.collection
      .where('status', 'in', ['pending', 'preparing', 'ready'])
      .orderBy('createdAt', 'asc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Order;
    });
  }
}