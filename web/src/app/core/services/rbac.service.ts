/**
 * RBAC Service - Frontend Role-Based Access Control Service
 * Handles role and permission management for the Angular frontend
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export enum SystemRoles {
  TENANT_ADMIN = 'tenant_admin',
  BRANCH_MANAGER = 'branch_manager',
  LOAN_OFFICER = 'loan_officer',
  COLLECTOR = 'collector',
  AUDITOR = 'auditor',
  CUSTOMER = 'customer'
}

export interface Permission {
  id: string;
  key: string;
  description: string;
  module: string;
  action: string;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
  is_system: boolean;
  tenant_id?: string;
  created_at: Date;
  updated_at: Date;
  permissions?: Permission[];
}

export interface MenuGroup {
  id: string;
  name: string;
  icon: string;
  emoji?: string;
  order: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon: string;
  emoji?: string;
  order: number;
  group_id: string;
  required_permissions: string[];
  require_all_permissions: boolean;
  visible_to_roles: string[];
  badge?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface CreateCustomRoleDto {
  name: string;
  description: string;
  level: number;
  permissionIds: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RbacService {
  private readonly baseUrl = `${environment.apiUrl}/rbac`;

  // Cache for user menu to avoid repeated API calls
  private userMenuSubject = new BehaviorSubject<MenuGroup[]>([]);
  public userMenu$ = this.userMenuSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all system permissions
   */
  getPermissions(): Observable<ApiResponse<{ permissions: Permission[]; total: number }>> {
    return this.http.get<ApiResponse<{ permissions: Permission[]; total: number }>>(
      `${this.baseUrl}/permissions`
    );
  }

  /**
   * Get all roles (system + tenant custom)
   */
  getRoles(): Observable<ApiResponse<{ roles: Role[]; total: number }>> {
    return this.http.get<ApiResponse<{ roles: Role[]; total: number }>>(
      `${this.baseUrl}/roles`
    );
  }

  /**
   * Get permissions for a specific role
   */
  getRolePermissions(roleId: string): Observable<ApiResponse<{ roleId: string; permissions: Permission[]; total: number }>> {
    return this.http.get<ApiResponse<{ roleId: string; permissions: Permission[]; total: number }>>(
      `${this.baseUrl}/roles/${roleId}/permissions`
    );
  }

  /**
   * Get user's effective permissions
   */
  getUserPermissions(userId: string): Observable<ApiResponse<{ userId: string; permissions: Permission[]; total: number }>> {
    return this.http.get<ApiResponse<{ userId: string; permissions: Permission[]; total: number }>>(
      `${this.baseUrl}/users/${userId}/permissions`
    );
  }

  /**
   * Get user menu structure
   */
  getUserMenu(): Observable<ApiResponse<{ menu: MenuGroup[]; totalGroups: number; totalItems: number }>> {
    return this.http.get<ApiResponse<{ menu: MenuGroup[]; totalGroups: number; totalItems: number }>>(
      `${this.baseUrl}/menu`
    ).pipe(
      tap(response => {
        if (response.success) {
          this.userMenuSubject.next(response.data.menu);
        }
      })
    );
  }

  /**
   * Check if current user has specified permissions
   */
  checkPermissions(permissions: string[], requireAll = false): Observable<ApiResponse<{ hasAccess: boolean; permissions: string[]; requireAll: boolean; userId: string }>> {
    return this.http.post<ApiResponse<{ hasAccess: boolean; permissions: string[]; requireAll: boolean; userId: string }>>(
      `${this.baseUrl}/check-permissions`,
      { permissions, requireAll }
    );
  }

  /**
   * Get tenant's custom roles
   */
  getTenantCustomRoles(): Observable<ApiResponse<{ customRoles: Role[]; total: number }>> {
    return this.http.get<ApiResponse<{ customRoles: Role[]; total: number }>>(
      `${this.baseUrl}/tenant/custom-roles`
    );
  }

  /**
   * Create custom role for tenant
   */
  createCustomRole(roleData: CreateCustomRoleDto): Observable<ApiResponse<{ role: Role }>> {
    return this.http.post<ApiResponse<{ role: Role }>>(
      `${this.baseUrl}/tenant/custom-roles`,
      roleData
    );
  }

  /**
   * Update role permissions
   */
  updateRolePermissions(roleId: string, permissionIds: string[]): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(
      `${this.baseUrl}/roles/${roleId}/permissions`,
      { permissionIds }
    );
  }

  /**
   * Delete custom role
   */
  deleteCustomRole(roleId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}/tenant/custom-roles/${roleId}`
    );
  }

  /**
   * Refresh user menu cache
   */
  refreshUserMenu(): void {
    this.getUserMenu().subscribe();
  }

  /**
   * Clear user menu cache (on logout)
   */
  clearUserMenu(): void {
    this.userMenuSubject.next([]);
  }

  /**
   * Get permissions grouped by module
   */
  getPermissionsGroupedByModule(): Observable<{ [module: string]: Permission[] }> {
    return new Observable(observer => {
      this.getPermissions().subscribe({
        next: (response) => {
          if (response.success) {
            const grouped = response.data.permissions.reduce((acc, permission) => {
              const module = permission.module || 'other';
              if (!acc[module]) {
                acc[module] = [];
              }
              acc[module].push(permission);
              return acc;
            }, {} as { [module: string]: Permission[] });

            observer.next(grouped);
            observer.complete();
          } else {
            observer.error(new Error('Failed to load permissions'));
          }
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Get role hierarchy levels for display
   */
  getRoleHierarchyLevels(): { value: number; label: string; description: string }[] {
    return [
      { value: 1, label: 'Super Admin', description: 'System-wide administration' },
      { value: 2, label: 'Admin', description: 'Full tenant administration' },
      { value: 3, label: 'Manager', description: 'Branch and department management' },
      { value: 4, label: 'Officer', description: 'Operational staff with specific duties' },
      { value: 5, label: 'Staff', description: 'Basic operational access' },
      { value: 6, label: 'Limited', description: 'Restricted access (customers, etc.)' }
    ];
  }

  /**
   * Helper function to check if a role can be edited/deleted
   */
  canModifyRole(role: Role): boolean {
    return !role.is_system; // Only custom (non-system) roles can be modified
  }

  /**
   * Helper function to get role level description
   */
  getRoleLevelDescription(level: number): string {
    const levels = this.getRoleHierarchyLevels();
    const found = levels.find(l => l.value === level);
    return found ? `${found.label} (${found.description})` : `Level ${level}`;
  }

  /**
   * Add role hierarchy checking
   */
  isUserInRoleOrHigher(userRole: SystemRoles, requiredRole: SystemRoles): boolean {
    const roleHierarchy = {
      [SystemRoles.TENANT_ADMIN]: 100,
      [SystemRoles.BRANCH_MANAGER]: 80,
      [SystemRoles.LOAN_OFFICER]: 60,
      [SystemRoles.COLLECTOR]: 40,
      [SystemRoles.AUDITOR]: 20,
      [SystemRoles.CUSTOMER]: 10
    };

    return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
  }

  /**
   * Generate complete menu structure with role filtering
   */
  generateCompleteMenu(): MenuGroup[] {
    const userRole = this.getCurrentUserRole();
    if (!userRole) return [];

    const completeMenuStructure: MenuGroup[] = [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: 'dashboard',
        emoji: '🏠',
        order: 1,
        items: [
          {
            id: 'overview',
            name: 'Overview',
            path: '/dashboard/overview',
            icon: 'bar_chart',
            emoji: '📊',
            order: 1,
            group_id: 'dashboard',
            required_permissions: ['dashboard_view'],
            require_all_permissions: false,
            visible_to_roles: [
              SystemRoles.TENANT_ADMIN,
              SystemRoles.BRANCH_MANAGER,
              SystemRoles.LOAN_OFFICER,
              SystemRoles.COLLECTOR,
              SystemRoles.AUDITOR
            ]
          },
          {
            id: 'analytics',
            name: 'Analytics',
            path: '/dashboard/analytics',
            icon: 'analytics',
            emoji: '📈',
            order: 2,
            group_id: 'dashboard',
            required_permissions: ['analytics_view'],
            require_all_permissions: false,
            visible_to_roles: [
              SystemRoles.TENANT_ADMIN,
              SystemRoles.BRANCH_MANAGER,
              SystemRoles.AUDITOR
            ]
          }
        ]
      },
      {
        id: 'loan-management',
        name: 'Loan Management',
        icon: 'account_balance',
        emoji: '💰',
        order: 2,
        items: [
          {
            id: 'loans',
            name: 'All Loans',
            path: '/loans',
            icon: 'list',
            emoji: '📋',
            order: 1,
            group_id: 'loan-management',
            required_permissions: ['loan_view'],
            require_all_permissions: false,
            visible_to_roles: [
              SystemRoles.TENANT_ADMIN,
              SystemRoles.BRANCH_MANAGER,
              SystemRoles.LOAN_OFFICER,
              SystemRoles.COLLECTOR,
              SystemRoles.AUDITOR
            ]
          },
          {
            id: 'new-loan',
            name: 'New Loan',
            path: '/loans/new',
            icon: 'add_circle',
            emoji: '➕',
            order: 2,
            group_id: 'loan-management',
            required_permissions: ['loan_create'],
            require_all_permissions: true,
            visible_to_roles: [
              SystemRoles.TENANT_ADMIN,
              SystemRoles.BRANCH_MANAGER,
              SystemRoles.LOAN_OFFICER
            ]
          },
          {
            id: 'loan-products',
            name: 'Loan Products',
            path: '/loans/products',
            icon: 'category',
            emoji: '🏷️',
            order: 3,
            group_id: 'loan-management',
            required_permissions: ['loan_product_view'],
            require_all_permissions: false,
            visible_to_roles: [
              SystemRoles.TENANT_ADMIN,
              SystemRoles.BRANCH_MANAGER,
              SystemRoles.LOAN_OFFICER
            ]
          },
          {
            id: 'loan-approvals',
            name: 'Approvals',
            path: '/loans/approvals',
            icon: 'approval',
            emoji: '✅',
            order: 4,
            group_id: 'loan-management',
            required_permissions: ['loan_approve'],
            require_all_permissions: true,
            visible_to_roles: [
              SystemRoles.TENANT_ADMIN,
              SystemRoles.BRANCH_MANAGER
            ],
            badge: 'pending'
          }
        ]
      },
      {
        id: 'customer-management',
        name: 'Customers',
        icon: 'people',
        emoji: '👥',
        order: 3,
        items: [
          {
            id: 'customers',
            name: 'All Customers',
            path: '/customers',
            icon: 'list',
            emoji: '📝',
            order: 1,
            group_id: 'customer-management',
            required_permissions: ['customer_view'],
            require_all_permissions: false,
            visible_to_roles: [
              SystemRoles.TENANT_ADMIN,
              SystemRoles.BRANCH_MANAGER,
              SystemRoles.LOAN_OFFICER,
              SystemRoles.COLLECTOR
            ]
          },
          {
            id: 'new-customer',
            name: 'Add Customer',
            path: '/customers/new',
            icon: 'person_add',
            emoji: '👤➕',
            order: 2,
            group_id: 'customer-management',
            required_permissions: ['customer_create'],
            require_all_permissions: true,
            visible_to_roles: [
              SystemRoles.TENANT_ADMIN,
              SystemRoles.BRANCH_MANAGER,
              SystemRoles.LOAN_OFFICER
            ]
          }
        ]
      },
      {
        id: 'payments',
        name: 'Payments',
        icon: 'payment',
        emoji: '💳',
        order: 4,
        items: [
          {
            id: 'payments-dashboard',
            name: 'Payment Dashboard',
            path: '/payments',
            icon: 'dashboard',
            emoji: '💰',
            order: 1,
            group_id: 'payments',
            required_permissions: ['payment_view'],
            require_all_permissions: false,
            visible_to_roles: [
              SystemRoles.TENANT_ADMIN,
              SystemRoles.BRANCH_MANAGER,
              SystemRoles.LOAN_OFFICER,
              SystemRoles.COLLECTOR
            ]
          },
          {
            id: 'record-payment',
            name: 'Record Payment',
            path: '/payments/record',
            icon: 'add_circle',
            emoji: '📝💰',
            order: 2,
            group_id: 'payments',
            required_permissions: ['payment_create'],
            require_all_permissions: true,
            visible_to_roles: [
              SystemRoles.TENANT_ADMIN,
              SystemRoles.BRANCH_MANAGER,
              SystemRoles.LOAN_OFFICER,
              SystemRoles.COLLECTOR
            ]
          }
        ]
      },
      {
        id: 'administration',
        name: 'Administration',
        icon: 'admin_panel_settings',
        emoji: '⚙️',
        order: 5,
        items: [
          {
            id: 'user-management',
            name: 'User Management',
            path: '/admin/users',
            icon: 'manage_accounts',
            emoji: '👥⚙️',
            order: 1,
            group_id: 'administration',
            required_permissions: ['user_manage'],
            require_all_permissions: true,
            visible_to_roles: [
              SystemRoles.TENANT_ADMIN,
              SystemRoles.BRANCH_MANAGER
            ]
          },
          {
            id: 'role-management',
            name: 'Role Management',
            path: '/admin/roles',
            icon: 'security',
            emoji: '🔐',
            order: 2,
            group_id: 'administration',
            required_permissions: ['role_manage'],
            require_all_permissions: true,
            visible_to_roles: [
              SystemRoles.TENANT_ADMIN
            ]
          }
        ]
      },
      {
        id: 'my-profile',
        name: 'My Profile',
        icon: 'account_circle',
        emoji: '👤',
        order: 6,
        items: [
          {
            id: 'profile',
            name: 'Profile Settings',
            path: '/profile',
            icon: 'person',
            emoji: '👤⚙️',
            order: 1,
            group_id: 'my-profile',
            required_permissions: [],
            require_all_permissions: false,
            visible_to_roles: [
              SystemRoles.TENANT_ADMIN,
              SystemRoles.BRANCH_MANAGER,
              SystemRoles.LOAN_OFFICER,
              SystemRoles.COLLECTOR,
              SystemRoles.AUDITOR,
              SystemRoles.CUSTOMER
            ]
          },
          {
            id: 'my-loans',
            name: 'My Loans',
            path: '/profile/loans',
            icon: 'account_balance_wallet',
            emoji: '💰👤',
            order: 2,
            group_id: 'my-profile',
            required_permissions: [],
            require_all_permissions: false,
            visible_to_roles: [
              SystemRoles.CUSTOMER
            ]
          }
        ]
      }
    ];

    // Filter menu based on user role and permissions
    return completeMenuStructure
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          // Check if user role is allowed for this menu item
          const roleAllowed = item.visible_to_roles.includes(userRole);

          // Check permissions if required
          let permissionsOk = true;
          if (item.required_permissions.length > 0) {
            // For demo purposes, we'll assume basic permission checking
            // In real implementation, this would check against user's actual permissions
            permissionsOk = true;
          }

          return roleAllowed && permissionsOk;
        })
      }))
      .filter(group => group.items.length > 0); // Remove empty groups
  }

  /**
   * Get current user role from token/storage
   */
  private getCurrentUserRole(): SystemRoles | null {
    // This should get the role from your auth service/token
    const userToken = localStorage.getItem('auth_token');
    if (!userToken) return null;

    try {
      // Decode JWT token to get role information
      const payload = JSON.parse(atob(userToken.split('.')[1]));
      return payload.role as SystemRoles;
    } catch {
      return null;
    }
  }

  /**
   * Sync method for permission checking (for guards)
   */
  checkPermission(module: string, action: string): boolean {
    // This would check against cached permissions
    // For now, return true for demo purposes
    return true;
  }
}
