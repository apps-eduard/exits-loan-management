export interface Loan {
  id: number;
  loanNumber: string;
  customerId: number;
  customerName?: string;
  productName: string;
  principalAmount: number;
  interestRate: number;
  termMonths?: number;
  termDays?: number;
  paymentFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';
  installmentAmount: number;
  totalInstallments: number;
  status: 'draft' | 'pending' | 'under_review' | 'approved' | 'disbursed' | 'active' | 'completed' | 'defaulted' | 'rejected';
  applicationDate: string;
  approvedDate?: string;
  disbursedDate?: string;
  firstPaymentDate?: string;
  maturityDate?: string;
  totalPaid: number;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSchedule {
  id: number;
  loanId: number;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  paymentDate?: string;
}

export interface PaymentHistory {
  id: number;
  loanId: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  receiptNumber: string;
  principalPaid: number;
  interestPaid: number;
  penaltyPaid: number;
  collectedBy?: string;
  notes?: string;
}
