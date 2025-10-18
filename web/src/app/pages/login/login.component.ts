import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoggerService } from '../../services/logger.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private logger = inject(LoggerService);

  isLoading = signal(false);
  error = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    email: ['admin@pacifica.ph', [Validators.required, Validators.email]],
    password: ['ChangeMe123!', Validators.required]
  });

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
