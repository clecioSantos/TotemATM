export interface OrderReview {
  id: string;
  orderId: string;
  customerId: string;
  companyId: string;
  rating: number;
  comment: string;
  adminReply: string;
  adminReplyAt: Date | { seconds: number; nanoseconds: number } | null;
  createdAt: Date | { seconds: number; nanoseconds: number };
  updatedAt: Date | { seconds: number; nanoseconds: number };
}
