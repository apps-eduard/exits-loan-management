import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tenant-dashboard.component.html',
  styleUrl: './tenant-dashboard.component.scss'
})
export class TenantDashboardComponent {
  stats = [
    { label: 'Total Customers', value: '2,543', icon: '👥', change: '+12%', trend: 'up' },
    { label: 'Active Loans', value: '1,234', icon: '💰', change: '+8%', trend: 'up' },
    { label: 'Pending Payments', value: '$45,230', icon: '💳', change: '-3%', trend: 'down' },
    { label: 'This Month Revenue', icon: '📈', value: '$123,456', change: '+15%', trend: 'up' }
  ];

  recentLoans = [
    { customer: 'John Doe', amount: '$5,000', status: 'Approved', date: '2025-01-15' },
    { customer: 'Jane Smith', amount: '$3,500', status: 'Pending', date: '2025-01-14' },
    { customer: 'Bob Johnson', amount: '$7,200', status: 'Disbursed', date: '2025-01-13' }
  ];
}
