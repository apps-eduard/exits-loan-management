import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

/**
 * RBAC Guard - checks if user has required permissions
 * Usage in routes:
 * {
 *   path: 'users',
 *   component: UsersComponent,
 *   canActivate: [rbacGuard],
 *   data: { permssions: ['manage_users'] } // OR logic
 *   data: { permissions: ['manage_users', 'view_users'], requireAll: true } // AND logic
 * }
 */
export const rbacGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  const requiredPermissions = route.data['permissions'] as string[] || [];
  const requireAll = route.data['requireAll'] as boolean || false;
  const routePath = route.routeConfig?.path || 'unknown';

  logger.debug(`🔐 RBAC Guard - Checking access to: /${routePath}`, {
    requiredPermissions,
    requireAll,
    logic: requireAll ? 'AND (all required)' : 'OR (any required)'
  });

  if (requiredPermissions.length === 0) {
    logger.success(`✅ Access granted - No specific permissions required`);
    return true;
  }

  const user = authService.getCurrentUser();
  const userPermissions = user?.permissions || [];

  logger.debug(`👤 User permissions:`, {
    user: user?.email,
    role: user?.role,
    permissions: userPermissions
  });

  const hasAccess = requireAll
    ? requiredPermissions.every(p => authService.hasPermission(p))
    : requiredPermissions.some(p => authService.hasPermission(p));

  if (!hasAccess) {
    const missingPermissions = requiredPermissions.filter(p => !authService.hasPermission(p));
    logger.permissionDenied(requiredPermissions, userPermissions);
    logger.warn(`🚫 Access denied to: /${routePath}`, {
      required: requiredPermissions,
      missing: missingPermissions,
      redirectTo: '/dashboard'
    });
    router.navigate(['/dashboard']);
    return false;
  }

  logger.success(`✅ Access granted to: /${routePath}`);
  return true;
};
