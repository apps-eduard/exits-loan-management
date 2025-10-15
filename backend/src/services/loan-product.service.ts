import { pool } from "../config/database";

export class LoanProductService {
  async getAllProducts(filters?: { isActive?: boolean; productType?: string }) {
    let query = "SELECT * FROM loan_products WHERE 1=1";
    const params: any[] = [];
    let paramCounter = 1;

    if (filters?.isActive !== undefined) {
      query += ` AND is_active = $${paramCounter}`;
      params.push(filters.isActive);
      paramCounter++;
    }

    if (filters?.productType) {
      query += ` AND product_type = $${paramCounter}`;
      params.push(filters.productType);
      paramCounter++;
    }

    query += " ORDER BY product_type, code";

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getProductById(id: string) {
    const result = await pool.query(
      "SELECT * FROM loan_products WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  }

  async getProductByCode(code: string) {
    const result = await pool.query(
      "SELECT * FROM loan_products WHERE code = $1",
      [code]
    );
    return result.rows[0] || null;
  }
}

export const loanProductService = new LoanProductService();
