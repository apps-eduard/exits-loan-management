import { pool } from '../config/database';
import HttpException from '../utils/http-exception';
import { StatusCodes } from 'http-status-codes';

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

export class TenantSettingsService {
  
  /**
   * Get all settings for a tenant
   */
  async getTenantSettings(tenantId: string): Promise<TenantSetting[]> {
    try {
      const result = await pool.query(
        `SELECT id, tenant_id, setting_key, setting_value, setting_type, created_at, updated_at
         FROM tenant_settings 
         WHERE tenant_id = $1 
         ORDER BY setting_key`,
        [tenantId]
      );

      return result.rows.map(row => ({
        ...row,
        setting_value: typeof row.setting_value === 'string' ? 
          JSON.parse(row.setting_value) : row.setting_value
      }));
    } catch (error) {
      console.error('Error fetching tenant settings:', error);
      throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch tenant settings');
    }
  }

  /**
   * Get a specific setting by key
   */
  async getTenantSetting(tenantId: string, settingKey: string): Promise<TenantSetting | null> {
    try {
      const result = await pool.query(
        `SELECT id, tenant_id, setting_key, setting_value, setting_type, created_at, updated_at
         FROM tenant_settings 
         WHERE tenant_id = $1 AND setting_key = $2`,
        [tenantId, settingKey]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        ...row,
        setting_value: typeof row.setting_value === 'string' ? 
          JSON.parse(row.setting_value) : row.setting_value
      };
    } catch (error) {
      console.error('Error fetching tenant setting:', error);
      throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch tenant setting');
    }
  }

  /**
   * Create a new tenant setting
   */
  async createTenantSetting(tenantId: string, settingData: CreateTenantSettingDto): Promise<TenantSetting> {
    try {
      // Check if setting already exists
      const existing = await this.getTenantSetting(tenantId, settingData.setting_key);
      if (existing) {
        throw new HttpException(StatusCodes.CONFLICT, `Setting '${settingData.setting_key}' already exists`);
      }

      // Auto-detect setting type if not provided
      let settingType = settingData.setting_type;
      if (!settingType) {
        settingType = this.detectSettingType(settingData.setting_value);
      }

      const result = await pool.query(
        `INSERT INTO tenant_settings (tenant_id, setting_key, setting_value, setting_type)
         VALUES ($1, $2, $3, $4)
         RETURNING id, tenant_id, setting_key, setting_value, setting_type, created_at, updated_at`,
        [tenantId, settingData.setting_key, JSON.stringify(settingData.setting_value), settingType]
      );

      const row = result.rows[0];
      return {
        ...row,
        setting_value: typeof row.setting_value === 'string' ? 
          JSON.parse(row.setting_value) : row.setting_value
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error creating tenant setting:', error);
      throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create tenant setting');
    }
  }

  /**
   * Update an existing tenant setting
   */
  async updateTenantSetting(
    tenantId: string, 
    settingKey: string, 
    settingData: UpdateTenantSettingDto
  ): Promise<TenantSetting> {
    try {
      // Check if setting exists
      const existing = await this.getTenantSetting(tenantId, settingKey);
      if (!existing) {
        throw new HttpException(StatusCodes.NOT_FOUND, `Setting '${settingKey}' not found`);
      }

      // Auto-detect setting type if not provided
      let settingType = settingData.setting_type || existing.setting_type;
      if (!settingData.setting_type) {
        settingType = this.detectSettingType(settingData.setting_value);
      }

      const result = await pool.query(
        `UPDATE tenant_settings 
         SET setting_value = $1, setting_type = $2, updated_at = NOW()
         WHERE tenant_id = $3 AND setting_key = $4
         RETURNING id, tenant_id, setting_key, setting_value, setting_type, created_at, updated_at`,
        [JSON.stringify(settingData.setting_value), settingType, tenantId, settingKey]
      );

      const row = result.rows[0];
      return {
        ...row,
        setting_value: typeof row.setting_value === 'string' ? 
          JSON.parse(row.setting_value) : row.setting_value
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error updating tenant setting:', error);
      throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update tenant setting');
    }
  }

  /**
   * Delete a tenant setting
   */
  async deleteTenantSetting(tenantId: string, settingKey: string): Promise<void> {
    try {
      const result = await pool.query(
        `DELETE FROM tenant_settings 
         WHERE tenant_id = $1 AND setting_key = $2`,
        [tenantId, settingKey]
      );

      if (result.rowCount === 0) {
        throw new HttpException(StatusCodes.NOT_FOUND, `Setting '${settingKey}' not found`);
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error deleting tenant setting:', error);
      throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete tenant setting');
    }
  }

  /**
   * Get settings organized by category for easier frontend consumption
   */
  async getOrganizedTenantSettings(tenantId: string): Promise<Record<string, any>> {
    try {
      const settings = await this.getTenantSettings(tenantId);
      
      const organized: Record<string, any> = {};
      
      for (const setting of settings) {
        // Organize settings by key prefix (e.g., 'company_info', 'branding', etc.)
        const category = setting.setting_key.split('_')[0];
        
        if (!organized[category]) {
          organized[category] = {};
        }
        
        organized[category][setting.setting_key] = setting.setting_value;
      }
      
      return organized;
    } catch (error) {
      console.error('Error organizing tenant settings:', error);
      throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to organize tenant settings');
    }
  }

  /**
   * Bulk update multiple settings at once
   */
  async bulkUpdateTenantSettings(
    tenantId: string, 
    settingsData: Record<string, any>
  ): Promise<TenantSetting[]> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const updatedSettings: TenantSetting[] = [];
      
      for (const [settingKey, settingValue] of Object.entries(settingsData)) {
        try {
          // Try to update if exists, otherwise create
          const existing = await this.getTenantSetting(tenantId, settingKey);
          
          if (existing) {
            const updated = await this.updateTenantSetting(tenantId, settingKey, {
              setting_value: settingValue
            });
            updatedSettings.push(updated);
          } else {
            const created = await this.createTenantSetting(tenantId, {
              setting_key: settingKey,
              setting_value: settingValue
            });
            updatedSettings.push(created);
          }
        } catch (error) {
          console.error(`Error updating setting ${settingKey}:`, error);
          // Continue with other settings even if one fails
        }
      }
      
      await client.query('COMMIT');
      return updatedSettings;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error bulk updating tenant settings:', error);
      throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to bulk update tenant settings');
    } finally {
      client.release();
    }
  }

  /**
   * Auto-detect setting type based on value
   */
  private detectSettingType(value: any): 'string' | 'number' | 'boolean' | 'object' | 'array' {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    return 'string'; // fallback
  }
}