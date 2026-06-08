import { Timestamp } from "firebase/firestore";

export type PromotionEventStatus = "draft" | "scheduled" | "active" | "finished";

export interface PromotionEvent {
  id: string;
  name: string;
  slug: string;
  description: string;
  bannerUrl: string;
  status: PromotionEventStatus;
  startAt: Timestamp;
  endAt: Timestamp;
  displayOrder: number;
  permanent?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export type PromotionType = "fixed_price" | "percentage_discount" | "amount_discount";

export type PromotionStatus = "scheduled" | "active" | "finished";

export interface Promotion {
  id: string;
  storeId: string;
  productId: string;
  eventId: string;
  title: string;
  promotionType: PromotionType;
  originalPrice: number;
  promotionalPrice: number;
  percentageOff: number;
  stockLimit: number | null;
  soldUnits: number;
  maxPerOrder: number | null;
  startAt: Timestamp;
  endAt: Timestamp;
  status: PromotionStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
