/**
 * BNPL Purchase/Sale Model
 * For Buy Now, Pay Later feature
 */

export interface BnplPurchase {
  id: string;
  tenant_id: string;
  customer_id: string;
  
  // Purchase Details
  purchase_number: string; // Auto-generated
  purchase_date: Date;
  
  // Items/Products
  items: BnplPurchaseItem[];
  
  // Pricing
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  
  // Down Payment
  down_payment: number;
  down_payment_date?: Date;
  
  // Installment Terms
  financed_amount: number; // total_amount - down_payment
  number_of_installments: number;
  installment_frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  installment_amount: number;
  
  // Interest/Service Charge
  interest_rate: number; // Percentage
  interest_type: 'flat' | 'diminishing';
  total_interest: number;
  total_payable: number; // financed_amount + total_interest
  
  // Dates
  first_payment_date: Date;
  final_payment_date: Date;
  
  // Status
  status: 'pending' | 'approved' | 'active' | 'completed' | 'cancelled' | 'defaulted';
  
  // Payment Tracking
  amount_paid: number;
  outstanding_balance: number;
  last_payment_date?: Date;
  next_payment_due?: Date;
  
  // Branch/Collector Assignment
  branch_id?: string;
  assigned_collector?: string;
  sales_person?: string;
  
  // Approval
  approved_by?: string;
  approved_at?: Date;
  
  // Notes
  notes?: string;
  
  // Metadata
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface BnplPurchaseItem {
  id?: string;
  purchase_id?: string;
  
  product_name: string;
  product_code?: string;
  description?: string;
  
  quantity: number;
  unit_price: number;
  total_price: number;
  
  // Optional inventory link
  inventory_item_id?: string;
}

export interface BnplInstallment {
  id: string;
  purchase_id: string;
  tenant_id: string;
  customer_id: string;
  
  installment_number: number;
  due_date: Date;
  amount_due: number;
  
  amount_paid: number;
  balance: number;
  
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'waived';
  payment_date?: Date;
  
  // Penalties
  days_overdue: number;
  penalty_amount: number;
  
  // Notes
  notes?: string;
}

export interface BnplPurchaseStats {
  total_purchases: number;
  pending_purchases: number;
  active_purchases: number;
  completed_purchases: number;
  
  total_sales_value: number;
  total_financed_amount: number;
  total_collected: number;
  total_outstanding: number;
  
  average_purchase_amount: number;
  average_installments: number;
}

export interface CreateBnplPurchaseData {
  customer_id: string;
  
  purchase_date?: string;
  
  items: {
    product_name: string;
    product_code?: string;
    description?: string;
    quantity: number;
    unit_price: number;
    inventory_item_id?: string;
  }[];
  
  tax_amount?: number;
  discount_amount?: number;
  
  down_payment: number;
  
  number_of_installments: number;
  installment_frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  
  interest_rate: number;
  interest_type: 'flat' | 'diminishing';
  
  first_payment_date?: string;
  
  branch_id?: string;
  assigned_collector?: string;
  sales_person?: string;
  
  notes?: string;
}

export interface BnplPurchaseCalculation {
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  
  down_payment: number;
  financed_amount: number;
  
  interest_rate: number;
  total_interest: number;
  total_payable: number;
  
  number_of_installments: number;
  installment_amount: number;
  
  payment_schedule: {
    installment_number: number;
    due_date: string;
    amount_due: number;
    balance: number;
  }[];
}
