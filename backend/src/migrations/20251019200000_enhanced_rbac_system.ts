/**
 * Enhanced RBAC Migration - Add module/action fields to permissions and hierarchical roles
 */

export const shorthands = undefined;

export async function up(pgm: any): Promise<void> {
  // Add module and action columns to permissions table
  pgm.addColumns('permissions', {
    module: {
      type: 'varchar(50)',
      comment: 'Permission module (e.g., customers, loans, reports)'
    },
    action: {
      type: 'varchar(50)', 
      comment: 'Permission action (e.g., read, create, update, delete)'
    }
  });

  // Add hierarchy and tenant support to roles table
  pgm.addColumns('roles', {
    level: {
      type: 'integer',
      notNull: true,
      default: 5,
      comment: 'Role hierarchy level (1=highest, 5=lowest)'
    },
    is_system: {
      type: 'boolean',
      notNull: true,
      default: false,
      comment: 'System roles cannot be deleted by tenants'
    },
    tenant_id: {
      type: 'uuid',
      references: 'tenants',
      onDelete: 'CASCADE',
      comment: 'NULL for system roles, tenant_id for custom roles'
    }
  });

  // Update existing permissions with module and action data
  const permissionUpdates = [
    // Dashboard permissions
    { key: 'dashboard.read', module: 'dashboard', action: 'read' },
    
    // Customer permissions  
    { key: 'customers.read', module: 'customers', action: 'read' },
    { key: 'customers.create', module: 'customers', action: 'create' },
    { key: 'customers.update', module: 'customers', action: 'update' },
    { key: 'customers.delete', module: 'customers', action: 'delete' },
    
    // Loan permissions
    { key: 'loans.read', module: 'loans', action: 'read' },
    { key: 'loans.create', module: 'loans', action: 'create' },
    { key: 'loans.update', module: 'loans', action: 'update' },
    { key: 'loans.approve', module: 'loans', action: 'approve' },
    { key: 'loans.reject', module: 'loans', action: 'reject' },
    
    // Collection permissions
    { key: 'collections.read', module: 'collections', action: 'read' },
    { key: 'collections.create', module: 'collections', action: 'create' },
    { key: 'collections.update', module: 'collections', action: 'update' },
    
    // Payment permissions
    { key: 'payments.read', module: 'payments', action: 'read' },
    { key: 'payments.create', module: 'payments', action: 'create' },
    { key: 'payments.void', module: 'payments', action: 'delete' },
    
    // Report permissions
    { key: 'reports.read', module: 'reports', action: 'read' },
    { key: 'reports.export', module: 'reports', action: 'export' },
    
    // Accounting permissions
    { key: 'accounting.read', module: 'accounting', action: 'read' },
    { key: 'accounting.create', module: 'accounting', action: 'create' },
    { key: 'accounting.update', module: 'accounting', action: 'update' },
    
    // User management permissions
    { key: 'users.read', module: 'users', action: 'read' },
    { key: 'users.create', module: 'users', action: 'create' },
    { key: 'users.update', module: 'users', action: 'update' },
    { key: 'users.delete', module: 'users', action: 'delete' },
    { key: 'users.manage', module: 'users', action: 'manage' },
    
    // Branch permissions
    { key: 'branches.read', module: 'branches', action: 'read' },
    { key: 'branches.create', module: 'branches', action: 'create' },
    { key: 'branches.update', module: 'branches', action: 'update' },
    { key: 'branches.delete', module: 'branches', action: 'delete' },
    
    // Tenant permissions
    { key: 'tenant.read', module: 'tenant', action: 'read' },
    { key: 'tenant.update', module: 'tenant', action: 'update' },
    
    // System permissions
    { key: 'system.manage', module: 'system', action: 'manage' }
  ];

  for (const update of permissionUpdates) {
    await pgm.sql(`
      UPDATE permissions 
      SET module = '${update.module}', action = '${update.action}' 
      WHERE key = '${update.key}'
    `);
  }

  // Update existing roles with hierarchy levels and system flags
  const roleUpdates = [
    { name: 'Super Admin', level: 1, is_system: true },
    { name: 'Admin', level: 2, is_system: true },
    { name: 'Manager', level: 3, is_system: true },
    { name: 'Loan Officer', level: 4, is_system: true },
    { name: 'Cashier', level: 5, is_system: true },
    { name: 'Collector', level: 5, is_system: true },
    { name: 'Customer', level: 6, is_system: true }
  ];

  for (const role of roleUpdates) {
    await pgm.sql(`
      UPDATE roles 
      SET level = ${role.level}, is_system = ${role.is_system}
      WHERE name = '${role.name}'
    `);
  }

  // Insert new enhanced RBAC roles (use name-based conflict checking)
  await pgm.sql(`
    INSERT INTO roles (name, description, level, is_system) VALUES
    ('Tenant Admin', 'Full access to tenant settings, user management, reports', 2, true),
    ('Branch Manager', 'Manages one or more branches under the tenant', 3, true),
    ('Auditor', 'View financial summaries, audit logs, reports only', 4, true)
    ON CONFLICT (name) DO UPDATE SET
      description = EXCLUDED.description,
      level = EXCLUDED.level,
      is_system = EXCLUDED.is_system
  `);

  // Insert additional permissions for enhanced RBAC
  await pgm.sql(`
    INSERT INTO permissions (key, description, module, action) VALUES
    ('dashboard.read', 'View dashboard and analytics', 'dashboard', 'read'),
    ('collections.read', 'View collection schedules and reports', 'collections', 'read'),
    ('collections.create', 'Record new collections', 'collections', 'create'),
    ('collections.update', 'Update collection records', 'collections', 'update'),
    ('accounting.read', 'View accounting records and reports', 'accounting', 'read'),
    ('accounting.create', 'Create journal entries', 'accounting', 'create'),
    ('accounting.update', 'Update accounting records', 'accounting', 'update'),
    ('branches.read', 'View branch information', 'branches', 'read'),
    ('branches.create', 'Create new branches', 'branches', 'create'),
    ('branches.update', 'Update branch information', 'branches', 'update'),
    ('branches.delete', 'Delete branches', 'branches', 'delete'),
    ('tenant.read', 'View tenant information', 'tenant', 'read'),
    ('tenant.update', 'Update tenant settings', 'tenant', 'update'),
    ('reports.export', 'Export reports to various formats', 'reports', 'export'),
    ('system.manage', 'Full system administration', 'system', 'manage'),
    ('loans.approve', 'Approve loan applications', 'loans', 'approve'),
    ('loans.reject', 'Reject loan applications', 'loans', 'reject')
    ON CONFLICT (key) DO UPDATE SET
      description = EXCLUDED.description,
      module = EXCLUDED.module,
      action = EXCLUDED.action
  `);

  // Assign permissions to Tenant Admin role
  await pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id 
    FROM roles r
    CROSS JOIN permissions p 
    WHERE r.name = 'Tenant Admin' AND p.key != 'system.manage'
    ON CONFLICT (role_id, permission_id) DO NOTHING
  `);

  // Assign permissions to Branch Manager role
  await pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id 
    FROM roles r
    CROSS JOIN permissions p 
    WHERE r.name = 'Branch Manager' AND p.key IN (
      'dashboard.read', 'customers.read', 'customers.create', 'customers.update',
      'loans.read', 'loans.create', 'loans.update', 'loans.approve', 'loans.reject',
      'collections.read', 'collections.create', 'collections.update',
      'payments.read', 'payments.create', 'reports.read', 'reports.export',
      'users.read', 'branches.read'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING
  `);

  // Assign permissions to Auditor role
  await pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id 
    FROM roles r
    CROSS JOIN permissions p 
    WHERE r.name = 'Auditor' AND p.key IN (
      'dashboard.read', 'reports.read', 'reports.export', 
      'accounting.read', 'loans.read', 'payments.read', 'collections.read'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING
  `);

  // Create indexes for better performance
  pgm.createIndex('permissions', 'module');
  pgm.createIndex('permissions', 'action');
  pgm.createIndex('roles', 'level');
  pgm.createIndex('roles', 'tenant_id');
  pgm.createIndex('roles', ['is_system', 'tenant_id']);
}

export async function down(pgm: any): Promise<void> {
  // Drop indexes
  pgm.dropIndex('roles', ['is_system', 'tenant_id']);
  pgm.dropIndex('roles', 'tenant_id');
  pgm.dropIndex('roles', 'level');
  pgm.dropIndex('permissions', 'action');
  pgm.dropIndex('permissions', 'module');

  // Remove added columns
  pgm.dropColumns('roles', ['level', 'is_system', 'tenant_id']);
  pgm.dropColumns('permissions', ['module', 'action']);
}