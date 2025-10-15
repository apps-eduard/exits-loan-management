import { pool } from '../config/database';
import HttpException from '../utils/http-exception';

interface PaymentAllocation {
  penalties: number;
  interest: number;
  principal: number;
  advance: number; // Advance payment for future installments
}

interface PostPaymentInput {
  loanId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'gcash' | 'paymaya';
  referenceNumber?: string;
  remarks?: string;
  collectedBy: string;
}

interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  loanId: string;
  loanNumber: string;
  customerName: string;
  amount: number;
  paymentDate: Date;
  allocation: PaymentAllocation;
  paymentMethod: string;
  referenceNumber?: string;
  collectedBy: string;
  collectedByName: string;
}

export class PaymentService {
  /**
   * Generate unique receipt number with format: RCP-YYYY-XXXXX
   */
  async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM payments WHERE EXTRACT(YEAR FROM payment_date) = $1`,
      [year]
    );
    const count = parseInt(result.rows[0].count) + 1;
    const paddedCount = count.toString().padStart(5, '0');
    return `RCP-${year}-${paddedCount}`;
  }

  /**
   * Calculate penalty for overdue payments
   */
  private calculatePenalty(
    dueDate: Date,
    paymentDate: Date,
    installmentAmount: number,
    penaltyRate: number = 0.05 // 5% default penalty rate
  ): number {
    const today = new Date(paymentDate);
    today.setHours(0, 0, 0, 0);
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    if (today <= due) {
      return 0; // No penalty if paid on or before due date
    }

    const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate penalty: installment amount × penalty rate
    // Some systems calculate daily penalty, here we use a one-time penalty
    const penalty = installmentAmount * penaltyRate;
    
    return Math.round(penalty * 100) / 100;
  }

  /**
   * Allocate payment amount according to priority:
   * 1. Penalties (overdue charges)
   * 2. Interest
   * 3. Principal
   * 4. Advance payment (if any amount remains)
   */
  private allocatePayment(
    amount: number,
    pendingPenalties: number,
    pendingInterest: number,
    pendingPrincipal: number
  ): PaymentAllocation {
    let remaining = amount;
    const allocation: PaymentAllocation = {
      penalties: 0,
      interest: 0,
      principal: 0,
      advance: 0
    };

    // 1. Allocate to penalties first
    if (remaining > 0 && pendingPenalties > 0) {
      const penaltyPayment = Math.min(remaining, pendingPenalties);
      allocation.penalties = penaltyPayment;
      remaining -= penaltyPayment;
    }

    // 2. Allocate to interest
    if (remaining > 0 && pendingInterest > 0) {
      const interestPayment = Math.min(remaining, pendingInterest);
      allocation.interest = interestPayment;
      remaining -= interestPayment;
    }

    // 3. Allocate to principal
    if (remaining > 0 && pendingPrincipal > 0) {
      const principalPayment = Math.min(remaining, pendingPrincipal);
      allocation.principal = principalPayment;
      remaining -= principalPayment;
    }

    // 4. Remaining amount is advance payment
    if (remaining > 0) {
      allocation.advance = remaining;
    }

    return allocation;
  }

  /**
   * Post a payment and update loan/schedule records
   */
  async postPayment(input: PostPaymentInput): Promise<PaymentReceipt> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Get loan details
      const loanResult = await client.query(
        `SELECT 
          l.*,
          c.first_name || ' ' || c.last_name as customer_name,
          u.first_name || ' ' || u.last_name as collector_name
        FROM loans l
        JOIN customers c ON l.customer_id = c.id
        JOIN users u ON u.id = $2
        WHERE l.id = $1 AND l.status IN ('active', 'disbursed')`,
        [input.loanId, input.collectedBy]
      );

      if (loanResult.rows.length === 0) {
        throw new HttpException(404, 'Active loan not found');
      }

      const loan = loanResult.rows[0];

      // 2. Get pending payment schedules (oldest first)
      const scheduleResult = await client.query(
        `SELECT * FROM payment_schedules
         WHERE loan_id = $1 AND status IN ('pending', 'partial')
         ORDER BY installment_number ASC`,
        [input.loanId]
      );

      if (scheduleResult.rows.length === 0) {
        throw new HttpException(400, 'No pending installments found');
      }

      // 3. Calculate total pending amounts
      let remainingPayment = input.amount;
      const updatedSchedules = [];

      for (const schedule of scheduleResult.rows) {
        if (remainingPayment <= 0) break;

        // Calculate penalty if overdue
        const penalty = this.calculatePenalty(
          schedule.due_date,
          input.paymentDate,
          schedule.installment_amount
        );

        // Calculate pending amounts for this installment
        const paidSoFar = schedule.paid_amount || 0;
        const pendingPenalties = penalty - (schedule.penalty_amount || 0);
        const pendingInterest = schedule.interest_amount - Math.min(
          paidSoFar - (schedule.penalty_amount || 0),
          schedule.interest_amount
        );
        const pendingPrincipal = schedule.principal_amount - Math.max(
          0,
          paidSoFar - (schedule.penalty_amount || 0) - schedule.interest_amount
        );

        // Allocate payment
        const allocation = this.allocatePayment(
          remainingPayment,
          pendingPenalties,
          pendingInterest,
          pendingPrincipal
        );

        // Calculate new paid amount
        const newPaidAmount = 
          (paidSoFar || 0) + 
          allocation.penalties + 
          allocation.interest + 
          allocation.principal;

        // Determine new status
        let newStatus = 'pending';
        const totalDue = schedule.installment_amount + penalty;
        
        if (newPaidAmount >= totalDue) {
          newStatus = 'paid';
        } else if (newPaidAmount > 0) {
          newStatus = 'partial';
        }

        // Check if overdue
        const today = new Date(input.paymentDate);
        today.setHours(0, 0, 0, 0);
        const due = new Date(schedule.due_date);
        due.setHours(0, 0, 0, 0);
        
        if (today > due && newStatus !== 'paid') {
          newStatus = 'overdue';
        }

        // Update schedule
        await client.query(
          `UPDATE payment_schedules
           SET paid_amount = $1,
               penalty_amount = $2,
               status = $3,
               paid_date = $4,
               updated_at = NOW()
           WHERE id = $5`,
          [
            newPaidAmount,
            penalty,
            newStatus,
            newStatus === 'paid' ? input.paymentDate : schedule.paid_date,
            schedule.id
          ]
        );

        updatedSchedules.push({
          ...schedule,
          allocation,
          newPaidAmount,
          newStatus
        });

        // Deduct from remaining payment
        remainingPayment -= (
          allocation.penalties + 
          allocation.interest + 
          allocation.principal
        );
      }

      // 4. Generate receipt number
      const receiptNumber = await this.generateReceiptNumber();

      // 5. Create payment record with aggregated allocation
      const totalAllocation: PaymentAllocation = {
        penalties: 0,
        interest: 0,
        principal: 0,
        advance: remainingPayment > 0 ? remainingPayment : 0
      };

      updatedSchedules.forEach(s => {
        totalAllocation.penalties += s.allocation.penalties;
        totalAllocation.interest += s.allocation.interest;
        totalAllocation.principal += s.allocation.principal;
      });

      const paymentResult = await client.query(
        `INSERT INTO payments (
          receipt_number, loan_id, amount, payment_date,
          payment_method, reference_number, remarks,
          penalty_paid, interest_paid, principal_paid, advance_paid,
          collected_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *`,
        [
          receiptNumber,
          input.loanId,
          input.amount,
          input.paymentDate,
          input.paymentMethod,
          input.referenceNumber,
          input.remarks,
          totalAllocation.penalties,
          totalAllocation.interest,
          totalAllocation.principal,
          totalAllocation.advance,
          input.collectedBy
        ]
      );

      // 6. Update loan balance
      const newBalance = loan.balance - totalAllocation.principal;
      
      await client.query(
        `UPDATE loans
         SET balance = $1,
             total_paid = COALESCE(total_paid, 0) + $2,
             last_payment_date = $3,
             status = CASE 
               WHEN $1 <= 0 THEN 'completed'
               ELSE status
             END,
             updated_at = NOW()
         WHERE id = $4`,
        [newBalance, input.amount, input.paymentDate, input.loanId]
      );

      await client.query('COMMIT');

      // 7. Return receipt
      return {
        id: paymentResult.rows[0].id,
        receiptNumber,
        loanId: input.loanId,
        loanNumber: loan.loan_number,
        customerName: loan.customer_name,
        amount: input.amount,
        paymentDate: input.paymentDate,
        allocation: totalAllocation,
        paymentMethod: input.paymentMethod,
        referenceNumber: input.referenceNumber,
        collectedBy: input.collectedBy,
        collectedByName: loan.collector_name
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get payment history for a loan
   */
  async getPaymentHistory(loanId: string) {
    const result = await pool.query(
      `SELECT 
        p.*,
        u.first_name || ' ' || u.last_name as collector_name,
        l.loan_number
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      JOIN users u ON p.collected_by = u.id
      WHERE p.loan_id = $1
      ORDER BY p.payment_date DESC, p.created_at DESC`,
      [loanId]
    );

    return result.rows;
  }

  /**
   * Get payment receipt details
   */
  async getReceipt(receiptId: string) {
    const result = await pool.query(
      `SELECT 
        p.*,
        l.loan_number,
        c.first_name || ' ' || c.last_name as customer_name,
        c.phone as customer_phone,
        c.address as customer_address,
        u.first_name || ' ' || u.last_name as collector_name,
        ou.name as branch_name
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      JOIN customers c ON l.customer_id = c.id
      JOIN users u ON p.collected_by = u.id
      JOIN organizational_units ou ON l.ou_id = ou.id
      WHERE p.id = $1`,
      [receiptId]
    );

    if (result.rows.length === 0) {
      throw new HttpException(404, 'Payment receipt not found');
    }

    return result.rows[0];
  }

  /**
   * Void/cancel a payment (admin only)
   */
  async voidPayment(paymentId: string, voidedBy: string, reason: string) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get payment details
      const paymentResult = await client.query(
        `SELECT * FROM payments WHERE id = $1 AND voided = false`,
        [paymentId]
      );

      if (paymentResult.rows.length === 0) {
        throw new HttpException(404, 'Payment not found or already voided');
      }

      const payment = paymentResult.rows[0];

      // Mark payment as voided
      await client.query(
        `UPDATE payments
         SET voided = true,
             voided_by = $1,
             voided_at = NOW(),
             void_reason = $2
         WHERE id = $3`,
        [voidedBy, reason, paymentId]
      );

      // Reverse loan balance update
      await client.query(
        `UPDATE loans
         SET balance = balance + $1,
             total_paid = COALESCE(total_paid, 0) - $2,
             updated_at = NOW()
         WHERE id = $3`,
        [payment.principal_paid, payment.amount, payment.loan_id]
      );

      // Reverse payment schedule updates would require additional tracking
      // For now, we'll need to regenerate the schedule or manually adjust
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
