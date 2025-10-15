import { Router } from 'express';
import { LoanController } from '../controllers/loan.controller';
import { authenticate, requirePermissions } from '../middleware/auth.middleware';

const router = Router();
const loanController = new LoanController();

// All loan routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/loans/calculate
 * @desc    Calculate loan amounts before creating application
 * @access  Private (requires loans.read permission)
 */
router.post(
  '/calculate',
  requirePermissions(['loans.read']),
  loanController.calculate.bind(loanController)
);

/**
 * @route   POST /api/loans
 * @desc    Create a new loan application
 * @access  Private (requires loans.create permission)
 */
router.post(
  '/',
  requirePermissions(['loans.create']),
  loanController.create.bind(loanController)
);

/**
 * @route   GET /api/loans
 * @desc    Get all loans with filters
 * @access  Private (requires loans.read permission)
 */
router.get(
  '/',
  requirePermissions(['loans.read']),
  loanController.getAll.bind(loanController)
);

/**
 * @route   GET /api/loans/:id
 * @desc    Get loan by ID
 * @access  Private (requires loans.read permission)
 */
router.get(
  '/:id',
  requirePermissions(['loans.read']),
  loanController.getById.bind(loanController)
);

/**
 * @route   PUT /api/loans/:id/submit
 * @desc    Submit loan for review (draft -> pending)
 * @access  Private (requires loans.create permission)
 */
router.put(
  '/:id/submit',
  requirePermissions(['loans.create']),
  loanController.submit.bind(loanController)
);

/**
 * @route   PUT /api/loans/:id/approve
 * @desc    Approve loan application
 * @access  Private (requires loans.approve permission)
 */
router.put(
  '/:id/approve',
  requirePermissions(['loans.approve']),
  loanController.approve.bind(loanController)
);

/**
 * @route   PUT /api/loans/:id/reject
 * @desc    Reject loan application
 * @access  Private (requires loans.approve permission)
 */
router.put(
  '/:id/reject',
  requirePermissions(['loans.approve']),
  loanController.reject.bind(loanController)
);

/**
 * @route   PUT /api/loans/:id/disburse
 * @desc    Disburse approved loan
 * @access  Private (requires loans.disburse permission)
 */
router.put(
  '/:id/disburse',
  requirePermissions(['loans.disburse']),
  loanController.disburse.bind(loanController)
);

/**
 * @route   DELETE /api/loans/:id
 * @desc    Delete loan (only draft status)
 * @access  Private (requires loans.delete permission)
 */
router.delete(
  '/:id',
  requirePermissions(['loans.delete']),
  loanController.delete.bind(loanController)
);

/**
 * @route   GET /api/loans/:id/schedule
 * @desc    Get payment schedule for a loan
 * @access  Private (requires loans.read permission)
 */
router.get(
  '/:id/schedule',
  requirePermissions(['loans.read']),
  loanController.getPaymentSchedule.bind(loanController)
);

export default router;
