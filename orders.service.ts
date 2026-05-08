import { Injectable } from '@nestjs/common';
import { Order, CreateOrderDTO, OrderStatus } from '@lancheria/shared-types';
import * as admin from 'firebase-admin';

@Injectable()
export class OrdersService {
  private collection = admin.firestore().collection('orders');

  async createOrder(data: CreateOrderDTO): Promise<string> {
    const orderNumber = Math.floor(100 + Math.random() * 900); // Gerador simples de senha
    
    const newOrder: Partial<Order> = {
      ...data,
      orderNumber,
      status: 'pending',
      totalAmount: data.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0),
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
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  }
}