import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { LoanService } from '../../services/loan.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Loan } from '../../../../core/models/loan.model';

@Component({
  selector: 'app-loans-list',
  templateUrl: './loans-list.page.html',
  styleUrls: ['./loans-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class LoansListPage implements OnInit {
  loans: Loan[] = [];
  isLoading = true;

  constructor(
    private loanService: LoanService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadLoans();
  }

  ionViewWillEnter() {
    this.loadLoans();
  }

  loadLoans() {
    const user = this.authService.getCurrentUser();
    if (!user || !user.customerId) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.loanService.getCustomerLoans(user.customerId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.loans = response.data.loans || [];
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading loans:', error);
      }
    });
  }

  doRefresh(event: any) {
    this.loadLoans();
    setTimeout(() => event.target.complete(), 1000);
  }

  viewLoan(loanId: number) {
    this.router.navigate(['/loan', loanId]);
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'active': 'success',
      'completed': 'medium',
      'overdue': 'danger',
      'pending': 'warning',
      'disbursed': 'primary'
    };
    return colors[status] || 'medium';
  }

  formatCurrency(amount: number): string {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
