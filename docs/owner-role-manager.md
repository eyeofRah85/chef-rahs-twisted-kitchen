# Owner Role Manager

The app supports one bootstrap owner and multiple admins without creating fake or passwordless accounts. Every owner or admin must register normally before receiving elevated access.

## Bootstrap The First Owner

1. Deploy the app and register the owner through `/register`.
2. Set `OWNER_EMAIL` to that exact registered email.
3. Run:

```powershell
npm run owner:promote
```

The command updates that existing user to `OWNER` and records an audit event. It fails clearly if the account does not exist or another owner has already been bootstrapped. It never creates a user.

`ADMIN_EMAIL`, `ADMIN_ROLE`, and `npm run admin:promote` remain available only as a legacy single-account workflow. `ADMIN_EMAILS` is not required.

## Manage Admin Access

The owner can open `/admin/role-manager` after signing in. The page lists registered users and supports these roles:

- `CUSTOMER`: normal customer and account access.
- `ADMIN`: normal admin dashboard access without role management.
- `OWNER`: all admin access plus role management.

Additional admins should register normally and then be assigned `ADMIN` by the owner. The owner-only API validates each role, stores the acting owner and role transition in the audit log, and rejects removal of the last owner. Promote another owner before transferring or removing the current owner's access.

Admins and customers cannot open the Role Manager page or call its mutation API. Protected admin and owner guards verify the current database role, so a stale signed-in token does not preserve elevated server access after demotion.

## Launch QA

- Confirm the configured owner can open `/admin/role-manager`.
- Promote at least four registered test users to `ADMIN` and confirm normal admin access.
- Confirm an admin cannot open the role page or update a role through the API.
- Confirm an anonymous user is sent to sign in and a customer receives no role-manager access.
- Confirm the last owner cannot be demoted.
- Confirm successful role transitions appear in `/admin/audit` with actor, target, previous role, new role, and timestamp.
