import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

interface StatCard {
  title: string;
  value: string;
  change: string;
  icon: string;
  trend: 'up' | 'down';
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  
  user = this.authService.getCurrentUser();
  isLoading = signal(false);

  stats = signal<StatCard[]>([
    {
      title: 'Total Customers',
      value: '1,234',
      change: '+12%',
      icon: '👥',
      trend: 'up',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Active Loans',
      value: '456',
      change: '+8%',
      icon: '💰',
      trend: 'up',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Pending Approvals',
      value: '23',
      change: '-5%',
      icon: '⏳',
      trend: 'down',
      color: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      title: 'Total Disbursed',
      value: '₱12.5M',
      change: '+15%',
      icon: '📈',
      trend: 'up',
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Collection Rate',
      value: '94.5%',
      change: '+2.3%',
      icon: '💳',
      trend: 'up',
      color: 'text-teal-600 dark:text-teal-400'
    },
    {
      title: 'Overdue Loans',
      value: '12',
      change: '-18%',
      icon: '⚠️',
      trend: 'down',
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

  ngOnInit(): void {
    // TODO: Fetch actual dashboard data from API
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
