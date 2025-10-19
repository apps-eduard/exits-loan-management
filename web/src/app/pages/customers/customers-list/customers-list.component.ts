import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomerService, Customer } from '../../../services/customer.service';
import { LoggerService } from '../../../services/logger.service';
import { CustomerFormDialogComponent } from '../customer-form-dialog/customer-form-dialog.component';
import { TenantService } from '../../../core/services/tenant.service';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CustomerFormDialogComponent],
  template: `
    <div class="space-y-6">
      <div class="p-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage customer accounts and KYC verification for {{ currentTenant()?.company_name || 'your organization' }}
            </p>
          </div>
        <button
          (click)="onAddCustomer()"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add Customer
        </button>
      </div>

      <!-- Filters -->
      <div class="card mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (input)="onSearchChange()"
              placeholder="Search by name, email, or phone..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
          </div>

          <!-- KYC Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              KYC Status
            </label>
            <select
              [(ngModel)]="filterKycStatus"
              (change)="loadCustomers()"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
              <option value="">All KYC Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              [(ngModel)]="filterStatus"
              (change)="loadCustomers()"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
              <option value="deceased">Deceased</option>
            </select>
          </div>
        </div>

        <div class="flex gap-2 mt-4">
          <button
            (click)="loadCustomers()"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors">
            Search
          </button>
          <button
            (click)="resetFilters()"
            class="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 transition-colors">
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="card overflow-hidden">
        @if (isLoading()) {
          <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        } @else if (error()) {
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error loading customers</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ error() }}
            </p>
          </div>
        } @else if (customers().length === 0) {
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No customers found</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your filters or add a new customer.
            </p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    KYC Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                @for (customer of customers(); track customer.id) {
                  <tr
                    [routerLink]="['/customers', customer.id]"
                    class="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <div class="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            {{ (customer.firstName || '?').charAt(0) }}{{ (customer.lastName || '?').charAt(0) }}
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {{ customer.firstName || 'N/A' }}
                            @if (customer.middleName) {
                              {{ customer.middleName.charAt(0) }}.
                            }
                            {{ customer.lastName || '' }}
                            @if (customer.suffix) {
                              {{ customer.suffix }}
                            }
                          </div>
                          <div class="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {{ customer.customerCode || 'N/A' }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900 dark:text-gray-100">{{ customer.email || 'N/A' }}</div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">{{ customer.mobilePhone || 'N/A' }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="'px-2 inline-flex text-xs leading-5 font-semibold rounded-full ' + getKycStatusBadgeClass(customer.kycStatus || 'pending')">
                        {{ customer.kycStatus || 'pending' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="'px-2 inline-flex text-xs leading-5 font-semibold rounded-full ' + getStatusBadgeClass(customer.status || 'inactive')">
                        {{ customer.status || 'inactive' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {{ customer.createdAt ? formatDate(customer.createdAt) : 'N/A' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          (click)="onEditCustomer(customer); $event.stopPropagation()"
                          class="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 transition-colors"
                          title="Edit">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>

                        <button
                          [routerLink]="['/customers', customer.id]"
                          (click)="$event.stopPropagation()"
                          class="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20 transition-colors"
                          title="View Details">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                        </button>

                        <button
                          (click)="deleteCustomer(customer, $event)"
                          class="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (pagination() && pagination()!.totalPages > 1) {
            <div class="bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div class="flex-1 flex justify-between sm:hidden">
                <button
                  (click)="goToPage(pagination()!.page - 1)"
                  [disabled]="pagination()!.page === 1"
                  class="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Previous
                </button>
                <button
                  (click)="goToPage(pagination()!.page + 1)"
                  [disabled]="pagination()!.page === pagination()!.totalPages"
                  class="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-3">
                  Next
                </button>
              </div>
              <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    Showing
                    <span class="font-medium">{{ (pagination()!.page - 1) * pagination()!.limit + 1 }}</span>
                    to
                    <span class="font-medium">{{ Math.min(pagination()!.page * pagination()!.limit, pagination()!.total) }}</span>
                    of
                    <span class="font-medium">{{ pagination()!.total }}</span>
                    customers
                  </p>
                </div>
                <div>
                  <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      (click)="goToPage(pagination()!.page - 1)"
                      [disabled]="pagination()!.page === 1"
                      class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </button>

                    @for (page of getPageNumbers(); track page) {
                      @if (page === -1) {
                        <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                          ...
                        </span>
                      } @else {
                        <button
                          (click)="goToPage(page)"
                          [class.bg-blue-50]="page === pagination()!.page"
                          [class.dark:bg-blue-900]="page === pagination()!.page"
                          [class.border-blue-500]="page === pagination()!.page"
                          [class.text-blue-600]="page === pagination()!.page"
                          [class.dark:text-blue-300]="page === pagination()!.page"
                          class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          {{ page }}
                        </button>
                      }
                    }

                    <button
                      (click)="goToPage(pagination()!.page + 1)"
                      [disabled]="pagination()!.page === pagination()!.totalPages"
                      class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          }
        }
      </div>
    </div>

    <!-- Customer Form Dialog -->
    @if (showCustomerDialog()) {
      <app-customer-form-dialog
        [customerId]="selectedCustomerId()"
        (saved)="onCustomerSaved()"
        (closed)="onDialogClose()">
      </app-customer-form-dialog>
    }
  `
})
export class CustomersListComponent implements OnInit {
  private customerService = inject(CustomerService);
  private logger = inject(LoggerService);
  private tenantService = inject(TenantService);

  currentTenant = this.tenantService.currentTenant;

  customers = signal<Customer[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  pagination = signal<{ page: number; limit: number; total: number; totalPages: number } | null>(null);

  showCustomerDialog = signal(false);
  selectedCustomerId = signal<string | undefined>(undefined);

  searchTerm = '';
  filterKycStatus = '';
  filterStatus = '';
  currentPage = 1;
  pageLimit = 10;

  Math = Math;

  async ngOnInit(): Promise<void> {
    // Load tenant information
    await this.tenantService.loadCurrentTenant();

    // Load customers (automatically filtered by tenant on backend)
    await this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.customerService.getCustomers({
      page: this.currentPage,
      limit: this.pageLimit,
      search: this.searchTerm || undefined,
      kycStatus: this.filterKycStatus || undefined,
      status: this.filterStatus || undefined
    }).subscribe({
      next: (response) => {
        this.customers.set(response.data.customers);
        this.pagination.set(response.data.pagination);
        this.isLoading.set(false);
        this.logger.info(`Loaded ${response.data.customers.length} customers`);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load customers');
        this.isLoading.set(false);
        this.logger.error('Failed to load customers', err);
      }
    });
  }

  onSearchChange(): void {
    // Debounce search
    setTimeout(() => {
      this.currentPage = 1;
      this.loadCustomers();
    }, 300);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterKycStatus = '';
    this.filterStatus = '';
    this.currentPage = 1;
    this.loadCustomers();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadCustomers();
  }

  onAddCustomer(): void {
    this.selectedCustomerId.set(undefined);
    this.showCustomerDialog.set(true);
    this.logger.info('Opening create customer dialog');
  }

  onEditCustomer(customer: Customer): void {
    this.selectedCustomerId.set(customer.id);
    this.showCustomerDialog.set(true);
    this.logger.info('Opening edit customer dialog', customer);
  }

  onCustomerSaved(): void {
    this.showCustomerDialog.set(false);
    this.selectedCustomerId.set(undefined);
    this.loadCustomers();
  }

  onDialogClose(): void {
    this.showCustomerDialog.set(false);
    this.selectedCustomerId.set(undefined);
  }

  deleteCustomer(customer: Customer, event: Event): void {
    event.stopPropagation();

    if (confirm(`Are you sure you want to delete customer: ${customer.firstName} ${customer.lastName}?`)) {
      this.customerService.deleteCustomer(customer.id).subscribe({
        next: () => {
          this.logger.success('Customer deleted successfully');
          this.loadCustomers();
        },
        error: (err) => {
          this.logger.error('Failed to delete customer', err);
          alert(err.error?.message || 'Failed to delete customer');
        }
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getKycStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'verified': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'incomplete': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return classes[status] || classes['incomplete'];
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'active': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      'blacklisted': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'deceased': 'bg-gray-400 text-white dark:bg-gray-600 dark:text-gray-200'
    };
    return classes[status] || classes['inactive'];
  }

  getPageNumbers(): number[] {
    if (!this.pagination()) return [];

    const total = this.pagination()!.totalPages;
    const current = this.pagination()!.page;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, -1, total);
      } else if (current >= total - 2) {
        pages.push(1, -1, total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, -1, current - 1, current, current + 1, -1, total);
      }
    }

    return pages;
  }
}
