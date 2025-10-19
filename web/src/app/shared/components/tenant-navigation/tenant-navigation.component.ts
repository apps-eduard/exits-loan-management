import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ThemeService } from '../../../services/theme.service';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  permission?: string;
  badge?: string;
}

@Component({
  selector: 'app-tenant-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tenant-navigation.component.html',
  styleUrl: './tenant-navigation.component.scss'
})
export class TenantNavigationComponent {
  private router = inject(Router);
  public themeService = inject(ThemeService);
  private openSubmenus = new Set<string>();

  menuSections = [
    {
      title: 'Dashboard',
      items: [
        { label: 'Overview', icon: '📊', route: '/tenant/dashboard', permission: 'dashboard.view' },
        { label: 'Analytics', icon: '📈', route: '/tenant/analytics', permission: 'analytics.view' }
      ]
    },
    {
      title: 'Customer Management',
      items: [
        { label: 'All Customers', icon: '👥', route: '/tenant/customers', permission: 'customers.view' },
        { label: 'Add Customer', icon: '➕', route: '/tenant/customers/add', permission: 'customers.create' },
        { label: 'Customer Reports', icon: '📋', route: '/tenant/customers/reports', permission: 'customers.view' }
      ]
    },
    {
      title: 'Loan Management',
      items: [
        {
          label: 'Loans',
          icon: '💰',
          permission: 'loans.view',
          children: [
            { label: 'All Loans', icon: '📝', route: '/tenant/loans', permission: 'loans.view' },
            { label: 'New Loan', icon: '✨', route: '/tenant/loans/create', permission: 'loans.create' },
            { label: 'Loan Products', icon: '🏷️', route: '/tenant/loan-products', permission: 'loan_products.view' },
            { label: 'Approval Queue', icon: '✅', route: '/tenant/loans/approvals', permission: 'loans.approve' }
          ]
        },
        {
          label: 'Payments',
          icon: '💳',
          permission: 'payments.view',
          children: [
            { label: 'All Payments', icon: '💸', route: '/tenant/payments', permission: 'payments.view' },
            { label: 'Process Payment', icon: '💰', route: '/tenant/payments/process', permission: 'payments.create' },
            { label: 'Payment Schedule', icon: '📅', route: '/tenant/payments/schedule', permission: 'payments.view' }
          ]
        }
      ]
    },
    {
      title: 'User Management',
      items: [
        { label: 'All Users', icon: '👤', route: '/tenant/users', permission: 'users.view' },
        { label: 'Add User', icon: '👨‍💼', route: '/tenant/users/add', permission: 'users.create' },
        { label: 'Roles & Permissions', icon: '🔐', route: '/tenant/rbac', permission: 'roles.view' }
      ]
    },
    {
      title: 'Settings',
      items: [
        { label: 'Company Settings', icon: '🏢', route: '/tenant/settings', permission: 'settings.view' },
        { label: 'Notifications', icon: '🔔', route: '/tenant/notifications', permission: 'settings.view' },
        { label: 'Security', icon: '🛡️', route: '/tenant/security', permission: 'settings.manage' }
      ]
    }
  ];

  hasPermission(permission?: string): boolean {
    // TODO: Implement proper RBAC permission checking
    return true;
  }

  hasChildren(item: MenuItem): item is MenuItem & { children: MenuItem[] } {
    return 'children' in item && Array.isArray(item.children);
  }

  hasRoute(item: MenuItem): item is MenuItem & { route: string } {
    return 'route' in item && typeof item.route === 'string';
  }

  toggleSubmenu(label: string): void {
    if (this.openSubmenus.has(label)) {
      this.openSubmenus.delete(label);
    } else {
      this.openSubmenus.add(label);
    }
  }

  isSubmenuOpen(label: string): boolean {
    return this.openSubmenus.has(label);
  }
}
