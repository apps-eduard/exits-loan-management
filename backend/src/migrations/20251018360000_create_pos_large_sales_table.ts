interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create sales table
  await pgm.sql(`
    CREATE TABLE pos_large_sales (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      branch_id UUID NOT NULL REFERENCES pos_large_branches(id) ON DELETE CASCADE,
      terminal_id UUID NOT NULL REFERENCES pos_large_terminals(id) ON DELETE CASCADE,
      session_id UUID NOT NULL REFERENCES pos_large_terminal_sessions(id) ON DELETE RESTRICT,
      
      -- Transaction Details
      transaction_number VARCHAR(50) NOT NULL UNIQUE,
      transaction_date DATE NOT NULL,
      transaction_time TIME NOT NULL,
      
      -- Customer
      customer_id UUID,
      customer_name VARCHAR(255),
      customer_phone VARCHAR(20),
      loyalty_card_number VARCHAR(100),
      
      -- Items
      total_items INTEGER NOT NULL,
      unique_items INTEGER NOT NULL,
      
      -- Amounts
      subtotal DECIMAL(15,2) NOT NULL,
      tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      
      -- Discounts & Promotions
      discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      discount_type VARCHAR(20),
      discount_reason VARCHAR(255),
      promo_codes VARCHAR(100)[],
      
      total_amount DECIMAL(15,2) NOT NULL,
      
      -- Payment
      payment_method VARCHAR(50) NOT NULL,
      
      amount_tendered DECIMAL(15,2) NOT NULL,
      change_given DECIMAL(15,2) NOT NULL DEFAULT 0,
      
      -- BNPL Integration
      is_bnpl BOOLEAN NOT NULL DEFAULT false,
      bnpl_purchase_id UUID,
      down_payment DECIMAL(15,2),
      financed_amount DECIMAL(15,2),
      
      -- Loyalty
      loyalty_points_earned INTEGER,
      loyalty_points_redeemed INTEGER,
      
      -- Status
      status VARCHAR(20) NOT NULL DEFAULT 'completed',
      void_reason TEXT,
      voided_by UUID REFERENCES users(id),
      voided_at TIMESTAMP,
      
      -- Receipt
      receipt_number VARCHAR(100) NOT NULL,
      receipt_printed BOOLEAN NOT NULL DEFAULT false,
      email_receipt BOOLEAN NOT NULL DEFAULT false,
      customer_email VARCHAR(255),
      
      -- Staff
      cashier_id UUID REFERENCES users(id),
      cashier_name VARCHAR(255) NOT NULL,
      supervisor_id UUID REFERENCES users(id),
      
      -- Notes
      notes TEXT,
      
      -- Metadata
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create sale payments table (for split payments)
  await pgm.sql(`
    CREATE TABLE pos_large_sale_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sale_id UUID NOT NULL REFERENCES pos_large_sales(id) ON DELETE CASCADE,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      
      payment_method VARCHAR(50) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      reference_number VARCHAR(100),
      card_last_4_digits VARCHAR(4),
      approval_code VARCHAR(100),
      
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create sale items table
  await pgm.sql(`
    CREATE TABLE pos_large_sale_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sale_id UUID NOT NULL REFERENCES pos_large_sales(id) ON DELETE CASCADE,
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      
      -- Product
      product_id UUID NOT NULL REFERENCES pos_large_products(id) ON DELETE RESTRICT,
      product_name VARCHAR(255) NOT NULL,
      barcode VARCHAR(100) NOT NULL,
      sku VARCHAR(100) NOT NULL,
      category_name VARCHAR(255),
      
      -- Quantity & Units
      quantity DECIMAL(15,3) NOT NULL,
      unit VARCHAR(50) NOT NULL,
      
      -- Pricing
      unit_price DECIMAL(15,2) NOT NULL,
      original_price DECIMAL(15,2),
      subtotal DECIMAL(15,2) NOT NULL,
      
      -- Discount
      discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      discount_type VARCHAR(50),
      line_total DECIMAL(15,2) NOT NULL,
      
      -- Tax
      is_taxable BOOLEAN NOT NULL DEFAULT true,
      tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
      tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      
      -- Cost (for profit calculation)
      unit_cost DECIMAL(15,2) NOT NULL,
      line_cost DECIMAL(15,2) NOT NULL,
      line_profit DECIMAL(15,2) NOT NULL,
      
      -- Promotions
      promo_id UUID REFERENCES pos_large_promotions(id),
      promo_name VARCHAR(255),
      
      -- Status
      is_voided BOOLEAN NOT NULL DEFAULT false,
      void_reason TEXT,
      
      -- Metadata
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create refunds table
  await pgm.sql(`
    CREATE TABLE pos_large_refunds (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      branch_id UUID NOT NULL REFERENCES pos_large_branches(id) ON DELETE CASCADE,
      terminal_id UUID NOT NULL REFERENCES pos_large_terminals(id) ON DELETE CASCADE,
      
      -- Original Sale
      original_sale_id UUID NOT NULL REFERENCES pos_large_sales(id) ON DELETE RESTRICT,
      original_transaction_number VARCHAR(50) NOT NULL,
      original_sale_date DATE NOT NULL,
      
      -- Refund Details
      refund_number VARCHAR(50) NOT NULL UNIQUE,
      refund_date DATE NOT NULL,
      refund_type VARCHAR(20) NOT NULL,
      
      -- Amounts
      refund_amount DECIMAL(15,2) NOT NULL,
      restocking_fee DECIMAL(15,2),
      final_refund_amount DECIMAL(15,2) NOT NULL,
      
      -- Method
      refund_method VARCHAR(50) NOT NULL,
      
      -- Reason
      refund_reason TEXT NOT NULL,
      customer_complaint TEXT,
      
      -- Approval
      requires_approval BOOLEAN NOT NULL DEFAULT true,
      approved_by UUID REFERENCES users(id),
      approval_date TIMESTAMP,
      
      -- Customer
      customer_id UUID,
      customer_name VARCHAR(255),
      
      -- Receipt
      refund_receipt_number VARCHAR(100) NOT NULL,
      
      -- Notes
      notes TEXT,
      
      -- Metadata
      processed_by UUID REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create refund items table
  await pgm.sql(`
    CREATE TABLE pos_large_refund_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      refund_id UUID NOT NULL REFERENCES pos_large_refunds(id) ON DELETE CASCADE,
      sale_item_id UUID NOT NULL REFERENCES pos_large_sale_items(id),
      
      product_name VARCHAR(255) NOT NULL,
      quantity DECIMAL(15,3) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create indexes
  await pgm.sql(`
    CREATE INDEX idx_pos_large_sales_tenant ON pos_large_sales(tenant_id);
    CREATE INDEX idx_pos_large_sales_branch ON pos_large_sales(branch_id);
    CREATE INDEX idx_pos_large_sales_terminal ON pos_large_sales(terminal_id);
    CREATE INDEX idx_pos_large_sales_session ON pos_large_sales(session_id);
    CREATE INDEX idx_pos_large_sales_transaction ON pos_large_sales(transaction_number);
    CREATE INDEX idx_pos_large_sales_date ON pos_large_sales(transaction_date);
    CREATE INDEX idx_pos_large_sales_customer ON pos_large_sales(customer_id);
    CREATE INDEX idx_pos_large_sales_cashier ON pos_large_sales(cashier_id);
    CREATE INDEX idx_pos_large_sales_status ON pos_large_sales(status);
    CREATE INDEX idx_pos_large_sales_payment_method ON pos_large_sales(payment_method);
    
    CREATE INDEX idx_pos_large_sale_payments_sale ON pos_large_sale_payments(sale_id);
    
    CREATE INDEX idx_pos_large_sale_items_sale ON pos_large_sale_items(sale_id);
    CREATE INDEX idx_pos_large_sale_items_tenant ON pos_large_sale_items(tenant_id);
    CREATE INDEX idx_pos_large_sale_items_product ON pos_large_sale_items(product_id);
    CREATE INDEX idx_pos_large_sale_items_date ON pos_large_sale_items(created_at);
    
    CREATE INDEX idx_pos_large_refunds_tenant ON pos_large_refunds(tenant_id);
    CREATE INDEX idx_pos_large_refunds_branch ON pos_large_refunds(branch_id);
    CREATE INDEX idx_pos_large_refunds_sale ON pos_large_refunds(original_sale_id);
    CREATE INDEX idx_pos_large_refunds_date ON pos_large_refunds(refund_date);
    
    CREATE INDEX idx_pos_large_refund_items_refund ON pos_large_refund_items(refund_id);
  `);

  // Add trigger to update inventory on sale
  await pgm.sql(`
    CREATE OR REPLACE FUNCTION process_pos_large_sale_item()
    RETURNS TRIGGER AS $$
    DECLARE
      v_branch_id UUID;
    BEGIN
      -- Get branch_id from sale
      SELECT branch_id INTO v_branch_id
      FROM pos_large_sales
      WHERE id = NEW.sale_id;
      
      -- Deduct stock from branch inventory
      UPDATE pos_large_product_inventory
      SET 
        stock_on_hand = stock_on_hand - NEW.quantity,
        updated_at = NOW()
      WHERE product_id = NEW.product_id AND branch_id = v_branch_id;
      
      -- Update total stock in product
      UPDATE pos_large_products
      SET 
        total_stock = total_stock - NEW.quantity,
        updated_at = NOW()
      WHERE id = NEW.product_id;
      
      -- Record stock movement
      INSERT INTO pos_large_stock_movements (
        tenant_id,
        branch_id,
        product_id,
        movement_type,
        quantity,
        reference_type,
        reference_id,
        stock_before,
        stock_after,
        created_by,
        created_at
      )
      SELECT 
        inv.tenant_id,
        inv.branch_id,
        inv.product_id,
        'out',
        NEW.quantity,
        'sale',
        NEW.sale_id,
        inv.stock_on_hand + NEW.quantity,
        inv.stock_on_hand,
        (SELECT cashier_id FROM pos_large_sales WHERE id = NEW.sale_id),
        NOW()
      FROM pos_large_product_inventory inv
      WHERE inv.product_id = NEW.product_id AND inv.branch_id = v_branch_id;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER process_pos_large_sale_item_trigger
    AFTER INSERT ON pos_large_sale_items
    FOR EACH ROW
    WHEN (NEW.is_voided = false)
    EXECUTE FUNCTION process_pos_large_sale_item();
  `);

  // Add trigger to update session stats
  await pgm.sql(`
    CREATE OR REPLACE FUNCTION update_pos_large_session_stats()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE pos_large_terminal_sessions
      SET 
        total_transactions = total_transactions + 1,
        total_items_sold = total_items_sold + NEW.total_items,
        total_sales = total_sales + NEW.total_amount,
        cash_sales = CASE WHEN NEW.payment_method = 'cash' THEN cash_sales + NEW.total_amount ELSE cash_sales END,
        card_sales = CASE WHEN NEW.payment_method = 'card' THEN card_sales + NEW.total_amount ELSE card_sales END,
        ewallet_sales = CASE WHEN NEW.payment_method = 'ewallet' THEN ewallet_sales + NEW.total_amount ELSE ewallet_sales END,
        bnpl_sales = CASE WHEN NEW.is_bnpl = true THEN bnpl_sales + NEW.financed_amount ELSE bnpl_sales END,
        total_discounts = total_discounts + NEW.discount_amount,
        updated_at = NOW()
      WHERE id = NEW.session_id;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER update_pos_large_session_stats_trigger
    AFTER INSERT ON pos_large_sales
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_pos_large_session_stats();
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql('DROP TRIGGER IF EXISTS update_pos_large_session_stats_trigger ON pos_large_sales;');
  await pgm.sql('DROP FUNCTION IF EXISTS update_pos_large_session_stats();');
  await pgm.sql('DROP TRIGGER IF EXISTS process_pos_large_sale_item_trigger ON pos_large_sale_items;');
  await pgm.sql('DROP FUNCTION IF EXISTS process_pos_large_sale_item();');
  
  await pgm.sql('DROP TABLE IF EXISTS pos_large_refund_items CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pos_large_refunds CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pos_large_sale_items CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pos_large_sale_payments CASCADE;');
  await pgm.sql('DROP TABLE IF EXISTS pos_large_sales CASCADE;');
}
