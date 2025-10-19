import { Router } from 'express';
import { TenantSettingsController } from '../controllers/tenant-settings.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const tenantSettingsController = new TenantSettingsController();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route GET /api/tenants/settings
 * @desc Get all settings for the authenticated tenant
 * @access Private (Admin+)
 */
router.get('/', tenantSettingsController.getTenantSettings);

/**
 * @route GET /api/tenants/settings/organized
 * @desc Get settings organized by category for easier frontend consumption
 * @access Private (Admin+)
 */
router.get('/organized', tenantSettingsController.getOrganizedTenantSettings);

/**
 * @route GET /api/tenants/settings/categories/:category
 * @desc Get all settings for a specific category
 * @access Private (Admin+)
 */
router.get('/categories/:category', tenantSettingsController.getTenantSettingsByCategory);

/**
 * @route GET /api/tenants/settings/:key
 * @desc Get a specific setting by key
 * @access Private (Admin+)
 */
router.get('/:key', tenantSettingsController.getTenantSetting);

/**
 * @route POST /api/tenants/settings
 * @desc Create a new tenant setting
 * @access Private (Admin+)
 */
router.post('/', tenantSettingsController.createTenantSetting);

/**
 * @route PUT /api/tenants/settings/bulk
 * @desc Bulk update multiple settings at once
 * @access Private (Admin+)
 */
router.put('/bulk', tenantSettingsController.bulkUpdateTenantSettings);

/**
 * @route PUT /api/tenants/settings/:key
 * @desc Update an existing tenant setting
 * @access Private (Admin+)
 */
router.put('/:key', tenantSettingsController.updateTenantSetting);

/**
 * @route DELETE /api/tenants/settings/:key
 * @desc Delete a tenant setting
 * @access Private (Admin+)
 */
router.delete('/:key', tenantSettingsController.deleteTenantSetting);

export default router;