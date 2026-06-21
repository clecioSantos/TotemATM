export type OrderStatus = "pending" | "paid" | "preparing" | "ready" | "delivering" | "finished" | "cancelled" | "awating_customization";

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
  dayPromotions?: DayPromotion[];
  hasDayPromotion?: boolean;
  createdAt: Date | { seconds: number; nanoseconds: number };
}

export interface ProductSize {
  nome: string;
  preco: number;
  quantidadeSabores?: number;
}

export interface DayPromotion {
  dayOfWeek: number;
  discountPercent: number;
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
  schedulingMode?: "none" | "optional" | "required";
  minimumPreparationMinutes?: number;
  requiresCustomerContact?: boolean;
  customerInstructions?: string;
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
  selectedRequiredItems?: { groupName: string; items: { name: string; additionalPrice: number }[] }[];
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
  selectedRequiredItems?: { groupName: string; items: { name: string; additionalPrice: number }[] }[];
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
  isScheduled?: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledAt?: Date | { seconds: number; nanoseconds: number };
  requiresCustomerContact?: boolean;
}

export type { AppNotification, NotificationType } from './notifications';
export type { OrderReview } from './reviews';
export type { Company } from './company';
export type { StorePermissions, StoreUser } from './auth';
export type { PromotionEvent, PromotionEventStatus, Promotion, PromotionType, PromotionStatus } from './promotions';
export type { Coupon, CouponType, CouponUsage, CouponValidationResult } from './coupons';
export type { RequiredGroup, RequiredGroupRule, RequiredItem } from './required-groups';

export interface OrderFormPayload {
  customerName: string;
  tableNumber: string;
  items: OrderLineItem[];
  total: number;
  status: OrderStatus;
  deliveryFee?: number;
  address?: Address;
}