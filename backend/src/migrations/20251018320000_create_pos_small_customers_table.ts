interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create customers table
  await pgm.sql(`
    CREATE TABLE pos_small_customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      
      -- Customer Details
      customer_name VARCHAR(255) NOT NULL,
      nickname VARCHAR(100),
      phone_number VARCHAR(20),
      address TEXT,
      
      -- Credit Tracking
      credit_limit DECIMAL(15,2) NOT NULL DEFAULT 0,
      outstanding_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
      available_credit DECIMAL(15,2) NOT NULL DEFAULT 0,
      
      -- Payment History
      total_purchases DECIMAL(15,2) NOT NULL DEFAULT 0,
      total_payments DECIMAL(15,2) NOT NULL DEFAULT 0,
      on_time_payments INTEGER NOT NULL DEFAULT 0,
      late_payments INTEGER NOT NULL DEFAULT 0,
      
      -- Status
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      credit_status VARCHAR(20) NOT NULL DEFAULT 'good',
      
      -- Notes
      notes TEXT,
      
      -- Metadata
      customer_since DATE NOT NULL DEFAULT CURRENT_DATE,
      last_purchase_date DATE,
      last_payment_date DATE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create credit accounts table
  await pgm.sql(`
    CREATE TABLE pos_small_credit_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      customer_id UUID NOT NULL REFERENCES pos_small_customers(id) ON DELETE RESTRICT,
      
      -- Account Details
      account_number VARCHAR(50) NOT NULL UNIQUE,
      account_date DATE NOT NULL,
      
      -- Amount
      principal_amount DECIMAL(15,2) NOT NULL,
      interest_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      total_amount DECIMAL(15,2) NOT NULL,
      amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
      balance DECIMAL(15,2) NOT NULL,
      
      -- Payment Terms
      payment_terms VARCHAR(100),
      due_date DATE,
      
      -- Status
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      days_overdue INTEGER NOT NULL DEFAULT 0,
      
      -- Related Sale
      sale_id UUID,
      
      -- Notes
      notes TEXT,
      
      -- Metadata
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create payments table
  await pgm.sql(`
    CREATE TABLE pos_small_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      customer_id UUID NOT NULL REFERENCES pos_small_customers(id) ON DELETE RESTRICT,
      credit_account_id UUID NOT NULL REFERENCES pos_small_credit_accounts(id) ON DELETE RESTRICT,
      
      -- Payment Details
      payment_date DATE NOT NULL,
      payment_amount DECIMAL(15,2) NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      reference_number VARCHAR(100),
      
      -- Allocation
      principal_paid DECIMAL(15,2) NOT NULL,
      interest_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
      
      -- Balance After Payment
      balance_before DECIMAL(15,2) NOT NULL,
      balance_after DECIMAL(15,2) NOT NULL,
      
      -- Receipt
      receipt_number VARCHAR(100) NOT NULL,
      
      -- Notes
      notes TEXT,
      
      -- Metadata
      processed_by UUID REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create indexes
  await pgm.sql(`
    CREATE INDEX idx_pos_small_customers_tenant ON pos_small_customers(tenant_id);
    CREATE INDEX idx_pos_small_customers_status ON pos_small_customers(status);
    CREATE INDEX idx_pos_small_customers_phone ON pos_small_customers(tenant_id, phone_number);
    CREATE INDEX idx_pos_small_customers_name ON pos_small_customers(customer_name);
    
    CREATE INDEX idx_pos_small_credit_accounts_tenant ON pos_small_credit_accounts(tenant_id);
    CREATE INDEX idx_pos_small_credit_accounts_customer ON pos_small_credit_accounts(customer_id);
    CREATE INDEX idx_pos_small_credit_accounts_status ON pos_small_credit_accounts(status);
    CREATE INDEX idx_pos_small_credit_accounts_due_date ON pos_small_credit_accounts(due_date);
    CREATE INDEX idx_pos_small_credit_accounts_sale ON pos_small_credit_accounts(sale_id);
    
    CREATE INDEX idx_pos_small_payments_tenant ON pos_small_payments(tenant_id);
    CREATE INDEX idx_pos_small_payments_customer ON pos_small_payments(customer_id);
    CREATE INDEX idx_pos_small_payments_account ON pos_small_payments(credit_account_id);
    CREATE INDEX idx_pos_small_payments_date ON pos_small_payments(payment_date);
  `);

  // Add trigger to process payment
  await pgm.sql(`
    CREATE OR REPLACE FUNCTION process_pos_small_payment()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Update credit account
      UPDATE pos_small_credit_accounts
      SET 
        amount_paid = amount_paid + NEW.payment_amount,
        balance = balance - NEW.payment_amount,
        status = CASE 
          WHEN balance - NEW.payment_amount <= 0 THEN 'paid'
          ELSE status
        END,
        updated_at = NOW()
      WHERE id = NEW.credit_account_id;
      
      -- Update customer
      UPDATE pos_small_customers
      SET 
        outstanding_balance = outstanding_balance - NEW.payment_amount,
        available_credit = credit_limit - (outstanding_balance - NEW.payment_amount),
        total_payments = total_payments + NEW.payment_amount,
        last_payment_date = NEW.payment_date,
        updated_at = NOW()
      WHERE id = NEW.customer_id;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER process_pos_small_payment_trigger
    AFTER INSERT ON pos_small_payments
    FOR EACH ROW
    EXECUTE FUNCTION process_pos_small_payment();
  `);

  // Add trigger to update customer available credit
  await pgm.sql(`
    CREATE OR REPLACE FUNCTION update_pos_small_customer_credit()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.available_credit := NEW.credit_limit - NEW.outstanding_balance;
      NEW.updated_at := NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER update_pos_small_customer_credit_trigger
    BEFORE UPDATE OF credit_limit, outstanding_balance ON pos_small_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_pos_small_customer_credit();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql('DROP TRIGGER IF EXISTS update_pos_small_customer_credit_trigger ON pos_small_customers;');
  await pgm.sql('DROP FUNCTION IF EXISTS update_pos_small_customer_credit();');
  await pgm.sql('DROP TRIGGER IF EXISTS process_pos_small_payment_trigger ON pos_small_payments;');
  await pgm.sql('DROP FUNCTION IF EXISTS process_pos_small_payment();');
  
  await pgm.sql('DROP TABLE IF EXISTS pos_small_payments CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pos_small_credit_accounts CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pos_small_customers CASCADE;');
}
