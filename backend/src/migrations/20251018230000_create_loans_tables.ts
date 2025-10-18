interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create loans table
  await pgm.sql(`
    CREATE TABLE loans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      borrower_id UUID NOT NULL REFERENCES borrowers(id) ON DELETE RESTRICT,
      
      -- Loan Details
      loan_number VARCHAR(50) NOT NULL UNIQUE,
      loan_type VARCHAR(50),
      principal_amount DECIMAL(15,2) NOT NULL,
      interest_rate DECIMAL(5,2) NOT NULL,
      interest_type VARCHAR(20) NOT NULL DEFAULT 'flat',
      
      -- Terms
      term_length INTEGER NOT NULL,
      term_unit VARCHAR(20) NOT NULL,
      payment_frequency VARCHAR(20) NOT NULL,
      
      -- Dates
      application_date DATE NOT NULL,
      approval_date DATE,
      release_date DATE,
      maturity_date DATE,
      
      -- Calculated Fields
      total_interest DECIMAL(15,2) NOT NULL,
      total_payable DECIMAL(15,2) NOT NULL,
      monthly_payment DECIMAL(15,2),
      
      -- Status
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      
      -- Approval
      approved_by UUID REFERENCES users(id),
      rejected_by UUID REFERENCES users(id),
      rejection_reason TEXT,
      
      -- Collateral
      collateral_type VARCHAR(100),
      collateral_description TEXT,
      collateral_value DECIMAL(15,2),
      
      -- Penalties
      penalty_rate DECIMAL(5,2) DEFAULT 0,
      has_penalty BOOLEAN NOT NULL DEFAULT true,
      
      -- Purpose
      loan_purpose VARCHAR(255),
      
      -- Tracking
      amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
      outstanding_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
      last_payment_date DATE,
      next_payment_due DATE,
      
      -- Branch/Collector
      branch_id UUID REFERENCES branches(id),
      assigned_collector UUID REFERENCES users(id),
      
      -- Notes
      notes TEXT,
      
      -- Metadata
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create loan_payment_schedules table
  await pgm.sql(`
    CREATE TABLE loan_payment_schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      
      installment_number INTEGER NOT NULL,
      due_date DATE NOT NULL,
      principal_amount DECIMAL(15,2) NOT NULL,
      interest_amount DECIMAL(15,2) NOT NULL,
      total_amount DECIMAL(15,2) NOT NULL,
      
      amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
      balance DECIMAL(15,2) NOT NULL,
      
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      payment_date DATE,
      
      penalty_amount DECIMAL(15,2) DEFAULT 0,
      days_overdue INTEGER DEFAULT 0
    );
  `);

  // Create loan_approvals table
  await pgm.sql(`
    CREATE TABLE loan_approvals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      
      action VARCHAR(20) NOT NULL,
      approved_by UUID NOT NULL REFERENCES users(id),
      approval_date TIMESTAMP NOT NULL DEFAULT NOW(),
      comments TEXT,
      
      approved_amount DECIMAL(15,2),
      approved_terms TEXT
    );
  `);

  // Create indexes
  await pgm.sql(`
    CREATE INDEX idx_loans_tenant_id ON loans(tenant_id);
    CREATE INDEX idx_loans_borrower_id ON loans(borrower_id);
    CREATE INDEX idx_loans_status ON loans(status);
    CREATE INDEX idx_loans_loan_number ON loans(loan_number);
    CREATE INDEX idx_loans_tenant_status ON loans(tenant_id, status);
    CREATE INDEX idx_loans_collector ON loans(assigned_collector);
    CREATE INDEX idx_loans_next_payment ON loans(next_payment_due);
    
    CREATE INDEX idx_loan_schedules_loan ON loan_payment_schedules(loan_id);
    CREATE INDEX idx_loan_schedules_tenant ON loan_payment_schedules(tenant_id);
    CREATE INDEX idx_loan_schedules_status ON loan_payment_schedules(status);
    CREATE INDEX idx_loan_schedules_due_date ON loan_payment_schedules(due_date);
    
    CREATE INDEX idx_loan_approvals_loan ON loan_approvals(loan_id);
    CREATE INDEX idx_loan_approvals_tenant ON loan_approvals(tenant_id);
  `);

  // Add trigger to update loan balance when payment schedule changes
  await pgm.sql(`
    CREATE OR REPLACE FUNCTION update_loan_balance()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE loans
      SET outstanding_balance = (
        SELECT COALESCE(SUM(balance), 0)
        FROM loan_payment_schedules
        WHERE loan_id = NEW.loan_id
      ),
      updated_at = NOW()
      WHERE id = NEW.loan_id;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER update_loan_balance_trigger
    AFTER INSERT OR UPDATE ON loan_payment_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_loan_balance();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql('DROP TRIGGER IF EXISTS update_loan_balance_trigger ON loan_payment_schedules;');
  await pgm.sql('DROP FUNCTION IF EXISTS update_loan_balance();');
  await pgm.sql('DROP TABLE IF EXISTS loan_approvals CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS loan_payment_schedules CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS loans CASCADE;');
}
