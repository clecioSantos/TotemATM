export type NotificationType = "order_review" | "review_reply" | "contact_reply";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedOrderId: string;
  relatedContactId?: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: Date | { seconds: number; nanoseconds: number };
}
