import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { Product, Category, Order } from "@totem/shared/types";
import { logger } from "@/src/lib/logger";

const getDb = () => getFirestore();

export const TotemService = {
  async getActiveProducts(): Promise<Product[]> {
    try {
      const productsRef = collection(getDb(), "products");
      const snapshot = await getDocs(query(productsRef, where("active", "==", true)));

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("TotemService", `Erro ao buscar produtos ativos: ${errMsg}`, error);
      return [];
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      const categoriesRef = collection(getDb(), "categories");
      const snapshot = await getDocs(categoriesRef);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("TotemService", `Erro ao buscar categorias: ${errMsg}`, error);
      return [];
    }
  },

  async submitOrder(orderData: Omit<Order, "id" | "createdAt">): Promise<string | null> {
    try {
      const ordersRef = collection(getDb(), "orders");

      const docRef = await addDoc(ordersRef, {
        ...orderData,
        createdAt: serverTimestamp(),
      });

      logger.info("TotemService", `Pedido criado: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error("TotemService", `Erro ao enviar pedido: ${errMsg}`, error);
      return null;
    }
  },
};
