/**
 * Role-Based Header Component
 * Dynamic header that adapts to user roles and shows relevant actions
 */

import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { RbacService, SystemRoles } from '../../../core/services/rbac.service';

interface HeaderAction {
  id: string;
  name: string;
  icon: string;
  emoji?: string;
  path?: string;
  action?: () => void;
  badge?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  requiredRoles: SystemRoles[];
  requiredPermissions?: string[];
}

@Component({
  selector: 'app-role-based-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="role-based-header">
      <!-- Left Section: Hamburger Menu & Logo & Breadcrumb -->
      <div class="header-left">
        <!-- Hamburger Menu Button -->
        <button
          class="hamburger-button"
          (click)="onSidebarToggle()"
          title="Toggle Menu">
          <svg class="hamburger-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div class="logo-section">
          <img src="assets/images/logo.png" alt="Logo" class="logo" *ngIf="hasLogo; else logoFallback">
          <ng-template #logoFallback>
            <div class="logo-text">
              <span class="logo-emoji">💰</span>
              <span class="app-name">LoanApp</span>
            </div>
          </ng-template>
        </div>

        <div class="breadcrumb" *ngIf="breadcrumbItems.length > 0">
          <span *ngFor="let item of breadcrumbItems; let last = last">
            <a [routerLink]="item.path" *ngIf="!last && item.path">{{ item.name }}</a>
            <span *ngIf="last || !item.path">{{ item.name }}</span>
            <span class="separator" *ngIf="!last">→</span>
          </span>
        </div>
      </div>

      <!-- Center Section: Role-Specific Actions -->
      <div class="header-center">
        <div class="role-actions">
          <button *ngFor="let action of availableActions"
                  class="action-button"
                  [class]="'action-' + (action.color || 'primary')"
                  [class.has-badge]="action.badge"
                  [title]="action.name"
                  (click)="executeAction(action)">

            <div class="action-content">
              <span class="action-emoji" *ngIf="action.emoji">{{ action.emoji }}</span>
              <span class="action-icon" *ngIf="!action.emoji">{{ action.icon }}</span>
              <span class="action-text">{{ action.name }}</span>

              <span class="action-badge" *ngIf="action.badge">
                {{ action.badge }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- Right Section: User Profile & Notifications -->
      <div class="header-right">
        <!-- Notifications -->
        <div class="notifications" *ngIf="notifications.length > 0">
          <button class="notification-button" [class.has-new]="hasNewNotifications">
            <span class="notification-icon">🔔</span>
            <span class="notification-count" *ngIf="notificationCount > 0">
              {{ notificationCount > 99 ? '99+' : notificationCount }}
            </span>
          </button>
        </div>

        <!-- User Profile -->
        <div class="user-profile" (click)="toggleUserMenu()">
          <div class="user-avatar">
            <img [src]="userProfile?.avatar" alt="Avatar" *ngIf="userProfile?.avatar; else avatarFallback">
            <ng-template #avatarFallback>
              <div class="avatar-fallback">
                {{ getUserInitials() }}
              </div>
            </ng-template>
          </div>

          <div class="user-info">
            <span class="user-name">{{ userProfile?.name || 'User' }}</span>
            <span class="user-role">{{ formatRole(currentUserRole) }}</span>
          </div>

          <span class="dropdown-icon">▼</span>
        </div>

        <!-- User Menu Dropdown -->
        <div class="user-menu" *ngIf="showUserMenu" (clickOutside)="closeUserMenu()">
          <div class="menu-header">
            <div class="user-details">
              <strong>{{ userProfile?.name || 'User' }}</strong>
              <small>{{ formatRole(currentUserRole) }}</small>
              <small class="user-email">{{ userProfile?.email }}</small>
            </div>
          </div>

          <div class="menu-divider"></div>

          <div class="menu-items">
            <a class="menu-item" routerLink="/profile">
              <span class="menu-icon">👤</span>
              <span>Profile Settings</span>
            </a>

            <a class="menu-item" routerLink="/profile/preferences"
               *ngIf="canAccessUserPreferences()">
              <span class="menu-icon">⚙️</span>
              <span>Preferences</span>
            </a>

            <a class="menu-item" routerLink="/admin/roles"
               *ngIf="canManageRoles()">
              <span class="menu-icon">🔐</span>
              <span>Role Management</span>
            </a>

            <div class="menu-divider"></div>

            <button class="menu-item logout" (click)="logout()">
              <span class="menu-icon">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .role-based-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      position: relative;
      z-index: 1000;
      min-height: 64px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .hamburger-button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hamburger-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .hamburger-icon {
      width: 24px;
      height: 24px;
      stroke-width: 2;
    }

    .logo-section {
      display: flex;
      align-items: center;
    }

    .logo {
      height: 40px;
      width: auto;
    }

    .logo-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .logo-emoji {
      font-size: 2rem;
    }

    .app-name {
      font-size: 1.5rem;
      font-weight: bold;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .breadcrumb a {
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
    }

    .breadcrumb a:hover {
      color: white;
      text-decoration: underline;
    }

    .separator {
      font-size: 1rem;
      opacity: 0.6;
    }

    .header-center {
      flex: 2;
      display: flex;
      justify-content: center;
    }

    .role-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      font-size: 0.9rem;
    }

    .action-button:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    .action-button.action-success {
      background: var(--success-color, #28a745);
    }

    .action-button.action-warning {
      background: var(--warning-color, #ffc107);
      color: #212529;
    }

    .action-button.action-danger {
      background: var(--danger-color, #dc3545);
    }

    .action-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      position: relative;
    }

    .action-emoji {
      font-size: 1.1rem;
    }

    .action-icon {
      font-size: 1.1rem;
    }

    .action-badge {
      position: absolute;
      top: -0.5rem;
      right: -0.5rem;
      background: var(--danger-color, #dc3545);
      color: white;
      font-size: 0.7rem;
      padding: 0.2rem 0.4rem;
      border-radius: 10px;
      min-width: 1.2rem;
      text-align: center;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
      justify-content: flex-end;
      position: relative;
    }

    .notifications {
      position: relative;
    }

    .notification-button {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .notification-button:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .notification-button.has-new {
      animation: pulse 2s infinite;
    }

    .notification-count {
      position: absolute;
      top: -0.25rem;
      right: -0.25rem;
      background: var(--danger-color, #dc3545);
      color: white;
      font-size: 0.7rem;
      padding: 0.1rem 0.3rem;
      border-radius: 10px;
      min-width: 1rem;
      text-align: center;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .user-profile:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
    }

    .user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-fallback {
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.1rem;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      text-align: left;
    }

    .user-name {
      font-weight: 500;
      font-size: 0.95rem;
    }

    .user-role {
      font-size: 0.8rem;
      opacity: 0.8;
    }

    .dropdown-icon {
      transition: transform 0.2s ease;
    }

    .user-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 0.5rem;
      background: white;
      color: var(--text-color, #333);
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      min-width: 250px;
      z-index: 1001;
    }

    .menu-header {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color, #e1e5e9);
    }

    .user-details strong {
      display: block;
      margin-bottom: 0.25rem;
    }

    .user-details small {
      display: block;
      color: var(--text-muted, #6c757d);
      font-size: 0.8rem;
    }

    .user-email {
      margin-top: 0.25rem;
    }

    .menu-divider {
      height: 1px;
      background: var(--border-color, #e1e5e9);
      margin: 0.5rem 0;
    }

    .menu-items {
      padding: 0.5rem 0;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: var(--text-color, #333);
      text-decoration: none;
      transition: all 0.2s ease;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
    }

    .menu-item:hover {
      background: var(--hover-bg, #f8f9fa);
      color: var(--text-color, #333);
      text-decoration: none;
    }

    .menu-item.logout {
      color: var(--danger-color, #dc3545);
    }

    .menu-item.logout:hover {
      background: var(--danger-light, rgba(220, 53, 69, 0.1));
    }

    .menu-item i {
      font-size: 1.1rem;
      color: var(--icon-color, #6c757d);
    }

    .menu-item.logout i {
      color: var(--danger-color, #dc3545);
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .role-based-header {
        padding: 1rem;
        flex-wrap: wrap;
      }

      .header-center {
        order: 3;
        flex: 100%;
        margin-top: 1rem;
      }

      .role-actions {
        justify-content: center;
        flex-wrap: wrap;
      }

      .breadcrumb {
        display: none;
      }

      .user-info {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .action-text {
        display: none;
      }

      .action-button {
        padding: 0.5rem;
        min-width: 40px;
        justify-content: center;
      }
    }
  `]
})
export class RoleBasedHeaderComponent implements OnInit, OnDestroy {
  @Output() sidebarToggle = new EventEmitter<void>();

  currentUserRole: SystemRoles | null = null;
  availableActions: HeaderAction[] = [];
  notifications: any[] = [];
  showUserMenu = false;

  userProfile: {
    name: string;
    email: string;
    avatar: string | null;
  } | null = {
    name: 'John Doe',
    email: 'admin@pacifica.demo',
    avatar: null
  };

  breadcrumbItems = [
    { name: 'Dashboard', path: null }
  ];

  hasLogo = false;

  private destroy$ = new Subject<void>();

  // Define all possible header actions
  private allActions: HeaderAction[] = [
    {
      id: 'new-loan',
      name: 'New Loan',
      icon: 'add_circle',
      emoji: '➕💰',
      path: '/loans/new',
      color: 'success',
      requiredRoles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.LOAN_OFFICER],
      requiredPermissions: ['loan_create']
    },
    {
      id: 'approve-loans',
      name: 'Approvals',
      icon: 'approval',
      emoji: '✅',
      path: '/loans/approvals',
      badge: '5',
      color: 'warning',
      requiredRoles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER],
      requiredPermissions: ['loan_approve']
    },
    {
      id: 'record-payment',
      name: 'Record Payment',
      icon: 'payment',
      emoji: '💳',
      path: '/payments/record',
      color: 'primary',
      requiredRoles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.LOAN_OFFICER, SystemRoles.COLLECTOR],
      requiredPermissions: ['payment_create']
    },
    {
      id: 'collection-tasks',
      name: 'Collections',
      icon: 'assignment_late',
      emoji: '📞',
      path: '/collections/tasks',
      badge: 'urgent',
      color: 'danger',
      requiredRoles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.COLLECTOR],
      requiredPermissions: ['collection_view']
    },
    {
      id: 'add-customer',
      name: 'Add Customer',
      icon: 'person_add',
      emoji: '👤➕',
      path: '/customers/new',
      color: 'info',
      requiredRoles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.LOAN_OFFICER],
      requiredPermissions: ['customer_create']
    },
    {
      id: 'reports',
      name: 'Reports',
      icon: 'assessment',
      emoji: '📊',
      path: '/reports',
      color: 'primary',
      requiredRoles: [SystemRoles.TENANT_ADMIN, SystemRoles.BRANCH_MANAGER, SystemRoles.AUDITOR],
      requiredPermissions: ['report_view']
    }
  ];

  constructor(
    private rbacService: RbacService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getCurrentUserRole();
    this.loadAvailableActions();
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getCurrentUserRole(): void {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUserRole = payload.role;
      } catch (error) {
        console.warn('Could not decode auth token', error);
      }
    }
  }

  private loadAvailableActions(): void {
    if (!this.currentUserRole) return;

    this.availableActions = this.allActions.filter(action => {
      return action.requiredRoles.includes(this.currentUserRole!);
    });
  }

  private loadNotifications(): void {
    // Mock notifications - replace with actual service call
    this.notifications = [
      { id: 1, message: 'New loan application pending', type: 'info' },
      { id: 2, message: 'Payment overdue alert', type: 'warning' }
    ];
  }

  get notificationCount(): number {
    return this.notifications.length;
  }

  get hasNewNotifications(): boolean {
    return this.notifications.some(n => n.type === 'warning' || n.type === 'danger');
  }

  executeAction(action: HeaderAction): void {
    if (action.path) {
      this.router.navigate([action.path]);
    } else if (action.action) {
      action.action();
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  getUserInitials(): string {
    if (!this.userProfile) return 'U';
    return this.userProfile.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  formatRole(role: SystemRoles | null): string {
    if (!role) return '';
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  canAccessUserPreferences(): boolean {
    return this.currentUserRole !== SystemRoles.CUSTOMER;
  }

  canManageRoles(): boolean {
    return this.currentUserRole === SystemRoles.TENANT_ADMIN;
  }

  onSidebarToggle(): void {
    this.sidebarToggle.emit();
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.router.navigate(['/auth/login']);
  }
}
