import { Component, computed, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { User } from '../../../models/auth.model';

@Component({
  selector: 'app-super-admin-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './super-admin-header.component.html',
  styleUrl: './super-admin-header.component.scss'
})
export class SuperAdminHeaderComponent {
  sidebarToggle = output<void>();
  isProfileMenuOpen = false;
  isNotificationsOpen = false;

  currentUser = signal<User | null>(null);

  // Mock notifications - replace with real data
  notifications = [
    { id: 1, message: 'New tenant registration: TechCorp Ltd', time: '5 min ago', unread: true },
    { id: 2, message: 'Subscription payment received: $599', time: '1 hour ago', unread: true },
    { id: 3, message: 'Feature request: BNPL Module', time: '2 hours ago', unread: false }
  ];

  unreadCount = computed(() =>
    this.notifications.filter(n => n.unread).length
  );

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService
  ) {
    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  getUserName(): string {
    const user = this.currentUser();
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }
    return 'Super Admin';
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (user) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    return 'SA';
  }

  getUserRole(): string {
    const user = this.currentUser();
    return user?.role || 'Super Administrator';
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    if (this.isProfileMenuOpen) {
      this.isNotificationsOpen = false;
    }
  }

  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    if (this.isNotificationsOpen) {
      this.isProfileMenuOpen = false;
    }
  }

  markAsRead(notificationId: number): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.unread = false;
    }
  }

  viewProfile(): void {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/super-admin/profile']);
  }

  viewSettings(): void {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/super-admin/settings/general']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onToggleSidebar(): void {
    this.sidebarToggle.emit();
  }
}
