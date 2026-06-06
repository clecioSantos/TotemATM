import { Order, CreateOrderDTO, OrderStatus } from './order';
import * as admin from 'firebase-admin';
import { getAdminDb } from './src/services/firebase-admin';
import { logger } from './src/lib/logger';

export class OrdersService {
  private collection: admin.firestore.CollectionReference | null = null;

  private getCollection(): admin.firestore.CollectionReference {
    if (!this.collection) {
      try {
        this.collection = getAdminDb().collection('orders');
      } catch (error) {
        logger.error("ORDERS_SERVICE", "Erro ao obter coleção de pedidos", error);
        throw error;
      }
    }
    return this.collection;
  }

  async createOrder(data: CreateOrderDTO): Promise<string> {
    try {
      const orderNumber = Math.floor(100 + Math.random() * 900);

      const items = data.items.map(item => ({
        ...item,
        totalPrice: item.unitPrice * item.quantity,
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

      const collection = this.getCollection();
      const docRef = await collection.add(newOrder);

      logger.info("ORDERS_SERVICE", `Pedido criado: ${docRef.id}`, { orderNumber });

      return docRef.id;
    } catch (error) {
      logger.error("ORDERS_SERVICE", "Erro ao criar pedido", error);
      throw error;
    }
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      const collection = this.getCollection();
      await collection.doc(orderId).update({
        status,
        updatedAt: new Date(),
      });
      logger.info("ORDERS_SERVICE", `Status do pedido ${orderId} atualizado para ${status}`);
    } catch (error) {
      logger.error("ORDERS_SERVICE", `Erro ao atualizar status do pedido ${orderId}`, error);
      throw error;
    }
  }

  async getActiveOrders(): Promise<Order[]> {
    try {
      const collection = this.getCollection();
      const snapshot = await collection
        .where('status', 'in', ['pending', 'preparing', 'ready'])
        .orderBy('createdAt', 'asc')
        .get();

      const orders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Order;
      });

      logger.info("ORDERS_SERVICE", `${orders.length} pedidos ativos carregados`);

      return orders;
    } catch (error) {
      logger.error("ORDERS_SERVICE", "Erro ao carregar pedidos ativos", error);
      throw error;
    }
  }
}
