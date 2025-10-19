import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface PlatformStats {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
}

interface RecentActivity {
  id: number;
  tenant: string;
  action: string;
  time: string;
  status: 'success' | 'warning' | 'error';
}

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrl: './super-admin-dashboard.component.scss'
})
export class SuperAdminDashboardComponent {
  stats: PlatformStats[] = [
    { label: 'Total Tenants', value: '147', change: '+12%', trend: 'up', icon: '🏢' },
    { label: 'Active Subscriptions', value: '132', change: '+8%', trend: 'up', icon: '💳' },
    { label: 'Monthly Revenue', value: '$78,540', change: '+23%', trend: 'up', icon: '💰' },
    { label: 'System Uptime', value: '99.9%', change: 'Stable', trend: 'up', icon: '⚡' }
  ];

  recentActivity: RecentActivity[] = [
    { id: 1, tenant: 'TechCorp Ltd', action: 'New tenant registered', time: '5 min ago', status: 'success' },
    { id: 2, tenant: 'Finance Plus', action: 'Subscription upgraded to Pro', time: '15 min ago', status: 'success' },
    { id: 3, tenant: 'Retail Solutions', action: 'Feature request: BNPL Module', time: '1 hour ago', status: 'warning' },
    { id: 4, tenant: 'Quick Loans Inc', action: 'Payment received: $599', time: '2 hours ago', status: 'success' },
    { id: 5, tenant: 'MicroFinance Co', action: 'Support ticket opened', time: '3 hours ago', status: 'warning' }
  ];

  quickActions = [
    { label: 'Create New Tenant', icon: '➕', route: '/super-admin/tenants/create' },
    { label: 'Manage Subscriptions', icon: '📊', route: '/super-admin/subscriptions/plans' },
    { label: 'Configure Features', icon: '🔧', route: '/super-admin/features/manage' },
    { label: 'View Reports', icon: '��', route: '/super-admin/reports/overview' }
  ];

  constructor(private router: Router) {}

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  }

  getStatusBg(status: string): string {
    switch (status) {
      case 'success': return 'bg-green-100 dark:bg-green-900/20';
      case 'warning': return 'bg-yellow-100 dark:bg-yellow-900/20';
      case 'error': return 'bg-red-100 dark:bg-red-900/20';
      default: return 'bg-gray-100 dark:bg-gray-900/20';
    }
  }
}
