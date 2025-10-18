interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create sales table
  await pgm.sql(`
    CREATE TABLE pos_small_sales (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      
      -- Sale Details
      sale_number VARCHAR(50) NOT NULL UNIQUE,
      sale_date DATE NOT NULL,
      sale_time TIME NOT NULL,
      
      -- Customer
      customer_id UUID REFERENCES pos_small_customers(id),
      customer_name VARCHAR(255),
      
      -- Items
      total_items INTEGER NOT NULL,
      
      -- Amounts
      subtotal DECIMAL(15,2) NOT NULL,
      discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      discount_type VARCHAR(20),
      discount_reason VARCHAR(255),
      total_amount DECIMAL(15,2) NOT NULL,
      
      -- Payment
      payment_method VARCHAR(50) NOT NULL,
      amount_tendered DECIMAL(15,2),
      change_given DECIMAL(15,2),
      
      -- Credit Sale
      is_credit_sale BOOLEAN NOT NULL DEFAULT false,
      credit_account_id UUID REFERENCES pos_small_credit_accounts(id),
      down_payment DECIMAL(15,2),
      credit_amount DECIMAL(15,2),
      
      -- BNPL Integration
      is_bnpl BOOLEAN NOT NULL DEFAULT false,
      bnpl_purchase_id UUID,
      
      -- Status
      status VARCHAR(20) NOT NULL DEFAULT 'completed',
      
      -- Offline Sync
      synced BOOLEAN NOT NULL DEFAULT true,
      sync_date TIMESTAMP,
      offline_sale BOOLEAN NOT NULL DEFAULT false,
      
      -- Notes
      notes TEXT,
      
      -- Metadata
      cashier_id UUID REFERENCES users(id),
      cashier_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create sale items table
  await pgm.sql(`
    CREATE TABLE pos_small_sale_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sale_id UUID NOT NULL REFERENCES pos_small_sales(id) ON DELETE CASCADE,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      
      -- Product
      product_id UUID NOT NULL REFERENCES pos_small_products(id) ON DELETE RESTRICT,
      product_name VARCHAR(255) NOT NULL,
      barcode VARCHAR(100),
      sku VARCHAR(100),
      
      -- Quantity & Pricing
      quantity DECIMAL(15,3) NOT NULL,
      unit VARCHAR(50) NOT NULL,
      unit_price DECIMAL(15,2) NOT NULL,
      subtotal DECIMAL(15,2) NOT NULL,
      
      -- Discount (per item)
      discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      line_total DECIMAL(15,2) NOT NULL,
      
      -- Cost (for profit calculation)
      unit_cost DECIMAL(15,2),
      
      -- Metadata
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create indexes
  await pgm.sql(`
    CREATE INDEX idx_pos_small_sales_tenant ON pos_small_sales(tenant_id);
    CREATE INDEX idx_pos_small_sales_number ON pos_small_sales(sale_number);
    CREATE INDEX idx_pos_small_sales_date ON pos_small_sales(sale_date);
    CREATE INDEX idx_pos_small_sales_customer ON pos_small_sales(customer_id);
    CREATE INDEX idx_pos_small_sales_cashier ON pos_small_sales(cashier_id);
    CREATE INDEX idx_pos_small_sales_status ON pos_small_sales(status);
    CREATE INDEX idx_pos_small_sales_payment_method ON pos_small_sales(payment_method);
    CREATE INDEX idx_pos_small_sales_synced ON pos_small_sales(synced);
    CREATE INDEX idx_pos_small_sales_credit ON pos_small_sales(is_credit_sale);
    
    CREATE INDEX idx_pos_small_sale_items_sale ON pos_small_sale_items(sale_id);
    CREATE INDEX idx_pos_small_sale_items_tenant ON pos_small_sale_items(tenant_id);
    CREATE INDEX idx_pos_small_sale_items_product ON pos_small_sale_items(product_id);
    CREATE INDEX idx_pos_small_sale_items_date ON pos_small_sale_items(created_at);
  `);

  // Add trigger to update inventory on sale
  await pgm.sql(`
    CREATE OR REPLACE FUNCTION process_pos_small_sale_item()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Deduct stock
      UPDATE pos_small_products
      SET 
        current_stock = current_stock - NEW.quantity,
        updated_at = NOW()
      WHERE id = NEW.product_id;
      
      -- Record stock movement
      INSERT INTO pos_small_stock_movements (
        tenant_id,
        product_id,
        movement_type,
        quantity,
        stock_before,
        stock_after,
        created_by,
        created_at
      )
      SELECT 
        p.tenant_id,
        p.id,
        'out',
        NEW.quantity,
        p.current_stock + NEW.quantity,
        p.current_stock,
        (SELECT cashier_id FROM pos_small_sales WHERE id = NEW.sale_id),
        NOW()
      FROM pos_small_products p
      WHERE p.id = NEW.product_id;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER process_pos_small_sale_item_trigger
    AFTER INSERT ON pos_small_sale_items
    FOR EACH ROW
    EXECUTE FUNCTION process_pos_small_sale_item();
  `);

  // Add trigger for credit sales
  await pgm.sql(`
    CREATE OR REPLACE FUNCTION process_pos_small_credit_sale()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.is_credit_sale AND NEW.credit_account_id IS NOT NULL THEN
        -- Update customer stats
        UPDATE pos_small_customers
        SET 
          outstanding_balance = outstanding_balance + NEW.credit_amount,
          available_credit = credit_limit - (outstanding_balance + NEW.credit_amount),
          total_purchases = total_purchases + NEW.total_amount,
          last_purchase_date = NEW.sale_date,
          updated_at = NOW()
        WHERE id = NEW.customer_id;
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER process_pos_small_credit_sale_trigger
    AFTER INSERT ON pos_small_sales
    FOR EACH ROW
    WHEN (NEW.is_credit_sale = true)
    EXECUTE FUNCTION process_pos_small_credit_sale();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql('DROP TRIGGER IF EXISTS process_pos_small_credit_sale_trigger ON pos_small_sales;');
  await pgm.sql('DROP FUNCTION IF EXISTS process_pos_small_credit_sale();');
  await pgm.sql('DROP TRIGGER IF EXISTS process_pos_small_sale_item_trigger ON pos_small_sale_items;');
  await pgm.sql('DROP FUNCTION IF EXISTS process_pos_small_sale_item();');
  
  await pgm.sql('DROP TABLE IF EXISTS pos_small_sale_items CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pos_small_sales CASCADE;');
}
