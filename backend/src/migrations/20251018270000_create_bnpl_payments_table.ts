interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create BNPL payments table
  await pgm.sql(`
    CREATE TABLE bnpl_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      purchase_id UUID NOT NULL REFERENCES bnpl_purchases(id) ON DELETE RESTRICT,
      customer_id UUID NOT NULL REFERENCES bnpl_customers(id) ON DELETE RESTRICT,
      
      -- Payment Details
      payment_number VARCHAR(50) NOT NULL UNIQUE,
      payment_date DATE NOT NULL,
      payment_amount DECIMAL(15,2) NOT NULL,
      
      -- Allocation
      principal_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
      interest_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
      penalty_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
      
      -- Payment Method
      payment_method VARCHAR(50) NOT NULL,
      reference_number VARCHAR(100),
      
      -- Receipt
      receipt_number VARCHAR(100),
      receipt_url TEXT,
      
      -- Status
      status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
      
      -- Notes
      notes TEXT,
      
      -- Metadata
      received_by UUID REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create BNPL payment reminders table
  await pgm.sql(`
    CREATE TABLE bnpl_payment_reminders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      purchase_id UUID NOT NULL REFERENCES bnpl_purchases(id) ON DELETE CASCADE,
      customer_id UUID NOT NULL REFERENCES bnpl_customers(id) ON DELETE CASCADE,
      
      reminder_type VARCHAR(20) NOT NULL,
      reminder_method VARCHAR(20) NOT NULL,
      
      scheduled_date DATE NOT NULL,
      sent_date TIMESTAMP,
      
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      message_content TEXT,
      
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create indexes
  await pgm.sql(`
    CREATE INDEX idx_bnpl_payments_tenant ON bnpl_payments(tenant_id);
    CREATE INDEX idx_bnpl_payments_purchase ON bnpl_payments(purchase_id);
    CREATE INDEX idx_bnpl_payments_customer ON bnpl_payments(customer_id);
    CREATE INDEX idx_bnpl_payments_date ON bnpl_payments(payment_date);
    CREATE INDEX idx_bnpl_payments_number ON bnpl_payments(payment_number);
    
    CREATE INDEX idx_bnpl_reminders_tenant ON bnpl_payment_reminders(tenant_id);
    CREATE INDEX idx_bnpl_reminders_purchase ON bnpl_payment_reminders(purchase_id);
    CREATE INDEX idx_bnpl_reminders_status ON bnpl_payment_reminders(status);
    CREATE INDEX idx_bnpl_reminders_scheduled ON bnpl_payment_reminders(scheduled_date);
  `);

  // Add trigger to process BNPL payment
  await pgm.sql(`
    CREATE OR REPLACE FUNCTION process_bnpl_payment()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Update purchase
      UPDATE bnpl_purchases
      SET 
        amount_paid = amount_paid + NEW.payment_amount,
        last_payment_date = NEW.payment_date,
        updated_at = NOW(),
        status = CASE 
          WHEN (amount_paid + NEW.payment_amount) >= total_payable THEN 'completed'
          ELSE 'active'
        END
      WHERE id = NEW.purchase_id;
      
      -- Update customer
      UPDATE bnpl_customers
      SET 
        total_paid = total_paid + NEW.payment_amount,
        outstanding_balance = outstanding_balance - NEW.payment_amount,
        available_credit = available_credit + NEW.payment_amount,
        updated_at = NOW()
      WHERE id = NEW.customer_id;
      
      -- Update installment
      UPDATE bnpl_installments
      SET 
        amount_paid = amount_paid + NEW.principal_paid + NEW.interest_paid,
        balance = balance - (NEW.principal_paid + NEW.interest_paid),
        status = CASE 
          WHEN balance - (NEW.principal_paid + NEW.interest_paid) <= 0 THEN 'paid'
          WHEN amount_paid > 0 THEN 'partial'
          ELSE status
        END,
        payment_date = CASE 
          WHEN balance - (NEW.principal_paid + NEW.interest_paid) <= 0 THEN NEW.payment_date
          ELSE payment_date
        END
      WHERE purchase_id = NEW.purchase_id
        AND status != 'paid'
      ORDER BY installment_number ASC
      LIMIT 1;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER process_bnpl_payment_trigger
    AFTER INSERT ON bnpl_payments
    FOR EACH ROW
    EXECUTE FUNCTION process_bnpl_payment();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql('DROP TRIGGER IF EXISTS process_bnpl_payment_trigger ON bnpl_payments;');
  await pgm.sql('DROP FUNCTION IF EXISTS process_bnpl_payment();');
  await pgm.sql('DROP TABLE IF EXISTS bnpl_payment_reminders CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS bnpl_payments CASCADE;');
}
