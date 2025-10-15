import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6">
      <div class="mb-6">
        <a routerLink="/loans" class="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
          ← Back to Loans
        </a>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Loan Details</h1>
      </div>

      <div class="card">
        <p class="text-gray-600 dark:text-gray-400">
          Loan ID: {{ loanId() }}
        </p>
        <p class="text-gray-600 dark:text-gray-400 mt-4">
          Detailed loan information and payment schedule coming soon...
        </p>
      </div>
    </div>
  `
})
export class LoanDetailComponent implements OnInit {
  loanId = signal<string>('');

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loanId.set(this.route.snapshot.paramMap.get('id') || '');
  }
}
