// Large Retail POS - Terminal & Branch Management Model
// For multi-terminal, multi-branch operations

export interface PosLargeTerminal {
  id: string;
  tenant_id: string;
  branch_id: string;
  
  // Terminal Details
  terminal_code: string;
  terminal_name: string;
  terminal_type: 'checkout' | 'self_service' | 'mobile' | 'kiosk';
  
  // Hardware Info
  device_id?: string;
  mac_address?: string;
  ip_address?: string;
  
  // Status
  status: 'active' | 'inactive' | 'maintenance' | 'offline';
  is_online: boolean;
  last_heartbeat?: Date;
  
  // Assigned Cashier
  assigned_cashier_id?: string;
  assigned_cashier_name?: string;
  
  // Current Session
  current_session_id?: string;
  session_start_time?: Date;
  opening_cash_amount?: number;
  
  // Configuration
  allow_discounts: boolean;
  allow_voids: boolean;
  allow_refunds: boolean;
  require_supervisor_approval: boolean;
  
  // Printer & Peripherals
  receipt_printer_enabled: boolean;
  barcode_scanner_enabled: boolean;
  cash_drawer_enabled: boolean;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface PosLargeTerminalSession {
  id: string;
  tenant_id: string;
  branch_id: string;
  terminal_id: string;
  
  // Session Details
  session_number: string;
  start_date: Date;
  start_time: string;
  end_date?: Date;
  end_time?: string;
  
  // Cashier
  cashier_id: string;
  cashier_name: string;
  
  // Opening/Closing Cash
  opening_cash: number;
  closing_cash?: number;
  cash_difference?: number;
  
  // Sales Summary
  total_transactions: number;
  total_items_sold: number;
  total_sales: number;
  
  // Payment Methods
  cash_sales: number;
  card_sales: number;
  ewallet_sales: number;
  bnpl_sales: number;
  
  // Adjustments
  total_discounts: number;
  total_refunds: number;
  total_voids: number;
  
  // Status
  status: 'open' | 'closed';
  
  // Notes
  opening_notes?: string;
  closing_notes?: string;
  
  // Metadata
  opened_by: string;
  closed_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PosLargeBranch {
  id: string;
  tenant_id: string;
  
  // Branch Details
  branch_code: string;
  branch_name: string;
  branch_type: 'main' | 'branch' | 'warehouse' | 'franchise';
  
  // Contact
  phone_number?: string;
  email?: string;
  
  // Address
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province: string;
  postal_code?: string;
  country: string;
  
  // Operations
  operating_hours?: string;
  timezone?: string;
  
  // Manager
  manager_id?: string;
  manager_name?: string;
  
  // Configuration
  allow_transfers: boolean;
  allow_returns: boolean;
  enable_inventory: boolean;
  
  // Stats
  terminal_count: number;
  staff_count: number;
  
  // Status
  status: 'active' | 'inactive' | 'temporarily_closed';
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface PosLargeShift {
  id: string;
  tenant_id: string;
  branch_id: string;
  
  // Shift Details
  shift_name: string; // Morning, Afternoon, Evening
  start_time: string;
  end_time: string;
  
  // Days of Week
  days_of_week: number[]; // 0=Sunday, 1=Monday, etc.
  
  // Staff
  required_cashiers: number;
  assigned_staff: string[];
  
  // Status
  is_active: boolean;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface CreatePosLargeTerminalData {
  branch_id: string;
  terminal_code: string;
  terminal_name: string;
  terminal_type: 'checkout' | 'self_service' | 'mobile' | 'kiosk';
  allow_discounts?: boolean;
  allow_voids?: boolean;
  allow_refunds?: boolean;
}

export interface CreatePosLargeTerminalSessionData {
  terminal_id: string;
  opening_cash: number;
  opening_notes?: string;
}

export interface ClosePosLargeTerminalSessionData {
  closing_cash: number;
  closing_notes?: string;
}

export interface PosLargeBranchStats {
  branch_id: string;
  branch_name: string;
  
  // Today
  today_sales: number;
  today_transactions: number;
  today_items_sold: number;
  
  // Active
  active_terminals: number;
  open_sessions: number;
  staff_on_duty: number;
  
  // Inventory
  total_products: number;
  low_stock_items: number;
  stock_value: number;
  
  // Performance
  average_transaction: number;
  items_per_transaction: number;
  top_selling_product?: string;
}

export interface TerminalPerformanceReport {
  terminal_id: string;
  terminal_code: string;
  branch_name: string;
  
  // Period
  date_from: Date;
  date_to: Date;
  
  // Sessions
  total_sessions: number;
  total_hours: number;
  
  // Sales
  total_transactions: number;
  total_sales: number;
  average_transaction: number;
  
  // Items
  total_items_sold: number;
  items_per_transaction: number;
  
  // Efficiency
  transactions_per_hour: number;
  downtime_hours: number;
  
  // Issues
  void_count: number;
  refund_count: number;
  error_count: number;
}
