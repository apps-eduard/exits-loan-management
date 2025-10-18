// Accounting & Finance Integration Model
// For syncing transactions and generating financial reports

export interface AccountingAccount {
  id: string;
  tenant_id: string;
  
  // Account Details
  account_code: string; // 1000, 2000, 3000, etc.
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_subtype?: string; // 'current_asset', 'fixed_asset', 'accounts_receivable'
  
  // Hierarchy
  parent_account_id?: string;
  level: number; // 0 = top level, 1 = sub-account
  
  // Balance
  normal_balance: 'debit' | 'credit';
  current_balance: number;
  opening_balance: number;
  
  // Configuration
  is_system_account: boolean; // Cannot be deleted
  allow_manual_entries: boolean;
  
  // Status
  is_active: boolean;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface JournalEntry {
  id: string;
  tenant_id: string;
  branch_id?: string;
  
  // Entry Details
  entry_number: string;
  entry_date: Date;
  entry_type: 'manual' | 'automatic' | 'adjustment' | 'closing';
  
  // Source
  source_module?: 'pos_small' | 'pos_large' | 'bnpl' | 'money_loan' | 'pawnshop' | 'manual';
  source_transaction_id?: string;
  source_transaction_type?: string;
  
  // Description
  description: string;
  reference_number?: string;
  
  // Totals
  total_debit: number;
  total_credit: number;
  
  // Status
  status: 'draft' | 'posted' | 'voided';
  posted_at?: Date;
  posted_by?: string;
  voided_at?: Date;
  voided_by?: string;
  void_reason?: string;
  
  // Period
  fiscal_year: number;
  fiscal_period: number; // 1-12
  
  // Metadata
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  tenant_id: string;
  
  // Account
  account_id: string;
  account_code: string;
  account_name: string;
  
  // Amount
  entry_type: 'debit' | 'credit';
  amount: number;
  
  // Description
  line_description?: string;
  
  // Dimensions (for tracking)
  branch_id?: string;
  department?: string;
  cost_center?: string;
  
  // Metadata
  created_at: Date;
}

export interface AccountingTransaction {
  id: string;
  tenant_id: string;
  journal_entry_id: string;
  
  // Transaction Details
  transaction_date: Date;
  transaction_type: string; // 'sale', 'payment', 'refund', 'loan_disbursement'
  
  // Source
  source_module: string;
  source_id: string;
  
  // Amount
  amount: number;
  
  // Status
  is_synced: boolean;
  sync_date?: Date;
  sync_error?: string;
  
  // Metadata
  created_at: Date;
}

export interface FiscalPeriod {
  id: string;
  tenant_id: string;
  
  // Period Details
  fiscal_year: number;
  period_number: number; // 1-12
  period_name: string; // 'January 2025', 'Q1 2025'
  
  // Dates
  start_date: Date;
  end_date: Date;
  
  // Status
  status: 'open' | 'closed' | 'locked';
  closed_at?: Date;
  closed_by?: string;
  
  // Stats
  total_entries: number;
  total_debits: number;
  total_credits: number;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface IncomeStatement {
  tenant_id: string;
  date_from: Date;
  date_to: Date;
  branch_id?: string;
  
  // Revenue
  total_revenue: number;
  revenue_breakdown: {
    category: string;
    amount: number;
  }[];
  
  // Cost of Goods Sold
  total_cogs: number;
  cogs_breakdown: {
    category: string;
    amount: number;
  }[];
  
  gross_profit: number;
  gross_profit_margin: number;
  
  // Operating Expenses
  total_operating_expenses: number;
  operating_expenses_breakdown: {
    category: string;
    amount: number;
  }[];
  
  operating_income: number;
  operating_margin: number;
  
  // Other Income/Expenses
  other_income: number;
  other_expenses: number;
  
  // Net Income
  net_income_before_tax: number;
  tax_expense: number;
  net_income: number;
  net_profit_margin: number;
}

export interface BalanceSheet {
  tenant_id: string;
  as_of_date: Date;
  branch_id?: string;
  
  // Assets
  current_assets: {
    cash: number;
    accounts_receivable: number;
    inventory: number;
    other_current_assets: number;
    total: number;
  };
  
  fixed_assets: {
    property_plant_equipment: number;
    accumulated_depreciation: number;
    net_fixed_assets: number;
  };
  
  other_assets: number;
  total_assets: number;
  
  // Liabilities
  current_liabilities: {
    accounts_payable: number;
    short_term_debt: number;
    accrued_expenses: number;
    other_current_liabilities: number;
    total: number;
  };
  
  long_term_liabilities: {
    long_term_debt: number;
    other_long_term_liabilities: number;
    total: number;
  };
  
  total_liabilities: number;
  
  // Equity
  equity: {
    owners_equity: number;
    retained_earnings: number;
    current_period_earnings: number;
    total: number;
  };
  
  total_liabilities_and_equity: number;
  
  // Validation
  is_balanced: boolean;
  balance_difference: number;
}

export interface CashFlowStatement {
  tenant_id: string;
  date_from: Date;
  date_to: Date;
  
  // Operating Activities
  operating_activities: {
    net_income: number;
    adjustments: {
      depreciation: number;
      accounts_receivable_change: number;
      inventory_change: number;
      accounts_payable_change: number;
      other_adjustments: number;
    };
    net_cash_from_operations: number;
  };
  
  // Investing Activities
  investing_activities: {
    equipment_purchases: number;
    asset_sales: number;
    other_investments: number;
    net_cash_from_investing: number;
  };
  
  // Financing Activities
  financing_activities: {
    loans_received: number;
    loan_repayments: number;
    owner_contributions: number;
    owner_withdrawals: number;
    net_cash_from_financing: number;
  };
  
  // Summary
  net_cash_change: number;
  beginning_cash: number;
  ending_cash: number;
}

export interface TrialBalance {
  tenant_id: string;
  as_of_date: Date;
  
  accounts: {
    account_code: string;
    account_name: string;
    account_type: string;
    debit_balance: number;
    credit_balance: number;
  }[];
  
  total_debits: number;
  total_credits: number;
  is_balanced: boolean;
  difference: number;
}

export interface AccountingReport {
  id: string;
  tenant_id: string;
  
  // Report Details
  report_type: 'income_statement' | 'balance_sheet' | 'cash_flow' | 'trial_balance' | 'ledger';
  report_name: string;
  
  // Period
  date_from?: Date;
  date_to?: Date;
  as_of_date?: Date;
  
  // Filters
  branch_id?: string;
  department?: string;
  
  // Status
  status: 'generating' | 'completed' | 'failed';
  
  // Output
  file_url?: string;
  file_format: 'pdf' | 'excel' | 'csv';
  
  // Metadata
  generated_by: string;
  generated_at: Date;
}

export interface ExportToExternalSystem {
  id: string;
  tenant_id: string;
  
  // System Details
  system_name: 'quickbooks' | 'xero' | 'excel' | 'custom';
  
  // Export Details
  export_type: 'journal_entries' | 'transactions' | 'full_sync';
  date_from: Date;
  date_to: Date;
  
  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  
  // Progress
  total_records: number;
  exported_records: number;
  failed_records: number;
  
  // Output
  export_file_url?: string;
  
  // Error Details
  error_message?: string;
  error_log?: string;
  
  // Metadata
  requested_by: string;
  started_at: Date;
  completed_at?: Date;
}

export interface CreateJournalEntryData {
  entry_date: Date;
  entry_type: 'manual' | 'adjustment';
  description: string;
  reference_number?: string;
  lines: {
    account_id: string;
    entry_type: 'debit' | 'credit';
    amount: number;
    line_description?: string;
  }[];
}

export interface AccountingDashboardStats {
  tenant_id: string;
  
  // Current Period
  current_period_revenue: number;
  current_period_expenses: number;
  current_period_profit: number;
  profit_margin: number;
  
  // Comparison
  previous_period_revenue: number;
  previous_period_profit: number;
  revenue_growth: number;
  profit_growth: number;
  
  // Balance Sheet Snapshot
  total_assets: number;
  total_liabilities: number;
  equity: number;
  
  // Cash Position
  cash_on_hand: number;
  accounts_receivable: number;
  accounts_payable: number;
  
  // Ratios
  current_ratio: number;
  quick_ratio: number;
  debt_to_equity_ratio: number;
  
  // Recent Activity
  recent_entries: {
    entry_number: string;
    entry_date: Date;
    description: string;
    amount: number;
    status: string;
  }[];
}
