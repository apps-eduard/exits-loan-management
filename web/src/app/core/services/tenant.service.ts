import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Tenant {
  id: string;
  company_name: string;
  slug: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  contact_email: string;
  contact_phone?: string;
  status: 'active' | 'suspended' | 'trial';
  subscription_plan?: 'free' | 'basic' | 'professional' | 'enterprise' | 'custom';
  max_customers?: number;
  max_loans?: number;
  max_users?: number;
  created_at: Date;
  updated_at: Date;
}

export interface TenantSettings {
  tenantId: string;
  settingKey: string;
  settingValue: any;
  dataType: 'string' | 'number' | 'boolean' | 'json';
}

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Current tenant context (from JWT)
  currentTenant = signal<Tenant | null>(null);
  currentTenantId = signal<string | null>(null);

  /**
   * Get current tenant from JWT token stored in auth
   */
  getCurrentTenantId(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.tenantId || null;
    } catch (error) {
      console.error('Failed to parse token', error);
      return null;
    }
  }

  /**
   * Get current tenant details
   */
  async loadCurrentTenant(): Promise<void> {
    const tenantId = this.getCurrentTenantId();
    if (!tenantId) {
      this.currentTenant.set(null);
      return;
    }

    try {
      const tenant = await this.getTenantById(tenantId);
      this.currentTenant.set(tenant);
      this.currentTenantId.set(tenantId);
    } catch (error) {
      console.error('Failed to load tenant', error);
      this.currentTenant.set(null);
    }
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(tenantId: string): Promise<Tenant> {
    return this.http.get<Tenant>(`${this.apiUrl}/tenants/${tenantId}`).toPromise() as Promise<Tenant>;
  }

  /**
   * Get all tenants (Super Admin only)
   */
  async getAllTenants(): Promise<Tenant[]> {
    const response = await this.http.get<any>(`${this.apiUrl}/super-admin/tenants`).toPromise();
    return response || [];
  }

  /**
   * Create new tenant (Public Registration)
   */
  async createTenant(data: any): Promise<any> {
    const response = await this.http.post<any>(`${this.apiUrl}/tenants/register`, data).toPromise();
    return response?.data || response;
  }

  /**
   * Create tenant by Super Admin (requires authentication)
   */
  async createTenantBySuperAdmin(data: Partial<Tenant>): Promise<Tenant> {
    const response = await this.http.post<any>(`${this.apiUrl}/super-admin/tenants`, data).toPromise();
    return response;
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, data: Partial<Tenant>): Promise<Tenant> {
    return this.http.put<Tenant>(`${this.apiUrl}/super-admin/tenants/${tenantId}`, data).toPromise() as Promise<Tenant>;
  }

  /**
   * Delete tenant (Super Admin only)
   */
  async deleteTenant(tenantId: string): Promise<void> {
    return this.http.delete<void>(`${this.apiUrl}/super-admin/tenants/${tenantId}`).toPromise();
  }

  /**
   * Get tenant settings
   */
  async getTenantSettings(tenantId: string): Promise<TenantSettings[]> {
    return this.http.get<TenantSettings[]>(`${this.apiUrl}/tenants/${tenantId}/settings`).toPromise() as Promise<TenantSettings[]>;
  }

  /**
   * Update tenant setting
   */
  async updateTenantSetting(tenantId: string, key: string, value: any): Promise<void> {
    return this.http.put<void>(`${this.apiUrl}/tenants/${tenantId}/settings/${key}`, { value }).toPromise();
  }
}
