import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate, requirePermissions } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Routes that don't use :id parameter (must come first)
// Get all roles
router.get("/roles", requirePermissions(["manage_users", "view_users"]), userController.getRoles);

// Get all permissions
router.get("/permissions", requirePermissions(["manage_users", "view_users"]), userController.getPermissions);

// Get organizational units
router.get("/organizational-units", requirePermissions(["manage_users", "view_users"]), userController.getOrganizationalUnits);

// Get role permissions
router.get("/roles/:roleId/permissions", requirePermissions(["manage_users", "view_users"]), userController.getRolePermissions);

// Get all users (paginated, filtered)
router.get("/", requirePermissions(["manage_users", "view_users"]), userController.getUsers);

// Create new user
router.post("/", requirePermissions(["manage_users"]), userController.createUser);

// Routes with :id parameter (must come after specific routes)
// Get user by ID
router.get("/:id", requirePermissions(["manage_users", "view_users"]), userController.getUserById);

// Update user
router.put("/:id", requirePermissions(["manage_users"]), userController.updateUser);

// Delete user
router.delete("/:id", requirePermissions(["manage_users"]), userController.deleteUser);

// Suspend user
router.patch("/:id/suspend", requirePermissions(["manage_users"]), userController.suspendUser);

// Activate user
router.patch("/:id/activate", requirePermissions(["manage_users"]), userController.activateUser);

// Reset user password
router.post("/:id/reset-password", requirePermissions(["manage_users"]), userController.resetPassword);

export default router;
