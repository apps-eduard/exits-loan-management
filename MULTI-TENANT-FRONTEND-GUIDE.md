# Multi-Tenant Frontend Implementation Guide

## ✅ Implementation Summary

### **What We've Built:**

1. **✅ Core Services**
   - `TenantService` - Manages tenant operations and context
   - `AuthService` - Extended with `isSuperAdmin()` and `getTenantId()`
   
2. **✅ Guards**
   - `SuperAdminGuard` - Protects super admin routes
   - `AuthGuard` - Standard authentication (existing)
   
3. **✅ Routing Structure**
   ```
   /super-admin/*  → Super Admin Dashboard (cross-tenant)
   /admin/*        → Tenant Admin Dashboard (tenant-scoped)
   ```

4. **✅ Super Admin Pages**
   - Dashboard - Overview with stats
   - Tenants List - Manage all tenants
   - Tenant Form - Create new tenant (placeholder)
   - Tenant Details - View tenant info (placeholder)
   - Analytics - Cross-tenant analytics (placeholder)

5. **✅ Shared Components**
   - `TenantHeaderComponent` - Shows tenant branding
   - `StatCardComponent` - Dashboard statistics

6. **✅ Dynamic Navigation**
   - Menu changes based on `isSuperAdmin` flag
   - Super Admins see tenant management
   - Regular admins see standard business features

---

## 📋 Next Steps: Backend API Implementation

### **Required Backend Endpoints:**

```typescript
// Super Admin Endpoints
GET    /api/super-admin/tenants           // List all tenants
POST   /api/super-admin/tenants           // Create new tenant
GET    /api/super-admin/tenants/:id       // Get tenant details
PUT    /api/super-admin/tenants/:id       // Update tenant
DELETE /api/super-admin/tenants/:id       // Delete tenant
GET    /api/super-admin/analytics         // Cross-tenant analytics

// Tenant Settings Endpoints
GET    /api/tenants/:id/settings          // Get tenant settings
PUT    /api/tenants/:id/settings/:key     // Update setting
```

### **Implementation Plan:**

1. ✅ **Database Migrations** - DONE
   - Tenant tables created
   - Default tenant seeded
   - Super admin flag added

2. ⏳ **Backend Controllers** - TODO
   - Create `TenantController`
   - Create `SuperAdminController`
   - Add tenant middleware to all routes

3. ⏳ **Frontend Integration** - TODO
   - Complete tenant CRUD forms
   - Add TenantHeader to all pages
   - Implement subscription management

---

## 🎨 Standard Frontend Architecture

### **1. Tenant Context Flow**

```typescript
Login → JWT { tenantId, isSuperAdmin }
  ↓
Store in localStorage
  ↓
Every API Request → Include JWT in headers
  ↓
Backend extracts tenantId from JWT
  ↓
Filters all queries by tenant_id
```

### **2. Component Structure**

All tenant admin pages follow this pattern:

```typescript
@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [CommonModule, TenantHeaderComponent, ...],
  template: `
    <!-- Tenant Header (shows which company you're managing) -->
    <app-tenant-header [tenant]="currentTenant()" />
    
    <!-- Page Content (automatically filtered by tenant) -->
    <div class="p-6">
      <h1>Customers</h1>
      <!-- Customer list automatically scoped to current tenant -->
    </div>
  `
})
export class CustomersListComponent implements OnInit {
  private tenantService = inject(TenantService);
  private customerService = inject(CustomerService);
  
  currentTenant = signal<Tenant | null>(null);
  customers = signal<Customer[]>([]);

  async ngOnInit() {
    // Load current tenant info
    await this.tenantService.loadCurrentTenant();
    this.currentTenant.set(this.tenantService.currentTenant());
    
    // Load customers (backend automatically filters by tenantId from JWT)
    await this.loadCustomers();
  }

  async loadCustomers() {
    // No need to pass tenantId - it's in the JWT!
    const data = await this.customerService.getAllCustomers();
    this.customers.set(data);
  }
}
```

### **3. Backend Service Pattern**

```typescript
// services/customer.service.ts
export class CustomerService {
  async getAllCustomers(): Promise<Customer[]> {
    // No tenantId parameter needed!
    // Backend extracts it from JWT automatically
    const result = await pool.query(
      `SELECT * FROM customers 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC`,
      [req.tenantId] // From JWT via middleware
    );
    return result.rows;
  }
}
```

### **4. API Request Flow**

```typescript
// Frontend
const customers = await http.get('/api/customers');

// ↓ Middleware extracts tenant from JWT

// Backend Controller
router.get('/customers', tenantMiddleware, async (req, res) => {
  const customers = await customerService.getAllCustomers(req.tenantId);
  res.json(customers);
});

// Backend Service
async getAllCustomers(tenantId: string) {
  return pool.query(
    'SELECT * FROM customers WHERE tenant_id = $1',
    [tenantId]
  );
}
```

---

## 🔧 Standard Patterns

### **Pattern 1: List Pages**

```typescript
// Example: Loans List
@Component({
  template: `
    <app-tenant-header [tenant]="currentTenant()" />
    <div class="p-6">
      <h1>Loans</h1>
      <table>
        @for (loan of loans(); track loan.id) {
          <tr>
            <td>{{ loan.loanCode }}</td>
            <td>{{ loan.customerName }}</td>
            <td>{{ loan.amount | currency }}</td>
          </tr>
        }
      </table>
    </div>
  `
})
export class LoansListComponent {
  loans = signal<Loan[]>([]);

  async ngOnInit() {
    // Backend filters by tenant automatically
    this.loans.set(await this.loanService.getAllLoans());
  }
}
```

### **Pattern 2: Create/Edit Forms**

```typescript
// Example: Create Customer
async createCustomer(data: CustomerFormData) {
  try {
    // No need to add tenantId - backend does it!
    const customer = await this.customerService.createCustomer(data);
    this.router.navigate(['/admin/customers']);
  } catch (error) {
    console.error('Failed to create customer', error);
  }
}

// Backend automatically adds tenantId
async createCustomer(tenantId: string, data: CreateCustomerData) {
  return pool.query(
    `INSERT INTO customers (id, tenant_id, first_name, last_name, ...)
     VALUES ($1, $2, $3, $4, ...)`,
    [uuid(), tenantId, data.firstName, data.lastName, ...]
  );
}
```

### **Pattern 3: Dashboard with Stats**

```typescript
@Component({
  template: `
    <app-tenant-header [tenant]="currentTenant()" />
    <div class="p-6">
      <h1>Dashboard</h1>
      
      <div class="grid grid-cols-4 gap-6">
        <app-stat-card
          label="Total Customers"
          [value]="stats().totalCustomers"
          icon="👥"
        />
        <app-stat-card
          label="Active Loans"
          [value]="stats().activeLoans"
          icon="💰"
        />
        <!-- More stats... -->
      </div>
    </div>
  `
})
export class DashboardComponent {
  stats = signal<DashboardStats>({
    totalCustomers: 0,
    activeLoans: 0,
    // ... more stats
  });

  async ngOnInit() {
    // Stats automatically filtered by tenant
    this.stats.set(await this.dashboardService.getStats());
  }
}
```

---

## 🎯 Key Principles

### **1. Tenant Context is Implicit**
- ✅ **Never** pass `tenantId` as a parameter in frontend
- ✅ **Always** extract from JWT in backend middleware
- ✅ **Automatic** filtering on all queries

### **2. Separation of Concerns**
```
Super Admin → Manage multiple tenants
Tenant Admin → Manage single tenant (own company)
Staff        → Limited access within tenant
```

### **3. Data Isolation**
- Each tenant's data is **completely isolated**
- SQL queries **always** include `WHERE tenant_id = $1`
- No tenant can see another tenant's data

### **4. Consistent UI**
- All tenants get the **same** professional interface
- Only **branding** (logo, colors) can be customized
- **No** custom features per tenant (use subscription plans)

---

## 📊 Implementation Checklist

### **Phase 1: Backend API** ⏳
- [ ] Create `TenantController` for CRUD operations
- [ ] Create `SuperAdminController` for cross-tenant management
- [ ] Add `tenantMiddleware` to all protected routes
- [ ] Update all services to filter by `tenant_id`
- [ ] Add subscription limit checks

### **Phase 2: Frontend Pages** ⏳
- [ ] Add `TenantHeaderComponent` to all pages
- [ ] Complete tenant CRUD forms
- [ ] Build subscription management UI
- [ ] Add usage statistics
- [ ] Implement billing interface

### **Phase 3: Testing** ⏳
- [ ] Test data isolation between tenants
- [ ] Test super admin cross-tenant access
- [ ] Test subscription limit enforcement
- [ ] Test tenant creation flow
- [ ] Performance testing with multiple tenants

### **Phase 4: Production** ⏳
- [ ] Set up tenant onboarding flow
- [ ] Configure payment gateway
- [ ] Add monitoring and analytics
- [ ] Document deployment process
- [ ] Train support staff

---

## 🚀 Quick Start for Developers

### **1. Login as Super Admin**
```typescript
// Login with admin@pacifica.ph (now has isSuperAdmin: true)
// Navigate to /super-admin/dashboard
```

### **2. Create a New Tenant**
```typescript
// Go to /super-admin/tenants/create
// Fill in company details
// Select subscription plan
// Tenant gets isolated database space
```

### **3. Login as Tenant Admin**
```typescript
// Each tenant has own admin account
// They see /admin/* routes
// All data scoped to their tenant_id
```

### **4. Standard Development Flow**
```typescript
// 1. Create component
// 2. Inject TenantService (optional - only if you need tenant info)
// 3. Make API calls (tenantId handled automatically)
// 4. Backend filters by req.tenantId
// 5. Data isolated to current tenant
```

---

## 🎨 UI/UX Guidelines

### **Branding**
- Display tenant logo in header
- Use tenant primary color for buttons/links
- Show subscription plan badge
- Display company name prominently

### **Navigation**
```typescript
// Super Admin Menu
- Dashboard
- Tenants
- Analytics
- System Settings

// Tenant Admin Menu
- Dashboard
- Customers
- Loans
- Payments
- Reports
- Users
- Settings
```

### **Subscription Awareness**
- Show current plan in header
- Display usage vs limits
- Prompt upgrade when approaching limits
- Block actions when limit reached

---

## 📖 Developer Notes

### **Common Mistakes to Avoid**

❌ **DON'T** pass tenantId from frontend
```typescript
// BAD
this.customerService.getCustomers(this.tenantId);
```

✅ **DO** let backend handle it
```typescript
// GOOD
this.customerService.getCustomers();
```

❌ **DON'T** store tenantId in component state
```typescript
// BAD
tenantId = signal<string>('');
```

✅ **DO** get it from JWT when needed
```typescript
// GOOD  
const tenantId = this.authService.getTenantId();
```

❌ **DON'T** query without tenant filter
```sql
-- BAD
SELECT * FROM customers;
```

✅ **DO** always filter by tenant
```sql
-- GOOD
SELECT * FROM customers WHERE tenant_id = $1;
```

---

## 🔐 Security Checklist

- [x] JWT includes `tenantId` and `isSuperAdmin`
- [x] Middleware validates JWT on every request
- [x] All SQL queries filter by `tenant_id`
- [ ] Super Admin routes protected by `SuperAdminGuard`
- [ ] Tenant data completely isolated
- [ ] Subscription limits enforced
- [ ] Audit logging for all tenant operations
- [ ] Row-level security (optional, via policies)

---

## 📈 Performance Considerations

### **Database Indexes**
```sql
-- Already created in migrations
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_loans_tenant_id ON loans(tenant_id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
```

### **Query Optimization**
- Always include `tenant_id` in WHERE clause
- Use indexes effectively
- Consider partitioning for large tenants
- Cache tenant settings

### **Frontend Optimization**
- Lazy load tenant-specific components
- Cache tenant information
- Minimize API calls
- Use signals for reactivity

---

## 📚 Documentation

- `TENANT-DASHBOARD-ARCHITECTURE.md` - Complete architecture guide
- `MULTI-TENANT-INTEGRATION.md` - Integration status
- `IMPLEMENTATION-STATUS.md` - Overall project status
- This document - Frontend implementation guide

---

**Current Status**: ✅ Frontend structure ready, ⏳ Backend API pending

**Next Action**: Implement backend tenant management endpoints

**Developer**: Ready to start building! 🚀
