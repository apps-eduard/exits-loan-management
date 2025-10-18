// Small Retail POS - Product/Inventory Model
// For sari-sari stores and small retail shops

export interface PosSmallProduct {
  id: string;
  tenant_id: string;
  
  // Product Details
  barcode?: string;
  sku?: string;
  product_name: string;
  category?: string;
  unit: string; // piece, pack, bottle, kg, etc.
  
  // Pricing
  cost_price: number;
  selling_price: number;
  wholesale_price?: number;
  
  // Inventory
  current_stock: number;
  reorder_level: number;
  low_stock_alert: boolean;
  
  // Status
  is_active: boolean;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface PosSmallStockMovement {
  id: string;
  tenant_id: string;
  product_id: string;
  
  // Movement Details
  movement_type: 'in' | 'out' | 'adjustment' | 'return';
  quantity: number;
  unit_cost?: number;
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

export interface PosSmallCategory {
  id: string;
  tenant_id: string;
  category_name: string;
  product_count: number;
  is_active: boolean;
  created_at: Date;
}

export interface CreatePosSmallProductData {
  barcode?: string;
  sku?: string;
  product_name: string;
  category?: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  wholesale_price?: number;
  current_stock: number;
  reorder_level: number;
}

export interface PosSmallInventoryAlert {
  product_id: string;
  product_name: string;
  current_stock: number;
  reorder_level: number;
  status: 'low_stock' | 'out_of_stock';
  days_until_stockout?: number;
}

export interface PosSmallInventoryStats {
  total_products: number;
  total_value: number; // Sum of (cost_price * current_stock)
  low_stock_items: number;
  out_of_stock_items: number;
  categories: number;
}
