import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';

const paymentService = new PaymentService();

export class PaymentController {
  /**
   * Post a new payment
   */
  async postPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const {
        loanId,
        amount,
        paymentDate,
        paymentMethod,
        referenceNumber,
        remarks
      } = req.body;

      // Validate required fields
      if (!loanId || !amount || !paymentDate || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'loanId, amount, paymentDate, and paymentMethod are required'
        });
      }

      // Validate amount
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount must be greater than zero'
        });
      }

      const receipt = await paymentService.postPayment({
        loanId,
        amount: parseFloat(amount),
        paymentDate: new Date(paymentDate),
        paymentMethod,
        referenceNumber,
        remarks,
        collectedBy: userId
      });

      res.status(201).json({
        success: true,
        message: 'Payment posted successfully',
        data: receipt
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment history for a loan
   */
  async getPaymentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { loanId } = req.params;

      const history = await paymentService.getPaymentHistory(loanId);

      res.json({
        success: true,
        message: 'Payment history retrieved successfully',
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment receipt details
   */
  async getReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const receipt = await paymentService.getReceipt(id);

      res.json({
        success: true,
        message: 'Receipt retrieved successfully',
        data: receipt
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Void a payment (admin only)
   */
  async voidPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user.id;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Void reason is required'
        });
      }

      await paymentService.voidPayment(id, userId, reason);

      res.json({
        success: true,
        message: 'Payment voided successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
