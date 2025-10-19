import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoggerService } from '../../services/logger.service';
import { TenantService, TenantForTesting, TenantUser } from '../../services/tenant.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private logger = inject(LoggerService);
  private tenantService = inject(TenantService);

  isLoading = signal(false);
  error = signal<string | null>(null);
  tenants = signal<TenantForTesting[]>([]);
  selectedTenant = signal<TenantForTesting | null>(null);
  selectedUser = signal<TenantUser | null>(null);

  loginForm: FormGroup = this.fb.group({
    email: ['admin@pacifica.ph', [Validators.required, Validators.email]],
    password: ['Admin@123', Validators.required]
  });

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants(): void {
    this.tenantService.getTenantsForTesting().subscribe({
      next: (response) => {
        if (response.success) {
          this.tenants.set(response.data.tenants);
          this.logger.info(`📋 Loaded ${response.data.tenants.length} tenants for testing`);
        }
      },
      error: (err) => {
        this.logger.error('Failed to load tenants for testing', err);
      }
    });
  }

  onTenantSelect(tenant: TenantForTesting): void {
    this.selectedTenant.set(tenant);
    this.selectedUser.set(null);
    this.logger.info(`🏢 Selected tenant: ${tenant.companyName}`);
  }

  onUserSelect(user: TenantUser): void {
    this.selectedUser.set(user);
    this.loginForm.patchValue({
      email: user.email,
      password: '11223344' // Standard password for all registered users
    });
    this.logger.info(`👤 Selected user: ${user.email} (${user.role})`);
  }

  /**
   * Quick login for testing - fills credentials and submits
   */
  quickLogin(role: 'super-admin' | 'tenant-admin' | 'collector'): void {
    const credentials = {
      'super-admin': {
        email: 'admin@pacifica.ph',
        password: 'Admin@123'
      },
      'tenant-admin': {
        email: 'admin@exits.com',
        password: 'ChangeMe123!'
      },
      'collector': {
        email: 'collector@exits.com',
        password: 'ChangeMe123!'
      }
    };

    const creds = credentials[role];
    this.loginForm.patchValue({
      email: creds.email,
      password: creds.password
    });

    // Auto-submit after a brief delay to show the filled form
    setTimeout(() => {
      this.onSubmit();
    }, 300);
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.error.set(null);

      const { email, password } = this.loginForm.value;
      this.logger.info(`📝 Login form submitted for: ${email}`);

      this.authService.login(email, password).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success) {
            // Check if user is super admin and redirect accordingly
            const isSuperAdmin = this.authService.isSuperAdmin();
            const redirectPath = isSuperAdmin ? '/super-admin/dashboard' : '/admin/dashboard';
            this.logger.success(`✅ Login successful, redirecting to ${redirectPath}...`);
            this.router.navigate([redirectPath]);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          const errorMsg = err.error?.message || 'Invalid email or password';
          this.error.set(errorMsg);
          this.logger.authFailed(email, errorMsg);
        }
      });
    } else {
      this.logger.formValidationError('login', this.loginForm.errors);
    }
  }
}
