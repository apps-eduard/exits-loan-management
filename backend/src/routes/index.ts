import { Router } from "express";
import { env } from "../config/env";
import { pool } from "../config/database";
import logger from "../config/logger";
import authRoutes from "./auth.routes";
import customerRoutes from "./customer.routes";
import loanProductRoutes from "./loan-product.routes";
import loanRoutes from "./loan.routes";
import paymentRoutes from "./payment.routes";
import analyticsRoutes from "./analytics.routes";
import userRoutes from "./user.routes";
import tenantRoutes from "./tenant.routes";

const router = Router();

router.get("/health", async (_req, res, next) => {
  const startedAt = Date.now();

  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      environment: env.NODE_ENV,
      uptime: process.uptime(),
      database: {
        status: "connected",
        latencyMs: Date.now() - startedAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, "Database health check failed");
    next(error);
  }
});

router.use("/auth", authRoutes);
router.use("/customers", customerRoutes);
router.use("/loan-products", loanProductRoutes);
router.use("/loans", loanRoutes);
router.use("/payments", paymentRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/users", userRoutes);
router.use("/", tenantRoutes); // Tenant routes include both /tenants/* and /super-admin/tenants/*

// Log all registered routes in development
if (env.isDevelopment) {
  console.log('\n' + '📋 '.repeat(40));
  console.log('🚀 REGISTERED API ROUTES');
  console.log('📋 '.repeat(40));
  console.log('✅ GET    /api/health');
  console.log('✅ *      /api/auth/*');
  console.log('✅ *      /api/tenants/* (+ /super-admin/tenants/*)');
  console.log('✅ *      /api/customers/*');
  console.log('✅ *      /api/loan-products/*');
  console.log('✅ *      /api/loans/*');
  console.log('✅ *      /api/payments/*');
  console.log('✅ *      /api/analytics/*');
  console.log('✅ *      /api/users/*');
  console.log('📋 '.repeat(40) + '\n');
}

export default router;
