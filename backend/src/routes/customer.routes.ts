import { Router } from "express";
import * as customerController from "../controllers/customer.controller";
import { authenticate, requirePermissions } from "../middleware/auth.middleware";

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// Create customer - requires customers.create permission
router.post(
  "/",
  requirePermissions(["customers.create"]),
  customerController.createCustomer
);

// Get all customers - requires customers.read permission
router.get(
  "/",
  requirePermissions(["customers.read"]),
  customerController.getCustomers
);

// Get customer by ID - requires customers.read permission
router.get(
  "/:id",
  requirePermissions(["customers.read"]),
  customerController.getCustomerById
);

// Update customer - requires customers.update permission
router.put(
  "/:id",
  requirePermissions(["customers.update"]),
  customerController.updateCustomer
);

// Verify customer KYC - requires customers.update permission
router.post(
  "/:id/verify-kyc",
  requirePermissions(["customers.update"]),
  customerController.verifyCustomerKYC
);

export default router;
