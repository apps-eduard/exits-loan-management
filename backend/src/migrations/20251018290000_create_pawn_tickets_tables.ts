interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create pawn tickets table
  await pgm.sql(`
    CREATE TABLE pawn_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      customer_id UUID NOT NULL REFERENCES pawn_customers(id) ON DELETE RESTRICT,
      
      -- Ticket Details
      ticket_number VARCHAR(50) NOT NULL UNIQUE,
      ticket_date DATE NOT NULL,
      
      -- Loan Details
      principal_amount DECIMAL(15,2) NOT NULL,
      interest_rate DECIMAL(5,2) NOT NULL,
      interest_period VARCHAR(20) NOT NULL,
      
      -- Terms
      loan_term_days INTEGER NOT NULL,
      maturity_date DATE NOT NULL,
      grace_period_days INTEGER NOT NULL DEFAULT 0,
      final_due_date DATE NOT NULL,
      
      -- Calculated Amounts
      interest_amount DECIMAL(15,2) NOT NULL,
      service_charge DECIMAL(15,2) NOT NULL DEFAULT 0,
      penalty_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      total_redemption_amount DECIMAL(15,2) NOT NULL,
      
      -- Status
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      
      -- Tracking
      renewal_count INTEGER NOT NULL DEFAULT 0,
      last_renewal_date DATE,
      redemption_date DATE,
      forfeiture_date DATE,
      
      -- Assignment
      branch_id UUID,
      appraiser VARCHAR(255),
      cashier VARCHAR(255),
      
      -- Notes
      notes TEXT,
      terms_conditions TEXT,
      
      -- Metadata
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create pawn collateral table
  await pgm.sql(`
    CREATE TABLE pawn_collateral (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id UUID NOT NULL REFERENCES pawn_tickets(id) ON DELETE CASCADE,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      
      -- Item Details
      item_category VARCHAR(50) NOT NULL,
      item_type VARCHAR(255) NOT NULL,
      item_description TEXT NOT NULL,
      
      -- Jewelry Specific
      metal_type VARCHAR(50),
      karat VARCHAR(20),
      weight DECIMAL(10,3),
      
      -- Electronics/Gadgets Specific
      brand VARCHAR(100),
      model VARCHAR(100),
      serial_number VARCHAR(100),
      imei VARCHAR(50),
      
      -- General Properties
      quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
      condition VARCHAR(20) NOT NULL,
      
      -- Appraisal
      appraised_value DECIMAL(15,2) NOT NULL,
      market_value DECIMAL(15,2) NOT NULL,
      loan_value DECIMAL(15,2) NOT NULL,
      
      -- Documentation
      photos TEXT[], -- Array of photo URLs
      appraisal_certificate_url TEXT,
      
      -- Storage
      storage_location VARCHAR(255) NOT NULL,
      storage_bin VARCHAR(100),
      storage_notes TEXT,
      
      -- Status
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      
      -- Metadata
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create indexes
  await pgm.sql(`
    CREATE INDEX idx_pawn_tickets_tenant ON pawn_tickets(tenant_id);
    CREATE INDEX idx_pawn_tickets_customer ON pawn_tickets(customer_id);
    CREATE INDEX idx_pawn_tickets_status ON pawn_tickets(status);
    CREATE INDEX idx_pawn_tickets_number ON pawn_tickets(ticket_number);
    CREATE INDEX idx_pawn_tickets_maturity ON pawn_tickets(maturity_date);
    CREATE INDEX idx_pawn_tickets_final_due ON pawn_tickets(final_due_date);
    
    CREATE INDEX idx_pawn_collateral_ticket ON pawn_collateral(ticket_id);
    CREATE INDEX idx_pawn_collateral_tenant ON pawn_collateral(tenant_id);
    CREATE INDEX idx_pawn_collateral_category ON pawn_collateral(item_category);
    CREATE INDEX idx_pawn_collateral_status ON pawn_collateral(status);
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql('DROP TABLE IF EXISTS pawn_collateral CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pawn_tickets CASCADE;');
}
