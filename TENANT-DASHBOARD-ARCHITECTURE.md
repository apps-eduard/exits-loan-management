# Tenant Dashboard Architecture

## 🎯 Overview

This system implements a **multi-tenant SaaS architecture** where:
- Each tenant has **completely isolated data** (own customers, loans, users, etc.)
- **Super Admin** can manage all tenants from a master dashboard
- **Tenant Admins** can only see and manage their own tenant's data
- **Standardized UI design** ensures consistent experience across all tenants
- **White-label customization** allows tenant-specific branding

---

## 🏗️ Architecture Design

### 1. User Roles & Access Levels

```
┌─────────────────────────────────────────────────────────────┐
│                     SUPER ADMIN LEVEL                        │
│  - Can access ALL tenants                                    │
│  - Manage tenant subscriptions                               │
│  - View cross-tenant analytics                               │
│  - System configuration                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    TENANT ADMIN LEVEL                        │
│  - Limited to SINGLE tenant (tenantId in JWT)               │
│  - Manage tenant users, roles, settings                      │
│  - Access all features within tenant scope                   │
│  - Cannot see other tenants' data                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   TENANT STAFF LEVEL                         │
│  - Branch Managers, Loan Officers, etc.                     │
│  - Limited to assigned organizational units                  │
│  - Cannot manage users or system settings                    │
└─────────────────────────────────────────────────────────────┘
```

### 2. Database Structure

**Key Tables:**

```sql
-- Tenants table (company/organization)
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,  -- e.g., 'acme-finance'
  
  -- Branding (white-label customization)
  logo_url TEXT,
  primary_color VARCHAR(7),           -- #FF5733
  secondary_color VARCHAR(7),         -- #33C3FF
  
  -- Contact & billing
  contact_email VARCHAR(255),
  billing_email VARCHAR(255),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- All business tables have tenant_id
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role_id UUID REFERENCES roles(id),
  is_super_admin BOOLEAN DEFAULT FALSE,  -- Can access all tenants
  -- ... other fields
);

CREATE TABLE customers (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  -- ... customer fields
);

-- Indexes for performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
```

### 3. JWT Token Structure

**Standard User Token:**
```json
{
  "userId": "uuid",
  "email": "admin@acmefinance.com",
  "roleId": "uuid",
  "roleName": "Tenant Admin",
  "organizationalUnitId": "uuid",
  "tenantId": "tenant-uuid-here",     // ← Locked to single tenant
  "isSuperAdmin": false
}
```

**Super Admin Token:**
```json
{
  "userId": "uuid",
  "email": "superadmin@exits.com",
  "roleId": "uuid",
  "roleName": "Super Admin",
  "organizationalUnitId": "uuid",
  "tenantId": "system-tenant-uuid",
  "isSuperAdmin": true                 // ← Can access all tenants
}
```

---

## 🎨 Frontend Architecture (Web Admin)

### Dashboard Routes

```typescript
// app.routes.ts
export const routes: Routes = [
  // Public routes
  { path: 'login', component: LoginComponent },
  
  // Super Admin routes (protected)
  {
    path: 'super-admin',
    canActivate: [AuthGuard, SuperAdminGuard],
    children: [
      { path: 'dashboard', component: SuperAdminDashboardComponent },
      { path: 'tenants', component: TenantsListComponent },
      { path: 'tenants/create', component: TenantFormComponent },
      { path: 'tenants/:id', component: TenantDetailsComponent },
      { path: 'subscriptions', component: SubscriptionsComponent },
      { path: 'analytics', component: CrossTenantAnalyticsComponent },
      { path: 'system-settings', component: SystemSettingsComponent },
    ]
  },
  
  // Tenant Admin routes (standard for all tenants)
  {
    path: 'admin',
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: TenantDashboardComponent },
      { path: 'customers', component: CustomersListComponent },
      { path: 'loans', component: LoansListComponent },
      { path: 'payments', component: PaymentsListComponent },
      { path: 'users', component: UsersListComponent },
      { path: 'settings', component: TenantSettingsComponent },
      { path: 'reports', component: ReportsComponent },
    ]
  },
  
  // Redirect based on role
  { path: '', redirectTo: '/admin/dashboard', pathMatch: 'full' },
];
```

### Standardized Component Library

All tenant dashboards use the **same components** but with tenant-specific data:

```
web/src/app/
├── shared/
│   ├── components/
│   │   ├── data-table/              # Reusable table component
│   │   ├── stat-card/               # Dashboard stat cards
│   │   ├── chart-widget/            # Analytics charts
│   │   ├── form-dialog/             # Modal forms
│   │   └── tenant-header/           # Shows current tenant info
│   ├── services/
│   │   ├── tenant.service.ts        # Tenant context management
│   │   └── theme.service.ts         # White-label theming
│   └── guards/
│       ├── auth.guard.ts
│       ├── super-admin.guard.ts     # Only for super admins
│       └── tenant.guard.ts          # Ensures user has tenant access
│
├── pages/
│   ├── super-admin/                 # Super Admin exclusive
│   │   ├── super-admin-dashboard/
│   │   ├── tenants-list/
│   │   ├── tenant-form/
│   │   └── cross-tenant-analytics/
│   │
│   └── tenant-admin/                # Standard for ALL tenants
│       ├── dashboard/               # Same design, filtered by tenantId
│       ├── customers/               # Same design, filtered by tenantId
│       ├── loans/                   # Same design, filtered by tenantId
│       ├── payments/                # Same design, filtered by tenantId
│       ├── users/                   # Same design, filtered by tenantId
│       └── settings/                # Tenant-specific settings
```

---

## 🔐 Backend Middleware & Services

### 1. Tenant Context Middleware

```typescript
// middleware/tenant.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export interface TenantRequest extends AuthenticatedRequest {
  tenantId: string;
  isSuperAdmin: boolean;
}

export const tenantMiddleware = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Extract tenant context from JWT
  req.tenantId = req.user.tenantId;
  req.isSuperAdmin = req.user.isSuperAdmin || false;

  next();
};
```

### 2. Tenant-Aware Service Pattern

**Example: Customer Service with Tenant Isolation**

```typescript
// services/customer.service.ts
export class CustomerService {
  // Standard method: filtered by tenant
  async getAllCustomers(tenantId: string): Promise<Customer[]> {
    const result = await pool.query(
      `SELECT * FROM customers 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC`,
      [tenantId]
    );
    return result.rows.map(this.mapRowToCustomer);
  }

  // Super Admin method: can access all tenants
  async getAllCustomersForAllTenants(): Promise<Customer[]> {
    const result = await pool.query(
      `SELECT c.*, t.name as tenant_name 
       FROM customers c
       INNER JOIN tenants t ON c.tenant_id = t.id
       ORDER BY c.created_at DESC`
    );
    return result.rows.map(this.mapRowToCustomer);
  }

  // Create: automatically scoped to tenant
  async createCustomer(tenantId: string, data: CreateCustomerData): Promise<Customer> {
    const result = await pool.query(
      `INSERT INTO customers (
        id, tenant_id, customer_code, first_name, last_name, ...
      ) VALUES ($1, $2, $3, $4, $5, ...)
      RETURNING *`,
      [uuid(), tenantId, data.customerCode, data.firstName, data.lastName, ...]
    );
    return this.mapRowToCustomer(result.rows[0]);
  }
}
```

### 3. Controller Pattern

```typescript
// controllers/customer.controller.ts
export class CustomerController {
  private customerService = new CustomerService();

  // Tenant-scoped endpoint
  getAllCustomers = async (req: TenantRequest, res: Response) => {
    try {
      // Automatically use tenantId from JWT
      const customers = await this.customerService.getAllCustomers(req.tenantId);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch customers' });
    }
  };

  // Super Admin endpoint (optional)
  getAllCustomersAllTenants = async (req: TenantRequest, res: Response) => {
    try {
      // Check if user is super admin
      if (!req.isSuperAdmin) {
        return res.status(403).json({ message: 'Super Admin access required' });
      }

      const customers = await this.customerService.getAllCustomersForAllTenants();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch customers' });
    }
  };

  createCustomer = async (req: TenantRequest, res: Response) => {
    try {
      // Tenant ID from JWT ensures data isolation
      const customer = await this.customerService.createCustomer(
        req.tenantId,
        req.body
      );
      res.status(201).json(customer);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create customer' });
    }
  };
}
```

---

## 🎨 Standardized UI Design

### Design System (All Tenants Use Same Components)

```typescript
// shared/components/stat-card/stat-card.component.ts
@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ label }}</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {{ value }}
          </p>
          @if (change) {
            <p class="text-sm mt-1" 
               [class.text-green-600]="changeType === 'positive'"
               [class.text-red-600]="changeType === 'negative'">
              {{ change }}
            </p>
          }
        </div>
        <div [style.color]="iconColor" class="text-4xl">
          {{ icon }}
        </div>
      </div>
    </div>
  `
})
export class StatCardComponent {
  @Input() label!: string;
  @Input() value!: string | number;
  @Input() icon!: string;
  @Input() iconColor: string = '#3B82F6';
  @Input() change?: string;
  @Input() changeType?: 'positive' | 'negative';
}
```

### Tenant Dashboard (Standardized Layout)

```typescript
// pages/tenant-admin/dashboard/dashboard.component.ts
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, StatCardComponent, ChartWidgetComponent],
  template: `
    <!-- Tenant Header -->
    <app-tenant-header [tenant]="currentTenant()" />

    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Dashboard Overview
      </h1>

      <!-- Stats Grid (Same for ALL tenants) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <app-stat-card
          label="Total Customers"
          [value]="stats().totalCustomers"
          icon="👥"
          iconColor="#3B82F6"
          [change]="stats().customersChange"
          changeType="positive"
        />
        <app-stat-card
          label="Active Loans"
          [value]="stats().activeLoans"
          icon="💰"
          iconColor="#10B981"
          [change]="stats().loansChange"
          changeType="positive"
        />
        <app-stat-card
          label="Total Disbursed"
          [value]="stats().totalDisbursed | currency:'PHP'"
          icon="📊"
          iconColor="#F59E0B"
        />
        <app-stat-card
          label="Collection Rate"
          [value]="stats().collectionRate + '%'"
          icon="✅"
          iconColor="#8B5CF6"
          [change]="stats().collectionChange"
          changeType="positive"
        />
      </div>

      <!-- Charts (Same for ALL tenants) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <app-chart-widget
          title="Loan Disbursements"
          [data]="disbursementData()"
          type="line"
        />
        <app-chart-widget
          title="Collections"
          [data]="collectionData()"
          type="bar"
        />
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private tenantService = inject(TenantService);

  currentTenant = signal<Tenant | null>(null);
  stats = signal<DashboardStats>({
    totalCustomers: 0,
    activeLoans: 0,
    totalDisbursed: 0,
    collectionRate: 0,
    customersChange: '',
    loansChange: '',
    collectionChange: ''
  });

  ngOnInit() {
    // Get current tenant from JWT token
    this.currentTenant.set(this.tenantService.getCurrentTenant());
    
    // Load dashboard data (automatically filtered by tenantId in backend)
    this.loadDashboardStats();
  }

  async loadDashboardStats() {
    try {
      const data = await this.dashboardService.getDashboardStats();
      this.stats.set(data);
    } catch (error) {
      console.error('Failed to load dashboard stats', error);
    }
  }
}
```

---

## 🎨 White-Label Customization (Optional Enhancement)

### Tenant-Specific Branding

```typescript
// services/theme.service.ts
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private tenantService = inject(TenantService);

  applyTenantTheme() {
    const tenant = this.tenantService.getCurrentTenant();
    
    if (tenant?.primaryColor) {
      document.documentElement.style.setProperty(
        '--primary-color', 
        tenant.primaryColor
      );
    }
    
    if (tenant?.secondaryColor) {
      document.documentElement.style.setProperty(
        '--secondary-color', 
        tenant.secondaryColor
      );
    }
    
    if (tenant?.logoUrl) {
      // Use tenant's logo instead of default
      this.updateLogo(tenant.logoUrl);
    }
  }
}
```

### Tenant Header Component

```typescript
// shared/components/tenant-header/tenant-header.component.ts
@Component({
  selector: 'app-tenant-header',
  standalone: true,
  template: `
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          @if (tenant?.logoUrl) {
            <img [src]="tenant.logoUrl" alt="Logo" class="h-10 w-auto" />
          }
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ tenant?.name }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ tenant?.slug }}
            </p>
          </div>
        </div>
        
        <div class="flex items-center space-x-3">
          <!-- Subscription Badge -->
          <span class="px-3 py-1 text-xs font-medium rounded-full"
                [class]="getSubscriptionBadgeClass()">
            {{ tenant?.subscriptionPlan | uppercase }}
          </span>
        </div>
      </div>
    </div>
  `
})
export class TenantHeaderComponent {
  @Input() tenant!: Tenant | null;

  getSubscriptionBadgeClass(): string {
    switch (this.tenant?.subscriptionPlan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
```

---

## 🚀 Implementation Steps

### Phase 1: Database Updates (DONE ✅)
- [x] Multi-tenant schema created
- [x] Migration files ready
- [x] Default tenant seeded

### Phase 2: Backend API Updates
- [ ] Add `is_super_admin` column to users table
- [ ] Update all service methods to filter by `tenant_id`
- [ ] Create Super Admin service methods (cross-tenant access)
- [ ] Update authentication to include `isSuperAdmin` in JWT
- [ ] Apply tenant middleware to all routes

### Phase 3: Frontend Guards & Services
- [ ] Create `SuperAdminGuard`
- [ ] Create `TenantService` (manages current tenant context)
- [ ] Create `ThemeService` (white-label customization)
- [ ] Update `AuthService` to handle super admin flag

### Phase 4: Super Admin Dashboard
- [ ] Create Super Admin layout/routes
- [ ] Build Tenants List page
- [ ] Build Tenant Form (create/edit tenant)
- [ ] Build Tenant Details page
- [ ] Build Subscriptions management
- [ ] Build Cross-Tenant Analytics

### Phase 5: Tenant Admin Dashboard (Standardized)
- [ ] Ensure all components are tenant-aware
- [ ] Update all API calls to use tenant context
- [ ] Add Tenant Header component
- [ ] Test data isolation

### Phase 6: White-Label (Optional)
- [ ] Add branding fields to tenant settings
- [ ] Implement dynamic theme application
- [ ] Add custom logo support
- [ ] Add custom domain support (advanced)

---

## 📊 Data Flow Example

### Scenario: Tenant Admin Views Customers

```
1. User logs in
   ↓
2. JWT created with tenantId: "acme-finance-uuid"
   ↓
3. User navigates to /admin/customers
   ↓
4. Frontend calls: GET /api/customers
   ↓
5. Backend middleware extracts tenantId from JWT
   ↓
6. CustomerService.getAllCustomers(tenantId)
   ↓
7. SQL: SELECT * FROM customers WHERE tenant_id = 'acme-finance-uuid'
   ↓
8. Returns ONLY customers for ACME Finance
   ↓
9. Frontend renders standardized customer list component
```

### Scenario: Super Admin Views All Tenants

```
1. Super Admin logs in
   ↓
2. JWT created with isSuperAdmin: true
   ↓
3. User navigates to /super-admin/tenants
   ↓
4. Frontend calls: GET /api/super-admin/tenants
   ↓
5. Backend checks req.isSuperAdmin === true
   ↓
6. TenantService.getAllTenants() (NO tenant filter)
   ↓
7. SQL: SELECT * FROM tenants
   ↓
8. Returns ALL tenants in system
   ↓
9. Frontend renders tenant management interface
```

---

## 🔒 Security Checklist

- [ ] **Row-Level Security**: All queries filter by `tenant_id`
- [ ] **JWT Validation**: Tenant context from token, not request params
- [ ] **Super Admin Flag**: Stored in database, included in JWT
- [ ] **API Authorization**: Check `isSuperAdmin` for cross-tenant endpoints
- [ ] **Frontend Guards**: Prevent unauthorized route access
- [ ] **Audit Logging**: Log all tenant data access
- [ ] **Subscription Limits**: Enforce limits before create operations
- [ ] **Test Isolation**: Automated tests verify data isolation

---

## 📈 Next Steps

1. **Run the multi-tenant migrations** (already created)
2. **Update backend services** to filter by tenant_id
3. **Create Super Admin role** and assign to system user
4. **Build Super Admin dashboard** UI
5. **Test tenant isolation** thoroughly
6. **Deploy and onboard first tenant**

---

**Current Status**: Database schema ready, backend auth updated, frontend implementation pending.
**Target**: Production-ready multi-tenant SaaS platform with standardized UI.
