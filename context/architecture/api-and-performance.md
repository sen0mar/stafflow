# API and Performance

For session/CSRF requirements see [security](security.md); response shapes and query-key conventions belong to [code standards](../development/code-standards.md#express-api). Calendar fields follow [domain policies](domain-policies.md#calendar-date-and-timestamp-contracts).

## API and Data Flow Model

The API is REST-based. GraphQL is out of scope for the MVP.

API rules:

- Use JSON request/response bodies except file uploads.
- Use `multipart/form-data` for payslip uploads.
- Use pagination on all list endpoints.
- Accept pagination pages only as safe integers from 1 through 10,000; with the shared 100-row limit ceiling, Prisma offsets therefore remain finite and safely bounded.
- URL-backed frontend page state accepts only positive safe integers and falls back before issuing a list request.
- Use search and filters through query parameters.
- Bound API IDs to 128 characters, search terms to 200 characters, emails to 254 characters, and public invitation tokens to 128 characters through shared boundary schemas.
- Incoming request IDs must be 1–64 ASCII characters matching `[A-Za-z0-9][A-Za-z0-9._:-]*`; otherwise generate a UUID.
- Use the error response shape in [code standards](../development/code-standards.md#express-api).
- Use `fetch` on the frontend through a small typed API wrapper. Do not use Axios.
- Set `credentials: "include"` in frontend requests because auth uses cookies.
- Keep API response payloads narrow; return only fields needed by the current view.

Expected high-level route groups:

- `/auth/*`
  - No public `/auth/register` endpoint for the MVP/demo.
- `/employees/*`
- `/departments/*`
- `/attendance/*`
- `/leave-types/*`
- `/leave-requests/*`
- `/payslips/*`
- `/settings/*`
- `/audit-logs/*`

## Performance Model

The app should feel fast under normal single-company usage. Performance is achieved through bounded data access, caching, and clean rendering — not by overengineering early.

Frontend performance rules:

- Use TanStack Query for server state and cache invalidation.
- Relationship selectors whose cardinality is not strictly capped use debounced server search with a small bounded first page and a detail lookup to preserve selected values outside the current result page; they never fetch every page to build an option list.
- Keep local UI state in React; introduce a dedicated client-state store only for a demonstrated cross-feature need.
- Avoid fetching all records when a paginated table is needed.
- Use route-level code splitting where appropriate.
- Use skeleton states for slow network actions.
- Debounce search inputs.
- Keep debounced search drafts synchronized with external URL/filter values so history navigation and parent-driven resets cannot leave stale controls visible.
- Memoize expensive derived values only when there is a measured or obvious benefit.
- Virtualize large tables when row counts can become large.

Backend/database performance rules:

- Use Prisma `select` to avoid overfetching sensitive or unnecessary fields.
- Avoid N+1 queries.
- Add indexes for common filters and joins.
- Log slow requests and slow database paths.
- Keep heavy calculations out of page-load endpoints where possible.
- Do not upload files to R2 before authentication, authorization, and file validation.
- Treat unique B-tree indexes as sufficient for exact lookups on the same ordered columns; do not retain identical non-unique duplicates.
- Capture deployment slow-query evidence and inspect representative plans before adding trigram, full-text, or other search-specific infrastructure. Ordinary B-tree indexes do not solve `contains`/case-insensitive search.
- Keep bounded offset pagination and the current dashboard query fan-out until measurements show a real problem.

Important indexes to consider early:

- `User.email`
- `Session.tokenHash`
- `Employee.userId`
- `Employee.departmentId`
- `Employee.employeeCode`
- `Employee.status`
- `AttendanceRecord.employeeId + date`
- `LeaveRequest.employeeId + status`
- `LeaveRequest.status + createdAt`
- `Payslip.employeeId + year + month`
- `AuditLog.actorUserId + createdAt`
- `AuditLog.entityType + entityId`
