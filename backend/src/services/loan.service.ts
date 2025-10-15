import { pool } from '../config/database';
import HttpException from '../utils/http-exception';
import { PaymentScheduleService } from './payment-schedule.service';

interface LoanCalculation {
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  installmentAmount: number;
  numberOfInstallments: number;
}

interface CreateLoanInput {
  customerId: string;
  loanProductId: string;
  requestedAmount: number;
  loanPurpose: string;
  employmentStatus: string;
  monthlyIncome: number;
  sourceOfIncome: string;
  collaterals?: Array<{
    collateralType: string;
    description: string;
    estimatedValue: number;
  }>;
  comakers?: Array<{
    firstName: string;
    lastName: string;
    relationship: string;
    contactNumber: string;
    address: string;
  }>;
}

export class LoanService {
  private paymentScheduleService: PaymentScheduleService;

  constructor() {
    this.paymentScheduleService = new PaymentScheduleService();
  }

  /**
   * Generate unique loan number with format: LOAN-YYYY-XXXXX
   */
  async generateLoanNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM loans WHERE EXTRACT(YEAR FROM created_at) = $1`,
      [year]
    );
    const count = parseInt(result.rows[0].count) + 1;
    const paddedCount = count.toString().padStart(5, '0');
    return `LOAN-${year}-${paddedCount}`;
  }

  /**
   * Calculate loan amounts based on product configuration
   */
  async calculateLoan(
    loanProductId: string,
    principalAmount: number,
    term: number
  ): Promise<LoanCalculation> {
    // Get loan product details
    const productResult = await pool.query(
      `SELECT * FROM loan_products WHERE id = $1 AND is_active = true`,
      [loanProductId]
    );

    if (productResult.rows.length === 0) {
      throw new HttpException(404, 'Loan product not found or inactive');
    }

    const product = productResult.rows[0];

    // Validate amount against min/max
    if (principalAmount < product.min_amount || principalAmount > product.max_amount) {
      throw new HttpException(
        400,
        `Loan amount must be between ${product.min_amount} and ${product.max_amount}`
      );
    }

    // Validate term
    if (term < product.min_term || term > product.max_term) {
      throw new HttpException(
        400,
        `Loan term must be between ${product.min_term} and ${product.max_term}`
      );
    }

    let interestAmount = 0;
    let numberOfInstallments = term;

    // Calculate based on payment frequency
    switch (product.payment_frequency) {
      case 'daily':
        numberOfInstallments = term;
        break;
      case 'weekly':
        numberOfInstallments = term;
        break;
      case 'monthly':
        numberOfInstallments = term;
        break;
      case 'semi-monthly':
        numberOfInstallments = term * 2;
        break;
      case 'bi-weekly':
        numberOfInstallments = Math.ceil(term * 2.17); // approximately 26 payments per year
        break;
    }

    // Calculate interest based on method
    switch (product.interest_method) {
      case 'flat':
        // Flat rate: Interest = Principal × Rate × Term
        interestAmount = principalAmount * (product.interest_rate / 100) * term;
        break;
      
      case 'diminishing':
        // Diminishing balance (simple approximation)
        // More accurate calculation would require iterative computation
        const monthlyRate = product.interest_rate / 100 / 12;
        const months = product.payment_frequency === 'monthly' ? term : 
                      product.payment_frequency === 'weekly' ? Math.ceil(term / 4.33) :
                      product.payment_frequency === 'daily' ? Math.ceil(term / 30) : term;
        
        const payment = principalAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                       (Math.pow(1 + monthlyRate, months) - 1);
        interestAmount = (payment * months) - principalAmount;
        break;
      
      case 'add-on':
        // Add-on rate: Similar to flat but different calculation context
        interestAmount = principalAmount * (product.interest_rate / 100) * term;
        break;
      
      default:
        throw new HttpException(400, 'Invalid interest method');
    }

    const totalAmount = principalAmount + interestAmount + product.processing_fee;
    const installmentAmount = totalAmount / numberOfInstallments;

    return {
      principalAmount,
      interestAmount: Math.round(interestAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      installmentAmount: Math.round(installmentAmount * 100) / 100,
      numberOfInstallments
    };
  }

  /**
   * Create a new loan application
   */
  async createLoan(userId: string, ouId: string, input: CreateLoanInput) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verify customer exists and belongs to same OU
      const customerResult = await client.query(
        `SELECT id, ou_id FROM customers WHERE id = $1`,
        [input.customerId]
      );

      if (customerResult.rows.length === 0) {
        throw new HttpException(404, 'Customer not found');
      }

      // Get loan product to determine term
      const productResult = await client.query(
        `SELECT * FROM loan_products WHERE id = $1 AND is_active = true`,
        [input.loanProductId]
      );

      if (productResult.rows.length === 0) {
        throw new HttpException(404, 'Loan product not found');
      }

      const product = productResult.rows[0];
      const defaultTerm = Math.floor((product.min_term + product.max_term) / 2);

      // Calculate loan amounts
      const calculation = await this.calculateLoan(
        input.loanProductId,
        input.requestedAmount,
        defaultTerm
      );

      // Generate loan number
      const loanNumber = await this.generateLoanNumber();

      // Insert loan
      const loanResult = await client.query(
        `INSERT INTO loans (
          loan_number, customer_id, loan_product_id, ou_id,
          requested_amount, approved_amount, principal_amount, 
          interest_amount, total_amount, balance,
          interest_rate, term, payment_frequency,
          loan_purpose, employment_status, monthly_income, 
          source_of_income, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *`,
        [
          loanNumber,
          input.customerId,
          input.loanProductId,
          ouId,
          input.requestedAmount,
          input.requestedAmount,
          calculation.principalAmount,
          calculation.interestAmount,
          calculation.totalAmount,
          calculation.totalAmount,
          product.interest_rate,
          defaultTerm,
          product.payment_frequency,
          input.loanPurpose,
          input.employmentStatus,
          input.monthlyIncome,
          input.sourceOfIncome,
          'draft',
          userId
        ]
      );

      const loan = loanResult.rows[0];

      // Insert collaterals if provided
      if (input.collaterals && input.collaterals.length > 0) {
        for (const collateral of input.collaterals) {
          await client.query(
            `INSERT INTO collaterals (
              loan_id, collateral_type, description, estimated_value
            ) VALUES ($1, $2, $3, $4)`,
            [
              loan.id,
              collateral.collateralType,
              collateral.description,
              collateral.estimatedValue
            ]
          );
        }
      }

      // Insert comakers if provided
      if (input.comakers && input.comakers.length > 0) {
        for (const comaker of input.comakers) {
          await client.query(
            `INSERT INTO comakers (
              loan_id, first_name, last_name, relationship, 
              contact_number, address
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              loan.id,
              comaker.firstName,
              comaker.lastName,
              comaker.relationship,
              comaker.contactNumber,
              comaker.address
            ]
          );
        }
      }

      await client.query('COMMIT');

      // Return loan with related data
      return this.getLoanById(loan.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get loan by ID with related data
   */
  async getLoanById(loanId: string) {
    const loanResult = await pool.query(
      `SELECT 
        l.*,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.email as customer_email,
        c.phone as customer_phone,
        lp.name as product_name,
        lp.loan_type,
        ou.name as ou_name
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_products lp ON l.loan_product_id = lp.id
      JOIN organizational_units ou ON l.ou_id = ou.id
      WHERE l.id = $1`,
      [loanId]
    );

    if (loanResult.rows.length === 0) {
      throw new HttpException(404, 'Loan not found');
    }

    const loan = loanResult.rows[0];

    // Get collaterals
    const collateralsResult = await pool.query(
      `SELECT * FROM collaterals WHERE loan_id = $1`,
      [loanId]
    );

    // Get comakers
    const comakersResult = await pool.query(
      `SELECT * FROM comakers WHERE loan_id = $1`,
      [loanId]
    );

    return {
      ...loan,
      collaterals: collateralsResult.rows,
      comakers: comakersResult.rows
    };
  }

  /**
   * Get all loans with filters
   */
  async getLoans(filters: {
    ouId?: string;
    status?: string;
    customerId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params: any[] = [];
    let paramCount = 1;

    if (filters.ouId) {
      whereConditions.push(`l.ou_id = $${paramCount}`);
      params.push(filters.ouId);
      paramCount++;
    }

    if (filters.status) {
      whereConditions.push(`l.status = $${paramCount}`);
      params.push(filters.status);
      paramCount++;
    }

    if (filters.customerId) {
      whereConditions.push(`l.customer_id = $${paramCount}`);
      params.push(filters.customerId);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM loans l ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get loans
    params.push(limit, offset);
    const loansResult = await pool.query(
      `SELECT 
        l.*,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        lp.name as product_name,
        ou.name as ou_name
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_products lp ON l.loan_product_id = lp.id
      JOIN organizational_units ou ON l.ou_id = ou.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    return {
      data: loansResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update loan status
   */
  async updateLoanStatus(
    loanId: string,
    status: string,
    userId: string,
    remarks?: string
  ) {
    const validStatuses = [
      'draft', 'pending', 'under_review', 'approved', 
      'rejected', 'disbursed', 'active', 'completed', 
      'written_off', 'cancelled'
    ];

    if (!validStatuses.includes(status)) {
      throw new HttpException(400, 'Invalid loan status');
    }

    const result = await pool.query(
      `UPDATE loans 
       SET status = $1, 
           ${status === 'approved' ? 'approved_by = $3, approved_at = NOW(),' : ''}
           ${status === 'disbursed' ? 'disbursed_by = $3, disbursed_at = NOW(),' : ''}
           ${status === 'rejected' ? 'rejection_reason = $4,' : ''}
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      status === 'rejected' 
        ? [status, loanId, userId, remarks]
        : [status, loanId, userId]
    );

    if (result.rows.length === 0) {
      throw new HttpException(404, 'Loan not found');
    }

    // If loan is disbursed, generate payment schedule and activate
    if (status === 'disbursed') {
      await this.paymentScheduleService.generateAndSaveSchedule(loanId);
      await this.paymentScheduleService.activateLoan(loanId);
    }

    return this.getLoanById(loanId);
  }

  /**
   * Delete loan (only if in draft status)
   */
  async deleteLoan(loanId: string) {
    const loan = await this.getLoanById(loanId);

    if (loan.status !== 'draft') {
      throw new HttpException(400, 'Only draft loans can be deleted');
    }

    await pool.query('DELETE FROM loans WHERE id = $1', [loanId]);
  }

  /**
   * Get payment schedule for a loan
   */
  async getPaymentSchedule(loanId: string) {
    return this.paymentScheduleService.getSchedule(loanId);
  }
}
