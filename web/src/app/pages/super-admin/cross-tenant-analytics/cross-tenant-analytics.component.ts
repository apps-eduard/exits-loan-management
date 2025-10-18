import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cross-tenant-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Cross-Tenant Analytics
      </h1>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <p class="text-gray-600 dark:text-gray-400">
          System-wide analytics and reporting - Coming soon
        </p>
      </div>
    </div>
  `
})
export class CrossTenantAnalyticsComponent {}
