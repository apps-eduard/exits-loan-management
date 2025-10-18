import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Guard to protect Super Admin routes
 * Only users with isSuperAdmin: true in JWT can access
 */
export const superAdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Check if user is super admin
  if (!authService.isSuperAdmin()) {
    // Redirect to regular admin dashboard
    router.navigate(['/admin/dashboard']);
    return false;
  }

  return true;
};
