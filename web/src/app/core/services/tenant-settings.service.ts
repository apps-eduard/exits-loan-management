import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TenantSetting {
  id: string;
  tenant_id: string;
  setting_key: string;
  setting_value: any;
  setting_type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  created_at: Date;
  updated_at: Date;
}

export interface CreateTenantSettingDto {
  setting_key: string;
  setting_value: any;
  setting_type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

export interface UpdateTenantSettingDto {
  setting_value: any;
  setting_type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TenantSettingsService {
  private readonly baseUrl = `${environment.apiUrl}/tenants/settings`;

  constructor(private http: HttpClient) {}

  /**
   * Get all settings for the current tenant
   */
  getTenantSettings(): Observable<ApiResponse<{ settings: TenantSetting[] }>> {
    return this.http.get<ApiResponse<{ settings: TenantSetting[] }>>(this.baseUrl);
  }

  /**
   * Get settings organized by category
   */
  getOrganizedTenantSettings(): Observable<ApiResponse<Record<string, any>>> {
    return this.http.get<ApiResponse<Record<string, any>>>(`${this.baseUrl}/organized`);
  }

  /**
   * Get a specific setting by key
   */
  getTenantSetting(key: string): Observable<ApiResponse<{ setting: TenantSetting }>> {
    return this.http.get<ApiResponse<{ setting: TenantSetting }>>(`${this.baseUrl}/${key}`);
  }

  /**
   * Get settings by category
   */
  getTenantSettingsByCategory(category: string): Observable<ApiResponse<{ category: string; settings: TenantSetting[] }>> {
    return this.http.get<ApiResponse<{ category: string; settings: TenantSetting[] }>>(`${this.baseUrl}/categories/${category}`);
  }

  /**
   * Create a new tenant setting
   */
  createTenantSetting(settingData: CreateTenantSettingDto): Observable<ApiResponse<{ setting: TenantSetting }>> {
    return this.http.post<ApiResponse<{ setting: TenantSetting }>>(this.baseUrl, settingData);
  }

  /**
   * Update an existing tenant setting
   */
  updateTenantSetting(key: string, settingData: UpdateTenantSettingDto): Observable<ApiResponse<{ setting: TenantSetting }>> {
    return this.http.put<ApiResponse<{ setting: TenantSetting }>>(`${this.baseUrl}/${key}`, settingData);
  }

  /**
   * Delete a tenant setting
   */
  deleteTenantSetting(key: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${key}`);
  }

  /**
   * Bulk update multiple settings
   */
  bulkUpdateTenantSettings(settingsData: Record<string, any>): Observable<ApiResponse<{ settings: TenantSetting[]; updated_count: number }>> {
    return this.http.put<ApiResponse<{ settings: TenantSetting[]; updated_count: number }>>(`${this.baseUrl}/bulk`, settingsData);
  }

  /**
   * Update company information settings
   */
  updateCompanyInfo(companyData: {
    company_name: string;
    contact_email: string;
    contact_phone: string;
    timezone: string;
    currency: string;
    locale: string;
  }): Observable<ApiResponse<{ setting: TenantSetting }>> {
    return this.updateTenantSetting('company_info', { setting_value: companyData });
  }

  /**
   * Update branding settings
   */
  updateBranding(brandingData: {
    primary_color: string;
    secondary_color: string;
    logo_url?: string;
  }): Observable<ApiResponse<{ setting: TenantSetting }>> {
    return this.updateTenantSetting('branding', { setting_value: brandingData });
  }

  /**
   * Update loan defaults settings
   */
  updateLoanDefaults(loanData: {
    default_interest_rate: number;
    default_term_months: number;
    max_loan_amount: number;
    min_loan_amount: number;
    late_fee_percentage: number;
    grace_period_days: number;
  }): Observable<ApiResponse<{ setting: TenantSetting }>> {
    return this.updateTenantSetting('loan_defaults', { setting_value: loanData });
  }
}
