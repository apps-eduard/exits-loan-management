interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create KYC status enum
  await pgm.sql(`
    CREATE TYPE "kyc_status" AS ENUM (
      'pending',
      'verified',
      'rejected',
      'incomplete'
    );
  `);

  // Create customer status enum
  await pgm.sql(`
    CREATE TYPE "customer_status" AS ENUM (
      'active',
      'inactive',
      'blacklisted',
      'deceased'
    );
  `);

  // Create customers table
  await pgm.sql(`
    CREATE TABLE "customers" (
      "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      "organizational_unit_id" uuid NOT NULL REFERENCES "organizational_units" ON DELETE RESTRICT,
      "customer_code" text NOT NULL,
      
      -- Personal Information
      "first_name" text NOT NULL,
      "middle_name" text,
      "last_name" text NOT NULL,
      "suffix" text,
      "date_of_birth" date NOT NULL,
      "gender" text CHECK (gender IN ('male', 'female', 'other')),
      "civil_status" text CHECK (civil_status IN ('single', 'married', 'widowed', 'separated', 'divorced')),
      "nationality" text DEFAULT 'Filipino',
      
      -- Contact Information
      "email" text,
      "mobile_phone" text NOT NULL,
      "home_phone" text,
      
      -- Address
      "address_line1" text NOT NULL,
      "address_line2" text,
      "barangay" text NOT NULL,
      "city_municipality" text NOT NULL,
      "province" text NOT NULL,
      "region" text NOT NULL,
      "postal_code" text,
      
      -- Employment/Income Information
      "employment_status" text CHECK (employment_status IN ('employed', 'self-employed', 'unemployed', 'retired', 'student')),
      "employer_name" text,
      "occupation" text,
      "monthly_income" numeric(15, 2),
      "other_income_sources" text,
      
      -- Government IDs
      "tin" text,
      "sss_number" text,
      "philhealth_number" text,
      "pagibig_number" text,
      
      -- Emergency Contact
      "emergency_contact_name" text NOT NULL,
      "emergency_contact_relationship" text NOT NULL,
      "emergency_contact_phone" text NOT NULL,
      
      -- KYC & Status
      "kyc_status" kyc_status DEFAULT 'pending' NOT NULL,
      "kyc_verified_at" timestamptz,
      "kyc_verified_by" uuid REFERENCES "users",
      "kyc_notes" text,
      "status" customer_status DEFAULT 'active' NOT NULL,
      
      -- Risk Assessment
      "risk_rating" text CHECK (risk_rating IN ('low', 'medium', 'high')),
      "blacklist_reason" text,
      "blacklisted_at" timestamptz,
      "blacklisted_by" uuid REFERENCES "users",
      
      -- Metadata
      "created_by" uuid NOT NULL REFERENCES "users",
      "updated_by" uuid REFERENCES "users",
      "created_at" timestamptz DEFAULT now() NOT NULL,
      "updated_at" timestamptz DEFAULT now() NOT NULL
    );
  `);

  // Create indexes
  await pgm.sql(`
    CREATE UNIQUE INDEX "customers_customer_code_unique" ON "customers" ("customer_code");
    CREATE INDEX "customers_organizational_unit_id_index" ON "customers" ("organizational_unit_id");
    CREATE INDEX "customers_email_index" ON "customers" ("email");
    CREATE INDEX "customers_mobile_phone_index" ON "customers" ("mobile_phone");
    CREATE INDEX "customers_status_index" ON "customers" ("status");
    CREATE INDEX "customers_kyc_status_index" ON "customers" ("kyc_status");
    CREATE INDEX "customers_created_at_index" ON "customers" ("created_at");
  `);

  // Create customer documents table
  await pgm.sql(`
    CREATE TABLE "customer_documents" (
      "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      "customer_id" uuid NOT NULL REFERENCES "customers" ON DELETE CASCADE,
      "document_type" text NOT NULL CHECK (document_type IN (
        'valid_id',
        'proof_of_income',
        'proof_of_address',
        'bank_statement',
        'tax_return',
        'other'
      )),
      "document_name" text NOT NULL,
      "file_path" text NOT NULL,
      "file_size" integer,
      "mime_type" text,
      "uploaded_by" uuid NOT NULL REFERENCES "users",
      "uploaded_at" timestamptz DEFAULT now() NOT NULL,
      "notes" text
    );
  `);

  await pgm.sql(`
    CREATE INDEX "customer_documents_customer_id_index" ON "customer_documents" ("customer_id");
    CREATE INDEX "customer_documents_document_type_index" ON "customer_documents" ("document_type");
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql(`DROP TABLE IF EXISTS "customer_documents";`);
  await pgm.sql(`DROP TABLE IF EXISTS "customers";`);
  await pgm.sql(`DROP TYPE IF EXISTS "customer_status";`);
  await pgm.sql(`DROP TYPE IF EXISTS "kyc_status";`);
}
