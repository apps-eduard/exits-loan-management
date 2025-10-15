import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

interface MenuItem {
  label: string;
  path: string;
  icon: string;
  permission?: string;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-layout.component.html'
})
export class DashboardLayoutComponent {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private router = inject(Router);

  user = computed(() => this.authService.getCurrentUser());
  isDarkMode = this.themeService.isDarkMode;
  pageTitle = signal('Dashboard');

  menuItems: MenuItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Customers', path: '/customers', icon: '👥', permission: 'customers.read' },
    { label: 'Loans', path: '/loans', icon: '💰', permission: 'loans.read' },
    { label: 'Payments', path: '/payments', icon: '💳', permission: 'payments.read' },
    { label: 'Reports', path: '/reports', icon: '📈', permission: 'reports.view' },
    { label: 'Loan Products', path: '/loan-products', icon: '📦' },
    { label: 'Users', path: '/users', icon: '👤', permission: 'users.read' },
    { label: 'Settings', path: '/settings', icon: '⚙️', permission: 'settings.read' },
  ];

  constructor() {
    // Filter menu items based on permissions
    this.menuItems = this.menuItems.filter(item => 
      !item.permission || this.authService.hasPermission(item.permission)
    );

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
    const menuItem = this.menuItems.find(item => item.path.includes(path));
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

  logout(): void {
    this.authService.logout();
  }
}
