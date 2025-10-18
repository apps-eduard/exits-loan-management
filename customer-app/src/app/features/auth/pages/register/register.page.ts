import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RegisterPage {
  // Personal Information
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  phone: string = '';
  password: string = '';
  confirmPassword: string = '';
  
  // Address Information
  address: string = '';
  barangay: string = '';
  city: string = '';
  province: string = '';
  zipCode: string = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {}

  async onSubmit() {
    // Validate required fields
    if (!this.firstName || !this.lastName || !this.email || !this.phone || !this.password) {
      await this.showAlert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      await this.showAlert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate phone format (Philippine format)
    const phoneRegex = /^(\+63|0)?9\d{9}$/;
    if (!phoneRegex.test(this.phone.replace(/\s/g, ''))) {
      await this.showAlert('Error', 'Please enter a valid Philippine mobile number');
      return;
    }

    // Validate password
    if (this.password.length < 8) {
      await this.showAlert('Error', 'Password must be at least 8 characters long');
      return;
    }

    // Validate password confirmation
    if (this.password !== this.confirmPassword) {
      await this.showAlert('Error', 'Passwords do not match');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Creating your account...'
    });
    await loading.present();

    // Format phone number
    const formattedPhone = this.formatPhoneNumber(this.phone);

    const customerData = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: formattedPhone,
      password: this.password,
      address: this.address || undefined,
      barangay: this.barangay || undefined,
      city: this.city || undefined,
      province: this.province || undefined,
      zipCode: this.zipCode || undefined
    };

    this.http.post(`${environment.apiUrl}/auth/register`, customerData).subscribe({
      next: async (response: any) => {
        await loading.dismiss();
        if (response.success) {
          await this.showSuccessAlert(
            'Registration Successful!',
            'Your account has been created. Please wait for approval from our team. You will receive an email once your account is verified.'
          );
          this.router.navigate(['/login']);
        }
      },
      error: async (error) => {
        await loading.dismiss();
        const message = error.error?.message || 'Registration failed. Please try again.';
        await this.showAlert('Registration Failed', message);
      }
    });
  }

  formatPhoneNumber(phone: string): string {
    // Remove all spaces and special characters
    let cleaned = phone.replace(/\s/g, '').replace(/[^\d+]/g, '');
    
    // Convert to +63 format
    if (cleaned.startsWith('0')) {
      cleaned = '+63' + cleaned.substring(1);
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+63' + cleaned;
    }
    
    return cleaned;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async showSuccessAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [{
        text: 'OK',
        handler: () => {
          this.router.navigate(['/login']);
        }
      }]
    });
    await alert.present();
  }
}
