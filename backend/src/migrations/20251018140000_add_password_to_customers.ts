type MigrationBuilder = {
  addColumn: (tableName: string, columns: Record<string, unknown>) => void;
  dropColumn: (tableName: string, columnName: string | string[]) => void;
  createIndex: (
    tableName: string,
    columns: string | string[],
    options?: Record<string, unknown>
  ) => void;
  dropIndex: (
    tableName: string,
    columns: string | string[],
    options?: Record<string, unknown>
  ) => void;
};

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Add password_hash column to customers table
  pgm.addColumn("customers", {
    password_hash: {
      type: "varchar(255)",
      notNull: false, // Allow null for existing customers
    },
  });

  // Add last_login_at column to customers table
  pgm.addColumn("customers", {
    last_login_at: {
      type: "timestamp",
      notNull: false,
    },
  });

  // Add index on email for faster login queries
  pgm.createIndex("customers", "email", {
    unique: true,
    name: "idx_customers_email_unique",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("customers", "email", { name: "idx_customers_email_unique" });
  pgm.dropColumn("customers", "last_login_at");
  pgm.dropColumn("customers", "password_hash");
}
