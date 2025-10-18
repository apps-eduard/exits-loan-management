interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create default tenant (ExITS Finance - Demo/System Tenant)
  const defaultTenantId = '00000000-0000-0000-0000-000000000001';
  
  await pgm.sql(`
    INSERT INTO "tenants" (
      "id",
      "tenant_code",
      "company_name",
      "contact_person",
      "contact_email",
      "contact_phone",
      "address_line1",
      "city",
      "province",
      "country",
      "is_active",
      "activated_at",
      "created_at",
      "updated_at"
    ) VALUES (
      '${defaultTenantId}',
      'EXITS-SYSTEM',
      'ExITS Finance System',
      'System Administrator',
      'admin@exits.com',
      '+63 2 8888 8888',
      '123 Main Street',
      'Manila',
      'Metro Manila',
      'Philippines',
      true,
      now(),
      now(),
      now()
    );
  `);

  // Create default subscription for system tenant (Enterprise - Lifetime)
  await pgm.sql(`
    INSERT INTO "subscriptions" (
      "tenant_id",
      "plan",
      "status",
      "max_users",
      "max_customers",
      "max_loans",
      "max_branches",
      "max_storage_gb",
      "enabled_features",
      "billing_cycle",
      "amount",
      "currency",
      "starts_at",
      "created_at",
      "updated_at"
    ) VALUES (
      '${defaultTenantId}',
      'enterprise',
      'active',
      999999,
      999999,
      999999,
      999999,
      999999.99,
      '["all_features", "api_access", "custom_reports", "white_label", "priority_support"]',
      'lifetime',
      0.00,
      'PHP',
      now(),
      now(),
      now()
    );
  `);

  // Update existing organizational units to belong to default tenant
  await pgm.sql(`
    UPDATE "organizational_units" 
    SET "tenant_id" = '${defaultTenantId}'
    WHERE "tenant_id" IS NULL;
  `);

  // Update existing users to belong to default tenant
  await pgm.sql(`
    UPDATE "users" 
    SET "tenant_id" = '${defaultTenantId}'
    WHERE "tenant_id" IS NULL;
  `);

  // Update existing customers to belong to default tenant
  await pgm.sql(`
    UPDATE "customers" 
    SET "tenant_id" = '${defaultTenantId}'
    WHERE "tenant_id" IS NULL;
  `);

  // Update existing loan products to belong to default tenant
  await pgm.sql(`
    UPDATE "loan_products" 
    SET "tenant_id" = '${defaultTenantId}'
    WHERE "tenant_id" IS NULL;
  `);

  // Update existing loans to belong to default tenant
  await pgm.sql(`
    UPDATE "loans" 
    SET "tenant_id" = '${defaultTenantId}'
    WHERE "tenant_id" IS NULL;
  `);

  // Note: payments table will be created later, tenant_id will be added then

  // Now make tenant_id NOT NULL on all existing tables
  await pgm.sql(`
    ALTER TABLE "organizational_units" ALTER COLUMN "tenant_id" SET NOT NULL;
    ALTER TABLE "users" ALTER COLUMN "tenant_id" SET NOT NULL;
    ALTER TABLE "customers" ALTER COLUMN "tenant_id" SET NOT NULL;
    ALTER TABLE "loan_products" ALTER COLUMN "tenant_id" SET NOT NULL;
    ALTER TABLE "loans" ALTER COLUMN "tenant_id" SET NOT NULL;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Make tenant_id nullable again
  await pgm.sql(`
    ALTER TABLE "payments" ALTER COLUMN "tenant_id" DROP NOT NULL;
    ALTER TABLE "loans" ALTER COLUMN "tenant_id" DROP NOT NULL;
    ALTER TABLE "loan_products" ALTER COLUMN "tenant_id" DROP NOT NULL;
    ALTER TABLE "customers" ALTER COLUMN "tenant_id" DROP NOT NULL;
    ALTER TABLE "users" ALTER COLUMN "tenant_id" DROP NOT NULL;
    ALTER TABLE "organizational_units" ALTER COLUMN "tenant_id" DROP NOT NULL;
  `);

  // Delete subscription history
  await pgm.sql(`DELETE FROM "subscription_history" WHERE "tenant_id" = 't0000000-0000-0000-0000-000000000001';`);
  
  // Delete subscription
  await pgm.sql(`DELETE FROM "subscriptions" WHERE "tenant_id" = 't0000000-0000-0000-0000-000000000001';`);
  
  // Delete tenant
  await pgm.sql(`DELETE FROM "tenants" WHERE "id" = 't0000000-0000-0000-0000-000000000001';`);
}
