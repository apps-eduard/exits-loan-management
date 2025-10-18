import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TenantService } from '../../core/services/tenant.service';
import { LoggerService } from '../../services/logger.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div class="max-w-2xl mx-auto">
        
        <!-- Back Button -->
        <a routerLink="/" class="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Home
        </a>

        <!-- Registration Card -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          
          <!-- Header -->
          <div class="text-center mb-8">
            <div class="inline-flex h-16 w-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl items-center justify-center mb-4">
              <span class="text-white font-bold text-2xl">E</span>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Your Tenant Account</h1>
            <p class="text-gray-600 dark:text-gray-400">Start your 14-day free trial — no credit card required</p>
          </div>

          <!-- Success Message -->
          @if (success()) {
            <div class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div class="flex items-center gap-2">
                <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div>
                  <p class="font-semibold text-green-900 dark:text-green-200">Registration Successful!</p>
                  <p class="text-sm text-green-700 dark:text-green-300">Redirecting to login page...</p>
                </div>
              </div>
            </div>
          }

          <!-- Error Message -->
          @if (error()) {
            <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div class="flex items-center gap-2">
                <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-sm text-red-700 dark:text-red-300">{{ error() }}</p>
              </div>
            </div>
          }

          <!-- Registration Form -->
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6">
            
            <!-- Company Information -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span class="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">1</span>
                Company Information
              </h3>

              <div>
                <label class="label">Company Name *</label>
                <input
                  type="text"
                  formControlName="companyName"
                  class="input"
                  placeholder="Your Company Inc."
                  [class.border-red-500]="registerForm.get('companyName')?.invalid && registerForm.get('companyName')?.touched">
                @if (registerForm.get('companyName')?.invalid && registerForm.get('companyName')?.touched) {
                  <p class="mt-1 text-xs text-red-600 dark:text-red-400">Company name is required</p>
                }
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="label">Contact Person *</label>
                  <input
                    type="text"
                    formControlName="contactPerson"
                    class="input"
                    placeholder="John Doe"
                    [class.border-red-500]="registerForm.get('contactPerson')?.invalid && registerForm.get('contactPerson')?.touched">
                </div>
                <div>
                  <label class="label">Contact Phone *</label>
                  <input
                    type="tel"
                    formControlName="contactPhone"
                    class="input"
                    placeholder="+63 912 345 6789"
                    [class.border-red-500]="registerForm.get('contactPhone')?.invalid && registerForm.get('contactPhone')?.touched">
                </div>
              </div>

              <div>
                <label class="label">Business Email *</label>
                <input
                  type="email"
                  formControlName="contactEmail"
                  class="input"
                  placeholder="admin@yourcompany.com"
                  [class.border-red-500]="registerForm.get('contactEmail')?.invalid && registerForm.get('contactEmail')?.touched">
                @if (registerForm.get('contactEmail')?.invalid && registerForm.get('contactEmail')?.touched) {
                  <p class="mt-1 text-xs text-red-600 dark:text-red-400">Valid email is required</p>
                }
              </div>
            </div>

            <!-- Business Address -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span class="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm font-bold">2</span>
                Business Address
              </h3>

              <div>
                <label class="label">Street Address *</label>
                <input
                  type="text"
                  formControlName="addressLine1"
                  class="input"
                  placeholder="123 Main Street"
                  [class.border-red-500]="registerForm.get('addressLine1')?.invalid && registerForm.get('addressLine1')?.touched">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="label">City *</label>
                  <input
                    type="text"
                    formControlName="city"
                    class="input"
                    placeholder="Manila"
                    [class.border-red-500]="registerForm.get('city')?.invalid && registerForm.get('city')?.touched">
                </div>
                <div>
                  <label class="label">Province/State *</label>
                  <input
                    type="text"
                    formControlName="province"
                    class="input"
                    placeholder="Metro Manila"
                    [class.border-red-500]="registerForm.get('province')?.invalid && registerForm.get('province')?.touched">
                </div>
              </div>
            </div>

            <!-- Admin Account Setup -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span class="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-bold">3</span>
                Admin Account Setup
              </h3>
              
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Create your admin account to manage your tenant
              </p>

              <div>
                <label class="label">Password *</label>
                <input
                  type="password"
                  formControlName="password"
                  class="input"
                  placeholder="Min. 8 characters"
                  [class.border-red-500]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
                @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
                  <p class="mt-1 text-xs text-red-600 dark:text-red-400">Password must be at least 8 characters</p>
                }
              </div>

              <div>
                <label class="label">Confirm Password *</label>
                <input
                  type="password"
                  formControlName="confirmPassword"
                  class="input"
                  placeholder="Re-enter password"
                  [class.border-red-500]="(registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched) || (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched)">
                @if (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched) {
                  <p class="mt-1 text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
                }
              </div>
            </div>

            <!-- Choose Your Plan -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span class="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-bold">4</span>
                Choose Your Plan
              </h3>

              <div class="grid grid-cols-3 gap-4">
                @for (plan of plans(); track plan.value) {
                  <label class="relative cursor-pointer">
                    <input
                      type="radio"
                      formControlName="subscriptionPlan"
                      [value]="plan.value"
                      class="sr-only peer">
                    <div class="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg peer-checked:border-blue-600 dark:peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/10 transition-all">
                      <p class="font-semibold text-gray-900 dark:text-white text-center">{{ plan.label }}</p>
                      <p class="text-sm text-gray-600 dark:text-gray-400 text-center mt-1">{{ plan.price }}</p>
                    </div>
                  </label>
                }
              </div>
            </div>

            <!-- Terms and Conditions -->
            <div class="flex items-start gap-3">
              <input
                type="checkbox"
                formControlName="agreeToTerms"
                class="mt-1 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
              <label class="text-sm text-gray-700 dark:text-gray-300">
                I agree to the <a href="#" class="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</a> and <a href="#" class="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>
              </label>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="registerForm.invalid || isLoading()"
              class="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
              @if (isLoading()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Creating Your Account...
                </span>
              } @else {
                <span>Create Tenant Account →</span>
              }
            </button>
          </form>

          <!-- Already Have Account -->
          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Already have an account? 
              <a routerLink="/auth/login" class="text-blue-600 dark:text-blue-400 hover:underline font-medium ml-1">
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private logger = inject(LoggerService);

  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  plans = signal([
    { value: 'free', label: 'Starter', price: 'Free 14 days' },
    { value: 'standard', label: 'Standard', price: '$29/mo' },
    { value: 'premium', label: 'Premium', price: '$49/mo' }
  ]);

  registerForm: FormGroup = this.fb.group({
    companyName: ['', Validators.required],
    contactPerson: ['', Validators.required],
    contactEmail: ['', [Validators.required, Validators.email]],
    contactPhone: ['', Validators.required],
    addressLine1: ['', Validators.required],
    city: ['', Validators.required],
    province: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    subscriptionPlan: ['free', Validators.required],
    agreeToTerms: [false, Validators.requiredTrue]
  }, {
    validators: this.passwordMatchValidator
  });

  /**
   * Custom validator to check if passwords match
   */
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.error.set(null);

      try {
        const formData = this.registerForm.value;
        
        // Generate slug from company name
        const slug = formData.companyName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const tenantData = {
          company_name: formData.companyName,
          slug: slug,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          address_line1: formData.addressLine1,
          city: formData.city,
          state_province: formData.province,
          country: 'Philippines',
          subscription_plan: formData.subscriptionPlan,
          billing_cycle: formData.subscriptionPlan === 'free' ? 'monthly' : 'monthly',
          primary_color: '#3B82F6', // Default blue
          secondary_color: '#8B5CF6', // Default purple
          admin_email: formData.contactEmail,
          admin_password: formData.password,
          admin_first_name: formData.contactPerson.split(' ')[0] || formData.contactPerson,
          admin_last_name: formData.contactPerson.split(' ').slice(1).join(' ') || ''
        };

        const result = await this.tenantService.createTenant(tenantData);
        
        this.success.set(true);
        this.logger.success(`Tenant created: ${result.company_name}`);

        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/auth/login'], {
            queryParams: { 
              newAccount: true,
              email: formData.contactEmail,
              message: 'Registration successful! Please log in with your credentials.'
            }
          });
        }, 2000);

      } catch (err: any) {
        const errorMessage = err?.error?.error || err?.error?.message || 'Failed to create tenant account. Please try again.';
        this.error.set(errorMessage);
        this.logger.error('Tenant registration failed', err);
      } finally {
        this.isLoading.set(false);
      }
    }
  }
}
