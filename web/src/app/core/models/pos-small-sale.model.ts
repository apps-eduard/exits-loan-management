// Small Retail POS - Sales & Checkout Model
// For lightweight POS operations in sari-sari stores

export interface PosSmallSale {
  id: string;
  tenant_id: string;
  
  // Sale Details
  sale_number: string;
  sale_date: Date;
  sale_time: string;
  
  // Customer
  customer_id?: string;
  customer_name?: string;
  
  // Items
  total_items: number;
  
  // Amounts
  subtotal: number;
  discount_amount: number;
  discount_type?: 'fixed' | 'percentage';
  discount_reason?: string;
  total_amount: number;
  
  // Payment
  payment_method: 'cash' | 'credit' | 'gcash' | 'bank_transfer' | 'bnpl' | 'check' | 'mixed';
  amount_tendered?: number;
  change_given?: number;
  
  // Credit Sale
  is_credit_sale: boolean;
  credit_account_id?: string;
  down_payment?: number;
  credit_amount?: number;
  
  // BNPL Integration
  is_bnpl: boolean;
  bnpl_purchase_id?: string;
  
  // Status
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
  
  // Sync
  synced: boolean;
  sync_date?: Date;
  offline_sale: boolean;
  
  // Notes
  notes?: string;
  
  // Metadata
  cashier_id: string;
  cashier_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface PosSmallSaleItem {
  id: string;
  sale_id: string;
  tenant_id: string;
  
  // Product
  product_id: string;
  product_name: string;
  barcode?: string;
  sku?: string;
  
  // Quantity & Pricing
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
  
  // Discount (per item)
  discount_amount: number;
  line_total: number;
  
  // Cost (for profit calculation)
  unit_cost?: number;
  
  // Metadata
  created_at: Date;
}

export interface PosSmallDailySummary {
  tenant_id: string;
  date: Date;
  
  // Sales
  total_sales: number;
  total_revenue: number;
  total_profit: number;
  
  // Transactions
  transaction_count: number;
  items_sold: number;
  average_transaction: number;
  
  // Payment Methods
  cash_sales: number;
  credit_sales: number;
  gcash_sales: number;
  bnpl_sales: number;
  other_sales: number;
  
  // Top Products
  top_selling_products: {
    product_id: string;
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }[];
  
  // Hourly Breakdown
  sales_by_hour: {
    hour: number;
    sales: number;
    transactions: number;
  }[];
  
  // Cashiers
  sales_by_cashier: {
    cashier_id: string;
    cashier_name: string;
    sales: number;
    transactions: number;
  }[];
}

export interface CreatePosSmallSaleData {
  customer_id?: string;
  customer_name?: string;
  items: CreatePosSmallSaleItemData[];
  discount_amount?: number;
  discount_type?: 'fixed' | 'percentage';
  discount_reason?: string;
  payment_method: 'cash' | 'credit' | 'gcash' | 'bank_transfer' | 'bnpl' | 'check' | 'mixed';
  amount_tendered?: number;
  is_credit_sale?: boolean;
  down_payment?: number;
  is_bnpl?: boolean;
  notes?: string;
}

export interface CreatePosSmallSaleItemData {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
}

export interface PosSmallSalesStats {
  today_sales: number;
  today_transactions: number;
  today_profit: number;
  week_sales: number;
  month_sales: number;
  year_sales: number;
  
  // Trends
  sales_trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
  
  // Top Products (Last 7 days)
  top_products: {
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }[];
  
  // Payment Methods (Last 30 days)
  payment_breakdown: {
    method: string;
    amount: number;
    percentage: number;
  }[];
}

export interface PosSmallSalesReport {
  date_from: Date;
  date_to: Date;
  
  // Summary
  total_sales: number;
  total_transactions: number;
  total_items_sold: number;
  total_profit: number;
  average_transaction: number;
  
  // By Category
  sales_by_category: {
    category: string;
    revenue: number;
    quantity: number;
    percentage: number;
  }[];
  
  // By Product
  sales_by_product: {
    product_name: string;
    quantity: number;
    revenue: number;
    profit: number;
  }[];
  
  // By Payment Method
  sales_by_payment: {
    method: string;
    amount: number;
    count: number;
  }[];
  
  // By Day
  daily_sales: {
    date: Date;
    sales: number;
    transactions: number;
  }[];
}

export interface PosSmallCheckoutSession {
  items: PosSmallCheckoutItem[];
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  customer_id?: string;
  customer_name?: string;
  payment_method?: string;
}

export interface PosSmallCheckoutItem {
  product_id: string;
  product_name: string;
  barcode?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount_amount: number;
  line_total: number;
}
