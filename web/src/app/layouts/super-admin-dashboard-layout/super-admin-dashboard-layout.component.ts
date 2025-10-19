import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SuperAdminHeaderComponent } from '../../shared/components/super-admin-header/super-admin-header.component';
import { SuperAdminNavigationComponent } from '../../shared/components/super-admin-navigation/super-admin-navigation.component';

@Component({
  selector: 'app-super-admin-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SuperAdminHeaderComponent,
    SuperAdminNavigationComponent
  ],
  templateUrl: './super-admin-dashboard-layout.component.html',
  styleUrl: './super-admin-dashboard-layout.component.scss'
})
export class SuperAdminDashboardLayoutComponent {
  isSidebarOpen = signal(true);

  toggleSidebar(): void {
    this.isSidebarOpen.update(value => !value);
  }
}
