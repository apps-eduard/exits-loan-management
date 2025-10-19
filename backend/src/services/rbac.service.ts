/**
 * RBAC Service - Role-Based Access Control Management
 * Handles all RBAC operations including permissions, roles, and menu generation
 */

import { Pool } from 'pg';
import { pool } from '../config/database';
import HttpException from '../utils/http-exception';
import { StatusCodes } from 'http-status-codes';
import logger from '../config/logger';
import {
  Role,
  Permission,
  RolePermission,
  MenuGroup,
  MenuItem,
  UserRoleAssignment,
  PermissionModules,
  PermissionActions,
  createPermissionKey,
  SystemRoles
} from '../models/rbac.model';

export class RbacService {
  private db: Pool = pool;

  /**
   * Get all system permissions with module grouping
   */
  async getSystemPermissions(): Promise<Permission[]> {
    const result = await this.db.query(`
      SELECT id, key, description, module, action, created_at, updated_at
      FROM permissions 
      ORDER BY module, action, key
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      key: row.key,
      description: row.description,
      module: row.module || this.extractModuleFromKey(row.key),
      action: row.action || this.extractActionFromKey(row.key),
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  /**
   * Get all roles with their permissions
   */
  async getAllRoles(tenantId?: string): Promise<Role[]> {
    let query = `
      SELECT r.id, r.name, r.description, r.level, r.is_system, r.tenant_id,
             r.created_at, r.updated_at
      FROM roles r
      WHERE (r.tenant_id IS NULL OR r.tenant_id = $1)
      ORDER BY r.level ASC, r.name ASC
    `;
    
    const result = await this.db.query(query, [tenantId]);
    
    const roles: Role[] = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      level: row.level,
      is_system: row.is_system,
      tenant_id: row.tenant_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      permissions: []
    }));

    // Get permissions for each role
    for (const role of roles) {
      role.permissions = await this.getRolePermissions(role.id);
    }

    return roles;
  }

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const result = await this.db.query(`
      SELECT p.id, p.key, p.description, p.module, p.action, p.created_at, p.updated_at
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1
      ORDER BY p.module, p.action, p.key
    `, [roleId]);
    
    return result.rows.map(row => ({
      id: row.id,
      key: row.key,
      description: row.description,
      module: row.module || this.extractModuleFromKey(row.key),
      action: row.action || this.extractActionFromKey(row.key),
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  /**
   * Get user's effective permissions (from all assigned roles)
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const result = await this.db.query(`
      SELECT DISTINCT p.id, p.key, p.description, p.module, p.action, 
             p.created_at, p.updated_at
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN users u ON rp.role_id = u.role_id
      WHERE u.id = $1 AND u.status = 'active'
      ORDER BY p.module, p.action, p.key
    `, [userId]);
    
    return result.rows.map(row => ({
      id: row.id,
      key: row.key,
      description: row.description,
      module: row.module || this.extractModuleFromKey(row.key),
      action: row.action || this.extractActionFromKey(row.key),
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  /**
   * Check if user has specific permission
   */
  async userHasPermission(userId: string, permission: string): Promise<boolean> {
    const result = await this.db.query(`
      SELECT 1
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN users u ON rp.role_id = u.role_id
      WHERE u.id = $1 AND u.status = 'active' AND p.key = $2
      LIMIT 1
    `, [userId, permission]);
    
    return result.rows.length > 0;
  }

  /**
   * Check if user has any of the specified permissions
   */
  async userHasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    if (permissions.length === 0) return true;
    
    const placeholders = permissions.map((_, index) => `$${index + 2}`).join(',');
    const result = await this.db.query(`
      SELECT 1
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN users u ON rp.role_id = u.role_id
      WHERE u.id = $1 AND u.status = 'active' AND p.key IN (${placeholders})
      LIMIT 1
    `, [userId, ...permissions]);
    
    return result.rows.length > 0;
  }

  /**
   * Check if user has all specified permissions
   */
  async userHasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    if (permissions.length === 0) return true;
    
    const placeholders = permissions.map((_, index) => `$${index + 2}`).join(',');
    const result = await this.db.query(`
      SELECT COUNT(DISTINCT p.key) as permission_count
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN users u ON rp.role_id = u.role_id
      WHERE u.id = $1 AND u.status = 'active' AND p.key IN (${placeholders})
    `, [userId, ...permissions]);
    
    const userPermissionCount = parseInt(result.rows[0].permission_count);
    return userPermissionCount === permissions.length;
  }

  /**
   * Generate menu structure based on user's permissions and role
   */
  async generateUserMenu(userId: string): Promise<MenuGroup[]> {
    const userPermissions = await this.getUserPermissions(userId);
    const permissionKeys = userPermissions.map(p => p.key);
    
    // Get user role to determine menu visibility
    const userResult = await this.db.query(`
      SELECT u.role_id, r.name as role_name, r.level
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
    }
    
    const userRole = userResult.rows[0];
    
    return this.buildMenuStructure(permissionKeys, userRole.role_name, userRole.level);
  }

  /**
   * Create a custom role for a tenant
   */
  async createCustomRole(
    tenantId: string, 
    name: string, 
    description: string, 
    level: number,
    permissionIds: string[]
  ): Promise<Role> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create role
      const roleResult = await client.query(`
        INSERT INTO roles (name, description, level, is_system, tenant_id)
        VALUES ($1, $2, $3, false, $4)
        RETURNING id, name, description, level, is_system, tenant_id, created_at, updated_at
      `, [name, description, level, tenantId]);
      
      const role = roleResult.rows[0];
      
      // Assign permissions
      if (permissionIds.length > 0) {
        const permissionInserts = permissionIds.map(permissionId => 
          `('${role.id}', '${permissionId}')`
        ).join(',');
        
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ${permissionInserts}
        `);
      }
      
      await client.query('COMMIT');
      
      logger.info(`Custom role created: ${name} for tenant ${tenantId}`);
      
      return {
        id: role.id,
        name: role.name,
        description: role.description,
        level: role.level,
        is_system: role.is_system,
        tenant_id: role.tenant_id,
        created_at: role.created_at,
        updated_at: role.updated_at
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error({ error }, 'Error creating custom role');
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to create custom role'
      );
    } finally {
      client.release();
    }
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Remove existing permissions
      await client.query(`
        DELETE FROM role_permissions WHERE role_id = $1
      `, [roleId]);
      
      // Add new permissions
      if (permissionIds.length > 0) {
        const permissionInserts = permissionIds.map(permissionId => 
          `('${roleId}', '${permissionId}')`
        ).join(',');
        
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ${permissionInserts}
        `);
      }
      
      await client.query('COMMIT');
      
      logger.info(`Role permissions updated for role: ${roleId}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error({ error }, 'Error updating role permissions');
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to update role permissions'
      );
    } finally {
      client.release();
    }
  }

  /**
   * Get tenant's custom roles
   */
  async getTenantCustomRoles(tenantId: string): Promise<Role[]> {
    const result = await this.db.query(`
      SELECT r.id, r.name, r.description, r.level, r.is_system, r.tenant_id,
             r.created_at, r.updated_at
      FROM roles r
      WHERE r.tenant_id = $1 AND r.is_system = false
      ORDER BY r.level ASC, r.name ASC
    `, [tenantId]);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      level: row.level,
      is_system: row.is_system,
      tenant_id: row.tenant_id,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  /**
   * Delete custom role (only non-system roles)
   */
  async deleteCustomRole(roleId: string, tenantId: string): Promise<void> {
    const result = await this.db.query(`
      DELETE FROM roles 
      WHERE id = $1 AND tenant_id = $2 AND is_system = false
      RETURNING id
    `, [roleId, tenantId]);
    
    if (result.rows.length === 0) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        'Custom role not found or cannot be deleted'
      );
    }
    
    logger.info(`Custom role deleted: ${roleId}`);
  }

  /**
   * Build menu structure based on permissions and role
   */
  private buildMenuStructure(
    userPermissions: string[], 
    roleName: string, 
    roleLevel: number
  ): MenuGroup[] {
    const menuGroups: MenuGroup[] = [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: 'dashboard',
        order: 1,
        items: [
          {
            id: 'overview',
            name: 'Overview',
            path: '/dashboard',
            icon: 'home',
            order: 1,
            group_id: 'dashboard',
            required_permissions: [],
            require_all_permissions: false,
            visible_to_roles: ['*'] // Visible to all roles
          }
        ]
      },
      {
        id: 'customers',
        name: 'Customers',
        icon: 'people',
        order: 2,
        items: [
          {
            id: 'customer-list',
            name: 'View Customers',
            path: '/customers',
            icon: 'list',
            order: 1,
            group_id: 'customers',
            required_permissions: ['customers.read'],
            require_all_permissions: false,
            visible_to_roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.LOAN_OFFICER]
          },
          {
            id: 'customer-create',
            name: 'Add Customer',
            path: '/customers/new',
            icon: 'add',
            order: 2,
            group_id: 'customers',
            required_permissions: ['customers.create'],
            require_all_permissions: false,
            visible_to_roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.LOAN_OFFICER]
          }
        ]
      },
      {
        id: 'loans',
        name: 'Loans',
        icon: 'account_balance',
        order: 3,
        items: [
          {
            id: 'loan-applications',
            name: 'Applications',
            path: '/loans/applications',
            icon: 'description',
            order: 1,
            group_id: 'loans',
            required_permissions: ['loans.read'],
            require_all_permissions: false,
            visible_to_roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.LOAN_OFFICER]
          },
          {
            id: 'active-loans',
            name: 'Active Loans',
            path: '/loans/active',
            icon: 'trending_up',
            order: 2,
            group_id: 'loans',
            required_permissions: ['loans.read'],
            require_all_permissions: false,
            visible_to_roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.LOAN_OFFICER, SystemRoles.COLLECTOR]
          },
          {
            id: 'loan-calculator',
            name: 'Calculator',
            path: '/loans/calculator',
            icon: 'calculate',
            order: 3,
            group_id: 'loans',
            required_permissions: ['loans.read'],
            require_all_permissions: false,
            visible_to_roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.LOAN_OFFICER]
          }
        ]
      },
      {
        id: 'collections',
        name: 'Collections',
        icon: 'payment',
        order: 4,
        items: [
          {
            id: 'daily-collections',
            name: 'Daily Collection',
            path: '/collections/daily',
            icon: 'today',
            order: 1,
            group_id: 'collections',
            required_permissions: ['collections.read'],
            require_all_permissions: false,
            visible_to_roles: [SystemRoles.COLLECTOR, SystemRoles.BRANCH_MANAGER, SystemRoles.TENANT_ADMIN, SystemRoles.CASHIER]
          },
          {
            id: 'overdue-accounts',
            name: 'Overdue Accounts',
            path: '/collections/overdue',
            icon: 'warning',
            order: 2,
            group_id: 'collections',
            required_permissions: ['collections.read'],
            require_all_permissions: false,
            visible_to_roles: [SystemRoles.COLLECTOR, SystemRoles.BRANCH_MANAGER, SystemRoles.TENANT_ADMIN]
          }
        ]
      },
      {
        id: 'reports',
        name: 'Reports',
        icon: 'analytics',
        order: 5,
        items: [
          {
            id: 'loan-performance',
            name: 'Loan Performance',
            path: '/reports/loan-performance',
            icon: 'trending_up',
            order: 1,
            group_id: 'reports',
            required_permissions: ['reports.read'],
            require_all_permissions: false,
            visible_to_roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.AUDITOR]
          },
          {
            id: 'collection-report',
            name: 'Collection Report',
            path: '/reports/collections',
            icon: 'receipt',
            order: 2,
            group_id: 'reports',
            required_permissions: ['reports.read'],
            require_all_permissions: false,
            visible_to_roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.AUDITOR]
          }
        ]
      },
      {
        id: 'accounting',
        name: 'Accounting',
        icon: 'account_balance_wallet',
        order: 6,
        items: [
          {
            id: 'journal-entries',
            name: 'Journal Entries',
            path: '/accounting/journal',
            icon: 'book',
            order: 1,
            group_id: 'accounting',
            required_permissions: ['accounting.read'],
            require_all_permissions: false,
            visible_to_roles: [SystemRoles.TENANT_ADMIN, SystemRoles.AUDITOR]
          },
          {
            id: 'trial-balance',
            name: 'Trial Balance',
            path: '/accounting/trial-balance',
            icon: 'balance',
            order: 2,
            group_id: 'accounting',
            required_permissions: ['accounting.read'],
            require_all_permissions: false,
            visible_to_roles: [SystemRoles.TENANT_ADMIN, SystemRoles.AUDITOR]
          }
        ]
      },
      {
        id: 'settings',
        name: 'Settings',
        icon: 'settings',
        order: 7,
        items: [
          {
            id: 'user-management',
            name: 'Users',
            path: '/settings/users',
            icon: 'people',
            order: 1,
            group_id: 'settings',
            required_permissions: ['users.read'],
            require_all_permissions: false,
            visible_to_roles: [SystemRoles.TENANT_ADMIN]
          },
          {
            id: 'branch-management',
            name: 'Branches',
            path: '/settings/branches',
            icon: 'business',
            order: 2,
            group_id: 'settings',
            required_permissions: ['branches.read'],
            require_all_permissions: false,
            visible_to_roles: [SystemRoles.TENANT_ADMIN]
          },
          {
            id: 'tenant-settings',
            name: 'Organization',
            path: '/settings/tenant',
            icon: 'domain',
            order: 3,
            group_id: 'settings',
            required_permissions: ['tenant.update'],
            require_all_permissions: false,
            visible_to_roles: [SystemRoles.TENANT_ADMIN]
          }
        ]
      }
    ];

    // Filter menu items based on permissions and role
    return menuGroups.map(group => ({
      ...group,
      items: group.items.filter(item => this.isMenuItemVisible(item, userPermissions, roleName))
    })).filter(group => group.items.length > 0);
  }

  /**
   * Check if menu item should be visible to user
   */
  private isMenuItemVisible(
    item: MenuItem, 
    userPermissions: string[], 
    userRole: string
  ): boolean {
    // Check role-based visibility
    if (!item.visible_to_roles.includes('*') && !item.visible_to_roles.includes(userRole)) {
      return false;
    }

    // Check permission-based visibility
    if (item.required_permissions.length === 0) {
      return true;
    }

    if (item.require_all_permissions) {
      return item.required_permissions.every(permission => 
        userPermissions.includes(permission)
      );
    } else {
      return item.required_permissions.some(permission => 
        userPermissions.includes(permission)
      );
    }
  }

  /**
   * Extract module from permission key (e.g., 'customers.read' -> 'customers')
   */
  private extractModuleFromKey(key: string): string {
    return key.split('.')[0] || 'system';
  }

  /**
   * Extract action from permission key (e.g., 'customers.read' -> 'read')
   */
  private extractActionFromKey(key: string): string {
    return key.split('.')[1] || 'unknown';
  }
}

export const rbacService = new RbacService();