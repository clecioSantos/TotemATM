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
    const productsRef = collection(getDb(), "products");
    const snapshot = await getDocs(query(productsRef, where("active", "==", true)));

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  },

  async getCategories(): Promise<Category[]> {
    const categoriesRef = collection(getDb(), "categories");
    const snapshot = await getDocs(categoriesRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Category[];
  },

  async submitOrder(orderData: Omit<Order, "id" | "createdAt">): Promise<string> {
    const ordersRef = collection(getDb(), "orders");

    const docRef = await addDoc(ordersRef, {
      ...orderData,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  }
};