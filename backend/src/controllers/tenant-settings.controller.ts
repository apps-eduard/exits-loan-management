import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TenantSettingsService } from '../services/tenant-settings.service';

const tenantSettingsService = new TenantSettingsService();

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    roleId: string;
    roleName: string;
  };
}

export class TenantSettingsController {
  
  /**
   * GET /api/tenants/settings
   * Get all settings for the authenticated tenant
   */
  async getTenantSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Tenant context not found'
        });
      }

      const settings = await tenantSettingsService.getTenantSettings(tenantId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { settings }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tenants/settings/organized
   * Get settings organized by category
   */
  async getOrganizedTenantSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Tenant context not found'
        });
      }

      const organizedSettings = await tenantSettingsService.getOrganizedTenantSettings(tenantId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: organizedSettings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tenants/settings/:key
   * Get a specific setting by key
   */
  async getTenantSetting(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { key } = req.params;
      
      if (!tenantId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Tenant context not found'
        });
      }

      const setting = await tenantSettingsService.getTenantSetting(tenantId, key);

      if (!setting) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: `Setting '${key}' not found`
        });
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: { setting }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tenants/settings
   * Create a new tenant setting
   */
  async createTenantSetting(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const settingData = req.body;
      
      if (!tenantId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Tenant context not found'
        });
      }

      // Validate required fields
      if (!settingData.setting_key || settingData.setting_value === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'setting_key and setting_value are required'
        });
      }

      const setting = await tenantSettingsService.createTenantSetting(tenantId, settingData);

      res.status(StatusCodes.CREATED).json({
        success: true,
        data: { setting },
        message: 'Setting created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/tenants/settings/:key
   * Update an existing tenant setting
   */
  async updateTenantSetting(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { key } = req.params;
      const settingData = req.body;
      
      if (!tenantId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Tenant context not found'
        });
      }

      // Validate required fields
      if (settingData.setting_value === undefined) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'setting_value is required'
        });
      }

      const setting = await tenantSettingsService.updateTenantSetting(tenantId, key, settingData);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { setting },
        message: 'Setting updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/tenants/settings/:key
   * Delete a tenant setting
   */
  async deleteTenantSetting(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { key } = req.params;
      
      if (!tenantId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Tenant context not found'
        });
      }

      await tenantSettingsService.deleteTenantSetting(tenantId, key);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Setting deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/tenants/settings/bulk
   * Bulk update multiple settings
   */
  async bulkUpdateTenantSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const settingsData = req.body;
      
      if (!tenantId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Tenant context not found'
        });
      }

      // Validate that settingsData is an object
      if (!settingsData || typeof settingsData !== 'object' || Array.isArray(settingsData)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Settings data must be an object with key-value pairs'
        });
      }

      const updatedSettings = await tenantSettingsService.bulkUpdateTenantSettings(tenantId, settingsData);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { 
          settings: updatedSettings,
          updated_count: updatedSettings.length 
        },
        message: `Successfully updated ${updatedSettings.length} settings`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tenants/settings/categories/:category
   * Get all settings for a specific category (e.g., branding, company, loan_defaults)
   */
  async getTenantSettingsByCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      const { category } = req.params;
      
      if (!tenantId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Tenant context not found'
        });
      }

      const allSettings = await tenantSettingsService.getTenantSettings(tenantId);
      
      // Filter settings by category (assuming setting keys start with category name)
      const categorySettings = allSettings.filter(setting => 
        setting.setting_key.startsWith(category)
      );

      res.status(StatusCodes.OK).json({
        success: true,
        data: { 
          category,
          settings: categorySettings 
        }
      });
    } catch (error) {
      next(error);
    }
  }
}