import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { TenantService } from '../../../core/services/tenant.service';
import { LoggerService } from '../../../services/logger.service';

@Component({
  selector: 'app-tenant-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-4 mb-4">
          <a routerLink="/super-admin/tenants" 
             class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </a>
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ isEditMode() ? 'Edit Tenant' : 'Create New Tenant' }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              {{ isEditMode() ? 'Update tenant information' : 'Add a new tenant to the system' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      @if (success()) {
        <div class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div class="flex items-center gap-2">
            <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <p class="font-semibold text-green-900 dark:text-green-200">Tenant {{ isEditMode() ? 'Updated' : 'Created' }} Successfully!</p>
              <p class="text-sm text-green-700 dark:text-green-300">Redirecting to tenants list...</p>
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

      <!-- Form -->
      <form [formGroup]="tenantForm" (ngSubmit)="onSubmit()" class="space-y-6">
        
        <!-- Company Information Card -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span class="text-2xl">🏢</span>
            Company Information
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
              <label class="label">Company Name *</label>
              <input
                type="text"
                formControlName="company_name"
                class="input"
                placeholder="ABC Lending Corp."
                [class.border-red-500]="tenantForm.get('company_name')?.invalid && tenantForm.get('company_name')?.touched">
              @if (tenantForm.get('company_name')?.invalid && tenantForm.get('company_name')?.touched) {
                <p class="mt-1 text-xs text-red-600 dark:text-red-400">Company name is required</p>
              }
            </div>

            <div class="md:col-span-2">
              <label class="label">URL Slug *</label>
              <div class="flex items-center gap-2">
                <span class="text-gray-500 dark:text-gray-400 text-sm">yoursite.com/auth/tenant/</span>
                <input
                  type="text"
                  formControlName="slug"
                  class="input flex-1"
                  placeholder="abc-lending"
                  [class.border-red-500]="tenantForm.get('slug')?.invalid && tenantForm.get('slug')?.touched">
              </div>
              @if (tenantForm.get('slug')?.invalid && tenantForm.get('slug')?.touched) {
                <p class="mt-1 text-xs text-red-600 dark:text-red-400">Slug is required (lowercase, hyphens only)</p>
              }
            </div>

            <div>
              <label class="label">Contact Email *</label>
              <input
                type="email"
                formControlName="contact_email"
                class="input"
                placeholder="admin@abclending.com"
                [class.border-red-500]="tenantForm.get('contact_email')?.invalid && tenantForm.get('contact_email')?.touched">
            </div>

            <div>
              <label class="label">Contact Phone</label>
              <input
                type="tel"
                formControlName="contact_phone"
                class="input"
                placeholder="+63 912 345 6789">
            </div>
          </div>
        </div>

        <!-- Address Card -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span class="text-2xl">📍</span>
            Business Address
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
              <label class="label">Street Address</label>
              <input
                type="text"
                formControlName="address_line1"
                class="input"
                placeholder="123 Main Street">
            </div>

            <div class="md:col-span-2">
              <label class="label">Address Line 2</label>
              <input
                type="text"
                formControlName="address_line2"
                class="input"
                placeholder="Suite 400">
            </div>

            <div>
              <label class="label">City</label>
              <input
                type="text"
                formControlName="city"
                class="input"
                placeholder="Manila">
            </div>

            <div>
              <label class="label">Province/State</label>
              <input
                type="text"
                formControlName="state_province"
                class="input"
                placeholder="Metro Manila">
            </div>

            <div>
              <label class="label">Postal Code</label>
              <input
                type="text"
                formControlName="postal_code"
                class="input"
                placeholder="1000">
            </div>

            <div>
              <label class="label">Country</label>
              <input
                type="text"
                formControlName="country"
                class="input"
                placeholder="Philippines">
            </div>
          </div>
        </div>

        <!-- Branding Card -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span class="text-2xl">🎨</span>
            Branding
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="label">Primary Color</label>
              <div class="flex gap-2">
                <input
                  type="color"
                  formControlName="primary_color"
                  class="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer">
                <input
                  type="text"
                  formControlName="primary_color"
                  class="input flex-1"
                  placeholder="#3B82F6">
              </div>
            </div>

            <div>
              <label class="label">Secondary Color</label>
              <div class="flex gap-2">
                <input
                  type="color"
                  formControlName="secondary_color"
                  class="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer">
                <input
                  type="text"
                  formControlName="secondary_color"
                  class="input flex-1"
                  placeholder="#8B5CF6">
              </div>
            </div>

            <div class="md:col-span-2">
              <label class="label">Logo URL</label>
              <input
                type="url"
                formControlName="logo_url"
                class="input"
                placeholder="https://example.com/logo.png">
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Upload logo to a CDN and paste the URL here
              </p>
            </div>
          </div>
        </div>

        <!-- Subscription Card -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span class="text-2xl">💎</span>
            Subscription Plan
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="label">Plan *</label>
              <select formControlName="subscription_plan" class="input">
                <option value="free">Free Trial</option>
                <option value="basic">Basic - $29/month</option>
                <option value="professional">Professional - $49/month</option>
                <option value="enterprise">Enterprise - $99/month</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label class="label">Status *</label>
              <select formControlName="status" class="input">
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label class="label">Billing Cycle</label>
              <select formControlName="billing_cycle" class="input">
                <option value="trial">Trial</option>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4 justify-end">
          <button
            type="button"
            routerLink="/super-admin/tenants"
            class="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="tenantForm.invalid || isLoading()"
            class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            @if (isLoading()) {
              <span class="flex items-center gap-2">
                <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                {{ isEditMode() ? 'Updating...' : 'Creating...' }}
              </span>
            } @else {
              <span>{{ isEditMode() ? 'Update Tenant' : 'Create Tenant' }}</span>
            }
          </button>
        </div>
      </form>
    </div>
  `
})
export class TenantFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private logger = inject(LoggerService);

  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  isEditMode = signal(false);
  tenantId = signal<string | null>(null);

  tenantForm: FormGroup = this.fb.group({
    company_name: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    contact_email: ['', [Validators.required, Validators.email]],
    contact_phone: [''],
    address_line1: [''],
    address_line2: [''],
    city: [''],
    state_province: [''],
    postal_code: [''],
    country: ['Philippines'],
    logo_url: [''],
    primary_color: ['#3B82F6'],
    secondary_color: ['#8B5CF6'],
    subscription_plan: ['free', Validators.required],
    status: ['trial', Validators.required],
    billing_cycle: ['trial']
  });

  ngOnInit(): void {
    // Auto-generate slug from company name
    this.tenantForm.get('company_name')?.valueChanges.subscribe(name => {
      if (name && !this.isEditMode()) {
        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        this.tenantForm.patchValue({ slug }, { emitEvent: false });
      }
    });

    // Check if editing
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.tenantId.set(id);
      this.loadTenant(id);
    }
  }

  async loadTenant(id: string): Promise<void> {
    try {
      const tenant = await this.tenantService.getTenantById(id);
      this.tenantForm.patchValue(tenant);
    } catch (error) {
      this.logger.error('Failed to load tenant', error);
      this.error.set('Failed to load tenant details');
    }
  }

  async onSubmit(): Promise<void> {
    if (this.tenantForm.valid) {
      this.isLoading.set(true);
      this.error.set(null);

      try {
        const tenantData = this.tenantForm.value;

        if (this.isEditMode() && this.tenantId()) {
          await this.tenantService.updateTenant(this.tenantId()!, tenantData);
          this.logger.success('Tenant updated successfully');
        } else {
          await this.tenantService.createTenant(tenantData);
          this.logger.success('Tenant created successfully');
        }

        this.success.set(true);

        // Redirect after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/super-admin/tenants']);
        }, 2000);

      } catch (err: any) {
        const errorMessage = err?.error?.error || err?.error?.message || 
          `Failed to ${this.isEditMode() ? 'update' : 'create'} tenant. Please try again.`;
        this.error.set(errorMessage);
        this.logger.error('Tenant form submission failed', err);
      } finally {
        this.isLoading.set(false);
      }
    }
  }
}

