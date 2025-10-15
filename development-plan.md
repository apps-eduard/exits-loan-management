# Loan Management System – Development Plan

## Project Overview

**Project Name:** Loan Management System

**Goal:** Deliver a Philippine-focused, multi-branch lending platform that supports diverse loan products (cash, mobile, vehicle, appliance) with daily, weekly, and monthly repayment plans. Provide strong organizational separation (regions, branches, departments) and strict role-based controls.

### Technology Stack

- Frontend: Angular + Ionic (PWA + mobile)
- Backend: Express + Node.js
- Database: PostgreSQL (with audit and ledger support)

---

## System Objectives

- Digital and collector-assisted loan origination.
- Mobile collections for field agents with receipt issuance.
- Branch-scoped approval and disbursement workflows.
- Organizational Units (OU) to isolate data by region, branch, department.
- Role-Based Access Control (RBAC) for all surfaces.
- Financial and performance reporting by branch, collector, and period.
- Immutable audit logging and operational system logging.

---

## User Roles and Responsibilities

| Role | Description | Sample Access |
|------|-------------|---------------|
| Customer | Requests loans, tracks balances, makes payments | Apply for loans, view history, pay online |
| Collector | Manages assigned loans, records payments | Record payments, leave visit notes |
| Loan Officer | Encodes and reviews applications | Edit applications, request documents |
| Manager | Approves loans, oversees collectors | Approve or reject loans, run branch reports |
| Cashier | Handles disbursement and over-the-counter receipts | Release funds, accept cash payments |
| Admin | Manages branch-level users and settings | Configure OU modules, view OU reports |
| Super Admin | HQ oversight and global settings | All branches, system configuration |

---

## Organizational Structure (OU Concept)

```text
Pacifica Finance Corp.
 ├─ Region: Western Visayas
 │   ├─ Branch: Iloilo
 │   │   ├─ Dept: Loans
 │   │   └─ Dept: Collections
 │   └─ Branch: Roxas
 └─ Region: NCR
     └─ Branch: Quezon City
```

- Users, loans, payments, and reports are scoped by OU.
- Super Admins can view cross-OU metrics; other roles stay within assigned scope.

---

## System Architecture (Text Diagram)

```text
[ Ionic Mobile Apps ]
 ├─ Customers
 └─ Collectors
          |
          v
[ Angular Web Dashboard ]
 ├─ Admins
 ├─ Managers
 ├─ Loan Officers
 └─ Cashiers
          |
          v
[ Express + Node.js API ]
 ├─ JWT Auth and Refresh
 ├─ RBAC Middleware
 ├─ OU Data Scoping
 ├─ Loan and Payment Services
 ├─ Reporting Services
 └─ Audit and System Logging
          |
          v
[ PostgreSQL ]
 ├─ Users, Roles, Permissions
 ├─ OUs, Loans, Payments, Schedules
 ├─ Collaterals, Documents
 └─ Reports, Logs, Ledger
```

---

## Core Modules

- Authentication and RBAC: JWT, refresh tokens, OU-aware authorization.
- Organizational Units: Hierarchy management, branch assignments.
- Customer Management: KYC, profiles, risk attributes.
- Loan Management: Application intake, underwriting, approvals, disbursements.
- Repayment Tracking: Daily, weekly, monthly schedules, penalties, grace periods.
- Collection Management: Assignment routing, mobile payment capture.
- Reporting and Analytics: Portfolio, delinquency, collector performance, PAR.
- System Settings: Loan products, interest templates, role permissions.
- Logging and Auditing: Immutable business events, operational diagnostics.

---

## Data Flow (Text)

```text
Customer → Loan Application → Loan Officer Review
                                    ↓
Collector (Mobile) ← Payment Schedule ← Manager Approval
             ↓                              ↓
Repayment Submission → Cashier (if OTC) → Database Update (loan, schedule, ledger)
             ↓
Reporting and Alerts → Admin or HQ Dashboards
```

---

## Database Entities (Summary)

- User: id, name, email, passwordHash, roleId, organizationalUnitId, isActive, createdAt
- Role: id, name, description
- Permission: id, name, description
- RolePermission: roleId, permissionId
- OrganizationalUnit: id, name, parentId, type, createdAt
- Customer: id, personal info, KYC status, contact details, ouId
- Loan: id, customerId, ouId, product type, principal, rate, termCount, frequency, status, createdAt
- Schedule: id, loanId, installment number, dueDate, principalDue, interestDue, fees, paidBreakdown, status
- Payment: id, loanId, collectorId, amount, paymentDate, method, status, createdAt
- PaymentAllocation: paymentId, scheduleId, toInterest, toFees, toPrincipal
- Collateral: id, loanId, type, value, documentation
- AuditLog: id, userId, actionType, entity, entityId, payload or diff, timestamp, remarks
- SystemLog: id, level, service, message, timestamp
- LedgerEntry: id, loanId, transactionType, debitAccount, creditAccount, amount, postedAt

---

## Example Loan Flow (OU and RBAC)

1. Customer (Iloilo OU) applies for a PHP 10,000 weekly loan via mobile.
2. Iloilo Loan Officer reviews the application and verifies documents.
3. Iloilo Manager approves the request (RBAC enforces OU scope).
4. Iloilo Cashier disburses funds and issues a receipt.
5. Iloilo Collector posts weekly payments via mobile.
6. HQ Admin reviews aggregated branch performance and PAR metrics.

---

## Development Plan

| Phase | Focus | Deliverables |
|-------|-------|--------------|
| 1 | System Setup | Express API, PostgreSQL schema, JWT and refresh flow, RBAC, OU enforcement, audit logging |
| 2 | Loans and Payments | Loan products, application flow, approvals, disbursement, schedule generation, payment posting, ledger entries |
| 3 | Mobile (Ionic) | Collector assignments, payment capture, customer self-service portal |
| 4 | Reports and Dashboard | Branch dashboards, delinquency tracking, performance reports, exports |
| 5 | Deployment | Secure hosting, monitoring, backups, disaster recovery drills, environment parity |

---

## System Interaction (Text Diagram)

```text
SUPER ADMIN (HQ)
 └─ Angular Web Dashboard (Material)
   ├─ Admins / Managers / Officers / Cashiers
   └─ RBAC and OU filters applied per session
       | HTTPS
       v
    Express API (JWT, RBAC, OU filters, audit, system logs)
       |
    PostgreSQL (core data, schedules, ledger, logs)
       ^
       |
Ionic Customer App            Ionic Collector App
├─ Apply, view schedule       ├─ Assigned loans
├─ Pay online                 ├─ Record collections
└─ Notifications              └─ Sync (online-first, offline roadmap)
```

---

## Security and Access Flow

1. Frontend sends request with JWT.
2. API verifies token, role, OU, and session validity.
3. RBAC middleware checks route permissions.
4. OU filter scopes query to branch or region.
5. Action executes and writes to audit log (userId, OU, actionType, entityId, timestamp).
6. Errors captured in SystemLog with severity and diagnostics.

*Example:* Collector in Iloilo requests `/api/loans`. Middleware confirms Collector role and OU = Iloilo, returning only Iloilo loans and logging the access in `AuditLog`.

---

## Logging Workflow

- Business success: write to domain tables, append `AuditLog`.
- System error or warning: capture in `SystemLog` with severity, service, trace metadata.
- Usage analytics (optional): derive from logs for feature adoption insights.

---

## Data Visibility Matrix

| Role | Data Scope |
|------|------------|
| Customer | Own loans, schedules, payments |
| Collector | Assigned loans within branch |
| Loan Officer | Pending and active loans in department |
| Manager | Loans, payments, collectors per branch |
| Admin | All data within assigned OU or region |
| Super Admin | Global cross-OU visibility |

---

## OU-Based Isolation Example

```text
Western Visayas
 ├─ Iloilo Branch
 │   ├─ Collector A
 │   ├─ Loan Officer B
 │   └─ Manager C
 └─ Roxas Branch
    ├─ Collector D
    ├─ Loan Officer E
    └─ Manager F
```

- Collector A cannot see Roxas branch loans.
- Manager F cannot view Iloilo branch reports.
- HQ Admin can review both branches.

---

## Workflow Summary

| Step | Action | Actor | Audit? |
|------|--------|-------|--------|
| 1 | Loan application submission | Customer | Yes |
| 2 | Application review | Loan Officer | Yes |
| 3 | Approval or rejection | Manager | Yes |
| 4 | Funds disbursement | Cashier | Yes |
| 5 | Payment collection | Collector | Yes |
| 6 | Report generation | Admin | Optional |
| 7 | System error handling | API | Logged in SystemLog |

---

### Next Steps

- Validate interest models, penalty policies, payment channels, and offline requirements.
- Confirm initial OU hierarchy and regulatory constraints.

---

## Backend (Express + PostgreSQL) TODO

1. Foundations
   - Initialize Node and Express structure, linting, and environment management.
   - Configure PostgreSQL migrations for roles, permissions, OUs, users, products, loans, schedules, payments, ledger, logs.
   - Implement authentication (JWT access and refresh) plus RBAC middleware.
   - Enforce OU scoping and audit logging.
2. Core Services
   - Product configuration (interest models, fees, penalties).
   - Loan lifecycle APIs (create, review, approve, disburse, restructure, close).
   - Schedule generation (daily, weekly, monthly; declining balance default).
   - Payment intake with idempotency, allocation ordering, ledger entries.
   - Penalty assessment jobs, reminders, and notification triggers.
3. Operations and Integrations
   - Reporting endpoints (portfolio, aging, collector performance).
   - Payment channels (cash, bank transfer, GCash) via provider abstraction.
   - Document storage adapters and notification services.
   - Monitoring, logging pipeline, deployment scripts.

---

## Angular Web Dashboard TODO

1. Setup
   - Create Angular workspace with RBAC-aware routing and state management.
   - Configure OU-aware layouts, guards, and API client services.
2. Admin Modules
   - User and role management, OU hierarchy management.
   - Product configuration UI (interest, fees, penalties).
   - System settings (compliance presets, payment channels).
3. Loan and Operations
   - Loan origination workflows (intake, review, approval, disbursement).
   - Payment oversight (transaction lists, reconciliation views).
   - Collector oversight, assignments, and promise-to-pay tracking.
4. Analytics
   - Branch dashboards, PAR and aging charts, collector performance.
   - Report builder and export screens plus scheduled report management.

---

## Ionic Mobile TODO (Customer and Collector)

1. Project Setup
   - Initialize Ionic app with shared authentication and API client.
   - Implement role-based navigation shells (collector versus customer).
2. Collector Experience
   - Assignment list, loan details, payment capture with receipt display.
   - Promise-to-pay logging, visit notes, optional GPS tagging.
   - Offline queue (configurable per branch) and sync conflict handling.
3. Customer Experience
   - Loan application wizard, document upload, status tracker.
   - Schedule viewer, payment options (cash instructions, bank, GCash).
   - Notifications and support contact screens.
4. Shared Utilities
   - Session persistence, refresh handling, error reporting.
   - Localization (currency and date) plus accessibility checks.
