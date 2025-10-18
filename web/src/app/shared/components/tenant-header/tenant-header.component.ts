import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tenant } from '../../../core/services/tenant.service';

@Component({
  selector: 'app-tenant-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          @if (tenant?.logo_url) {
            <img [src]="tenant!.logo_url!" [alt]="(tenant!.company_name || 'Tenant') + ' Logo'" class="h-10 w-auto" />
          } @else {
            <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {{ getInitials(tenant?.company_name) }}
            </div>
          }
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ tenant?.company_name || 'Loading...' }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ tenant?.slug || '...' }}
            </p>
          </div>
        </div>
        
        <div class="flex items-center space-x-3">
          <!-- Subscription Badge -->
          @if (tenant?.subscription_plan) {
            <span class="px-3 py-1 text-xs font-medium rounded-full"
                  [ngClass]="getSubscriptionBadgeClass(tenant!.subscription_plan!)">
              {{ tenant!.subscription_plan!.toUpperCase() }}
            </span>
          }
          
          <!-- Status Badge -->
          @if (tenant?.status) {
            <span class="px-3 py-1 text-xs font-medium rounded-full"
                  [ngClass]="getStatusBadgeClass(tenant!.status)">
              {{ tenant!.status.toUpperCase() }}
            </span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TenantHeaderComponent {
  @Input() tenant: Tenant | null = null;

  getInitials(name?: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getSubscriptionBadgeClass(plan: string): string {
    const classes: Record<string, string> = {
      'enterprise': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'professional': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'basic': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'free': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'custom': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };
    return classes[plan] || classes['free'];
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'trial': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'suspended': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'inactive': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return classes[status] || classes['inactive'];
  }
}
