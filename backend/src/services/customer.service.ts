import { pool } from "../config/database";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export interface CreateCustomerDTO {
  organizationalUnitId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  dateOfBirth: string;
  gender?: "male" | "female" | "other";
  civilStatus?: "single" | "married" | "widowed" | "separated" | "divorced";
  nationality?: string;
  email?: string;
  mobilePhone: string;
  homePhone?: string;
  addressLine1: string;
  addressLine2?: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  region: string;
  postalCode?: string;
  employmentStatus?: "employed" | "self-employed" | "unemployed" | "retired" | "student";
  employerName?: string;
  occupation?: string;
  monthlyIncome?: number;
  otherIncomeSources?: string;
  tin?: string;
  sssNumber?: string;
  philhealthNumber?: string;
  pagibigNumber?: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
}

export interface UpdateCustomerDTO extends Partial<CreateCustomerDTO> {
  kycStatus?: "pending" | "verified" | "rejected" | "incomplete";
  kycNotes?: string;
  status?: "active" | "inactive" | "blacklisted" | "deceased";
  riskRating?: "low" | "medium" | "high";
  blacklistReason?: string;
}

export class CustomerService {
  private async generateCustomerCode(ouId: string): Promise<string> {
    // Get OU code
    const ouResult = await pool.query(
      "SELECT code FROM organizational_units WHERE id = $1",
      [ouId]
    );

    if (ouResult.rows.length === 0) {
      throw new Error("Organizational unit not found");
    }

    const ouCode = ouResult.rows[0].code;

    // Get count of customers in this OU
    const countResult = await pool.query(
      "SELECT COUNT(*) as count FROM customers WHERE organizational_unit_id = $1",
      [ouId]
    );

    const count = parseInt(countResult.rows[0].count) + 1;
    const paddedCount = count.toString().padStart(6, "0");

    return `${ouCode}-CUST-${paddedCount}`;
  }

  async createCustomer(
    data: CreateCustomerDTO,
    req: AuthenticatedRequest
  ): Promise<any> {
    const customerCode = await this.generateCustomerCode(
      data.organizationalUnitId
    );

    const result = await pool.query(
      `
      INSERT INTO customers (
        organizational_unit_id, customer_code, first_name, middle_name, last_name,
        suffix, date_of_birth, gender, civil_status, nationality,
        email, mobile_phone, home_phone,
        address_line1, address_line2, barangay, city_municipality, province, region, postal_code,
        employment_status, employer_name, occupation, monthly_income, other_income_sources,
        tin, sss_number, philhealth_number, pagibig_number,
        emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
        created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29,
        $30, $31, $32, $33, $33
      )
      RETURNING *
    `,
      [
        data.organizationalUnitId,
        customerCode,
        data.firstName,
        data.middleName,
        data.lastName,
        data.suffix,
        data.dateOfBirth,
        data.gender,
        data.civilStatus,
        data.nationality || "Filipino",
        data.email,
        data.mobilePhone,
        data.homePhone,
        data.addressLine1,
        data.addressLine2,
        data.barangay,
        data.cityMunicipality,
        data.province,
        data.region,
        data.postalCode,
        data.employmentStatus,
        data.employerName,
        data.occupation,
        data.monthlyIncome,
        data.otherIncomeSources,
        data.tin,
        data.sssNumber,
        data.philhealthNumber,
        data.pagibigNumber,
        data.emergencyContactName,
        data.emergencyContactRelationship,
        data.emergencyContactPhone,
        req.user!.userId,
      ]
    );

    return result.rows[0];
  }

  async getCustomers(
    req: AuthenticatedRequest,
    filters: {
      status?: string;
      kycStatus?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ customers: any[]; total: number; page: number; limit: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    let paramCounter = 1;

    // OU filtering - Super Admin sees all, others see only their OU
    if (req.user!.roleName !== "Super Admin") {
      whereClause += ` AND c.organizational_unit_id = $${paramCounter}`;
      params.push(req.user!.organizationalUnitId);
      paramCounter++;
    }

    if (filters.status) {
      whereClause += ` AND c.status = $${paramCounter}`;
      params.push(filters.status);
      paramCounter++;
    }

    if (filters.kycStatus) {
      whereClause += ` AND c.kyc_status = $${paramCounter}`;
      params.push(filters.kycStatus);
      paramCounter++;
    }

    if (filters.search) {
      whereClause += ` AND (
        c.first_name ILIKE $${paramCounter} OR
        c.last_name ILIKE $${paramCounter} OR
        c.customer_code ILIKE $${paramCounter} OR
        c.email ILIKE $${paramCounter} OR
        c.mobile_phone ILIKE $${paramCounter}
      )`;
      params.push(`%${filters.search}%`);
      paramCounter++;
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM customers c ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get customers
    const result = await pool.query(
      `
      SELECT 
        c.*,
        ou.name as organizational_unit_name,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM customers c
      INNER JOIN organizational_units ou ON c.organizational_unit_id = ou.id
      INNER JOIN users u ON c.created_by = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `,
      [...params, limit, offset]
    );

    return {
      customers: result.rows,
      total,
      page,
      limit,
    };
  }

  async getCustomerById(id: string, req: AuthenticatedRequest): Promise<any> {
    const result = await pool.query(
      `
      SELECT 
        c.*,
        ou.name as organizational_unit_name,
        u.first_name || ' ' || u.last_name as created_by_name,
        u2.first_name || ' ' || u2.last_name as kyc_verified_by_name
      FROM customers c
      INNER JOIN organizational_units ou ON c.organizational_unit_id = ou.id
      INNER JOIN users u ON c.created_by = u.id
      LEFT JOIN users u2 ON c.kyc_verified_by = u2.id
      WHERE c.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const customer = result.rows[0];

    // OU check - Super Admin can see all
    if (
      req.user!.roleName !== "Super Admin" &&
      customer.organizational_unit_id !== req.user!.organizationalUnitId
    ) {
      return null;
    }

    return customer;
  }

  async updateCustomer(
    id: string,
    data: UpdateCustomerDTO,
    req: AuthenticatedRequest
  ): Promise<any> {
    // First check if customer exists and user has access
    const existing = await this.getCustomerById(id, req);
    if (!existing) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    // Build dynamic update query
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        updates.push(`${snakeKey} = $${paramCounter}`);
        values.push(value);
        paramCounter++;
      }
    });

    if (updates.length === 0) {
      return existing;
    }

    // Add updated_by and updated_at
    updates.push(`updated_by = $${paramCounter}`);
    values.push(req.user!.userId);
    paramCounter++;

    updates.push(`updated_at = NOW()`);

    values.push(id);

    const result = await pool.query(
      `
      UPDATE customers 
      SET ${updates.join(", ")}
      WHERE id = $${paramCounter}
      RETURNING *
    `,
      values
    );

    return result.rows[0];
  }

  async verifyKYC(
    id: string,
    status: "verified" | "rejected",
    notes: string,
    req: AuthenticatedRequest
  ): Promise<any> {
    const existing = await this.getCustomerById(id, req);
    if (!existing) {
      return null;
    }

    const result = await pool.query(
      `
      UPDATE customers 
      SET 
        kyc_status = $1,
        kyc_notes = $2,
        kyc_verified_by = $3,
        kyc_verified_at = NOW(),
        updated_by = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `,
      [status, notes, req.user!.userId, id]
    );

    return result.rows[0];
  }
}

export const customerService = new CustomerService();
