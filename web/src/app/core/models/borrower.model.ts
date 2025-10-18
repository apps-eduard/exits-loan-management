/**
 * Borrower/Client Model for Money Loan Feature
 */

export interface Borrower {
  id: string;
  tenant_id: string;
  
  // Personal Details
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: Date;
  gender?: 'male' | 'female' | 'other';
  civil_status?: 'single' | 'married' | 'widowed' | 'separated' | 'divorced';
  
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
  id_type?: 'national_id' | 'drivers_license' | 'passport' | 'sss' | 'tin' | 'other';
  id_number?: string;
  
  // Employment/Income
  employer?: string;
  occupation?: string;
  monthly_income?: number;
  source_of_income?: string;
  
  // Credit Information
  credit_score?: number;
  credit_rating?: 'excellent' | 'good' | 'fair' | 'poor';
  total_borrowed?: number;
  total_paid?: number;
  outstanding_balance?: number;
  active_loans_count?: number;
  
  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  // Status
  status: 'active' | 'inactive' | 'blacklisted';
  blacklist_reason?: string;
  
  // Notes
  notes?: string;
  
  // Metadata
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface BorrowerDocument {
  id: string;
  borrower_id: string;
  tenant_id: string;
  
  document_type: 'id' | 'proof_of_income' | 'proof_of_address' | 'application' | 'contract' | 'other';
  document_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  
  uploaded_by?: string;
  uploaded_at: Date;
}

export interface BorrowerStats {
  total_borrowers: number;
  active_borrowers: number;
  inactive_borrowers: number;
  blacklisted_borrowers: number;
  average_credit_score?: number;
}

export interface CreateBorrowerData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  civil_status?: string;
  
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
  source_of_income?: string;
  
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  notes?: string;
}
