import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TenantService, Tenant } from '../../../core/services/tenant.service';

@Component({
  selector: 'app-tenants-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tenants</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Manage all organizations using the system
          </p>
        </div>
        <a routerLink="/super-admin/tenants/create"
           class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Tenant
        </a>
      </div>

      <!-- Tenants Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tenant
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Subscription
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              @for (tenant of tenants(); track tenant.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3">
                        {{ getInitials(tenant.company_name) }}
                      </div>
                      <div>
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ tenant.company_name }}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {{ tenant.slug }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 dark:text-white">{{ tenant.contact_email }}</div>
                    @if (tenant.contact_phone) {
                      <div class="text-sm text-gray-500 dark:text-gray-400">{{ tenant.contact_phone }}</div>
                    }
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium rounded"
                          [ngClass]="getSubscriptionClass(tenant.subscription_plan)">
                      {{ tenant.subscription_plan?.toUpperCase() || 'N/A' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium rounded"
                          [ngClass]="getStatusClass(tenant.status)">
                      {{ tenant.status.toUpperCase() }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(tenant.created_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a [routerLink]="['/super-admin/tenants', tenant.id]"
                       class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                      View
                    </a>
                    <button (click)="deleteTenant(tenant)"
                            class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                      Delete
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No tenants found
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class TenantsListComponent implements OnInit {
  private tenantService = inject(TenantService);
  
  tenants = signal<Tenant[]>([]);

  async ngOnInit() {
    await this.loadTenants();
  }

  async loadTenants() {
    try {
      const data = await this.tenantService.getAllTenants();
      this.tenants.set(data);
    } catch (error) {
      console.error('Failed to load tenants', error);
    }
  }

  async deleteTenant(tenant: Tenant) {
    if (!confirm(`Are you sure you want to delete ${tenant.company_name}? This will delete ALL data for this tenant.`)) {
      return;
    }

    try {
      await this.tenantService.deleteTenant(tenant.id);
      await this.loadTenants();
    } catch (error) {
      console.error('Failed to delete tenant', error);
      alert('Failed to delete tenant');
    }
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  formatDate(dateString: Date | string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getSubscriptionClass(plan?: string): string {
    const classes: Record<string, string> = {
      'enterprise': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'professional': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'basic': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'free': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return classes[plan || 'free'] || classes['free'];
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'suspended': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'inactive': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return classes[status] || classes['inactive'];
  }
}
