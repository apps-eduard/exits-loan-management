import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-loan-application',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6">
      <div class="mb-6">
        <a routerLink="/loans" class="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
          ← Back to Loans
        </a>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">New Loan Application</h1>
      </div>

      <div class="card">
        <p class="text-gray-600 dark:text-gray-400">Loan application form coming soon...</p>
      </div>
    </div>
  `
})
export class LoanApplicationComponent {}
