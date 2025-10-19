/**
 * Access Denied Component
 * Shown when user tries to access a resource they don't have permission for
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SystemRoles } from '../../core/services/rbac.service';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="access-denied-container">
      <div class="access-denied-card">
        <!-- Icon and Title -->
        <div class="error-icon">
          <span class="emoji">🚫</span>
        </div>

        <h1 class="error-title">Access Denied</h1>

        <div class="error-message">
          <p class="primary-message">
            You don't have permission to access this resource.
          </p>

          <div class="details" *ngIf="reason || returnUrl">
            <p class="reason" *ngIf="reason">
              <strong>Reason:</strong> {{ reason }}
            </p>

            <p class="attempted-url" *ngIf="returnUrl">
              <strong>Attempted to access:</strong>
              <code>{{ returnUrl }}</code>
            </p>
          </div>
        </div>

        <!-- User Information -->
        <div class="user-info" *ngIf="currentUserRole">
          <div class="info-card">
            <h3>Your Current Access Level</h3>
            <div class="role-display">
              <span class="role-emoji">👤</span>
              <span class="role-name">{{ formatRole(currentUserRole) }}</span>
              <span class="role-level">(Level {{ getRoleLevel() }})</span>
            </div>
          </div>
        </div>

        <!-- Suggested Actions -->
        <div class="suggested-actions">
          <h3>What you can do:</h3>
          <div class="action-list">
            <button class="action-button primary" (click)="goToDashboard()">
              <i class="material-icons">dashboard</i>
              <span>Go to Dashboard</span>
            </button>

            <button class="action-button secondary" (click)="goBack()">
              <i class="material-icons">arrow_back</i>
              <span>Go Back</span>
            </button>

            <button class="action-button info"
                    (click)="contactAdmin()"
                    *ngIf="currentUserRole !== 'tenant_admin'">
              <i class="material-icons">contact_support</i>
              <span>Contact Administrator</span>
            </button>
          </div>
        </div>

        <!-- Permission Request (if applicable) -->
        <div class="permission-request" *ngIf="canRequestPermission()">
          <div class="request-card">
            <h4>Need Access?</h4>
            <p>You can request access to this feature from your administrator.</p>
            <button class="request-button" (click)="requestAccess()">
              <i class="material-icons">mail</i>
              <span>Request Access</span>
            </button>
          </div>
        </div>

        <!-- Role-Specific Suggestions -->
        <div class="role-suggestions" *ngIf="getRoleSuggestions().length > 0">
          <h4>Available to You:</h4>
          <div class="suggestion-list">
            <a *ngFor="let suggestion of getRoleSuggestions()"
               [routerLink]="suggestion.path"
               class="suggestion-item">
              <span class="suggestion-emoji">{{ suggestion.emoji }}</span>
              <div class="suggestion-content">
                <span class="suggestion-title">{{ suggestion.title }}</span>
                <span class="suggestion-description">{{ suggestion.description }}</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .access-denied-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 2rem;
    }

    .access-denied-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      padding: 3rem;
      max-width: 600px;
      width: 100%;
      text-align: center;
    }

    .error-icon {
      margin-bottom: 2rem;
    }

    .error-icon .emoji {
      font-size: 5rem;
      display: block;
    }

    .error-title {
      font-size: 2.5rem;
      font-weight: bold;
      color: #dc3545;
      margin: 0 0 2rem 0;
    }

    .error-message {
      margin-bottom: 2rem;
    }

    .primary-message {
      font-size: 1.2rem;
      color: #495057;
      margin-bottom: 1.5rem;
    }

    .details {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1.5rem;
      text-align: left;
    }

    .reason, .attempted-url {
      margin: 0.5rem 0;
      font-size: 0.95rem;
      color: #6c757d;
    }

    .reason strong, .attempted-url strong {
      color: #495057;
    }

    code {
      background: #e9ecef;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }

    .user-info {
      margin: 2rem 0;
    }

    .info-card {
      background: #e7f3ff;
      border: 1px solid #b8daff;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .info-card h3 {
      margin: 0 0 1rem 0;
      color: #0056b3;
      font-size: 1.1rem;
    }

    .role-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .role-emoji {
      font-size: 1.5rem;
    }

    .role-name {
      font-size: 1.2rem;
      font-weight: 500;
      color: #0056b3;
    }

    .role-level {
      font-size: 0.9rem;
      color: #6c757d;
    }

    .suggested-actions {
      margin: 2rem 0;
    }

    .suggested-actions h3 {
      margin-bottom: 1.5rem;
      color: #495057;
    }

    .action-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 2rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 200px;
      justify-content: center;
    }

    .action-button.primary {
      background: #007bff;
      color: white;
    }

    .action-button.primary:hover {
      background: #0056b3;
      transform: translateY(-2px);
    }

    .action-button.secondary {
      background: #6c757d;
      color: white;
    }

    .action-button.secondary:hover {
      background: #545b62;
      transform: translateY(-2px);
    }

    .action-button.info {
      background: #17a2b8;
      color: white;
    }

    .action-button.info:hover {
      background: #138496;
      transform: translateY(-2px);
    }

    .permission-request {
      margin: 2rem 0;
    }

    .request-card {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .request-card h4 {
      margin: 0 0 0.5rem 0;
      color: #856404;
    }

    .request-card p {
      margin: 0 0 1rem 0;
      color: #856404;
    }

    .request-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #ffc107;
      color: #212529;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .request-button:hover {
      background: #e0a800;
      transform: translateY(-1px);
    }

    .role-suggestions {
      margin-top: 2rem;
      text-align: left;
    }

    .role-suggestions h4 {
      margin-bottom: 1rem;
      color: #495057;
      text-align: center;
    }

    .suggestion-list {
      display: grid;
      gap: 0.75rem;
    }

    .suggestion-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      text-decoration: none;
      color: #495057;
      transition: all 0.2s ease;
    }

    .suggestion-item:hover {
      background: #e9ecef;
      border-color: #007bff;
      text-decoration: none;
      color: #495057;
      transform: translateX(4px);
    }

    .suggestion-emoji {
      font-size: 1.5rem;
      min-width: 2rem;
      text-align: center;
    }

    .suggestion-content {
      display: flex;
      flex-direction: column;
    }

    .suggestion-title {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .suggestion-description {
      font-size: 0.9rem;
      color: #6c757d;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .access-denied-container {
        padding: 1rem;
      }

      .access-denied-card {
        padding: 2rem;
      }

      .error-title {
        font-size: 2rem;
      }

      .action-list {
        gap: 0.75rem;
      }

      .action-button {
        min-width: auto;
        width: 100%;
        max-width: 300px;
      }

      .role-display {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  `]
})
export class AccessDeniedComponent implements OnInit {
  reason: string | null = null;
  returnUrl: string | null = null;
  currentUserRole: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.reason = params['reason'] || null;
      this.returnUrl = params['returnUrl'] || null;
    });

    this.getCurrentUserRole();
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

  formatRole(role: string): string {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getRoleLevel(): number {
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

  goToDashboard(): void {
    if (this.currentUserRole === 'customer') {
      this.router.navigate(['/customer-portal/dashboard']);
    } else {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  goBack(): void {
    window.history.back();
  }

  contactAdmin(): void {
    // This would typically open a support ticket or contact form
    alert('Contact admin functionality would be implemented here');
  }

  canRequestPermission(): boolean {
    return this.currentUserRole !== 'tenant_admin' && this.currentUserRole !== 'customer';
  }

  requestAccess(): void {
    // This would typically submit a permission request
    alert('Permission request functionality would be implemented here');
  }

  getRoleSuggestions(): Array<{path: string, title: string, description: string, emoji: string}> {
    const suggestions: Record<string, Array<{path: string, title: string, description: string, emoji: string}>> = {
      'tenant_admin': [
        { path: '/admin/dashboard', title: 'Dashboard', description: 'View system overview', emoji: '📊' },
        { path: '/admin/users', title: 'User Management', description: 'Manage system users', emoji: '👥' },
        { path: '/admin/rbac', title: 'Role Management', description: 'Configure roles and permissions', emoji: '🔐' }
      ],
      'branch_manager': [
        { path: '/admin/dashboard', title: 'Dashboard', description: 'View branch overview', emoji: '📊' },
        { path: '/admin/loans', title: 'Loan Management', description: 'Manage and approve loans', emoji: '💰' },
        { path: '/admin/reports', title: 'Reports', description: 'View branch reports', emoji: '📈' }
      ],
      'loan_officer': [
        { path: '/admin/dashboard', title: 'Dashboard', description: 'View your activities', emoji: '📊' },
        { path: '/admin/customers', title: 'Customer Management', description: 'Manage customer accounts', emoji: '👥' },
        { path: '/admin/loans', title: 'Loan Processing', description: 'Process loan applications', emoji: '💰' }
      ],
      'collector': [
        { path: '/admin/dashboard', title: 'Dashboard', description: 'View collection tasks', emoji: '📊' },
        { path: '/admin/payments', title: 'Payment Collection', description: 'Record payments', emoji: '💳' },
        { path: '/admin/customers', title: 'Customer Contact', description: 'View customer information', emoji: '👥' }
      ],
      'auditor': [
        { path: '/admin/dashboard', title: 'Dashboard', description: 'View audit overview', emoji: '📊' },
        { path: '/admin/reports', title: 'Audit Reports', description: 'Generate audit reports', emoji: '🔍' }
      ],
      'customer': [
        { path: '/customer-portal/dashboard', title: 'My Dashboard', description: 'View your account', emoji: '🏠' },
        { path: '/customer-portal/my-loans', title: 'My Loans', description: 'View your loans', emoji: '💰' },
        { path: '/customer-portal/my-payments', title: 'My Payments', description: 'View payment history', emoji: '💳' }
      ]
    };

    return suggestions[this.currentUserRole || ''] || [];
  }
}
