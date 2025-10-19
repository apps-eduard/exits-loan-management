/**
 * RBAC Controller - Role-Based Access Control API endpoints
 * Handles HTTP requests for role and permission management
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { rbacService } from '../services/rbac.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import HttpException from '../utils/http-exception';
import logger from '../config/logger';

export class RbacController {

  /**
   * Get all system permissions
   */
  async getPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await rbacService.getSystemPermissions();
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          permissions,
          total: permissions.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all roles (system + tenant custom roles)
   */
  async getRoles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const roles = await rbacService.getAllRoles(tenantId);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          roles,
          total: roles.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      const permissions = await rbacService.getRolePermissions(roleId);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          roleId,
          permissions,
          total: permissions.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's effective permissions
   */
  async getUserPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user?.userId;
      
      // Users can only view their own permissions unless they're admin
      if (userId !== requestingUserId && !req.user?.isSuperAdmin) {
        throw new HttpException(StatusCodes.FORBIDDEN, 'Access denied');
      }
      
      const permissions = await rbacService.getUserPermissions(userId);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          userId,
          permissions,
          total: permissions.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate menu structure for current user
   */
  async getUserMenu(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        throw new HttpException(StatusCodes.UNAUTHORIZED, 'User not authenticated');
      }
      
      const menu = await rbacService.generateUserMenu(userId);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          menu,
          totalGroups: menu.length,
          totalItems: menu.reduce((sum, group) => sum + group.items.length, 0)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create custom role (Tenant Admin only)
   */
  async createCustomRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'Tenant context required');
      }
      
      const { name, description, level, permissionIds } = req.body;
      
      if (!name || !description || !level || !Array.isArray(permissionIds)) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST, 
          'Name, description, level, and permissionIds are required'
        );
      }
      
      const role = await rbacService.createCustomRole(
        tenantId, 
        name, 
        description, 
        level, 
        permissionIds
      );
      
      logger.info({ tenantId, roleId: role.id }, `Custom role created: ${name}`);
      
      res.status(StatusCodes.CREATED).json({
        success: true,
        data: { role },
        message: 'Custom role created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update role permissions (Tenant Admin only)
   */
  async updateRolePermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      const { permissionIds } = req.body;
      
      if (!Array.isArray(permissionIds)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'permissionIds array is required');
      }
      
      await rbacService.updateRolePermissions(roleId, permissionIds);
      
      logger.info({ roleId }, 'Role permissions updated');
      
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Role permissions updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tenant's custom roles
   */
  async getTenantCustomRoles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'Tenant context required');
      }
      
      const customRoles = await rbacService.getTenantCustomRoles(tenantId);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          customRoles,
          total: customRoles.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete custom role (Tenant Admin only)
   */
  async deleteCustomRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { roleId } = req.params;
      
      if (!tenantId) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'Tenant context required');
      }
      
      await rbacService.deleteCustomRole(roleId, tenantId);
      
      logger.info({ tenantId, roleId }, 'Custom role deleted');
      
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Custom role deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check permissions for current user (utility endpoint)
   */
  async checkPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { permissions, requireAll = false } = req.body;
      
      if (!userId) {
        throw new HttpException(StatusCodes.UNAUTHORIZED, 'User not authenticated');
      }
      
      if (!Array.isArray(permissions)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'permissions array is required');
      }
      
      let hasAccess = false;
      
      if (requireAll) {
        hasAccess = await rbacService.userHasAllPermissions(userId, permissions);
      } else {
        hasAccess = await rbacService.userHasAnyPermission(userId, permissions);
      }
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          hasAccess,
          permissions,
          requireAll,
          userId
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const rbacController = new RbacController();