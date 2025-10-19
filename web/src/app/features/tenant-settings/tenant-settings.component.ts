import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TenantSettingsService, TenantSetting } from '../../core/services/tenant-settings.service';

@Component({
  selector: 'app-tenant-settings',
  templateUrl: './tenant-settings.component.html',
  styleUrls: ['./tenant-settings.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class TenantSettingsComponent implements OnInit {
  companyForm!: FormGroup;
  brandingForm!: FormGroup;
  loanDefaultsForm!: FormGroup;

  isLoading = false;
  currentSettings: Record<string, any> = {};
  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';

  readonly currencies = [
    { code: 'PHP', name: 'Philippine Peso' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' }
  ];

  readonly timezones = [
    { code: 'Asia/Manila', name: 'Asia/Manila (GMT+8)' },
    { code: 'UTC', name: 'UTC (GMT+0)' },
    { code: 'America/New_York', name: 'America/New_York (GMT-5)' }
  ];

  readonly locales = [
    { code: 'en-PH', name: 'English (Philippines)' },
    { code: 'en-US', name: 'English (US)' },
    { code: 'fil-PH', name: 'Filipino' }
  ];

  constructor(
    private fb: FormBuilder,
    private tenantSettingsService: TenantSettingsService
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.loadTenantSettings();
  }

  initializeForms() {
    this.companyForm = this.fb.group({
      company_name: ['', Validators.required],
      contact_email: ['', [Validators.required, Validators.email]],
      contact_phone: ['', Validators.required],
      timezone: ['Asia/Manila', Validators.required],
      currency: ['PHP', Validators.required],
      locale: ['en-PH', Validators.required]
    });

    this.brandingForm = this.fb.group({
      primary_color: ['#3B82F6', Validators.required],
      secondary_color: ['#8B5CF6', Validators.required],
      logo_url: ['']
    });

    this.loanDefaultsForm = this.fb.group({
      default_interest_rate: [5.0, [Validators.required, Validators.min(0), Validators.max(100)]],
      default_term_months: [12, [Validators.required, Validators.min(1), Validators.max(360)]],
      max_loan_amount: [1000000, [Validators.required, Validators.min(1)]],
      min_loan_amount: [1000, [Validators.required, Validators.min(1)]],
      late_fee_percentage: [2.0, [Validators.required, Validators.min(0), Validators.max(100)]],
      grace_period_days: [3, [Validators.required, Validators.min(0), Validators.max(30)]]
    });
  }

  async loadTenantSettings() {
    this.isLoading = true;
    this.showMessage('Loading settings...', 'info');

    try {
      this.tenantSettingsService.getOrganizedTenantSettings().subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.currentSettings = response.data;
            this.populateForms();
            this.showMessage('Settings loaded successfully', 'success');
          }
        },
        error: (error) => {
          console.error('Error loading tenant settings:', error);
          this.isLoading = false;
          this.showMessage('Failed to load settings', 'error');
        }
      });
    } catch (error) {
      this.isLoading = false;
      this.showMessage('Error loading settings', 'error');
    }
  }

  populateForms() {
    // Populate company form
    if (this.currentSettings['company'] && this.currentSettings['company'].company_info) {
      this.companyForm.patchValue(this.currentSettings['company'].company_info);
    }

    // Populate branding form
    if (this.currentSettings['branding'] && this.currentSettings['branding'].branding) {
      this.brandingForm.patchValue(this.currentSettings['branding'].branding);
    }

    // Populate loan defaults form
    if (this.currentSettings['loan'] && this.currentSettings['loan'].loan_defaults) {
      this.loanDefaultsForm.patchValue(this.currentSettings['loan'].loan_defaults);
    }
  }

  showMessage(message: string, type: 'success' | 'error' | 'info') {
    this.message = message;
    this.messageType = type;
    // Clear message after 3 seconds
    setTimeout(() => {
      this.message = '';
    }, 3000);
  }

  async updateCompanyInfo() {
    if (this.companyForm.valid) {
      this.isLoading = true;
      this.showMessage('Updating company information...', 'info');

      this.tenantSettingsService.updateCompanyInfo(this.companyForm.value).subscribe({
        next: async (response) => {
          this.isLoading = false;
          if (response.success) {
            this.showMessage('Company information updated successfully', 'success');
            this.loadTenantSettings(); // Refresh data
          }
        },
        error: async (error) => {
          console.error('Error updating company info:', error);
          this.isLoading = false;
          this.showMessage('Failed to update company information', 'error');
        }
      });
    } else {
      this.showMessage('Please fill in all required fields correctly', 'error');
    }
  }

  async updateBranding() {
    if (this.brandingForm.valid) {
      this.isLoading = true;
      this.showMessage('Updating branding...', 'info');

      this.tenantSettingsService.updateBranding(this.brandingForm.value).subscribe({
        next: async (response) => {
          this.isLoading = false;
          if (response.success) {
            this.showMessage('Branding updated successfully', 'success');
            this.loadTenantSettings(); // Refresh data
            // Apply new colors to the current page
            this.applyBrandingColors();
          }
        },
        error: async (error) => {
          console.error('Error updating branding:', error);
          this.isLoading = false;
          this.showMessage('Failed to update branding', 'error');
        }
      });
    }
  }

  async updateLoanDefaults() {
    if (this.loanDefaultsForm.valid) {
      this.isLoading = true;
      this.showMessage('Updating loan defaults...', 'info');

      this.tenantSettingsService.updateLoanDefaults(this.loanDefaultsForm.value).subscribe({
        next: async (response) => {
          this.isLoading = false;
          if (response.success) {
            this.showMessage('Loan defaults updated successfully', 'success');
            this.loadTenantSettings(); // Refresh data
          }
        },
        error: async (error) => {
          console.error('Error updating loan defaults:', error);
          this.isLoading = false;
          this.showMessage('Failed to update loan defaults', 'error');
        }
      });
    } else {
      this.showMessage('Please fill in all fields with valid values', 'error');
    }
  }

  applyBrandingColors() {
    const primaryColor = this.brandingForm.get('primary_color')?.value;
    const secondaryColor = this.brandingForm.get('secondary_color')?.value;

    if (primaryColor) {
      document.documentElement.style.setProperty('--ion-color-primary', primaryColor);
    }

    if (secondaryColor) {
      document.documentElement.style.setProperty('--ion-color-secondary', secondaryColor);
    }
  }

  onColorChange(colorType: 'primary' | 'secondary', event: any) {
    const color = event.target.value;
    if (colorType === 'primary') {
      this.brandingForm.patchValue({ primary_color: color });
    } else {
      this.brandingForm.patchValue({ secondary_color: color });
    }

    // Apply immediately for preview
    this.applyBrandingColors();
  }

  onPrimaryColorChange(event: any) {
    this.onColorChange('primary', event);
  }

  onSecondaryColorChange(event: any) {
    this.onColorChange('secondary', event);
  }

  async resetToDefaults() {
    this.isLoading = true;
    this.showMessage('Resetting to defaults...', 'info');

    const defaultSettings = {
      company_info: {
        timezone: 'Asia/Manila',
        currency: 'PHP',
        locale: 'en-PH'
      },
      branding: {
        primary_color: '#3B82F6',
        secondary_color: '#8B5CF6',
        logo_url: null
      },
      loan_defaults: {
        default_interest_rate: 5.0,
        default_term_months: 12,
        max_loan_amount: 1000000,
        min_loan_amount: 1000,
        late_fee_percentage: 2.0,
        grace_period_days: 3
      }
    };

    this.tenantSettingsService.bulkUpdateTenantSettings(defaultSettings).subscribe({
      next: async (response) => {
        this.isLoading = false;
        if (response.success) {
          this.showMessage('Settings reset to defaults successfully', 'success');
          this.loadTenantSettings(); // Refresh data
        }
      },
      error: async (error) => {
        console.error('Error resetting settings:', error);
        this.isLoading = false;
        this.showMessage('Failed to reset settings', 'error');
      }
    });
  }

  // Helper methods for form validation display
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Invalid email format';
      if (field.errors['min']) return `Value must be at least ${field.errors['min'].min}`;
      if (field.errors['max']) return `Value must be at most ${field.errors['max'].max}`;
    }
    return '';
  }
}
