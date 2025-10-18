# Multi-Tenant SaaS Implementation Guide

## 🏗️ Architecture Overview

Your ExITS Loan Management System is now designed as a **multi-tenant SaaS platform** where multiple companies can subscribe and use the system with complete data isolation.

## 📊 Database Schema

### Core Entities:

1. **Tenants** (`tenants` table)
   - Represents each subscribing company/organization
   - Contains company info, branding, contact details
   - Each tenant is completely isolated from others

2. **Subscriptions** (`subscriptions` table)
   - Tracks subscription plans and limits for each tenant
   - Plans: Free, Basic, Professional, Enterprise, Custom
   - Limits: max_users, max_customers, max_loans, max_branches, max_storage

3. **Subscription History** (`subscription_history` table)
   - Audit trail of all subscription changes
   - Tracks upgrades, downgrades, renewals, cancellations

4. **Tenant Settings** (`tenant_settings` table)
   - Custom settings per tenant
   - Allows feature customization per company

### Data Isolation:

All main tables now have a `tenant_id` column:
- `users` → Each user belongs to one tenant
- `customers` → Each customer belongs to one tenant  
- `loans` → Each loan belongs to one tenant
- `payments` → Each payment belongs to one tenant
- `organizational_units` (branches) → Each branch belongs to one tenant
- `loan_products` → Each product belongs to one tenant

## 🔒 Security & Isolation

### Row-Level Security:
Every query is automatically filtered by `tenant_id`:

```sql
-- Example: Users can only see their tenant's customers
SELECT * FROM customers WHERE tenant_id = 't0000000-0000-0000-0000-000000000001';
```

### Middleware Implementation:

1. **Tenant Context Middleware** (`tenant.middleware.ts`)
   - Extracts tenant_id from authenticated user
   - Attaches it to every request
   - Ensures all queries are scoped to that tenant

2. **Subscription Limits Middleware** (`subscription.service.ts`)
   - Checks if tenant can create more resources
   - Enforces plan limits before operations
   - Returns friendly error messages when limits are reached

## 📦 Subscription Plans

### Recommended Plan Structure:

```typescript
const PLANS = {
  free: {
    name: 'Free Trial',
    price: 0,
    max_users: 3,
    max_customers: 50,
    max_loans: 20,
    max_branches: 1,
    max_storage_gb: 1,
    features: ['basic_reporting', 'email_support']
  },
  basic: {
    name: 'Basic',
    price: 2999, // PHP per month
    max_users: 10,
    max_customers: 500,
    max_loans: 200,
    max_branches: 3,
    max_storage_gb: 10,
    features: ['basic_reporting', 'email_support', 'sms_notifications']
  },
  professional: {
    name: 'Professional',
    price: 7999, // PHP per month
    max_users: 50,
    max_customers: 2000,
    max_loans: 1000,
    max_branches: 10,
    max_storage_gb: 50,
    features: ['advanced_reporting', 'priority_support', 'sms_notifications', 'api_access']
  },
  enterprise: {
    name: 'Enterprise',
    price: 19999, // PHP per month
    max_users: null, // Unlimited
    max_customers: null,
    max_loans: null,
    max_branches: null,
    max_storage_gb: 500,
    features: ['all_features', 'dedicated_support', '24/7_support', 'custom_integration', 'white_label']
  }
};
```

## 🚀 Implementation Steps

### Step 1: Run Migrations

```bash
cd backend
npm run migrate up
```

This will create:
- `tenants` table
- `subscriptions` table
- `subscription_history` table
- `tenant_settings` table
- Add `tenant_id` to all existing tables
- Create default system tenant

### Step 2: Update Backend Services

Each service needs to:
1. Filter all queries by `req.tenantId`
2. Include subscription limit checks

Example in `customer.service.ts`:

```typescript
// Before creating a customer
await SubscriptionService.checkCustomerLimit(tenantId);

// All queries filtered by tenant
const result = await pool.query(
  'SELECT * FROM customers WHERE tenant_id = $1 AND id = $2',
  [tenantId, customerId]
);
```

### Step 3: Update Controllers

Add tenant context to all operations:

```typescript
export const createCustomer = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const tenantId = req.tenantId; // From middleware
  
  // Check subscription limits
  await SubscriptionService.checkCustomerLimit(tenantId);
  
  // Create customer with tenant_id
  const customer = await customerService.create({
    ...req.body,
    tenant_id: tenantId
  });
  
  res.json({ success: true, data: customer });
};
```

### Step 4: Create Tenant Management UI

Create admin interface for:
- **Tenant Registration** - Onboarding new companies
- **Subscription Management** - View/upgrade/downgrade plans
- **Usage Metrics** - Show current usage vs limits
- **Billing** - Payment history and invoices

### Step 5: Add Registration Flow

```typescript
// New tenant signup process:
1. User fills registration form
2. Create tenant record
3. Create subscription (start with trial)
4. Create first user (admin)
5. Send welcome email with login details
```

## 💰 Monetization Strategy

### Revenue Streams:

1. **Subscription Fees**
   - Monthly/Yearly recurring revenue
   - Different plan tiers

2. **Usage-Based Billing** (Optional)
   - Extra storage beyond plan limit
   - Additional SMS notifications
   - Extra API calls

3. **Professional Services**
   - Custom integrations
   - Data migration
   - Training and onboarding

4. **White Label** (Enterprise)
   - Custom branding
   - Custom domain
   - Premium pricing

## 📈 Scaling Considerations

### Database Optimization:
- Add indexes on `tenant_id` columns (already done)
- Consider partitioning by tenant for very large deployments
- Use connection pooling (already implemented)

### Caching:
- Cache subscription limits per tenant
- Cache tenant settings
- Use Redis for session management

### Performance:
- Each query is filtered by tenant_id (indexed)
- Prevents accidental cross-tenant data access
- Maintains query performance

## 🔐 Security Best Practices

1. **Never trust client-side tenant_id**
   - Always get it from authenticated user
   - Middleware enforces this

2. **Test data isolation**
   - Create test tenants
   - Verify they can't see each other's data

3. **Audit logging**
   - Log all tenant access
   - Track subscription changes

4. **Backup strategy**
   - Per-tenant backups
   - Point-in-time recovery

## 📋 Next Steps

1. ✅ Run migrations to create multi-tenant schema
2. ⬜ Update all backend services to filter by tenant_id
3. ⬜ Add subscription limit checks to create operations
4. ⬜ Create tenant registration UI
5. ⬜ Create subscription management UI
6. ⬜ Add billing/payment integration (Stripe, PayMongo, etc.)
7. ⬜ Create marketing website
8. ⬜ Set up customer onboarding flow
9. ⬜ Add analytics dashboard for tenants
10. ⬜ Implement white-label customization

## 🎯 Business Model Example

### Target Customers:
- Microfinance institutions
- Lending companies
- Credit cooperatives
- Rural banks
- Online lending platforms

### Pricing (Philippines Market):
- **Free Trial**: 14-30 days, no credit card required
- **Basic**: ₱2,999/month (~50 customers)
- **Professional**: ₱7,999/month (~2,000 customers)
- **Enterprise**: ₱19,999+/month (unlimited, custom pricing)

### Customer Acquisition:
- Online marketing (Google Ads, Facebook)
- Partnership with banking associations
- Trade shows and conferences
- Referral program (give 1 month free for referrals)

## 📞 Support Model

- **Free/Basic**: Email support (24-48 hours response)
- **Professional**: Priority email + phone support (8 hours response)
- **Enterprise**: Dedicated account manager + 24/7 support

---

## Example Tenant Creation

```sql
-- Create a new tenant (e.g., "ABC Lending Corp")
INSERT INTO tenants (
  tenant_code, company_name, contact_person, 
  contact_email, contact_phone, address_line1, 
  city, province
) VALUES (
  'ABC-LENDING', 'ABC Lending Corporation', 'Juan Dela Cruz',
  'admin@abclending.com', '+63 917 123 4567', '456 Business Ave',
  'Makati', 'Metro Manila'
) RETURNING id;

-- Create their subscription (Professional plan)
INSERT INTO subscriptions (
  tenant_id, plan, status, max_users, max_customers,
  max_loans, billing_cycle, amount, starts_at
) VALUES (
  '<tenant_id_from_above>', 'professional', 'trial',
  50, 2000, 1000, 'monthly', 7999.00, NOW()
);
```

This tenant is now completely isolated and can start using the system!
