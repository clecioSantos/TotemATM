export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'finished';
  source: 'totem';
  createdAt: any;
}
