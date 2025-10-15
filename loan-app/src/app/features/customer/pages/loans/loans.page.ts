import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { LoanService, Loan } from '../../services/loan.service';

@Component({
  selector: 'app-loans',
  templateUrl: './loans.page.html',
  styleUrls: ['./loans.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class LoansPage implements OnInit {
  loans: Loan[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private loanService: LoanService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadLoans();
  }

  ionViewWillEnter() {
    // Refresh loans when page becomes active
    this.loadLoans();
  }

  loadLoans() {
    const user = this.authService.getCurrentUser();

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.loanService.getCustomerLoans(user.id).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          this.loans = response.data.loans || [];
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load loans. Please try again.';
        console.error('Load loans error:', error);
      }
    });
  }

  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'draft': 'medium',
      'pending': 'warning',
      'under_review': 'warning',
      'approved': 'success',
      'disbursed': 'success',
      'active': 'primary',
      'closed': 'dark',
      'rejected': 'danger',
      'written_off': 'danger'
    };
    return statusColors[status] || 'medium';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  viewLoanDetails(loan: Loan) {
    this.router.navigate(['/tabs/loans', loan.id]);
  }

  doRefresh(event: any) {
    this.loadLoans();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}
