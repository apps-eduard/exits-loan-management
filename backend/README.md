# Loan Management System - Backend API

A comprehensive loan management system for Philippine-focused multi-branch lending operations, supporting diverse loan products with daily, weekly, and monthly repayment plans.

## 🚀 Features Completed

### ✅ Authentication & Authorization
- JWT-based authentication with access tokens (15m) and refresh tokens (7d)
- Role-Based Access Control (RBAC) with 26 granular permissions
- Organizational Unit (OU) based data scoping
- 7 predefined roles: Super Admin, Admin, Manager, Loan Officer, Cashier, Collector, Customer

### ✅ Organizational Structure
- Hierarchical OU management (Region → Branch → Department)
- Pre-configured Head Office and Iloilo Branch
- Data isolation by organizational unit
- Super Admins can access all OUs; other roles limited to their branch

### ✅ Customer Management
- Full CRUD operations with KYC workflow
- Auto-generated customer codes (e.g., BR-ILOILO-CUST-000001)
- Philippine-specific fields (Barangay, TIN, SSS, PhilHealth, Pag-IBIG)
- Customer document management
- Risk rating and blacklist functionality
- Emergency contact information

### ✅ Loan Products
- 5 pre-configured loan products
- Support for multiple product types: Cash Loan, Mobile Phone, Vehicle, Appliance, Motorcycle, Bicycle
- Payment frequencies: Daily, Weekly, Bi-Weekly, Semi-Monthly, Monthly
- Interest types: Flat, Diminishing, Add-on
- Configurable fees: Processing, Documentary Stamp, Insurance, Penalties
- Collateral and co-maker requirements

## 📋 Pre-configured Loan Products

| Code | Name | Type | Amount Range | Term Range | Frequency | Interest Rate |
|------|------|------|--------------|------------|-----------|---------------|
| CASH-DAILY | Daily Cash Loan | Cash | ₱1,000 - ₱50,000 | 30-90 days | Daily | 5% flat |
| CASH-WEEKLY | Weekly Cash Loan | Cash | ₱5,000 - ₱100,000 | 4-52 weeks | Weekly | 4% flat |
| CASH-MONTHLY | Monthly Cash Loan | Cash | ₱10,000 - ₱500,000 | 3-36 months | Monthly | 3% diminishing |
| MOBILE-MONTHLY | Mobile Phone Loan | Mobile Phone | ₱5,000 - ₱50,000 | 6-24 months | Monthly | 2% add-on |
| MOTORCYCLE-MONTHLY | Motorcycle Loan | Motorcycle | ₱30,000 - ₱150,000 | 12-36 months | Monthly | 2.5% diminishing |

## 🛠️ Technology Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express 5
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Logging**: Pino with pretty printing
- **Validation**: Zod
- **Migrations**: node-pg-migrate

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and JWT secrets

# Run migrations
npm run migrate:up

# Build the project
npm run build

# Start the server
npm start

# Development mode with auto-reload
npm run dev
```

## 🔐 Environment Variables

```env
PORT=3000
DATABASE_URL=postgres://postgres:password@localhost:5432/pacifica
DB_SSL=false

# JWT Configuration (minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters
JWT_REFRESH_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

## 🔑 Default Admin Credentials

```
Email: admin@pacifica.ph
Password: Admin@123
Role: Super Admin
OU: Head Office
```

## 📡 API Endpoints

### Authentication

```http
POST   /api/auth/login           # Login with email/password
POST   /api/auth/refresh         # Refresh access token
POST   /api/auth/logout          # Logout (requires auth)
GET    /api/auth/profile         # Get current user profile (requires auth)
```

### Customers

```http
POST   /api/customers            # Create customer (requires customers.create)
GET    /api/customers            # List customers with filters (requires customers.read)
GET    /api/customers/:id        # Get customer by ID (requires customers.read)
PUT    /api/customers/:id        # Update customer (requires customers.update)
POST   /api/customers/:id/verify-kyc  # Verify KYC status (requires customers.update)
```

**Query Parameters for GET /api/customers:**
- `status` - Filter by customer status (active, inactive, blacklisted, deceased)
- `kycStatus` - Filter by KYC status (pending, verified, rejected, incomplete)
- `search` - Search by name, code, email, or phone
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

### Loan Products

```http
GET    /api/loan-products        # List all loan products (requires auth)
GET    /api/loan-products/:id    # Get loan product by ID (requires auth)
```

**Query Parameters for GET /api/loan-products:**
- `isActive` - Filter by active status (true/false)
- `productType` - Filter by product type (cash_loan, mobile_phone, etc.)

### Health Check

```http
GET    /api/health               # Health check with database status
```

## 🗄️ Database Schema

### Core Tables

- **organizational_units** - Hierarchical OU structure (regions, branches, departments)
- **users** - System users with role and OU assignments
- **roles** - User roles with descriptions
- **permissions** - Granular permission definitions
- **role_permissions** - Many-to-many role-permission mapping

### Customer Tables

- **customers** - Customer profiles with KYC, address, employment, government IDs
- **customer_documents** - Document attachments (IDs, proof of income, etc.)

### Loan Tables

- **loan_products** - Loan product configurations

## 🔒 Permission System

### User Management
- `users.create`, `users.read`, `users.update`, `users.delete`

### Organizational Units
- `ou.create`, `ou.read`, `ou.update`, `ou.delete`

### Customer Management
- `customers.create`, `customers.read`, `customers.update`, `customers.delete`

### Loan Management
- `loans.create`, `loans.read`, `loans.update`, `loans.approve`, `loans.disburse`, `loans.delete`

### Payment Management
- `payments.create`, `payments.read`, `payments.update`, `payments.delete`

### Reporting
- `reports.view`, `reports.export`

### System Settings
- `settings.read`, `settings.update`

## 🧪 Testing

A test file `test-api.http` is included with example requests for all endpoints. Use the REST Client extension in VS Code or any HTTP client.

```http
# Login Example
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@pacifica.ph",
  "password": "Admin@123"
}
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts       # PostgreSQL pool configuration
│   │   ├── env.ts            # Environment validation with Zod
│   │   └── logger.ts         # Pino logger setup
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── customer.controller.ts
│   │   └── loan-product.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts    # JWT authentication & RBAC
│   │   ├── error-handler.ts      # Global error handler
│   │   └── not-found.ts          # 404 handler
│   ├── migrations/
│   │   ├── 20251015160000_initial_core_schema.ts
│   │   ├── 20251015170000_seed_initial_data.ts
│   │   ├── 20251015180000_create_customers_table.ts
│   │   └── 20251015190000_create_loan_products_table.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── customer.routes.ts
│   │   ├── loan-product.routes.ts
│   │   └── index.ts              # Main router
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── customer.service.ts
│   │   └── loan-product.service.ts
│   ├── utils/
│   │   ├── generate-hash.ts      # Password hash generator
│   │   └── http-exception.ts     # Custom HTTP exception class
│   ├── app.ts                    # Express app setup
│   └── server.ts                 # Server entry point
├── .env.example
├── package.json
├── tsconfig.json
├── node-pg-migrate.config.js
└── test-api.http
```

## 📝 Migration Commands

```bash
# Run pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create new migration
npm run migrate:create migration_name
```

## 🎯 Roadmap (Upcoming Features)

### In Progress
- [ ] Loan application workflow (create, review, approve, disburse)
- [ ] Payment schedule generation (daily/weekly/monthly)
- [ ] Payment posting with allocation logic
- [ ] Reporting endpoints (portfolio, delinquency, PAR)

### Planned
- [ ] Angular admin dashboard
- [ ] Ionic customer mobile app
- [ ] Ionic collector mobile app
- [ ] SMS notifications
- [ ] Audit logging
- [ ] File uploads for documents
- [ ] Advanced reporting and analytics

## 🔍 API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

### Error Response
```json
{
  "message": "Error description",
  "stack": "Stack trace (development only)"
}
```

## 🤝 Contributing

This is a private project for Pacifica Finance Corporation.

## 📄 License

Proprietary - All rights reserved

---

**Built with ❤️ for Philippine lending operations**
