import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate, requirePermissions } from '../middleware/auth.middleware';

const router = Router();
const analyticsController = new AnalyticsController();

// All analytics routes require authentication
router.use(authenticate);

/**
 * GET /api/analytics/portfolio-summary
 * Get portfolio summary with key metrics
 */
router.get(
  '/portfolio-summary',
  requirePermissions(['reports.read']),
  (req, res, next) => analyticsController.getPortfolioSummary(req, res, next)
);

/**
 * GET /api/analytics/delinquency
 * Get detailed delinquency report
 */
router.get(
  '/delinquency',
  requirePermissions(['reports.read']),
  (req, res, next) => analyticsController.getDelinquencyReport(req, res, next)
);

/**
 * GET /api/analytics/collector-performance
 * Get collector performance metrics
 * Query params: startDate, endDate
 */
router.get(
  '/collector-performance',
  requirePermissions(['reports.read']),
  (req, res, next) => analyticsController.getCollectorPerformance(req, res, next)
);

/**
 * GET /api/analytics/branch-performance
 * Get branch performance metrics
 */
router.get(
  '/branch-performance',
  requirePermissions(['reports.read']),
  (req, res, next) => analyticsController.getBranchPerformance(req, res, next)
);

/**
 * GET /api/analytics/loan-aging
 * Get loan aging report
 */
router.get(
  '/loan-aging',
  requirePermissions(['reports.read']),
  (req, res, next) => analyticsController.getLoanAgingReport(req, res, next)
);

/**
 * GET /api/analytics/dashboard
 * Get dashboard widgets data
 */
router.get(
  '/dashboard',
  requirePermissions(['reports.read']),
  (req, res, next) => analyticsController.getDashboardWidgets(req, res, next)
);

export default router;
