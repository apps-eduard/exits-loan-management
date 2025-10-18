// Large Retail POS - Sales & Transactions Model
// For high-volume, multi-terminal operations

export interface PosLargeSale {
  id: string;
  tenant_id: string;
  branch_id: string;
  terminal_id: string;
  session_id: string;
  
  // Transaction Details
  transaction_number: string;
  transaction_date: Date;
  transaction_time: string;
  
  // Customer
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  loyalty_card_number?: string;
  
  // Items
  total_items: number;
  unique_items: number;
  
  // Amounts
  subtotal: number;
  tax_amount: number;
  
  // Discounts & Promotions
  discount_amount: number;
  discount_type?: 'fixed' | 'percentage' | 'promo';
  discount_reason?: string;
  promo_codes?: string[];
  
  total_amount: number;
  
  // Payment
  payment_method: 'cash' | 'card' | 'ewallet' | 'bnpl' | 'voucher' | 'points' | 'mixed';
  
  // Multiple Payment Methods
  payments: PosLargePaymentDetail[];
  
  amount_tendered: number;
  change_given: number;
  
  // BNPL Integration
  is_bnpl: boolean;
  bnpl_purchase_id?: string;
  down_payment?: number;
  financed_amount?: number;
  
  // Loyalty
  loyalty_points_earned?: number;
  loyalty_points_redeemed?: number;
  
  // Status
  status: 'completed' | 'pending' | 'voided' | 'refunded' | 'partially_refunded';
  void_reason?: string;
  voided_by?: string;
  voided_at?: Date;
  
  // Receipt
  receipt_number: string;
  receipt_printed: boolean;
  email_receipt: boolean;
  customer_email?: string;
  
  // Staff
  cashier_id: string;
  cashier_name: string;
  supervisor_id?: string;
  
  // Notes
  notes?: string;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface PosLargePaymentDetail {
  payment_method: string;
  amount: number;
  reference_number?: string;
  card_last_4_digits?: string;
  approval_code?: string;
}

export interface PosLargeSaleItem {
  id: string;
  sale_id: string;
  tenant_id: string;
  
  // Product
  product_id: string;
  product_name: string;
  barcode: string;
  sku: string;
  category_name?: string;
  
  // Quantity & Units
  quantity: number;
  unit: string;
  
  // Pricing
  unit_price: number;
  original_price?: number; // If there's a promo
  subtotal: number;
  
  // Discount
  discount_amount: number;
  discount_type?: 'product_promo' | 'manual' | 'loyalty';
  line_total: number;
  
  // Tax
  is_taxable: boolean;
  tax_rate: number;
  tax_amount: number;
  
  // Cost (for profit calculation)
  unit_cost: number;
  line_cost: number;
  line_profit: number;
  
  // Promotions
  promo_id?: string;
  promo_name?: string;
  
  // Status
  is_voided: boolean;
  void_reason?: string;
  
  // Metadata
  created_at: Date;
}

export interface PosLargeRefund {
  id: string;
  tenant_id: string;
  branch_id: string;
  terminal_id: string;
  
  // Original Sale
  original_sale_id: string;
  original_transaction_number: string;
  original_sale_date: Date;
  
  // Refund Details
  refund_number: string;
  refund_date: Date;
  refund_type: 'full' | 'partial';
  
  // Items Being Refunded
  refund_items: {
    sale_item_id: string;
    product_name: string;
    quantity: number;
    amount: number;
  }[];
  
  // Amounts
  refund_amount: number;
  restocking_fee?: number;
  final_refund_amount: number;
  
  // Method
  refund_method: 'cash' | 'card' | 'store_credit' | 'original_payment';
  
  // Reason
  refund_reason: string;
  customer_complaint?: string;
  
  // Approval
  requires_approval: boolean;
  approved_by?: string;
  approval_date?: Date;
  
  // Customer
  customer_id?: string;
  customer_name?: string;
  
  // Receipt
  refund_receipt_number: string;
  
  // Notes
  notes?: string;
  
  // Metadata
  processed_by: string;
  created_at: Date;
}

export interface PosLargeVoid {
  id: string;
  tenant_id: string;
  branch_id: string;
  
  // Voided Transaction
  voided_sale_id: string;
  voided_transaction_number: string;
  void_reason: string;
  
  // Authorization
  authorized_by: string;
  authorization_code?: string;
  
  // Customer
  customer_notified: boolean;
  
  // Metadata
  voided_by: string;
  voided_at: Date;
}

export interface CreatePosLargeSaleData {
  terminal_id: string;
  customer_id?: string;
  customer_name?: string;
  items: CreatePosLargeSaleItemData[];
  discount_amount?: number;
  discount_reason?: string;
  promo_codes?: string[];
  payments: {
    payment_method: string;
    amount: number;
    reference_number?: string;
  }[];
  amount_tendered: number;
  is_bnpl?: boolean;
  down_payment?: number;
  email_receipt?: boolean;
  customer_email?: string;
  notes?: string;
}

export interface CreatePosLargeSaleItemData {
  product_id: string;
  quantity: number;
  unit_price?: number; // Optional, can be fetched from product
  discount_amount?: number;
}

export interface CreatePosLargeRefundData {
  original_sale_id: string;
  refund_type: 'full' | 'partial';
  items: {
    sale_item_id: string;
    quantity: number;
  }[];
  refund_reason: string;
  refund_method: 'cash' | 'card' | 'store_credit' | 'original_payment';
  restocking_fee?: number;
  notes?: string;
}

export interface PosLargeSalesStats {
  // Period
  date_from: Date;
  date_to: Date;
  
  // Overall
  total_sales: number;
  total_transactions: number;
  total_items_sold: number;
  total_profit: number;
  
  // Averages
  average_transaction: number;
  average_items_per_transaction: number;
  average_profit_margin: number;
  
  // Trends
  sales_trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
  
  // By Branch
  by_branch: {
    branch_id: string;
    branch_name: string;
    sales: number;
    transactions: number;
    percentage: number;
  }[];
  
  // By Terminal
  by_terminal: {
    terminal_code: string;
    branch_name: string;
    sales: number;
    transactions: number;
  }[];
  
  // By Payment Method
  by_payment: {
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
  
  // Top Products
  top_products: {
    product_name: string;
    quantity_sold: number;
    revenue: number;
    profit: number;
  }[];
  
  // Hourly Pattern
  hourly_sales: {
    hour: number;
    sales: number;
    transactions: number;
  }[];
}

export interface PosLargeDailySummary {
  tenant_id: string;
  branch_id?: string;
  date: Date;
  
  // Sales
  total_sales: number;
  total_transactions: number;
  total_items_sold: number;
  total_profit: number;
  
  // Payment Methods
  cash_sales: number;
  card_sales: number;
  ewallet_sales: number;
  bnpl_sales: number;
  
  // Adjustments
  total_discounts: number;
  total_refunds: number;
  total_voids: number;
  refund_count: number;
  void_count: number;
  
  // By Category
  sales_by_category: {
    category_name: string;
    revenue: number;
    quantity: number;
  }[];
  
  // By Hour
  sales_by_hour: {
    hour: number;
    sales: number;
    transactions: number;
  }[];
  
  // By Terminal
  sales_by_terminal: {
    terminal_code: string;
    sales: number;
    transactions: number;
  }[];
  
  // Staff Performance
  sales_by_cashier: {
    cashier_name: string;
    sales: number;
    transactions: number;
    average_transaction: number;
  }[];
}

export interface PosLargeCheckoutSession {
  items: PosLargeCheckoutItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  customer_id?: string;
  customer_name?: string;
  applied_promos: string[];
}

export interface PosLargeCheckoutItem {
  product_id: string;
  product_name: string;
  barcode: string;
  quantity: number;
  unit_price: number;
  original_price?: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  line_total: number;
  promo_applied?: string;
}
