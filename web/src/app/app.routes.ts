import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';
import {
  RbacGuard,
  AdminOnlyGuard,
  ManagerOrAboveGuard,
  StaffOnlyGuard,
  CustomerOnlyGuard
} from './core/guards/rbac.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { LoginComponent } from './pages/login/login.component';
import { TenantLoginComponent } from './pages/tenant-login/tenant-login.component';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';
import { TenantDashboardLayoutComponent } from './layouts/tenant-dashboard-layout/tenant-dashboard-layout.component';
import { SuperAdminDashboardLayoutComponent } from './layouts/super-admin-dashboard-layout/super-admin-dashboard-layout.component';
import { SystemRoles } from './core/services/rbac.service';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/tenant/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent)
  },
  // Registration
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
    canActivate: [loginGuard]
  },
  // Authentication Routes
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        component: LoginComponent,
        canActivate: [loginGuard]
      },
      {
        path: 'tenant/:slug',
        component: TenantLoginComponent,
        canActivate: [loginGuard]
      }
    ]
  },
  // Legacy login route redirect
  {
    path: 'login',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  // Super Admin Routes (Cross-Tenant Management)
  {
    path: 'super-admin',
    component: SuperAdminDashboardLayoutComponent,
    canActivate: [authGuard, superAdminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/super-admin/super-admin-dashboard/super-admin-dashboard.component').then(m => m.SuperAdminDashboardComponent)
      },
      {
        path: 'tenants',
        loadComponent: () => import('./pages/super-admin/tenants-list/tenants-list.component').then(m => m.TenantsListComponent)
      },
      {
        path: 'tenants/create',
        loadComponent: () => import('./pages/super-admin/tenant-form/tenant-form.component').then(m => m.TenantFormComponent)
      },
      {
        path: 'tenants/:id',
        loadComponent: () => import('./pages/super-admin/tenant-details/tenant-details.component').then(m => m.TenantDetailsComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./pages/super-admin/cross-tenant-analytics/cross-tenant-analytics.component').then(m => m.CrossTenantAnalyticsComponent)
      }
    ]
  },
  // Tenant Routes (New Tenant Dashboard)
  {
    path: 'tenant',
    component: TenantDashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/tenant/tenant-dashboard/tenant-dashboard.component').then(m => m.TenantDashboardComponent)
      },
      {
        path: 'customers',
        loadChildren: () => import('./pages/customers/customers.routes').then(m => m.CUSTOMER_ROUTES),
        canActivate: [StaffOnlyGuard],
        data: {
          permissions: ['customer_view'],
          roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.LOAN_OFFICER, SystemRoles.COLLECTOR]
        }
      },
      {
        path: 'loans',
        loadChildren: () => import('./pages/loans/loans.routes').then(m => m.LOAN_ROUTES),
        canActivate: [StaffOnlyGuard],
        data: {
          permissions: ['loan_view'],
          roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.LOAN_OFFICER, SystemRoles.COLLECTOR]
        }
      },
      {
        path: 'payments',
        loadComponent: () => import('./pages/payments/payments.component').then(m => m.PaymentsComponent),
        canActivate: [StaffOnlyGuard],
        data: {
          permissions: ['payment_view'],
          roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.LOAN_OFFICER, SystemRoles.COLLECTOR]
        }
      },
      {
        path: 'users',
        loadChildren: () => import('./pages/users/users.routes').then(m => m.USER_ROUTES),
        canActivate: [ManagerOrAboveGuard],
        data: {
          permissions: ['user_manage'],
          roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER]
        }
      },
      {
        path: 'rbac',
        loadComponent: () => import('./features/rbac-management/rbac-management.component').then(m => m.RbacManagementComponent),
        canActivate: [AdminOnlyGuard],
        data: {
          permissions: ['role_manage'],
          roles: [SystemRoles.TENANT_ADMIN]
        }
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/tenant-settings/tenant-settings.component').then(m => m.TenantSettingsComponent),
        canActivate: [AdminOnlyGuard],
        data: {
          permissions: ['tenant_settings_manage'],
          roles: [SystemRoles.TENANT_ADMIN]
        }
      }
    ]
  },
  // Tenant Admin Routes (Legacy - Keep for backward compatibility)
  {
    path: 'admin',
    redirectTo: '/tenant',
    pathMatch: 'prefix'
  },
  // Old admin routes for reference (can be removed later)
  {
    path: 'admin-old',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'customers',
        loadChildren: () => import('./pages/customers/customers.routes').then(m => m.CUSTOMER_ROUTES),
        canActivate: [StaffOnlyGuard],
        data: {
          permissions: ['customer_view'],
          roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.LOAN_OFFICER, SystemRoles.COLLECTOR]
        }
      },
      {
        path: 'loans',
        loadChildren: () => import('./pages/loans/loans.routes').then(m => m.LOAN_ROUTES),
        canActivate: [StaffOnlyGuard],
        data: {
          permissions: ['loan_view'],
          roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.LOAN_OFFICER, SystemRoles.COLLECTOR]
        }
      },
      {
        path: 'payments',
        loadComponent: () => import('./pages/payments/payments.component').then(m => m.PaymentsComponent),
        canActivate: [StaffOnlyGuard],
        data: {
          permissions: ['payment_view'],
          roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.LOAN_OFFICER, SystemRoles.COLLECTOR]
        }
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [ManagerOrAboveGuard],
        data: {
          permissions: ['report_view'],
          roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.AUDITOR]
        }
      },
      {
        path: 'loan-products',
        loadComponent: () => import('./pages/loan-products/loan-products.component').then(m => m.LoanProductsComponent),
        canActivate: [ManagerOrAboveGuard],
        data: {
          permissions: ['loan_product_view'],
          roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER]
        }
      },
      {
        path: 'users',
        loadChildren: () => import('./pages/users/users.routes').then(m => m.USER_ROUTES),
        canActivate: [ManagerOrAboveGuard],
        data: {
          permissions: ['user_manage'],
          roles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER]
        }
      },
      {
        path: 'rbac',
        loadComponent: () => import('./features/rbac-management/rbac-management.component').then(m => m.RbacManagementComponent),
        canActivate: [AdminOnlyGuard],
        data: {
          permissions: ['role_manage'],
          roles: [SystemRoles.TENANT_ADMIN]
        }
      },
      {
        path: 'tenant-settings',
        loadComponent: () => import('./features/tenant-settings/tenant-settings.component').then(m => m.TenantSettingsComponent),
        canActivate: [AdminOnlyGuard],
        data: {
          permissions: ['tenant_settings_manage'],
          roles: [SystemRoles.TENANT_ADMIN]
        }
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },
  // Customer Portal Routes
  {
    path: 'customer-portal',
    component: DashboardLayoutComponent,
    canActivate: [CustomerOnlyGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'my-loans',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'my-payments',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      }
    ]
  },
  // Access Denied Page
  {
    path: 'access-denied',
    loadComponent: () => import('./pages/access-denied/access-denied.component').then(m => m.AccessDeniedComponent)
  },
  // Legacy redirect (old /dashboard route)
  {
    path: 'dashboard',
    redirectTo: '/tenant/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/tenant/dashboard'
  }
];
