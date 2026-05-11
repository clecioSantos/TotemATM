export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  active: boolean;
  featured: boolean;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
}
