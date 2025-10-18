import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/auth.model';
import { 
  UserDetail, 
  UserListItem, 
  CreateUserDto, 
  UpdateUserDto, 
  UserFilters,
  Role,
  Permission 
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api';

  // User CRUD operations
  getUsers(filters?: UserFilters): Observable<ApiResponse<{ users: UserListItem[]; total: number }>> {
    let params = new HttpParams();
    
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.roleId) {
      params = params.set('roleId', filters.roleId);
    }
    if (filters?.organizationalUnitId) {
      params = params.set('organizationalUnitId', filters.organizationalUnitId);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<ApiResponse<{ users: UserListItem[]; total: number }>>(
      `${this.API_URL}/users`,
      { params }
    );
  }

  getUserById(id: string): Observable<ApiResponse<{ user: UserDetail }>> {
    return this.http.get<ApiResponse<{ user: UserDetail }>>(
      `${this.API_URL}/users/${id}`
    );
  }

  createUser(userData: CreateUserDto): Observable<ApiResponse<{ user: UserDetail }>> {
    return this.http.post<ApiResponse<{ user: UserDetail }>>(
      `${this.API_URL}/users`,
      userData
    );
  }

  updateUser(id: string, userData: UpdateUserDto): Observable<ApiResponse<{ user: UserDetail }>> {
    return this.http.put<ApiResponse<{ user: UserDetail }>>(
      `${this.API_URL}/users/${id}`,
      userData
    );
  }

  deleteUser(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.API_URL}/users/${id}`
    );
  }

  suspendUser(id: string): Observable<ApiResponse<{ user: UserDetail }>> {
    return this.http.patch<ApiResponse<{ user: UserDetail }>>(
      `${this.API_URL}/users/${id}/suspend`,
      {}
    );
  }

  activateUser(id: string): Observable<ApiResponse<{ user: UserDetail }>> {
    return this.http.patch<ApiResponse<{ user: UserDetail }>>(
      `${this.API_URL}/users/${id}/activate`,
      {}
    );
  }

  resetPassword(id: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.API_URL}/users/${id}/reset-password`,
      { newPassword }
    );
  }

  // Role and Permission operations
  getRoles(): Observable<ApiResponse<{ roles: Role[] }>> {
    return this.http.get<ApiResponse<{ roles: Role[] }>>(
      `${this.API_URL}/users/roles`
    );
  }

  getPermissions(): Observable<ApiResponse<{ permissions: Permission[] }>> {
    return this.http.get<ApiResponse<{ permissions: Permission[] }>>(
      `${this.API_URL}/users/permissions`
    );
  }

  getRolePermissions(roleId: string): Observable<ApiResponse<{ permissions: Permission[] }>> {
    return this.http.get<ApiResponse<{ permissions: Permission[] }>>(
      `${this.API_URL}/users/roles/${roleId}/permissions`
    );
  }
}
