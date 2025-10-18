import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService, Customer } from '../../../services/customer.service';
import { LoggerService } from '../../../services/logger.service';

interface CustomerFormData {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  dateOfBirth: string;
  gender: string;
  civilStatus: string;
  nationality: string;
  email: string;
  mobilePhone: string;
  homePhone?: string;
  addressLine1: string;
  addressLine2?: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  region: string;
  postalCode?: string;
  employmentStatus?: string;
  employerName?: string;
  occupation?: string;
  monthlyIncome?: number;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
}

@Component({
  selector: 'app-customer-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity z-50" (click)="onClose()"></div>
    
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl" (click)="$event.stopPropagation()">
          
          <!-- Header -->
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                {{ customerId ? 'Edit Customer' : 'Create New Customer' }}
              </h3>
              <button (click)="onClose()" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Form -->
          <form (ngSubmit)="onSubmit()" class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
            <div class="max-h-[60vh] overflow-y-auto space-y-6">
              
              <!-- Personal Information -->
              <div>
                <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.firstName"
                      name="firstName"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.middleName"
                      name="middleName"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.lastName"
                      name="lastName"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Suffix
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.suffix"
                      name="suffix"
                      placeholder="Jr., Sr., III, etc."
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date of Birth <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      [(ngModel)]="formData.dateOfBirth"
                      name="dateOfBirth"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gender <span class="text-red-500">*</span>
                    </label>
                    <select
                      [(ngModel)]="formData.gender"
                      name="gender"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Civil Status <span class="text-red-500">*</span>
                    </label>
                    <select
                      [(ngModel)]="formData.civilStatus"
                      name="civilStatus"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select Civil Status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="widowed">Widowed</option>
                      <option value="separated">Separated</option>
                      <option value="divorced">Divorced</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nationality
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.nationality"
                      name="nationality"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>
                </div>
              </div>

              <!-- Contact Information -->
              <div>
                <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      [(ngModel)]="formData.email"
                      name="email"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mobile Phone <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      [(ngModel)]="formData.mobilePhone"
                      name="mobilePhone"
                      required
                      placeholder="09XXXXXXXXX"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Home Phone
                    </label>
                    <input
                      type="tel"
                      [(ngModel)]="formData.homePhone"
                      name="homePhone"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>
                </div>
              </div>

              <!-- Address -->
              <div>
                <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4">Address</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address Line 1 <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.addressLine1"
                      name="addressLine1"
                      required
                      placeholder="Street, Building, Unit"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.addressLine2"
                      name="addressLine2"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Barangay <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.barangay"
                      name="barangay"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City/Municipality <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.cityMunicipality"
                      name="cityMunicipality"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Province <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.province"
                      name="province"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Region <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.region"
                      name="region"
                      required
                      placeholder="e.g., NCR, Region IV-A"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.postalCode"
                      name="postalCode"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>
                </div>
              </div>

              <!-- Employment Information -->
              <div>
                <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4">Employment Information</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Employment Status
                    </label>
                    <select
                      [(ngModel)]="formData.employmentStatus"
                      name="employmentStatus"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select Status</option>
                      <option value="employed">Employed</option>
                      <option value="self-employed">Self-employed</option>
                      <option value="unemployed">Unemployed</option>
                      <option value="retired">Retired</option>
                      <option value="student">Student</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Employer Name
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.employerName"
                      name="employerName"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Occupation
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.occupation"
                      name="occupation"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Monthly Income
                    </label>
                    <input
                      type="number"
                      [(ngModel)]="formData.monthlyIncome"
                      name="monthlyIncome"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>
                </div>
              </div>

              <!-- Emergency Contact -->
              <div>
                <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4">Emergency Contact</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contact Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.emergencyContactName"
                      name="emergencyContactName"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Relationship <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.emergencyContactRelationship"
                      name="emergencyContactRelationship"
                      required
                      placeholder="e.g., Spouse, Parent, Sibling"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      [(ngModel)]="formData.emergencyContactPhone"
                      name="emergencyContactPhone"
                      required
                      placeholder="09XXXXXXXXX"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>
                </div>
              </div>

              @if (error()) {
                <div class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                  <div class="flex">
                    <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                    </svg>
                    <div class="ml-3">
                      <p class="text-sm text-red-800 dark:text-red-200">{{ error() }}</p>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Footer -->
            <div class="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 mt-6 -mx-6 -mb-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                [disabled]="isSaving()"
                class="w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600 sm:ml-3 sm:text-sm transition-colors">
                @if (isSaving()) {
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                } @else {
                  {{ customerId ? 'Update Customer' : 'Create Customer' }}
                }
              </button>
              <button
                type="button"
                (click)="onClose()"
                [disabled]="isSaving()"
                class="mt-3 w-full sm:w-auto inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:text-sm transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class CustomerFormDialogComponent implements OnInit {
  @Input() customerId?: string;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  private customerService = inject(CustomerService);
  private logger = inject(LoggerService);

  isSaving = signal(false);
  error = signal<string | null>(null);

  formData: CustomerFormData = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    civilStatus: '',
    nationality: 'Filipino',
    email: '',
    mobilePhone: '',
    addressLine1: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    region: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: ''
  };

  ngOnInit(): void {
    if (this.customerId) {
      this.loadCustomer();
    }
  }

  loadCustomer(): void {
    if (!this.customerId) return;

    this.customerService.getCustomerById(this.customerId).subscribe({
      next: (response) => {
        const customer = response.data.customer;
        this.formData = {
          firstName: customer.firstName,
          middleName: customer.middleName || undefined,
          lastName: customer.lastName,
          suffix: customer.suffix || undefined,
          dateOfBirth: customer.dateOfBirth,
          gender: customer.gender || '',
          civilStatus: customer.civilStatus || '',
          nationality: customer.nationality || 'Filipino',
          email: customer.email || '',
          mobilePhone: customer.mobilePhone,
          homePhone: customer.homePhone || undefined,
          addressLine1: customer.addressLine1,
          addressLine2: customer.addressLine2 || undefined,
          barangay: customer.barangay || '',
          cityMunicipality: customer.city || '',
          province: customer.province || '',
          region: '', // Not in Customer interface
          postalCode: customer.postalCode || undefined,
          employmentStatus: customer.employmentStatus || undefined,
          employerName: customer.employerName || undefined,
          occupation: customer.occupation || undefined,
          monthlyIncome: customer.monthlyIncome || undefined,
          emergencyContactName: customer.emergencyContactName || '',
          emergencyContactRelationship: customer.emergencyContactRelationship || '',
          emergencyContactPhone: customer.emergencyContactPhone || ''
        };
        this.logger.info('Customer loaded for editing', customer);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load customer');
        this.logger.error('Failed to load customer', err);
      }
    });
  }

  onSubmit(): void {
    this.isSaving.set(true);
    this.error.set(null);

    // Map formData to API format
    const customerData = {
      customerCode: `CUST-${Date.now()}`, // Generate temporary code
      firstName: this.formData.firstName,
      middleName: this.formData.middleName,
      lastName: this.formData.lastName,
      suffix: this.formData.suffix,
      dateOfBirth: this.formData.dateOfBirth,
      gender: this.formData.gender,
      civilStatus: this.formData.civilStatus,
      nationality: this.formData.nationality,
      email: this.formData.email,
      mobilePhone: this.formData.mobilePhone,
      homePhone: this.formData.homePhone,
      addressLine1: this.formData.addressLine1,
      addressLine2: this.formData.addressLine2,
      barangay: this.formData.barangay,
      city: this.formData.cityMunicipality,
      province: this.formData.province,
      postalCode: this.formData.postalCode,
      country: 'Philippines',
      employmentStatus: this.formData.employmentStatus,
      employerName: this.formData.employerName,
      occupation: this.formData.occupation,
      monthlyIncome: this.formData.monthlyIncome,
      emergencyContactName: this.formData.emergencyContactName,
      emergencyContactRelationship: this.formData.emergencyContactRelationship,
      emergencyContactPhone: this.formData.emergencyContactPhone,
      organizationalUnitId: 'a0000000-0000-0000-0000-000000000001' // Default to Head Office
    };

    const operation = this.customerId
      ? this.customerService.updateCustomer(this.customerId, customerData)
      : this.customerService.createCustomer(customerData);

    operation.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.logger.success(this.customerId ? 'Customer updated successfully' : 'Customer created successfully');
        this.saved.emit();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.error.set(err.error?.message || 'Failed to save customer');
        this.logger.error('Failed to save customer', err);
      }
    });
  }

  onClose(): void {
    if (!this.isSaving()) {
      this.closed.emit();
    }
  }
}
