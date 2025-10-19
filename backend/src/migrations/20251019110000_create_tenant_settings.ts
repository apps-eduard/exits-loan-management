// Minimal subset of the MigrationBuilder API used in this project
type MigrationBuilder = {
  createTable: (tableName: string, columns: any) => void;
  createIndex: (tableName: string, columns: string | string[]) => void;
  addConstraint: (tableName: string, constraintName: string, constraint: any) => void;
  sql: (query: string) => void;
  dropTable: (tableName: string) => void;
  func: (funcName: string) => any;
};

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Drop table if it exists (for idempotency)
  pgm.sql('DROP TABLE IF EXISTS tenant_settings CASCADE;');
  
  // Create tenant_settings table for flexible tenant configuration
  pgm.createTable('tenant_settings', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    tenant_id: {
      type: 'uuid',
      notNull: true,
      references: 'tenants(id)',
      onDelete: 'CASCADE',
    },
    category: {
      type: 'varchar(100)',
      notNull: true,
      comment: 'Settings category: general, security, notifications, integrations, etc.'
    },
    setting_key: {
      type: 'varchar(200)',
      notNull: true,
      comment: 'Unique setting key within the category'
    },
    setting_value: {
      type: 'jsonb',
      notNull: true,
      comment: 'Setting value stored as JSONB for flexibility'
    },
    data_type: {
      type: 'varchar(50)',
      notNull: true,
      default: 'string',
      comment: 'Data type: string, number, boolean, array, object'
    },
    description: {
      type: 'text',
      comment: 'Human-readable description of the setting'
    },
    is_public: {
      type: 'boolean',
      notNull: true,
      default: false,
      comment: 'Whether this setting can be accessed by frontend/public APIs'
    },
    is_encrypted: {
      type: 'boolean',
      notNull: true,
      default: false,
      comment: 'Whether this setting value is encrypted'
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // Create indexes for efficient querying
  pgm.createIndex('tenant_settings', 'tenant_id');
  pgm.createIndex('tenant_settings', 'category');
  pgm.createIndex('tenant_settings', ['tenant_id', 'category']);
  pgm.createIndex('tenant_settings', ['tenant_id', 'setting_key']);
  
  // Create unique constraint for tenant_id + category + setting_key
  pgm.addConstraint('tenant_settings', 'tenant_settings_unique_key', {
    unique: ['tenant_id', 'category', 'setting_key']
  });

  // Insert default settings for all existing tenants
  pgm.sql(`
    INSERT INTO tenant_settings (tenant_id, category, setting_key, setting_value, data_type, description, is_public)
    SELECT 
      t.id as tenant_id,
      'general' as category,
      'company_settings' as setting_key,
      jsonb_build_object(
        'company_name', t.company_name,
        'contact_email', t.contact_email,
        'contact_phone', t.contact_phone,
        'timezone', COALESCE(t.timezone, 'Asia/Manila'),
        'currency', COALESCE(t.currency, 'PHP'),
        'locale', COALESCE(t.locale, 'en-PH')
      ) as setting_value,
      'object' as data_type,
      'General company information and regional settings' as description,
      true as is_public
    FROM tenants t;
  `);

  pgm.sql(`
    INSERT INTO tenant_settings (tenant_id, category, setting_key, setting_value, data_type, description, is_public)
    SELECT 
      t.id as tenant_id,
      'branding' as category,
      'theme_settings' as setting_key,
      jsonb_build_object(
        'primary_color', COALESCE(t.primary_color, '#3B82F6'),
        'secondary_color', COALESCE(t.secondary_color, '#8B5CF6'),
        'logo_url', t.logo_url
      ) as setting_value,
      'object' as data_type,
      'Branding colors and logo configuration' as description,
      true as is_public
    FROM tenants t;
  `);

  pgm.sql(`
    INSERT INTO tenant_settings (tenant_id, category, setting_key, setting_value, data_type, description, is_public)
    SELECT 
      t.id as tenant_id,
      'security' as category,
      'password_policy' as setting_key,
      jsonb_build_object(
        'min_length', 8,
        'require_uppercase', true,
        'require_lowercase', true,
        'require_numbers', true,
        'require_special_chars', false,
        'password_expiry_days', 90,
        'max_login_attempts', 5,
        'lockout_duration_minutes', 30
      ) as setting_value,
      'object' as data_type,
      'Password security policy configuration' as description,
      false as is_public
    FROM tenants t;
  `);

  pgm.sql(`
    INSERT INTO tenant_settings (tenant_id, category, setting_key, setting_value, data_type, description, is_public)
    SELECT 
      t.id as tenant_id,
      'notifications' as category,
      'email_settings' as setting_key,
      jsonb_build_object(
        'enabled', true,
        'smtp_host', null,
        'smtp_port', 587,
        'smtp_username', null,
        'smtp_password', null,
        'from_email', t.contact_email,
        'from_name', t.company_name
      ) as setting_value,
      'object' as data_type,
      'Email notification configuration' as description,
      false as is_public
    FROM tenants t;
  `);

  pgm.sql(`
    INSERT INTO tenant_settings (tenant_id, category, setting_key, setting_value, data_type, description, is_public)
    SELECT 
      t.id as tenant_id,
      'business' as category,
      'loan_settings' as setting_key,
      jsonb_build_object(
        'default_interest_rate', 5.0,
        'default_loan_term_months', 12,
        'max_loan_amount', 1000000,
        'min_loan_amount', 1000,
        'late_fee_percentage', 2.0,
        'grace_period_days', 3,
        'auto_approve_limit', 50000
      ) as setting_value,
      'object' as data_type,
      'Default loan business rules and limits' as description,
      false as is_public
    FROM tenants t;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('tenant_settings');
}