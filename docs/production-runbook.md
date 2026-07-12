# Production Deployment Runbook

Date: July 9, 2026

Use this runbook to prepare, deploy, verify, and recover the production Chef Rah's Twisted Kitchen app at `https://rahstwistedkitchen.com`.

This is a documentation-only launch guide. It does not enable automated online checkout, change email sending behavior, or change the production upload posture.

## 1. Node.js Runtime

Use Node.js 24 LTS for local release builds and production builds.

Node.js Current releases, including Node 26, should not be used for production builds unless the exact version has been explicitly verified with this project. A local build on Node.js v26.4.0 completed successfully, but it showed toolchain instability:

- a Turbopack Rust panic message during build,
- a `DEP0205` deprecation warning from `@tailwindcss/node` using `module.register()`,
- the warning came from the dependency/toolchain layer, not from app code.

Treat Node 26 build output as a signal to switch back to the recommended LTS runtime before deployment. Keep the production host, local release machine, and CI build environment on Node.js 24 LTS unless a future upgrade is tested and documented.

## 2. Production Environment Variable Checklist

Configure these variables in the production host before deploying:

| Variable | Production value or note |
| --- | --- |
| `DATABASE_URL` | Production MySQL/MariaDB connection string. The Prisma datasource is `provider = "mysql"` and the app uses the MariaDB Prisma adapter. |
| `AUTH_SECRET` | Production-only Auth.js secret, at least 32 characters. Generate a new secret; do not reuse local values. |
| `AUTH_URL` | `https://rahstwistedkitchen.com` |
| `NEXTAUTH_URL` | `https://rahstwistedkitchen.com` |
| `NEXT_PUBLIC_APP_URL` | `https://rahstwistedkitchen.com` |
| `BUSINESS_TIME_ZONE` | `America/New_York` unless the business confirms another timezone. |
| `RESEND_API_KEY` | Production Resend API key. |
| `EMAIL_FROM_ADDRESS` | Verified production sender, such as `Chef Rah's Twisted Kitchen <orders@rahstwistedkitchen.com>`. |
| `EMAIL_DRY_RUN` | `false` only when ready for live customer email. |
| `EMAIL_PREVIEW_FILES` | `false` in production. |
| `ALLOW_LOCAL_UPLOADS_IN_PRODUCTION` | `false` or unset. Keep local production uploads disabled for launch. |

Workflow-specific variables:

| Variable | Production value or note |
| --- | --- |
| `ADMIN_EMAIL` | First admin user's registered email before running `npm run admin:promote`. |
| `ADMIN_ROLE` | Defaults to `ADMIN`; use `OWNER` only for the primary owner account. |

Legacy/optional payment variables:

- Legacy Stripe environment variables may remain documented or blank while current env parsing exists.
- Stripe is not the planned launch provider.
- Square and PayPal are the selected future automated checkout providers, but no Square or PayPal API credentials are required for launch because automated online checkout remains disabled.

## 3. Database Setup

The app currently uses Prisma with a MySQL datasource and the MariaDB adapter. Provision a production MySQL/MariaDB-compatible database before deploy.

Database setup checklist:

1. Create the production database and database user.
2. Grant the app user only the permissions needed to run migrations and operate the app.
3. Confirm the database is reachable from the production host.
4. Store the production connection string in `DATABASE_URL`.
5. Run the current Prisma migrations against a fresh MySQL/MariaDB database.
6. Take a baseline backup before launch migrations.

PowerShell connection-string shape:

```powershell
$env:DATABASE_URL = "mysql://USER:PASSWORD@HOST:3306/DATABASE"
```

Do not point production at a local database, a development database, a throwaway preview database, or any old PostgreSQL database from earlier project assumptions.

## 4. Prisma Migration And Deploy Steps

Run the current Prisma migrations against the fresh production MySQL/MariaDB database after the production environment is configured and before opening the site to customers.

Recommended production sequence:

```powershell
npm ci
npm run prisma:generate
.\node_modules\.bin\prisma.cmd migrate deploy
npm run build
```

If the host uses Linux shell commands instead of PowerShell, the Prisma deploy command is:

```bash
npx prisma migrate deploy
```

After migrations, confirm the app can boot with the production environment. Do not use `prisma migrate dev` in production.

Current migration inventory:

- `20260708130546_init_mysql`
- `20260711010132_add_weekly_plan_slot_selections`
- `20260711014741_add_weekly_slot_option_selections`
- `20260711145356_add_weekly_package_flags_and_slot_labels`
- `20260711182000_add_weekly_offering_breakfast_only`

## 5. Seed And Setup Notes

The production-safe foundation seed is configured in `prisma.config.ts` and `package.json`. It creates common allergens and default business settings with upserts.

Run only after migrations:

```powershell
.\node_modules\.bin\prisma.cmd db seed
```

Do not run demo data in production:

```powershell
npm run db:seed-demo
```

Launch menu items, weekly meal plan periods, offerings, gallery images, pricing, and business settings should be reviewed and configured through the admin UI after the first admin account is promoted.

## 6. First Admin Account Creation And Promotion

The promotion script only promotes an existing registered user. It does not create the account.

Steps:

1. Deploy the app with production env vars.
2. Register the first admin/owner account through the production `/register` page.
3. Set `ADMIN_EMAIL` to that exact registered email.
4. Set `ADMIN_ROLE` to `ADMIN` or `OWNER`.
5. Run the promotion script:

```powershell
$env:ADMIN_EMAIL = "owner@example.com"
$env:ADMIN_ROLE = "OWNER"
npm run admin:promote
```

After promotion, sign out and sign back in, then confirm `/admin` loads for the promoted account.

## 7. Resend Setup Notes

Before setting `EMAIL_DRY_RUN=false`, finish Resend production setup:

1. Verify the sending domain in Resend.
2. Add the required DNS records at Hostinger or the active DNS provider.
3. Confirm Resend shows the sender domain as verified.
4. Set `RESEND_API_KEY`.
5. Set `EMAIL_FROM_ADDRESS` to a verified sender on the production domain.
6. Set `EMAIL_PREVIEW_FILES=false`.
7. Set `EMAIL_DRY_RUN=false` only when ready for live delivery.

First live email test:

1. Use an internal test customer address.
2. Submit a test order.
3. Confirm the customer receives the order confirmation.
4. Approve or deny the test order and confirm the status email.
5. Submit one catering or personal-chef request and confirm the request confirmation.

Preview routes and preview files are for development only. Production preview routes remain blocked by `NODE_ENV === "production"`.

## 8. DNS And Domain Notes

Production domain: `https://rahstwistedkitchen.com`

Domain/hosting provider: Hostinger

DNS checklist:

1. Point `rahstwistedkitchen.com` to the production app host using the host's required A, AAAA, or CNAME records.
2. Configure `www.rahstwistedkitchen.com` if the business wants the `www` hostname supported.
3. Ensure HTTPS is issued and active before launch.
4. Confirm `AUTH_URL`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_APP_URL` all use `https://rahstwistedkitchen.com`.
5. Add Resend DNS records for the sender domain.
6. Wait for DNS propagation before final smoke tests.

Post-DNS checks:

```powershell
Invoke-WebRequest -Uri "https://rahstwistedkitchen.com" -UseBasicParsing
Invoke-WebRequest -Uri "https://rahstwistedkitchen.com/menu" -UseBasicParsing
```

## 9. Upload And Storage Launch Posture

Local production uploads must remain disabled for launch:

```powershell
$env:ALLOW_LOCAL_UPLOADS_IN_PRODUCTION = "false"
```

Launch posture:

- Admins should use durable public image URLs for menu and gallery images.
- Do not rely on `public/uploads` in production unless the host explicitly provides durable, shared storage.
- If direct production uploads are required later, choose a durable object-storage provider first and add a provider-specific upload adapter in a future code change.

## 10. Payment Launch Posture

Automated online checkout is disabled for launch.

Launch posture:

- Manual Square or PayPal payment links and invoices are acceptable.
- Cash/offline payment tracking remains supported.
- Admins should mark orders or deposits paid only after payment is actually confirmed outside the app.
- Do not configure Square or PayPal API credentials until a future automated checkout integration phase.
- Do not add Stripe launch wording; Stripe is legacy/optional only while current env parsing still exists.

## 11. Security Launch Posture

Security work already completed:

- Customer ownership audit.
- Admin audit logging.
- Rate limiting.
- Security header pass.

Launch posture:

- Keep CSP intentionally minimal for launch.
- Keep production preview routes blocked.
- Keep local production uploads disabled.
- Use HTTPS-only production URLs.
- Use a unique production `AUTH_SECRET`.
- Do not expose `.env` values in logs, screenshots, tickets, or client messages.
- Keep admin access limited to known owner/admin accounts.

## 12. Manual Pre-Launch QA Checklist

Run this after production env vars, migrations, seed, DNS, and the first admin promotion are complete.

Customer-facing:

- Open `/`, `/menu`, `/gallery`, `/catering`, and `/personal-chef`.
- Confirm current menu items, weekly meal plan packages, and weekly meal offerings are accurate.
- Add a weekly meal plan to the cart and confirm the package and actual meal offering are visible.
- Add an a la carte item to the cart.
- Confirm allergen acknowledgement appears when expected.
- Test checkout validation for pickup and delivery.
- Submit one internal test order.
- Confirm the customer account order detail page shows the submitted order.
- Submit one internal catering request.
- Submit one internal personal-chef request.

Admin:

- Sign in as the promoted admin.
- Open `/admin`.
- Review `/admin/menu`, `/admin/menu/weekly`, and `/admin/gallery`.
- Approve or deny the internal test order.
- Confirm duplicate order decisions are blocked.
- Update an order status.
- Mark an eligible manual payment as paid only after confirming the test payment externally.
- Review `/admin/catering` for service requests.
- Review `/admin/notifications` for email mode.
- Review `/admin/settings` for business settings.

Email:

- Confirm order submitted email.
- Confirm order approved or denied email.
- Confirm payment received email after a test mark-paid action.
- Confirm catering or personal-chef request email.
- Confirm Resend delivery logs for the internal tests.

## 13. Post-Launch Smoke Test Checklist

Run immediately after launch:

- `https://rahstwistedkitchen.com` loads over HTTPS.
- `/menu` loads and shows the active published menu.
- `/cart` loads.
- `/checkout` loads and still shows automated online card checkout as disabled.
- Customer registration and login work.
- Internal test order submission works.
- Internal test service request submission works.
- Live customer emails send through Resend when `EMAIL_DRY_RUN=false`.
- `/admin` is accessible only to promoted admin/owner accounts.
- Admin order approval sends the correct customer email.
- Gallery images and menu images render.
- Production uploads remain blocked when `ALLOW_LOCAL_UPLOADS_IN_PRODUCTION=false` or unset.

## 14. Rollback Notes

Prepare rollback before launch:

1. Record the deployed commit SHA.
2. Take a database backup before migrations.
3. Confirm how to redeploy the previous app build in the host dashboard.
4. Keep a copy of the production environment variable set.

If the app deploy fails before migrations:

- Redeploy the previous known-good build.
- Keep the database untouched.

If migrations deploy but the app fails:

- Put the site in maintenance mode if the host supports it.
- Redeploy the previous known-good build only if it is compatible with the migrated schema.
- Restore the pre-migration database backup if the previous build is not schema-compatible.
- Keep `EMAIL_DRY_RUN=true` during recovery if duplicate or incorrect customer email is a risk.

If live email sends incorrectly:

- Set `EMAIL_DRY_RUN=true`.
- Pause affected customer workflows.
- Review Resend logs and app audit history.
- Resume live email only after the issue is understood.

## 15. Known Future Follow-Up Items

- Implement automated Square/PayPal checkout in a dedicated future phase.
- Choose durable production upload storage and wire direct admin uploads to it.
- Replace any remaining legacy Stripe env parsing or placeholders when the Square/PayPal phase begins.
- Add exact business-approved manual payment wording to customer-facing content if needed.
- Add host-specific deployment screenshots or Hostinger steps once the final hosting target and deployment mechanism are confirmed.
- Continue tightening CSP after launch traffic patterns and required third-party assets are known.
