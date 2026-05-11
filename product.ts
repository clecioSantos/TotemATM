export type CategoryId = string;

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: CategoryId;
  isActive: boolean;
  isAvailable: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}