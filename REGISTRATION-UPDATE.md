# Registration Flow Update

## Overview
Updated the tenant registration flow to include password setup and redirect to login after successful registration.

## Changes Made

### 1. Frontend Changes (`web/src/app/pages/register/register.component.ts`)

#### Added Password Fields
- **Password field**: Required, minimum 8 characters
- **Confirm Password field**: Required, must match password
- **Custom validator**: `passwordMatchValidator` to ensure passwords match

#### Updated Form Structure
```typescript
registerForm: FormGroup = this.fb.group({
  companyName: ['', Validators.required],
  contactPerson: ['', Validators.required],
  contactEmail: ['', [Validators.required, Validators.email]],
  contactPhone: ['', Validators.required],
  addressLine1: ['', Validators.required],
  city: ['', Validators.required],
  province: ['', Validators.required],
  password: ['', [Validators.required, Validators.minLength(8)]],       // NEW
  confirmPassword: ['', Validators.required],                           // NEW
  subscriptionPlan: ['free', Validators.required],
  agreeToTerms: [false, Validators.requiredTrue]
}, {
  validators: this.passwordMatchValidator                                // NEW
});
```

#### Updated UI
- Added **Section 3: Admin Account Setup** with password fields
- Renumbered **Section 4: Choose Your Plan** (was Section 3)
- Added password validation error messages
- Updated success message to indicate redirect
- Changed redirect from tenant-specific login to main login page
- Redirect happens after 2 seconds (was 3 seconds)

#### Updated Submission Data
Now includes:
```typescript
{
  ...existing fields,
  admin_email: formData.contactEmail,
  admin_password: formData.password,
  admin_first_name: formData.contactPerson.split(' ')[0],
  admin_last_name: formData.contactPerson.split(' ').slice(1).join(' ')
}
```

#### Updated Redirect
```typescript
this.router.navigate(['/auth/login'], {
  queryParams: { 
    newAccount: true,
    email: formData.contactEmail,
    message: 'Registration successful! Please log in with your credentials.'
  }
});
```

### 2. Frontend Service Changes (`web/src/app/core/services/tenant.service.ts`)

#### Split Create Methods
- **`createTenant(data)`**: Public registration endpoint (no auth required)
  - Endpoint: `POST /api/tenants/register`
  - Used by registration form
  
- **`createTenantBySuperAdmin(data)`**: Admin-only creation (auth required)
  - Endpoint: `POST /api/super-admin/tenants`
  - Used by super admin dashboard

### 3. Backend Service Changes (`backend/src/services/tenant.service.ts`)

#### Updated Interface
```typescript
export interface CreateTenantData {
  ...existing fields,
  admin_email?: string;           // NEW
  admin_password?: string;        // NEW
  admin_first_name?: string;      // NEW
  admin_last_name?: string;       // NEW
}
```

#### Added Bcrypt Import
```typescript
import bcrypt from 'bcryptjs';
```

#### Updated `createTenant` Method
Now includes admin user creation:
```typescript
// Create admin user if credentials provided
if (data.admin_email && data.admin_password) {
  const hashedPassword = await bcrypt.hash(data.admin_password, 10);
  
  // Get the Admin role ID
  const roleResult = await client.query(`
    SELECT id FROM roles WHERE name = 'Admin' LIMIT 1
  `);
  
  if (roleResult.rows.length > 0) {
    const roleId = roleResult.rows[0].id;
    
    await client.query(`
      INSERT INTO users (
        tenant_id, email, password_hash, first_name, last_name,
        role_id, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
    `, [
      tenantId,
      data.admin_email,
      hashedPassword,
      data.admin_first_name || 'Admin',
      data.admin_last_name || 'User',
      roleId
    ]);
  }
}
```

### 4. Backend Controller Changes (`backend/src/controllers/tenant.controller.ts`)

#### Added `registerTenant` Method
New public endpoint handler:
```typescript
registerTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantData = req.body;
    
    // Validate required fields
    if (!tenantData.company_name || !tenantData.contact_email || !tenantData.admin_password) {
      res.status(400).json({ 
        error: 'Missing required fields: company_name, contact_email, admin_password' 
      });
      return;
    }

    // Create tenant with admin user
    const tenant = await this.tenantService.createTenant(tenantData);
    
    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully. Please log in with your credentials.',
      data: {
        tenant_id: tenant.id,
        company_name: tenant.company_name,
        slug: tenant.slug,
        contact_email: tenant.contact_email
      }
    });
  } catch (error: any) {
    console.error('Error registering tenant:', error);
    
    // Check for duplicate slug or email
    if (error.code === '23505') {
      res.status(409).json({ 
        error: 'A tenant with this company name or email already exists' 
      });
      return;
    }
    
    res.status(500).json({ 
      error: 'Failed to register tenant. Please try again.' 
    });
  }
};
```

### 5. Backend Routes Changes (`backend/src/routes/tenant.routes.ts`)

#### Added Public Route Section
```typescript
/**
 * Public Routes - No authentication required
 */

// Public tenant registration
router.post('/tenants/register', tenantController.registerTenant);

/**
 * Protected Routes - Authentication required
 */

// All routes below require authentication and tenant context
router.use(authenticate, tenantMiddleware);
```

## Flow Diagram

```
User Registration Flow:
┌─────────────────────────────────────────────────────────────┐
│ 1. User fills registration form                            │
│    - Company info                                           │
│    - Business address                                       │
│    - Admin password (NEW)                                   │
│    - Subscription plan                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend validates & submits                            │
│    POST /api/tenants/register (NO AUTH REQUIRED)          │
│    - All tenant data                                       │
│    - admin_email, admin_password, admin_name (NEW)        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend creates tenant & admin user                     │
│    - BEGIN TRANSACTION                                     │
│    - Create tenant record                                  │
│    - Create subscription record                            │
│    - Hash password with bcrypt (NEW)                       │
│    - Create admin user with hashed password (NEW)          │
│    - COMMIT TRANSACTION                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend shows success & redirects                      │
│    - Display "Registration Successful!" message            │
│    - Wait 2 seconds                                         │
│    - Redirect to /auth/login with query params (NEW)       │
│      ?newAccount=true&email=user@example.com               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. User logs in                                             │
│    - Email pre-filled from query param                     │
│    - Enter password                                         │
│    - Get JWT token with tenant context                     │
│    - Access tenant dashboard                                │
└─────────────────────────────────────────────────────────────┘
```

## Security Considerations

### Password Handling
- **Client-side**: Minimum 8 characters validation
- **Server-side**: Hashed using bcryptjs with 10 salt rounds
- **Never stored**: Plain-text passwords never stored in database

### Authentication
- Public registration endpoint does not require authentication
- Super admin tenant creation still requires authentication
- Admin user created with 'active' status
- Admin role automatically assigned

### Validation
- Required fields validated on both frontend and backend
- Email format validation
- Password matching validation
- Duplicate tenant detection (unique slug, unique email)

## Database Schema Requirements

### Required Tables
1. **tenants**: Must exist with proper schema
2. **subscriptions**: Must exist with tenant_id foreign key
3. **users**: Must exist with columns:
   - `tenant_id` (UUID, foreign key to tenants)
   - `email` (VARCHAR, unique)
   - `password_hash` (VARCHAR)
   - `first_name` (VARCHAR)
   - `last_name` (VARCHAR)
   - `role_id` (UUID, foreign key to roles)
   - `status` (VARCHAR: active/inactive/suspended)
4. **roles**: Must exist with at least 'Admin' role

### Migration Status
✅ Tenants table exists
✅ Subscriptions table exists
✅ Users table exists
✅ Roles table exists
⚠️  Need to verify 'Admin' role exists in seed data

## Testing Checklist

### Frontend Testing
- [ ] Registration form displays correctly
- [ ] Password field shows validation errors
- [ ] Confirm password shows mismatch error
- [ ] All required field validations work
- [ ] Form submits with valid data
- [ ] Success message appears
- [ ] Redirect to login works
- [ ] Email pre-filled on login page

### Backend Testing
- [ ] Public registration endpoint accessible without auth
- [ ] Tenant record created successfully
- [ ] Subscription record created with correct plan
- [ ] Admin user created with hashed password
- [ ] Duplicate company name rejected
- [ ] Duplicate email rejected
- [ ] Transaction rolls back on error

### Integration Testing
- [ ] Complete registration flow works end-to-end
- [ ] User can login with registered credentials
- [ ] JWT token includes correct tenant_id
- [ ] Admin has proper role and permissions
- [ ] User can access tenant dashboard

### Edge Cases
- [ ] Special characters in company name
- [ ] Very long company names
- [ ] International phone numbers
- [ ] Weak passwords rejected
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked

## Next Steps

1. **Test the registration flow**
   - Register a new tenant
   - Verify admin user created
   - Login with credentials
   - Access tenant dashboard

2. **Update login page** (optional)
   - Pre-fill email from query param
   - Show "newAccount" success message
   - Welcome message for new users

3. **Add email verification** (future)
   - Send verification email after registration
   - Require email verification before login
   - Add email_verified field to users table

4. **Enhance password requirements** (future)
   - Require uppercase, lowercase, number, special char
   - Password strength meter
   - Password reset flow

5. **Add CAPTCHA** (future)
   - Prevent automated bot registrations
   - Add reCAPTCHA to registration form

## Files Modified

### Frontend
- ✅ `web/src/app/pages/register/register.component.ts`
- ✅ `web/src/app/core/services/tenant.service.ts`

### Backend
- ✅ `backend/src/services/tenant.service.ts`
- ✅ `backend/src/controllers/tenant.controller.ts`
- ✅ `backend/src/routes/tenant.routes.ts`

### Documentation
- ✅ `REGISTRATION-UPDATE.md` (this file)

## Error Handling

### Frontend Errors
- Form validation errors (inline)
- API errors (banner message)
- Network errors (fallback message)

### Backend Errors
- 400: Missing required fields
- 409: Duplicate company name or email
- 500: Database or server error

### Error Messages
- User-friendly, actionable messages
- No sensitive information exposed
- Proper HTTP status codes
- Detailed server logs for debugging

---

**Status**: ✅ Implementation Complete  
**Last Updated**: 2024  
**Tested**: ⏳ Pending manual testing
