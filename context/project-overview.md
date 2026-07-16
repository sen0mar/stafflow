# Employee Management System

## Overview

The Employee Management System is a full-stack web application for a single company. It gives admins tools to manage employees, departments, attendance, leave requests, payslips, and company settings. It gives employees self-service tools to manage their own attendance, leave requests, payslips, and profile.

The MVP should stay simple, but the architecture must be clean enough to grow into more advanced HR workflows later. This is also a public portfolio/demo project, so it must not include public company onboarding or public self-registration. Visitors may log in with seeded demo users, but new accounts are created only by admins inside the app.

## Goals

1. Let admins manage employee records and department structure.
2. Let employees access a secure self-service workspace.
3. Track employee attendance with simple clock-in/clock-out behavior.
4. Let employees submit leave requests and admins approve or reject them.
5. Let admins upload payslip PDFs and employees view/download their own payslips.
6. Provide basic company, attendance, and leave settings.
7. Enforce secure authentication and role-based access control.
8. Keep the app performant through pagination, narrow API responses, caching, and clean query patterns.
9. Preserve auditability for sensitive admin and employee actions.
10. Protect the public demo from becoming a reusable company workspace or an unbounded Cloudflare R2 storage surface.

## Core User Flow

Admin flow:

1. Admin signs in.
2. Admin opens the dashboard.
3. Admin creates departments and employee records from inside the app.
4. Admin invites employees or activates accounts.
5. Admin reviews attendance records.
6. Admin reviews leave requests and approves or rejects them.
7. Admin uploads payslip PDFs for employees.
8. Admin updates basic company/settings data.
9. Admin reviews audit logs when needed.

Employee flow:

1. Employee signs in with an existing account or seeded demo credentials. There is no public sign-up flow.
2. Employee views their dashboard.
3. Employee clocks in or clocks out.
4. Employee reviews their own attendance history.
5. Employee submits a leave request.
6. Employee tracks leave request status.
7. Employee views/downloads their own payslips.
8. Employee views or updates allowed profile fields.

## Features

### Authentication and Users

- Email/password login.
- No public self-registration or public company onboarding.
- Login may expose seeded demo credentials for the portfolio deployment.
- HTTP-only cookie-based session auth.
- bcrypt password hashing.
- Admin and employee roles for MVP.
- Admin-created employee accounts only outside public demo mode.
- Invitation or password setup flow for new employees.
- Public visitors cannot create clean company accounts from the login page.
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
- The database must not store PDF contents.
- Public demo deployments must not expose unrestricted R2 writes; uploads should be disabled, tightly quota-limited, or cleaned up automatically in demo mode.

### Settings, Audit Logs, and Admin Operations

- Admin can manage basic company settings.
- Admin can manage basic attendance and leave settings.
- Admin can review audit logs.
- Sensitive admin actions create audit log entries.
- Technical logs are handled separately with Pino.

## Scope

### In Scope

- React + TypeScript + Vite frontend.
- Tailwind CSS and shadcn/ui component foundation.
- TanStack Query for server state.
- Zustand for local client/UI state.
- Native `fetch` wrapper for API requests. No Axios.
- Express + TypeScript backend.
- PostgreSQL on Neon with Prisma ORM.
- First-party email/password auth.
- No public registration route or login-page sign-up flow.
- Admin-only employee/user creation and invitation/password setup flow.
- Seeded demo users for the portfolio deployment.
- bcrypt password hashing.
- Database-backed sessions using HTTP-only cookies.
- MVP roles: `ADMIN` and `EMPLOYEE`.
- RBAC middleware and resource ownership policies.
- Employee management.
- Department management.
- Attendance clock-in/clock-out and history.
- Leave request creation and approval/rejection.
- Payslip PDF upload to Cloudflare R2.
- Employee payslip viewing/downloading.
- Demo-mode protection for storage-consuming actions when the app is publicly deployed.
- Basic settings.
- Audit logs for sensitive actions.
- Pino technical logging.
- Vercel frontend deployment.
- Render backend deployment.
- One custom domain with frontend and API subdomains.

### Out Of Scope

- Public forgot-password and reset-password flows until delivery, atomic single-use token consumption, demo-account protection, throttling, expiry cleanup, and end-to-end coverage are implemented together.
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
17. The public demo cannot be used to consume unbounded R2 storage, create a fresh company workspace, or create/elevate a reusable private identity.
