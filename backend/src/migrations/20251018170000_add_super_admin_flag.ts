interface MigrationBuilder {
  sql: (query: string, values?: any[]) => Promise<void>;
}

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Add is_super_admin column to users table
  await pgm.sql(`
    ALTER TABLE users 
    ADD COLUMN is_super_admin BOOLEAN NOT NULL DEFAULT false;
  `);

  await pgm.sql(`
    COMMENT ON COLUMN users.is_super_admin IS 'Super admins can access and manage all tenants';
  `);

  // Create index for efficient super admin queries
  await pgm.sql(`
    CREATE INDEX idx_users_is_super_admin ON users(is_super_admin) 
    WHERE is_super_admin = true;
  `);

  // Update existing admin@pacifica.ph to be super admin
  await pgm.sql(`
    UPDATE users 
    SET is_super_admin = true 
    WHERE email = 'admin@pacifica.ph';
  `);

  console.log('✓ Added is_super_admin column to users table');
  console.log('✓ Set admin@pacifica.ph as Super Admin');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Drop index
  await pgm.sql(`
    DROP INDEX IF EXISTS idx_users_is_super_admin;
  `);

  // Remove column
  await pgm.sql(`
    ALTER TABLE users DROP COLUMN IF EXISTS is_super_admin;
  `);

  console.log('✓ Removed is_super_admin column from users table');
}
