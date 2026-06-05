import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from "firebase/firestore";
import { Product, Category, Order } from "@totem/shared/types";

const getDb = () => getFirestore();

export const TotemService = {
  async getActiveProducts(): Promise<Product[]> {
    try {
      const productsRef = collection(getDb(), "products");
      const snapshot = await getDocs(query(productsRef, where("active", "==", true)));

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
    } catch (error) {
      console.error("🔥 Erro ao buscar produtos ativos:", error);
      return [];
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      const categoriesRef = collection(getDb(), "categories");
      const snapshot = await getDocs(categoriesRef);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
    } catch (error) {
      console.error("🔥 Erro ao buscar categorias:", error);
      return [];
    }
  },

  async submitOrder(orderData: Omit<Order, "id" | "createdAt">): Promise<string> {
    try {
      const ordersRef = collection(getDb(), "orders");

      const docRef = await addDoc(ordersRef, {
        ...orderData,
        createdAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error("🔥 Erro ao enviar pedido:", error);
      throw error;
    }
  }
};
