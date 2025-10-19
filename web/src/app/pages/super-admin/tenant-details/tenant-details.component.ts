import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TenantService, Tenant } from '../../../core/services/tenant.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-tenant-details',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <button
            (click)="goBack()"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <svg class="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ tenant()?.company_name || 'Loading...' }}
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Tenant ID: {{ tenant()?.slug || '-' }}
            </p>
          </div>
        </div>

        @if (!isEditing()) {
          <button
            (click)="toggleEdit()"
            class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Tenant
          </button>
        } @else {
          <div class="flex gap-2">
            <button
              (click)="cancelEdit()"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition">
              Cancel
            </button>
            <button
              (click)="saveTenant()"
              [disabled]="!tenantForm.valid || isSaving()"
              class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition">
              {{ isSaving() ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      } @else if (error()) {
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-red-800 dark:text-red-200">{{ error() }}</p>
        </div>
      } @else {
        <form [formGroup]="tenantForm" class="space-y-6">
          <!-- Company Information -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  formControlName="company_name"
                  [readonly]="!isEditing()"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  [class.bg-gray-50]="!isEditing()"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug (URL identifier) *
                </label>
                <input
                  type="text"
                  formControlName="slug"
                  readonly
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-gray-400"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  formControlName="contact_email"
                  [readonly]="!isEditing()"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  [class.bg-gray-50]="!isEditing()"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Phone
                </label>
                <input
                  type="text"
                  formControlName="contact_phone"
                  [readonly]="!isEditing()"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  [class.bg-gray-50]="!isEditing()"
                />
              </div>
            </div>
          </div>

          <!-- Address Information -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address Line 1
                </label>
                <input
                  type="text"
                  formControlName="address_line1"
                  [readonly]="!isEditing()"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  [class.bg-gray-50]="!isEditing()"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  formControlName="address_line2"
                  [readonly]="!isEditing()"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  [class.bg-gray-50]="!isEditing()"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  formControlName="city"
                  [readonly]="!isEditing()"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  [class.bg-gray-50]="!isEditing()"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Province
                </label>
                <input
                  type="text"
                  formControlName="province"
                  [readonly]="!isEditing()"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  [class.bg-gray-50]="!isEditing()"
                />
              </div>
            </div>
          </div>

          <!-- Subscription & Status -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subscription & Status</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status *
                </label>
                <select
                  formControlName="status"
                  [disabled]="!isEditing()"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  [class.bg-gray-50]="!isEditing()">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subscription Plan
                </label>
                <input
                  type="text"
                  formControlName="subscription_plan"
                  readonly
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-gray-400 uppercase"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Created Date
                </label>
                <input
                  type="text"
                  [value]="formatDate(tenant()?.created_at)"
                  readonly
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-gray-400"
                />
              </div>
            </div>
          </div>

          <!-- Branding -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Branding</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary Color
                </label>
                <div class="flex gap-2">
                  <input
                    type="color"
                    formControlName="primary_color"
                    [disabled]="!isEditing()"
                    class="h-10 w-20 rounded border border-gray-300 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    formControlName="primary_color"
                    [readonly]="!isEditing()"
                    class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    [class.bg-gray-50]="!isEditing()"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Logo URL
                </label>
                <input
                  type="text"
                  formControlName="logo_url"
                  [readonly]="!isEditing()"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  [class.bg-gray-50]="!isEditing()"
                />
              </div>
            </div>
          </div>

          <!-- Danger Zone -->
          @if (!isEditing()) {
            <div class="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
              <h2 class="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Danger Zone</h2>
              <p class="text-sm text-red-600 dark:text-red-300 mb-4">
                Deleting this tenant will permanently remove all associated data including users, customers, loans, and payments.
              </p>
              <button
                type="button"
                (click)="deleteTenant()"
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition">
                Delete Tenant
              </button>
            </div>
          }
        </form>
      }
    </div>
  `
})
export class TenantDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private tenantService = inject(TenantService);
  private toastService = inject(ToastService);

  tenant = signal<Tenant | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  isEditing = signal(false);
  isSaving = signal(false);

  tenantForm!: FormGroup;

  ngOnInit() {
    this.initForm();
    this.loadTenant();
  }

  initForm() {
    this.tenantForm = this.fb.group({
      company_name: ['', Validators.required],
      slug: [''],
      contact_email: ['', [Validators.required, Validators.email]],
      contact_phone: [''],
      address_line1: [''],
      address_line2: [''],
      city: [''],
      province: [''],
      status: ['active', Validators.required],
      subscription_plan: [''],
      primary_color: ['#3b82f6'],
      logo_url: ['']
    });
  }

  async loadTenant() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Tenant ID not provided');
      this.loading.set(false);
      return;
    }

    try {
      this.loading.set(true);
      const data = await this.tenantService.getTenantById(id);
      this.tenant.set(data);
      this.tenantForm.patchValue(data);
      this.error.set(null);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to load tenant');
    } finally {
      this.loading.set(false);
    }
  }

  toggleEdit() {
    this.isEditing.set(true);
  }

  cancelEdit() {
    this.isEditing.set(false);
    if (this.tenant()) {
      this.tenantForm.patchValue(this.tenant()!);
    }
  }

  async saveTenant() {
    if (!this.tenantForm.valid || !this.tenant()) return;

    try {
      this.isSaving.set(true);
      const updates = this.tenantForm.value;
      delete updates.slug; // Slug cannot be changed
      delete updates.subscription_plan; // Subscription managed separately

      await this.tenantService.updateTenant(this.tenant()!.id, updates);
      await this.loadTenant();
      this.isEditing.set(false);
      this.toastService.success('Tenant updated successfully!');
    } catch (err: any) {
      this.toastService.error('Failed to update tenant: ' + (err.message || 'Unknown error'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteTenant() {
    if (!this.tenant()) return;

    const confirmed = confirm(
      `Are you sure you want to DELETE ${this.tenant()!.company_name}?\n\n` +
      'This will permanently delete:\n' +
      '- All users\n' +
      '- All customers\n' +
      '- All loans and payments\n' +
      '- All organizational units\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Type the tenant name to confirm.'
    );

    if (!confirmed) return;

    const confirmName = prompt(`Type "${this.tenant()!.company_name}" to confirm deletion:`);
    if (confirmName !== this.tenant()!.company_name) {
      this.toastService.warning('Tenant name does not match. Deletion cancelled.');
      return;
    }

    try {
      await this.tenantService.deleteTenant(this.tenant()!.id);
      this.toastService.success('Tenant deleted successfully');
      this.router.navigate(['/super-admin/tenants']);
    } catch (err: any) {
      this.toastService.error('Failed to delete tenant: ' + (err.message || 'Unknown error'));
    }
  }

  formatDate(dateString?: Date | string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack() {
    this.router.navigate(['/super-admin/tenants']);
  }
}
