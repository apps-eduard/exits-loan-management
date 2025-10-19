import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TenantUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface TenantForTesting {
  id: string;
  companyName: string;
  slug: string;
  status: string;
  users: TenantUser[];
}

export interface TenantsResponse {
  success: boolean;
  data: {
    tenants: TenantForTesting[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api';

  getTenantsForTesting(): Observable<TenantsResponse> {
    return this.http.get<TenantsResponse>(`${this.API_URL}/tenants/testing`);
  }
}
