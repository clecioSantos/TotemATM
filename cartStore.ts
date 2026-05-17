import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrderItem, Product } from './order';

interface CartState {
  items: OrderItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.productId === product.id);

        if (existingItem) {
          set({
            items: currentItems.map((item) =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity, totalPrice: (item.quantity + quantity) * item.unitPrice }
                : item
            ),
          });
        } else {
          set({
            items: [
              ...currentItems,
              {
                productId: product.id,
                name: product.name,
                unitPrice: product.price,
                quantity,
                totalPrice: product.price * quantity,
              },
            ],
          });
        }
      },

      removeItem: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
      
      updateQuantity: (productId, quantity) => set({
        items: get().items.map(i => i.productId === productId ? { ...i, quantity, totalPrice: quantity * i.unitPrice } : i)
      }),

      clearCart: () => set({ items: [] }),
      
      getTotal: () => get().items.reduce((acc, item) => acc + item.totalPrice, 0),
    }),
    { name: 'nexorder-cart' }
  )
);