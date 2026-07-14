# Owner Role Manager

The app supports one bootstrap owner and multiple admins without creating fake or passwordless accounts. Every owner or admin must register normally before receiving elevated access.

## Bootstrap The First Owner

1. Deploy the app and register the owner through `/register`.
2. Set `OWNER_EMAIL` to that exact registered email.
3. Choose one bootstrap method below.

Both methods update only the registered user's role and write an audit event. They do not create a user, set a password, modify `User.passwordHash`, send an invitation, or create a passwordless account.

### Host Without Console Access

Use this method on Hostinger when no console or SSH command is available:

1. Generate a one-time random secret of at least 32 characters. A 32-byte random value encoded as hexadecimal or Base64 is recommended.
2. Set `OWNER_BOOTSTRAP_TOKEN` in the production environment without committing or logging the value.
3. Restart or redeploy the app so the process receives `OWNER_EMAIL` and `OWNER_BOOTSTRAP_TOKEN`.
4. From a trusted PowerShell session, call the endpoint once:

```powershell
$headers = @{
  "x-owner-bootstrap-token" = $env:OWNER_BOOTSTRAP_TOKEN
}

Invoke-RestMethod `
  -Method Post `
  -Uri "https://rahstwistedkitchen.com/api/setup/promote-owner" `
  -Headers $headers
```

The endpoint reads the target email only from `OWNER_EMAIL`; it accepts no email or role in a request body. It rejects missing or invalid tokens, a missing registered account, and every attempt after an owner exists.

5. Confirm the response reports the configured email with role `OWNER`.
6. Remove `OWNER_BOOTSTRAP_TOKEN` from Hostinger and restart or redeploy the app again. Removing the variable disables the endpoint.
7. Sign out and sign back in as the owner, then verify `/admin/role-manager`.

Never paste the token into a URL, source file, support ticket, screenshot, or application log. The endpoint supports `POST` only; it does not support `GET`.

### Host With Console Access

Run the existing bootstrap command instead:

```powershell
npm run owner:promote
```

The command fails clearly if the account does not exist or another owner has already been bootstrapped. `OWNER_BOOTSTRAP_TOKEN` is not needed for the console command.

`ADMIN_EMAIL`, `ADMIN_ROLE`, and `npm run admin:promote` remain available only as a legacy single-account workflow. `ADMIN_EMAILS` is not required.

## Manage Admin Access

The owner can open `/admin/role-manager` after signing in. The page lists registered users and supports these roles:

- `CUSTOMER`: normal customer and account access.
- `ADMIN`: normal admin dashboard access without role management.
- `OWNER`: all admin access plus role management.

Additional admins should register normally and then be assigned `ADMIN` by the owner. The owner-only API validates each role, stores the acting owner and role transition in the audit log, and rejects removal of the last owner. Promote another owner before transferring or removing the current owner's access.

Admins and customers cannot open the Role Manager page or call its mutation API. Protected admin and owner guards verify the current database role, so a stale signed-in token does not preserve elevated server access after demotion.

## Launch QA

- Confirm the HTTP endpoint is unavailable when `OWNER_BOOTSTRAP_TOKEN` is absent.
- Confirm missing and incorrect request tokens are rejected without changing users.
- Confirm one valid call promotes only the existing `OWNER_EMAIL` account and records `OWNER_BOOTSTRAPPED` in `/admin/audit`.
- Confirm a second valid call is rejected because an owner already exists.
- Confirm the promoted user's password hash is unchanged.
- Confirm the configured owner can open `/admin/role-manager`.
- Promote at least four registered test users to `ADMIN` and confirm normal admin access.
- Confirm an admin cannot open the role page or update a role through the API.
- Confirm an anonymous user is sent to sign in and a customer receives no role-manager access.
- Confirm the last owner cannot be demoted.
- Confirm successful role transitions appear in `/admin/audit` with actor, target, previous role, new role, and timestamp.
