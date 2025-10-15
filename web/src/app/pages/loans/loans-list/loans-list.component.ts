import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-loans-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Loans</h1>
        <a routerLink="/loans/new" class="btn btn-primary">
          + New Loan Application
        </a>
      </div>

      <div class="card">
        <p class="text-gray-600 dark:text-gray-400">Loans list coming soon...</p>
      </div>
    </div>
  `
})
export class LoansListComponent {}
