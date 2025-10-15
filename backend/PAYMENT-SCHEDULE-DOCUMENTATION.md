# Payment Schedule Generation System

## Overview
The Payment Schedule Generation System automatically creates amortization schedules for loans when they are disbursed. It supports multiple interest calculation methods and payment frequencies, providing flexible loan structuring for microfinance operations.

---

## Features

### 1. Interest Calculation Methods

#### Flat Rate Method
- **Formula**: `Interest = Principal × Rate × Term`
- **Characteristics**:
  - Simple interest calculation
  - Interest amount remains constant throughout loan term
  - Total interest distributed equally across all installments
  - Easy for borrowers to understand
- **Use Case**: Short-term loans, daily/weekly payment schemes
- **Example**:
  ```
  Principal: ₱50,000
  Rate: 10% per annum
  Term: 12 months
  Interest: ₱50,000 × 0.10 × 1 = ₱5,000
  Total Amount: ₱55,000
  Monthly Payment: ₱55,000 ÷ 12 = ₱4,583.33
  ```

#### Diminishing Balance Method
- **Formula**: `PMT = P × [r(1+r)^n] / [(1+r)^n - 1]`
- **Characteristics**:
  - Interest calculated on remaining principal balance
  - Interest portion decreases over time
  - Principal portion increases over time
  - More accurate reflection of actual interest cost
- **Use Case**: Medium to long-term loans, monthly payments
- **Example**:
  ```
  Principal: ₱50,000
  Rate: 10% per annum (0.833% per month)
  Term: 12 months
  Monthly Payment: ₱4,402.11
  
  Month 1: Interest = ₱416.67, Principal = ₱3,985.44
  Month 2: Interest = ₱383.45, Principal = ₱4,018.66
  ...and so on
  ```

#### Add-On Rate Method
- **Formula**: Similar to flat rate
- **Characteristics**:
  - Interest added to principal upfront
  - Fixed installment amounts
  - Used in specific lending contexts
- **Use Case**: Consumer financing, appliance loans

### 2. Payment Frequencies

#### Daily Payments
- **Schedule**: Every day
- **Best For**: Small loans, sari-sari store loans
- **Example**: ₱10,000 loan over 30 days = ₱333.33 per day

#### Weekly Payments
- **Schedule**: Every 7 days
- **Best For**: Weekly income earners
- **Example**: ₱20,000 loan over 12 weeks = ₱1,666.67 per week

#### Bi-Weekly Payments
- **Schedule**: Every 14 days (26 payments per year)
- **Best For**: Employees paid bi-weekly
- **Calculation**: `Installments = Term × 2.17` (approx)

#### Semi-Monthly Payments
- **Schedule**: 15th and end of month (24 payments per year)
- **Best For**: Government employees, regular salary earners
- **Logic**: 
  - Odd installments: Due on 15th
  - Even installments: Due on last day of month

#### Monthly Payments
- **Schedule**: Once per month
- **Best For**: Traditional loans, stable income borrowers
- **Example**: ₱100,000 loan over 24 months = ₱4,166.67 per month (flat rate)

### 3. Schedule Generation Features

#### Automatic Calculation
- **Installment Number**: Sequential tracking (1, 2, 3...)
- **Due Dates**: Calculated based on frequency and start date
- **Principal Amount**: Per-installment principal reduction
- **Interest Amount**: Per-installment interest charge
- **Total Installment**: Principal + Interest per payment
- **Remaining Balance**: Outstanding balance after each payment

#### Rounding & Precision
- All monetary amounts rounded to 2 decimal places
- Prevents penny rounding errors
- Last installment adjusted for any rounding differences

#### Processing Fee Handling
- One-time fee added to total loan amount
- Distributed across all installments
- Example: ₱500 fee on ₱50,000 loan = included in amortization

### 4. Database Integration

#### Automatic Triggers
- **When**: Loan status changes to 'disbursed'
- **Action**: 
  1. Generate complete payment schedule
  2. Save to `payment_schedules` table
  3. Update loan status to 'active'
  4. Set `first_payment_date` on loan
  5. Set `maturity_date` on loan

#### Schedule Storage
- **Table**: `payment_schedules`
- **Fields**:
  - `loan_id`: Link to loans table
  - `installment_number`: Payment sequence
  - `due_date`: When payment is due
  - `principal_amount`: Principal portion
  - `interest_amount`: Interest portion
  - `installment_amount`: Total payment amount
  - `balance`: Remaining loan balance
  - `status`: pending/paid/overdue
  - `paid_amount`: Actual amount paid (when posted)
  - `paid_date`: Date payment was received

#### Transactional Safety
- All schedule operations wrapped in database transactions
- Automatic rollback on errors
- Existing schedules deleted before regeneration

---

## API Reference

### Generate and Save Schedule
**Triggered automatically when loan is disbursed**

```typescript
// Internal service call
await paymentScheduleService.generateAndSaveSchedule(loanId);
```

**Process:**
1. Retrieves loan details (amount, rate, term, frequency)
2. Generates complete amortization schedule
3. Saves all installments to database
4. Updates loan with payment dates
5. Changes loan status to 'active'

### Get Payment Schedule
**Endpoint:** `GET /api/loans/:id/schedule`

**Request:**
```http
GET http://localhost:3000/api/loans/abc123/schedule
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment schedule retrieved successfully",
  "data": [
    {
      "installment_number": 1,
      "due_date": "2025-02-15",
      "principal_amount": 4166.67,
      "interest_amount": 416.67,
      "installment_amount": 4583.34,
      "balance": 45833.33,
      "status": "pending",
      "paid_amount": null,
      "paid_date": null
    },
    {
      "installment_number": 2,
      "due_date": "2025-03-15",
      "principal_amount": 4166.67,
      "interest_amount": 416.67,
      "installment_amount": 4583.34,
      "balance": 41666.66,
      "status": "pending",
      "paid_amount": null,
      "paid_date": null
    }
    // ... remaining installments
  ]
}
```

---

## Code Architecture

### Service Layer
**File:** `backend/src/services/payment-schedule.service.ts`

#### Key Methods

##### `generateSchedule(input: GenerateScheduleInput)`
Generates amortization schedule based on loan parameters.

**Parameters:**
```typescript
interface GenerateScheduleInput {
  loanId: string;
  principalAmount: number;
  interestRate: number;
  term: number;
  paymentFrequency: 'daily' | 'weekly' | 'monthly' | 'semi-monthly' | 'bi-weekly';
  interestMethod: 'flat' | 'diminishing' | 'add-on';
  startDate: Date;
  processingFee?: number;
}
```

**Returns:** Array of payment schedule items

##### `saveSchedule(loanId: string, schedule: PaymentScheduleItem[])`
Saves generated schedule to database.

**Process:**
- Begins transaction
- Deletes existing schedule (if any)
- Inserts all installments
- Commits transaction

##### `getSchedule(loanId: string)`
Retrieves saved payment schedule from database.

**Returns:** Array of schedule items with payment status

##### `activateLoan(loanId: string)`
Updates loan record after schedule generation.

**Updates:**
- Sets `status = 'active'`
- Sets `first_payment_date` (from min due_date)
- Sets `maturity_date` (from max due_date)

### Integration Points

#### Loan Service Integration
**File:** `backend/src/services/loan.service.ts`

```typescript
// In updateLoanStatus method
if (status === 'disbursed') {
  await this.paymentScheduleService.generateAndSaveSchedule(loanId);
  await this.paymentScheduleService.activateLoan(loanId);
}
```

#### Controller Layer
**File:** `backend/src/controllers/loan.controller.ts`

```typescript
async getPaymentSchedule(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const schedule = await loanService.getPaymentSchedule(id);
  res.json({ success: true, data: schedule });
}
```

#### Route Configuration
**File:** `backend/src/routes/loan.routes.ts`

```typescript
router.get(
  '/:id/schedule',
  requirePermissions(['loans.read']),
  loanController.getPaymentSchedule.bind(loanController)
);
```

---

## Usage Examples

### Example 1: Daily Payment Loan
```typescript
const schedule = await paymentScheduleService.generateSchedule({
  loanId: 'loan-123',
  principalAmount: 10000,
  interestRate: 15,
  term: 30,
  paymentFrequency: 'daily',
  interestMethod: 'flat',
  startDate: new Date('2025-01-15'),
  processingFee: 100
});

// Result: 30 installments of ~₱341.67 per day
```

### Example 2: Monthly Diminishing Balance
```typescript
const schedule = await paymentScheduleService.generateSchedule({
  loanId: 'loan-456',
  principalAmount: 100000,
  interestRate: 12,
  term: 24,
  paymentFrequency: 'monthly',
  interestMethod: 'diminishing',
  startDate: new Date('2025-01-15'),
  processingFee: 1000
});

// Result: 24 installments with decreasing interest, increasing principal
```

### Example 3: Semi-Monthly Payments
```typescript
const schedule = await paymentScheduleService.generateSchedule({
  loanId: 'loan-789',
  principalAmount: 50000,
  interestRate: 10,
  term: 12,
  paymentFrequency: 'semi-monthly',
  interestMethod: 'flat',
  startDate: new Date('2025-01-15'),
  processingFee: 500
});

// Result: 24 installments (2 per month) due on 15th and end of month
```

---

## Testing

### Test File Location
`backend/test-loan-api.http`

### Test Scenario: Complete Loan Workflow with Schedule

```http
### 1. Login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@pacifica.ph",
  "password": "Admin@123"
}

### 2. Create Loan
POST http://localhost:3000/api/loans
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "customerId": "{{customerId}}",
  "loanProductId": "{{loanProductId}}",
  "requestedAmount": 50000,
  "loanPurpose": "Business expansion",
  // ... other fields
}

### 3. Approve Loan
PUT http://localhost:3000/api/loans/{{loanId}}/approve
Authorization: Bearer {{accessToken}}

### 4. Disburse Loan (auto-generates schedule)
PUT http://localhost:3000/api/loans/{{loanId}}/disburse
Authorization: Bearer {{accessToken}}

### 5. Get Payment Schedule
GET http://localhost:3000/api/loans/{{loanId}}/schedule
Authorization: Bearer {{accessToken}}
```

---

## Business Rules

### Schedule Generation Rules
1. **Minimum Term**: Based on loan product configuration
2. **Maximum Term**: Based on loan product configuration
3. **Start Date**: Uses loan disbursement date
4. **Due Date Logic**:
   - Skip weekends: Not implemented (future enhancement)
   - Skip holidays: Not implemented (future enhancement)
   - Always use exact frequency calculation

### Interest Calculation Rules
1. **Flat Rate**: Interest never changes, calculated once
2. **Diminishing**: Interest recalculated each period on remaining balance
3. **Add-On**: Similar to flat, different business context

### Rounding Rules
1. All amounts rounded to 2 decimal places
2. Use standard rounding (0.5 rounds up)
3. Final installment adjusted for cumulative rounding errors

---

## Future Enhancements

### Planned Features
- [ ] Holiday calendar integration
- [ ] Weekend skip logic
- [ ] Grace period support
- [ ] Balloon payment option
- [ ] Variable interest rates
- [ ] Custom due date selection
- [ ] Installment splitting for partial payments
- [ ] Schedule modification after creation
- [ ] Payment schedule export (PDF, Excel)

### Performance Optimizations
- [ ] Bulk insert optimization for large schedules
- [ ] Caching frequently accessed schedules
- [ ] Async schedule generation for long-term loans

---

## Error Handling

### Common Errors

#### Loan Not Found
```json
{
  "success": false,
  "message": "Loan not found",
  "statusCode": 404
}
```

#### Invalid Loan Status
```json
{
  "success": false,
  "message": "Payment schedule can only be generated for disbursed or active loans",
  "statusCode": 400
}
```

#### Invalid Interest Method
```json
{
  "success": false,
  "message": "Invalid interest method",
  "statusCode": 400
}
```

#### Invalid Payment Frequency
```json
{
  "success": false,
  "message": "Invalid payment frequency",
  "statusCode": 400
}
```

---

## Database Schema

### payment_schedules Table
```sql
CREATE TABLE payment_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  principal_amount DECIMAL(15,2) NOT NULL,
  interest_amount DECIMAL(15,2) NOT NULL,
  installment_amount DECIMAL(15,2) NOT NULL,
  balance DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  paid_amount DECIMAL(15,2),
  paid_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_schedules_loan ON payment_schedules(loan_id);
CREATE INDEX idx_payment_schedules_due_date ON payment_schedules(due_date);
CREATE INDEX idx_payment_schedules_status ON payment_schedules(status);
```

---

## Configuration

### Environment Variables
No additional environment variables required. Uses existing database connection.

### Default Settings
- **Rounding Precision**: 2 decimal places
- **Date Format**: ISO 8601 (YYYY-MM-DD)
- **Transaction Timeout**: Default PostgreSQL timeout
- **Schedule Status**: Defaults to 'pending' on creation

---

## Support & Troubleshooting

### Debug Mode
Enable detailed logging by checking payment schedule service execution:

```typescript
console.log('Generating schedule for loan:', loanId);
console.log('Schedule items:', schedule.length);
```

### Common Issues

**Issue**: Schedule not generating on disbursement
- **Check**: Loan status is exactly 'disbursed'
- **Check**: Database transaction not rolled back
- **Solution**: Verify loan.service.ts integration

**Issue**: Incorrect due dates
- **Check**: Payment frequency setting
- **Check**: Start date value
- **Solution**: Review calculateNextDueDate logic

**Issue**: Interest calculation seems wrong
- **Check**: Interest method (flat vs diminishing)
- **Check**: Interest rate is annual percentage
- **Solution**: Verify calculation formulas in service

---

## Version History

**v1.0.0** (January 2025)
- Initial implementation
- Support for 3 interest methods
- Support for 5 payment frequencies
- Automatic schedule generation on disbursement
- Database integration with transactions

---

## License
Internal use only - Pacifica Finance Corporation

## Maintainers
Backend Development Team

---

**Documentation Last Updated:** January 2025
