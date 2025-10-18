import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { UserListItem, UserFilters, Role } from '../../../models/user.model';
import { HasPermissionDirective } from '../../../directives/permission.directive';
import { UserFormDialogComponent } from '../user-form-dialog/user-form-dialog.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, UserFormDialogComponent],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);

  users = signal<UserListItem[]>([]);
  roles = signal<Role[]>([]);
  loading = signal(false);
  totalUsers = signal(0);
  
  filters: UserFilters = {
    page: 1,
    limit: 10,
    search: '',
    status: '',
    roleId: ''
  };

  showUserDialog = signal(false);
  selectedUserId = signal<string | null>(null);

  // Expose Math to template
  Math = Math;

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers() {
    this.loading.set(true);
    this.userService.getUsers(this.filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.users.set(response.data.users);
          this.totalUsers.set(response.data.total);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.loading.set(false);
      }
    });
  }

  loadRoles() {
    this.userService.getRoles().subscribe({
      next: (response) => {
        if (response.success) {
          this.roles.set(response.data.roles);
        }
      },
      error: (error) => {
        console.error('Failed to load roles:', error);
      }
    });
  }

  onSearch() {
    this.filters.page = 1;
    this.loadUsers();
  }

  onFilterChange() {
    this.filters.page = 1;
    this.loadUsers();
  }

  clearFilters() {
    this.filters = {
      page: 1,
      limit: 10,
      search: '',
      status: '',
      roleId: ''
    };
    this.loadUsers();
  }

  onPageChange(page: number) {
    this.filters.page = page;
    this.loadUsers();
  }

  viewUser(userId: string) {
    this.router.navigate(['/users', userId]);
  }

  openCreateDialog() {
    this.selectedUserId.set(null);
    this.showUserDialog.set(true);
  }

  openEditDialog(userId: string, event: Event) {
    event.stopPropagation();
    this.selectedUserId.set(userId);
    this.showUserDialog.set(true);
  }

  onUserSaved() {
    this.showUserDialog.set(false);
    this.selectedUserId.set(null);
    this.loadUsers();
  }

  onDialogClose() {
    this.showUserDialog.set(false);
    this.selectedUserId.set(null);
  }

  suspendUser(userId: string, event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to suspend this user?')) {
      this.userService.suspendUser(userId).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          console.error('Failed to suspend user:', error);
          alert('Failed to suspend user');
        }
      });
    }
  }

  activateUser(userId: string, event: Event) {
    event.stopPropagation();
    this.userService.activateUser(userId).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => {
        console.error('Failed to activate user:', error);
        alert('Failed to activate user');
      }
    });
  }

  deleteUser(userId: string, event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          console.error('Failed to delete user:', error);
          alert('Failed to delete user');
        }
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      'invited': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'suspended': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return classes[status] || classes['inactive'];
  }

  get totalPages(): number {
    return Math.ceil(this.totalUsers() / (this.filters.limit || 10));
  }

  get pages(): number[] {
    const total = this.totalPages;
    const current = this.filters.page || 1;
    const delta = 2;
    const range: number[] = [];
    
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      range.unshift(-1);
    }
    if (current + delta < total - 1) {
      range.push(-1);
    }

    range.unshift(1);
    if (total > 1) {
      range.push(total);
    }

    return range.filter((n, i, arr) => arr.indexOf(n) === i);
  }
}
