/**
 * Loan Model for Money Loan Feature
 */

export interface Loan {
  id: string;
  tenant_id: string;
  borrower_id: string;
  
  // Loan Details
  loan_number: string; // Auto-generated unique identifier
  loan_type?: 'personal' | 'business' | 'emergency' | 'salary' | 'other';
  principal_amount: number;
  interest_rate: number; // Percentage
  interest_type: 'flat' | 'diminishing' | 'add_on'; // Interest calculation method
  
  // Terms
  term_length: number; // Number of periods
  term_unit: 'days' | 'weeks' | 'months' | 'years';
  payment_frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  
  // Dates
  application_date: Date;
  approval_date?: Date;
  release_date?: Date;
  maturity_date?: Date;
  
  // Calculated Fields
  total_interest: number;
  total_payable: number;
  monthly_payment?: number; // For monthly payments
  
  // Status
  status: 'pending' | 'approved' | 'rejected' | 'released' | 'active' | 'paid' | 'overdue' | 'defaulted' | 'cancelled';
  
  // Approval
  approved_by?: string;
  rejected_by?: string;
  rejection_reason?: string;
  
  // Collateral (optional)
  collateral_type?: string;
  collateral_description?: string;
  collateral_value?: number;
  
  // Penalties
  penalty_rate?: number; // Percentage per day/month for overdue
  has_penalty: boolean;
  
  // Purpose
  loan_purpose?: string;
  
  // Tracking
  amount_paid: number;
  outstanding_balance: number;
  last_payment_date?: Date;
  next_payment_due?: Date;
  
  // Branch/Collector assignment
  branch_id?: string;
  assigned_collector?: string;
  
  // Notes
  notes?: string;
  
  // Metadata
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface LoanPaymentSchedule {
  id: string;
  loan_id: string;
  tenant_id: string;
  
  installment_number: number;
  due_date: Date;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  
  amount_paid: number;
  balance: number;
  
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  payment_date?: Date;
  
  penalty_amount?: number;
  days_overdue?: number;
}

export interface LoanApproval {
  id: string;
  loan_id: string;
  tenant_id: string;
  
  action: 'approved' | 'rejected';
  approved_by: string;
  approval_date: Date;
  comments?: string;
  
  // Conditions
  approved_amount?: number; // If different from requested
  approved_terms?: string;
}

export interface LoanStats {
  total_loans: number;
  pending_loans: number;
  approved_loans: number;
  active_loans: number;
  paid_loans: number;
  overdue_loans: number;
  
  total_principal_disbursed: number;
  total_interest_earned: number;
  total_collected: number;
  total_outstanding: number;
  
  average_loan_amount: number;
  average_interest_rate: number;
}

export interface CreateLoanData {
  borrower_id: string;
  
  loan_type?: string;
  principal_amount: number;
  interest_rate: number;
  interest_type: 'flat' | 'diminishing' | 'add_on';
  
  term_length: number;
  term_unit: 'days' | 'weeks' | 'months' | 'years';
  payment_frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  
  application_date?: string;
  release_date?: string;
  
  collateral_type?: string;
  collateral_description?: string;
  collateral_value?: number;
  
  penalty_rate?: number;
  loan_purpose?: string;
  
  branch_id?: string;
  assigned_collector?: string;
  
  notes?: string;
}

export interface LoanCalculation {
  principal_amount: number;
  interest_rate: number;
  interest_type: string;
  term_length: number;
  term_unit: string;
  payment_frequency: string;
  
  total_interest: number;
  total_payable: number;
  installment_amount: number;
  number_of_installments: number;
  
  payment_schedule: {
    installment_number: number;
    due_date: string;
    principal: number;
    interest: number;
    total: number;
    balance: number;
  }[];
}
