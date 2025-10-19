/**
 * RBAC Models - Role-Based Access Control
 * Defines core interfaces for permissions, roles, and menu items
 */

export interface Permission {
  id: string;
  key: string;
  description: string;
  module: string; // e.g., 'dashboard', 'customers', 'loans', 'collections', etc.
  action: string; // e.g., 'read', 'create', 'update', 'delete', 'approve', etc.
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  level: number; // Hierarchy: 1=Super Admin, 2=Admin, 3=Manager, 4=Officer, 5=Staff
  is_system: boolean; // System roles cannot be deleted
  tenant_id?: string; // null for system roles, tenant_id for custom roles
  created_at: Date;
  updated_at: Date;
  permissions?: Permission[];
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
  granted_by?: string; // User ID who granted the permission
  granted_at: Date;
}

export interface MenuGroup {
  id: string;
  name: string;
  icon: string;
  order: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon: string;
  order: number;
  group_id: string;
  required_permissions: string[];
  require_all_permissions: boolean; // true = AND, false = OR
  visible_to_roles: string[]; // Additional role-based visibility
}

export interface UserRoleAssignment {
  user_id: string;
  role_id: string;
  assigned_by: string; // User ID who assigned the role
  assigned_at: Date;
  expires_at?: Date; // Optional expiration
  is_active: boolean;
}

// RBAC Configuration Types
export interface RbacConfig {
  defaultRoles: Role[];
  systemPermissions: Permission[];
  menuStructure: MenuGroup[];
}

// Predefined System Roles
export enum SystemRoles {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN', 
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  LOAN_OFFICER = 'LOAN_OFFICER',
  COLLECTOR = 'COLLECTOR',
  CASHIER = 'CASHIER',
  AUDITOR = 'AUDITOR',
  CUSTOMER = 'CUSTOMER'
}

// Permission Modules
export enum PermissionModules {
  DASHBOARD = 'dashboard',
  CUSTOMERS = 'customers',
  LOANS = 'loans',
  COLLECTIONS = 'collections',
  PAYMENTS = 'payments',
  REPORTS = 'reports',
  ACCOUNTING = 'accounting',
  SETTINGS = 'settings',
  USERS = 'users',
  BRANCHES = 'branches',
  TENANT = 'tenant',
  SYSTEM = 'system'
}

// Permission Actions
export enum PermissionActions {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  MANAGE = 'manage',
  EXPORT = 'export',
  PRINT = 'print',
  AUDIT = 'audit'
}

// Helper function to create permission key
export function createPermissionKey(module: PermissionModules, action: PermissionActions): string {
  return `${module}.${action}`;
}

// Default RBAC Configuration
export const DEFAULT_RBAC_CONFIG: RbacConfig = {
  defaultRoles: [
    {
      id: 'role-super-admin',
      name: 'Super Admin',
      description: 'System administrator with full access',
      level: 1,
      is_system: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'role-tenant-admin', 
      name: 'Tenant Admin',
      description: 'Full access to tenant settings, user management, reports',
      level: 2,
      is_system: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'role-branch-manager',
      name: 'Branch Manager', 
      description: 'Manages one or more branches under the tenant',
      level: 3,
      is_system: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'role-loan-officer',
      name: 'Loan Officer',
      description: 'Handles loan applications, client onboarding',
      level: 4,
      is_system: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'role-collector',
      name: 'Collector',
      description: 'Handles payment collection, receipts, and deposits',
      level: 5,
      is_system: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'role-cashier',
      name: 'Cashier',
      description: 'Processes payments and manages cash transactions',
      level: 5,
      is_system: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'role-auditor',
      name: 'Auditor',
      description: 'View financial summaries, audit logs, reports only',
      level: 4,
      is_system: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'role-customer',
      name: 'Customer',
      description: 'Portal access for clients to view loan status',
      level: 6,
      is_system: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ],
  systemPermissions: [],
  menuStructure: []
};