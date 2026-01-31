/**
 * Notification Module - Entity Definitions
 *
 * TypeScript interfaces matching notification-related DB tables
 */

// ─── Notification Types ───────────────────────────────────────────────────────

export enum NotificationType {
  INFO = "INFO",
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

// ─── ntf_messages table ───────────────────────────────────────────────────────

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  link: string;
  type: NotificationType;
  is_read: boolean;
  created_at: Date;
}

// ─── Notification with read status ────────────────────────────────────────────

export interface NotificationWithCount {
  notifications: Notification[];
  unreadCount: number;
}

// ─── Create notification input ────────────────────────────────────────────────

export interface CreateNotificationInput {
  userId: number;
  title: string;
  message: string;
  link?: string;
  type?: NotificationType;
}

// ─── Bulk notification input ──────────────────────────────────────────────────

export interface BulkNotificationInput {
  role: string;
  title: string;
  message: string;
  link?: string;
}

// ─── User notification settings ──────────────────────────────────────────────

export interface NotificationSettings {
  user_id: number;
  in_app: boolean;
  sms: boolean;
  email: boolean;
  updated_at?: Date;
}
