/**
 * Dynamic Navigation Component
 * Generates navigation menu based on user roles and permissions
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { RbacService, MenuGroup, MenuItem } from '../../../core/services/rbac.service';

@Component({
  selector: 'app-dynamic-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="professional-navigation">
      <!-- Navigation Header -->
      <div class="nav-header">
        <div class="nav-title">
          <span class="nav-icon">📊</span>
          <span class="title-text">Management</span>
        </div>
      </div>

      <!-- Main Menu Groups -->
      <div class="menu-section" *ngFor="let group of menuGroups">
        <!-- Group Header -->
        <div class="section-header"
             [class.expanded]="group.expanded"
             (click)="toggleGroup(group)">
          <div class="section-info">
            <span class="section-icon">{{ group.emoji || '📁' }}</span>
            <span class="section-title">{{ group.name }}</span>
          </div>
          <svg class="expand-arrow" [class.rotated]="group.expanded"
               width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </div>

        <!-- Group Items -->
        <div class="menu-items" *ngIf="group.expanded">
          <a *ngFor="let item of group.items"
             [routerLink]="item.path"
             routerLinkActive="active"
             class="nav-link"
             [title]="item.name">

            <div class="link-content">
              <span class="link-icon">{{ item.emoji || '•' }}</span>
              <span class="link-text">{{ item.name }}</span>
            </div>

            <div class="link-indicators">
              <span class="item-badge" *ngIf="item.badge"
                    [class]="'badge-' + item.badge">
                {{ getBadgeText(item.badge) }}
              </span>
              <span class="permission-dot"
                    *ngIf="item.required_permissions.length > 0"
                    [title]="getPermissionTooltip(item)">
              </span>
            </div>
          </a>
        </div>
      </div>

      <!-- Quick Actions Section -->
      <div class="quick-section" *ngIf="quickActions.length > 0">
        <div class="section-divider"></div>
        <div class="section-label">Quick Actions</div>
        <div class="quick-grid">
          <a *ngFor="let action of quickActions"
             [routerLink]="action.path"
             class="quick-btn"
             [title]="action.name">
            <div class="btn-icon">{{ action.emoji || '+' }}</div>
            <div class="btn-text">{{ action.name }}</div>
          </a>
        </div>
      </div>

      <!-- User Role Badge -->
      <div class="role-badge">
        <div class="badge-content">
          <div class="role-avatar">
            <span class="avatar-icon">👤</span>
          </div>
          <div class="role-details">
            <div class="role-title">{{ formatRoleName(currentUserRole) }}</div>
            <div class="role-subtitle">Access Level {{ getUserRoleLevel() }}</div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .professional-navigation {
      height: 100%;
      background: #f8fafc;
      border-right: 1px solid #e2e8f0;
    }

    /* Navigation Header */
    .nav-header {
      padding: 1.25rem 1rem;
      border-bottom: 1px solid #e2e8f0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin-bottom: 1rem;
    }

    .nav-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: white;
    }

    .nav-icon {
      font-size: 1.25rem;
    }

    .title-text {
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: 0.025em;
    }

    /* Menu Sections */
    .menu-section {
      margin-bottom: 1.5rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1rem;
      margin: 0 0.75rem 0.5rem 0.75rem;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      background: white;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .section-header:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .section-header.expanded {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
    }

    .section-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .section-icon {
      font-size: 1.125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: rgba(59, 130, 246, 0.1);
    }

    .section-header.expanded .section-icon {
      background: rgba(255, 255, 255, 0.2);
    }

    .section-title {
      font-weight: 600;
      font-size: 0.925rem;
      color: #374151;
      letter-spacing: 0.025em;
    }

    .section-header.expanded .section-title {
      color: white;
    }

    .expand-arrow {
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      color: #6b7280;
      flex-shrink: 0;
    }

    .section-header.expanded .expand-arrow {
      color: white;
    }

    .expand-arrow.rotated {
      transform: rotate(90deg);
    }

    /* Menu Items */
    .menu-items {
      padding: 0.5rem 0.75rem 1rem 0.75rem;
      background: rgba(59, 130, 246, 0.02);
      border-left: 3px solid #3b82f6;
      margin-left: 0.75rem;
      border-radius: 0 8px 8px 0;
    }

    .nav-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      margin-bottom: 0.375rem;
      text-decoration: none;
      color: #374151;
      background: white;
      border-radius: 8px;
      border: 1px solid #f1f5f9;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .nav-link::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 0;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 0;
    }

    .nav-link:hover {
      color: #1f2937;
      background: #f8fafc;
      border-color: #cbd5e1;
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .nav-link.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
    }

    .nav-link.active::before {
      width: 100%;
    }

    /* Link Content */
    .link-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      position: relative;
      z-index: 1;
    }

    .link-icon {
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      transition: all 0.2s ease;
    }

    .nav-link.active .link-icon {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .link-text {
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: 0.025em;
    }

    /* Link Indicators */
    .link-indicators {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      position: relative;
      z-index: 1;
    }

    .item-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
    }

    .badge-urgent {
      background: #ef4444;
    }

    .badge-pending {
      background: #f59e0b;
    }

    .badge-new {
      background: #10b981;
    }

    .permission-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #6b7280;
      opacity: 0.6;
    }

    /* Quick Actions Section */
    .quick-section {
      margin: 2rem 0.75rem 1.5rem 0.75rem;
    }

    .section-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
      margin-bottom: 1rem;
    }

    .section-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.75rem;
      padding: 0 0.5rem;
    }

    .quick-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .quick-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem 0.75rem;
      text-decoration: none;
      color: #374151;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .quick-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .quick-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      border-color: #3b82f6;
    }

    .quick-btn:hover::before {
      opacity: 0.05;
    }

    .btn-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      position: relative;
      z-index: 1;
    }

    .btn-text {
      font-size: 0.75rem;
      font-weight: 500;
      text-align: center;
      line-height: 1.2;
      position: relative;
      z-index: 1;
    }

    /* Role Badge */
    .role-badge {
      position: absolute;
      bottom: 1rem;
      left: 0.75rem;
      right: 0.75rem;
      background: linear-gradient(135deg, #1f2937, #374151);
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      border: 1px solid #374151;
    }

    .badge-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .role-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border-radius: 10px;
      flex-shrink: 0;
    }

    .avatar-icon {
      font-size: 1.25rem;
      color: white;
    }

    .role-details {
      flex: 1;
      min-width: 0;
    }

    .role-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
      margin-bottom: 0.25rem;
    }

    .role-subtitle {
      font-size: 0.75rem;
      color: #9ca3af;
      font-weight: 500;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .professional-navigation {
        font-size: 0.875rem;
      }

      .nav-header {
        padding: 1rem;
      }

      .section-header {
        padding: 0.75rem;
        margin: 0 0.5rem 0.5rem 0.5rem;
      }

      .nav-link {
        padding: 0.625rem 0.75rem;
      }

      .quick-section {
        margin: 1.5rem 0.5rem 1rem 0.5rem;
      }

      .quick-grid {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      .role-badge {
        left: 0.5rem;
        right: 0.5rem;
        padding: 0.75rem;
      }

      .role-avatar {
        width: 36px;
        height: 36px;
      }
    }

    /* Smooth Animations */
    * {
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Scrollbar Styling */
    .professional-navigation::-webkit-scrollbar {
      width: 4px;
    }

    .professional-navigation::-webkit-scrollbar-track {
      background: transparent;
    }

    .professional-navigation::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 2px;
    }

    .professional-navigation::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class DynamicNavigationComponent implements OnInit, OnDestroy {
  menuGroups: (MenuGroup & { expanded: boolean })[] = [];
  quickActions: MenuItem[] = [];
  currentUserRole: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private rbacService: RbacService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserMenu();
    this.getCurrentUserRole();

    // Subscribe to menu updates
    this.rbacService.userMenu$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(menu => {
      if (menu) {
        this.processMenu(menu);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserMenu(): void {
    console.log('🔧 Loading user menu for dynamic navigation');
    // For now, always use local menu generation
    this.generateLocalMenu();
  }

  private generateLocalMenu(): void {
    console.log('🔧 Generating local menu for dynamic navigation');

    // Create a simple default menu for demo
    const defaultMenu: (MenuGroup & { expanded: boolean })[] = [
      {
        id: 'core',
        name: 'Core Features',
        icon: 'dashboard',
        emoji: '🏠',
        order: 1,
        expanded: true,
        items: [
          {
            id: 'dashboard',
            name: 'Dashboard',
            path: '/admin/dashboard',
            icon: 'dashboard',
            emoji: '📊',
            order: 1,
            group_id: 'core',
            required_permissions: [],
            require_all_permissions: false,
            visible_to_roles: ['*']
          },
          {
            id: 'analytics',
            name: 'Analytics',
            path: '/admin/analytics',
            icon: 'analytics',
            emoji: '�',
            order: 2,
            group_id: 'core',
            required_permissions: [],
            require_all_permissions: false,
            visible_to_roles: ['*']
          },
          {
            id: 'reports',
            name: 'Reports',
            path: '/admin/reports',
            icon: 'assessment',
            emoji: '�',
            order: 3,
            group_id: 'core',
            required_permissions: [],
            require_all_permissions: false,
            visible_to_roles: ['*']
          }
        ]
      },
      {
        id: 'management',
        name: 'Management',
        icon: 'settings',
        emoji: '⚙️',
        order: 2,
        expanded: true, // Change to true so it's visible by default
        items: [
          {
            id: 'users',
            name: 'User Management',
            path: '/admin/users',
            icon: 'person',
            emoji: '👥',
            order: 1,
            group_id: 'management',
            required_permissions: [],
            require_all_permissions: false,
            visible_to_roles: ['*']
          },
          {
            id: 'customers-mgmt',
            name: 'Customer Management',
            path: '/admin/customers',
            icon: 'person',
            emoji: '👤',
            order: 2,
            group_id: 'management',
            required_permissions: [],
            require_all_permissions: false,
            visible_to_roles: ['*']
          },
          {
            id: 'rbac',
            name: 'Role & Permissions',
            path: '/admin/rbac',
            icon: 'security',
            emoji: '🔐',
            order: 3,
            group_id: 'management',
            required_permissions: [],
            require_all_permissions: false,
            visible_to_roles: ['*']
          },
          {
            id: 'settings',
            name: 'Tenant Settings',
            path: '/admin/tenant-settings',
            icon: 'settings',
            emoji: '⚙️',
            order: 4,
            group_id: 'management',
            required_permissions: [],
            require_all_permissions: false,
            visible_to_roles: ['*']
          }
        ]
      },
      {
        id: 'loans',
        name: 'Loans & Payments',
        icon: 'monetization_on',
        emoji: '💰',
        order: 3,
        expanded: false,
        items: [
          {
            id: 'loans-list',
            name: 'All Loans',
            path: '/admin/loans',
            icon: 'list',
            emoji: '📋',
            order: 1,
            group_id: 'loans',
            required_permissions: [],
            require_all_permissions: false,
            visible_to_roles: ['*']
          },
          {
            id: 'loan-applications',
            name: 'Applications',
            path: '/admin/loan-applications',
            icon: 'assignment',
            emoji: '📝',
            order: 2,
            group_id: 'loans',
            required_permissions: [],
            require_all_permissions: false,
            visible_to_roles: ['*'],
            badge: 'pending'
          },
          {
            id: 'payments',
            name: 'Payments',
            path: '/admin/payments',
            icon: 'payment',
            emoji: '💳',
            order: 3,
            group_id: 'loans',
            required_permissions: [],
            require_all_permissions: false,
            visible_to_roles: ['*']
          },
          {
            id: 'loan-products',
            name: 'Loan Products',
            path: '/admin/loan-products',
            icon: 'category',
            emoji: '📦',
            order: 4,
            group_id: 'loans',
            required_permissions: [],
            require_all_permissions: false,
            visible_to_roles: ['*']
          }
        ]
      }
    ];

    this.menuGroups = defaultMenu;

    // Add quick actions
    this.quickActions = [
      {
        id: 'new-loan',
        name: 'New Loan',
        path: '/admin/loans/new',
        icon: 'add',
        emoji: '💰',
        order: 1,
        group_id: 'quick',
        required_permissions: [],
        require_all_permissions: false,
        visible_to_roles: ['*']
      },
      {
        id: 'new-customer',
        name: 'Add Customer',
        path: '/admin/customers/new',
        icon: 'person_add',
        emoji: '👤',
        order: 2,
        group_id: 'quick',
        required_permissions: [],
        require_all_permissions: false,
        visible_to_roles: ['*']
      }
    ];

    console.log('✅ Local menu generated:', this.menuGroups);
  }

  private processMenu(menu: MenuGroup[]): void {
    // Add expanded state to menu groups
    this.menuGroups = menu.map(group => ({
      ...group,
      expanded: group.order <= 2 // Expand first two groups by default
    }));

    // Extract quick actions (commonly used items)
    this.quickActions = this.extractQuickActions(menu);
  }

  private extractQuickActions(menu: MenuGroup[]): MenuItem[] {
    const quickActionIds = [
      'new-loan',
      'record-payment',
      'new-customer',
      'overview'
    ];

    const actions: MenuItem[] = [];

    menu.forEach(group => {
      group.items.forEach(item => {
        if (quickActionIds.includes(item.id)) {
          actions.push(item);
        }
      });
    });

    return actions.sort((a, b) => a.order - b.order).slice(0, 4);
  }

  private getCurrentUserRole(): void {
    // Set default role for demo
    this.currentUserRole = 'tenant_admin';
    console.log('✅ User role set:', this.currentUserRole);
  }

  toggleGroup(group: MenuGroup & { expanded: boolean }): void {
    group.expanded = !group.expanded;
  }

  getPermissionTooltip(item: MenuItem): string {
    if (item.required_permissions.length === 0) {
      return 'No special permissions required';
    }

    const permissionText = item.required_permissions.join(', ');
    const requirementText = item.require_all_permissions ?
      'Requires ALL permissions' : 'Requires ANY permission';

    return `${requirementText}: ${permissionText}`;
  }

  getUserRoleLevel(): number {
    const roleHierarchy: Record<string, number> = {
      'tenant_admin': 6,
      'branch_manager': 5,
      'loan_officer': 4,
      'collector': 3,
      'auditor': 2,
      'customer': 1
    };

    return roleHierarchy[this.currentUserRole || ''] || 0;
  }

  getBadgeText(badge: string): string {
    const badgeMap: Record<string, string> = {
      'urgent': '!',
      'pending': '●',
      'new': 'N',
      'updated': 'U'
    };
    return badgeMap[badge] || badge;
  }

  formatRoleName(role: string | null): string {
    if (!role) return 'User';
    return role.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
}
