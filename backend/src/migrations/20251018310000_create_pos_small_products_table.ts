interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create categories table
  await pgm.sql(`
    CREATE TABLE pos_small_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      
      category_name VARCHAR(100) NOT NULL,
      product_count INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create products table
  await pgm.sql(`
    CREATE TABLE pos_small_products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      
      -- Product Details
      barcode VARCHAR(100),
      sku VARCHAR(100),
      product_name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      unit VARCHAR(50) NOT NULL,
      
      -- Pricing
      cost_price DECIMAL(15,2) NOT NULL,
      selling_price DECIMAL(15,2) NOT NULL,
      wholesale_price DECIMAL(15,2),
      
      -- Inventory
      current_stock DECIMAL(15,3) NOT NULL DEFAULT 0,
      reorder_level DECIMAL(15,3) NOT NULL DEFAULT 0,
      low_stock_alert BOOLEAN NOT NULL DEFAULT false,
      
      -- Status
      is_active BOOLEAN NOT NULL DEFAULT true,
      
      -- Metadata
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create stock movements table
  await pgm.sql(`
    CREATE TABLE pos_small_stock_movements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES pos_small_products(id) ON DELETE CASCADE,
      
      -- Movement Details
      movement_type VARCHAR(20) NOT NULL,
      quantity DECIMAL(15,3) NOT NULL,
      unit_cost DECIMAL(15,2),
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

  // Create indexes
  await pgm.sql(`
    CREATE INDEX idx_pos_small_categories_tenant ON pos_small_categories(tenant_id);
    CREATE INDEX idx_pos_small_categories_active ON pos_small_categories(is_active);
    
    CREATE INDEX idx_pos_small_products_tenant ON pos_small_products(tenant_id);
    CREATE INDEX idx_pos_small_products_barcode ON pos_small_products(tenant_id, barcode);
    CREATE INDEX idx_pos_small_products_sku ON pos_small_products(tenant_id, sku);
    CREATE INDEX idx_pos_small_products_name ON pos_small_products(product_name);
    CREATE INDEX idx_pos_small_products_category ON pos_small_products(category);
    CREATE INDEX idx_pos_small_products_active ON pos_small_products(is_active);
    CREATE INDEX idx_pos_small_products_low_stock ON pos_small_products(low_stock_alert);
    
    CREATE INDEX idx_pos_small_stock_movements_tenant ON pos_small_stock_movements(tenant_id);
    CREATE INDEX idx_pos_small_stock_movements_product ON pos_small_stock_movements(product_id);
    CREATE INDEX idx_pos_small_stock_movements_date ON pos_small_stock_movements(created_at);
    CREATE INDEX idx_pos_small_stock_movements_type ON pos_small_stock_movements(movement_type);
  `);

  // Add trigger to update low stock alert
  await pgm.sql(`
    CREATE OR REPLACE FUNCTION update_pos_small_product_stock()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Update low stock alert
      NEW.low_stock_alert := (NEW.current_stock <= NEW.reorder_level);
      NEW.updated_at := NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER update_pos_small_product_stock_trigger
    BEFORE UPDATE OF current_stock, reorder_level ON pos_small_products
    FOR EACH ROW
    EXECUTE FUNCTION update_pos_small_product_stock();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql('DROP TRIGGER IF EXISTS update_pos_small_product_stock_trigger ON pos_small_products;');
  await pgm.sql('DROP FUNCTION IF EXISTS update_pos_small_product_stock();');
  await pgm.sql('DROP TABLE IF EXISTS pos_small_stock_movements CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pos_small_products CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pos_small_categories CASCADE;');
}
