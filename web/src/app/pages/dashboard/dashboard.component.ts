import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TenantService } from '../../core/services/tenant.service';
import { TenantHeaderComponent } from '../../shared/components/tenant-header/tenant-header.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';

interface StatCard {
  title: string;
  value: string;
  change: string;
  icon: string;
  trend: 'positive' | 'negative' | 'neutral';
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TenantHeaderComponent, StatCardComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);
  
  user = this.authService.getCurrentUser();
  currentTenant = this.tenantService.currentTenant;
  isSuperAdmin = this.authService.isSuperAdmin();
  isLoading = signal(false);

  stats = signal<StatCard[]>([
    {
      title: 'Total Customers',
      value: '1,234',
      change: '+12%',
      icon: '👥',
      trend: 'positive',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Active Loans',
      value: '456',
      change: '+8%',
      icon: '💰',
      trend: 'positive',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Pending Approvals',
      value: '23',
      change: '-5%',
      icon: '⏳',
      trend: 'negative',
      color: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      title: 'Total Disbursed',
      value: '₱12.5M',
      change: '+15%',
      icon: '📈',
      trend: 'positive',
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Collection Rate',
      value: '94.5%',
      change: '+2.3%',
      icon: '💳',
      trend: 'positive',
      color: 'text-teal-600 dark:text-teal-400'
    },
    {
      title: 'Overdue Loans',
      value: '12',
      change: '-18%',
      icon: '⚠️',
      trend: 'negative',
      color: 'text-red-600 dark:text-red-400'
    }
  ]);

  recentActivities = signal([
    { action: 'New loan application', customer: 'Juan Dela Cruz', time: '5 minutes ago', status: 'pending' },
    { action: 'Loan approved', customer: 'Maria Santos', time: '1 hour ago', status: 'approved' },
    { action: 'Payment received', customer: 'Pedro Reyes', time: '2 hours ago', status: 'completed' },
    { action: 'Document uploaded', customer: 'Anna Garcia', time: '3 hours ago', status: 'pending' },
    { action: 'Loan disbursed', customer: 'Jose Ramirez', time: '5 hours ago', status: 'completed' }
  ]);

  async ngOnInit(): Promise<void> {
    // Load current tenant information
    await this.tenantService.loadCurrentTenant();
    
    // TODO: Fetch actual dashboard data from API filtered by tenant
    // The backend will automatically filter by tenantId from JWT
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'approved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'completed': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}
