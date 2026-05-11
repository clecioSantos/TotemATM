export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  active: boolean;
  featured: boolean;
  createdAt: Date; // Using Date object after conversion from Firebase Timestamp
}

export interface Category {
  id: string;
  name: string;
}