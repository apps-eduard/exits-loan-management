interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create borrowers table
  await pgm.sql(`
    CREATE TABLE borrowers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      
      -- Personal Details
      first_name VARCHAR(100) NOT NULL,
      middle_name VARCHAR(100),
      last_name VARCHAR(100) NOT NULL,
      date_of_birth DATE,
      gender VARCHAR(20),
      civil_status VARCHAR(20),
      
      -- Contact Information
      email VARCHAR(255),
      phone_number VARCHAR(20) NOT NULL,
      alternate_phone VARCHAR(20),
      
      -- Address
      address_line1 VARCHAR(255) NOT NULL,
      address_line2 VARCHAR(255),
      city VARCHAR(100) NOT NULL,
      state_province VARCHAR(100) NOT NULL,
      postal_code VARCHAR(20),
      country VARCHAR(100) NOT NULL DEFAULT 'Philippines',
      
      -- Identification
      id_type VARCHAR(50),
      id_number VARCHAR(100),
      
      -- Employment/Income
      employer VARCHAR(255),
      occupation VARCHAR(100),
      monthly_income DECIMAL(15,2),
      source_of_income VARCHAR(255),
      
      -- Credit Information
      credit_score INTEGER,
      credit_rating VARCHAR(20),
      total_borrowed DECIMAL(15,2) NOT NULL DEFAULT 0,
      total_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
      outstanding_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
      active_loans_count INTEGER NOT NULL DEFAULT 0,
      
      -- Emergency Contact
      emergency_contact_name VARCHAR(255),
      emergency_contact_phone VARCHAR(20),
      emergency_contact_relationship VARCHAR(50),
      
      -- Status
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      blacklist_reason TEXT,
      
      -- Notes
      notes TEXT,
      
      -- Metadata
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create borrower_documents table
  await pgm.sql(`
    CREATE TABLE borrower_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      borrower_id UUID NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      
      document_type VARCHAR(50) NOT NULL,
      document_name VARCHAR(255) NOT NULL,
      file_url TEXT NOT NULL,
      file_type VARCHAR(100) NOT NULL,
      file_size BIGINT NOT NULL,
      
      uploaded_by UUID REFERENCES users(id),
      uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create indexes
  await pgm.sql(`
    CREATE INDEX idx_borrowers_tenant_id ON borrowers(tenant_id);
    CREATE INDEX idx_borrowers_status ON borrowers(status);
    CREATE INDEX idx_borrowers_tenant_phone ON borrowers(tenant_id, phone_number);
    CREATE INDEX idx_borrowers_tenant_email ON borrowers(tenant_id, email);
    CREATE INDEX idx_borrowers_name ON borrowers(first_name, last_name);
    
    CREATE INDEX idx_borrower_documents_borrower ON borrower_documents(borrower_id);
    CREATE INDEX idx_borrower_documents_tenant ON borrower_documents(tenant_id);
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql('DROP TABLE IF EXISTS borrower_documents CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS borrowers CASCADE;');
}
