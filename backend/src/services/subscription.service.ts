import { Request, Response, NextFunction } from "express";
import { pool } from "../config/database";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import HttpException from "../utils/http-exception";
import { StatusCodes } from "http-status-codes";

interface SubscriptionLimits {
  maxUsers: number | null;
  maxCustomers: number | null;
  maxLoans: number | null;
  maxBranches: number | null;
  maxStorageGb: number | null;
  plan: string;
  status: string;
}

/**
 * Subscription Limits Middleware
 * Checks if tenant has reached their subscription limits before allowing certain operations
 */
export class SubscriptionService {
  /**
   * Get subscription limits for a tenant
   */
  static async getSubscriptionLimits(tenantId: string): Promise<SubscriptionLimits> {
    const result = await pool.query(
      `SELECT 
        max_users as "maxUsers",
        max_customers as "maxCustomers", 
        max_loans as "maxLoans",
        max_branches as "maxBranches",
        max_storage_gb as "maxStorageGb",
        plan,
        status
      FROM subscriptions 
      WHERE tenant_id = $1 
      AND status = 'active'
      ORDER BY created_at DESC 
      LIMIT 1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      throw new HttpException(
        StatusCodes.FORBIDDEN,
        'No active subscription found for this tenant'
      );
    }

    return result.rows[0];
  }

  /**
   * Check if tenant can add more users
   */
  static async checkUserLimit(tenantId: string): Promise<void> {
    const limits = await this.getSubscriptionLimits(tenantId);

    if (limits.maxUsers === null) {
      return; // Unlimited
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1',
      [tenantId]
    );

    const currentCount = parseInt(countResult.rows[0].count);

    if (currentCount >= limits.maxUsers) {
      throw new HttpException(
        StatusCodes.FORBIDDEN,
        `User limit reached. Your ${limits.plan} plan allows ${limits.maxUsers} users. Please upgrade to add more users.`
      );
    }
  }

  /**
   * Check if tenant can add more customers
   */
  static async checkCustomerLimit(tenantId: string): Promise<void> {
    const limits = await this.getSubscriptionLimits(tenantId);

    if (limits.maxCustomers === null) {
      return; // Unlimited
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM customers WHERE tenant_id = $1',
      [tenantId]
    );

    const currentCount = parseInt(countResult.rows[0].count);

    if (currentCount >= limits.maxCustomers) {
      throw new HttpException(
        StatusCodes.FORBIDDEN,
        `Customer limit reached. Your ${limits.plan} plan allows ${limits.maxCustomers} customers. Please upgrade to add more customers.`
      );
    }
  }

  /**
   * Check if tenant can add more loans
   */
  static async checkLoanLimit(tenantId: string): Promise<void> {
    const limits = await this.getSubscriptionLimits(tenantId);

    if (limits.maxLoans === null) {
      return; // Unlimited
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM loans WHERE tenant_id = $1',
      [tenantId]
    );

    const currentCount = parseInt(countResult.rows[0].count);

    if (currentCount >= limits.maxLoans) {
      throw new HttpException(
        StatusCodes.FORBIDDEN,
        `Loan limit reached. Your ${limits.plan} plan allows ${limits.maxLoans} loans. Please upgrade to add more loans.`
      );
    }
  }

  /**
   * Check if tenant can add more branches
   */
  static async checkBranchLimit(tenantId: string): Promise<void> {
    const limits = await this.getSubscriptionLimits(tenantId);

    if (limits.maxBranches === null) {
      return; // Unlimited
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM organizational_units WHERE tenant_id = $1',
      [tenantId]
    );

    const currentCount = parseInt(countResult.rows[0].count);

    if (currentCount >= limits.maxBranches) {
      throw new HttpException(
        StatusCodes.FORBIDDEN,
        `Branch limit reached. Your ${limits.plan} plan allows ${limits.maxBranches} branches. Please upgrade to add more branches.`
      );
    }
  }

  /**
   * Check if subscription is active
   */
  static async checkSubscriptionStatus(tenantId: string): Promise<void> {
    const limits = await this.getSubscriptionLimits(tenantId);

    if (limits.status !== 'active' && limits.status !== 'trial') {
      throw new HttpException(
        StatusCodes.PAYMENT_REQUIRED,
        `Subscription is ${limits.status}. Please renew your subscription to continue using the system.`
      );
    }
  }
}

/**
 * Middleware to check subscription limits before creating resources
 */
export const checkSubscriptionLimit = (resourceType: 'user' | 'customer' | 'loan' | 'branch') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        throw new HttpException(
          StatusCodes.FORBIDDEN,
          'Tenant ID not found in request'
        );
      }

      // Check subscription status first
      await SubscriptionService.checkSubscriptionStatus(tenantId);

      // Check specific resource limit
      switch (resourceType) {
        case 'user':
          await SubscriptionService.checkUserLimit(tenantId);
          break;
        case 'customer':
          await SubscriptionService.checkCustomerLimit(tenantId);
          break;
        case 'loan':
          await SubscriptionService.checkLoanLimit(tenantId);
          break;
        case 'branch':
          await SubscriptionService.checkBranchLimit(tenantId);
          break;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
