import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TenantService, Tenant } from '../../core/services/tenant.service';
import { LoggerService } from '../../services/logger.service';

@Component({
  selector: 'app-tenant-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full">
        <!-- Tenant Branding Card -->
        @if (tenant()) {
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <!-- Tenant Header with Branding -->
            <div class="px-8 py-8 text-center"
                 [style.background]="'linear-gradient(135deg, ' + (tenant()!.primary_color || '#3B82F6') + ' 0%, ' + adjustColor(tenant()!.primary_color || '#3B82F6', -20) + ' 100%)'">
              @if (tenant()!.logo_url) {
                <img [src]="tenant()!.logo_url" 
                     [alt]="tenant()!.company_name + ' logo'"
                     class="h-16 w-auto mx-auto mb-4 rounded-lg bg-white/10 p-2">
              } @else {
                <div class="h-16 w-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                  {{ getInitials(tenant()!.company_name) }}
                </div>
              }
              <h1 class="text-3xl font-bold text-white">{{ tenant()!.company_name }}</h1>
              <p class="text-white/80 mt-2">Sign in to your account</p>
            </div>

            <!-- Login Form -->
            <div class="px-8 py-8">
              @if (error()) {
                <div class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div class="flex items-center">
                    <svg class="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                    <p class="text-sm text-red-700 dark:text-red-400">{{ error() }}</p>
                  </div>
                </div>
              }

              <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                <div class="space-y-5">
                  <!-- Email Input -->
                  <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      formControlName="email"
                      class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white transition-colors"
                      [style.focus:ring-color]="tenant()!.primary_color || '#3B82F6'"
                      placeholder="you@example.com"
                      [class.border-red-500]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
                  </div>

                  <!-- Password Input -->
                  <div>
                    <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      formControlName="password"
                      class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white transition-colors"
                      [style.focus:ring-color]="tenant()!.primary_color || '#3B82F6'"
                      placeholder="••••••••"
                      [class.border-red-500]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                  </div>

                  <!-- Remember Me -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <input
                        id="remember"
                        type="checkbox"
                        class="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                        [style.accent-color]="tenant()!.primary_color || '#3B82F6'">
                      <label for="remember" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Remember me
                      </label>
                    </div>
                    <a href="#" class="text-sm font-medium hover:underline"
                       [style.color]="tenant()!.primary_color || '#3B82F6'">
                      Forgot password?
                    </a>
                  </div>

                  <!-- Submit Button -->
                  <button
                    type="submit"
                    [disabled]="isLoading() || loginForm.invalid"
                    class="w-full py-3 px-4 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    [style.background-color]="tenant()!.primary_color || '#3B82F6'">
                    @if (isLoading()) {
                      <span class="flex items-center justify-center">
                        <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Signing in...
                      </span>
                    } @else {
                      <span>Sign In</span>
                    }
                  </button>
                </div>
              </form>

              <!-- Footer -->
              <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p class="text-center text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account? 
                  <a href="#" class="font-medium hover:underline ml-1"
                     [style.color]="tenant()!.primary_color || '#3B82F6'">
                    Contact {{ tenant()!.company_name }}
                  </a>
                </p>
              </div>
            </div>
          </div>
        } @else if (tenantError()) {
          <!-- Tenant Not Found -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tenant Not Found</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">{{ tenantError() }}</p>
            <a routerLink="/auth/login" 
               class="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Go to Main Login
            </a>
          </div>
        } @else {
          <!-- Loading State -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-12 text-center">
            <div class="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400">Loading tenant...</p>
          </div>
        }

        <!-- Back to Super Admin Login -->
        <div class="mt-6 text-center">
          <a routerLink="/auth/login" 
             class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            ← Back to System Login
          </a>
        </div>
      </div>
    </div>
  `
})
export class TenantLoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private logger = inject(LoggerService);

  tenant = signal<Tenant | null>(null);
  tenantError = signal<string | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadTenantBySlug(slug);
    } else {
      this.tenantError.set('No tenant specified');
    }
  }

  private async loadTenantBySlug(slug: string): Promise<void> {
    try {
      this.logger.info(`🏢 Loading tenant by slug: ${slug}`);
      
      // Get all tenants and find by slug
      const tenants = await this.tenantService.getAllTenants();
      const foundTenant = tenants.find((t: Tenant) => t.slug === slug);
      
      if (foundTenant) {
        this.tenant.set(foundTenant);
        this.logger.success(`Tenant loaded: ${foundTenant.company_name}`);
      } else {
        this.tenantError.set(`Tenant "${slug}" not found`);
        this.logger.error(`Tenant not found: ${slug}`);
      }
    } catch (err) {
      this.tenantError.set('Failed to load tenant information');
      this.logger.error('Error loading tenant', err);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid && this.tenant()) {
      this.isLoading.set(true);
      this.error.set(null);

      const { email, password } = this.loginForm.value;
      this.logger.info(`📝 Tenant login attempt for: ${email} at ${this.tenant()!.company_name}`);

      this.authService.login(email, password).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success) {
            // Verify user belongs to this tenant
            const userTenantId = this.authService.getTenantId();
            if (userTenantId !== this.tenant()!.id) {
              this.error.set(`This account does not belong to ${this.tenant()!.company_name}`);
              this.authService.logout();
              return;
            }

            this.logger.success(`✅ Tenant login successful for ${this.tenant()!.company_name}`);
            this.router.navigate(['/admin/dashboard']);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          const errorMsg = err.error?.message || 'Invalid email or password';
          this.error.set(errorMsg);
          this.logger.authFailed(email, errorMsg);
        }
      });
    }
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Adjust color brightness for gradient effect
   */
  adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }
}
