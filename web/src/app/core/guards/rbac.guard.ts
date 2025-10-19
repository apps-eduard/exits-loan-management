/**
 * RBAC Guard - Route Protection based on Roles and Permissions
 * Protects routes and controls access based on user roles and permissions
 */

import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanLoad,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Route,
  UrlSegment,
  Router
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { RbacService, SystemRoles } from '../services/rbac.service';

export interface RbacGuardData {
  roles?: SystemRoles[];
  permissions?: string[];
  requireAllPermissions?: boolean;
  redirectTo?: string;
  fallbackRoute?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RbacGuard implements CanActivate, CanLoad {
  constructor(
    private rbacService: RbacService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAccess(route.data as RbacGuardData, state.url);
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean> | Promise<boolean> | boolean {
    const url = segments.map(segment => segment.path).join('/');
    return this.checkAccess(route.data as RbacGuardData, `/${url}`);
  }

  private checkAccess(guardData: RbacGuardData, url: string): Observable<boolean> {
    if (!guardData || (!guardData.roles && !guardData.permissions)) {
      // No restrictions specified, allow access
      return of(true);
    }

    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.handleAccessDenied(guardData, url, 'Not authenticated');
      return of(false);
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userRole = payload.role as SystemRoles;
      const userId = payload.userId;

      // Check role requirements
      if (guardData.roles && guardData.roles.length > 0) {
        const hasRequiredRole = guardData.roles.includes(userRole);
        if (!hasRequiredRole) {
          this.handleAccessDenied(guardData, url, `Role '${userRole}' not authorized`);
          return of(false);
        }
      }

      // Check permission requirements
      if (guardData.permissions && guardData.permissions.length > 0) {
        return this.checkPermissions(
          guardData.permissions,
          guardData.requireAllPermissions || false,
          guardData,
          url
        );
      }

      return of(true);
    } catch (error) {
      console.error('Error checking access:', error);
      this.handleAccessDenied(guardData, url, 'Invalid token');
      return of(false);
    }
  }

  private checkPermissions(
    permissions: string[],
    requireAll: boolean,
    guardData: RbacGuardData,
    url: string
  ): Observable<boolean> {
    return this.rbacService.checkPermissions(permissions, requireAll).pipe(
      map(response => {
        if (response.success && response.data.hasAccess) {
          return true;
        } else {
          this.handleAccessDenied(
            guardData,
            url,
            `Missing required permissions: ${permissions.join(', ')}`
          );
          return false;
        }
      }),
      catchError(error => {
        console.error('Permission check failed:', error);
        // If permission check fails, allow access based on role alone (fallback)
        return of(true);
      })
    );
  }

  private handleAccessDenied(guardData: RbacGuardData, attemptedUrl: string, reason: string): void {
    console.warn(`Access denied to ${attemptedUrl}: ${reason}`);

    // Store the attempted URL for redirect after login
    localStorage.setItem('redirect_url', attemptedUrl);

    // Determine where to redirect
    let redirectTo = guardData.redirectTo || guardData.fallbackRoute;

    if (!redirectTo) {
      // Default redirect logic based on authentication status
      const token = localStorage.getItem('auth_token');
      if (!token) {
        redirectTo = '/auth/login';
      } else {
        // User is authenticated but lacks permission
        redirectTo = '/access-denied';
      }
    }

    this.router.navigate([redirectTo], {
      queryParams: {
        returnUrl: attemptedUrl,
        reason: reason
      }
    });
  }
}

/**
 * Specific Guard Classes for Common Use Cases
 */

@Injectable({
  providedIn: 'root'
})
export class AdminOnlyGuard implements CanActivate {
  constructor(private rbacService: RbacService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const guardData: RbacGuardData = {
      roles: [SystemRoles.TENANT_ADMIN],
      redirectTo: '/dashboard',
      ...route.data
    };

    // Create a new RbacGuard instance to use its logic
    const guard = new RbacGuard(this.rbacService, this.router);
    return guard.canActivate(route, state) as Observable<boolean>;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ManagerOrAboveGuard implements CanActivate {
  constructor(private rbacService: RbacService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const guardData: RbacGuardData = {
      roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER],
      redirectTo: '/dashboard',
      ...route.data
    };

    // Merge guard data with existing route data
    route.data = { ...route.data, ...guardData };

    const guard = new RbacGuard(this.rbacService, this.router);
    return guard.canActivate(route, state) as Observable<boolean>;
  }
}

@Injectable({
  providedIn: 'root'
})
export class StaffOnlyGuard implements CanActivate {
  constructor(private rbacService: RbacService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const guardData: RbacGuardData = {
      roles: [
        SystemRoles.TENANT_ADMIN,
        SystemRoles.BRANCH_MANAGER,
        SystemRoles.LOAN_OFFICER,
        SystemRoles.COLLECTOR,
        SystemRoles.AUDITOR
      ],
      redirectTo: '/customer-portal',
      ...route.data
    };

    route.data = { ...route.data, ...guardData };

    const guard = new RbacGuard(this.rbacService, this.router);
    return guard.canActivate(route, state) as Observable<boolean>;
  }
}

@Injectable({
  providedIn: 'root'
})
export class CustomerOnlyGuard implements CanActivate {
  constructor(private rbacService: RbacService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const guardData: RbacGuardData = {
      roles: [SystemRoles.CUSTOMER],
      redirectTo: '/dashboard',
      ...route.data
    };

    route.data = { ...route.data, ...guardData };

    const guard = new RbacGuard(this.rbacService, this.router);
    return guard.canActivate(route, state) as Observable<boolean>;
  }
}
