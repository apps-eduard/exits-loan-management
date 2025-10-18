// Loyalty & Rewards Program Model
// For customer retention and repeat business across all modules

export interface LoyaltyProgram {
  id: string;
  tenant_id: string;
  
  // Program Details
  program_name: string;
  program_type: 'points' | 'cashback' | 'tier' | 'hybrid';
  description?: string;
  
  // Points Configuration
  points_per_currency?: number; // e.g., 1 point per ₱100 spent
  currency_per_point?: number; // e.g., 1 point = ₱1
  
  // Cashback Configuration
  cashback_percentage?: number;
  max_cashback_per_transaction?: number;
  
  // Earning Rules
  earn_on_purchase: boolean;
  earn_on_payment: boolean;
  earn_on_referral: boolean;
  
  // Applicable Modules
  applies_to_modules: ('pos_small' | 'pos_large' | 'bnpl' | 'money_loan' | 'pawnshop')[];
  
  // Redemption Rules
  min_points_to_redeem: number;
  points_expiry_days?: number;
  
  // Status
  is_active: boolean;
  start_date: Date;
  end_date?: Date;
  
  // Metadata
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface LoyaltyTier {
  id: string;
  tenant_id: string;
  program_id: string;
  
  // Tier Details
  tier_name: string; // Bronze, Silver, Gold, Platinum, Diamond
  tier_level: number; // 1, 2, 3, 4, 5
  tier_color?: string;
  tier_icon?: string;
  
  // Requirements
  min_points_required: number;
  min_transactions_required?: number;
  min_total_spent?: number;
  
  // Benefits
  points_multiplier: number; // 1x, 1.5x, 2x, 3x
  discount_percentage?: number;
  cashback_percentage?: number;
  
  // Perks
  perks: string[]; // ['Free delivery', 'Priority support', 'Exclusive deals']
  
  // Status
  is_active: boolean;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface CustomerLoyalty {
  id: string;
  tenant_id: string;
  customer_id: string;
  program_id: string;
  
  // Customer Info
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  
  // Points
  total_points_earned: number;
  points_redeemed: number;
  points_expired: number;
  current_points_balance: number;
  
  // Cashback
  total_cashback_earned: number;
  cashback_redeemed: number;
  cashback_balance: number;
  
  // Tier
  current_tier_id?: string;
  current_tier_name?: string;
  tier_achieved_date?: Date;
  
  // Activity
  total_transactions: number;
  total_spent: number;
  last_activity_date: Date;
  
  // Status
  status: 'active' | 'inactive' | 'suspended';
  member_since: Date;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface LoyaltyTransaction {
  id: string;
  tenant_id: string;
  customer_loyalty_id: string;
  customer_id: string;
  program_id: string;
  
  // Transaction Details
  transaction_type: 'earn' | 'redeem' | 'expire' | 'adjustment';
  transaction_date: Date;
  
  // Points
  points_change: number; // Positive for earn, negative for redeem
  points_before: number;
  points_after: number;
  
  // Cashback
  cashback_change?: number;
  
  // Source
  source_module: 'pos_small' | 'pos_large' | 'bnpl' | 'money_loan' | 'pawnshop' | 'referral' | 'manual';
  source_transaction_id?: string;
  source_transaction_type?: string; // 'sale', 'payment', 'redemption', 'referral'
  source_amount?: number;
  
  // Redemption Details (if transaction_type = 'redeem')
  redeemed_for?: string; // 'discount', 'cashback', 'product', 'voucher'
  redemption_value?: number;
  
  // Expiration Details (if transaction_type = 'expire')
  expiry_reason?: string;
  original_earn_date?: Date;
  
  // Notes
  notes?: string;
  
  // Metadata
  processed_by?: string;
  created_at: Date;
}

export interface LoyaltyReward {
  id: string;
  tenant_id: string;
  program_id: string;
  
  // Reward Details
  reward_name: string;
  reward_type: 'discount' | 'product' | 'cashback' | 'voucher' | 'free_item';
  description: string;
  
  // Cost
  points_cost: number;
  
  // Discount Reward
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  
  // Product Reward
  product_id?: string;
  product_name?: string;
  
  // Voucher Reward
  voucher_code_prefix?: string;
  voucher_value?: number;
  
  // Availability
  stock_quantity?: number;
  redeemed_count: number;
  
  // Restrictions
  min_purchase_amount?: number;
  applicable_categories?: string[];
  tier_required?: string;
  
  // Validity
  start_date: Date;
  end_date?: Date;
  
  // Status
  is_active: boolean;
  
  // Metadata
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface LoyaltyRedemption {
  id: string;
  tenant_id: string;
  customer_loyalty_id: string;
  customer_id: string;
  reward_id: string;
  
  // Redemption Details
  redemption_date: Date;
  points_used: number;
  reward_name: string;
  reward_type: string;
  
  // Redemption Value
  redemption_value: number;
  
  // Voucher (if applicable)
  voucher_code?: string;
  voucher_used: boolean;
  voucher_used_date?: Date;
  
  // Usage
  used_in_transaction_id?: string;
  used_in_module?: string;
  
  // Status
  status: 'pending' | 'active' | 'used' | 'expired' | 'cancelled';
  expiry_date?: Date;
  
  // Metadata
  redeemed_at_branch?: string;
  processed_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface LoyaltyReferral {
  id: string;
  tenant_id: string;
  program_id: string;
  
  // Referrer
  referrer_customer_id: string;
  referrer_name: string;
  referrer_code: string;
  
  // Referee
  referee_customer_id: string;
  referee_name: string;
  referee_phone?: string;
  
  // Referral Details
  referral_date: Date;
  referral_source?: string; // 'app', 'sms', 'social_media'
  
  // Rewards
  referrer_points_earned: number;
  referee_points_earned: number;
  referrer_cashback_earned?: number;
  referee_cashback_earned?: number;
  
  // Status
  status: 'pending' | 'qualified' | 'rewarded' | 'expired';
  qualified_date?: Date; // When referee made first purchase
  rewarded_date?: Date;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

export interface CreateLoyaltyProgramData {
  program_name: string;
  program_type: 'points' | 'cashback' | 'tier' | 'hybrid';
  points_per_currency?: number;
  cashback_percentage?: number;
  applies_to_modules: string[];
  min_points_to_redeem?: number;
  points_expiry_days?: number;
}

export interface CreateCustomerLoyaltyData {
  customer_id: string;
  program_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
}

export interface RedeemLoyaltyRewardData {
  customer_loyalty_id: string;
  reward_id: string;
  notes?: string;
}

export interface LoyaltyDashboardStats {
  tenant_id: string;
  program_id: string;
  
  // Members
  total_members: number;
  active_members: number;
  new_members_this_month: number;
  
  // Points
  total_points_issued: number;
  total_points_redeemed: number;
  total_points_expired: number;
  outstanding_points: number;
  
  // Cashback
  total_cashback_issued: number;
  total_cashback_redeemed: number;
  outstanding_cashback: number;
  
  // Redemptions
  total_redemptions: number;
  redemptions_this_month: number;
  most_popular_rewards: {
    reward_name: string;
    redemption_count: number;
  }[];
  
  // Tiers
  members_by_tier: {
    tier_name: string;
    member_count: number;
    percentage: number;
  }[];
  
  // Referrals
  total_referrals: number;
  successful_referrals: number;
  referral_conversion_rate: number;
  
  // Engagement
  average_points_per_member: number;
  average_redemptions_per_member: number;
  member_retention_rate: number;
}

export interface LoyaltyReport {
  date_from: Date;
  date_to: Date;
  
  // Activity Summary
  points_earned: number;
  points_redeemed: number;
  points_expired: number;
  cashback_earned: number;
  cashback_redeemed: number;
  
  // By Module
  activity_by_module: {
    module_name: string;
    points_earned: number;
    transactions: number;
  }[];
  
  // Top Earners
  top_earners: {
    customer_name: string;
    points_earned: number;
    transactions: number;
  }[];
  
  // Top Redeemers
  top_redeemers: {
    customer_name: string;
    points_redeemed: number;
    redemption_count: number;
  }[];
  
  // Tier Performance
  tier_performance: {
    tier_name: string;
    member_count: number;
    total_spent: number;
    average_transaction: number;
  }[];
}
