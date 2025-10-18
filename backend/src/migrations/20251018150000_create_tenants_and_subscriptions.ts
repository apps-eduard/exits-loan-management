interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create subscription plan enum
  await pgm.sql(`
    CREATE TYPE "subscription_plan" AS ENUM (
      'free',
      'basic',
      'professional',
      'enterprise',
      'custom'
    );
  `);

  // Create subscription status enum
  await pgm.sql(`
    CREATE TYPE "subscription_status" AS ENUM (
      'trial',
      'active',
      'past_due',
      'cancelled',
      'suspended',
      'expired'
    );
  `);

  // Create tenants table (replaces organizational_units as the top-level entity)
  await pgm.sql(`
    CREATE TABLE "tenants" (
      "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      "tenant_code" text NOT NULL UNIQUE,
      "company_name" text NOT NULL,
      "company_registration" text,
      "tax_id" text,
      
      -- Contact Information
      "contact_person" text NOT NULL,
      "contact_email" text NOT NULL,
      "contact_phone" text NOT NULL,
      
      -- Address
      "address_line1" text NOT NULL,
      "address_line2" text,
      "city" text NOT NULL,
      "province" text NOT NULL,
      "postal_code" text,
      "country" text DEFAULT 'Philippines' NOT NULL,
      
      -- Branding
      "logo_url" text,
      "primary_color" text,
      "website" text,
      
      -- Settings
      "timezone" text DEFAULT 'Asia/Manila',
      "currency" text DEFAULT 'PHP',
      "locale" text DEFAULT 'en-PH',
      
      -- Status
      "is_active" boolean DEFAULT true NOT NULL,
      "activated_at" timestamptz,
      "deactivated_at" timestamptz,
      
      -- Metadata
      "created_at" timestamptz DEFAULT now() NOT NULL,
      "updated_at" timestamptz DEFAULT now() NOT NULL
    );
  `);

  // Create subscriptions table
  await pgm.sql(`
    CREATE TABLE "subscriptions" (
      "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      "tenant_id" uuid NOT NULL REFERENCES "tenants" ON DELETE CASCADE,
      
      -- Plan Details
      "plan" subscription_plan NOT NULL,
      "status" subscription_status NOT NULL,
      
      -- Limits (based on plan)
      "max_users" integer,
      "max_customers" integer,
      "max_loans" integer,
      "max_branches" integer,
      "max_storage_gb" numeric(10, 2),
      
      -- Features (JSON array of enabled features)
      "enabled_features" jsonb DEFAULT '[]',
      
      -- Billing
      "billing_cycle" text CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
      "amount" numeric(15, 2),
      "currency" text DEFAULT 'PHP',
      
      -- Trial
      "trial_ends_at" timestamptz,
      "trial_used" boolean DEFAULT false,
      
      -- Subscription Period
      "starts_at" timestamptz NOT NULL,
      "ends_at" timestamptz,
      "cancelled_at" timestamptz,
      "suspended_at" timestamptz,
      
      -- Payment
      "last_payment_at" timestamptz,
      "next_billing_date" timestamptz,
      "payment_method" text,
      
      -- Metadata
      "notes" text,
      "created_at" timestamptz DEFAULT now() NOT NULL,
      "updated_at" timestamptz DEFAULT now() NOT NULL
    );
  `);

  // Create subscription history table (for tracking plan changes)
  await pgm.sql(`
    CREATE TABLE "subscription_history" (
      "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      "subscription_id" uuid NOT NULL REFERENCES "subscriptions" ON DELETE CASCADE,
      "tenant_id" uuid NOT NULL REFERENCES "tenants" ON DELETE CASCADE,
      
      "event_type" text NOT NULL CHECK (event_type IN (
        'created', 'upgraded', 'downgraded', 'renewed', 
        'cancelled', 'suspended', 'reactivated', 'expired'
      )),
      
      "old_plan" subscription_plan,
      "new_plan" subscription_plan,
      "old_status" subscription_status,
      "new_status" subscription_status,
      
      "amount" numeric(15, 2),
      "notes" text,
      "performed_by" uuid REFERENCES "users",
      "created_at" timestamptz DEFAULT now() NOT NULL
    );
  `);

  // Create tenant_settings table (for customizable settings per tenant)
  await pgm.sql(`
    CREATE TABLE "tenant_settings" (
      "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      "tenant_id" uuid NOT NULL REFERENCES "tenants" ON DELETE CASCADE,
      
      "setting_key" text NOT NULL,
      "setting_value" jsonb NOT NULL,
      "setting_type" text CHECK (setting_type IN ('string', 'number', 'boolean', 'object', 'array')),
      
      "created_at" timestamptz DEFAULT now() NOT NULL,
      "updated_at" timestamptz DEFAULT now() NOT NULL,
      
      UNIQUE ("tenant_id", "setting_key")
    );
  `);

  // Add tenant_id to organizational_units (branches belong to tenants)
  await pgm.sql(`
    ALTER TABLE "organizational_units" 
    ADD COLUMN "tenant_id" uuid REFERENCES "tenants" ON DELETE CASCADE;
  `);

  // Add tenant_id to users
  await pgm.sql(`
    ALTER TABLE "users" 
    ADD COLUMN "tenant_id" uuid REFERENCES "tenants" ON DELETE CASCADE;
  `);

  // Add tenant_id to customers
  await pgm.sql(`
    ALTER TABLE "customers" 
    ADD COLUMN "tenant_id" uuid REFERENCES "tenants" ON DELETE CASCADE;
  `);

  // Add tenant_id to loan_products
  await pgm.sql(`
    ALTER TABLE "loan_products" 
    ADD COLUMN "tenant_id" uuid REFERENCES "tenants" ON DELETE CASCADE;
  `);

  // Add tenant_id to loans
  await pgm.sql(`
    ALTER TABLE "loans" 
    ADD COLUMN "tenant_id" uuid REFERENCES "tenants" ON DELETE CASCADE;
  `);

  // Note: payments table will be created later, tenant_id will be added in a subsequent migration

  // Create indexes
  await pgm.sql(`
    CREATE INDEX "tenants_company_name_index" ON "tenants" ("company_name");
    CREATE INDEX "tenants_is_active_index" ON "tenants" ("is_active");
    CREATE INDEX "tenants_created_at_index" ON "tenants" ("created_at");
    
    CREATE INDEX "subscriptions_tenant_id_index" ON "subscriptions" ("tenant_id");
    CREATE INDEX "subscriptions_status_index" ON "subscriptions" ("status");
    CREATE INDEX "subscriptions_plan_index" ON "subscriptions" ("plan");
    CREATE INDEX "subscriptions_ends_at_index" ON "subscriptions" ("ends_at");
    
    CREATE INDEX "subscription_history_tenant_id_index" ON "subscription_history" ("tenant_id");
    CREATE INDEX "subscription_history_subscription_id_index" ON "subscription_history" ("subscription_id");
    
    CREATE INDEX "organizational_units_tenant_id_index" ON "organizational_units" ("tenant_id");
    CREATE INDEX "users_tenant_id_index" ON "users" ("tenant_id");
    CREATE INDEX "customers_tenant_id_index" ON "customers" ("tenant_id");
    CREATE INDEX "loan_products_tenant_id_index" ON "loan_products" ("tenant_id");
    CREATE INDEX "loans_tenant_id_index" ON "loans" ("tenant_id");
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Remove tenant_id columns
  await pgm.sql(`ALTER TABLE "loans" DROP COLUMN IF EXISTS "tenant_id";`);
  await pgm.sql(`ALTER TABLE "loan_products" DROP COLUMN IF EXISTS "tenant_id";`);
  await pgm.sql(`ALTER TABLE "customers" DROP COLUMN IF EXISTS "tenant_id";`);
  await pgm.sql(`ALTER TABLE "users" DROP COLUMN IF EXISTS "tenant_id";`);
  await pgm.sql(`ALTER TABLE "organizational_units" DROP COLUMN IF EXISTS "tenant_id";`);

  // Drop tables
  await pgm.sql(`DROP TABLE IF EXISTS "tenant_settings";`);
  await pgm.sql(`DROP TABLE IF EXISTS "subscription_history";`);
  await pgm.sql(`DROP TABLE IF EXISTS "subscriptions";`);
  await pgm.sql(`DROP TABLE IF EXISTS "tenants";`);

  // Drop enums
  await pgm.sql(`DROP TYPE IF EXISTS "subscription_status";`);
  await pgm.sql(`DROP TYPE IF EXISTS "subscription_plan";`);
}
