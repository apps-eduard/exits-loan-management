import { Router } from 'express';
import { TenantController } from '../controllers/tenant.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware, requireSuperAdmin } from '../middleware/tenant.middleware';

const router = Router();
const tenantController = new TenantController();

/**
 * Public Routes - No authentication required
 */

// Public tenant registration
router.post('/tenants/register', tenantController.registerTenant);

/**
 * Protected Routes - Authentication required
 */

// All routes below require authentication and tenant context
router.use(authenticate, tenantMiddleware);

/**
 * Super Admin Routes - Cross-tenant management
 */

// Get all tenants (Super Admin only)
router.get('/super-admin/tenants', requireSuperAdmin, tenantController.getAllTenants);

// Create new tenant (Super Admin only)
router.post('/super-admin/tenants', requireSuperAdmin, tenantController.createTenant);

// Delete tenant (Super Admin only)
router.delete('/super-admin/tenants/:id', requireSuperAdmin, tenantController.deleteTenant);

/**
 * Tenant Routes - Own tenant or Super Admin
 */

// Get current tenant (from JWT context)
router.get('/tenants/current', tenantController.getCurrentTenant);

// Get tenant by ID (Super Admin or own tenant)
router.get('/tenants/:id', tenantController.getTenantById);

// Update tenant (Super Admin or own tenant - with restrictions)
router.put('/tenants/:id', tenantController.updateTenant);

// Get tenant statistics
router.get('/tenants/:id/stats', tenantController.getTenantStats);

export default router;
