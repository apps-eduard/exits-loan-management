// Small Retail POS - Customer & Credit Tracking Model
// For tracking customer accounts and partial payments

export interface PosSmallCustomer {
  id: string;
  tenant_id: string;
  
  // Customer Details
  customer_name: string;
  nickname?: string;
  phone_number?: string;
  address?: string;
  
  // Credit Tracking
  credit_limit: number;
  outstanding_balance: number;
  available_credit: number;
  
  // Payment History
  total_purchases: number;
  total_payments: number;
  on_time_payments: number;
  late_payments: number;
  
  // Status
  status: 'active' | 'inactive' | 'suspended';
  credit_status: 'good' | 'fair' | 'poor';
  
  // Notes
  notes?: string;
  
  // Metadata
  customer_since: Date;
  last_purchase_date?: Date;
  last_payment_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PosSmallCreditAccount {
  id: string;
  tenant_id: string;
  customer_id: string;
  
  // Account Details
  account_number: string;
  account_date: Date;
  
  // Amount
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  
  // Payment Terms
  payment_terms?: string; // e.g., "Weekly", "Bi-weekly", "Monthly"
  due_date?: Date;
  
  // Status
  status: 'pending' | 'active' | 'paid' | 'overdue' | 'written_off';
  days_overdue: number;
  
  // Related Sale
  sale_id?: string;
  
  // Notes
  notes?: string;
  
  // Metadata
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface PosSmallPayment {
  id: string;
  tenant_id: string;
  customer_id: string;
  credit_account_id: string;
  
  // Payment Details
  payment_date: Date;
  payment_amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'gcash' | 'check' | 'other';
  reference_number?: string;
  
  // Allocation
  principal_paid: number;
  interest_paid: number;
  
  // Balance After Payment
  balance_before: number;
  balance_after: number;
  
  // Receipt
  receipt_number: string;
  
  // Notes
  notes?: string;
  
  // Metadata
  processed_by: string;
  created_at: Date;
}

export interface CreatePosSmallCustomerData {
  customer_name: string;
  nickname?: string;
  phone_number?: string;
  address?: string;
  credit_limit?: number;
  notes?: string;
}

export interface CreatePosSmallCreditAccountData {
  customer_id: string;
  principal_amount: number;
  interest_amount?: number;
  payment_terms?: string;
  due_date?: Date;
  sale_id?: string;
  notes?: string;
}

export interface CreatePosSmallPaymentData {
  customer_id: string;
  credit_account_id: string;
  payment_amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'gcash' | 'check' | 'other';
  reference_number?: string;
  notes?: string;
}

export interface PosSmallCustomerStats {
  total_customers: number;
  active_customers: number;
  suspended_customers: number;
  total_credit_extended: number;
  total_outstanding: number;
  overdue_accounts: number;
  collection_rate: number; // percentage
}

export interface OverdueAccount {
  customer_id: string;
  customer_name: string;
  phone_number?: string;
  account_id: string;
  account_number: string;
  balance: number;
  days_overdue: number;
  due_date: Date;
  last_payment_date?: Date;
}
