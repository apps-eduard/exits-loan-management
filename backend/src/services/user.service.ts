import bcrypt from "bcryptjs";
import { pool } from "../config/database";
import HttpException from "../utils/http-exception";
import { StatusCodes } from "http-status-codes";

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roleId: string;
  organizationalUnitId?: string; // Optional - will use tenant's Head Office by default
  tenant_id?: string; // Added for automatic tenant assignment
  password: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roleId?: string;
  organizationalUnitId?: string;
  status?: "active" | "inactive" | "suspended";
}

export interface UserFilters {
  search?: string;
  roleId?: string;
  organizationalUnitId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class UserService {
  async getUsers(filters: UserFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (filters.search) {
      whereConditions.push(
        `(u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`
      );
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.roleId) {
      whereConditions.push(`u.role_id = $${paramIndex}`);
      params.push(filters.roleId);
      paramIndex++;
    }

    if (filters.organizationalUnitId) {
      whereConditions.push(`u.organizational_unit_id = $${paramIndex}`);
      params.push(filters.organizationalUnitId);
      paramIndex++;
    }

    if (filters.status) {
      whereConditions.push(`u.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users u ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get users
    const usersQuery = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name,
        r.name as role_name,
        ou.name as organizational_unit_name,
        u.status, u.last_login_at, u.created_at
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      INNER JOIN organizational_units ou ON u.organizational_unit_id = ou.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const usersResult = await pool.query(usersQuery, [
      ...params,
      limit,
      offset,
    ]);

    const users = usersResult.rows.map((row) => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      roleName: row.role_name,
      organizationalUnitName: row.organizational_unit_name,
      status: row.status,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
    }));

    return { users, total };
  }

  async getUserById(id: string) {
    const result = await pool.query(
      `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.phone,
        u.role_id, u.organizational_unit_id, u.status,
        u.last_login_at, u.created_at, u.updated_at,
        r.id as role_id, r.name as role_name, r.description as role_description, r.is_default as role_is_default,
        ou.id as ou_id, ou.name as ou_name, ou.code as ou_code, ou.type as ou_type, ou.description as ou_description
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      INNER JOIN organizational_units ou ON u.organizational_unit_id = ou.id
      WHERE u.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      throw new HttpException(StatusCodes.NOT_FOUND, "User not found");
    }

    const row = result.rows[0];

    // Get user permissions
    const permissionsResult = await pool.query(
      `
      SELECT DISTINCT p.id, p.name, p.description, p.resource, p.action
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1
      ORDER BY p.resource, p.action
    `,
      [row.role_id]
    );

    const user = {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      phoneNumber: row.phone,
      roleId: row.role_id,
      role: {
        id: row.role_id,
        name: row.role_name,
        description: row.role_description,
        isDefault: row.role_is_default,
      },
      organizationalUnitId: row.ou_id,
      organizationalUnit: {
        id: row.ou_id,
        name: row.ou_name,
        code: row.ou_code,
        type: row.ou_type,
        description: row.ou_description,
      },
      status: row.status,
      permissions: permissionsResult.rows.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        resource: p.resource,
        action: p.action,
      })),
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return user;
  }

  async createUser(userData: CreateUserDto) {
    // Check if email already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [userData.email]
    );

    if (existingUser.rows.length > 0) {
      throw new HttpException(
        StatusCodes.CONFLICT,
        "User with this email already exists"
      );
    }

    // Get tenant's Head Office organizational unit
    const headOfficeResult = await pool.query(
      `SELECT id FROM organizational_units 
       WHERE tenant_id = $1 AND (code LIKE '%-HQ' OR code = 'HQ' OR name = 'Head Office')
       ORDER BY created_at ASC
       LIMIT 1`,
      [userData.tenant_id]
    );

    if (headOfficeResult.rows.length === 0) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        "No Head Office organizational unit found for this tenant"
      );
    }

    const headOfficeId = headOfficeResult.rows[0].id;

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 10);

    // Insert user with tenant's Head Office as default OU
    const result = await pool.query(
      `
      INSERT INTO users (
        email, first_name, last_name, phone, 
        role_id, organizational_unit_id, tenant_id, password_hash, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'invited')
      RETURNING id
    `,
      [
        userData.email,
        userData.firstName,
        userData.lastName,
        userData.phoneNumber,
        userData.roleId,
        headOfficeId, // Use tenant's Head Office instead of userData.organizationalUnitId
        userData.tenant_id,
        passwordHash,
      ]
    );

    const userId = result.rows[0].id;
    return this.getUserById(userId);
  }

  async updateUser(id: string, userData: UpdateUserDto) {
    // Check if user exists
    const existingUser = await pool.query("SELECT id FROM users WHERE id = $1", [
      id,
    ]);

    if (existingUser.rows.length === 0) {
      throw new HttpException(StatusCodes.NOT_FOUND, "User not found");
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (userData.firstName !== undefined) {
      updates.push(`first_name = $${paramIndex}`);
      params.push(userData.firstName);
      paramIndex++;
    }

    if (userData.lastName !== undefined) {
      updates.push(`last_name = $${paramIndex}`);
      params.push(userData.lastName);
      paramIndex++;
    }

    if (userData.phoneNumber !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      params.push(userData.phoneNumber);
      paramIndex++;
    }

    if (userData.roleId !== undefined) {
      updates.push(`role_id = $${paramIndex}`);
      params.push(userData.roleId);
      paramIndex++;
    }

    if (userData.organizationalUnitId !== undefined) {
      updates.push(`organizational_unit_id = $${paramIndex}`);
      params.push(userData.organizationalUnitId);
      paramIndex++;
    }

    if (userData.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(userData.status);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.getUserById(id);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
      params
    );

    return this.getUserById(id);
  }

  async deleteUser(id: string) {
    const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      throw new HttpException(StatusCodes.NOT_FOUND, "User not found");
    }
  }

  async updateUserStatus(
    id: string,
    status: "active" | "inactive" | "suspended"
  ) {
    const result = await pool.query(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
      [status, id]
    );

    if (result.rows.length === 0) {
      throw new HttpException(StatusCodes.NOT_FOUND, "User not found");
    }

    return this.getUserById(id);
  }

  async resetUserPassword(id: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
      [passwordHash, id]
    );

    if (result.rows.length === 0) {
      throw new HttpException(StatusCodes.NOT_FOUND, "User not found");
    }
  }

  async getRoles() {
    const result = await pool.query(`
      SELECT id, name, description, is_default, created_at
      FROM roles
      ORDER BY name
    `);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      isDefault: row.is_default,
      createdAt: row.created_at,
    }));
  }

  async getPermissions() {
    const result = await pool.query(`
      SELECT id, name, description, resource, action
      FROM permissions
      ORDER BY resource, action
    `);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      resource: row.resource,
      action: row.action,
    }));
  }

  async getRolePermissions(roleId: string) {
    const result = await pool.query(
      `
      SELECT DISTINCT p.id, p.name, p.description, p.resource, p.action
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1
      ORDER BY p.resource, p.action
    `,
      [roleId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      resource: row.resource,
      action: row.action,
    }));
  }

  async getOrganizationalUnits() {
    const result = await pool.query(
      `
      SELECT id, name, code, type, description, parent_id
      FROM organizational_units
      ORDER BY name ASC
    `
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      type: row.type,
      description: row.description,
      parentId: row.parent_id,
    }));
  }
}
