/**
 * BNPL Customer Model
 * For Buy Now, Pay Later feature
 */

export interface BnplCustomer {
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
  
  // Employment
  employer?: string;
  occupation?: string;
  monthly_income?: number;
  
  // Credit Profile
  credit_limit: number;
  available_credit: number;
  total_purchases: number;
  total_paid: number;
  outstanding_balance: number;
  
  // Payment Behavior
  on_time_payments: number;
  late_payments: number;
  defaulted_payments: number;
  credit_score?: number;
  credit_rating?: 'excellent' | 'good' | 'fair' | 'poor' | 'bad';
  
  // Status
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted';
  suspension_reason?: string;
  
  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  // Notes
  notes?: string;
  
  // Metadata
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface BnplCustomerStats {
  total_customers: number;
  active_customers: number;
  suspended_customers: number;
  
  total_credit_limit: number;
  total_outstanding: number;
  average_credit_score?: number;
  
  customers_with_active_purchases: number;
  customers_with_overdue: number;
}

export interface CreateBnplCustomerData {
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
  
  employer?: string;
  occupation?: string;
  monthly_income?: number;
  
  credit_limit: number;
  
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  notes?: string;
}
