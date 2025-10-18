/**
 * Repayment/Payment Model for Money Loan Feature
 */

export interface Repayment {
  id: string;
  tenant_id: string;
  loan_id: string;
  borrower_id: string;
  
  // Payment Details
  payment_number: string; // Auto-generated
  payment_date: Date;
  payment_amount: number;
  
  // Allocation
  principal_paid: number;
  interest_paid: number;
  penalty_paid: number;
  
  // Method
  payment_method: 'cash' | 'check' | 'bank_transfer' | 'gcash' | 'paymaya' | 'other';
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

export interface PaymentReminder {
  id: string;
  tenant_id: string;
  loan_id: string;
  borrower_id: string;
  
  reminder_type: 'upcoming' | 'due_today' | 'overdue';
  reminder_method: 'sms' | 'email' | 'both';
  
  scheduled_date: Date;
  sent_date?: Date;
  
  status: 'pending' | 'sent' | 'failed';
  message_content?: string;
  
  created_at: Date;
}

export interface RepaymentStats {
  total_payments_today: number;
  total_amount_collected_today: number;
  
  total_payments_this_week: number;
  total_amount_collected_this_week: number;
  
  total_payments_this_month: number;
  total_amount_collected_this_month: number;
  
  overdue_loans_count: number;
  total_overdue_amount: number;
  
  upcoming_payments_count: number;
  upcoming_payments_amount: number;
}

export interface CreateRepaymentData {
  loan_id: string;
  payment_date?: string;
  payment_amount: number;
  
  payment_method: string;
  reference_number?: string;
  receipt_number?: string;
  
  notes?: string;
}

export interface OverdueLoan {
  loan_id: string;
  loan_number: string;
  borrower_id: string;
  borrower_name: string;
  borrower_phone: string;
  
  principal_amount: number;
  outstanding_balance: number;
  
  due_date: Date;
  days_overdue: number;
  penalty_amount: number;
  
  last_payment_date?: Date;
  assigned_collector?: string;
}
