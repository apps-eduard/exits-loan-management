interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create branches table
  await pgm.sql(`
    CREATE TABLE pos_large_branches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      
      -- Branch Details
      branch_code VARCHAR(50) NOT NULL UNIQUE,
      branch_name VARCHAR(255) NOT NULL,
      branch_type VARCHAR(20) NOT NULL,
      
      -- Contact
      phone_number VARCHAR(20),
      email VARCHAR(255),
      
      -- Address
      address_line1 VARCHAR(255) NOT NULL,
      address_line2 VARCHAR(255),
      city VARCHAR(100) NOT NULL,
      state_province VARCHAR(100) NOT NULL,
      postal_code VARCHAR(20),
      country VARCHAR(100) NOT NULL DEFAULT 'Philippines',
      
      -- Operations
      operating_hours VARCHAR(255),
      timezone VARCHAR(100),
      
      -- Manager
      manager_id UUID REFERENCES users(id),
      manager_name VARCHAR(255),
      
      -- Configuration
      allow_transfers BOOLEAN NOT NULL DEFAULT true,
      allow_returns BOOLEAN NOT NULL DEFAULT true,
      enable_inventory BOOLEAN NOT NULL DEFAULT true,
      
      -- Stats
      terminal_count INTEGER NOT NULL DEFAULT 0,
      staff_count INTEGER NOT NULL DEFAULT 0,
      
      -- Status
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      
      -- Metadata
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create terminals table
  await pgm.sql(`
    CREATE TABLE pos_large_terminals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      branch_id UUID NOT NULL REFERENCES pos_large_branches(id) ON DELETE CASCADE,
      
      -- Terminal Details
      terminal_code VARCHAR(50) NOT NULL UNIQUE,
      terminal_name VARCHAR(255) NOT NULL,
      terminal_type VARCHAR(20) NOT NULL,
      
      -- Hardware Info
      device_id VARCHAR(255),
      mac_address VARCHAR(100),
      ip_address VARCHAR(50),
      
      -- Status
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      is_online BOOLEAN NOT NULL DEFAULT false,
      last_heartbeat TIMESTAMP,
      
      -- Assigned Cashier
      assigned_cashier_id UUID REFERENCES users(id),
      assigned_cashier_name VARCHAR(255),
      
      -- Current Session
      current_session_id UUID,
      session_start_time TIMESTAMP,
      opening_cash_amount DECIMAL(15,2),
      
      -- Configuration
      allow_discounts BOOLEAN NOT NULL DEFAULT true,
      allow_voids BOOLEAN NOT NULL DEFAULT false,
      allow_refunds BOOLEAN NOT NULL DEFAULT false,
      require_supervisor_approval BOOLEAN NOT NULL DEFAULT true,
      
      -- Printer & Peripherals
      receipt_printer_enabled BOOLEAN NOT NULL DEFAULT true,
      barcode_scanner_enabled BOOLEAN NOT NULL DEFAULT true,
      cash_drawer_enabled BOOLEAN NOT NULL DEFAULT true,
      
      -- Metadata
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create terminal sessions table
  await pgm.sql(`
    CREATE TABLE pos_large_terminal_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      branch_id UUID NOT NULL REFERENCES pos_large_branches(id) ON DELETE CASCADE,
      terminal_id UUID NOT NULL REFERENCES pos_large_terminals(id) ON DELETE CASCADE,
      
      -- Session Details
      session_number VARCHAR(50) NOT NULL UNIQUE,
      start_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_date DATE,
      end_time TIME,
      
      -- Cashier
      cashier_id UUID REFERENCES users(id),
      cashier_name VARCHAR(255) NOT NULL,
      
      -- Opening/Closing Cash
      opening_cash DECIMAL(15,2) NOT NULL,
      closing_cash DECIMAL(15,2),
      cash_difference DECIMAL(15,2),
      
      -- Sales Summary
      total_transactions INTEGER NOT NULL DEFAULT 0,
      total_items_sold INTEGER NOT NULL DEFAULT 0,
      total_sales DECIMAL(15,2) NOT NULL DEFAULT 0,
      
      -- Payment Methods
      cash_sales DECIMAL(15,2) NOT NULL DEFAULT 0,
      card_sales DECIMAL(15,2) NOT NULL DEFAULT 0,
      ewallet_sales DECIMAL(15,2) NOT NULL DEFAULT 0,
      bnpl_sales DECIMAL(15,2) NOT NULL DEFAULT 0,
      
      -- Adjustments
      total_discounts DECIMAL(15,2) NOT NULL DEFAULT 0,
      total_refunds DECIMAL(15,2) NOT NULL DEFAULT 0,
      total_voids DECIMAL(15,2) NOT NULL DEFAULT 0,
      
      -- Status
      status VARCHAR(20) NOT NULL DEFAULT 'open',
      
      -- Notes
      opening_notes TEXT,
      closing_notes TEXT,
      
      -- Metadata
      opened_by UUID REFERENCES users(id),
      closed_by UUID REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create indexes
  await pgm.sql(`
    CREATE INDEX idx_pos_large_branches_tenant ON pos_large_branches(tenant_id);
    CREATE INDEX idx_pos_large_branches_code ON pos_large_branches(branch_code);
    CREATE INDEX idx_pos_large_branches_status ON pos_large_branches(status);
    
    CREATE INDEX idx_pos_large_terminals_tenant ON pos_large_terminals(tenant_id);
    CREATE INDEX idx_pos_large_terminals_branch ON pos_large_terminals(branch_id);
    CREATE INDEX idx_pos_large_terminals_code ON pos_large_terminals(terminal_code);
    CREATE INDEX idx_pos_large_terminals_status ON pos_large_terminals(status);
    CREATE INDEX idx_pos_large_terminals_online ON pos_large_terminals(is_online);
    
    CREATE INDEX idx_pos_large_terminal_sessions_tenant ON pos_large_terminal_sessions(tenant_id);
    CREATE INDEX idx_pos_large_terminal_sessions_branch ON pos_large_terminal_sessions(branch_id);
    CREATE INDEX idx_pos_large_terminal_sessions_terminal ON pos_large_terminal_sessions(terminal_id);
    CREATE INDEX idx_pos_large_terminal_sessions_cashier ON pos_large_terminal_sessions(cashier_id);
    CREATE INDEX idx_pos_large_terminal_sessions_status ON pos_large_terminal_sessions(status);
    CREATE INDEX idx_pos_large_terminal_sessions_date ON pos_large_terminal_sessions(start_date);
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql('DROP TABLE IF EXISTS pos_large_terminal_sessions CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pos_large_terminals CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pos_large_branches CASCADE;');
}
