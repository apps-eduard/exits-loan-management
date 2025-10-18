import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomerService, Customer } from '../../../services/customer.service';
import { LoggerService } from '../../../services/logger.service';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6">
      @if (isLoading()) {
        <div class="card">
          <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-gray-500 dark:text-gray-400">Loading customer details...</p>
          </div>
        </div>
      }

      @if (error()) {
        <div class="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div class="text-red-800 dark:text-red-200">
            <p class="font-semibold">Error loading customer</p>
            <p class="text-sm">{{ error() }}</p>
            <button (click)="goBack()" class="btn btn-secondary mt-4">Go Back</button>
          </div>
        </div>
      }

      @if (customer() && !isLoading() && !error()) {
        <div class="mb-6 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button (click)="goBack()" class="btn btn-secondary">
              ← Back
            </button>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ customer()!.firstName }} {{ customer()!.lastName }}
            </h1>
            <span [class]="getStatusColor(customer()!.status)">
              {{ customer()!.status }}
            </span>
          </div>
        </div>

        <!-- Personal Information -->
        <div class="card mb-6">
          <h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Personal Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Customer Code</label>
              <p class="font-mono">{{ customer()!.customerCode }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
              <p>{{ customer()!.email }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Mobile Phone</label>
              <p>{{ customer()!.mobilePhone }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
              <p>{{ formatDate(customer()!.dateOfBirth) }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Nationality</label>
              <p>{{ customer()!.nationality }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">KYC Status</label>
              <div>
                <span [class]="getKycStatusColor(customer()!.kycStatus)">
                  {{ customer()!.kycStatus }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Address -->
        <div class="card mb-6">
          <h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Address</h2>
          <div class="space-y-2">
            <p>{{ customer()!.addressLine1 }}</p>
            @if (customer()!.addressLine2) {
              <p>{{ customer()!.addressLine2 }}</p>
            }
            <p>{{ customer()!.country }}</p>
          </div>
        </div>

        <!-- Meta Information -->
        <div class="card">
          <h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Meta Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</label>
              <p>{{ formatDate(customer()!.createdAt) }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
              <p>{{ formatDate(customer()!.updatedAt) }}</p>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CustomerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService = inject(CustomerService);
  private logger = inject(LoggerService);

  customer = signal<Customer | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCustomer(id);
    } else {
      this.error.set('No customer ID provided');
    }
  }

  loadCustomer(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.customerService.getCustomerById(id).subscribe({
      next: (response) => {
        this.customer.set(response.data.customer);
        this.isLoading.set(false);
        this.logger.info('Customer loaded', response.data.customer);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load customer');
        this.isLoading.set(false);
        this.logger.error('Failed to load customer', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/customers']);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getKycStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'verified': 'px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'pending': 'px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'rejected': 'px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return colors[status] || 'px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'active': 'px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'inactive': 'px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      'suspended': 'px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    };
    return colors[status] || 'px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}
