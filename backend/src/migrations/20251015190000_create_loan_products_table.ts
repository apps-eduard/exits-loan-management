interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create loan product types enum
  await pgm.sql(`
    CREATE TYPE "loan_product_type" AS ENUM (
      'cash_loan',
      'mobile_phone',
      'vehicle',
      'appliance',
      'motorcycle',
      'bicycle'
    );
  `);

  // Create payment frequency enum
  await pgm.sql(`
    CREATE TYPE "payment_frequency" AS ENUM (
      'daily',
      'weekly',
      'bi_weekly',
      'semi_monthly',
      'monthly'
    );
  `);

  // Create loan products table
  await pgm.sql(`
    CREATE TABLE "loan_products" (
      "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      "code" text NOT NULL UNIQUE,
      "name" text NOT NULL,
      "description" text,
      "product_type" loan_product_type NOT NULL,
      
      -- Amount limits
      "min_amount" numeric(15, 2) NOT NULL,
      "max_amount" numeric(15, 2) NOT NULL,
      "default_amount" numeric(15, 2),
      
      -- Interest configuration
      "interest_rate" numeric(5, 4) NOT NULL,
      "interest_type" text CHECK (interest_type IN ('flat', 'diminishing', 'add_on')) DEFAULT 'flat' NOT NULL,
      
      -- Term configuration
      "min_term_count" integer NOT NULL,
      "max_term_count" integer NOT NULL,
      "default_term_count" integer,
      "payment_frequency" payment_frequency NOT NULL,
      
      -- Fees
      "processing_fee_rate" numeric(5, 4) DEFAULT 0,
      "processing_fee_min" numeric(15, 2) DEFAULT 0,
      "processing_fee_max" numeric(15, 2),
      "documentary_stamp_rate" numeric(5, 4) DEFAULT 0,
      "insurance_rate" numeric(5, 4) DEFAULT 0,
      "penalty_rate_per_day" numeric(5, 4) DEFAULT 0,
      "grace_period_days" integer DEFAULT 0,
      
      -- Requirements
      "requires_collateral" boolean DEFAULT false NOT NULL,
      "requires_comaker" boolean DEFAULT false NOT NULL,
      "min_comakers" integer DEFAULT 0,
      
      -- Status
      "is_active" boolean DEFAULT true NOT NULL,
      "is_visible" boolean DEFAULT true NOT NULL,
      
      -- Metadata
      "created_by" uuid NOT NULL REFERENCES "users",
      "updated_by" uuid REFERENCES "users",
      "created_at" timestamptz DEFAULT now() NOT NULL,
      "updated_at" timestamptz DEFAULT now() NOT NULL
    );
  `);

  await pgm.sql(`
    CREATE INDEX "loan_products_product_type_index" ON "loan_products" ("product_type");
    CREATE INDEX "loan_products_is_active_index" ON "loan_products" ("is_active");
    CREATE INDEX "loan_products_payment_frequency_index" ON "loan_products" ("payment_frequency");
  `);

  // Seed some default loan products
  await pgm.sql(`
    INSERT INTO loan_products (
      code, name, description, product_type,
      min_amount, max_amount, default_amount,
      interest_rate, interest_type,
      min_term_count, max_term_count, default_term_count, payment_frequency,
      processing_fee_rate, penalty_rate_per_day, grace_period_days,
      requires_collateral, requires_comaker,
      created_by
    ) VALUES
    (
      'CASH-DAILY',
      'Daily Cash Loan',
      'Short-term cash loan with daily payment',
      'cash_loan',
      1000, 50000, 5000,
      0.05, 'flat',
      30, 90, 60, 'daily',
      0.02, 0.001, 3,
      false, true,
      'd0000000-0000-0000-0000-000000000001'
    ),
    (
      'CASH-WEEKLY',
      'Weekly Cash Loan',
      'Cash loan with weekly payment',
      'cash_loan',
      5000, 100000, 20000,
      0.04, 'flat',
      4, 52, 12, 'weekly',
      0.02, 0.001, 7,
      false, true,
      'd0000000-0000-0000-0000-000000000001'
    ),
    (
      'CASH-MONTHLY',
      'Monthly Cash Loan',
      'Standard monthly payment loan',
      'cash_loan',
      10000, 500000, 50000,
      0.03, 'diminishing',
      3, 36, 12, 'monthly',
      0.02, 0.001, 7,
      false, true,
      'd0000000-0000-0000-0000-000000000001'
    ),
    (
      'MOBILE-MONTHLY',
      'Mobile Phone Loan',
      'Installment for mobile phones',
      'mobile_phone',
      5000, 50000, 15000,
      0.02, 'add_on',
      6, 24, 12, 'monthly',
      0.01, 0.002, 3,
      true, false,
      'd0000000-0000-0000-0000-000000000001'
    ),
    (
      'MOTORCYCLE-MONTHLY',
      'Motorcycle Loan',
      'Motorcycle financing',
      'motorcycle',
      30000, 150000, 60000,
      0.025, 'diminishing',
      12, 36, 24, 'monthly',
      0.015, 0.001, 7,
      true, false,
      'd0000000-0000-0000-0000-000000000001'
    );
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql(`DROP TABLE IF EXISTS "loan_products";`);
  await pgm.sql(`DROP TYPE IF EXISTS "payment_frequency";`);
  await pgm.sql(`DROP TYPE IF EXISTS "loan_product_type";`);
}
