import { Component, OnInit, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { CreateUserDto, UpdateUserDto, Role, Permission, OrganizationalUnit } from '../../../models/user.model';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss']
})
export class UserFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  @Input() userId: string | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  userForm!: FormGroup;
  loading = signal(false);
  roles = signal<Role[]>([]);
  rolePermissions = signal<Permission[]>([]);
  orgUnits = signal<OrganizationalUnit[]>([
    // TODO: Load from API
    { id: '1', name: 'Head Office', code: 'HQ', type: 'branch' },
    { id: '2', name: 'Branch 1', code: 'BR1', type: 'branch' }
  ]);

  isEditMode = false;

  ngOnInit() {
    this.isEditMode = !!this.userId;
    this.initForm();
    this.loadRoles();
    
    if (this.isEditMode && this.userId) {
      this.loadUser(this.userId);
    }
  }

  initForm() {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: [''],
      roleId: ['', Validators.required],
      organizationalUnitId: ['', Validators.required],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
      status: ['active']
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

  loadUser(userId: string) {
    this.loading.set(true);
    this.userService.getUserById(userId).subscribe({
      next: (response) => {
        if (response.success) {
          const user = response.data.user;
          this.userForm.patchValue({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            roleId: user.roleId,
            organizationalUnitId: user.organizationalUnitId,
            status: user.status
          });
          this.onRoleChange(user.roleId);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load user:', error);
        this.loading.set(false);
      }
    });
  }

  onRoleChange(roleId: string) {
    if (roleId) {
      this.userService.getRolePermissions(roleId).subscribe({
        next: (response) => {
          if (response.success) {
            this.rolePermissions.set(response.data.permissions);
          }
        },
        error: (error) => {
          console.error('Failed to load role permissions:', error);
        }
      });
    } else {
      this.rolePermissions.set([]);
    }
  }

  onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.userForm.value;

    if (this.isEditMode && this.userId) {
      const updateData: UpdateUserDto = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phoneNumber: formValue.phoneNumber,
        roleId: formValue.roleId,
        organizationalUnitId: formValue.organizationalUnitId,
        status: formValue.status
      };

      this.userService.updateUser(this.userId, updateData).subscribe({
        next: () => {
          this.loading.set(false);
          this.saved.emit();
        },
        error: (error) => {
          console.error('Failed to update user:', error);
          alert('Failed to update user: ' + (error.error?.message || 'Unknown error'));
          this.loading.set(false);
        }
      });
    } else {
      const createData: CreateUserDto = {
        email: formValue.email,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phoneNumber: formValue.phoneNumber,
        roleId: formValue.roleId,
        organizationalUnitId: formValue.organizationalUnitId,
        password: formValue.password
      };

      this.userService.createUser(createData).subscribe({
        next: () => {
          this.loading.set(false);
          this.saved.emit();
        },
        error: (error) => {
          console.error('Failed to create user:', error);
          alert('Failed to create user: ' + (error.error?.message || 'Unknown error'));
          this.loading.set(false);
        }
      });
    }
  }

  onClose() {
    this.closed.emit();
  }

  get f() {
    return this.userForm.controls;
  }
}
