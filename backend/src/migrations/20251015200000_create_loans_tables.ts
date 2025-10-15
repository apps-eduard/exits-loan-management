interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create loan status enum
  await pgm.sql(`
    CREATE TYPE "loan_status" AS ENUM (
      'draft',
      'pending',
      'under_review',
      'approved',
      'rejected',
      'disbursed',
      'active',
      'completed',
      'written_off',
      'cancelled'
    );
  `);

  // Create loans table
  await pgm.sql(`
    CREATE TABLE "loans" (
      "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      "organizational_unit_id" uuid NOT NULL REFERENCES "organizational_units" ON DELETE RESTRICT,
      "customer_id" uuid NOT NULL REFERENCES "customers" ON DELETE RESTRICT,
      "loan_product_id" uuid NOT NULL REFERENCES "loan_products" ON DELETE RESTRICT,
      "loan_number" text NOT NULL UNIQUE,
      
      -- Loan Details
      "principal_amount" numeric(15, 2) NOT NULL,
      "interest_rate" numeric(5, 4) NOT NULL,
      "interest_type" text NOT NULL CHECK (interest_type IN ('flat', 'diminishing', 'add_on')),
      "term_count" integer NOT NULL,
      "payment_frequency" payment_frequency NOT NULL,
      
      -- Calculated Amounts
      "total_interest" numeric(15, 2) NOT NULL,
      "total_fees" numeric(15, 2) DEFAULT 0 NOT NULL,
      "total_amount" numeric(15, 2) NOT NULL,
      "payment_amount" numeric(15, 2) NOT NULL,
      
      -- Fees Breakdown
      "processing_fee" numeric(15, 2) DEFAULT 0,
      "documentary_stamp" numeric(15, 2) DEFAULT 0,
      "insurance_fee" numeric(15, 2) DEFAULT 0,
      
      -- Application Details
      "purpose" text,
      "notes" text,
      
      -- Workflow
      "status" loan_status DEFAULT 'draft' NOT NULL,
      "applied_at" timestamptz,
      "reviewed_at" timestamptz,
      "reviewed_by" uuid REFERENCES "users",
      "review_notes" text,
      "approved_at" timestamptz,
      "approved_by" uuid REFERENCES "users",
      "approval_notes" text,
      "rejected_at" timestamptz,
      "rejected_by" uuid REFERENCES "users",
      "rejection_reason" text,
      "disbursed_at" timestamptz,
      "disbursed_by" uuid REFERENCES "users",
      "disbursement_method" text CHECK (disbursement_method IN ('cash', 'bank_transfer', 'check', 'online')),
      "disbursement_reference" text,
      
      -- Tracking
      "balance_principal" numeric(15, 2) NOT NULL,
      "balance_interest" numeric(15, 2) NOT NULL,
      "balance_fees" numeric(15, 2) NOT NULL,
      "balance_penalties" numeric(15, 2) DEFAULT 0 NOT NULL,
      "total_paid" numeric(15, 2) DEFAULT 0 NOT NULL,
      "next_due_date" date,
      "last_payment_date" date,
      "days_overdue" integer DEFAULT 0,
      
      -- Metadata
      "created_by" uuid NOT NULL REFERENCES "users",
      "updated_by" uuid REFERENCES "users",
      "created_at" timestamptz DEFAULT now() NOT NULL,
      "updated_at" timestamptz DEFAULT now() NOT NULL
    );
  `);

  await pgm.sql(`
    CREATE INDEX "loans_organizational_unit_id_index" ON "loans" ("organizational_unit_id");
    CREATE INDEX "loans_customer_id_index" ON "loans" ("customer_id");
    CREATE INDEX "loans_loan_product_id_index" ON "loans" ("loan_product_id");
    CREATE INDEX "loans_status_index" ON "loans" ("status");
    CREATE INDEX "loans_next_due_date_index" ON "loans" ("next_due_date");
    CREATE INDEX "loans_created_at_index" ON "loans" ("created_at");
  `);

  // Create payment schedules table
  await pgm.sql(`
    CREATE TABLE "payment_schedules" (
      "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      "loan_id" uuid NOT NULL REFERENCES "loans" ON DELETE CASCADE,
      "installment_number" integer NOT NULL,
      "due_date" date NOT NULL,
      
      -- Amount breakdown
      "principal_due" numeric(15, 2) NOT NULL,
      "interest_due" numeric(15, 2) NOT NULL,
      "fees_due" numeric(15, 2) DEFAULT 0 NOT NULL,
      "total_due" numeric(15, 2) NOT NULL,
      
      -- Payment tracking
      "principal_paid" numeric(15, 2) DEFAULT 0 NOT NULL,
      "interest_paid" numeric(15, 2) DEFAULT 0 NOT NULL,
      "fees_paid" numeric(15, 2) DEFAULT 0 NOT NULL,
      "penalties_paid" numeric(15, 2) DEFAULT 0 NOT NULL,
      "total_paid" numeric(15, 2) DEFAULT 0 NOT NULL,
      
      -- Balance
      "balance_principal" numeric(15, 2) NOT NULL,
      "balance_interest" numeric(15, 2) NOT NULL,
      "balance_fees" numeric(15, 2) NOT NULL,
      "balance_penalties" numeric(15, 2) DEFAULT 0 NOT NULL,
      
      -- Status
      "status" text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
      "paid_at" timestamptz,
      "days_overdue" integer DEFAULT 0,
      
      "created_at" timestamptz DEFAULT now() NOT NULL,
      "updated_at" timestamptz DEFAULT now() NOT NULL
    );
  `);

  await pgm.sql(`
    CREATE INDEX "payment_schedules_loan_id_index" ON "payment_schedules" ("loan_id");
    CREATE INDEX "payment_schedules_due_date_index" ON "payment_schedules" ("due_date");
    CREATE INDEX "payment_schedules_status_index" ON "payment_schedules" ("status");
    CREATE UNIQUE INDEX "payment_schedules_loan_installment_unique" ON "payment_schedules" ("loan_id", "installment_number");
  `);

  // Create collaterals table
  await pgm.sql(`
    CREATE TABLE "collaterals" (
      "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      "loan_id" uuid NOT NULL REFERENCES "loans" ON DELETE CASCADE,
      "collateral_type" text NOT NULL CHECK (collateral_type IN (
        'vehicle',
        'motorcycle',
        'real_estate',
        'jewelry',
        'appliance',
        'electronics',
        'other'
      )),
      "description" text NOT NULL,
      "estimated_value" numeric(15, 2) NOT NULL,
      "make_model" text,
      "serial_number" text,
      "registration_number" text,
      "location" text,
      "condition" text CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
      "photos" text[],
      "notes" text,
      "created_at" timestamptz DEFAULT now() NOT NULL
    );
  `);

  await pgm.sql(`
    CREATE INDEX "collaterals_loan_id_index" ON "collaterals" ("loan_id");
  `);

  // Create comakers table
  await pgm.sql(`
    CREATE TABLE "comakers" (
      "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      "loan_id" uuid NOT NULL REFERENCES "loans" ON DELETE CASCADE,
      "first_name" text NOT NULL,
      "middle_name" text,
      "last_name" text NOT NULL,
      "relationship_to_borrower" text NOT NULL,
      "mobile_phone" text NOT NULL,
      "email" text,
      "address" text NOT NULL,
      "employer_name" text,
      "occupation" text,
      "monthly_income" numeric(15, 2),
      "valid_id_type" text,
      "valid_id_number" text,
      "notes" text,
      "created_at" timestamptz DEFAULT now() NOT NULL
    );
  `);

  await pgm.sql(`
    CREATE INDEX "comakers_loan_id_index" ON "comakers" ("loan_id");
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql(`DROP TABLE IF EXISTS "comakers";`);
  await pgm.sql(`DROP TABLE IF EXISTS "collaterals";`);
  await pgm.sql(`DROP TABLE IF EXISTS "payment_schedules";`);
  await pgm.sql(`DROP TABLE IF EXISTS "loans";`);
  await pgm.sql(`DROP TYPE IF EXISTS "loan_status";`);
}
