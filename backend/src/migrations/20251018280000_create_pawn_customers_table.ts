interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create pawn customers table
  await pgm.sql(`
    CREATE TABLE pawn_customers (
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
      id_photo_url TEXT,
      
      -- Customer Stats
      total_pawns INTEGER NOT NULL DEFAULT 0,
      active_tickets INTEGER NOT NULL DEFAULT 0,
      redeemed_tickets INTEGER NOT NULL DEFAULT 0,
      renewed_tickets INTEGER NOT NULL DEFAULT 0,
      forfeited_tickets INTEGER NOT NULL DEFAULT 0,
      
      total_borrowed DECIMAL(15,2) NOT NULL DEFAULT 0,
      total_redeemed DECIMAL(15,2) NOT NULL DEFAULT 0,
      total_interest_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
      
      -- Loyalty
      customer_since DATE NOT NULL DEFAULT CURRENT_DATE,
      loyalty_tier VARCHAR(20),
      
      -- Status
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      suspension_reason TEXT,
      
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
    CREATE INDEX idx_pawn_customers_tenant ON pawn_customers(tenant_id);
    CREATE INDEX idx_pawn_customers_status ON pawn_customers(status);
    CREATE INDEX idx_pawn_customers_phone ON pawn_customers(tenant_id, phone_number);
    CREATE INDEX idx_pawn_customers_name ON pawn_customers(first_name, last_name);
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql('DROP TABLE IF EXISTS pawn_customers CASCADE;');
}
