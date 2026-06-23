# Security hardening audit

## Reviewed and fixed in this pass

- Admin pages under `app/admin/**` now call `requireAdminPage()` directly before querying or rendering admin data. The guard redirects unauthenticated users to login and returns not found for authenticated non-admin users.
- Admin API routes under `app/api/admin/**` call `requireAdminApi()` and immediately return the guard response when authentication or authorization fails, preventing direct non-admin API calls from continuing into business logic.
- The manual paid-order route at `app/api/orders/[id]/mark-paid/route.ts` is an admin-only API even though it is outside the `/api/admin` path; it also immediately returns the admin guard response.
- Customer order pages require authentication. `app/account/orders/page.tsx` loads orders through the signed-in user's email, and `app/orders/[id]/page.tsx` returns not found unless the signed-in user owns the order email or has an admin role.
- Customer catering pages require authentication. The account catering detail page loads service requests with both the request id and signed-in user's email, preventing id-swap access to another user's request.
- Customer profile and allergen APIs use the signed-in user's email to read or update only that user's profile and allergen preferences.

## Remaining security gaps for later tasks

- Rate limiting is still needed for authentication, registration, checkout/order creation, contact/service request creation, and admin mutation endpoints.
- Audit logging is still needed for admin mutations such as order status, payment marking, menu changes, gallery changes, and business settings changes.
- MFA or stronger step-up authentication for admin users is not implemented.
- The Content Security Policy is intentionally minimal to avoid breaking existing remote images, inline styles/scripts, and framework behavior; a stricter CSP with nonces/hashes and explicit image/connect sources should be designed and tested separately.
- Upload-provider and file validation hardening were not changed in this task.
- Payment provider flow and webhook hardening were not changed in this task.
