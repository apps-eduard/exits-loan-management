import { Router } from "express";
import * as loanProductController from "../controllers/loan-product.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all loan products
router.get("/", loanProductController.getAllProducts);

// Get loan product by ID
router.get("/:id", loanProductController.getProductById);

export default router;
