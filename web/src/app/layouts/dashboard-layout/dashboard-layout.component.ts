import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { DynamicNavigationComponent } from '../../shared/components/dynamic-navigation/dynamic-navigation.component';
import { RoleBasedHeaderComponent } from '../../shared/components/role-based-header/role-based-header.component';

interface MenuItem {
  label: string;
  path: string;
  icon: string;
  permission?: string;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DynamicNavigationComponent,
    RoleBasedHeaderComponent
  ],
  templateUrl: './dashboard-layout.component.html'
})
export class DashboardLayoutComponent {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private router = inject(Router);

  user = computed(() => this.authService.getCurrentUser());
  isDarkMode = this.themeService.isDarkMode;
  pageTitle = signal('Dashboard');
  isSuperAdmin = computed(() => this.authService.isSuperAdmin());

  // Sidebar toggle state
  isSidebarOpen = signal(true);

  // Super Admin menu items
  superAdminMenuItems: MenuItem[] = [
    { label: 'Dashboard', path: '/super-admin/dashboard', icon: '📊' },
    { label: 'Tenants', path: '/super-admin/tenants', icon: '🏢' },
    { label: 'Analytics', path: '/super-admin/analytics', icon: '📈' },
  ];

  // Tenant Admin menu items (standard for all tenants)
  tenantAdminMenuItems: MenuItem[] = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { label: 'Customers', path: '/admin/customers', icon: '👥', permission: 'customers.read' },
    { label: 'Loans', path: '/admin/loans', icon: '💰', permission: 'loans.read' },
    { label: 'Payments', path: '/admin/payments', icon: '💳', permission: 'payments.read' },
    { label: 'Reports', path: '/admin/reports', icon: '📈', permission: 'reports.view' },
    { label: 'Loan Products', path: '/admin/loan-products', icon: '📦' },
    { label: 'Users', path: '/admin/users', icon: '👤', permission: 'users.read' },
    { label: 'Role Management', path: '/admin/rbac', icon: '🔐', permission: 'users.manage' },
    { label: 'Tenant Settings', path: '/admin/tenant-settings', icon: '🏢', permission: 'tenant.update' },
    { label: 'Settings', path: '/admin/settings', icon: '⚙️', permission: 'settings.read' },
  ];

  menuItems = computed(() => {
    const items = this.isSuperAdmin() ? this.superAdminMenuItems : this.tenantAdminMenuItems;
    // Filter based on permissions (only for tenant admin)
    return items.filter(item =>
      !item.permission || this.authService.hasPermission(item.permission)
    );
  });

  constructor() {
    // Set mock user for demo (only if no user exists)
    if (!this.authService.getCurrentUser()) {
      (this.authService as any).setMockUser();
    }

    // Update page title on route change
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updatePageTitle();
    });

    this.updatePageTitle();
  }

  private updatePageTitle(): void {
    const path = this.router.url.split('/')[1] || 'dashboard';
    const menuItem = this.menuItems().find(item => item.path.includes(path));
    this.pageTitle.set(menuItem?.label || 'Dashboard');
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getUserInitials(): string {
    const user = this.user();
    if (!user) return '?';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }

  getTenantInitials(): string {
    const user = this.user();
    if (!user?.tenant?.companyName) return '?';
    const words = user.tenant.companyName.split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  toggleSidebar(): void {
    this.isSidebarOpen.set(!this.isSidebarOpen());
  }

  logout(): void {
    this.authService.logout();
  }
}
