import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { UserDetail, Permission } from '../../../models/user.model';
import { HasPermissionDirective } from '../../../directives/permission.directive';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);

  user = signal<UserDetail | null>(null);
  loading = signal(false);
  activeTab = signal<'details' | 'permissions'>('details');

  ngOnInit() {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.loadUser(userId);
    }
  }

  loadUser(userId: string) {
    this.loading.set(true);
    this.userService.getUserById(userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.user.set(response.data.user);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load user:', error);
        this.loading.set(false);
        this.router.navigate(['/users']);
      }
    });
  }

  goBack() {
    this.router.navigate(['/users']);
  }

  suspendUser() {
    const user = this.user();
    if (!user) return;

    if (confirm('Are you sure you want to suspend this user?')) {
      this.userService.suspendUser(user.id).subscribe({
        next: () => {
          this.loadUser(user.id);
        },
        error: (error) => {
          console.error('Failed to suspend user:', error);
          alert('Failed to suspend user');
        }
      });
    }
  }

  activateUser() {
    const user = this.user();
    if (!user) return;

    this.userService.activateUser(user.id).subscribe({
      next: () => {
        this.loadUser(user.id);
      },
      error: (error) => {
        console.error('Failed to activate user:', error);
        alert('Failed to activate user');
      }
    });
  }

  resetPassword() {
    const user = this.user();
    if (!user) return;

    const newPassword = prompt('Enter new password (minimum 8 characters):');
    if (newPassword && newPassword.length >= 8) {
      this.userService.resetPassword(user.id, newPassword).subscribe({
        next: () => {
          alert('Password reset successfully');
        },
        error: (error) => {
          console.error('Failed to reset password:', error);
          alert('Failed to reset password');
        }
      });
    } else if (newPassword) {
      alert('Password must be at least 8 characters');
    }
  }

  deleteUser() {
    const user = this.user();
    if (!user) return;

    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.router.navigate(['/users']);
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

  groupPermissionsByResource(permissions: Permission[]): Map<string, Permission[]> {
    const grouped = new Map<string, Permission[]>();
    permissions.forEach(permission => {
      const resource = permission.resource || 'General';
      if (!grouped.has(resource)) {
        grouped.set(resource, []);
      }
      grouped.get(resource)!.push(permission);
    });
    return grouped;
  }

  getPermissionGroups(): Array<{ resource: string; permissions: Permission[] }> {
    const user = this.user();
    if (!user) return [];
    
    const grouped = this.groupPermissionsByResource(user.permissions);
    return Array.from(grouped.entries()).map(([resource, permissions]) => ({
      resource,
      permissions
    }));
  }
}
