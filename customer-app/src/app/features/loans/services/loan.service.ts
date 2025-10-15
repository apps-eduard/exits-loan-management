import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Loan, PaymentSchedule, PaymentHistory } from '../../../core/models/loan.model';

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  constructor(private http: HttpClient) {}

  getCustomerLoans(customerId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/loans`, {
      params: { customerId: customerId.toString() }
    });
  }

  getLoanDetails(loanId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/loans/${loanId}`);
  }

  getPaymentSchedule(loanId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/loans/${loanId}/schedule`);
  }

  getPaymentHistory(loanId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/payments/loan/${loanId}`);
  }
}
