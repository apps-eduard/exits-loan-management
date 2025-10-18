interface MigrationBuilder {interface MigrationBuilder {interface MigrationBuilder {

  sql: (query: string, values?: any[]) => Promise<void>;

}  sql: (query: string, values?: any[]) => Promise<void>;  sql: (query: string, values?: any[]) => Promise<void>;



export const shorthands = undefined;}}



export async function up(pgm: MigrationBuilder): Promise<void> {

  // Create repayments table

  await pgm.sql(`export const shorthands = undefined;export const shorthands = undefined;

    CREATE TABLE repayments (

      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

      loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE RESTRICT,export async function up(pgm: MigrationBuilder): Promise<void> {export async function up(pgm: MigrationBuilder): Promise<void> {

      borrower_id UUID NOT NULL REFERENCES borrowers(id) ON DELETE RESTRICT,

        // Create repayments/payments table  // Create repayments/payments table

      payment_number VARCHAR(50) NOT NULL UNIQUE,

      payment_date DATE NOT NULL,  await pgm.sql(`  pgm.createTable('repayments', {

      payment_amount DECIMAL(15,2) NOT NULL,

          CREATE TABLE repayments (    id: {

      principal_paid DECIMAL(15,2) NOT NULL DEFAULT 0,

      interest_paid DECIMAL(15,2) NOT NULL DEFAULT 0,      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),      type: 'uuid',

      penalty_paid DECIMAL(15,2) NOT NULL DEFAULT 0,

            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,      primaryKey: true,

      payment_method VARCHAR(50) NOT NULL,

      reference_number VARCHAR(100),      loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE RESTRICT,      default: pgm.func('gen_random_uuid()')

      

      receipt_number VARCHAR(100),      borrower_id UUID NOT NULL REFERENCES borrowers(id) ON DELETE RESTRICT,    },

      receipt_url TEXT,

                tenant_id: {

      status VARCHAR(20) NOT NULL DEFAULT 'confirmed',

      notes TEXT,      -- Payment Details      type: 'uuid',

      

      received_by UUID REFERENCES users(id),      payment_number VARCHAR(50) NOT NULL UNIQUE,      notNull: true,

      created_at TIMESTAMP NOT NULL DEFAULT NOW(),

      updated_at TIMESTAMP NOT NULL DEFAULT NOW()      payment_date DATE NOT NULL,      references: 'tenants(id)',

    );

  `);      payment_amount DECIMAL(15,2) NOT NULL,      onDelete: 'CASCADE'



  // Create payment_reminders table          },

  await pgm.sql(`

    CREATE TABLE payment_reminders (      -- Allocation    loan_id: {

      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,      principal_paid DECIMAL(15,2) NOT NULL DEFAULT 0,      type: 'uuid',

      loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,

      borrower_id UUID NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,      interest_paid DECIMAL(15,2) NOT NULL DEFAULT 0,      notNull: true,

      

      reminder_type VARCHAR(20) NOT NULL,      penalty_paid DECIMAL(15,2) NOT NULL DEFAULT 0,      references: 'loans(id)',

      reminder_method VARCHAR(20) NOT NULL,

                  onDelete: 'RESTRICT'

      scheduled_date DATE NOT NULL,

      sent_date TIMESTAMP,      -- Method    },

      

      status VARCHAR(20) NOT NULL DEFAULT 'pending',      payment_method VARCHAR(50) NOT NULL,    borrower_id: {

      message_content TEXT,

            reference_number VARCHAR(100),      type: 'uuid',

      created_at TIMESTAMP NOT NULL DEFAULT NOW()

    );            notNull: true,

  `);

      -- Receipt      references: 'borrowers(id)',

  // Create indexes

  await pgm.sql(`      receipt_number VARCHAR(100),      onDelete: 'RESTRICT'

    CREATE INDEX idx_repayments_tenant ON repayments(tenant_id);

    CREATE INDEX idx_repayments_loan ON repayments(loan_id);      receipt_url TEXT,    },

    CREATE INDEX idx_repayments_borrower ON repayments(borrower_id);

    CREATE INDEX idx_repayments_date ON repayments(payment_date);          

    CREATE INDEX idx_repayments_number ON repayments(payment_number);

    CREATE INDEX idx_repayments_tenant_date ON repayments(tenant_id, payment_date);      -- Status    // Payment Details

    

    CREATE INDEX idx_payment_reminders_tenant ON payment_reminders(tenant_id);      status VARCHAR(20) NOT NULL DEFAULT 'confirmed',    payment_number: { type: 'varchar(50)', notNull: true, unique: true },

    CREATE INDEX idx_payment_reminders_loan ON payment_reminders(loan_id);

    CREATE INDEX idx_payment_reminders_status ON payment_reminders(status);          payment_date: { type: 'date', notNull: true },

    CREATE INDEX idx_payment_reminders_scheduled ON payment_reminders(scheduled_date);

  `);      -- Notes    payment_amount: { type: 'decimal(15,2)', notNull: true },



  // Add trigger to process repayment      notes TEXT,    

  await pgm.sql(`

    CREATE OR REPLACE FUNCTION process_repayment()          // Allocation

    RETURNS TRIGGER AS $$

    BEGIN      -- Metadata    principal_paid: { type: 'decimal(15,2)', notNull: true, default: 0 },

      UPDATE loans

      SET       received_by UUID REFERENCES users(id),    interest_paid: { type: 'decimal(15,2)', notNull: true, default: 0 },

        amount_paid = amount_paid + NEW.payment_amount,

        last_payment_date = NEW.payment_date,      created_at TIMESTAMP NOT NULL DEFAULT NOW(),    penalty_paid: { type: 'decimal(15,2)', notNull: true, default: 0 },

        updated_at = NOW(),

        status = CASE       updated_at TIMESTAMP NOT NULL DEFAULT NOW()    

          WHEN (amount_paid + NEW.payment_amount) >= total_payable THEN 'paid'

          ELSE 'active'    );    // Method

        END

      WHERE id = NEW.loan_id;  `);    payment_method: { type: 'varchar(50)', notNull: true },

      

      UPDATE borrowers    reference_number: { type: 'varchar(100)' },

      SET 

        total_paid = total_paid + NEW.payment_amount,  // Create payment_reminders table    

        outstanding_balance = outstanding_balance - NEW.payment_amount,

        updated_at = NOW()  await pgm.sql(`    // Receipt

      WHERE id = NEW.borrower_id;

          CREATE TABLE payment_reminders (    receipt_number: { type: 'varchar(100)' },

      RETURN NEW;

    END;      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),    receipt_url: { type: 'text' },

    $$ LANGUAGE plpgsql;

          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,    

    CREATE TRIGGER process_repayment_trigger

    AFTER INSERT ON repayments      loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,    // Status

    FOR EACH ROW

    EXECUTE FUNCTION process_repayment();      borrower_id UUID NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,    status: { type: 'varchar(20)', notNull: true, default: "'confirmed'" },

  `);

}          



export async function down(pgm: MigrationBuilder): Promise<void> {      reminder_type VARCHAR(20) NOT NULL,    // Notes

  await pgm.sql('DROP TRIGGER IF EXISTS process_repayment_trigger ON repayments;');

  await pgm.sql('DROP FUNCTION IF EXISTS process_repayment();');      reminder_method VARCHAR(20) NOT NULL,    notes: { type: 'text' },

  await pgm.sql('DROP TABLE IF EXISTS payment_reminders CASCADE;');

  await pgm.sql('DROP TABLE IF EXISTS repayments CASCADE;');          

}

      scheduled_date DATE NOT NULL,    // Metadata

      sent_date TIMESTAMP,    received_by: { type: 'uuid', references: 'users(id)' },

          created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },

      status VARCHAR(20) NOT NULL DEFAULT 'pending',    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') }

      message_content TEXT,  });

      

      created_at TIMESTAMP NOT NULL DEFAULT NOW()  // Create payment_reminders table

    );  pgm.createTable('payment_reminders', {

  `);    id: {

      type: 'uuid',

  // Create indexes      primaryKey: true,

  await pgm.sql(`      default: pgm.func('gen_random_uuid()')

    CREATE INDEX idx_repayments_tenant ON repayments(tenant_id);    },

    CREATE INDEX idx_repayments_loan ON repayments(loan_id);    tenant_id: {

    CREATE INDEX idx_repayments_borrower ON repayments(borrower_id);      type: 'uuid',

    CREATE INDEX idx_repayments_date ON repayments(payment_date);      notNull: true,

    CREATE INDEX idx_repayments_number ON repayments(payment_number);      references: 'tenants(id)',

    CREATE INDEX idx_repayments_tenant_date ON repayments(tenant_id, payment_date);      onDelete: 'CASCADE'

        },

    CREATE INDEX idx_payment_reminders_tenant ON payment_reminders(tenant_id);    loan_id: {

    CREATE INDEX idx_payment_reminders_loan ON payment_reminders(loan_id);      type: 'uuid',

    CREATE INDEX idx_payment_reminders_status ON payment_reminders(status);      notNull: true,

    CREATE INDEX idx_payment_reminders_scheduled ON payment_reminders(scheduled_date);      references: 'loans(id)',

  `);      onDelete: 'CASCADE'

    },

  // Add trigger to update loan and borrower when payment is made    borrower_id: {

  await pgm.sql(`      type: 'uuid',

    CREATE OR REPLACE FUNCTION process_repayment()      notNull: true,

    RETURNS TRIGGER AS $$      references: 'borrowers(id)',

    BEGIN      onDelete: 'CASCADE'

      -- Update loan    },

      UPDATE loans    

      SET     reminder_type: { type: 'varchar(20)', notNull: true },

        amount_paid = amount_paid + NEW.payment_amount,    reminder_method: { type: 'varchar(20)', notNull: true },

        last_payment_date = NEW.payment_date,    

        updated_at = NOW(),    scheduled_date: { type: 'date', notNull: true },

        status = CASE     sent_date: { type: 'timestamp' },

          WHEN (amount_paid + NEW.payment_amount) >= total_payable THEN 'paid'    

          ELSE 'active'    status: { type: 'varchar(20)', notNull: true, default: "'pending'" },

        END    message_content: { type: 'text' },

      WHERE id = NEW.loan_id;    

          created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') }

      -- Update borrower  });

      UPDATE borrowers

      SET   // Create indexes

        total_paid = total_paid + NEW.payment_amount,  pgm.createIndex('repayments', 'tenant_id');

        outstanding_balance = outstanding_balance - NEW.payment_amount,  pgm.createIndex('repayments', 'loan_id');

        updated_at = NOW()  pgm.createIndex('repayments', 'borrower_id');

      WHERE id = NEW.borrower_id;  pgm.createIndex('repayments', 'payment_date');

        pgm.createIndex('repayments', 'payment_number');

      -- Update payment schedule  pgm.createIndex('repayments', ['tenant_id', 'payment_date']);

      UPDATE loan_payment_schedules  

      SET   pgm.createIndex('payment_reminders', 'tenant_id');

        amount_paid = amount_paid + NEW.principal_paid + NEW.interest_paid,  pgm.createIndex('payment_reminders', 'loan_id');

        balance = balance - (NEW.principal_paid + NEW.interest_paid),  pgm.createIndex('payment_reminders', 'status');

        status = CASE   pgm.createIndex('payment_reminders', 'scheduled_date');

          WHEN balance - (NEW.principal_paid + NEW.interest_paid) <= 0 THEN 'paid'

          WHEN amount_paid > 0 THEN 'partial'  // Add trigger to update loan and borrower when payment is made

          ELSE status  pgm.createFunction(

        END,    'process_repayment',

        payment_date = CASE     [],

          WHEN balance - (NEW.principal_paid + NEW.interest_paid) <= 0 THEN NEW.payment_date    {

          ELSE payment_date      returns: 'trigger',

        END      language: 'plpgsql',

      WHERE loan_id = NEW.loan_id      replace: true

        AND status != 'paid'    },

      ORDER BY installment_number ASC    `

      LIMIT 1;    BEGIN

            -- Update loan

      RETURN NEW;      UPDATE loans

    END;      SET 

    $$ LANGUAGE plpgsql;        amount_paid = amount_paid + NEW.payment_amount,

            last_payment_date = NEW.payment_date,

    CREATE TRIGGER process_repayment_trigger        updated_at = NOW(),

    AFTER INSERT ON repayments        status = CASE 

    FOR EACH ROW          WHEN (amount_paid + NEW.payment_amount) >= total_payable THEN 'paid'

    EXECUTE FUNCTION process_repayment();          ELSE 'active'

  `);        END

}      WHERE id = NEW.loan_id;

      

export async function down(pgm: MigrationBuilder): Promise<void> {      -- Update borrower

  await pgm.sql('DROP TRIGGER IF EXISTS process_repayment_trigger ON repayments;');      UPDATE borrowers

  await pgm.sql('DROP FUNCTION IF EXISTS process_repayment();');      SET 

  await pgm.sql('DROP TABLE IF EXISTS payment_reminders CASCADE;');        total_paid = total_paid + NEW.payment_amount,

  await pgm.sql('DROP TABLE IF EXISTS repayments CASCADE;');        outstanding_balance = outstanding_balance - NEW.payment_amount,

}        updated_at = NOW()

      WHERE id = NEW.borrower_id;
      
      -- Update payment schedule
      UPDATE loan_payment_schedules
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
      WHERE loan_id = NEW.loan_id
        AND status != 'paid'
      ORDER BY installment_number ASC
      LIMIT 1;
      
      RETURN NEW;
    END;
    `
  );

  pgm.createTrigger('repayments', 'process_repayment_trigger', {
    when: 'AFTER',
    operation: 'INSERT',
    function: 'process_repayment',
    level: 'ROW'
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTrigger('repayments', 'process_repayment_trigger', { ifExists: true });
  pgm.dropFunction('process_repayment', [], { ifExists: true });
  
  pgm.dropTable('payment_reminders', { ifExists: true, cascade: true });
  pgm.dropTable('repayments', { ifExists: true, cascade: true });
}
