import { Order, CreateOrderDTO, OrderStatus } from './order';
import * as admin from 'firebase-admin';
import { getAdminDb } from './firebase-admin.config';

export class OrdersService {
  private get collection() {
    return getAdminDb().collection('orders');
  }

  async createOrder(data: CreateOrderDTO): Promise<string> {
    try {
      const orderNumber = Math.floor(100 + Math.random() * 900);
      
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
    } catch (error) {
      console.error("🔥 Erro ao criar pedido:", error);
      throw error;
    }
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      await this.collection.doc(orderId).update({
        status,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error(`🔥 Erro ao atualizar status do pedido ${orderId}:`, error);
      throw error;
    }
  }

  async getActiveOrders(): Promise<Order[]> {
    try {
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
    } catch (error) {
      console.error("🔥 Erro ao buscar pedidos ativos:", error);
      return [];
    }
  }
}