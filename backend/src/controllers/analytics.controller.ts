import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AnalyticsService } from '../services/analytics.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import HttpException from '../utils/http-exception';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  /**
   * Get portfolio summary
   */
  async getPortfolioSummary(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Apply OU filter unless user is Super Admin
      const ouId = req.user!.roleName === 'Super Admin'
        ? undefined
        : req.user!.organizationalUnitId;

      const summary = await analyticsService.getPortfolioSummary(ouId);

      res.json({
        success: true,
        message: 'Portfolio summary retrieved successfully',
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get delinquency report
   */
  async getDelinquencyReport(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const ouId = req.user!.roleName === 'Super Admin'
        ? undefined
        : req.user!.organizationalUnitId;

      const report = await analyticsService.getDelinquencyReport(ouId);

      res.json({
        success: true,
        message: 'Delinquency report retrieved successfully',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get collector performance report
   */
  async getCollectorPerformance(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST,
          'Start date and end date are required'
        );
      }

      const ouId = req.user!.roleName === 'Super Admin'
        ? undefined
        : req.user!.organizationalUnitId;

      const performance = await analyticsService.getCollectorPerformance(
        startDate as string,
        endDate as string,
        ouId
      );

      res.json({
        success: true,
        message: 'Collector performance report retrieved successfully',
        data: performance,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get branch performance report
   */
  async getBranchPerformance(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const performance = await analyticsService.getBranchPerformance();

      res.json({
        success: true,
        message: 'Branch performance report retrieved successfully',
        data: performance,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get loan aging report
   */
  async getLoanAgingReport(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const ouId = req.user!.roleName === 'Super Admin'
        ? undefined
        : req.user!.organizationalUnitId;

      const report = await analyticsService.getLoanAgingReport(ouId);

      res.json({
        success: true,
        message: 'Loan aging report retrieved successfully',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dashboard widgets data
   */
  async getDashboardWidgets(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const ouId = req.user!.roleName === 'Super Admin'
        ? undefined
        : req.user!.organizationalUnitId;

      const widgets = await analyticsService.getDashboardWidgets(ouId);

      res.json({
        success: true,
        message: 'Dashboard widgets retrieved successfully',
        data: widgets,
      });
    } catch (error) {
      next(error);
    }
  }
}
