export type CouponType = "percentage" | "fixed";

export interface Coupon {
  id: string;
  storeId: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  perCustomerLimit?: number;
  firstPurchaseOnly: boolean;
  deliveryOnly: boolean;
  pickupOnly: boolean;
  pixOnly: boolean;
  active: boolean;
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  storeId: string;
  customerId: string;
  orderId: string;
  discountApplied: number;
  createdAt: Date;
}

export interface CouponValidationResult {
  valid: boolean;
  reason?: string;
  coupon?: Coupon;
  discountValue?: number;
  finalTotal?: number;
}
