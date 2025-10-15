import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { LoanService } from '../../services/loan.service';
import { QrCodeService } from '../../services/qr-code.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Loan, PaymentSchedule, PaymentHistory } from '../../../../core/models/loan.model';

@Component({
  selector: 'app-loan-detail',
  templateUrl: './loan-detail.page.html',
  styleUrls: ['./loan-detail.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LoanDetailPage implements OnInit {
  loanId: number = 0;
  loan: Loan | null = null;
  paymentSchedule: PaymentSchedule[] = [];
  paymentHistory: PaymentHistory[] = [];
  
  selectedSegment = 'overview';
  isLoading = true;
  qrCodeDataUrl: string = '';
  showQRModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loanService: LoanService,
    private qrCodeService: QrCodeService,
    private authService: AuthService,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loanId = parseInt(id);
      this.loadLoanDetails();
    }
  }

  loadLoanDetails() {
    this.isLoading = true;
    this.loanService.getLoanDetails(this.loanId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loan = response.data.loan;
          this.loadPaymentSchedule();
          this.loadPaymentHistory();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading loan:', error);
        this.isLoading = false;
      }
    });
  }

  loadPaymentSchedule() {
    this.loanService.getPaymentSchedule(this.loanId).subscribe({
      next: (response) => {
        if (response.success) {
          this.paymentSchedule = response.data.schedule || [];
        }
      },
      error: (error) => console.error('Error loading schedule:', error)
    });
  }

  loadPaymentHistory() {
    this.loanService.getPaymentHistory(this.loanId).subscribe({
      next: (response) => {
        if (response.success) {
          this.paymentHistory = response.data.payments || [];
        }
      },
      error: (error) => console.error('Error loading history:', error)
    });
  }

  async generateQRCode() {
    if (!this.loan) return;

    const user = this.authService.getCurrentUser();
    if (!user) return;

    try {
      const qrData = this.qrCodeService.generateCustomerQRData(
        user.id,
        `${user.firstName} ${user.lastName}`,
        this.loan.id.toString(),
        this.loan.loanNumber
      );

      this.qrCodeDataUrl = await this.qrCodeService.generateQRCode(qrData);
      this.showQRModal = true;
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }

  closeQRModal() {
    this.showQRModal = false;
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'active': 'success',
      'completed': 'medium',
      'overdue': 'danger',
      'pending': 'warning',
      'paid': 'success',
      'partial': 'warning'
    };
    return colors[status] || 'medium';
  }

  formatCurrency(amount: number): string {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  goBack() {
    this.router.navigate(['/tabs/loans']);
  }
}
