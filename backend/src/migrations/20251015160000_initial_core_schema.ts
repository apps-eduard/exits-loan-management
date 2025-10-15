const tables = {
  organizationalUnits: "organizational_units",
  roles: "roles",
  permissions: "permissions",
  rolePermissions: "role_permissions",
  users: "users",
};

// Minimal subset of the MigrationBuilder API used in this project to avoid cross-module typing issues.
type MigrationBuilder = {
  createExtension: (name: string, options?: Record<string, unknown>) => void;
  createType: (name: string, values: string[]) => void;
  createTable: (
    tableName: string,
    columns: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => void;
  addConstraint: (
    tableName: string,
    constraintName: string,
    options: Record<string, unknown>
  ) => void;
  createIndex: (
    tableName: string,
    columns: string | string[],
    options?: Record<string, unknown>
  ) => void;
  dropTable: (tableName: string) => void;
  dropType: (typeName: string) => void;
  func: (sql: string) => string;
};

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  pgm.createType("organizational_unit_type", ["region", "branch", "department"]);
  pgm.createType("user_status", ["active", "inactive", "invited", "suspended"]);

  pgm.createTable(tables.organizationalUnits, {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    parent_id: {
      type: "uuid",
      references: tables.organizationalUnits,
      onDelete: "SET NULL",
    },
    name: {
      type: "text",
      notNull: true,
    },
    code: {
      type: "text",
      notNull: true,
    },
    type: {
      type: "organizational_unit_type",
      notNull: true,
    },
    description: {
      type: "text",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint(tables.organizationalUnits, "organizational_units_unique_code", {
    unique: "code",
  });
  pgm.createIndex(tables.organizationalUnits, ["parent_id"]);

  pgm.createTable(tables.roles, {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: {
      type: "text",
      notNull: true,
    },
    description: {
      type: "text",
    },
    is_default: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint(tables.roles, "roles_unique_name", {
    unique: "name",
  });

  pgm.createTable(tables.permissions, {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    key: {
      type: "text",
      notNull: true,
    },
    description: {
      type: "text",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint(tables.permissions, "permissions_unique_key", {
    unique: "key",
  });

  pgm.createTable(tables.users, {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    organizational_unit_id: {
      type: "uuid",
      notNull: true,
      references: tables.organizationalUnits,
      onDelete: "RESTRICT",
    },
    role_id: {
      type: "uuid",
      notNull: true,
      references: tables.roles,
      onDelete: "RESTRICT",
    },
    email: {
      type: "text",
      notNull: true,
    },
    phone: {
      type: "text",
    },
    password_hash: {
      type: "text",
      notNull: true,
    },
    first_name: {
      type: "text",
      notNull: true,
    },
    last_name: {
      type: "text",
      notNull: true,
    },
    status: {
      type: "user_status",
      notNull: true,
      default: "active",
    },
    last_login_at: {
      type: "timestamptz",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint(tables.users, "users_unique_email", {
    unique: "email",
  });
  pgm.createIndex(tables.users, ["organizational_unit_id"]);
  pgm.createIndex(tables.users, ["role_id"]);

  pgm.createTable(tables.rolePermissions, {
    role_id: {
      type: "uuid",
      notNull: true,
      references: tables.roles,
      onDelete: "CASCADE",
    },
    permission_id: {
      type: "uuid",
      notNull: true,
      references: tables.permissions,
      onDelete: "CASCADE",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint(tables.rolePermissions, "role_permissions_pk", {
    primaryKey: ["role_id", "permission_id"],
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(tables.rolePermissions);
  pgm.dropTable(tables.users);
  pgm.dropTable(tables.permissions);
  pgm.dropTable(tables.roles);
  pgm.dropTable(tables.organizationalUnits);

  pgm.dropType("user_status");
  pgm.dropType("organizational_unit_type");
}
