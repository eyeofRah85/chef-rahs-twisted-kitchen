# Password Management Review

## Executive Summary

The app already supports the desired no-temporary-password owner and admin workflow. Every person registers through the normal credentials flow, the first registered owner is promoted with `OWNER_EMAIL` and `npm run owner:promote`, and that owner promotes additional registered users from `/admin/role-manager`. Neither promotion path creates an account or sets a password.

Logged-in password change is not implemented, but the core feature can be added without a Prisma migration because `User.passwordHash` already stores the credential hash. The minimum launch implementation should require the current password, apply one shared password policy, update the hash with the existing bcrypt cost, and sign the current browser out so the user must authenticate with the new password.

Forgot/reset password is also absent. A token-only reset could technically reuse the existing Auth.js `VerificationToken` table, but the recommended launch-safe implementation should use a purpose-specific reset-token model and a `User.authVersion` field so a reset can invalidate every existing JWT session. That recommendation requires an additive MySQL/MariaDB migration.

## Current Auth Architecture

### User And Credential Data

- `prisma/schema.prisma` defines `User.passwordHash` as nullable `String?`.
- Users created by `POST /api/register` receive a password hash. The nullable shape remains compatible with adapter-managed users that might not have a local credential, although only the credentials provider is currently configured.
- `User` also has the standard Auth.js `Account[]` and `Session[]` relations.
- The schema contains `VerificationToken` with `identifier`, unique `token`, and `expires` fields.
- No password reset token is created or consumed anywhere in the current app.

### Registration

`app/register/page.tsx` posts a standard form to `app/api/register/route.ts`. The route:

1. Applies the `accountCreate` IP-based rate limit.
2. Normalizes the email to lowercase.
3. Requires name, email, and a password of at least 8 characters.
4. Rejects an existing email.
5. Hashes the password with `bcryptjs` using cost factor 12.
6. Creates the user and redirects to `/login`.

The registration form has one password field and no confirmation field, shared password-policy helper, common-password check, or bcrypt truncation check.

### Login And Sessions

`auth.ts` configures Auth.js with the Prisma adapter, the credentials provider, and `session.strategy = "jwt"`.

- The credentials provider looks up the normalized email.
- It rejects a missing user or a user without `passwordHash`.
- It verifies the password with `bcrypt.compare`.
- The JWT stores the user role; the session callback exposes user ID and role.
- There is no shared hash/verify helper outside `auth.ts` and the registration route.
- There is no password timestamp or session-version claim.

Because credentials sessions are JWT-based, updating `passwordHash` does not by itself revoke JWT cookies already issued on other devices. The schema's `Session` table is not the active store for these credentials sessions, so deleting `Session` rows would not provide reliable global revocation.

### Account Updates

The account dashboard is login-only. `app/api/account/profile/route.ts`, `app/api/profile/route.ts`, and the allergen routes update profile data after checking the Auth.js session. There is no account security page, password form, or password API.

The existing `requireAuthApi()` helper is the appropriate starting guard for a password-change endpoint. The endpoint should resolve the persisted user by the authenticated user ID when available, rather than accepting an email or user ID from the request body.

### Email Support

`lib/email.ts` provides the Resend client, `sendAppEmail`, dry-run/preview modes, and the trusted `NEXT_PUBLIC_APP_URL`-based `appUrl`. Existing branded transactional email components can support a future reset email.

A reset URL must be built from the configured trusted app URL, not an incoming `Host` header. Reset secrets must not be written to audit logs, normal application logs, or production preview files.

## Direct Answers

1. **Where is the password hash stored?** In `User.passwordHash` in the MySQL/MariaDB database.
2. **What hashing algorithm/library is used?** `bcryptjs` (`bcrypt`) with cost factor 12 at registration.
3. **Are verification helpers already present?** Login directly calls `bcrypt.compare`; there is no shared password helper or shared policy.
4. **Can logged-in password change be added without schema changes?** Yes. Current-password verification, hashing, and replacement all fit the current model. Global JWT revocation would be a separate schema-backed enhancement.
5. **Should change password require the current password?** Yes. An authenticated session alone is insufficient for this sensitive action.
6. **Should the user stay logged in?** No for the minimum launch flow. Sign out the current browser after success and require login with the new password. Revoking sessions on every other device requires an auth-version mechanism.
7. **What should the new-password rules be?** Use one policy for registration, change, and reset: minimum 15 characters for the current single-factor setup; allow spaces, Unicode, and password-manager paste; avoid composition rules; reject common/compromised choices; require confirmation; reject reuse of the current password; and reject values that `bcrypt.truncates()` reports would exceed bcrypt's 72-byte input limit.
8. **Is forgot/reset password already present?** No. There are no routes, pages, email template, or token lifecycle for it.
9. **Does forgot/reset need a migration?** A basic token flow could reuse `VerificationToken`, but the recommended reset plus reliable all-session revocation needs an additive migration for a dedicated reset-token model and `User.authVersion`.
10. **Should reset be launch scope?** Preferably yes, in a separate security-focused branch before public launch. Without it, a locked-out owner or admin has no safe self-service recovery path, and using temporary passwords would conflict with the desired operating model.

## No-Temporary-Password Owner And Admin Setup

The current role workflow already matches the requirement:

1. Deploy the app and open `/register`.
2. The owner registers with their own password.
3. Set `OWNER_EMAIL` to that exact registered email.
4. Run `npm run owner:promote` once.
5. Future admins register normally with their own passwords.
6. The owner promotes them to `ADMIN` in `/admin/role-manager`.

Do not add password fields to Role Manager. Owners and admins must not set, view, email, or generate another user's password. Role changes and password management should remain separate authorization boundaries.

If the owner or an admin forgets a password, the recovery path should be the same email-token reset used by customers. Database edits and temporary shared passwords should not become routine operations.

## Recommended Logged-In Password Change

### UI

Add an account security page or compact security section under `/account` with:

- Current password.
- New password.
- Confirm new password.
- Clear policy guidance.
- Standard password-manager attributes: `autocomplete="current-password"` and `autocomplete="new-password"`.

Do not display the stored hash, offer an admin password override, or accept a target user identifier.

### API

Add an authenticated endpoint such as `POST /api/account/password`:

1. Require an active authenticated session with `requireAuthApi()`.
2. Resolve the persisted user from `session.user.id`, with the existing session-email fallback only if needed.
3. Return an authorization-safe error if the user no longer exists or has no local password hash.
4. Apply both IP and account/user rate limiting.
5. Verify the submitted current password with `bcrypt.compare`.
6. Validate and confirm the new password with a shared helper.
7. Reject the new password if it matches the current password.
8. Hash it with bcrypt cost 12 and update only the authenticated user's `passwordHash`.
9. Do not change role, profile fields, orders, or account ownership.
10. Return success without returning the hash or password.
11. Sign the current browser out and direct the user to log in again.

Use a generic failure message for an incorrect current password. Never include password values in logs, validation telemetry, audit metadata, or error objects.

### Shared Password Helper

Create a server-only helper for:

- Password policy validation.
- `bcrypt.truncates()` protection.
- Hashing with the single configured work factor.
- Secure comparison.

Use that helper from registration, login, password change, and password reset so the accepted password rules cannot drift. Existing hashes do not need to be re-hashed in bulk; a later helper may detect and upgrade an older work factor after successful login.

### Session Decision

The migration-free implementation can delete the current Auth.js cookie by calling `signOut` after a successful change. It cannot invalidate JWTs held by other devices.

For complete revocation, add `User.authVersion Int @default(0)`, copy the version into the JWT at sign-in, and reject a JWT whose version differs from the persisted user. Increment the version whenever a password changes or resets. This is especially valuable for owner/admin accounts and should be implemented with the reset phase rather than approximated by deleting inactive database `Session` rows.

## Recommended Forgot/Reset Password

### Data Model

Prefer an additive model dedicated to password recovery:

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, expiresAt])
}
```

Add the matching `passwordResetTokens` relation and `authVersion Int @default(0)` to `User`. The migration must be additive and MySQL/MariaDB-compatible.

The existing `VerificationToken` shape could store a namespaced identifier, hashed token, and expiration without a migration. It is not recommended here because it is an Auth.js adapter model and does not clearly express reset usage or consumed-token state. A dedicated model reduces accidental coupling if an Auth.js email provider is added later.

### Forgot-Password Request

1. Accept a normalized email at `/forgot-password`.
2. Always return the same message and status whether or not the user exists.
3. Apply rate limits by both IP and normalized account identifier. The current process-local limiter alone is not durable across multiple production processes, so use a production-capable shared limiter or an equivalent Hostinger/WAF control for this public endpoint.
4. If the user exists, invalidate prior unused reset tokens for that user.
5. Generate a cryptographically random, high-entropy token.
6. Store only a cryptographic hash of the token with a short expiration, such as 30 minutes.
7. Send the raw token once in an HTTPS URL built from configured `appUrl`.
8. Keep the public response generic even if email delivery fails; record operational failure without recording the token.

### Reset Submission

1. Hash the submitted token and find one matching, unused, and unexpired record.
2. Validate and confirm the new password with the same shared policy.
3. In one transaction, update `passwordHash`, increment `authVersion`, mark or delete the token, and invalidate all other reset tokens for that user.
4. Send a notification that the password changed, without including either password or reset token.
5. Do not automatically sign the user in. Send them through the normal login flow.
6. Ensure reset pages use a no-referrer policy so the token is not leaked through navigation headers.

## Migration Findings

| Capability | Migration | Reason |
| --- | --- | --- |
| Logged-in change with current-browser sign-out | No | Existing `User.passwordHash` is sufficient. |
| Revoke every JWT session after change/reset | Yes | JWT sessions need persisted version/revocation state such as `User.authVersion`. |
| Minimal reset token using `VerificationToken` | No, technically | Existing fields can represent a namespaced hashed token and expiration. |
| Recommended reset lifecycle | Yes | A dedicated model makes purpose, expiration, consumption, cleanup, and future Auth.js email-provider separation explicit. |

## Security Safeguards

- Require the current password for logged-in changes.
- Require TLS for login, account security, and reset pages.
- Use a consistent password policy across registration, change, and reset.
- Do not silently truncate bcrypt inputs; explicitly reject inputs over bcrypt's 72-byte limit.
- Permit password managers, autofill, paste, spaces, and Unicode.
- Do not require periodic password rotation or arbitrary character-class composition.
- Compare proposed passwords against a maintained common/compromised-password blocklist.
- Rate-limit login, change, forgot, and reset attempts by more than IP alone where practical.
- Keep forgot-password responses uniform to resist account enumeration.
- Store reset-token hashes, not raw tokens; make them high entropy, short-lived, and single use.
- Invalidate outstanding reset tokens after success.
- Sign out after a password change; invalidate all sessions after a reset.
- Never log passwords, hashes, raw reset tokens, full reset URLs, or request bodies containing secrets.
- Keep `EMAIL_PREVIEW_FILES=false` in production and complete the documented live internal Resend test.
- Preserve role checks: password possession must not grant `ADMIN` or `OWNER`, and role management must not grant password-reset powers.

These recommendations follow the [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html), [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), and [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html).

## Likely Implementation Files

### Logged-In Change

- `lib/passwords.ts` - shared policy, bcrypt truncation guard, hash, and compare helpers.
- `app/api/account/password/route.ts` - authenticated current-password change.
- `app/account/security/page.tsx` or `app/account/page.tsx` - account security entry point.
- `components/account/ChangePasswordForm.tsx` - accessible client form and sign-out transition.
- `app/api/register/route.ts` and `app/register/page.tsx` - align registration with the shared policy and confirmation behavior.
- `auth.ts` - consume the shared compare helper without changing credentials behavior.
- `lib/rate-limit.ts` - focused password-change limit; a durable production limiter remains a separate infrastructure decision.

### Reset And Revocation

- `prisma/schema.prisma` and a new MySQL/MariaDB migration.
- `app/forgot-password/page.tsx` and `app/reset-password/page.tsx`.
- `app/api/auth/forgot-password/route.ts` and `app/api/auth/reset-password/route.ts`.
- `emails/PasswordResetEmail.tsx` and `emails/PasswordChangedEmail.tsx`.
- `auth.ts` and `types/next-auth.d.ts` for the auth-version JWT claim.
- `lib/email.ts` only if a narrow shared helper is needed; do not change existing recipients or delivery triggers.
- `lib/rate-limit.ts` or the selected production rate-limit adapter.

Avoid folding the duplicate profile APIs into this work. They are worth reconciling later, but that is unrelated to password safety.

## Implementation Phases

### Phase 1: Logged-In Password Change

- Add the shared password helper and policy.
- Add the self-service account security form and authenticated endpoint.
- Require current password and new-password confirmation.
- Force current-browser sign-out after success.
- Align registration with the shared policy.
- Do not add owner/admin password-management controls.

Recommended branch: `feature/account-password-change`.

### Phase 2: Password Reset And Global Session Revocation

- Add `PasswordResetToken` and `User.authVersion` through an additive migration.
- Add generic-response forgot-password request handling.
- Add hashed, expiring, single-use reset tokens and branded Resend email.
- Add transactional reset, all-session invalidation, and password-changed notification.
- Complete dry-run and controlled internal live-email QA before launch.

Recommended branch: `feature/password-reset-and-session-revocation`.

### Phase 3: Post-Launch Hardening

- Move auth abuse limits to a durable shared store or verified edge/WAF control.
- Add a maintained compromised-password check if it is not completed in Phase 1.
- Review Argon2id for new hashes and opportunistic bcrypt migration on successful login.
- Consider a user-facing active-session list and explicit "sign out all devices" action.
- Add MFA for the owner and admins.

Recommended branch: `security/auth-hardening`.

## Risks And Edge Cases

- **Existing JWTs:** changing only `passwordHash` does not invalidate tokens on other devices.
- **Nullable hash:** a future adapter-created user may have no local password; do not fabricate one or expose whether one exists publicly.
- **Bcrypt truncation:** the current code does not guard the 72-byte bcrypt limit.
- **Policy drift:** registration and future change/reset routes will disagree unless they share one helper.
- **Account enumeration:** forgot-password responses and timing must not reveal whether an email exists.
- **Email availability:** owner/admin recovery depends on verified Resend delivery and control of the registered email address.
- **Token leakage:** query-string tokens can leak through logs, analytics, referrers, screenshots, or production preview files unless handled carefully.
- **Race conditions:** token consumption and password update must be transactional so a token cannot succeed twice.
- **Process-local limits:** the current in-memory limiter is useful but not sufficient as the only production defense for reset-email flooding or distributed guessing.
- **Role continuity:** a password change/reset must not modify the user's role. Existing owner/admin guards should continue checking persisted roles.

## Manual QA Checklist

### Password Change

- Customer, admin, and owner can each change only their own password.
- Anonymous requests receive `401` and cannot select a target account.
- Wrong current password is rejected with no hash update.
- New-password mismatch is rejected.
- Too-short, blocklisted, and bcrypt-truncated passwords are rejected.
- A valid password change uses a new bcrypt cost-12 hash.
- The old password no longer signs in; the new password does.
- The current browser is signed out after success.
- User role, profile, orders, and admin permissions are unchanged.
- Repeated failed attempts are rate-limited.
- Logs and audit records contain no password, hash, or form body.

### Forgot/Reset

- Existing and nonexistent emails receive the same public response.
- Only an existing account receives an email.
- Reset email uses the configured HTTPS app URL and intended recipient.
- Raw tokens are absent from the database and logs.
- Expired, malformed, already-used, and superseded tokens fail.
- A valid token works exactly once.
- Reset and token consumption occur atomically.
- All prior JWT sessions fail after `authVersion` increments.
- The user must log in normally after reset.
- A password-changed notification is sent without secret data.
- Resend dry-run validates rendering/triggers, then a controlled internal live test validates delivery.

### Owner/Admin Workflow

- The owner registers normally before `npm run owner:promote`.
- Promotion never creates or changes a password.
- Additional admins register normally and are promoted in Role Manager.
- Owner/admin cannot view or assign another user's password.
- Role Manager remains owner-only.
- A password change/reset does not change `CUSTOMER`, `ADMIN`, or `OWNER` role state.

## Recommendation

Implement `feature/account-password-change` first as the minimum launch requirement. It needs no migration and removes the immediate need for temporary passwords while preserving the established register-then-promote workflow.

Implement `feature/password-reset-and-session-revocation` as a separate, preferably pre-launch security branch. Treat it as required before relying on customer or staff accounts without manual recovery. Keep its migration additive, use MySQL/MariaDB syntax, and deploy it in production with `npx prisma migrate deploy`.
