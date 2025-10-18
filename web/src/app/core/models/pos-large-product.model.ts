// Large Retail POS - Product & Inventory Model
// For supermarkets, groceries, and large retail stores

export interface PosLargeProduct {
  id: string;
  tenant_id: string;
  branch_id?: string; // Multi-branch support
  
  // Product Identification
  barcode: string;
  sku: string;
  product_name: string;
  description?: string;
  category_id: string;
  category_name?: string;
  subcategory?: string;
  brand?: string;
  manufacturer?: string;
  
  // Product Variants
  has_variants: boolean;
  parent_product_id?: string; // If this is a variant
  variant_attributes?: Record<string, string>; // e.g., {size: "Large", color: "Red"}
  
  // Units & Packaging
  base_unit: string; // piece, kg, liter, etc.
  unit_conversion?: {
    pack_size: number;
    pack_unit: string;
    pack_barcode?: string;
  };
  
  // Pricing
  cost_price: number;
  selling_price: number;
  wholesale_price?: number;
  promo_price?: number;
  promo_start_date?: Date;
  promo_end_date?: Date;
  price_by_branch?: {
    branch_id: string;
    selling_price: number;
  }[];
  
  // Bulk Pricing
  bulk_pricing?: {
    min_quantity: number;
    price: number;
  }[];
  
  // Inventory (Multi-branch)
  inventory: {
    branch_id: string;
    branch_name: string;
    stock_on_hand: number;
    reserved_stock: number;
    available_stock: number;
    reorder_level: number;
    reorder_quantity: number;
    max_stock_level?: number;
  }[];
  
  // Total across all branches
  total_stock: number;
  
  // Stock Alerts
  low_stock_alert: boolean;
  out_of_stock_alert: boolean;
  
  // Combo Products
  is_combo: boolean;
  combo_items?: {
    product_id: string;
    quantity: number;
  }[];
  
  // Tax & Accounting
  is_taxable: boolean;
  tax_rate: number;
  tax_category?: string;
  
  // Status
  is_active: boolean;
  is_discontinued: boolean;
  
  // Metadata
  supplier_id?: string;
  supplier_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PosLargeCategory {
  id: string;
  tenant_id: string;
  
  category_name: string;
  parent_category_id?: string;
  level: number; // 0 = top level, 1 = subcategory, etc.
  
  // Display
  display_order: number;
  icon?: string;
  color?: string;
  
  // Stats
  product_count: number;
  
  // Status
  is_active: boolean;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface PosLargeStockMovement {
  id: string;
  tenant_id: string;
  branch_id: string;
  product_id: string;
  
  // Movement Details
  movement_type: 'in' | 'out' | 'transfer' | 'adjustment' | 'return' | 'damaged' | 'expired';
  quantity: number;
  unit_cost?: number;
  
  // Transfer Details (if transfer)
  from_branch_id?: string;
  to_branch_id?: string;
  
  // Reference
  reference_type?: 'purchase_order' | 'sale' | 'manual' | 'transfer';
  reference_id?: string;
  reference_number?: string;
  
  // Before/After
  stock_before: number;
  stock_after: number;
  
  // Notes
  notes?: string;
  
  // Metadata
  created_by: string;
  created_at: Date;
}

export interface PosLargePromotion {
  id: string;
  tenant_id: string;
  
  // Promotion Details
  promo_code: string;
  promo_name: string;
  description?: string;
  
  // Type
  promo_type: 'discount_percentage' | 'discount_fixed' | 'buy_x_get_y' | 'bundle' | 'free_shipping';
  
  // Discount Details
  discount_percentage?: number;
  discount_amount?: number;
  
  // Buy X Get Y
  buy_quantity?: number;
  get_quantity?: number;
  
  // Applicable Products
  applies_to: 'all' | 'categories' | 'products';
  category_ids?: string[];
  product_ids?: string[];
  
  // Minimum Purchase
  minimum_purchase_amount?: number;
  minimum_items?: number;
  
  // Validity
  start_date: Date;
  end_date: Date;
  
  // Usage Limits
  max_uses?: number;
  current_uses: number;
  max_uses_per_customer?: number;
  
  // Branches
  branch_ids?: string[];
  
  // Status
  is_active: boolean;
  
  // Metadata
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePosLargeProductData {
  barcode: string;
  sku: string;
  product_name: string;
  category_id: string;
  brand?: string;
  base_unit: string;
  cost_price: number;
  selling_price: number;
  is_taxable?: boolean;
  tax_rate?: number;
  branch_inventory?: {
    branch_id: string;
    initial_stock: number;
    reorder_level: number;
  }[];
}

export interface PosLargeInventoryStats {
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
  
  // Alerts
  low_stock_items: number;
  out_of_stock_items: number;
  expiring_soon: number;
  
  // Top Categories
  top_categories: {
    category_name: string;
    product_count: number;
    stock_value: number;
  }[];
}

export interface StockTransferRequest {
  from_branch_id: string;
  to_branch_id: string;
  items: {
    product_id: string;
    quantity: number;
  }[];
  notes?: string;
  requested_by: string;
  status: 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled';
}
