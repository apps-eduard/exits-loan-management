import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { pool } from "../config/database";

export interface TokenPayload {
  userId: string;
  email: string;
  roleId: string;
  roleName: string;
  organizationalUnitId: string;
  tenantId: string; // For multi-tenant isolation
  isSuperAdmin: boolean; // Can access all tenants
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserWithRole {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  roleName: string;
  organizationalUnitId: string;
  organizationalUnitName: string;
  tenantId: string; // For multi-tenant isolation
  isSuperAdmin: boolean; // Can access all tenants
  status: string;
}

export class AuthService {
  async validateCredentials(
    email: string,
    password: string
  ): Promise<UserWithRole | null> {
    // First, try to find in users table (staff/admin)
    let result = await pool.query(
      `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.password_hash,
        u.role_id, r.name as role_name, u.status,
        u.organizational_unit_id, ou.name as organizational_unit_name,
        u.tenant_id,
        COALESCE(u.is_super_admin, false) as is_super_admin,
        'user' as user_type
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      INNER JOIN organizational_units ou ON u.organizational_unit_id = ou.id
      WHERE u.email = $1
    `,
      [email]
    );

    // If not found in users, try customers table
    if (result.rows.length === 0) {
      result = await pool.query(
        `
        SELECT 
          c.id, c.email, c.first_name, c.last_name, c.password_hash,
          'customer' as role_id, 'Customer' as role_name, c.status,
          c.organizational_unit_id, ou.name as organizational_unit_name,
          c.tenant_id,
          false as is_super_admin,
          'customer' as user_type
        FROM customers c
        INNER JOIN organizational_units ou ON c.organizational_unit_id = ou.id
        WHERE c.email = $1
      `,
        [email]
      );
    }

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    if (user.status !== "active") {
      return null;
    }

    // Check if password_hash exists (for customers registered before password feature)
    if (!user.password_hash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return null;
    }

    // Update last login based on user type
    if (user.user_type === 'customer') {
      await pool.query(
        "UPDATE customers SET last_login_at = NOW() WHERE id = $1",
        [user.id]
      );
    } else {
      await pool.query(
        "UPDATE users SET last_login_at = NOW() WHERE id = $1",
        [user.id]
      );
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      roleId: user.role_id,
      roleName: user.role_name,
      organizationalUnitId: user.organizational_unit_id,
      organizationalUnitName: user.organizational_unit_name,
      tenantId: user.tenant_id,
      isSuperAdmin: user.is_super_admin || false,
      status: user.status,
    };
  }

  generateTokens(user: UserWithRole): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.roleName,
      organizationalUnitId: user.organizationalUnitId,
      tenantId: user.tenantId,
      isSuperAdmin: user.isSuperAdmin,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(
      { userId: user.id },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      } as jwt.SignOptions
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  }

  verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
  }

  async getUserById(userId: string): Promise<UserWithRole | null> {
    const result = await pool.query(
      `
      SELECT 
        u.id, u.email, u.first_name, u.last_name,
        u.role_id, r.name as role_name, u.status,
        u.organizational_unit_id, ou.name as organizational_unit_name,
        u.tenant_id,
        COALESCE(u.is_super_admin, false) as is_super_admin
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      INNER JOIN organizational_units ou ON u.organizational_unit_id = ou.id
      WHERE u.id = $1 AND u.status = 'active'
    `,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      roleId: user.role_id,
      roleName: user.role_name,
      organizationalUnitId: user.organizational_unit_id,
      organizationalUnitName: user.organizational_unit_name,
      tenantId: user.tenant_id,
      isSuperAdmin: user.is_super_admin || false,
      status: user.status,
    };
  }

  async getUserPermissions(roleId: string): Promise<string[]> {
    // Customers don't have permissions in the role_permissions table
    if (roleId === 'customer') {
      return ['view_own_loans', 'apply_for_loan', 'make_payment', 'view_own_profile'];
    }

    const result = await pool.query(
      `
      SELECT p.key
      FROM role_permissions rp
      INNER JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = $1
    `,
      [roleId]
    );

    return result.rows.map((row: { key: string }) => row.key);
  }
}

export const authService = new AuthService();
