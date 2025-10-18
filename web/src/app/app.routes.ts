import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';
import { rbacGuard } from './guards/rbac.guard';
import { LoginComponent } from './pages/login/login.component';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginGuard]
  },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
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
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
