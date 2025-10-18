export interface Role {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface OrganizationalUnit {
  id: string;
  name: string;
  code: string;
  type: 'region' | 'branch' | 'department';
  parentId?: string;
  description?: string;
}

export interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roleId: string;
  role: Role;
  organizationalUnitId: string;
  organizationalUnit: OrganizationalUnit;
  status: 'active' | 'inactive' | 'invited' | 'suspended';
  permissions: Permission[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roleId: string;
  organizationalUnitId: string;
  password: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roleId?: string;
  organizationalUnitId?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  organizationalUnitName: string;
  status: 'active' | 'inactive' | 'invited' | 'suspended';
  lastLoginAt?: string;
  createdAt: string;
}

export interface UserFilters {
  search?: string;
  roleId?: string;
  organizationalUnitId?: string;
  status?: string;
  page?: number;
  limit?: number;
}
