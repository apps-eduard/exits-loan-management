import { pool } from '../config/database';

export interface Tenant {
  id: string;
  company_name: string;
  slug: string;
  contact_email: string;
  contact_phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  status: 'active' | 'suspended' | 'trial';
  created_at: Date;
  updated_at: Date;
}

export interface TenantWithSubscription extends Tenant {
  subscription_plan: 'free' | 'basic' | 'professional' | 'enterprise' | 'custom';
  max_customers: number;
  max_loans: number;
  max_users: number;
  billing_cycle: 'monthly' | 'yearly' | 'lifetime';
  current_period_start?: Date;
  current_period_end?: Date;
  trial_ends_at?: Date;
}

export interface CreateTenantData {
  company_name: string;
  slug: string;
  contact_email: string;
  contact_phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  subscription_plan: 'free' | 'basic' | 'professional' | 'enterprise' | 'custom';
  billing_cycle?: 'monthly' | 'yearly';
}

export interface TenantStats {
  total_customers: number;
  total_loans: number;
  total_users: number;
  active_loans: number;
  total_loan_amount: number;
  total_payments: number;
}

export class TenantService {
  /**
   * Get all tenants with subscription info
   */
  async getAllTenants(): Promise<TenantWithSubscription[]> {
    const result = await pool.query(`
      SELECT 
        t.*,
        s.plan as subscription_plan,
        s.max_customers,
        s.max_loans,
        s.max_users,
        s.billing_cycle,
        s.starts_at as current_period_start,
        s.ends_at as current_period_end,
        s.trial_ends_at
      FROM tenants t
      LEFT JOIN subscriptions s ON t.id = s.tenant_id
      ORDER BY t.created_at DESC
    `);

    return result.rows;
  }

  /**
   * Get tenant by ID with subscription
   */
  async getTenantById(id: string): Promise<TenantWithSubscription | null> {
    const result = await pool.query(`
      SELECT 
        t.*,
        s.plan as subscription_plan,
        s.max_customers,
        s.max_loans,
        s.max_users,
        s.billing_cycle,
        s.starts_at as current_period_start,
        s.ends_at as current_period_end,
        s.trial_ends_at
      FROM tenants t
      LEFT JOIN subscriptions s ON t.id = s.tenant_id
      WHERE t.id = $1
    `, [id]);

    return result.rows[0] || null;
  }

  /**
   * Create new tenant with subscription
   */
  async createTenant(data: CreateTenantData): Promise<TenantWithSubscription> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create tenant
      const tenantResult = await client.query(`
        INSERT INTO tenants (
          company_name, slug, contact_email, contact_phone,
          address_line1, address_line2, city, state_province,
          postal_code, country, logo_url, primary_color, secondary_color,
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
        RETURNING *
      `, [
        data.company_name,
        data.slug,
        data.contact_email,
        data.contact_phone,
        data.address_line1,
        data.address_line2,
        data.city,
        data.state_province,
        data.postal_code,
        data.country,
        data.logo_url,
        data.primary_color,
        data.secondary_color,
        'trial' // New tenants start in trial
      ]);

      const tenantId = tenantResult.rows[0].id;

      // Set subscription limits based on plan
      const limits = this.getSubscriptionLimits(data.subscription_plan);
      
      // Create subscription
      await client.query(`
        INSERT INTO subscriptions (
          tenant_id, plan, max_customers, max_loans,
          max_users, billing_cycle, starts_at, ends_at,
          trial_ends_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '1 month', NOW() + INTERVAL '14 days', NOW(), NOW())
      `, [
        tenantId,
        data.subscription_plan,
        limits.max_customers,
        limits.max_loans,
        limits.max_users,
        data.billing_cycle || 'monthly'
      ]);

      await client.query('COMMIT');

      // Return complete tenant with subscription
      return await this.getTenantById(tenantId) as TenantWithSubscription;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update tenant
   */
  async updateTenant(id: string, updates: Partial<Tenant>): Promise<TenantWithSubscription | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.getTenantById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    await pool.query(`
      UPDATE tenants
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
    `, values);

    return this.getTenantById(id);
  }

  /**
   * Delete tenant (soft delete by setting status to 'suspended')
   */
  async deleteTenant(id: string): Promise<boolean> {
    const result = await pool.query(`
      UPDATE tenants
      SET status = 'suspended', updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `, [id]);

    return result.rowCount! > 0;
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats(tenantId: string): Promise<TenantStats> {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM customers WHERE tenant_id = $1) as total_customers,
        (SELECT COUNT(*) FROM loans WHERE tenant_id = $1) as total_loans,
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as total_users,
        (SELECT COUNT(*) FROM loans WHERE tenant_id = $1 AND status = 'active') as active_loans,
        (SELECT COALESCE(SUM(principal_amount), 0) FROM loans WHERE tenant_id = $1) as total_loan_amount,
        (SELECT COUNT(*) FROM payments WHERE loan_id IN (SELECT id FROM loans WHERE tenant_id = $1)) as total_payments
    `, [tenantId]);

    return result.rows[0];
  }

  /**
   * Get subscription limits for a plan
   */
  private getSubscriptionLimits(plan: string): { max_customers: number; max_loans: number; max_users: number } {
    const limits: Record<string, { max_customers: number; max_loans: number; max_users: number }> = {
      free: { max_customers: 10, max_loans: 50, max_users: 2 },
      basic: { max_customers: 100, max_loans: 500, max_users: 5 },
      professional: { max_customers: 1000, max_loans: 5000, max_users: 20 },
      enterprise: { max_customers: -1, max_loans: -1, max_users: -1 }, // Unlimited
      custom: { max_customers: -1, max_loans: -1, max_users: -1 }
    };

    return limits[plan] || limits.free;
  }
}
