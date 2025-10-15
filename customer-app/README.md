# Pacifica Customer Mobile App

**Version:** 1.0.0  
**Framework:** Ionic 8 + Angular 20 + Capacitor 7  
**Purpose:** Customer loan management mobile application

---

## 📱 Features

### Authentication
- ✅ Secure JWT-based login
- ✅ Auto-logout on token expiration
- ✅ Protected routes with guards

### Loan Management
- ✅ View all customer loans
- ✅ Loan details with payment schedule
- ✅ Payment history tracking
- ✅ Loan status indicators
- ✅ Progress tracking

### QR Code Payment
- ✅ Generate QR codes for payment collection
- ✅ QR codes contain loan and customer information
- ✅ 5-minute QR code expiration for security

### User Profile
- ✅ View customer information
- ✅ Secure logout with confirmation

---

## 🏗️ Folder Structure

```
customer-app/
├── src/app/
│   ├── core/                      # Singleton services & guards
│   │   ├── guards/
│   │   │   └── auth.guard.ts      # Route protection
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts # HTTP token injection
│   │   ├── services/
│   │   │   └── auth.service.ts    # Authentication service
│   │   └── models/
│   │       ├── auth.model.ts      # Auth interfaces
│   │       └── loan.model.ts      # Loan interfaces
│   │
│   └── features/                  # Feature modules
│       ├── auth/
│       │   └── pages/login/       # Login page
│       ├── loans/
│       │   ├── pages/
│       │   │   ├── loans-list/    # Loans list page
│       │   │   └── loan-detail/   # Loan detail page
│       │   └── services/
│       │       ├── loan.service.ts
│       │       └── qr-code.service.ts
│       ├── profile/
│       │   └── pages/profile/     # Profile page
│       └── tabs/
│           └── pages/tabs/        # Tab navigation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Ionic CLI (`npm install -g @ionic/cli`)

### Installation

```bash
cd customer-app
npm install
```

### Development

```bash
ionic serve
# Open http://localhost:8100
```

### Build for Production

```bash
ionic build --prod
```

### Build for Mobile

**Android:**
```bash
ionic cap add android
ionic build
ionic cap sync android
ionic cap open android
```

**iOS:**
```bash
ionic cap add ios
ionic build
ionic cap sync ios
ionic cap open ios
```

---

## 🔧 Configuration

### Environment Variables

**Development** (`src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

**Production** (`src/environments/environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.pacifica.ph/api'
};
```

### App Configuration

**capacitor.config.ts:**
```typescript
{
  appId: 'ph.pacifica.customer',
  appName: 'Pacifica Customer',
  webDir: 'www'
}
```

---

## 📡 API Endpoints Used

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

### Loans
- `GET /api/loans?customerId={id}` - Get customer loans
- `GET /api/loans/{id}` - Get loan details
- `GET /api/loans/{id}/schedule` - Get payment schedule
- `GET /api/payments/loan/{id}` - Get payment history

---

## 🧪 Test Credentials

**Customer Account:**
- Email: `juan.delacruz@example.com`
- Password: `password123`

---

## 📦 Dependencies

### Core
- @angular/core: ^20.0.0
- @ionic/angular: ^8.0.0
- @capacitor/core: ^7.4.3

### Features
- qrcode: ^1.5.4 (QR code generation)
- rxjs: ~7.8.0 (Reactive programming)

---

## 🎨 Design Features

- **Modern UI:** Clean, gradient-based design
- **Responsive:** Works on all screen sizes
- **Dark Mode Ready:** Prepared for dark mode implementation
- **Loading States:** Skeleton screens and spinners
- **Empty States:** User-friendly empty state messages
- **Pull to Refresh:** Refresh data easily

---

## 📝 Notes

- QR codes expire after 5 minutes for security
- All amounts displayed in Philippine Peso (₱)
- Dates formatted for Philippine locale
- Automatic token refresh on API calls
- Secure localStorage for tokens

---

## 🔒 Security Features

- JWT token-based authentication
- HTTP interceptor for automatic token injection
- Auto-logout on 401 errors
- Route guards for protected pages
- QR code expiration (5 minutes)
- Confirmation dialogs for sensitive actions

---

## 📱 Screens

1. **Login** - Email/password authentication
2. **Loans List** - All customer loans with status
3. **Loan Detail** - Detailed loan information with tabs:
   - Overview (loan summary)
   - Schedule (payment schedule)
   - History (payment history)
4. **Profile** - Customer information and logout

---

## 🚧 Future Enhancements

- [ ] Fingerprint/Face ID authentication
- [ ] Push notifications for payment reminders
- [ ] Dark mode support
- [ ] Offline mode
- [ ] Payment receipt download
- [ ] Loan application feature
- [ ] Multi-language support

---

## 📞 Support

**Technical Issues:** dev@pacifica.ph  
**Backend API:** See `backend/README.md`  
**Status:** Production Ready ✅

---

**Last Updated:** October 15, 2025  
**Status:** 100% Complete - Ready for Testing
