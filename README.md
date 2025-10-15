# Pacifica Loan Management System

A comprehensive loan management system built with Angular, Ionic, Node.js, Express, and PostgreSQL.

## 🏗️ Project Structure

```
loan-management-system/
├── backend/              # Node.js + Express API server
├── web/                  # Angular admin web application
├── customer-app/         # Ionic mobile app for customers
├── collector-app/        # Ionic mobile app for collectors
└── development-plan.md   # Development roadmap
```

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn
- Ionic CLI: `npm install -g @ionic/cli`
- Angular CLI: `npm install -g @angular/cli`

## 🚀 Getting Started

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE pacifica_loans;
```

### 2. Backend Setup

```bash
cd backend
npm install

# Configure database connection in .env file
# The .env file is included in the repository

# Run migrations
npm run migrate:up

# Start development server
npm run dev
```

Backend will run on `http://localhost:3000`

### 3. Web Admin App Setup

```bash
cd web
npm install

# Start development server
ng serve
```

Web app will run on `http://localhost:4200`

### 4. Customer Mobile App Setup

```bash
cd customer-app
npm install

# Start development server
ionic serve
```

Customer app will run on `http://localhost:8100`

### 5. Collector Mobile App Setup

```bash
cd collector-app
npm install

# Start development server
ionic serve
```

Collector app will run on `http://localhost:8101`

## 🔐 Default Test Credentials

### Super Admin
- Email: `admin@pacifica.ph`
- Password: `Admin@123`

### Branch Manager
- Email: `manager@pacifica.ph`
- Password: `Manager@123`

### Loan Officer
- Email: `officer@pacifica.ph`
- Password: `Officer@123`

## 🗄️ Database Configuration

The `.env` file in the `backend/` directory contains:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pacifica_loans
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

**⚠️ Important:** Update `DB_PASSWORD`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` with your own values.

## 🌟 Features

### Backend API
- ✅ JWT Authentication with refresh tokens
- ✅ User management (Admin, Branch Manager, Loan Officer, Collector)
- ✅ Customer management
- ✅ Loan product configuration
- ✅ Loan application and approval workflow
- ✅ Payment processing and tracking
- ✅ Payment schedule generation
- ✅ Analytics and reporting
- ✅ QR code generation for payments

### Customer Mobile App
- ✅ Customer registration and login
- ✅ View active loans
- ✅ Loan detail with payment schedule
- ✅ Payment history
- ✅ QR code generation for payments
- ✅ Loan application (Cash & Product loans)
- ✅ Profile management
- ✅ Logout functionality

### Collector Mobile App
- 🔄 Coming soon

### Web Admin App
- 🔄 Coming soon

## 📱 Mobile App Development

### Build for Android
```bash
ionic capacitor build android
```

### Build for iOS
```bash
ionic capacitor build ios
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### API Testing
Use the included `.http` files in the `backend/` directory with REST Client extension:
- `test-api.http` - General API tests
- `test-loan-api.http` - Loan API tests
- `test-payment-api.http` - Payment API tests
- `test-analytics-api.http` - Analytics API tests

## 📚 API Documentation

Backend API runs on `http://localhost:3000/api`

### Main Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/loan-products` - List loan products
- `POST /api/loans` - Create loan application
- `GET /api/loans` - List loans
- `POST /api/payments` - Record payment
- `GET /api/analytics/*` - Various analytics endpoints

## 🛠️ Technology Stack

### Backend
- Node.js
- Express.js
- TypeScript
- PostgreSQL
- node-pg-migrate
- JWT Authentication
- bcryptjs

### Frontend (Web)
- Angular 20
- TypeScript
- Tailwind CSS
- RxJS

### Mobile Apps
- Ionic 8
- Angular 20
- Capacitor 7
- TypeScript
- SCSS

## 📝 Development

### Database Migrations

Create a new migration:
```bash
cd backend
npm run migrate:create -- migration-name
```

Run migrations:
```bash
npm run migrate:up
```

Rollback migrations:
```bash
npm run migrate:down
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is proprietary software owned by Pacifica Finance.

## 📧 Support

For support, email: support@pacifica.ph

## 🎯 Project Status

- ✅ Backend API - Complete
- ✅ Customer Mobile App - Complete
- 🔄 Collector Mobile App - In Progress
- 🔄 Web Admin App - Planned

---

**Built with ❤️ by the Pacifica Development Team**
