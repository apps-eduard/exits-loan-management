/**
 * Pawn Ticket & Collateral Model
 * For Pawnshop feature
 */

export interface PawnTicket {
  id: string;
  tenant_id: string;
  customer_id: string;
  
  // Ticket Details
  ticket_number: string; // Auto-generated unique identifier
  ticket_date: Date;
  
  // Loan Details
  principal_amount: number;
  interest_rate: number; // Percentage per period
  interest_period: 'daily' | 'weekly' | 'monthly';
  
  // Terms
  loan_term_days: number;
  maturity_date: Date;
  grace_period_days: number;
  final_due_date: Date; // maturity_date + grace_period_days
  
  // Calculated Amounts
  interest_amount: number;
  service_charge: number;
  penalty_amount: number;
  total_redemption_amount: number;
  
  // Status
  status: 'active' | 'renewed' | 'redeemed' | 'expired' | 'forfeited' | 'auctioned';
  
  // Tracking
  renewal_count: number;
  last_renewal_date?: Date;
  redemption_date?: Date;
  forfeiture_date?: Date;
  
  // Assignment
  branch_id?: string;
  appraiser?: string;
  cashier?: string;
  
  // Notes
  notes?: string;
  terms_conditions?: string;
  
  // Metadata
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PawnCollateral {
  id: string;
  ticket_id: string;
  tenant_id: string;
  
  // Item Details
  item_category: 'jewelry' | 'electronics' | 'gadgets' | 'appliances' | 'vehicles' | 'documents' | 'other';
  item_type: string; // e.g., "Gold Ring", "iPhone 15", "Laptop"
  item_description: string;
  
  // Jewelry Specific
  metal_type?: 'gold' | 'silver' | 'platinum' | 'white_gold';
  karat?: string; // e.g., "18K", "21K", "24K"
  weight?: number; // in grams
  
  // Electronics/Gadgets Specific
  brand?: string;
  model?: string;
  serial_number?: string;
  imei?: string;
  
  // General Properties
  quantity: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Appraisal
  appraised_value: number;
  market_value: number;
  loan_value: number; // Usually 60-80% of appraised value
  
  // Documentation
  photos: string[]; // URLs to item photos
  appraisal_certificate_url?: string;
  
  // Storage
  storage_location: string;
  storage_bin?: string;
  storage_notes?: string;
  
  // Status
  status: 'active' | 'redeemed' | 'forfeited' | 'auctioned' | 'sold';
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface PawnRenewal {
  id: string;
  ticket_id: string;
  tenant_id: string;
  customer_id: string;
  
  renewal_number: number; // 1st, 2nd, 3rd renewal
  renewal_date: Date;
  
  // Previous terms
  previous_maturity_date: Date;
  previous_interest_amount: number;
  
  // New terms
  new_maturity_date: Date;
  new_grace_period_days: number;
  new_final_due_date: Date;
  
  // Payment for renewal
  renewal_interest_paid: number;
  renewal_service_charge: number;
  total_renewal_payment: number;
  
  payment_method: 'cash' | 'check' | 'bank_transfer' | 'other';
  receipt_number?: string;
  
  // Notes
  notes?: string;
  
  // Metadata
  processed_by?: string;
  created_at: Date;
}

export interface PawnRedemption {
  id: string;
  ticket_id: string;
  tenant_id: string;
  customer_id: string;
  
  redemption_date: Date;
  
  // Payment Breakdown
  principal_amount: number;
  interest_amount: number;
  service_charge: number;
  penalty_amount: number;
  total_redemption_amount: number;
  
  // Discount (if any)
  discount_amount: number;
  discount_reason?: string;
  
  // Payment
  amount_paid: number;
  payment_method: 'cash' | 'check' | 'bank_transfer' | 'other';
  reference_number?: string;
  
  // Receipt
  receipt_number: string;
  receipt_url?: string;
  
  // Release
  items_released: boolean;
  released_to: string;
  released_by?: string;
  
  // Notes
  notes?: string;
  
  // Metadata
  processed_by?: string;
  created_at: Date;
}

export interface PawnForfeiture {
  id: string;
  ticket_id: string;
  tenant_id: string;
  customer_id: string;
  
  forfeiture_date: Date;
  forfeiture_reason: 'expired' | 'customer_default' | 'non_redemption' | 'other';
  
  // Final amounts
  unredeemed_principal: number;
  unpaid_interest: number;
  total_loss: number;
  
  // Auction details (if planned)
  planned_for_auction: boolean;
  auction_date?: Date;
  minimum_bid?: number;
  
  // Sale details (if sold)
  sold: boolean;
  sale_date?: Date;
  sale_amount?: number;
  buyer_name?: string;
  
  // Recovery
  recovery_amount: number; // What was recovered from sale
  net_loss: number; // loss after recovery
  
  // Notes
  notes?: string;
  
  // Metadata
  processed_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PawnTicketStats {
  total_tickets: number;
  active_tickets: number;
  renewed_tickets: number;
  redeemed_tickets: number;
  expired_tickets: number;
  forfeited_tickets: number;
  
  total_principal_disbursed: number;
  total_interest_earned: number;
  total_outstanding: number;
  
  average_ticket_amount: number;
  average_interest_rate: number;
  
  tickets_due_today: number;
  tickets_due_this_week: number;
  overdue_tickets: number;
}

export interface CreatePawnTicketData {
  customer_id: string;
  
  ticket_date?: string;
  
  principal_amount: number;
  interest_rate: number;
  interest_period: 'daily' | 'weekly' | 'monthly';
  
  loan_term_days: number;
  grace_period_days: number;
  
  service_charge?: number;
  
  collateral_items: {
    item_category: string;
    item_type: string;
    item_description: string;
    
    metal_type?: string;
    karat?: string;
    weight?: number;
    
    brand?: string;
    model?: string;
    serial_number?: string;
    imei?: string;
    
    quantity: number;
    condition: string;
    
    appraised_value: number;
    market_value: number;
    loan_value: number;
    
    storage_location: string;
    storage_bin?: string;
  }[];
  
  branch_id?: string;
  appraiser?: string;
  
  notes?: string;
  terms_conditions?: string;
}

export interface PawnTicketCalculation {
  principal_amount: number;
  interest_rate: number;
  interest_period: string;
  loan_term_days: number;
  
  interest_amount: number;
  service_charge: number;
  total_redemption_amount: number;
  
  maturity_date: string;
  grace_period_days: number;
  final_due_date: string;
}
