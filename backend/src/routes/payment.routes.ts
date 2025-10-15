import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate, requirePermissions } from '../middleware/auth.middleware';

const router = Router();
const paymentController = new PaymentController();

// All payment routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/payments
 * @desc    Post a new payment
 * @access  Private (requires payments.create permission)
 */
router.post(
  '/',
  requirePermissions(['payments.create']),
  paymentController.postPayment.bind(paymentController)
);

/**
 * @route   GET /api/payments/loan/:loanId
 * @desc    Get payment history for a loan
 * @access  Private (requires payments.read permission)
 */
router.get(
  '/loan/:loanId',
  requirePermissions(['payments.read']),
  paymentController.getPaymentHistory.bind(paymentController)
);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment receipt details
 * @access  Private (requires payments.read permission)
 */
router.get(
  '/:id',
  requirePermissions(['payments.read']),
  paymentController.getReceipt.bind(paymentController)
);

/**
 * @route   PUT /api/payments/:id/void
 * @desc    Void a payment (admin only)
 * @access  Private (requires payments.delete permission)
 */
router.put(
  '/:id/void',
  requirePermissions(['payments.delete']),
  paymentController.voidPayment.bind(paymentController)
);

export default router;
