import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loan-products',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Loan Products</h1>
      <div class="card">
        <p class="text-gray-600 dark:text-gray-400">Loan product configuration coming soon...</p>
      </div>
    </div>
  `
})
export class LoanProductsComponent {}
