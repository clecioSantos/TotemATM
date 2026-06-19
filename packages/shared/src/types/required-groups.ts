export type RequiredGroupRule = "EXACTLY" | "MIN" | "MAX" | "BETWEEN";

export interface RequiredItem {
  id: string;
  groupId: string;
  name: string;
  additionalPrice: number;
  order: number;
  available: boolean;
  imageUrl?: string;
  description?: string;
}

export interface SizeOverride {
  sizeName: string;
  minQuantity: number;
  maxQuantity: number;
}

export interface RequiredGroup {
  id: string;
  companyId: string;
  productId: string;
  name: string;
  rule: RequiredGroupRule;
  minQuantity: number;
  maxQuantity: number;
  order: number;
  active: boolean;
  items: RequiredItem[];
  sizeOverrides?: SizeOverride[];
  createdAt?: Date;
}
