interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Insert Head Office organizational unit
  await pgm.sql(`
    INSERT INTO organizational_units (id, name, code, type, description)
    VALUES (
      'a0000000-0000-0000-0000-000000000001',
      'Head Office',
      'HQ',
      'region',
      'Corporate headquarters and central administration'
    );
  `);

  // Insert sample branch
  await pgm.sql(`
    INSERT INTO organizational_units (id, parent_id, name, code, type, description)
    VALUES (
      'a0000000-0000-0000-0000-000000000002',
      'a0000000-0000-0000-0000-000000000001',
      'Iloilo Branch',
      'BR-ILOILO',
      'branch',
      'Main branch in Iloilo City'
    );
  `);

  // Insert roles
  await pgm.sql(`
    INSERT INTO roles (id, name, description, is_default) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Super Admin', 'Full system access across all organizational units', false),
    ('b0000000-0000-0000-0000-000000000002', 'Admin', 'Branch-level administrative access', false),
    ('b0000000-0000-0000-0000-000000000003', 'Manager', 'Branch manager with approval authority', false),
    ('b0000000-0000-0000-0000-000000000004', 'Loan Officer', 'Processes loan applications', false),
    ('b0000000-0000-0000-0000-000000000005', 'Cashier', 'Handles disbursements and payments', false),
    ('b0000000-0000-0000-0000-000000000006', 'Collector', 'Field agent for collections', false),
    ('b0000000-0000-0000-0000-000000000007', 'Customer', 'Loan applicant and borrower', true);
  `);

  // Insert permissions
  await pgm.sql(`
    INSERT INTO permissions (id, key, description) VALUES
    -- User management (granular)
    ('c0000000-0000-0000-0000-000000000001', 'users.create', 'Create new users'),
    ('c0000000-0000-0000-0000-000000000002', 'users.read', 'View user information'),
    ('c0000000-0000-0000-0000-000000000003', 'users.update', 'Update user information'),
    ('c0000000-0000-0000-0000-000000000004', 'users.delete', 'Delete users'),
    
    -- Organizational unit management
    ('c0000000-0000-0000-0000-000000000005', 'ou.create', 'Create organizational units'),
    ('c0000000-0000-0000-0000-000000000006', 'ou.read', 'View organizational units'),
    ('c0000000-0000-0000-0000-000000000007', 'ou.update', 'Update organizational units'),
    ('c0000000-0000-0000-0000-000000000008', 'ou.delete', 'Delete organizational units'),
    
    -- Customer management (granular)
    ('c0000000-0000-0000-0000-000000000009', 'customers.create', 'Create customer records'),
    ('c0000000-0000-0000-0000-000000000010', 'customers.read', 'View customer information'),
    ('c0000000-0000-0000-0000-000000000011', 'customers.update', 'Update customer information'),
    ('c0000000-0000-0000-0000-000000000012', 'customers.delete', 'Delete customer records'),
    
    -- Loan management (granular)
    ('c0000000-0000-0000-0000-000000000013', 'loans.create', 'Create loan applications'),
    ('c0000000-0000-0000-0000-000000000014', 'loans.read', 'View loan information'),
    ('c0000000-0000-0000-0000-000000000015', 'loans.update', 'Update loan information'),
    ('c0000000-0000-0000-0000-000000000016', 'loans.approve', 'Approve loan applications'),
    ('c0000000-0000-0000-0000-000000000017', 'loans.disburse', 'Disburse approved loans'),
    ('c0000000-0000-0000-0000-000000000018', 'loans.delete', 'Delete loan records'),
    
    -- Payment management (granular)
    ('c0000000-0000-0000-0000-000000000019', 'payments.create', 'Record payments'),
    ('c0000000-0000-0000-0000-000000000020', 'payments.read', 'View payment records'),
    ('c0000000-0000-0000-0000-000000000021', 'payments.update', 'Update payment records'),
    ('c0000000-0000-0000-0000-000000000022', 'payments.delete', 'Delete payment records'),
    
    -- Reporting
    ('c0000000-0000-0000-0000-000000000023', 'reports.view', 'View reports'),
    ('c0000000-0000-0000-0000-000000000024', 'reports.export', 'Export reports'),
    
    -- System settings
    ('c0000000-0000-0000-0000-000000000025', 'settings.read', 'View system settings'),
    ('c0000000-0000-0000-0000-000000000026', 'settings.update', 'Update system settings'),
    
    -- High-level permissions (for frontend route guards)
    ('c0000000-0000-0000-0000-000000000027', 'manage_users', 'Manage users (create, read, update, delete)'),
    ('c0000000-0000-0000-0000-000000000028', 'view_users', 'View users'),
    ('c0000000-0000-0000-0000-000000000029', 'manage_customers', 'Manage customers'),
    ('c0000000-0000-0000-0000-000000000030', 'view_customers', 'View customers'),
    ('c0000000-0000-0000-0000-000000000031', 'manage_loans', 'Manage loans'),
    ('c0000000-0000-0000-0000-000000000032', 'view_loans', 'View loans'),
    ('c0000000-0000-0000-0000-000000000033', 'manage_payments', 'Manage payments'),
    ('c0000000-0000-0000-0000-000000000034', 'view_payments', 'View payments'),
    ('c0000000-0000-0000-0000-000000000035', 'view_reports', 'View reports'),
    ('c0000000-0000-0000-0000-000000000036', 'view_analytics', 'View analytics'),
    ('c0000000-0000-0000-0000-000000000037', 'manage_loan_products', 'Manage loan products'),
    ('c0000000-0000-0000-0000-000000000038', 'view_loan_products', 'View loan products');
  `);

  // Assign all permissions to Super Admin
  await pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 'b0000000-0000-0000-0000-000000000001', id FROM permissions;
  `);

  // Assign permissions to Admin (all except system settings update)
  await pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 'b0000000-0000-0000-0000-000000000002', id 
    FROM permissions 
    WHERE key != 'settings.update';
  `);

  // Assign permissions to Manager
  await pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 'b0000000-0000-0000-0000-000000000003', id 
    FROM permissions 
    WHERE key IN (
      'users.read', 'customers.read', 'customers.update',
      'loans.read', 'loans.approve', 'loans.disburse',
      'payments.read', 'reports.view', 'reports.export'
    );
  `);

  // Assign permissions to Loan Officer
  await pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 'b0000000-0000-0000-0000-000000000004', id 
    FROM permissions 
    WHERE key IN (
      'customers.create', 'customers.read', 'customers.update',
      'loans.create', 'loans.read', 'loans.update'
    );
  `);

  // Assign permissions to Cashier
  await pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 'b0000000-0000-0000-0000-000000000005', id 
    FROM permissions 
    WHERE key IN (
      'customers.read', 'loans.read', 'loans.disburse',
      'payments.create', 'payments.read'
    );
  `);

  // Assign permissions to Collector
  await pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 'b0000000-0000-0000-0000-000000000006', id 
    FROM permissions 
    WHERE key IN (
      'customers.read', 'loans.read',
      'payments.create', 'payments.read'
    );
  `);

  // Assign permissions to Customer
  await pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 'b0000000-0000-0000-0000-000000000007', id 
    FROM permissions 
    WHERE key IN (
      'loans.create', 'loans.read',
      'payments.read'
    );
  `);

  // Create super admin user (password: Admin@123)
  // Hash generated with bcrypt rounds=10
  await pgm.sql(`
    INSERT INTO users (
      id, organizational_unit_id, role_id, email, phone, password_hash,
      first_name, last_name, status
    ) VALUES (
      'd0000000-0000-0000-0000-000000000001',
      'a0000000-0000-0000-0000-000000000001',
      'b0000000-0000-0000-0000-000000000001',
      'admin@pacifica.ph',
      '+63 917 123 4567',
      '$2b$10$e7PMEhJWA.ygiVyUwi0OgOty0x.ZXBykRi18YXd.sojpRQQYgWPGe',
      'System',
      'Administrator',
      'active'
    );
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql(`DELETE FROM users WHERE id = 'd0000000-0000-0000-0000-000000000001';`);
  await pgm.sql(`DELETE FROM role_permissions;`);
  await pgm.sql(`DELETE FROM permissions;`);
  await pgm.sql(`DELETE FROM roles;`);
  await pgm.sql(`DELETE FROM organizational_units WHERE id IN (
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002'
  );`);
}
