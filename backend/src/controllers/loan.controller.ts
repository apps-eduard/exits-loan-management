import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { LoanService } from '../services/loan.service';

const loanService = new LoanService();

export class LoanController {
  /**
   * Create a new loan application
   */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const ouId = req.user!.organizationalUnitId;

      const loan = await loanService.createLoan(userId, ouId, req.body);

      res.status(201).json({
        success: true,
        message: 'Loan application created successfully',
        data: loan
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all loans with filters
   */
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, customerId, page, limit } = req.query;
      
      // Apply OU filter unless user is Super Admin
      const ouId = req.user!.roleName === 'Super Admin' 
        ? undefined 
        : req.user!.organizationalUnitId;

      const result = await loanService.getLoans({
        ouId,
        status: status as string,
        customerId: customerId as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.json({
        success: true,
        message: 'Loans retrieved successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get loan by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const loan = await loanService.getLoanById(id);

      res.json({
        success: true,
        message: 'Loan retrieved successfully',
        data: loan
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate loan amounts
   */
  async calculate(req: Request, res: Response, next: NextFunction) {
    try {
      const { loanProductId, principalAmount, term } = req.body;

      if (!loanProductId || !principalAmount || !term) {
        return res.status(400).json({
          success: false,
          message: 'loanProductId, principalAmount, and term are required'
        });
      }

      const calculation = await loanService.calculateLoan(
        loanProductId,
        parseFloat(principalAmount),
        parseInt(term)
      );

      res.json({
        success: true,
        message: 'Loan calculation completed',
        data: calculation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit loan for review (change status from draft to pending)
   */
  async submit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const loan = await loanService.updateLoanStatus(id, 'pending', userId);

      res.json({
        success: true,
        message: 'Loan submitted for review',
        data: loan
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve loan
   */
  async approve(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const loan = await loanService.updateLoanStatus(id, 'approved', userId);

      res.json({
        success: true,
        message: 'Loan approved successfully',
        data: loan
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject loan
   */
  async reject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { remarks } = req.body;
      const userId = req.user!.userId;

      const loan = await loanService.updateLoanStatus(id, 'rejected', userId, remarks);

      res.json({
        success: true,
        message: 'Loan rejected',
        data: loan
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disburse loan
   */
  async disburse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const loan = await loanService.updateLoanStatus(id, 'disbursed', userId);

      res.json({
        success: true,
        message: 'Loan disbursed successfully',
        data: loan
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete loan (only draft)
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      await loanService.deleteLoan(id);

      res.json({
        success: true,
        message: 'Loan deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment schedule for a loan
   */
  async getPaymentSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const schedule = await loanService.getPaymentSchedule(id);

      res.json({
        success: true,
        message: 'Payment schedule retrieved successfully',
        data: schedule
      });
    } catch (error) {
      next(error);
    }
  }
}
