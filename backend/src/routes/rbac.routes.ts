/**
 * RBAC Routes - Role-Based Access Control endpoints
 * Provides API routes for role and permission management
 */

import { Router } from 'express';
import { rbacController } from '../controllers/rbac.controller';
import { authenticate, requirePermissions } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// All RBAC routes require authentication
router.use(authenticate);

/**
 * Public RBAC endpoints (available to all authenticated users)
 */

/**
 * @route   GET /api/rbac/permissions
 * @desc    Get all system permissions
 * @access  Private (authenticated users)
 */
router.get('/permissions', rbacController.getPermissions);

/**
 * @route   GET /api/rbac/roles
 * @desc    Get all roles (system + tenant custom)
 * @access  Private (authenticated users)
 */
router.get('/roles', tenantMiddleware, rbacController.getRoles);

/**
 * @route   GET /api/rbac/roles/:roleId/permissions
 * @desc    Get permissions for a specific role
 * @access  Private (authenticated users)
 */
router.get('/roles/:roleId/permissions', rbacController.getRolePermissions);

/**
 * @route   GET /api/rbac/menu
 * @desc    Generate menu structure for current user
 * @access  Private (authenticated users)
 */
router.get('/menu', tenantMiddleware, rbacController.getUserMenu);

/**
 * @route   POST /api/rbac/check-permissions
 * @desc    Check if current user has specified permissions
 * @access  Private (authenticated users)
 */
router.post('/check-permissions', rbacController.checkPermissions);

/**
 * Protected RBAC endpoints (require specific permissions)
 */

/**
 * @route   GET /api/rbac/users/:userId/permissions
 * @desc    Get user's effective permissions
 * @access  Private (requires users.read permission or own user)
 */
router.get(
  '/users/:userId/permissions', 
  requirePermissions(['users.read']), 
  rbacController.getUserPermissions
);

/**
 * Tenant Admin RBAC endpoints
 */

/**
 * @route   GET /api/rbac/tenant/custom-roles
 * @desc    Get tenant's custom roles
 * @access  Private (requires users.manage permission)
 */
router.get(
  '/tenant/custom-roles',
  tenantMiddleware,
  requirePermissions(['users.manage']),
  rbacController.getTenantCustomRoles
);

/**
 * @route   POST /api/rbac/tenant/custom-roles
 * @desc    Create custom role for tenant
 * @access  Private (requires users.manage permission)
 */
router.post(
  '/tenant/custom-roles',
  tenantMiddleware,
  requirePermissions(['users.manage']),
  rbacController.createCustomRole
);

/**
 * @route   PUT /api/rbac/roles/:roleId/permissions
 * @desc    Update role permissions
 * @access  Private (requires users.manage permission)
 */
router.put(
  '/roles/:roleId/permissions',
  tenantMiddleware,
  requirePermissions(['users.manage']),
  rbacController.updateRolePermissions
);

/**
 * @route   DELETE /api/rbac/tenant/custom-roles/:roleId
 * @desc    Delete custom role
 * @access  Private (requires users.manage permission)
 */
router.delete(
  '/tenant/custom-roles/:roleId',
  tenantMiddleware,
  requirePermissions(['users.manage']),
  rbacController.deleteCustomRole
);

export default router;