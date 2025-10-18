import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TenantService, Tenant } from '../../../core/services/tenant.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

interface SuperAdminStats {
  totalTenants: number;
  activeTenants: number;
  totalRevenue: number;
  totalUsers: number;
}

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatCardComponent],
  template: `
    <div class="p-6">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Super Admin Dashboard
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Manage all tenants and system-wide settings
        </p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <app-stat-card
          label="Total Tenants"
          [value]="stats().totalTenants"
          icon="🏢"
          iconColor="#3B82F6"
          iconBgColor="#EFF6FF"
        />
        <app-stat-card
          label="Active Tenants"
          [value]="stats().activeTenants"
          icon="✅"
          iconColor="#10B981"
          iconBgColor="#ECFDF5"
        />
        <app-stat-card
          label="Monthly Revenue"
          [value]="formatCurrency(stats().totalRevenue)"
          icon="💰"
          iconColor="#F59E0B"
          iconBgColor="#FEF3C7"
        />
        <app-stat-card
          label="Total Users"
          [value]="stats().totalUsers"
          icon="👥"
          iconColor="#8B5CF6"
          iconBgColor="#F3E8FF"
        />
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div class="space-y-3">
            <a routerLink="/super-admin/tenants/create"
               class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <span class="flex items-center text-gray-900 dark:text-white">
                <span class="text-2xl mr-3">➕</span>
                Create New Tenant
              </span>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <a routerLink="/super-admin/tenants"
               class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <span class="flex items-center text-gray-900 dark:text-white">
                <span class="text-2xl mr-3">📋</span>
                Manage Tenants
              </span>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <a routerLink="/super-admin/analytics"
               class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <span class="flex items-center text-gray-900 dark:text-white">
                <span class="text-2xl mr-3">📊</span>
                View Analytics
              </span>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        <!-- Recent Tenants -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Tenants
          </h3>
          <div class="space-y-3">
            @for (tenant of recentTenants(); track tenant.id) {
              <div class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div class="flex items-center">
                  <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3">
                    {{ getInitials(tenant.company_name) }}
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">{{ tenant.company_name }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ tenant.subscription_plan }}</p>
                  </div>
                </div>
                <span class="px-2 py-1 text-xs font-medium rounded"
                      [ngClass]="{
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': tenant.status === 'active',
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': tenant.status !== 'active'
                      }">
                  {{ tenant.status }}
                </span>
              </div>
            } @empty {
              <p class="text-gray-500 dark:text-gray-400 text-center py-4">No recent tenants</p>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class SuperAdminDashboardComponent implements OnInit {
  private tenantService = inject(TenantService);

  stats = signal<SuperAdminStats>({
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: 0,
    totalUsers: 0
  });

  recentTenants = signal<Tenant[]>([]);

  async ngOnInit() {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      // Load all tenants
      const tenants = await this.tenantService.getAllTenants();
      
      // Calculate stats
      this.stats.set({
        totalTenants: tenants.length,
        activeTenants: tenants.filter(t => t.status === 'active').length,
        totalRevenue: this.calculateTotalRevenue(tenants),
        totalUsers: 0 // TODO: Get from backend
      });

      // Get recent tenants (last 5)
      this.recentTenants.set(tenants.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    }
  }

  calculateTotalRevenue(tenants: Tenant[]): number {
    // Simple calculation based on subscription plans
    const prices: Record<string, number> = {
      'free': 0,
      'basic': 2999,
      'professional': 7999,
      'enterprise': 19999,
      'custom': 0
    };

    return tenants
      .filter(t => t.status === 'active')
      .reduce((sum, t) => sum + (prices[t.subscription_plan || 'free'] || 0), 0);
  }

  formatCurrency(amount: number): string {
    return `₱${amount.toLocaleString()}`;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}
