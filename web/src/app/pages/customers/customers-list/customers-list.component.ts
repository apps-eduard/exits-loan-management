import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  kycStatus: string;
  createdAt: string;
}

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
        <button class="btn btn-primary">
          + Add Customer
        </button>
      </div>

      <div class="card">
        <div class="mb-4">
          <input
            type="text"
            placeholder="Search customers..."
            class="input w-full"
          />
        </div>

        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>KYC Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (customer of customers(); track customer.id) {
                <tr>
                  <td class="font-semibold">{{ customer.firstName }} {{ customer.lastName }}</td>
                  <td>{{ customer.email }}</td>
                  <td>{{ customer.phone }}</td>
                  <td>
                    <span [class]="getStatusColor(customer.kycStatus)">
                      {{ customer.kycStatus }}
                    </span>
                  </td>
                  <td>{{ customer.createdAt }}</td>
                  <td>
                    <a [routerLink]="['/customers', customer.id]" class="text-blue-600 dark:text-blue-400 hover:underline">
                      View
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="text-center py-8 text-gray-500 dark:text-gray-400">
                    No customers found
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class CustomersListComponent implements OnInit {
  customers = signal<Customer[]>([]);
  isLoading = signal(false);

  ngOnInit(): void {
    // TODO: Fetch customers from API
    this.customers.set([
      {
        id: '1',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        email: 'juan.delacruz@example.com',
        phone: '+63 917 123 4567',
        kycStatus: 'verified',
        createdAt: '2024-01-15'
      },
      {
        id: '2',
        firstName: 'Maria',
        lastName: 'Santos',
        email: 'maria.santos@example.com',
        phone: '+63 917 234 5678',
        kycStatus: 'pending',
        createdAt: '2024-01-16'
      }
    ]);
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'verified': 'px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'pending': 'px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'rejected': 'px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return colors[status] || 'px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}
