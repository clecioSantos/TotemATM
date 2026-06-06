export type OrderStatus = "pending" | "paid" | "preparing" | "ready" | "delivering" | "finished" | "cancelled";

export interface Product {
  id: string;
  companyId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  active: boolean;
  featured: boolean;
  sizes?: ProductSize[];
  createdAt: Date | { seconds: number; nanoseconds: number };
}

export interface ProductSize {
  nome: string;
  preco: number;
  quantidadeSabores: number;
}

export interface Condiment {
  id: string;
  companyId: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  enabled: boolean;
  categoryIds: string[];
  createdAt: Date | { seconds: number; nanoseconds: number };
}

export interface Category {
  id: string;
  companyId: string;
  name: string;
  possuiTamanhos?: boolean;
  possuiSabores?: boolean;
}

export interface CategoryFlavor {
  id: string;
  companyId: string;
  categoryId: string;
  nome: string;
  preco: number;
  ordem: number;
  ativo: boolean;
}

export interface SelectedSize {
  id: string;
  nome: string;
  preco: number;
}

export interface SelectedFlavor {
  id: string;
  nome: string;
  preco: number;
}

export interface CartItem extends Product {
  productId: string;
  quantity: number;
  observation?: string;
  condiments?: Condiment[];
  tamanhoSelecionado?: SelectedSize;
  saboresSelecionados?: SelectedFlavor[];
}

export interface OrderLineItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  observation?: string;
  condiments?: Condiment[];
  tamanhoSelecionado?: SelectedSize;
  saboresSelecionados?: SelectedFlavor[];
}

export interface Address {
  street: string;
  number: string;
  neighborhood: string;
  cityId: string;
  complement?: string;
}

export interface Order {
  id: string;
  companyId: string;
  items: OrderLineItem[];
  total: number;
  status: OrderStatus;
  customerName?: string;
  userName?: string;
  tableNumber?: string;
  createdAt: Date | { seconds: number; nanoseconds: number };
  deliveryFee?: number;
  address?: Address;
}

export interface OrderFormPayload {
  customerName: string;
  tableNumber: string;
  items: OrderLineItem[];
  total: number;
  status: OrderStatus;
  deliveryFee?: number;
  address?: Address;
}