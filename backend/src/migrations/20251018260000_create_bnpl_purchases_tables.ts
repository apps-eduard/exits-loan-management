interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create BNPL purchases table
  await pgm.sql(`
    CREATE TABLE bnpl_purchases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      customer_id UUID NOT NULL REFERENCES bnpl_customers(id) ON DELETE RESTRICT,
      
      -- Purchase Details
      purchase_number VARCHAR(50) NOT NULL UNIQUE,
      purchase_date DATE NOT NULL,
      
      -- Pricing
      subtotal DECIMAL(15,2) NOT NULL,
      tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      total_amount DECIMAL(15,2) NOT NULL,
      
      -- Down Payment
      down_payment DECIMAL(15,2) NOT NULL DEFAULT 0,
      down_payment_date DATE,
      
      -- Installment Terms
      financed_amount DECIMAL(15,2) NOT NULL,
      number_of_installments INTEGER NOT NULL,
      installment_frequency VARCHAR(20) NOT NULL,
      installment_amount DECIMAL(15,2) NOT NULL,
      
      -- Interest/Service Charge
      interest_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
      interest_type VARCHAR(20) NOT NULL DEFAULT 'flat',
      total_interest DECIMAL(15,2) NOT NULL DEFAULT 0,
      total_payable DECIMAL(15,2) NOT NULL,
      
      -- Dates
      first_payment_date DATE NOT NULL,
      final_payment_date DATE NOT NULL,
      
      -- Status
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      
      -- Payment Tracking
      amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
      outstanding_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
      last_payment_date DATE,
      next_payment_due DATE,
      
      -- Assignment
      branch_id UUID REFERENCES branches(id),
      assigned_collector UUID REFERENCES users(id),
      sales_person VARCHAR(255),
      
      -- Approval
      approved_by UUID REFERENCES users(id),
      approved_at TIMESTAMP,
      
      -- Notes
      notes TEXT,
      
      -- Metadata
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create BNPL purchase items table
  await pgm.sql(`
    CREATE TABLE bnpl_purchase_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      purchase_id UUID NOT NULL REFERENCES bnpl_purchases(id) ON DELETE CASCADE,
      
      product_name VARCHAR(255) NOT NULL,
      product_code VARCHAR(100),
      description TEXT,
      
      quantity DECIMAL(10,2) NOT NULL,
      unit_price DECIMAL(15,2) NOT NULL,
      total_price DECIMAL(15,2) NOT NULL,
      
      -- Optional inventory link
      inventory_item_id UUID,
      
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create BNPL installments table
  await pgm.sql(`
    CREATE TABLE bnpl_installments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      purchase_id UUID NOT NULL REFERENCES bnpl_purchases(id) ON DELETE CASCADE,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      customer_id UUID NOT NULL REFERENCES bnpl_customers(id) ON DELETE RESTRICT,
      
      installment_number INTEGER NOT NULL,
      due_date DATE NOT NULL,
      amount_due DECIMAL(15,2) NOT NULL,
      
      amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
      balance DECIMAL(15,2) NOT NULL,
      
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      payment_date DATE,
      
      -- Penalties
      days_overdue INTEGER NOT NULL DEFAULT 0,
      penalty_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      
      -- Notes
      notes TEXT
    );
  `);

  // Create indexes
  await pgm.sql(`
    CREATE INDEX idx_bnpl_purchases_tenant ON bnpl_purchases(tenant_id);
    CREATE INDEX idx_bnpl_purchases_customer ON bnpl_purchases(customer_id);
    CREATE INDEX idx_bnpl_purchases_status ON bnpl_purchases(status);
    CREATE INDEX idx_bnpl_purchases_number ON bnpl_purchases(purchase_number);
    CREATE INDEX idx_bnpl_purchases_next_due ON bnpl_purchases(next_payment_due);
    CREATE INDEX idx_bnpl_purchases_collector ON bnpl_purchases(assigned_collector);
    
    CREATE INDEX idx_bnpl_items_purchase ON bnpl_purchase_items(purchase_id);
    
    CREATE INDEX idx_bnpl_installments_purchase ON bnpl_installments(purchase_id);
    CREATE INDEX idx_bnpl_installments_tenant ON bnpl_installments(tenant_id);
    CREATE INDEX idx_bnpl_installments_customer ON bnpl_installments(customer_id);
    CREATE INDEX idx_bnpl_installments_status ON bnpl_installments(status);
    CREATE INDEX idx_bnpl_installments_due ON bnpl_installments(due_date);
  `);

  // Add trigger to update purchase balance when installment changes
  await pgm.sql(`
    CREATE OR REPLACE FUNCTION update_bnpl_purchase_balance()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE bnpl_purchases
      SET 
        outstanding_balance = (
          SELECT COALESCE(SUM(balance), 0)
          FROM bnpl_installments
          WHERE purchase_id = NEW.purchase_id
        ),
        updated_at = NOW()
      WHERE id = NEW.purchase_id;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER update_bnpl_purchase_balance_trigger
    AFTER INSERT OR UPDATE ON bnpl_installments
    FOR EACH ROW
    EXECUTE FUNCTION update_bnpl_purchase_balance();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql('DROP TRIGGER IF EXISTS update_bnpl_purchase_balance_trigger ON bnpl_installments;');
  await pgm.sql('DROP FUNCTION IF EXISTS update_bnpl_purchase_balance();');
  await pgm.sql('DROP TABLE IF EXISTS bnpl_installments CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS bnpl_purchase_items CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS bnpl_purchases CASCADE;');
}
