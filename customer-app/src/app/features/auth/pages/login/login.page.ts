import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class LoginPage {
  // Default test credentials for easy testing (Super Admin)
  email: string = 'admin@pacifica.ph';
  password: string = 'Admin@123';

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {}

  ionViewWillEnter() {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/tabs/loans'], { replaceUrl: true });
    }
  }

  async onSubmit() {
    if (!this.email || !this.password) {
      await this.showAlert('Error', 'Please enter both email and password');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Logging in...'
    });
    await loading.present();

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: async (response) => {
        await loading.dismiss();
        if (response.success) {
          this.router.navigate(['/tabs/loans'], { replaceUrl: true });
        }
      },
      error: async (error) => {
        await loading.dismiss();
        const message = error.error?.message || 'Login failed. Please try again.';
        await this.showAlert('Login Failed', message);
      }
    });
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
