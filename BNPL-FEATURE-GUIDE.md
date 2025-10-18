# Buy Now, Pay Later (BNPL) Feature - Implementation Guide

## Overview
The BNPL feature enables tenants to sell products on installment plans with automated payment tracking, credit limit management, and comprehensive reporting.

---

## 🎯 Key Features

### 1. Customer Credit Management
- Create customer profiles with credit limits
- Track payment behavior (on-time, late, defaulted)
- Auto-calculate available credit
- Credit scoring system
- Suspend/blacklist customers

### 2. Purchase & Installment Creation
- Record product sales with multiple items
- Configure down payment
- Set installment terms (daily, weekly, bi-weekly, monthly)
- Apply interest/service charges (flat or diminishing)
- Auto-generate payment schedules
- Support for tax and discounts

### 3. Payment Collection
- Record cash, check, bank transfer, e-wallet payments
- Auto-allocate to principal, interest, and penalties
- Track overdue installments
- Calculate and apply late fees
- Generate payment receipts

### 4. Automated Reminders
- SMS/Email reminders for upcoming payments
- Due today notifications
- Overdue alerts
- Configurable reminder schedules

### 5. Reports & Analytics
- Sales performance by product
- Receivables aging report
- Payment behavior analysis
- Branch/collector performance
- Export to Excel/PDF

---

## 📊 Database Structure

### Tables Created

#### `bnpl_customers`
Stores customer information with credit profiles
```sql
Key Fields:
- credit_limit: Maximum credit allowed
- available_credit: Current available credit
- outstanding_balance: Total amount owed
- on_time_payments: Count of timely payments
- late_payments: Count of delayed payments
- credit_rating: excellent | good | fair | poor | bad
```

#### `bnpl_purchases`
Main purchase/sale records
```sql
Key Fields:
- purchase_number: Unique identifier
- total_amount: Total price including tax
- down_payment: Initial payment
- financed_amount: Amount to be paid in installments
- number_of_installments: Payment count
- installment_frequency: daily | weekly | bi-weekly | monthly
- interest_rate: Service charge percentage
- total_payable: Financed amount + interest
- status: pending | approved | active | completed | cancelled | defaulted
```

#### `bnpl_purchase_items`
Line items for each purchase
```sql
Key Fields:
- product_name, product_code
- quantity, unit_price, total_price
- inventory_item_id: Optional link to inventory
```

#### `bnpl_installments`
Payment schedule for each purchase
```sql
Key Fields:
- installment_number: Sequence number
- due_date: When payment is expected
- amount_due: Expected payment amount
- amount_paid: Actual amount received
- balance: Remaining amount
- days_overdue: Days past due date
- penalty_amount: Late fees
- status: pending | paid | partial | overdue | waived
```

#### `bnpl_payments`
Payment transaction records
```sql
Key Fields:
- payment_number: Unique identifier
- payment_amount: Total paid
- principal_paid: Amount towards principal
- interest_paid: Amount towards interest
- penalty_paid: Amount towards penalties
- payment_method: cash | check | bank_transfer | gcash | paymaya
- receipt_number, receipt_url
```

#### `bnpl_payment_reminders`
Scheduled reminders for customers
```sql
Key Fields:
- reminder_type: upcoming | due_today | overdue
- reminder_method: sms | email | both
- scheduled_date: When to send
- status: pending | sent | failed
```

---

## 🔄 Business Logic & Triggers

### 1. Credit Limit Enforcement
```typescript
// Before creating a purchase
if (customer.available_credit < purchase.financed_amount) {
  throw new Error('Insufficient credit limit');
}

// After purchase approval
customer.available_credit -= purchase.financed_amount;
customer.outstanding_balance += purchase.total_payable;
```

### 2. Installment Calculation

#### Flat Interest Method
```typescript
interest = (financed_amount * interest_rate * term_months) / 100
total_payable = financed_amount + interest
installment_amount = total_payable / number_of_installments
```

#### Diminishing Interest Method
```typescript
// Interest calculated on remaining balance each period
// Uses amortization formula for equal payments
```

### 3. Payment Processing (Automated Trigger)
```sql
-- Trigger: process_bnpl_payment_trigger
-- Executes after payment insert

1. Update purchase:
   - Increment amount_paid
   - Update last_payment_date
   - Change status to 'completed' if fully paid

2. Update customer:
   - Increment total_paid
   - Decrease outstanding_balance
   - Increase available_credit
   - Update payment behavior counters

3. Update next installment:
   - Mark as paid/partial based on amount
   - Set payment_date
   - Recalculate balance
```

### 4. Balance Sync (Automated Trigger)
```sql
-- Trigger: update_bnpl_purchase_balance_trigger
-- Executes after installment update

Recalculates purchase.outstanding_balance from sum of installment balances
```

---

## 🚀 API Endpoints (To Be Implemented)

### Customers
```
GET    /api/bnpl/customers              # List all customers
POST   /api/bnpl/customers              # Create new customer
GET    /api/bnpl/customers/:id          # Get customer details
PUT    /api/bnpl/customers/:id          # Update customer
DELETE /api/bnpl/customers/:id          # Delete/suspend customer
GET    /api/bnpl/customers/:id/purchases # Get customer's purchases
GET    /api/bnpl/customers/:id/payments  # Get customer's payment history
PUT    /api/bnpl/customers/:id/credit-limit # Update credit limit
```

### Purchases
```
GET    /api/bnpl/purchases              # List all purchases
POST   /api/bnpl/purchases              # Create new purchase
GET    /api/bnpl/purchases/:id          # Get purchase details
PUT    /api/bnpl/purchases/:id          # Update purchase
DELETE /api/bnpl/purchases/:id          # Cancel purchase
POST   /api/bnpl/purchases/:id/approve  # Approve pending purchase
GET    /api/bnpl/purchases/:id/installments # Get payment schedule
POST   /api/bnpl/purchases/calculate    # Calculate installment preview
```

### Payments
```
GET    /api/bnpl/payments               # List all payments
POST   /api/bnpl/payments               # Record new payment
GET    /api/bnpl/payments/:id           # Get payment details
PUT    /api/bnpl/payments/:id           # Update payment
DELETE /api/bnpl/payments/:id           # Void payment
GET    /api/bnpl/payments/overdue       # Get overdue list
```

### Reports
```
GET    /api/bnpl/reports/sales          # Sales performance report
GET    /api/bnpl/reports/receivables    # Outstanding receivables
GET    /api/bnpl/reports/collections    # Collection performance
GET    /api/bnpl/reports/customer-behavior # Payment behavior analysis
POST   /api/bnpl/reports/export         # Export report to Excel/PDF
```

---

## 🎨 UI Components (To Be Built)

### Customer Management
```
1. Customer List Page
   - Table with filters (status, credit rating)
   - Search by name/phone
   - Quick view credit summary
   - Actions: View, Edit, Suspend

2. Customer Form
   - Personal info section
   - Contact & address
   - Employment details
   - Credit limit setting
   - Validation: required fields, credit limit > 0

3. Customer Detail Page
   - Profile summary card
   - Credit utilization chart
   - Active purchases table
   - Payment history timeline
   - Credit limit adjustment
```

### Purchase Management
```
1. Purchase List Page
   - Filter by status, date range, customer
   - Sort by amount, date
   - Status badges (active, overdue, completed)
   - Quick actions: View, Collect Payment

2. Purchase Form
   - Customer selection
   - Product items (add multiple)
   - Subtotal calculation
   - Tax/discount fields
   - Down payment input
   - Installment terms configurator
   - Live calculation preview
   - Submit for approval

3. Purchase Detail Page
   - Purchase summary card
   - Items table
   - Payment schedule with status
   - Payment history
   - Collect payment button
   - Print receipt/statement
```

### Payment Collection
```
1. Collect Payment Modal
   - Purchase summary
   - Amount due display
   - Payment amount input
   - Payment method selector
   - Reference number field
   - Receipt number generation
   - Allocation breakdown

2. Overdue Dashboard
   - Overdue purchases list
   - Days overdue indicator
   - Penalty calculation
   - Customer contact info
   - Bulk reminder button
   - Assign to collector

3. Payment History
   - Chronological list
   - Filter by date, method
   - Receipt links
   - Payment allocation details
```

### Reports & Analytics
```
1. Sales Dashboard
   - Total sales card
   - Active purchases card
   - Collections card
   - Outstanding receivables card
   - Sales trend chart (last 12 months)
   - Top products table
   - Top customers table

2. Receivables Report
   - Aging analysis (0-30, 31-60, 61-90, 90+ days)
   - By customer breakdown
   - By collector breakdown
   - Export to Excel

3. Performance Report
   - Branch comparison
   - Collector performance
   - Product performance
   - Customer behavior metrics
   - Export to PDF
```

---

## 🔐 Security & Validation

### Tenant Isolation
```typescript
// All queries must include tenant_id
const customers = await db.query(`
  SELECT * FROM bnpl_customers 
  WHERE tenant_id = $1
`, [tenantId]);

// Verify ownership before operations
const purchase = await db.query(`
  SELECT * FROM bnpl_purchases 
  WHERE id = $1 AND tenant_id = $2
`, [purchaseId, tenantId]);
```

### Business Rules Validation
```typescript
// Credit limit check
if (customer.available_credit < purchase.financed_amount) {
  return { error: 'Insufficient credit limit' };
}

// Minimum down payment
if (purchase.down_payment < purchase.total_amount * 0.1) {
  return { error: 'Minimum 10% down payment required' };
}

// Valid installment count
if (purchase.number_of_installments < 1 || purchase.number_of_installments > 36) {
  return { error: 'Installments must be between 1 and 36' };
}

// Payment cannot exceed balance
if (payment.payment_amount > purchase.outstanding_balance) {
  return { error: 'Payment exceeds outstanding balance' };
}
```

---

## 📱 Integration Points

### Inventory System (Optional)
```typescript
// When purchase is created and approved
await inventoryService.deductStock({
  items: purchase.items.map(item => ({
    id: item.inventory_item_id,
    quantity: item.quantity
  }))
});
```

### Accounting System (Optional)
```typescript
// When purchase is created
await accountingService.recordSale({
  amount: purchase.total_amount,
  receivable: purchase.financed_amount,
  down_payment: purchase.down_payment
});

// When payment is received
await accountingService.recordReceipt({
  amount: payment.payment_amount,
  method: payment.payment_method
});
```

### SMS/Email Service
```typescript
// Send payment reminder
await notificationService.send({
  method: 'sms',
  to: customer.phone_number,
  message: `Reminder: Your payment of ₱${installment.amount_due} is due on ${installment.due_date}`
});
```

---

## 🧪 Testing Checklist

- [ ] Create customer with credit limit
- [ ] Create purchase exceeding credit limit (should fail)
- [ ] Create purchase with valid terms
- [ ] Approve purchase (check credit deduction)
- [ ] Record payment (check balance updates)
- [ ] Record overpayment (should fail)
- [ ] Check installment status updates
- [ ] Test overdue calculation
- [ ] Test penalty application
- [ ] Complete purchase (check credit restoration)
- [ ] Test tenant isolation (cross-tenant access prevention)
- [ ] Generate reports
- [ ] Export reports to Excel/PDF

---

## 📚 Next Steps for Implementation

1. **Backend Services** (Priority: High)
   - Create `BnplCustomerService` with credit management
   - Create `BnplPurchaseService` with installment calculator
   - Create `BnplPaymentService` with allocation logic

2. **Backend Controllers** (Priority: High)
   - Implement RESTful endpoints
   - Add authentication middleware
   - Add tenant isolation middleware

3. **Frontend Services** (Priority: Medium)
   - Create Angular HTTP services
   - Implement state management
   - Add error handling

4. **UI Components** (Priority: Medium)
   - Build customer management pages
   - Build purchase management pages
   - Build payment collection pages
   - Build reports dashboard

5. **Feature Integration** (Priority: Low)
   - Add to sidebar with feature flag check
   - Configure routing with guards
   - Update landing page feature cards

---

## 💡 Business Value

### For Tenants
- **Increase Sales**: Customers can buy now, pay later
- **Reduce Risk**: Credit limits and automated tracking
- **Save Time**: Automated reminders and collection tracking
- **Better Insights**: Comprehensive reports on sales and collections

### For End Customers
- **Flexible Payments**: Buy products without full upfront payment
- **Transparent Terms**: Clear installment schedules
- **Convenient**: Multiple payment methods supported
- **Reminders**: Never miss a payment with automated alerts

---

**Last Updated:** October 18, 2025
**Status:** Models & Migrations Complete ✅ | Services & UI Pending 🔴
