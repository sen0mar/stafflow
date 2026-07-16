# Stafflow

Stafflow is a full-stack employee management app for a single company. It gives administrators one place to manage day-to-day people operations and gives employees a private self-service workspace.

The project is designed as a safe public portfolio demo. Visitors can use seeded accounts, but they cannot register a new company or turn the demo into their own workspace.

## Current interface

### Homepage

![Stafflow homepage in light mode](context/images/readme/homepage-light.png)

![Stafflow homepage in dark mode](context/images/readme/homepage-dark.png)

### Admin dashboard

![Stafflow admin dashboard in light mode](context/images/readme/admin-dashboard-light.png)

![Stafflow admin dashboard in dark mode](context/images/readme/admin-dashboard-dark.png)

## What Stafflow includes

| Area        | Administrators                                                          | Employees                                              |
| ----------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| Dashboard   | View company-wide attendance, leave, employee, and department summaries | View personal attendance, leave, and payslip summaries |
| Employees   | Create, invite, update, disable, and review records outside demo mode   | View and update allowed profile details                |
| Departments | Create, edit, and safely remove departments                             | View their assigned department                         |
| Attendance  | Filter records and make audited corrections                             | Clock in, clock out, and review personal history       |
| Leave       | Manage leave types and approve or reject requests                       | Submit, track, and cancel personal requests            |
| Payslips    | Upload, replace, preview, download, and delete private PDFs             | Preview and download personal payslips only            |
| Settings    | Manage company, attendance, and leave settings                          | No administrative access                               |
| Audit logs  | Search and inspect sensitive business actions                           | No administrative access                               |

Lists support pagination, search, filters, loading states, empty states, and recoverable errors. The interface is responsive and supports light and dark themes.

## Demo accounts

The login page is prefilled for the admin demo. You can switch roles from the demo account cards on that page.

| Role     | Email                       | Password       |
| -------- | --------------------------- | -------------- |
| Admin    | `admin.demo@example.com`    | `StafflowDemo` |
| Employee | `employee.demo@example.com` | `StafflowDemo` |

There is no public sign-up page. Outside the public demo, new accounts are created by an administrator and completed through a controlled invitation link. With `DEMO_MODE=true`, the API blocks employee/account creation, invitation generation and acceptance, account-status changes, and account elevation with the stable `DEMO_READ_ONLY` error.

## Technology

- **Frontend:** React, TypeScript, Vite, React Router, Tailwind CSS, and shadcn/ui primitives
- **Data and forms:** TanStack Query, React state, React Hook Form, and Zod
- **Backend:** Node.js, Express, TypeScript, and native `fetch`
- **Database:** PostgreSQL on Neon with Prisma ORM and Prisma migrations
- **Authentication:** database-backed sessions stored in HTTP-only cookies
- **File storage:** private Cloudflare R2 objects for payslip PDFs
- **Logging:** Pino for technical logs and PostgreSQL audit records for sensitive actions
- **Hosting:** Vercel for the client and Render for the API

## How it works

```mermaid
flowchart LR
  Client["React client"] -->|Cookie-authenticated requests| API["Express API"]
  API --> Security["Session, CSRF, RBAC, and ownership checks"]
  API --> Database["Prisma + PostgreSQL"]
  API --> Storage["Private Cloudflare R2 storage"]
  API --> Logging["Pino logs + audit records"]
```

The frontend is organized by feature in `client/src/features`. Shared components, layouts, API utilities, and permission helpers live in `client/src/shared`.

The backend follows the same domain structure in `server/src/modules`. Controllers handle HTTP concerns, services enforce business rules, repositories access Prisma, and policies protect individual resources.

## Security and demo safety

- Sessions use secure HTTP-only cookies; auth tokens are never stored in `localStorage`.
- Session tokens are hashed before they are saved to the database.
- State-changing requests are protected against CSRF.
- Authentication, role permissions, and record ownership are enforced by the API.
- Employee endpoints derive identity from the signed-in session instead of trusting an employee ID from the browser.
- Payslip PDFs remain private. The database stores file metadata and object keys, not PDF contents.
- Passwords, cookies, tokens, hashes, files, and private signed URLs are excluded from logs.
- Employee changes, attendance corrections, leave decisions, payslip changes, password events, and settings updates create audit records.
- Demo mode protects seeded passwords, blocks identity-persistence mutations with `DEMO_READ_ONLY`, and blocks file uploads unless uploads are explicitly enabled.

## Run locally

### Requirements

- Node.js and npm
- A PostgreSQL database
- Cloudflare R2 credentials only if you want to test payslip file operations

### 1. Install dependencies

Run this from the repository root:

```bash
npm install
```

### 2. Configure the environment

```bash
cp .env.local.example .env.local
```

At minimum, set:

```dotenv
NODE_ENV=development
PORT=4000
CLIENT_URL=http://localhost:5173
DATABASE_URL=your_pooled_postgresql_url
DIRECT_URL=your_direct_postgresql_url
DEMO_MODE=true
DEMO_UPLOADS_ENABLED=false
```

`DIRECT_URL` is recommended for migrations but is optional; Prisma falls back to `DATABASE_URL` when it is not provided.

To enable payslip storage outside the protected public demo, also configure:

```dotenv
PAYSLIP_MAX_UPLOAD_BYTES=2097152
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=your_private_bucket
```

### 3. Apply migrations and seed demo data

```bash
npm run db:migrate:deploy
npm run db:seed
```

Stafflow uses Prisma migrations only. Do not use `prisma db push` or reset a shared database.

### 4. Start the app

Start the API:

```bash
npm run dev:server
```

In a second terminal, start the client:

```bash
npm run dev:client
```

Open `http://localhost:5173`. The API runs on `http://localhost:4000` by default.

## Useful commands

| Command                          | Purpose                                         |
| -------------------------------- | ----------------------------------------------- |
| `npm run dev:client`             | Start the Vite client                           |
| `npm run dev:server`             | Start the Express API                           |
| `npm run build`                  | Build all workspaces                            |
| `npm run typecheck`              | Type-check the client and server                |
| `npm run lint`                   | Run workspace lint checks                       |
| `npm run test`                   | Run the test suites                             |
| `npm run format:check`           | Check formatting                                |
| `npm run db:migrate:status`      | Inspect Prisma migration status                 |
| `npm run db:migrate:deploy`      | Apply existing Prisma migrations                |
| `npm run db:maintain-auth`       | Prune terminal auth rows past retention         |
| `npm run db:seed`                | Seed the demo company and users                 |
| `npm run db:seed:check`          | Verify the seeded baseline                      |
| `npm run db:bootstrap-demo-auth` | Create or repair production demo login accounts |

## Project structure

```text
stafflow/
├── client/                 React application
│   └── src/
│       ├── app/            Router, providers, and app setup
│       ├── features/       Auth and business feature modules
│       └── shared/         Reusable UI, layouts, hooks, and utilities
├── server/                 Express API
│   └── src/
│       ├── core/           Auth, errors, logging, security, and utilities
│       └── modules/        Domain routes, services, repositories, and policies
├── prisma/                 Schema, migrations, and seed scripts
└── context/                Product, architecture, UI, and workflow documentation
```

## Deployment

The intended production setup is:

- Vercel serves the built client and rewrites SPA routes to `index.html`.
- Render runs the compiled Express server.
- Neon hosts PostgreSQL.
- Cloudflare R2 stores private payslip PDFs.

Set `CLIENT_URL` to the exact deployed frontend origin. Configure `VITE_API_URL` in the Vercel project when the API uses a separate Render origin. Production cookies require HTTPS, and the frontend and API must use matching credentialed CORS settings.

For a public portfolio deployment, keep `DEMO_MODE=true` so public credentials cannot create, activate, disable, or elevate reusable private accounts. Keep `DEMO_UPLOADS_ENABLED=false` unless a separate upload quota and cleanup policy has been put in place.

Public auth throttling is a provider control, not process-local middleware. Follow [the Cloudflare edge-throttling runbook](deployment/public-auth-edge-throttling.md), including disabling the direct Render hostname, before considering login and token traffic externally bounded.

Auth lifecycle cleanup is declared as a daily Render cron job in `render.yaml`. Follow [the auth-table maintenance runbook](deployment/auth-table-maintenance.md) to activate the Blueprint cron, provide its database secret, trigger an initial run, and verify retention behavior. Repository configuration alone does not prove that the external cron is active.
