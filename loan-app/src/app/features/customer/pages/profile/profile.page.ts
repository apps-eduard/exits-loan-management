import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonAvatar,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, mailOutline, callOutline, locationOutline, cardOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/auth.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonAvatar
  ]
})
export class ProfilePage implements OnInit {
  customer: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({ personOutline, mailOutline, callOutline, locationOutline, cardOutline, logOutOutline });
  }

  ngOnInit() {
    this.loadCustomerData();
  }

  ionViewWillEnter() {
    this.loadCustomerData();
  }

  loadCustomerData() {
    this.customer = this.authService.getCurrentUser();
  }

  getInitials(): string {
    if (!this.customer) return '?';
    const first = this.customer.firstName?.charAt(0) || '';
    const last = this.customer.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  async confirmLogout() {
    const alert = await this.alertController.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to log out?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Logout',
          role: 'confirm',
          handler: () => {
            this.logout();
          }
        }
      ]
    });

    await alert.present();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Even if API call fails, clear local storage and redirect
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    });
  }
}
