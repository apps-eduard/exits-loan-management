/**
 * BNPL Payment Model
 * For Buy Now, Pay Later feature
 */

export interface BnplPayment {
  id: string;
  tenant_id: string;
  purchase_id: string;
  customer_id: string;
  
  // Payment Details
  payment_number: string; // Auto-generated
  payment_date: Date;
  payment_amount: number;
  
  // Allocation
  principal_paid: number;
  interest_paid: number;
  penalty_paid: number;
  
  // Payment Method
  payment_method: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'gcash' | 'paymaya' | 'other';
  reference_number?: string;
  
  // Receipt
  receipt_number?: string;
  receipt_url?: string;
  
  // Status
  status: 'pending' | 'confirmed' | 'cancelled';
  
  // Notes
  notes?: string;
  
  // Metadata
  received_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface BnplPaymentReminder {
  id: string;
  tenant_id: string;
  purchase_id: string;
  customer_id: string;
  
  reminder_type: 'upcoming' | 'due_today' | 'overdue';
  reminder_method: 'sms' | 'email' | 'both';
  
  scheduled_date: Date;
  sent_date?: Date;
  
  status: 'pending' | 'sent' | 'failed';
  message_content?: string;
  
  created_at: Date;
}

export interface BnplPaymentStats {
  total_payments_today: number;
  amount_collected_today: number;
  
  total_payments_this_week: number;
  amount_collected_this_week: number;
  
  total_payments_this_month: number;
  amount_collected_this_month: number;
  
  overdue_purchases_count: number;
  total_overdue_amount: number;
  
  upcoming_dues_count: number;
  upcoming_dues_amount: number;
}

export interface CreateBnplPaymentData {
  purchase_id: string;
  
  payment_date?: string;
  payment_amount: number;
  
  payment_method: string;
  reference_number?: string;
  receipt_number?: string;
  
  notes?: string;
}

export interface OverdueBnplPurchase {
  purchase_id: string;
  purchase_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  
  total_amount: number;
  outstanding_balance: number;
  
  next_payment_due: Date;
  days_overdue: number;
  overdue_amount: number;
  penalty_amount: number;
  
  last_payment_date?: Date;
  assigned_collector?: string;
}

export interface BnplSalesReport {
  period: string;
  
  total_sales: number;
  total_purchases_count: number;
  
  total_collected: number;
  total_outstanding: number;
  
  on_time_payments: number;
  late_payments: number;
  
  by_product?: {
    product_name: string;
    quantity_sold: number;
    total_value: number;
  }[];
  
  by_branch?: {
    branch_name: string;
    total_sales: number;
    purchases_count: number;
  }[];
  
  by_collector?: {
    collector_name: string;
    amount_collected: number;
    purchases_handled: number;
  }[];
}
