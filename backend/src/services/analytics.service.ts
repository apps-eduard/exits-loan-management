import { pool } from '../config/database';
import HttpException from '../utils/http-exception';
import { StatusCodes } from 'http-status-codes';

export interface PortfolioSummary {
  totalLoans: number;
  activeLoans: number;
  totalPrincipal: number;
  totalOutstanding: number;
  totalPaid: number;
  averageLoanSize: number;
  portfolioAtRisk: {
    par1: number;
    par30: number;
    par60: number;
    par90: number;
  };
}

export interface DelinquencyReport {
  current: {
    count: number;
    amount: number;
    percentage: number;
  };
  par1to29: {
    count: number;
    amount: number;
    percentage: number;
  };
  par30to59: {
    count: number;
    amount: number;
    percentage: number;
  };
  par60to89: {
    count: number;
    amount: number;
    percentage: number;
  };
  par90plus: {
    count: number;
    amount: number;
    percentage: number;
  };
}

export interface CollectorPerformance {
  userId: string;
  userName: string;
  totalCollections: number;
  totalAmount: number;
  loansHandled: number;
  averageCollectionPerLoan: number;
  onTimeCollectionRate: number;
}

export interface BranchPerformance {
  branchId: string;
  branchName: string;
  totalLoans: number;
  totalDisbursed: number;
  totalCollected: number;
  activeLoans: number;
  overdueLoans: number;
  collectionRate: number;
}

export interface LoanAgingReport {
  age0to30: { count: number; amount: number };
  age31to60: { count: number; amount: number };
  age61to90: { count: number; amount: number };
  age91to180: { count: number; amount: number };
  age180plus: { count: number; amount: number };
}

export class AnalyticsService {
  /**
   * Get portfolio summary with key metrics
   */
  async getPortfolioSummary(ouId?: string): Promise<PortfolioSummary> {
    try {
      // Base query for active loans
      const baseCondition = ouId ? 'WHERE l.organizational_unit_id = $1' : '';
      const params = ouId ? [ouId] : [];

      // Get total loans and amounts
      const summaryQuery = `
        SELECT
          COUNT(*) as total_loans,
          COUNT(*) FILTER (WHERE status = 'active') as active_loans,
          COALESCE(SUM(approved_amount), 0) as total_principal,
          COALESCE(SUM(approved_amount - COALESCE(total_paid, 0)), 0) as total_outstanding,
          COALESCE(SUM(total_paid), 0) as total_paid,
          COALESCE(AVG(approved_amount), 0) as average_loan_size
        FROM loans l
        ${baseCondition}
        AND status IN ('active', 'closed', 'written_off')
      `;

      const summaryResult = await pool.query(summaryQuery, params);
      const summary = summaryResult.rows[0];

      // Calculate PAR (Portfolio at Risk)
      const parQuery = `
        SELECT
          COUNT(DISTINCT l.id) FILTER (
            WHERE ps.status = 'overdue' 
            AND ps.due_date >= CURRENT_DATE - INTERVAL '1 day'
          ) as par1_count,
          COALESCE(SUM(DISTINCT l.approved_amount - COALESCE(l.total_paid, 0)) FILTER (
            WHERE ps.status = 'overdue' 
            AND ps.due_date >= CURRENT_DATE - INTERVAL '1 day'
          ), 0) as par1_amount,
          
          COUNT(DISTINCT l.id) FILTER (
            WHERE ps.status = 'overdue' 
            AND ps.due_date >= CURRENT_DATE - INTERVAL '30 days'
          ) as par30_count,
          COALESCE(SUM(DISTINCT l.approved_amount - COALESCE(l.total_paid, 0)) FILTER (
            WHERE ps.status = 'overdue' 
            AND ps.due_date >= CURRENT_DATE - INTERVAL '30 days'
          ), 0) as par30_amount,
          
          COUNT(DISTINCT l.id) FILTER (
            WHERE ps.status = 'overdue' 
            AND ps.due_date >= CURRENT_DATE - INTERVAL '60 days'
          ) as par60_count,
          COALESCE(SUM(DISTINCT l.approved_amount - COALESCE(l.total_paid, 0)) FILTER (
            WHERE ps.status = 'overdue' 
            AND ps.due_date >= CURRENT_DATE - INTERVAL '60 days'
          ), 0) as par60_amount,
          
          COUNT(DISTINCT l.id) FILTER (
            WHERE ps.status = 'overdue' 
            AND ps.due_date >= CURRENT_DATE - INTERVAL '90 days'
          ) as par90_count,
          COALESCE(SUM(DISTINCT l.approved_amount - COALESCE(l.total_paid, 0)) FILTER (
            WHERE ps.status = 'overdue' 
            AND ps.due_date >= CURRENT_DATE - INTERVAL '90 days'
          ), 0) as par90_amount
        FROM loans l
        LEFT JOIN payment_schedules ps ON l.id = ps.loan_id
        ${baseCondition}
        AND l.status = 'active'
      `;

      const parResult = await pool.query(parQuery, params);
      const par = parResult.rows[0];

      const totalOutstanding = parseFloat(summary.total_outstanding);

      return {
        totalLoans: parseInt(summary.total_loans),
        activeLoans: parseInt(summary.active_loans),
        totalPrincipal: parseFloat(summary.total_principal),
        totalOutstanding,
        totalPaid: parseFloat(summary.total_paid),
        averageLoanSize: parseFloat(summary.average_loan_size),
        portfolioAtRisk: {
          par1: totalOutstanding > 0 ? (parseFloat(par.par1_amount) / totalOutstanding) * 100 : 0,
          par30: totalOutstanding > 0 ? (parseFloat(par.par30_amount) / totalOutstanding) * 100 : 0,
          par60: totalOutstanding > 0 ? (parseFloat(par.par60_amount) / totalOutstanding) * 100 : 0,
          par90: totalOutstanding > 0 ? (parseFloat(par.par90_amount) / totalOutstanding) * 100 : 0,
        },
      };
    } catch (error) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to generate portfolio summary'
      );
    }
  }

  /**
   * Get detailed delinquency report
   */
  async getDelinquencyReport(ouId?: string): Promise<DelinquencyReport> {
    try {
      const baseCondition = ouId ? 'AND l.organizational_unit_id = $1' : '';
      const params = ouId ? [ouId] : [];

      const query = `
        WITH loan_delinquency AS (
          SELECT 
            l.id,
            l.approved_amount - COALESCE(l.total_paid, 0) as outstanding,
            MIN(CURRENT_DATE - ps.due_date) as days_overdue
          FROM loans l
          LEFT JOIN payment_schedules ps ON l.id = ps.loan_id
          WHERE l.status = 'active' ${baseCondition}
          AND ps.status IN ('pending', 'overdue')
          GROUP BY l.id, l.approved_amount, l.total_paid
        ),
        total_outstanding AS (
          SELECT COALESCE(SUM(outstanding), 0) as total
          FROM loan_delinquency
        )
        SELECT
          COUNT(*) FILTER (WHERE days_overdue <= 0) as current_count,
          COALESCE(SUM(outstanding) FILTER (WHERE days_overdue <= 0), 0) as current_amount,
          
          COUNT(*) FILTER (WHERE days_overdue BETWEEN 1 AND 29) as par1_count,
          COALESCE(SUM(outstanding) FILTER (WHERE days_overdue BETWEEN 1 AND 29), 0) as par1_amount,
          
          COUNT(*) FILTER (WHERE days_overdue BETWEEN 30 AND 59) as par30_count,
          COALESCE(SUM(outstanding) FILTER (WHERE days_overdue BETWEEN 30 AND 59), 0) as par30_amount,
          
          COUNT(*) FILTER (WHERE days_overdue BETWEEN 60 AND 89) as par60_count,
          COALESCE(SUM(outstanding) FILTER (WHERE days_overdue BETWEEN 60 AND 89), 0) as par60_amount,
          
          COUNT(*) FILTER (WHERE days_overdue >= 90) as par90_count,
          COALESCE(SUM(outstanding) FILTER (WHERE days_overdue >= 90), 0) as par90_amount,
          
          (SELECT total FROM total_outstanding) as total_outstanding
        FROM loan_delinquency
      `;

      const result = await pool.query(query, params);
      const data = result.rows[0];
      const total = parseFloat(data.total_outstanding);

      return {
        current: {
          count: parseInt(data.current_count),
          amount: parseFloat(data.current_amount),
          percentage: total > 0 ? (parseFloat(data.current_amount) / total) * 100 : 0,
        },
        par1to29: {
          count: parseInt(data.par1_count),
          amount: parseFloat(data.par1_amount),
          percentage: total > 0 ? (parseFloat(data.par1_amount) / total) * 100 : 0,
        },
        par30to59: {
          count: parseInt(data.par30_count),
          amount: parseFloat(data.par30_amount),
          percentage: total > 0 ? (parseFloat(data.par30_amount) / total) * 100 : 0,
        },
        par60to89: {
          count: parseInt(data.par60_count),
          amount: parseFloat(data.par60_amount),
          percentage: total > 0 ? (parseFloat(data.par60_amount) / total) * 100 : 0,
        },
        par90plus: {
          count: parseInt(data.par90_count),
          amount: parseFloat(data.par90_amount),
          percentage: total > 0 ? (parseFloat(data.par90_amount) / total) * 100 : 0,
        },
      };
    } catch (error) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to generate delinquency report'
      );
    }
  }

  /**
   * Get collector performance metrics
   */
  async getCollectorPerformance(
    startDate: string,
    endDate: string,
    ouId?: string
  ): Promise<CollectorPerformance[]> {
    try {
      const baseCondition = ouId ? 'AND l.organizational_unit_id = $3' : '';
      const params = ouId ? [startDate, endDate, ouId] : [startDate, endDate];

      const query = `
        SELECT
          u.id as user_id,
          u.first_name || ' ' || u.last_name as user_name,
          COUNT(p.id) as total_collections,
          COALESCE(SUM(p.amount), 0) as total_amount,
          COUNT(DISTINCT p.loan_id) as loans_handled,
          COALESCE(AVG(p.amount), 0) as average_collection_per_loan,
          (COUNT(*) FILTER (
            WHERE p.payment_date <= ps.due_date
          )::float / NULLIF(COUNT(*), 0) * 100) as on_time_rate
        FROM users u
        LEFT JOIN payments p ON u.id = p.collected_by
        LEFT JOIN loans l ON p.loan_id = l.id
        LEFT JOIN payment_schedules ps ON l.id = ps.loan_id 
          AND DATE_TRUNC('month', p.payment_date) = DATE_TRUNC('month', ps.due_date)
        WHERE p.payment_date BETWEEN $1 AND $2
        AND p.voided = false
        ${baseCondition}
        GROUP BY u.id, u.first_name, u.last_name
        HAVING COUNT(p.id) > 0
        ORDER BY total_amount DESC
      `;

      const result = await pool.query(query, params);

      return result.rows.map((row) => ({
        userId: row.user_id,
        userName: row.user_name,
        totalCollections: parseInt(row.total_collections),
        totalAmount: parseFloat(row.total_amount),
        loansHandled: parseInt(row.loans_handled),
        averageCollectionPerLoan: parseFloat(row.average_collection_per_loan),
        onTimeCollectionRate: parseFloat(row.on_time_rate) || 0,
      }));
    } catch (error) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to generate collector performance report'
      );
    }
  }

  /**
   * Get branch performance metrics
   */
  async getBranchPerformance(): Promise<BranchPerformance[]> {
    try {
      const query = `
        SELECT
          ou.id as branch_id,
          ou.name as branch_name,
          COUNT(l.id) as total_loans,
          COALESCE(SUM(l.approved_amount), 0) as total_disbursed,
          COALESCE(SUM(l.total_paid), 0) as total_collected,
          COUNT(*) FILTER (WHERE l.status = 'active') as active_loans,
          COUNT(DISTINCT l.id) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM payment_schedules ps 
              WHERE ps.loan_id = l.id 
              AND ps.status = 'overdue'
            )
          ) as overdue_loans,
          CASE 
            WHEN SUM(l.approved_amount) > 0 THEN
              (SUM(l.total_paid) / SUM(l.approved_amount) * 100)
            ELSE 0
          END as collection_rate
        FROM organizational_units ou
        LEFT JOIN loans l ON ou.id = l.organizational_unit_id
        WHERE ou.type = 'branch'
        GROUP BY ou.id, ou.name
        ORDER BY total_disbursed DESC
      `;

      const result = await pool.query(query);

      return result.rows.map((row) => ({
        branchId: row.branch_id,
        branchName: row.branch_name,
        totalLoans: parseInt(row.total_loans),
        totalDisbursed: parseFloat(row.total_disbursed),
        totalCollected: parseFloat(row.total_collected),
        activeLoans: parseInt(row.active_loans),
        overdueLoans: parseInt(row.overdue_loans),
        collectionRate: parseFloat(row.collection_rate),
      }));
    } catch (error) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to generate branch performance report'
      );
    }
  }

  /**
   * Get loan aging report
   */
  async getLoanAgingReport(ouId?: string): Promise<LoanAgingReport> {
    try {
      const baseCondition = ouId ? 'WHERE organizational_unit_id = $1' : '';
      const params = ouId ? [ouId] : [];

      const query = `
        WITH loan_ages AS (
          SELECT
            id,
            approved_amount - COALESCE(total_paid, 0) as outstanding,
            CURRENT_DATE - disbursement_date as age_days
          FROM loans
          ${baseCondition}
          ${baseCondition ? 'AND' : 'WHERE'} status = 'active'
          AND disbursement_date IS NOT NULL
        )
        SELECT
          COUNT(*) FILTER (WHERE age_days <= 30) as age_0_30_count,
          COALESCE(SUM(outstanding) FILTER (WHERE age_days <= 30), 0) as age_0_30_amount,
          
          COUNT(*) FILTER (WHERE age_days BETWEEN 31 AND 60) as age_31_60_count,
          COALESCE(SUM(outstanding) FILTER (WHERE age_days BETWEEN 31 AND 60), 0) as age_31_60_amount,
          
          COUNT(*) FILTER (WHERE age_days BETWEEN 61 AND 90) as age_61_90_count,
          COALESCE(SUM(outstanding) FILTER (WHERE age_days BETWEEN 61 AND 90), 0) as age_61_90_amount,
          
          COUNT(*) FILTER (WHERE age_days BETWEEN 91 AND 180) as age_91_180_count,
          COALESCE(SUM(outstanding) FILTER (WHERE age_days BETWEEN 91 AND 180), 0) as age_91_180_amount,
          
          COUNT(*) FILTER (WHERE age_days > 180) as age_180_plus_count,
          COALESCE(SUM(outstanding) FILTER (WHERE age_days > 180), 0) as age_180_plus_amount
        FROM loan_ages
      `;

      const result = await pool.query(query, params);
      const data = result.rows[0];

      return {
        age0to30: {
          count: parseInt(data.age_0_30_count),
          amount: parseFloat(data.age_0_30_amount),
        },
        age31to60: {
          count: parseInt(data.age_31_60_count),
          amount: parseFloat(data.age_31_60_amount),
        },
        age61to90: {
          count: parseInt(data.age_61_90_count),
          amount: parseFloat(data.age_61_90_amount),
        },
        age91to180: {
          count: parseInt(data.age_91_180_count),
          amount: parseFloat(data.age_91_180_amount),
        },
        age180plus: {
          count: parseInt(data.age_180_plus_count),
          amount: parseFloat(data.age_180_plus_amount),
        },
      };
    } catch (error) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to generate loan aging report'
      );
    }
  }

  /**
   * Get dashboard widgets data
   */
  async getDashboardWidgets(ouId?: string) {
    try {
      const summary = await this.getPortfolioSummary(ouId);
      const delinquency = await this.getDelinquencyReport(ouId);
      const aging = await this.getLoanAgingReport(ouId);

      // Get today's collections
      const baseCondition = ouId 
        ? 'AND l.organizational_unit_id = $1' 
        : '';
      const params = ouId ? [ouId] : [];

      const todayQuery = `
        SELECT
          COUNT(*) as collections_count,
          COALESCE(SUM(p.amount), 0) as collections_amount
        FROM payments p
        JOIN loans l ON p.loan_id = l.id
        WHERE DATE(p.payment_date) = CURRENT_DATE
        AND p.voided = false
        ${baseCondition}
      `;

      const todayResult = await pool.query(todayQuery, params);
      const today = todayResult.rows[0];

      return {
        portfolio: summary,
        delinquency,
        aging,
        todayCollections: {
          count: parseInt(today.collections_count),
          amount: parseFloat(today.collections_amount),
        },
      };
    } catch (error) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to generate dashboard widgets'
      );
    }
  }
}
