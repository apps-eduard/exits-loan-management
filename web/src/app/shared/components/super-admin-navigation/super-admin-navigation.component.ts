import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ThemeService } from '../../../services/theme.service';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  badge?: string;
}

@Component({
  selector: 'app-super-admin-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './super-admin-navigation.component.html',
  styleUrl: './super-admin-navigation.component.scss'
})
export class SuperAdminNavigationComponent {
  private router = inject(Router);
  themeService = inject(ThemeService);
  private openSubmenus = new Set<string>();

  menuSections = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', icon: '🏠', route: '/super-admin/dashboard' },
        { label: 'Platform Analytics', icon: '📊', route: '/super-admin/analytics' }
      ]
    },
    {
      title: 'Tenant Management',
      items: [
        {
          label: 'Tenants',
          icon: '🏢',
          children: [
            { label: 'All Tenants', icon: '📋', route: '/super-admin/tenants' },
            { label: 'Add Tenant', icon: '➕', route: '/super-admin/tenants/create' },
            { label: 'Suspended Tenants', icon: '⏸️', route: '/super-admin/tenants?status=suspended' },
            { label: 'Trial Accounts', icon: '🆓', route: '/super-admin/tenants?plan=trial' }
          ]
        }
      ]
    },
    {
      title: 'Subscriptions',
      items: [
        {
          label: 'Billing',
          icon: '💳',
          children: [
            { label: 'Subscription Plans', icon: '📦', route: '/super-admin/subscriptions/plans' },
            { label: 'Billing History', icon: '🧾', route: '/super-admin/subscriptions/billing' },
            { label: 'Invoices', icon: '📄', route: '/super-admin/subscriptions/invoices' },
            { label: 'Trial Management', icon: '⏰', route: '/super-admin/subscriptions/trials' }
          ]
        }
      ]
    },
    {
      title: 'Features',
      items: [
        { label: 'Feature Flags', icon: '🧰', route: '/super-admin/features/flags' },
        { label: 'Feature Analytics', icon: '📈', route: '/super-admin/features/analytics' },
        { label: 'Feature Assignments', icon: '🔧', route: '/super-admin/features/assignments' }
      ]
    },
    {
      title: 'Users & Security',
      items: [
        {
          label: 'Platform Users',
          icon: '👥',
          children: [
            { label: 'All Users', icon: '👤', route: '/super-admin/users' },
            { label: 'Add User', icon: '➕', route: '/super-admin/users/create' },
            { label: 'Role Management', icon: '🔐', route: '/super-admin/users/roles' },
            { label: 'Access Logs', icon: '📝', route: '/super-admin/users/logs' }
          ]
        }
      ]
    },
    {
      title: 'Reports',
      items: [
        { label: 'Tenant Activity', icon: '📊', route: '/super-admin/reports/activity' },
        { label: 'Revenue Reports', icon: '💰', route: '/super-admin/reports/revenue' },
        { label: 'Feature Utilization', icon: '📉', route: '/super-admin/reports/utilization' },
        { label: 'System Logs', icon: '📋', route: '/super-admin/reports/logs' }
      ]
    },
    {
      title: 'Platform Settings',
      items: [
        {
          label: 'Configuration',
          icon: '⚙️',
          children: [
            { label: 'Global Settings', icon: '🌐', route: '/super-admin/settings/global' },
            { label: 'Email Templates', icon: '📧', route: '/super-admin/settings/email' },
            { label: 'SMTP Configuration', icon: '📮', route: '/super-admin/settings/smtp' },
            { label: 'Backup & Restore', icon: '💾', route: '/super-admin/settings/backup' }
          ]
        }
      ]
    },
    {
      title: 'Communication',
      items: [
        { label: 'Announcements', icon: '🔔', route: '/super-admin/announcements' },
        { label: 'Notifications', icon: '📨', route: '/super-admin/notifications' }
      ]
    }
  ];

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
