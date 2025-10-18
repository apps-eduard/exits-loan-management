import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const environment = {
  apiUrl: 'http://localhost:3000/api'
};

export interface Customer {
  id: string;
  customerId?: string;
  customerCode: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  gender?: string;
  civilStatus?: string;
  nationality: string;
  email: string;
  mobilePhone: string;
  homePhone?: string;
  officePhone?: string;
  addressLine1: string;
  addressLine2?: string;
  barangay?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country: string;
  tinNo?: string;
  sssNo?: string;
  gsis?: string;
  employmentStatus?: string;
  employerName?: string;
  employerAddress?: string;
  occupation?: string;
  monthlyIncome?: number;
  sourceOfIncome?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  kycStatus: string;
  kycVerifiedAt?: string;
  kycVerifiedBy?: string;
  organizationalUnitId: string;
  organizationalUnitName?: string;
  status: string;
  statusReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  kycStatus?: string;
  status?: string;
  organizationalUnitId?: string;
}

export interface CustomerListResponse {
  success: boolean;
  data: {
    customers: Customer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface CustomerResponse {
  success: boolean;
  data: {
    customer: Customer;
  };
}

export interface CreateCustomerData {
  customerCode: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  gender?: string;
  civilStatus?: string;
  nationality: string;
  email: string;
  mobilePhone: string;
  homePhone?: string;
  officePhone?: string;
  addressLine1: string;
  addressLine2?: string;
  barangay?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country: string;
  tinNo?: string;
  sssNo?: string;
  gsis?: string;
  employmentStatus?: string;
  employerName?: string;
  employerAddress?: string;
  occupation?: string;
  monthlyIncome?: number;
  sourceOfIncome?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  organizationalUnitId: string;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  status?: string;
  statusReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/customers`;

  getCustomers(params?: CustomerListParams): Observable<CustomerListResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.kycStatus) httpParams = httpParams.set('kycStatus', params.kycStatus);
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.organizationalUnitId) httpParams = httpParams.set('organizationalUnitId', params.organizationalUnitId);
    }

    return this.http.get<CustomerListResponse>(this.apiUrl, { params: httpParams });
  }

  getCustomerById(id: string): Observable<CustomerResponse> {
    return this.http.get<CustomerResponse>(`${this.apiUrl}/${id}`);
  }

  createCustomer(data: CreateCustomerData): Observable<CustomerResponse> {
    return this.http.post<CustomerResponse>(this.apiUrl, data);
  }

  updateCustomer(id: string, data: UpdateCustomerData): Observable<CustomerResponse> {
    return this.http.put<CustomerResponse>(`${this.apiUrl}/${id}`, data);
  }

  deleteCustomer(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  updateKycStatus(id: string, status: string, reason?: string): Observable<CustomerResponse> {
    return this.http.patch<CustomerResponse>(`${this.apiUrl}/${id}/kyc-status`, {
      kycStatus: status,
      statusReason: reason
    });
  }

  updateCustomerStatus(id: string, status: string, reason?: string): Observable<CustomerResponse> {
    return this.http.patch<CustomerResponse>(`${this.apiUrl}/${id}/status`, {
      status,
      statusReason: reason
    });
  }
}
