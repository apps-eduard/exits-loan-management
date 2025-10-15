import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { QrScannerService } from '../../services/qr-scanner.service';
import { PaymentService, PaymentRequest } from '../../services/payment.service';
import { CollectionService } from '../../services/collection.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-payment-posting',
  templateUrl: './payment-posting.page.html',
  styleUrls: ['./payment-posting.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PaymentPostingPage implements OnInit {
  loanId: string = '';
  customerName: string = '';
  loanNumber: string = '';
  outstandingBalance: number = 0;
  
  paymentAmount: number = 0;
  paymentMethod: string = 'cash';
  referenceNumber: string = '';
  notes: string = '';
  
  isLoading = false;
  showScanner = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private qrScannerService: QrScannerService,
    private paymentService: PaymentService,
    private collectionService: CollectionService,
    private authService: AuthService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['loanId']) {
        this.loadLoanDetails(params['loanId']);
      }
    });
  }

  loadLoanDetails(loanId: string) {
    this.isLoading = true;
    this.errorMessage = '';

    this.collectionService.getCollectionDetails(loanId).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          const loan = response.data.loan;
          this.loanId = loan.loanId;
          this.customerName = loan.customerName;
          this.loanNumber = loan.loanNumber;
          this.outstandingBalance = loan.outstandingBalance;
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load loan details.';
        console.error('Load loan error:', error);
      }
    });
  }

  async scanQRCode() {
    try {
      const result = await this.qrScannerService.startScan();
      if (result) {
        this.handleQRScan(result);
      }
    } catch (error) {
      console.error('QR scan error:', error);
      await this.showErrorAlert('Failed to scan QR code. Please try again.');
    }
  }

  handleQRScan(data: any) {
    this.loanId = data.loanId;
    this.customerName = data.customerName;
    this.loanNumber = data.loanNumber;
    this.outstandingBalance = data.outstandingBalance;
  }

  async submitPayment() {
    if (!this.paymentAmount || this.paymentAmount <= 0) {
      await this.showErrorAlert('Please enter a valid payment amount');
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      await this.showErrorAlert('User not authenticated');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const paymentData: PaymentRequest = {
      loanId: parseInt(this.loanId),
      customerId: 0, // Will be set by backend from loan
      amount: this.paymentAmount,
      paymentMethod: this.paymentMethod as any,
      referenceNumber: this.referenceNumber || undefined,
      notes: this.notes || undefined,
      collectorId: parseInt(user.id),
      paymentDate: new Date().toISOString()
    };

    this.paymentService.postPayment(paymentData).subscribe({
      next: async (response: any) => {
        this.isLoading = false;
        if (response.success) {
          await this.showSuccessAlert('Payment posted successfully!');
          this.resetForm();
          this.router.navigate(['/collector/tabs/collections']);
        }
      },
      error: async (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to post payment.';
        await this.showErrorAlert(this.errorMessage);
        console.error('Post payment error:', error);
      }
    });
  }

  resetForm() {
    this.paymentAmount = 0;
    this.paymentMethod = 'cash';
    this.referenceNumber = '';
    this.notes = '';
  }

  setFullAmount() {
    this.paymentAmount = this.outstandingBalance;
  }

  async showErrorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async showSuccessAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Success',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
