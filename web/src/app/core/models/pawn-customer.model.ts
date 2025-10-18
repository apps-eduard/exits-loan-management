/**
 * Pawnshop Customer/Borrower Model
 * For Pawnshop feature
 */

export interface PawnCustomer {
  id: string;
  tenant_id: string;
  
  // Personal Information
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: Date;
  gender?: 'male' | 'female' | 'other';
  
  // Contact Information
  email?: string;
  phone_number: string;
  alternate_phone?: string;
  
  // Address
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province: string;
  postal_code?: string;
  country: string;
  
  // Identification
  id_type?: 'national_id' | 'drivers_license' | 'passport' | 'voters_id' | 'other';
  id_number?: string;
  id_photo_url?: string;
  
  // Customer Stats
  total_pawns: number;
  active_tickets: number;
  redeemed_tickets: number;
  renewed_tickets: number;
  forfeited_tickets: number;
  
  total_borrowed: number;
  total_redeemed: number;
  total_interest_paid: number;
  
  // Loyalty
  customer_since: Date;
  loyalty_tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  
  // Status
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted';
  suspension_reason?: string;
  
  // Notes
  notes?: string;
  
  // Metadata
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PawnCustomerStats {
  total_customers: number;
  active_customers: number;
  suspended_customers: number;
  
  customers_with_active_tickets: number;
  repeat_customers: number;
  
  average_loan_amount: number;
  total_active_loans: number;
}

export interface CreatePawnCustomerData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  
  email?: string;
  phone_number: string;
  alternate_phone?: string;
  
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province: string;
  postal_code?: string;
  country: string;
  
  id_type?: string;
  id_number?: string;
  
  notes?: string;
}
