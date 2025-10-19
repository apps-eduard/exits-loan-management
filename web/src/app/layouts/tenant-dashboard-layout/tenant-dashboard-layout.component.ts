import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TenantNavigationComponent } from '../../shared/components/tenant-navigation/tenant-navigation.component';
import { TenantHeaderComponent } from '../../shared/components/tenant-header/tenant-header.component';

@Component({
  selector: 'app-tenant-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TenantNavigationComponent, TenantHeaderComponent],
  templateUrl: './tenant-dashboard-layout.component.html',
  styleUrl: './tenant-dashboard-layout.component.scss'
})
export class TenantDashboardLayoutComponent {
  isSidebarOpen = signal(false);

  toggleSidebar(): void {
    this.isSidebarOpen.update(value => !value);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }
}
