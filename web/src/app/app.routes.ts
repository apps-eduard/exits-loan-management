import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';
import { rbacGuard } from './guards/rbac.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { LoginComponent } from './pages/login/login.component';
import { TenantLoginComponent } from './pages/tenant-login/tenant-login.component';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';

export const routes: Routes = [
  {
    path: '',
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
    component: DashboardLayoutComponent,
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
  // Tenant Admin Routes (Standard for all tenants, tenant-scoped)
  {
    path: 'admin',
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
        canActivate: [rbacGuard],
        data: { permissions: ['manage_customers', 'view_customers'] }
      },
      {
        path: 'loans',
        loadChildren: () => import('./pages/loans/loans.routes').then(m => m.LOAN_ROUTES),
        canActivate: [rbacGuard],
        data: { permissions: ['manage_loans', 'view_loans'] }
      },
      {
        path: 'payments',
        loadComponent: () => import('./pages/payments/payments.component').then(m => m.PaymentsComponent),
        canActivate: [rbacGuard],
        data: { permissions: ['manage_payments', 'view_payments'] }
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [rbacGuard],
        data: { permissions: ['view_reports', 'view_analytics'] }
      },
      {
        path: 'loan-products',
        loadComponent: () => import('./pages/loan-products/loan-products.component').then(m => m.LoanProductsComponent),
        canActivate: [rbacGuard],
        data: { permissions: ['manage_loan_products', 'view_loan_products'] }
      },
      {
        path: 'users',
        loadChildren: () => import('./pages/users/users.routes').then(m => m.USER_ROUTES),
        canActivate: [rbacGuard],
        data: { permissions: ['manage_users'] }
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },
  // Legacy redirect (old /dashboard route)
  {
    path: 'dashboard',
    redirectTo: '/admin/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/admin/dashboard'
  }
];
