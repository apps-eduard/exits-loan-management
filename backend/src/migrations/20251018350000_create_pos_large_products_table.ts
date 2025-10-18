interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create categories table
  await pgm.sql(`
    CREATE TABLE pos_large_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      
      category_name VARCHAR(255) NOT NULL,
      parent_category_id UUID REFERENCES pos_large_categories(id),
      level INTEGER NOT NULL DEFAULT 0,
      
      -- Display
      display_order INTEGER NOT NULL DEFAULT 0,
      icon VARCHAR(255),
      color VARCHAR(50),
      
      -- Stats
      product_count INTEGER NOT NULL DEFAULT 0,
      
      -- Status
      is_active BOOLEAN NOT NULL DEFAULT true,
      
      -- Metadata
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create products table
  await pgm.sql(`
    CREATE TABLE pos_large_products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      branch_id UUID REFERENCES pos_large_branches(id),
      
      -- Product Identification
      barcode VARCHAR(100) NOT NULL,
      sku VARCHAR(100) NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      description TEXT,
      category_id UUID REFERENCES pos_large_categories(id),
      category_name VARCHAR(255),
      subcategory VARCHAR(255),
      brand VARCHAR(255),
      manufacturer VARCHAR(255),
      
      -- Product Variants
      has_variants BOOLEAN NOT NULL DEFAULT false,
      parent_product_id UUID REFERENCES pos_large_products(id),
      variant_attributes JSONB,
      
      -- Units & Packaging
      base_unit VARCHAR(50) NOT NULL,
      unit_conversion JSONB,
      
      -- Pricing
      cost_price DECIMAL(15,2) NOT NULL,
      selling_price DECIMAL(15,2) NOT NULL,
      wholesale_price DECIMAL(15,2),
      promo_price DECIMAL(15,2),
      promo_start_date DATE,
      promo_end_date DATE,
      price_by_branch JSONB,
      
      -- Bulk Pricing
      bulk_pricing JSONB,
      
      -- Total Stock across all branches
      total_stock DECIMAL(15,3) NOT NULL DEFAULT 0,
      
      -- Stock Alerts
      low_stock_alert BOOLEAN NOT NULL DEFAULT false,
      out_of_stock_alert BOOLEAN NOT NULL DEFAULT false,
      
      -- Combo Products
      is_combo BOOLEAN NOT NULL DEFAULT false,
      combo_items JSONB,
      
      -- Tax & Accounting
      is_taxable BOOLEAN NOT NULL DEFAULT true,
      tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
      tax_category VARCHAR(100),
      
      -- Status
      is_active BOOLEAN NOT NULL DEFAULT true,
      is_discontinued BOOLEAN NOT NULL DEFAULT false,
      
      -- Metadata
      supplier_id UUID,
      supplier_name VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create product inventory by branch table
  await pgm.sql(`
    CREATE TABLE pos_large_product_inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES pos_large_products(id) ON DELETE CASCADE,
      branch_id UUID NOT NULL REFERENCES pos_large_branches(id) ON DELETE CASCADE,
      
      branch_name VARCHAR(255) NOT NULL,
      stock_on_hand DECIMAL(15,3) NOT NULL DEFAULT 0,
      reserved_stock DECIMAL(15,3) NOT NULL DEFAULT 0,
      available_stock DECIMAL(15,3) NOT NULL DEFAULT 0,
      reorder_level DECIMAL(15,3) NOT NULL DEFAULT 0,
      reorder_quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
      max_stock_level DECIMAL(15,3),
      
      -- Metadata
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      
      UNIQUE(product_id, branch_id)
    );
  `);

  // Create stock movements table
  await pgm.sql(`
    CREATE TABLE pos_large_stock_movements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      branch_id UUID NOT NULL REFERENCES pos_large_branches(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES pos_large_products(id) ON DELETE CASCADE,
      
      -- Movement Details
      movement_type VARCHAR(20) NOT NULL,
      quantity DECIMAL(15,3) NOT NULL,
      unit_cost DECIMAL(15,2),
      
      -- Transfer Details (if transfer)
      from_branch_id UUID REFERENCES pos_large_branches(id),
      to_branch_id UUID REFERENCES pos_large_branches(id),
      
      -- Reference
      reference_type VARCHAR(50),
      reference_id UUID,
      reference_number VARCHAR(100),
      
      -- Before/After
      stock_before DECIMAL(15,3) NOT NULL,
      stock_after DECIMAL(15,3) NOT NULL,
      
      -- Notes
      notes TEXT,
      
      -- Metadata
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create promotions table
  await pgm.sql(`
    CREATE TABLE pos_large_promotions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      
      -- Promotion Details
      promo_code VARCHAR(50) NOT NULL UNIQUE,
      promo_name VARCHAR(255) NOT NULL,
      description TEXT,
      
      -- Type
      promo_type VARCHAR(50) NOT NULL,
      
      -- Discount Details
      discount_percentage DECIMAL(5,2),
      discount_amount DECIMAL(15,2),
      
      -- Buy X Get Y
      buy_quantity INTEGER,
      get_quantity INTEGER,
      
      -- Applicable Products
      applies_to VARCHAR(20) NOT NULL,
      category_ids UUID[],
      product_ids UUID[],
      
      -- Minimum Purchase
      minimum_purchase_amount DECIMAL(15,2),
      minimum_items INTEGER,
      
      -- Validity
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      
      -- Usage Limits
      max_uses INTEGER,
      current_uses INTEGER NOT NULL DEFAULT 0,
      max_uses_per_customer INTEGER,
      
      -- Branches
      branch_ids UUID[],
      
      -- Status
      is_active BOOLEAN NOT NULL DEFAULT true,
      
      -- Metadata
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create indexes
  await pgm.sql(`
    CREATE INDEX idx_pos_large_categories_tenant ON pos_large_categories(tenant_id);
    CREATE INDEX idx_pos_large_categories_parent ON pos_large_categories(parent_category_id);
    CREATE INDEX idx_pos_large_categories_active ON pos_large_categories(is_active);
    
    CREATE INDEX idx_pos_large_products_tenant ON pos_large_products(tenant_id);
    CREATE INDEX idx_pos_large_products_branch ON pos_large_products(branch_id);
    CREATE INDEX idx_pos_large_products_barcode ON pos_large_products(tenant_id, barcode);
    CREATE INDEX idx_pos_large_products_sku ON pos_large_products(tenant_id, sku);
    CREATE INDEX idx_pos_large_products_name ON pos_large_products(product_name);
    CREATE INDEX idx_pos_large_products_category ON pos_large_products(category_id);
    CREATE INDEX idx_pos_large_products_active ON pos_large_products(is_active);
    
    CREATE INDEX idx_pos_large_product_inventory_tenant ON pos_large_product_inventory(tenant_id);
    CREATE INDEX idx_pos_large_product_inventory_product ON pos_large_product_inventory(product_id);
    CREATE INDEX idx_pos_large_product_inventory_branch ON pos_large_product_inventory(branch_id);
    
    CREATE INDEX idx_pos_large_stock_movements_tenant ON pos_large_stock_movements(tenant_id);
    CREATE INDEX idx_pos_large_stock_movements_branch ON pos_large_stock_movements(branch_id);
    CREATE INDEX idx_pos_large_stock_movements_product ON pos_large_stock_movements(product_id);
    CREATE INDEX idx_pos_large_stock_movements_type ON pos_large_stock_movements(movement_type);
    CREATE INDEX idx_pos_large_stock_movements_date ON pos_large_stock_movements(created_at);
    
    CREATE INDEX idx_pos_large_promotions_tenant ON pos_large_promotions(tenant_id);
    CREATE INDEX idx_pos_large_promotions_code ON pos_large_promotions(promo_code);
    CREATE INDEX idx_pos_large_promotions_dates ON pos_large_promotions(start_date, end_date);
    CREATE INDEX idx_pos_large_promotions_active ON pos_large_promotions(is_active);
  `);

  // Add trigger to update product inventory available stock
  await pgm.sql(`
    CREATE OR REPLACE FUNCTION update_pos_large_product_inventory_available()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.available_stock := NEW.stock_on_hand - NEW.reserved_stock;
      NEW.updated_at := NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER update_pos_large_product_inventory_available_trigger
    BEFORE UPDATE OF stock_on_hand, reserved_stock ON pos_large_product_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_pos_large_product_inventory_available();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql('DROP TRIGGER IF EXISTS update_pos_large_product_inventory_available_trigger ON pos_large_product_inventory;');
  await pgm.sql('DROP FUNCTION IF EXISTS update_pos_large_product_inventory_available();');
  
  await pgm.sql('DROP TABLE IF EXISTS pos_large_promotions CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pos_large_stock_movements CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pos_large_product_inventory CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pos_large_products CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pos_large_categories CASCADE;');
}
