// Automated Notifications Model
// For SMS, Email, and Push notifications across all modules

export interface NotificationTemplate {
  id: string;
  tenant_id: string;
  
  // Template Details
  template_code: string; // 'PAYMENT_REMINDER', 'LOAN_APPROVED', 'PAWN_EXPIRY'
  template_name: string;
  description?: string;
  
  // Category
  category: 'payment' | 'reminder' | 'approval' | 'promotion' | 'alert' | 'general';
  
  // Module
  module: 'money_loan' | 'bnpl' | 'pawnshop' | 'pos_small' | 'pos_large' | 'loyalty' | 'system';
  
  // Channels
  channels: ('sms' | 'email' | 'push' | 'in_app')[];
  
  // SMS Template
  sms_content?: string; // With variables: {{customer_name}}, {{amount}}, {{due_date}}
  sms_max_length: number;
  
  // Email Template
  email_subject?: string;
  email_body?: string; // HTML supported
  email_from_name?: string;
  
  // Push Notification Template
  push_title?: string;
  push_body?: string;
  push_icon?: string;
  push_action_url?: string;
  
  // Variables
  available_variables: string[]; // ['customer_name', 'amount', 'due_date', 'ticket_number']
  
  // Status
  is_active: boolean;
  is_system_template: boolean; // Cannot be deleted if true
  
  // Metadata
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationSchedule {
  id: string;
  tenant_id: string;
  
  // Schedule Details
  schedule_name: string;
  template_id: string;
  template_name?: string;
  
  // Trigger
  trigger_type: 'scheduled' | 'event' | 'manual';
  
  // Scheduled Trigger
  schedule_type?: 'daily' | 'weekly' | 'monthly' | 'before_due_date' | 'after_due_date' | 'custom';
  schedule_time?: string; // HH:MM
  schedule_days?: number[]; // 0=Sunday, 1=Monday, etc.
  days_before_due?: number;
  days_after_due?: number;
  
  // Event Trigger
  event_type?: 'loan_approved' | 'payment_received' | 'ticket_expired' | 'sale_completed' | 'low_stock';
  
  // Target Audience
  target_module: string;
  target_status?: string[]; // ['active', 'overdue']
  target_customer_segment?: string; // 'all', 'vip', 'overdue'
  
  // Filters
  min_amount?: number;
  max_amount?: number;
  branch_ids?: string[];
  
  // Channels
  send_via_sms: boolean;
  send_via_email: boolean;
  send_via_push: boolean;
  
  // Status
  is_active: boolean;
  last_run_date?: Date;
  next_run_date?: Date;
  
  // Stats
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  
  // Metadata
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: string;
  tenant_id: string;
  
  // Recipient
  recipient_type: 'customer' | 'user' | 'admin';
  recipient_id: string;
  recipient_name: string;
  recipient_phone?: string;
  recipient_email?: string;
  recipient_device_token?: string;
  
  // Notification Details
  template_id?: string;
  schedule_id?: string;
  
  notification_type: 'payment_reminder' | 'approval' | 'promotion' | 'alert' | 'general';
  category: string;
  
  // Content
  title: string;
  message: string;
  
  // Channels
  channel: 'sms' | 'email' | 'push' | 'in_app';
  
  // Priority
  priority: 'high' | 'medium' | 'low';
  
  // Related Entity
  related_module?: string;
  related_entity_id?: string;
  related_entity_type?: string; // 'loan', 'bnpl_purchase', 'pawn_ticket', 'sale'
  
  // Action
  action_url?: string;
  action_label?: string;
  
  // Delivery Status
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  sent_at?: Date;
  delivered_at?: Date;
  read_at?: Date;
  failed_reason?: string;
  
  // Provider Details
  provider?: string; // 'twilio', 'sendgrid', 'firebase'
  provider_message_id?: string;
  provider_cost?: number;
  
  // Retry
  retry_count: number;
  max_retries: number;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface NotificationBatch {
  id: string;
  tenant_id: string;
  
  // Batch Details
  batch_name: string;
  template_id: string;
  schedule_id?: string;
  
  // Recipients
  total_recipients: number;
  recipient_filters: Record<string, any>;
  
  // Channels
  channels: string[];
  
  // Status
  status: 'preparing' | 'sending' | 'completed' | 'failed' | 'cancelled';
  
  // Progress
  notifications_created: number;
  notifications_sent: number;
  notifications_delivered: number;
  notifications_failed: number;
  
  // Timing
  scheduled_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  
  // Cost
  estimated_cost: number;
  actual_cost: number;
  
  // Metadata
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationPreference {
  id: string;
  tenant_id: string;
  customer_id: string;
  
  // Preferences
  sms_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  
  // Notification Types
  payment_reminders: boolean;
  promotional_messages: boolean;
  transactional_alerts: boolean;
  loyalty_updates: boolean;
  
  // Quiet Hours
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string; // HH:MM
  quiet_hours_end?: string; // HH:MM
  
  // Language
  preferred_language: string; // 'en', 'tl'
  
  // Metadata
  updated_at: Date;
}

export interface SmsProvider {
  id: string;
  tenant_id: string;
  
  // Provider Details
  provider_name: string; // 'Twilio', 'Semaphore', 'Movider'
  provider_type: 'twilio' | 'semaphore' | 'movider' | 'custom';
  
  // Credentials
  api_key: string;
  api_secret?: string;
  sender_id: string;
  
  // Configuration
  base_url?: string;
  webhook_url?: string;
  
  // Pricing
  cost_per_sms: number;
  currency: string;
  
  // Limits
  monthly_limit?: number;
  monthly_used: number;
  
  // Status
  is_active: boolean;
  is_default: boolean;
  
  // Stats
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  success_rate: number;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface EmailProvider {
  id: string;
  tenant_id: string;
  
  // Provider Details
  provider_name: string; // 'SendGrid', 'Mailgun', 'SMTP'
  provider_type: 'sendgrid' | 'mailgun' | 'smtp' | 'ses';
  
  // Credentials
  api_key?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  
  // Sender Info
  from_email: string;
  from_name: string;
  reply_to_email?: string;
  
  // Configuration
  use_tls: boolean;
  
  // Status
  is_active: boolean;
  is_default: boolean;
  
  // Stats
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_opened: number;
  total_clicked: number;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface CreateNotificationTemplateData {
  template_code: string;
  template_name: string;
  category: string;
  module: string;
  channels: string[];
  sms_content?: string;
  email_subject?: string;
  email_body?: string;
  push_title?: string;
  push_body?: string;
}

export interface CreateNotificationScheduleData {
  schedule_name: string;
  template_id: string;
  trigger_type: 'scheduled' | 'event';
  schedule_type?: string;
  schedule_time?: string;
  days_before_due?: number;
  event_type?: string;
  target_module: string;
  send_via_sms: boolean;
  send_via_email: boolean;
  send_via_push: boolean;
}

export interface SendNotificationData {
  recipient_id: string;
  recipient_type: 'customer' | 'user';
  template_id?: string;
  title: string;
  message: string;
  channel: 'sms' | 'email' | 'push' | 'in_app';
  priority?: 'high' | 'medium' | 'low';
  related_module?: string;
  related_entity_id?: string;
}

export interface NotificationDashboardStats {
  tenant_id: string;
  
  // Today
  today_sent: number;
  today_delivered: number;
  today_failed: number;
  today_cost: number;
  
  // This Month
  month_sent: number;
  month_delivered: number;
  month_failed: number;
  month_cost: number;
  
  // By Channel
  by_channel: {
    channel: string;
    sent: number;
    delivered: number;
    failed: number;
    delivery_rate: number;
  }[];
  
  // By Template
  top_templates: {
    template_name: string;
    sent_count: number;
    delivery_rate: number;
  }[];
  
  // Recent Activity
  recent_notifications: {
    id: string;
    recipient_name: string;
    title: string;
    channel: string;
    status: string;
    sent_at: Date;
  }[];
  
  // Delivery Rates
  overall_delivery_rate: number;
  sms_delivery_rate: number;
  email_delivery_rate: number;
  push_delivery_rate: number;
}

export interface NotificationReport {
  date_from: Date;
  date_to: Date;
  
  // Summary
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_read: number;
  total_cost: number;
  
  // By Channel
  by_channel: {
    channel: string;
    sent: number;
    delivered: number;
    cost: number;
  }[];
  
  // By Module
  by_module: {
    module: string;
    sent: number;
    delivered: number;
  }[];
  
  // By Category
  by_category: {
    category: string;
    sent: number;
    delivered: number;
  }[];
  
  // Daily Breakdown
  daily_stats: {
    date: Date;
    sent: number;
    delivered: number;
    cost: number;
  }[];
  
  // Performance
  average_delivery_time: number; // in seconds
  engagement_rate: number; // read / delivered
}
