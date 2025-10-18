interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create BNPL customers table
  await pgm.sql(`
    CREATE TABLE bnpl_customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      
      -- Personal Information
      first_name VARCHAR(100) NOT NULL,
      middle_name VARCHAR(100),
      last_name VARCHAR(100) NOT NULL,
      date_of_birth DATE,
      gender VARCHAR(20),
      
      -- Contact Information
      email VARCHAR(255),
      phone_number VARCHAR(20) NOT NULL,
      alternate_phone VARCHAR(20),
      
      -- Address
      address_line1 VARCHAR(255) NOT NULL,
      address_line2 VARCHAR(255),
      city VARCHAR(100) NOT NULL,
      state_province VARCHAR(100) NOT NULL,
      postal_code VARCHAR(20),
      country VARCHAR(100) NOT NULL DEFAULT 'Philippines',
      
      -- Identification
      id_type VARCHAR(50),
      id_number VARCHAR(100),
      
      -- Employment
      employer VARCHAR(255),
      occupation VARCHAR(100),
      monthly_income DECIMAL(15,2),
      
      -- Credit Profile
      credit_limit DECIMAL(15,2) NOT NULL DEFAULT 0,
      available_credit DECIMAL(15,2) NOT NULL DEFAULT 0,
      total_purchases DECIMAL(15,2) NOT NULL DEFAULT 0,
      total_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
      outstanding_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
      
      -- Payment Behavior
      on_time_payments INTEGER NOT NULL DEFAULT 0,
      late_payments INTEGER NOT NULL DEFAULT 0,
      defaulted_payments INTEGER NOT NULL DEFAULT 0,
      credit_score INTEGER,
      credit_rating VARCHAR(20),
      
      -- Status
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      suspension_reason TEXT,
      
      -- Emergency Contact
      emergency_contact_name VARCHAR(255),
      emergency_contact_phone VARCHAR(20),
      emergency_contact_relationship VARCHAR(50),
      
      -- Notes
      notes TEXT,
      
      -- Metadata
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create indexes
  await pgm.sql(`
    CREATE INDEX idx_bnpl_customers_tenant ON bnpl_customers(tenant_id);
    CREATE INDEX idx_bnpl_customers_status ON bnpl_customers(status);
    CREATE INDEX idx_bnpl_customers_phone ON bnpl_customers(tenant_id, phone_number);
    CREATE INDEX idx_bnpl_customers_name ON bnpl_customers(first_name, last_name);
    CREATE INDEX idx_bnpl_customers_credit ON bnpl_customers(tenant_id, available_credit);
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql('DROP TABLE IF EXISTS bnpl_customers CASCADE;');
}
