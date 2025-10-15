import { pool } from '../config/database';
import HttpException from '../utils/http-exception';

interface PaymentScheduleItem {
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  installmentAmount: number;
  balance: number;
}

interface GenerateScheduleInput {
  loanId: string;
  principalAmount: number;
  interestRate: number;
  term: number;
  paymentFrequency: 'daily' | 'weekly' | 'monthly' | 'semi-monthly' | 'bi-weekly';
  interestMethod: 'flat' | 'diminishing' | 'add-on';
  startDate: Date;
  processingFee?: number;
}

export class PaymentScheduleService {
  /**
   * Calculate the next due date based on payment frequency
   */
  private calculateNextDueDate(
    currentDate: Date,
    frequency: string,
    installmentNumber: number
  ): Date {
    const nextDate = new Date(currentDate);

    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;

      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;

      case 'bi-weekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;

      case 'semi-monthly':
        // Pay on 15th and 30th/end of month
        if (installmentNumber % 2 === 1) {
          // First payment of month - set to 15th
          nextDate.setDate(15);
        } else {
          // Second payment - set to last day of month
          nextDate.setMonth(nextDate.getMonth() + 1);
          nextDate.setDate(0); // Sets to last day of previous month
        }
        break;

      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;

      default:
        throw new HttpException(400, 'Invalid payment frequency');
    }

    return nextDate;
  }

  /**
   * Generate payment schedule with flat interest method
   */
  private generateFlatSchedule(input: GenerateScheduleInput): PaymentScheduleItem[] {
    const {
      principalAmount,
      interestRate,
      term,
      paymentFrequency,
      startDate,
      processingFee = 0
    } = input;

    // Calculate total interest
    const totalInterest = principalAmount * (interestRate / 100) * term;
    const totalAmount = principalAmount + totalInterest + processingFee;

    // Determine number of installments based on frequency
    let numberOfInstallments = term;
    switch (paymentFrequency) {
      case 'semi-monthly':
        numberOfInstallments = term * 2;
        break;
      case 'bi-weekly':
        numberOfInstallments = Math.ceil(term * 2.17); // ~26 per year
        break;
    }

    const installmentAmount = totalAmount / numberOfInstallments;
    const principalPerInstallment = principalAmount / numberOfInstallments;
    const interestPerInstallment = totalInterest / numberOfInstallments;

    const schedule: PaymentScheduleItem[] = [];
    let currentDate = new Date(startDate);
    let remainingBalance = totalAmount;

    for (let i = 1; i <= numberOfInstallments; i++) {
      currentDate = this.calculateNextDueDate(currentDate, paymentFrequency, i);
      remainingBalance -= installmentAmount;

      schedule.push({
        installmentNumber: i,
        dueDate: new Date(currentDate),
        principalAmount: Math.round(principalPerInstallment * 100) / 100,
        interestAmount: Math.round(interestPerInstallment * 100) / 100,
        installmentAmount: Math.round(installmentAmount * 100) / 100,
        balance: Math.max(0, Math.round(remainingBalance * 100) / 100)
      });
    }

    return schedule;
  }

  /**
   * Generate payment schedule with diminishing balance method
   */
  private generateDiminishingSchedule(input: GenerateScheduleInput): PaymentScheduleItem[] {
    const {
      principalAmount,
      interestRate,
      term,
      paymentFrequency,
      startDate
    } = input;

    // Convert annual rate to periodic rate
    let periodicRate: number;
    let numberOfInstallments = term;

    switch (paymentFrequency) {
      case 'daily':
        periodicRate = (interestRate / 100) / 365;
        numberOfInstallments = term;
        break;
      case 'weekly':
        periodicRate = (interestRate / 100) / 52;
        numberOfInstallments = term;
        break;
      case 'bi-weekly':
        periodicRate = (interestRate / 100) / 26;
        numberOfInstallments = Math.ceil(term * 2.17);
        break;
      case 'semi-monthly':
        periodicRate = (interestRate / 100) / 24;
        numberOfInstallments = term * 2;
        break;
      case 'monthly':
      default:
        periodicRate = (interestRate / 100) / 12;
        numberOfInstallments = term;
        break;
    }

    // Calculate fixed installment using amortization formula
    // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
    const installmentAmount = principalAmount * 
      (periodicRate * Math.pow(1 + periodicRate, numberOfInstallments)) /
      (Math.pow(1 + periodicRate, numberOfInstallments) - 1);

    const schedule: PaymentScheduleItem[] = [];
    let currentDate = new Date(startDate);
    let remainingPrincipal = principalAmount;

    for (let i = 1; i <= numberOfInstallments; i++) {
      currentDate = this.calculateNextDueDate(currentDate, paymentFrequency, i);

      // Interest on remaining principal
      const interestAmount = remainingPrincipal * periodicRate;
      const principalPaid = installmentAmount - interestAmount;
      remainingPrincipal -= principalPaid;

      schedule.push({
        installmentNumber: i,
        dueDate: new Date(currentDate),
        principalAmount: Math.round(principalPaid * 100) / 100,
        interestAmount: Math.round(interestAmount * 100) / 100,
        installmentAmount: Math.round(installmentAmount * 100) / 100,
        balance: Math.max(0, Math.round(remainingPrincipal * 100) / 100)
      });
    }

    return schedule;
  }

  /**
   * Generate payment schedule with add-on method
   */
  private generateAddOnSchedule(input: GenerateScheduleInput): PaymentScheduleItem[] {
    // Add-on is similar to flat rate but may have different calculation context
    // For this implementation, we'll treat it the same as flat
    return this.generateFlatSchedule(input);
  }

  /**
   * Generate complete payment schedule for a loan
   */
  async generateSchedule(input: GenerateScheduleInput): Promise<PaymentScheduleItem[]> {
    let schedule: PaymentScheduleItem[];

    switch (input.interestMethod) {
      case 'flat':
        schedule = this.generateFlatSchedule(input);
        break;
      case 'diminishing':
        schedule = this.generateDiminishingSchedule(input);
        break;
      case 'add-on':
        schedule = this.generateAddOnSchedule(input);
        break;
      default:
        throw new HttpException(400, 'Invalid interest method');
    }

    return schedule;
  }

  /**
   * Save payment schedule to database
   */
  async saveSchedule(loanId: string, schedule: PaymentScheduleItem[]): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Delete existing schedule if any
      await client.query('DELETE FROM payment_schedules WHERE loan_id = $1', [loanId]);

      // Insert new schedule
      for (const item of schedule) {
        await client.query(
          `INSERT INTO payment_schedules (
            loan_id, installment_number, due_date,
            principal_amount, interest_amount, installment_amount,
            balance, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            loanId,
            item.installmentNumber,
            item.dueDate,
            item.principalAmount,
            item.interestAmount,
            item.installmentAmount,
            item.balance,
            'pending'
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get payment schedule for a loan
   */
  async getSchedule(loanId: string): Promise<PaymentScheduleItem[]> {
    const result = await pool.query(
      `SELECT 
        installment_number,
        due_date,
        principal_amount,
        interest_amount,
        installment_amount,
        balance,
        status,
        paid_amount,
        paid_date
      FROM payment_schedules
      WHERE loan_id = $1
      ORDER BY installment_number ASC`,
      [loanId]
    );

    return result.rows;
  }

  /**
   * Generate and save schedule when loan is disbursed
   */
  async generateAndSaveSchedule(loanId: string): Promise<PaymentScheduleItem[]> {
    // Get loan details
    const loanResult = await pool.query(
      `SELECT 
        l.*,
        lp.processing_fee
      FROM loans l
      JOIN loan_products lp ON l.loan_product_id = lp.id
      WHERE l.id = $1`,
      [loanId]
    );

    if (loanResult.rows.length === 0) {
      throw new HttpException(404, 'Loan not found');
    }

    const loan = loanResult.rows[0];

    if (loan.status !== 'disbursed' && loan.status !== 'active') {
      throw new HttpException(400, 'Payment schedule can only be generated for disbursed or active loans');
    }

    // Generate schedule
    const schedule = await this.generateSchedule({
      loanId: loan.id,
      principalAmount: loan.principal_amount,
      interestRate: loan.interest_rate,
      term: loan.term,
      paymentFrequency: loan.payment_frequency,
      interestMethod: loan.interest_method || 'flat',
      startDate: loan.disbursed_at || new Date(),
      processingFee: loan.processing_fee
    });

    // Save to database
    await this.saveSchedule(loanId, schedule);

    return schedule;
  }

  /**
   * Update loan status to active after schedule generation
   */
  async activateLoan(loanId: string): Promise<void> {
    await pool.query(
      `UPDATE loans 
       SET status = 'active', 
           first_payment_date = (
             SELECT MIN(due_date) 
             FROM payment_schedules 
             WHERE loan_id = $1
           ),
           maturity_date = (
             SELECT MAX(due_date) 
             FROM payment_schedules 
             WHERE loan_id = $1
           ),
           updated_at = NOW()
       WHERE id = $1`,
      [loanId]
    );
  }
}
