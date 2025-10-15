import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface LoanProduct {
  id: number;
  name: string;
  type: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  minTerm: number;
  maxTerm: number;
  processingFee: number;
  description?: string;
}

interface LoanApplication {
  productId: number;
  amount: number;
  termMonths: number;
  purpose: string;
  collateral?: string;
  monthlyIncome?: number;
  employmentStatus?: string;
}

@Component({
  selector: 'app-loan-application',
  templateUrl: './loan-application.page.html',
  styleUrls: ['./loan-application.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LoanApplicationPage implements OnInit {
  loanProducts: LoanProduct[] = [];
  selectedProduct: LoanProduct | null = null;
  
  // Application form data
  loanAmount: number = 0;
  loanTerm: number = 12;
  purpose: string = '';
  collateral: string = '';
  monthlyIncome: number = 0;
  employmentStatus: string = 'employed';
  
  // Calculated values
  monthlyPayment: number = 0;
  totalInterest: number = 0;
  totalAmount: number = 0;
  processingFee: number = 0;

  employmentOptions = [
    { value: 'employed', label: 'Employed' },
    { value: 'self-employed', label: 'Self-Employed' },
    { value: 'business-owner', label: 'Business Owner' },
    { value: 'unemployed', label: 'Unemployed' }
  ];

  constructor(
    private router: Router,
    private http: HttpClient,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadLoanProducts();
  }

  async loadLoanProducts() {
    const loading = await this.loadingController.create({
      message: 'Loading loan products...'
    });
    await loading.present();

    this.http.get<any>(`${environment.apiUrl}/loan-products`).subscribe({
      next: (response) => {
        loading.dismiss();
        if (response.success && response.data) {
          this.loanProducts = response.data;
        }
      },
      error: async (error) => {
        await loading.dismiss();
        console.error('Error loading loan products:', error);
        await this.showAlert('Error', 'Failed to load loan products. Please try again.');
      }
    });
  }

  selectProduct(product: LoanProduct) {
    this.selectedProduct = product;
    // Set default values based on product
    this.loanAmount = product.minAmount;
    this.loanTerm = product.minTerm;
    this.calculateLoan();
  }

  onAmountChange() {
    if (this.selectedProduct) {
      if (this.loanAmount < this.selectedProduct.minAmount) {
        this.loanAmount = this.selectedProduct.minAmount;
      } else if (this.loanAmount > this.selectedProduct.maxAmount) {
        this.loanAmount = this.selectedProduct.maxAmount;
      }
      this.calculateLoan();
    }
  }

  onTermChange() {
    if (this.selectedProduct) {
      if (this.loanTerm < this.selectedProduct.minTerm) {
        this.loanTerm = this.selectedProduct.minTerm;
      } else if (this.loanTerm > this.selectedProduct.maxTerm) {
        this.loanTerm = this.selectedProduct.maxTerm;
      }
      this.calculateLoan();
    }
  }

  calculateLoan() {
    if (!this.selectedProduct || !this.loanAmount || !this.loanTerm) {
      return;
    }

    const principal = this.loanAmount;
    const monthlyRate = this.selectedProduct.interestRate / 100 / 12;
    const numPayments = this.loanTerm;

    // Calculate monthly payment using amortization formula
    if (monthlyRate > 0) {
      this.monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                            (Math.pow(1 + monthlyRate, numPayments) - 1);
    } else {
      this.monthlyPayment = principal / numPayments;
    }

    this.totalAmount = this.monthlyPayment * numPayments;
    this.totalInterest = this.totalAmount - principal;
    this.processingFee = (principal * this.selectedProduct.processingFee) / 100;
  }

  async submitApplication() {
    // Validation
    if (!this.selectedProduct) {
      await this.showAlert('Error', 'Please select a loan product');
      return;
    }

    if (!this.loanAmount || this.loanAmount < this.selectedProduct.minAmount || 
        this.loanAmount > this.selectedProduct.maxAmount) {
      await this.showAlert('Error', `Loan amount must be between ${this.formatCurrency(this.selectedProduct.minAmount)} and ${this.formatCurrency(this.selectedProduct.maxAmount)}`);
      return;
    }

    if (!this.loanTerm || this.loanTerm < this.selectedProduct.minTerm || 
        this.loanTerm > this.selectedProduct.maxTerm) {
      await this.showAlert('Error', `Loan term must be between ${this.selectedProduct.minTerm} and ${this.selectedProduct.maxTerm} months`);
      return;
    }

    if (!this.purpose) {
      await this.showAlert('Error', 'Please specify the purpose of the loan');
      return;
    }

    if (!this.monthlyIncome || this.monthlyIncome <= 0) {
      await this.showAlert('Error', 'Please enter your monthly income');
      return;
    }

    // Check if monthly payment is not more than 40% of monthly income
    const debtToIncomeRatio = (this.monthlyPayment / this.monthlyIncome) * 100;
    if (debtToIncomeRatio > 40) {
      const confirm = await this.showConfirmAlert(
        'High Debt-to-Income Ratio',
        `Your monthly payment (${this.formatCurrency(this.monthlyPayment)}) is ${debtToIncomeRatio.toFixed(1)}% of your monthly income. This exceeds the recommended 40% limit. Do you still want to proceed?`
      );
      if (!confirm) {
        return;
      }
    }

    const loading = await this.loadingController.create({
      message: 'Submitting your application...'
    });
    await loading.present();

    const applicationData: LoanApplication = {
      productId: this.selectedProduct.id,
      amount: this.loanAmount,
      termMonths: this.loanTerm,
      purpose: this.purpose,
      collateral: this.collateral || undefined,
      monthlyIncome: this.monthlyIncome,
      employmentStatus: this.employmentStatus
    };

    this.http.post(`${environment.apiUrl}/loans`, applicationData).subscribe({
      next: async (response: any) => {
        await loading.dismiss();
        if (response.success) {
          await this.showSuccessAlert(
            'Application Submitted!',
            'Your loan application has been submitted successfully. Our team will review it and contact you within 2-3 business days.'
          );
          this.resetForm();
          this.router.navigate(['/tabs/loans']);
        }
      },
      error: async (error) => {
        await loading.dismiss();
        const message = error.error?.message || 'Failed to submit application. Please try again.';
        await this.showAlert('Application Failed', message);
      }
    });
  }

  resetForm() {
    this.selectedProduct = null;
    this.loanAmount = 0;
    this.loanTerm = 12;
    this.purpose = '';
    this.collateral = '';
    this.monthlyIncome = 0;
    this.employmentStatus = 'employed';
    this.monthlyPayment = 0;
    this.totalInterest = 0;
    this.totalAmount = 0;
    this.processingFee = 0;
  }

  backToProducts() {
    this.selectedProduct = null;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async showConfirmAlert(header: string, message: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header,
        message,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Proceed',
            handler: () => resolve(true)
          }
        ]
      });
      await alert.present();
    });
  }

  private async showSuccessAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
