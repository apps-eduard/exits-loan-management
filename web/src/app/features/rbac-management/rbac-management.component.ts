import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, FormsModule } from '@angular/forms';
import { RbacService, Role, Permission, CreateCustomRoleDto } from '../../core/services/rbac.service';

@Component({
  selector: 'app-rbac-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="rbac-management-container">
      <div class="header">
        <h2>Role & Permission Management</h2>
        <p>Manage roles, permissions, and access control for your organization</p>
      </div>

      <!-- Tab Navigation -->
      <div class="tabs">
        <button
          *ngFor="let tab of tabs"
          [class.active]="activeTab() === tab.id"
          (click)="setActiveTab(tab.id)"
          class="tab-button">
          <i class="material-icons">{{ tab.icon }}</i>
          {{ tab.label }}
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="loading">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>

      <!-- Message Display -->
      <div *ngIf="message()" class="message" [ngClass]="messageType()">
        {{ message() }}
      </div>

      <!-- Roles Tab -->
      <div *ngIf="activeTab() === 'roles' && !isLoading()" class="tab-content">
        <div class="section-header">
          <h3>System & Custom Roles</h3>
          <button (click)="openCreateRoleModal()" class="btn-primary">
            <i class="material-icons">add</i>
            Create Custom Role
          </button>
        </div>

        <div class="roles-grid">
          <div *ngFor="let role of roles()" class="role-card" [ngClass]="{ 'system-role': role.is_system }">
            <div class="role-header">
              <h4>{{ role.name }}</h4>
              <span class="role-level">Level {{ role.level }}</span>
              <span *ngIf="role.is_system" class="system-badge">System</span>
              <span *ngIf="role.tenant_id" class="custom-badge">Custom</span>
            </div>
            <p class="role-description">{{ role.description }}</p>
            <div class="role-permissions">
              <small>{{ role.permissions?.length || 0 }} permissions</small>
            </div>
            <div class="role-actions">
              <button (click)="viewRolePermissions(role)" class="btn-secondary">
                <i class="material-icons">visibility</i>
                View Permissions
              </button>
              <button
                *ngIf="canModifyRole(role)"
                (click)="editRole(role)"
                class="btn-secondary">
                <i class="material-icons">edit</i>
                Edit
              </button>
              <button
                *ngIf="canModifyRole(role)"
                (click)="deleteRole(role)"
                class="btn-danger">
                <i class="material-icons">delete</i>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Permissions Tab -->
      <div *ngIf="activeTab() === 'permissions' && !isLoading()" class="tab-content">
        <div class="section-header">
          <h3>System Permissions</h3>
          <div class="filter-controls">
            <select [(ngModel)]="selectedModule" (ngModelChange)="filterPermissionsByModule()" class="module-filter">
              <option value="">All Modules</option>
              <option *ngFor="let module of availableModules()" [value]="module">{{ module | titlecase }}</option>
            </select>
          </div>
        </div>

        <div class="permissions-grid">
          <div *ngFor="let group of groupedPermissions() | keyvalue" class="permission-module">
            <h4 class="module-title">
              <i class="material-icons">{{ getModuleIcon(group.key) }}</i>
              {{ group.key | titlecase }} Module
            </h4>
            <div class="permissions-list">
              <div *ngFor="let permission of group.value" class="permission-item">
                <div class="permission-info">
                  <strong>{{ permission.key }}</strong>
                  <p>{{ permission.description }}</p>
                  <span class="action-badge">{{ permission.action | titlecase }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Menu Preview Tab -->
      <div *ngIf="activeTab() === 'menu' && !isLoading()" class="tab-content">
        <div class="section-header">
          <h3>Menu Structure Preview</h3>
          <p>Preview how the menu will appear for different roles</p>
        </div>

        <div class="menu-preview-controls">
          <label>Preview for Role:</label>
          <select [(ngModel)]="selectedRoleForPreview" (ngModelChange)="loadMenuPreview()" class="role-selector">
            <option value="">Select a role...</option>
            <option *ngFor="let role of roles()" [value]="role.id">{{ role.name }}</option>
          </select>
        </div>

        <div *ngIf="menuPreview().length > 0" class="menu-preview">
          <div *ngFor="let group of menuPreview()" class="menu-group">
            <h4>
              <i class="material-icons">{{ group.icon }}</i>
              {{ group.name }}
            </h4>
            <ul class="menu-items">
              <li *ngFor="let item of group.items" class="menu-item">
                <i class="material-icons">{{ item.icon }}</i>
                <span>{{ item.name }}</span>
                <small class="item-path">{{ item.path }}</small>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Create/Edit Role Modal -->
      <div *ngIf="showRoleModal()" class="modal-overlay" (click)="closeRoleModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingRole() ? 'Edit Role' : 'Create Custom Role' }}</h3>
            <button (click)="closeRoleModal()" class="close-btn">
              <i class="material-icons">close</i>
            </button>
          </div>

          <form [formGroup]="roleForm" (ngSubmit)="submitRole()" class="modal-form">
            <div class="form-group">
              <label for="roleName">Role Name *</label>
              <input
                type="text"
                id="roleName"
                formControlName="name"
                [class.error]="isFieldInvalid('name')"
                placeholder="Enter role name">
              <div *ngIf="isFieldInvalid('name')" class="error-message">
                Role name is required
              </div>
            </div>

            <div class="form-group">
              <label for="roleDescription">Description *</label>
              <textarea
                id="roleDescription"
                formControlName="description"
                [class.error]="isFieldInvalid('description')"
                placeholder="Describe the role's responsibilities and scope"
                rows="3"></textarea>
              <div *ngIf="isFieldInvalid('description')" class="error-message">
                Description is required
              </div>
            </div>

            <div class="form-group">
              <label for="roleLevel">Hierarchy Level *</label>
              <select id="roleLevel" formControlName="level" [class.error]="isFieldInvalid('level')">
                <option value="">Select level...</option>
                <option *ngFor="let level of hierarchyLevels" [value]="level.value">
                  {{ level.label }} - {{ level.description }}
                </option>
              </select>
              <div *ngIf="isFieldInvalid('level')" class="error-message">
                Hierarchy level is required
              </div>
            </div>

            <div class="form-group">
              <label>Permissions</label>
              <div class="permissions-selector">
                <div *ngFor="let group of groupedPermissions() | keyvalue" class="permission-group">
                  <h5>{{ group.key | titlecase }}</h5>
                  <div class="permission-checkboxes">
                    <label *ngFor="let permission of group.value" class="checkbox-label">
                      <input
                        type="checkbox"
                        [value]="permission.id"
                        (change)="onPermissionToggle($event, permission.id)">
                      <span>{{ permission.key }} - {{ permission.description }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" (click)="closeRoleModal()" class="btn-secondary">
                Cancel
              </button>
              <button type="submit" [disabled]="!roleForm.valid || isLoading()" class="btn-primary">
                {{ editingRole() ? 'Update' : 'Create' }} Role
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rbac-management-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
    }

    .header h2 {
      color: #333;
      margin-bottom: 8px;
    }

    .header p {
      color: #666;
      font-size: 14px;
    }

    .tabs {
      display: flex;
      border-bottom: 2px solid #f0f0f0;
      margin-bottom: 30px;
      gap: 4px;
    }

    .tab-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border: none;
      background: transparent;
      color: #666;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .tab-button:hover {
      color: #333;
      background-color: #f8f9fa;
    }

    .tab-button.active {
      color: #3498db;
      border-bottom-color: #3498db;
      background-color: #f8f9fa;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      padding: 40px;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 10px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .message {
      padding: 12px 16px;
      margin: 16px 0;
      border-radius: 4px;
      border-left: 4px solid;
    }

    .message.success {
      background-color: #d4edda;
      border-color: #28a745;
      color: #155724;
    }

    .message.error {
      background-color: #f8d7da;
      border-color: #dc3545;
      color: #721c24;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .section-header h3 {
      margin: 0;
      color: #333;
    }

    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .role-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border: 1px solid #e0e0e0;
    }

    .role-card.system-role {
      border-left: 4px solid #17a2b8;
    }

    .role-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }

    .role-header h4 {
      margin: 0;
      flex: 1;
      color: #333;
    }

    .role-level {
      background: #6c757d;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }

    .system-badge {
      background: #17a2b8;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }

    .custom-badge {
      background: #28a745;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }

    .role-description {
      color: #666;
      font-size: 14px;
      margin-bottom: 10px;
    }

    .role-permissions {
      margin-bottom: 15px;
    }

    .role-permissions small {
      color: #999;
      font-size: 12px;
    }

    .role-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .permissions-grid {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .permission-module {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .module-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
      color: #333;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 10px;
    }

    .permissions-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 15px;
    }

    .permission-item {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 12px;
    }

    .permission-info strong {
      color: #333;
      font-family: monospace;
    }

    .permission-info p {
      margin: 4px 0;
      color: #666;
      font-size: 13px;
    }

    .action-badge {
      background: #ffc107;
      color: #212529;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 500;
    }

    .filter-controls {
      display: flex;
      gap: 10px;
    }

    .module-filter, .role-selector {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .menu-preview {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .menu-group {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .menu-group h4 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
      color: #333;
    }

    .menu-items {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .menu-item:last-child {
      border-bottom: none;
    }

    .item-path {
      color: #999;
      font-size: 12px;
      margin-left: auto;
    }

    .btn-primary, .btn-secondary, .btn-danger {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      text-decoration: none;
    }

    .btn-primary {
      background-color: #3498db;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #2980b9;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #5a6268;
    }

    .btn-danger {
      background-color: #dc3545;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background-color: #c82333;
    }

    .btn-primary:disabled, .btn-secondary:disabled, .btn-danger:disabled {
      background-color: #bdc3c7;
      cursor: not-allowed;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 4px;
      border-radius: 4px;
    }

    .close-btn:hover {
      background: #f0f0f0;
    }

    .modal-form {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #333;
    }

    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      outline: none;
      border-color: #3498db;
    }

    .form-group input.error, .form-group select.error, .form-group textarea.error {
      border-color: #dc3545;
    }

    .error-message {
      color: #dc3545;
      font-size: 12px;
      margin-top: 4px;
    }

    .permissions-selector {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
    }

    .permission-group {
      margin-bottom: 20px;
    }

    .permission-group h5 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 14px;
      font-weight: 600;
    }

    .permission-checkboxes {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13px;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      margin-top: 2px;
      flex-shrink: 0;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }

    @media (max-width: 768px) {
      .roles-grid {
        grid-template-columns: 1fr;
      }

      .permissions-list {
        grid-template-columns: 1fr;
      }

      .menu-preview {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
      }
    }
  `]
})
export class RbacManagementComponent implements OnInit {
  // Signals
  activeTab = signal<'roles' | 'permissions' | 'menu'>('roles');
  isLoading = signal(false);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  roles = signal<Role[]>([]);
  permissions = signal<Permission[]>([]);
  groupedPermissions = signal<{ [module: string]: Permission[] }>({});
  availableModules = computed(() => Object.keys(this.groupedPermissions()));
  menuPreview = signal<any[]>([]);

  showRoleModal = signal(false);
  editingRole = signal<Role | null>(null);

  // Form properties
  roleForm!: FormGroup;
  selectedPermissions = new Set<string>();
  selectedModule = '';
  selectedRoleForPreview = '';

  // Static data
  tabs = [
    { id: 'roles' as const, label: 'Roles', icon: 'groups' },
    { id: 'permissions' as const, label: 'Permissions', icon: 'security' },
    { id: 'menu' as const, label: 'Menu Preview', icon: 'menu' }
  ];

  hierarchyLevels = [
    { value: 2, label: 'Admin', description: 'Full tenant administration' },
    { value: 3, label: 'Manager', description: 'Branch and department management' },
    { value: 4, label: 'Officer', description: 'Operational staff with specific duties' },
    { value: 5, label: 'Staff', description: 'Basic operational access' }
  ];

  constructor(
    private fb: FormBuilder,
    private rbacService: RbacService
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadInitialData();
  }

  private initializeForm() {
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      level: [null, Validators.required]
    });
  }

  private loadInitialData() {
    this.loadRoles();
    this.loadPermissions();
  }

  private loadRoles() {
    this.isLoading.set(true);
    this.rbacService.getRoles().subscribe({
      next: (response) => {
        if (response.success) {
          this.roles.set(response.data.roles);
          this.showMessage('Roles loaded successfully', 'success');
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.showMessage('Failed to load roles', 'error');
        this.isLoading.set(false);
      }
    });
  }

  private loadPermissions() {
    this.rbacService.getPermissions().subscribe({
      next: (response) => {
        if (response.success) {
          this.permissions.set(response.data.permissions);
          this.groupPermissionsByModule(response.data.permissions);
        }
      },
      error: (error) => {
        console.error('Error loading permissions:', error);
      }
    });
  }

  private groupPermissionsByModule(permissions: Permission[]) {
    const grouped = permissions.reduce((acc, permission) => {
      const module = permission.module || 'other';
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    }, {} as { [module: string]: Permission[] });

    this.groupedPermissions.set(grouped);
  }

  setActiveTab(tab: 'roles' | 'permissions' | 'menu') {
    this.activeTab.set(tab);
  }

  filterPermissionsByModule() {
    if (this.selectedModule) {
      const filtered = this.permissions().filter(p => p.module === this.selectedModule);
      this.groupPermissionsByModule(filtered);
    } else {
      this.groupPermissionsByModule(this.permissions());
    }
  }

  getModuleIcon(module: string): string {
    const iconMap: { [key: string]: string } = {
      'dashboard': 'dashboard',
      'customers': 'people',
      'loans': 'account_balance',
      'collections': 'payment',
      'payments': 'receipt',
      'reports': 'analytics',
      'accounting': 'account_balance_wallet',
      'users': 'person',
      'branches': 'business',
      'tenant': 'domain',
      'system': 'settings'
    };
    return iconMap[module] || 'help';
  }

  canModifyRole(role: Role): boolean {
    return this.rbacService.canModifyRole(role);
  }

  openCreateRoleModal() {
    this.editingRole.set(null);
    this.roleForm.reset();
    this.selectedPermissions.clear();
    this.showRoleModal.set(true);
  }

  editRole(role: Role) {
    this.editingRole.set(role);
    this.roleForm.patchValue({
      name: role.name,
      description: role.description,
      level: role.level
    });

    // Load role permissions and populate checkboxes
    if (role.permissions) {
      this.selectedPermissions.clear();
      role.permissions.forEach(p => this.selectedPermissions.add(p.id));
    }

    this.showRoleModal.set(true);
  }

  closeRoleModal() {
    this.showRoleModal.set(false);
    this.editingRole.set(null);
    this.roleForm.reset();
    this.selectedPermissions.clear();
  }

  onPermissionToggle(event: any, permissionId: string) {
    if (event.target.checked) {
      this.selectedPermissions.add(permissionId);
    } else {
      this.selectedPermissions.delete(permissionId);
    }
  }

  submitRole() {
    if (!this.roleForm.valid) {
      this.showMessage('Please fill in all required fields', 'error');
      return;
    }

    const roleData: CreateCustomRoleDto = {
      ...this.roleForm.value,
      permissionIds: Array.from(this.selectedPermissions)
    };

    this.isLoading.set(true);

    if (this.editingRole()) {
      // Update existing role permissions
      const roleId = this.editingRole()!.id;
      this.rbacService.updateRolePermissions(roleId, roleData.permissionIds).subscribe({
        next: (response) => {
          if (response.success) {
            this.showMessage('Role updated successfully', 'success');
            this.closeRoleModal();
            this.loadRoles();
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error updating role:', error);
          this.showMessage('Failed to update role', 'error');
          this.isLoading.set(false);
        }
      });
    } else {
      // Create new role
      this.rbacService.createCustomRole(roleData).subscribe({
        next: (response) => {
          if (response.success) {
            this.showMessage('Custom role created successfully', 'success');
            this.closeRoleModal();
            this.loadRoles();
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error creating role:', error);
          this.showMessage('Failed to create role', 'error');
          this.isLoading.set(false);
        }
      });
    }
  }

  viewRolePermissions(role: Role) {
    if (role.permissions && role.permissions.length > 0) {
      const permissionList = role.permissions.map(p => p.key).join('\n');
      alert(`${role.name} Permissions:\n\n${permissionList}`);
    } else {
      this.rbacService.getRolePermissions(role.id).subscribe({
        next: (response) => {
          if (response.success) {
            const permissionList = response.data.permissions.map(p => p.key).join('\n');
            alert(`${role.name} Permissions:\n\n${permissionList}`);
          }
        },
        error: (error) => {
          console.error('Error loading role permissions:', error);
          this.showMessage('Failed to load role permissions', 'error');
        }
      });
    }
  }

  deleteRole(role: Role) {
    if (confirm(`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`)) {
      this.isLoading.set(true);
      this.rbacService.deleteCustomRole(role.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.showMessage('Role deleted successfully', 'success');
            this.loadRoles();
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error deleting role:', error);
          this.showMessage('Failed to delete role', 'error');
          this.isLoading.set(false);
        }
      });
    }
  }

  loadMenuPreview() {
    if (!this.selectedRoleForPreview) {
      this.menuPreview.set([]);
      return;
    }

    this.rbacService.getUserMenu().subscribe({
      next: (response) => {
        if (response.success) {
          this.menuPreview.set(response.data.menu);
        }
      },
      error: (error) => {
        console.error('Error loading menu preview:', error);
        this.showMessage('Failed to load menu preview', 'error');
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.roleForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private showMessage(message: string, type: 'success' | 'error') {
    this.message.set(message);
    this.messageType.set(type);

    setTimeout(() => {
      this.message.set('');
    }, 5000);
  }
}
