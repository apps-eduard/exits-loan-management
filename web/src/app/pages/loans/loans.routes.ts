import { Routes } from '@angular/router';

export const LOAN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./loans-list/loans-list.component').then(m => m.LoansListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./loan-application/loan-application.component').then(m => m.LoanApplicationComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./loan-detail/loan-detail.component').then(m => m.LoanDetailComponent)
  }
];
