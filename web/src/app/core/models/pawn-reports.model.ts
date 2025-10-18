/**
 * Pawnshop Reports Model
 * For Pawnshop feature
 */

export interface PawnshopDashboardStats {
  // Tickets
  active_tickets: number;
  tickets_due_today: number;
  tickets_due_this_week: number;
  overdue_tickets: number;
  
  // Financial
  total_principal_outstanding: number;
  total_interest_earned_today: number;
  total_interest_earned_this_month: number;
  total_redemptions_today: number;
  
  // Collateral
  total_collateral_items: number;
  total_collateral_value: number;
  
  // Customers
  active_customers: number;
  new_customers_this_month: number;
}

export interface PawnCollateralInventory {
  // Summary
  total_items: number;
  total_value: number;
  
  // By category
  by_category: {
    category: string;
    item_count: number;
    total_value: number;
  }[];
  
  // By location
  by_location: {
    location: string;
    item_count: number;
    total_value: number;
  }[];
  
  // By status
  by_status: {
    status: string;
    item_count: number;
    total_value: number;
  }[];
}

export interface PawnInterestReport {
  period: string;
  
  // Interest earned
  total_interest_earned: number;
  interest_from_redemptions: number;
  interest_from_renewals: number;
  
  // By period
  by_day?: {
    date: string;
    interest_earned: number;
    redemption_count: number;
    renewal_count: number;
  }[];
  
  by_month?: {
    month: string;
    interest_earned: number;
    redemption_count: number;
    renewal_count: number;
  }[];
}

export interface PawnPerformanceReport {
  period: string;
  
  // Tickets
  new_tickets_issued: number;
  tickets_redeemed: number;
  tickets_renewed: number;
  tickets_forfeited: number;
  
  // Financial
  total_principal_disbursed: number;
  total_interest_earned: number;
  total_redemptions: number;
  
  redemption_rate: number; // percentage
  renewal_rate: number; // percentage
  forfeiture_rate: number; // percentage
  
  // By branch
  by_branch?: {
    branch_name: string;
    new_tickets: number;
    redemptions: number;
    renewals: number;
    interest_earned: number;
  }[];
  
  // By appraiser
  by_appraiser?: {
    appraiser_name: string;
    tickets_appraised: number;
    total_loan_value: number;
    average_loan_value: number;
  }[];
}

export interface PawnAgingReport {
  // Active tickets by age
  age_0_30_days: {
    count: number;
    total_amount: number;
  };
  
  age_31_60_days: {
    count: number;
    total_amount: number;
  };
  
  age_61_90_days: {
    count: number;
    total_amount: number;
  };
  
  age_over_90_days: {
    count: number;
    total_amount: number;
  };
  
  // Overdue analysis
  overdue_tickets: {
    count: number;
    total_amount: number;
    average_days_overdue: number;
  };
  
  // At risk tickets (approaching maturity)
  due_this_week: {
    count: number;
    total_amount: number;
  };
  
  due_next_week: {
    count: number;
    total_amount: number;
  };
}

export interface OverdueTicket {
  ticket_id: string;
  ticket_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  
  principal_amount: number;
  total_redemption_amount: number;
  
  maturity_date: Date;
  final_due_date: Date;
  days_overdue: number;
  
  collateral_description: string;
  collateral_value: number;
  
  last_contact_date?: Date;
  assigned_collector?: string;
}

export interface PawnAuctionItem {
  id: string;
  ticket_id: string;
  ticket_number: string;
  
  collateral_id: string;
  item_description: string;
  item_photos: string[];
  
  appraised_value: number;
  starting_bid: number;
  current_bid?: number;
  
  auction_date: Date;
  auction_status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  
  winning_bidder?: string;
  final_sale_amount?: number;
}
