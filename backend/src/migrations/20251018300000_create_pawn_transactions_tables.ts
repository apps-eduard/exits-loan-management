interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create pawn renewals table
  await pgm.sql(`
    CREATE TABLE pawn_renewals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id UUID NOT NULL REFERENCES pawn_tickets(id) ON DELETE CASCADE,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      customer_id UUID NOT NULL REFERENCES pawn_customers(id) ON DELETE RESTRICT,
      
      renewal_number INTEGER NOT NULL,
      renewal_date DATE NOT NULL,
      
      -- Previous terms
      previous_maturity_date DATE NOT NULL,
      previous_interest_amount DECIMAL(15,2) NOT NULL,
      
      -- New terms
      new_maturity_date DATE NOT NULL,
      new_grace_period_days INTEGER NOT NULL,
      new_final_due_date DATE NOT NULL,
      
      -- Payment for renewal
      renewal_interest_paid DECIMAL(15,2) NOT NULL,
      renewal_service_charge DECIMAL(15,2) NOT NULL DEFAULT 0,
      total_renewal_payment DECIMAL(15,2) NOT NULL,
      
      payment_method VARCHAR(50) NOT NULL,
      receipt_number VARCHAR(100),
      
      -- Notes
      notes TEXT,
      
      -- Metadata
      processed_by UUID REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create pawn redemptions table
  await pgm.sql(`
    CREATE TABLE pawn_redemptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id UUID NOT NULL REFERENCES pawn_tickets(id) ON DELETE RESTRICT,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      customer_id UUID NOT NULL REFERENCES pawn_customers(id) ON DELETE RESTRICT,
      
      redemption_date DATE NOT NULL,
      
      -- Payment Breakdown
      principal_amount DECIMAL(15,2) NOT NULL,
      interest_amount DECIMAL(15,2) NOT NULL,
      service_charge DECIMAL(15,2) NOT NULL DEFAULT 0,
      penalty_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      total_redemption_amount DECIMAL(15,2) NOT NULL,
      
      -- Discount (if any)
      discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      discount_reason TEXT,
      
      -- Payment
      amount_paid DECIMAL(15,2) NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      reference_number VARCHAR(100),
      
      -- Receipt
      receipt_number VARCHAR(100) NOT NULL,
      receipt_url TEXT,
      
      -- Release
      items_released BOOLEAN NOT NULL DEFAULT false,
      released_to VARCHAR(255) NOT NULL,
      released_by UUID REFERENCES users(id),
      
      -- Notes
      notes TEXT,
      
      -- Metadata
      processed_by UUID REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create pawn forfeitures table
  await pgm.sql(`
    CREATE TABLE pawn_forfeitures (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id UUID NOT NULL REFERENCES pawn_tickets(id) ON DELETE RESTRICT,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      customer_id UUID NOT NULL REFERENCES pawn_customers(id) ON DELETE RESTRICT,
      
      forfeiture_date DATE NOT NULL,
      forfeiture_reason VARCHAR(50) NOT NULL,
      
      -- Final amounts
      unredeemed_principal DECIMAL(15,2) NOT NULL,
      unpaid_interest DECIMAL(15,2) NOT NULL,
      total_loss DECIMAL(15,2) NOT NULL,
      
      -- Auction details (if planned)
      planned_for_auction BOOLEAN NOT NULL DEFAULT false,
      auction_date DATE,
      minimum_bid DECIMAL(15,2),
      
      -- Sale details (if sold)
      sold BOOLEAN NOT NULL DEFAULT false,
      sale_date DATE,
      sale_amount DECIMAL(15,2),
      buyer_name VARCHAR(255),
      
      -- Recovery
      recovery_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      net_loss DECIMAL(15,2) NOT NULL DEFAULT 0,
      
      -- Notes
      notes TEXT,
      
      -- Metadata
      processed_by UUID REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create indexes
  await pgm.sql(`
    CREATE INDEX idx_pawn_renewals_ticket ON pawn_renewals(ticket_id);
    CREATE INDEX idx_pawn_renewals_tenant ON pawn_renewals(tenant_id);
    CREATE INDEX idx_pawn_renewals_customer ON pawn_renewals(customer_id);
    CREATE INDEX idx_pawn_renewals_date ON pawn_renewals(renewal_date);
    
    CREATE INDEX idx_pawn_redemptions_ticket ON pawn_redemptions(ticket_id);
    CREATE INDEX idx_pawn_redemptions_tenant ON pawn_redemptions(tenant_id);
    CREATE INDEX idx_pawn_redemptions_customer ON pawn_redemptions(customer_id);
    CREATE INDEX idx_pawn_redemptions_date ON pawn_redemptions(redemption_date);
    
    CREATE INDEX idx_pawn_forfeitures_ticket ON pawn_forfeitures(ticket_id);
    CREATE INDEX idx_pawn_forfeitures_tenant ON pawn_forfeitures(tenant_id);
    CREATE INDEX idx_pawn_forfeitures_customer ON pawn_forfeitures(customer_id);
    CREATE INDEX idx_pawn_forfeitures_date ON pawn_forfeitures(forfeiture_date);
    CREATE INDEX idx_pawn_forfeitures_auction ON pawn_forfeitures(planned_for_auction, auction_date);
  `);

  // Add trigger to process redemption
  await pgm.sql(`
    CREATE OR REPLACE FUNCTION process_pawn_redemption()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Update ticket status
      UPDATE pawn_tickets
      SET 
        status = 'redeemed',
        redemption_date = NEW.redemption_date,
        updated_at = NOW()
      WHERE id = NEW.ticket_id;
      
      -- Update collateral status
      UPDATE pawn_collateral
      SET 
        status = 'redeemed',
        updated_at = NOW()
      WHERE ticket_id = NEW.ticket_id;
      
      -- Update customer stats
      UPDATE pawn_customers
      SET 
        active_tickets = active_tickets - 1,
        redeemed_tickets = redeemed_tickets + 1,
        total_redeemed = total_redeemed + NEW.principal_amount,
        total_interest_paid = total_interest_paid + NEW.interest_amount,
        updated_at = NOW()
      WHERE id = NEW.customer_id;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER process_pawn_redemption_trigger
    AFTER INSERT ON pawn_redemptions
    FOR EACH ROW
    EXECUTE FUNCTION process_pawn_redemption();
  `);

  // Add trigger to process renewal
  await pgm.sql(`
    CREATE OR REPLACE FUNCTION process_pawn_renewal()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Update ticket
      UPDATE pawn_tickets
      SET 
        status = 'renewed',
        renewal_count = renewal_count + 1,
        last_renewal_date = NEW.renewal_date,
        maturity_date = NEW.new_maturity_date,
        grace_period_days = NEW.new_grace_period_days,
        final_due_date = NEW.new_final_due_date,
        updated_at = NOW()
      WHERE id = NEW.ticket_id;
      
      -- Update customer stats
      UPDATE pawn_customers
      SET 
        renewed_tickets = renewed_tickets + 1,
        total_interest_paid = total_interest_paid + NEW.renewal_interest_paid,
        updated_at = NOW()
      WHERE id = NEW.customer_id;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER process_pawn_renewal_trigger
    AFTER INSERT ON pawn_renewals
    FOR EACH ROW
    EXECUTE FUNCTION process_pawn_renewal();
  `);

  // Add trigger to process forfeiture
  await pgm.sql(`
    CREATE OR REPLACE FUNCTION process_pawn_forfeiture()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Update ticket status
      UPDATE pawn_tickets
      SET 
        status = 'forfeited',
        forfeiture_date = NEW.forfeiture_date,
        updated_at = NOW()
      WHERE id = NEW.ticket_id;
      
      -- Update collateral status
      UPDATE pawn_collateral
      SET 
        status = 'forfeited',
        updated_at = NOW()
      WHERE ticket_id = NEW.ticket_id;
      
      -- Update customer stats
      UPDATE pawn_customers
      SET 
        active_tickets = active_tickets - 1,
        forfeited_tickets = forfeited_tickets + 1,
        updated_at = NOW()
      WHERE id = NEW.customer_id;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER process_pawn_forfeiture_trigger
    AFTER INSERT ON pawn_forfeitures
    FOR EACH ROW
    EXECUTE FUNCTION process_pawn_forfeiture();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql('DROP TRIGGER IF EXISTS process_pawn_forfeiture_trigger ON pawn_forfeitures;');
  await pgm.sql('DROP FUNCTION IF EXISTS process_pawn_forfeiture();');
  await pgm.sql('DROP TRIGGER IF EXISTS process_pawn_renewal_trigger ON pawn_renewals;');
  await pgm.sql('DROP FUNCTION IF EXISTS process_pawn_renewal();');
  await pgm.sql('DROP TRIGGER IF EXISTS process_pawn_redemption_trigger ON pawn_redemptions;');
  await pgm.sql('DROP FUNCTION IF EXISTS process_pawn_redemption();');
  
  await pgm.sql('DROP TABLE IF EXISTS pawn_forfeitures CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pawn_redemptions CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pawn_renewals CASCADE;');
}
