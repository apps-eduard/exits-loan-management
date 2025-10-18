import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { env } from "../config/env";

const router = Router();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authenticate, authController.logout);
router.get("/profile", authenticate, authController.getProfile);

// Log auth routes in development
if (env.isDevelopment) {
  console.log('🔐 Auth Routes:');
  console.log('   POST /api/auth/login');
  console.log('   POST /api/auth/register');
  console.log('   POST /api/auth/refresh');
  console.log('   POST /api/auth/logout (protected)');
  console.log('   GET  /api/auth/profile (protected)');
}

export default router;
