// Large Retail POS - Reports & Analytics Model
// For comprehensive reporting and business intelligence

export interface PosLargeDashboardStats {
  tenant_id: string;
  generated_at: Date;
  
  // Today's Performance
  today: {
    sales: number;
    transactions: number;
    items_sold: number;
    profit: number;
    average_transaction: number;
    
    // Comparison with yesterday
    sales_change: number;
    sales_change_percentage: number;
    transactions_change: number;
  };
  
  // Week Performance
  this_week: {
    sales: number;
    transactions: number;
    profit: number;
    average_daily_sales: number;
  };
  
  // Month Performance
  this_month: {
    sales: number;
    transactions: number;
    profit: number;
    average_daily_sales: number;
    projected_monthly_sales: number;
  };
  
  // Live Stats
  active_terminals: number;
  open_sessions: number;
  current_customers_in_store: number;
  
  // Inventory Alerts
  low_stock_items: number;
  out_of_stock_items: number;
  expiring_soon: number;
  
  // Top Performers
  top_selling_product: {
    product_name: string;
    quantity_sold: number;
  };
  
  top_branch: {
    branch_name: string;
    sales: number;
  };
  
  top_cashier: {
    cashier_name: string;
    transactions: number;
    sales: number;
  };
  
  // Payment Methods Today
  payment_breakdown: {
    method: string;
    amount: number;
    percentage: number;
  }[];
}

export interface PosLargeSalesReport {
  // Period
  date_from: Date;
  date_to: Date;
  branch_id?: string;
  
  // Summary
  total_sales: number;
  total_transactions: number;
  total_items_sold: number;
  total_cost: number;
  total_profit: number;
  profit_margin: number;
  
  // Averages
  average_transaction: number;
  average_items_per_transaction: number;
  average_profit_per_transaction: number;
  
  // By Branch
  by_branch: {
    branch_id: string;
    branch_name: string;
    sales: number;
    transactions: number;
    profit: number;
    percentage_of_total: number;
  }[];
  
  // By Category
  by_category: {
    category_name: string;
    sales: number;
    quantity: number;
    profit: number;
    percentage_of_total: number;
  }[];
  
  // By Product
  top_products: {
    product_id: string;
    product_name: string;
    quantity_sold: number;
    revenue: number;
    profit: number;
    profit_margin: number;
  }[];
  
  // By Payment Method
  by_payment: {
    payment_method: string;
    amount: number;
    transaction_count: number;
    percentage: number;
  }[];
  
  // Daily Breakdown
  daily_sales: {
    date: Date;
    sales: number;
    transactions: number;
    items_sold: number;
    profit: number;
  }[];
  
  // Hourly Pattern
  hourly_pattern: {
    hour: number;
    sales: number;
    transactions: number;
    peak_indicator: boolean;
  }[];
  
  // Day of Week Pattern
  day_of_week: {
    day: string;
    sales: number;
    transactions: number;
  }[];
}

export interface PosLargeInventoryReport {
  generated_at: Date;
  branch_id?: string;
  
  // Summary
  total_products: number;
  total_categories: number;
  total_stock_value: number;
  
  // By Branch
  by_branch: {
    branch_id: string;
    branch_name: string;
    product_count: number;
    stock_value: number;
    low_stock_items: number;
    out_of_stock_items: number;
  }[];
  
  // By Category
  by_category: {
    category_name: string;
    product_count: number;
    total_quantity: number;
    stock_value: number;
    percentage: number;
  }[];
  
  // Stock Alerts
  low_stock: {
    product_id: string;
    product_name: string;
    branch_name: string;
    current_stock: number;
    reorder_level: number;
    reorder_quantity: number;
    estimated_stockout_days: number;
  }[];
  
  out_of_stock: {
    product_id: string;
    product_name: string;
    branch_name: string;
    last_stock_date: Date;
    lost_sales_estimate: number;
  }[];
  
  // Slow Moving Items
  slow_moving: {
    product_id: string;
    product_name: string;
    current_stock: number;
    stock_value: number;
    days_without_sale: number;
    last_sale_date: Date;
  }[];
  
  // Fast Moving Items
  fast_moving: {
    product_id: string;
    product_name: string;
    current_stock: number;
    average_daily_sales: number;
    days_until_stockout: number;
  }[];
  
  // Stock Valuation
  stock_valuation: {
    total_cost_value: number;
    total_selling_value: number;
    potential_profit: number;
    dead_stock_value: number;
  };
}

export interface PosLargeStaffPerformanceReport {
  date_from: Date;
  date_to: Date;
  branch_id?: string;
  
  // By Cashier
  by_cashier: {
    cashier_id: string;
    cashier_name: string;
    branch_name: string;
    
    // Performance
    total_transactions: number;
    total_sales: number;
    total_items_sold: number;
    average_transaction: number;
    items_per_transaction: number;
    
    // Time
    total_hours_worked: number;
    total_sessions: number;
    transactions_per_hour: number;
    sales_per_hour: number;
    
    // Issues
    void_count: number;
    refund_count: number;
    discount_count: number;
    
    // Customer Satisfaction
    customer_complaints: number;
    positive_feedback: number;
    
    // Ranking
    sales_rank: number;
    efficiency_rank: number;
  }[];
  
  // Branch Comparison
  by_branch: {
    branch_name: string;
    staff_count: number;
    total_sales: number;
    average_sales_per_staff: number;
  }[];
  
  // Shift Performance
  by_shift: {
    shift_name: string;
    total_transactions: number;
    total_sales: number;
    staff_count: number;
  }[];
}

export interface PosLargeCustomerReport {
  date_from: Date;
  date_to: Date;
  
  // Summary
  total_customers: number;
  new_customers: number;
  repeat_customers: number;
  repeat_rate: number;
  
  // Top Customers
  top_customers: {
    customer_id: string;
    customer_name: string;
    total_purchases: number;
    total_spent: number;
    average_transaction: number;
    visit_count: number;
    last_visit_date: Date;
  }[];
  
  // Customer Segments
  by_spending: {
    segment: 'high_value' | 'medium_value' | 'low_value';
    customer_count: number;
    total_spent: number;
    percentage: number;
  }[];
  
  // Customer Behavior
  purchase_frequency: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
    customer_count: number;
    average_spent: number;
  }[];
  
  // Payment Preferences
  payment_preferences: {
    payment_method: string;
    customer_count: number;
    percentage: number;
  }[];
}

export interface PosLargeFinancialReport {
  date_from: Date;
  date_to: Date;
  
  // Revenue
  gross_sales: number;
  total_discounts: number;
  total_refunds: number;
  net_sales: number;
  
  // Costs
  cost_of_goods_sold: number;
  gross_profit: number;
  gross_profit_margin: number;
  
  // Tax
  total_tax_collected: number;
  taxable_sales: number;
  non_taxable_sales: number;
  
  // By Payment Method
  revenue_by_payment: {
    payment_method: string;
    amount: number;
    percentage: number;
  }[];
  
  // By Branch
  revenue_by_branch: {
    branch_name: string;
    gross_sales: number;
    net_sales: number;
    profit: number;
    profit_margin: number;
  }[];
  
  // Daily Revenue
  daily_revenue: {
    date: Date;
    gross_sales: number;
    net_sales: number;
    profit: number;
  }[];
}

export interface PosLargePromotionReport {
  date_from: Date;
  date_to: Date;
  
  // By Promotion
  by_promotion: {
    promo_code: string;
    promo_name: string;
    times_used: number;
    total_discount_given: number;
    revenue_generated: number;
    roi: number; // Revenue / Discount
    average_transaction: number;
  }[];
  
  // Effectiveness
  total_discounts: number;
  revenue_from_promos: number;
  promo_conversion_rate: number;
  
  // Popular Promos
  most_used_promos: {
    promo_name: string;
    usage_count: number;
  }[];
}

export interface PosLargeExportOptions {
  report_type: 'sales' | 'inventory' | 'staff' | 'customer' | 'financial' | 'promotion';
  date_from: Date;
  date_to: Date;
  branch_id?: string;
  format: 'pdf' | 'excel' | 'csv';
  include_charts: boolean;
  email_to?: string;
}
