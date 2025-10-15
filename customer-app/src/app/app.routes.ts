import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/pages/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'tabs',
    loadComponent: () => import('./features/tabs/pages/tabs/tabs.page').then(m => m.TabsPage),
    canActivate: [authGuard],
    children: [
      {
        path: 'loans',
        loadComponent: () => import('./features/loans/pages/loans-list/loans-list.page').then(m => m.LoansListPage)
      },
      {
        path: 'apply',
        loadComponent: () => import('./features/loan-application/pages/loan-application/loan-application.page').then(m => m.LoanApplicationPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/pages/profile/profile.page').then(m => m.ProfilePage)
      },
      {
        path: '',
        redirectTo: 'loans',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'loan/:id',
    loadComponent: () => import('./features/loans/pages/loan-detail/loan-detail.page').then(m => m.LoanDetailPage),
    canActivate: [authGuard]
  }
];
