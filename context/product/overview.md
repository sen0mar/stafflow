# Employee Management System

Detailed attendance, leave, and date behavior lives in [domain policies](../architecture/domain-policies.md).

## Overview

The Employee Management System is a full-stack web application for a single company. It gives admins tools to manage employees, departments, attendance, leave requests, payslips, and company settings. It gives employees self-service tools to manage their own attendance, leave requests, payslips, and profile.

The MVP should stay simple, but the architecture must be clean enough to grow into more advanced HR workflows later. This is also a public portfolio/demo project, so it must not include public company onboarding or public self-registration. Visitors may log in with seeded demo users, but new accounts are created only by admins inside the app.

Capabilities below describe private deployments; the public demo permits browsing only, as defined in [security](../architecture/security.md#public-demo-mutation-policy). Technical choices belong to the [architecture overview](../architecture/overview.md).

## Goals

Provide simple admin management and employee self-service across the features below, with secure ownership checks, responsive bounded data access, and auditable sensitive changes. The public portfolio demo must remain a safe, read-only seeded workspace.

## Core User Flow

- Admin: sign in → dashboard → manage departments/employees and invitations → review attendance/leave → manage payslips/settings → inspect audits.
- Employee: sign in with an existing or seeded account → dashboard → clock in/out and review attendance → request/track leave → view payslips → manage allowed profile fields.

## Features

### Authentication and Users

- Email/password login.
- No public self-registration or public company onboarding.
- Login may expose seeded demo credentials for the portfolio deployment.
- Admin and employee roles for MVP.
- Admin-created employee accounts only outside public demo mode.
- Invitation or password setup flow for new employees.
- Public demo credentials cannot create, activate, disable, or elevate reusable private accounts.
- Password reset is deferred until email delivery and the complete recovery lifecycle are implemented together.
- Logout and session invalidation.
- Backend-enforced RBAC and resource ownership checks.

### Employee and Department Management

- Admin can create, read, update, disable, and delete employee records.
- Admin can assign employees to departments.
- Admin can assign job title, hire date, manager reference, employment status, and basic profile fields.
- Admin can create, update, and delete departments.
- Employees can view their own profile.
- Employees can update only allowed self-service profile fields.
- Employee list supports pagination, search, status filters, and department filters.

### Attendance Management

- Employee can clock in.
- Employee can clock out.
- Employee can view today's attendance state.
- Employee can view their own attendance history.
- Admin can view all attendance records.
- Admin can filter attendance by employee, date range, department, and status.
- Admin can correct attendance records when needed.
- Sensitive attendance corrections create audit logs.

### Leave Management

- Admin can manage leave types.
- Employee can submit leave requests.
- Employee can view their own leave requests and statuses.
- Admin can view all leave requests.
- Admin can approve or reject leave requests.
- Leave approval/rejection creates audit logs.
- Basic leave balance support can be included if kept simple.

### Payslips and Storage

- Admin uploads payslip PDFs.
- Payslip files are stored in Cloudflare R2.
- Payslip metadata is stored in PostgreSQL.
- Employee can view/download only their own payslips.
- Admin can view and manage payslips for all employees.
- Payslip access is protected by backend policy checks.
- Public demo deployments are read-only and must run with uploads disabled. See [security](../architecture/security.md) for enforcement and enablement prerequisites.

### Settings, Audit Logs, and Admin Operations

- Admin can manage basic company settings.
- Admin can manage basic attendance and leave settings.
- Admin can review audit logs.
- Sensitive admin actions create audit log entries.
- Technical logging is separate from business audits; see [operations](../architecture/operations.md#technical-logging).

## Scope

### In Scope

The features above for one company, with `ADMIN` and `EMPLOYEE` roles, admin-controlled account setup, and a seeded public demo. Technical choices and deployment targets are defined in the [architecture overview](../architecture/overview.md).

### Out Of Scope

- Password recovery until the complete lifecycle in [security](../architecture/security.md#auth-and-collaboration-model) is delivered.
- Public self-registration or public company onboarding.
- Letting visitors create their own clean company workspace from the portfolio demo.
- Multi-company SaaS support.
- Complex custom role builder.
- Manager, HR manager, finance, or owner roles in MVP.
- Enterprise SSO, SAML, OAuth social login, passkeys, or MFA in MVP.
- Full payroll calculation engine.
- Automatic tax, deductions, bonuses, or payroll compliance.
- Biometric attendance.
- Geolocation or device-restricted attendance unless added later.
- Shift scheduling engine.
- Advanced analytics and report builder.
- Native mobile apps.
- Real-time collaboration.
- Chat, notifications center, or AI features.
- Billing and subscriptions.
- Unrestricted public demo uploads or unlimited R2 storage consumption.

## Success Criteria

1. An admin can sign in and manage employees.
2. An admin can create and manage departments.
3. An employee can sign in and access only their own data.
4. An employee can clock in and clock out.
5. An employee can view their own attendance history.
6. An employee can submit a leave request.
7. An admin can approve or reject leave requests.
8. An admin can upload a payslip PDF to Cloudflare R2.
9. An employee can view/download only their own payslips.
10. Admin-only pages and APIs are inaccessible to employees.
11. Self-service APIs do not trust employee IDs from the request body.
12. List pages are paginated and do not overfetch data.
13. Sensitive admin actions create audit logs.
14. The app can be deployed with Vercel, Render, Neon, and Cloudflare R2.
15. The login page has no public registration path.
16. New users are created only by admins or controlled seed/invitation flows.
17. The public demo cannot persist business mutations, consume R2 storage, create a fresh company workspace, or create/elevate a reusable private identity; this is covered by the Section 25 route matrix and upload regressions.
