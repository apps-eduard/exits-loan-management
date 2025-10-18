interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Add slug column to tenants table
  await pgm.sql(`
    ALTER TABLE "tenants"
    ADD COLUMN "slug" text UNIQUE;
  `);

  // Populate slug from tenant_code for existing records
  await pgm.sql(`
    UPDATE "tenants"
    SET "slug" = LOWER(REGEXP_REPLACE(company_name, '[^a-zA-Z0-9]+', '-', 'g'))
    WHERE "slug" IS NULL;
  `);

  // Make slug NOT NULL after populating
  await pgm.sql(`
    ALTER TABLE "tenants"
    ALTER COLUMN "slug" SET NOT NULL;
  `);

  // Add index for faster lookups
  await pgm.sql(`
    CREATE INDEX "tenants_slug_index" ON "tenants" ("slug");
  `);

  // Add status column (if not exists) to match the service expectations
  await pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'status'
      ) THEN
        ALTER TABLE "tenants"
        ADD COLUMN "status" text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'trial'));
      END IF;
    END $$;
  `);

  // Update existing records to have 'active' status
  await pgm.sql(`
    UPDATE "tenants"
    SET "status" = CASE 
      WHEN is_active = true THEN 'active'
      ELSE 'suspended'
    END
    WHERE "status" IS NULL;
  `);

  // Add secondary_color column for branding
  await pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'secondary_color'
      ) THEN
        ALTER TABLE "tenants"
        ADD COLUMN "secondary_color" text;
      END IF;
    END $$;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Remove indexes
  await pgm.sql(`DROP INDEX IF EXISTS "tenants_slug_index";`);

  // Remove columns
  await pgm.sql(`ALTER TABLE "tenants" DROP COLUMN IF EXISTS "slug";`);
  await pgm.sql(`ALTER TABLE "tenants" DROP COLUMN IF EXISTS "status";`);
  await pgm.sql(`ALTER TABLE "tenants" DROP COLUMN IF EXISTS "secondary_color";`);
}
