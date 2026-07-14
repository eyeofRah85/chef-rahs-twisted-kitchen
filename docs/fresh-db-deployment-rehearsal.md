# Fresh Database Deployment Rehearsal

Last updated: July 14, 2026

Use this rehearsal to validate that Chef Rah's Twisted Kitchen can deploy from a clean MySQL/MariaDB database using the same operational order expected for production.

This is a documentation and verification guide. It does not change app behavior, Prisma schema, checkout behavior, payment behavior, catering behavior, or personal-chef behavior.

## 1. Rehearsal Goal

Prove the launch path from an empty database:

1. Provision a fresh MySQL/MariaDB database.
2. Configure production-like environment variables.
3. Install dependencies from the lockfile.
4. Generate Prisma Client.
5. Apply existing migrations with `npx prisma migrate deploy`.
6. Seed foundation data.
7. Build the app.
8. Start the app.
9. Register the first owner account through the running app.
10. Promote that account with `npm run owner:promote`.
11. Run checkout and admin smoke tests with `EMAIL_DRY_RUN=true`.
12. Run a controlled internal Resend delivery test with `EMAIL_DRY_RUN=false` before approving launch.

## 2. Source Documents Reviewed

- `docs/production-runbook.md`
- `docs/release-candidate-validation.md`
- `.env.example`
- `package.json`
- `prisma/seed.ts`
- `scripts/check-production-env.mjs`

## 3. Required Environment Variables

Use rehearsal-only values. Do not point this rehearsal at production customer data.

| Variable | Rehearsal value or note |
| --- | --- |
| `DATABASE_URL` | Fresh MySQL/MariaDB database URL, such as `mysql://USER:PASSWORD@HOST:3306/DATABASE`. |
| `AUTH_SECRET` | Production-shaped secret, at least 32 characters. Use a rehearsal-only value. |
| `AUTH_URL` | Local rehearsal: `http://localhost:3000`. Final production: `https://rahstwistedkitchen.com`. |
| `NEXTAUTH_URL` | Same origin as `AUTH_URL`. |
| `NEXT_PUBLIC_APP_URL` | Same origin used to test email/order links. |
| `BUSINESS_TIME_ZONE` | `America/New_York` unless the business confirms a different timezone. |
| `RESEND_API_KEY` | Rehearsal/test key if available. A verified Resend key is required for the live internal delivery test. With dry-run email, a placeholder-like value may still block `npm run env:check`; do not use a real production key unless intended. |
| `EMAIL_FROM_ADDRESS` | Rehearsal sender on the intended verified domain when possible. |
| `EMAIL_DRY_RUN` | `true` during Phase 1 dry-run smoke tests; temporarily `false` for the controlled internal Resend delivery test. |
| `EMAIL_PREVIEW_FILES` | `true` for local email artifact inspection, or `false` if only console dry-run logging is desired. Use `false` for production-style live delivery testing unless intentionally collecting preview files. |
| `ALLOW_LOCAL_UPLOADS_IN_PRODUCTION` | `false` or unset. Keep production local uploads disabled. |
| `OWNER_EMAIL` | Exact email used to register the first owner account. Required before `npm run owner:promote`. |
| `ADMIN_EMAIL` | Legacy single-account input for `npm run admin:promote`; not needed when admins are assigned in Role Manager. |
| `ADMIN_ROLE` | Legacy role used only by `npm run admin:promote`. |

Note: `scripts/check-production-env.mjs` is a live-production launch gate and requires `EMAIL_DRY_RUN=false`. During Phase 1, keep `EMAIL_DRY_RUN=true` for smoke tests. For Phase 2 and final launch approval, run the env guard with live-email values only after Resend sender DNS is verified and the team is ready for controlled internal delivery testing.

## 4. Fresh Database Setup

Create a disposable MySQL/MariaDB database and user. The database must start empty.

Recommended safeguards:

- Use a database name that clearly marks the rehearsal, such as `chef_rahs_rehearsal`.
- Do not reuse local development data.
- Do not reuse an old PostgreSQL database or any database from earlier project assumptions.
- Confirm the app host can reach the database host and port.
- Record the empty-database backup or snapshot if the host supports it.

PowerShell example:

```powershell
$env:DATABASE_URL = "mysql://USER:PASSWORD@HOST:3306/chef_rahs_rehearsal"
```

## 5. Dependency Install And Prisma Client

Start from a clean checkout of the release candidate branch.

```powershell
npm ci
npm run prisma:generate
```

Expected result:

- Dependencies install from `package-lock.json`.
- Prisma Client generates successfully against the MySQL datasource and MariaDB adapter.

## 6. Apply Migrations

Use deploy migrations only. Do not use `prisma migrate dev` for production-style rehearsal or production.

PowerShell:

```powershell
.\node_modules\.bin\prisma.cmd migrate deploy
```

Linux shell:

```bash
npx prisma migrate deploy
```

Current migration inventory:

- `20260708130546_init_mysql`
- `20260711010132_add_weekly_plan_slot_selections`
- `20260711014741_add_weekly_slot_option_selections`
- `20260711145356_add_weekly_package_flags_and_slot_labels`
- `20260711182000_add_weekly_offering_breakfast_only`
- `20260712170000_add_weekly_ordering_window`
- `20260712203000_add_global_checkout_scheduling`
- `20260713093000_make_weekly_fulfillment_time_optional`
- `20260713101500_make_checkout_fulfillment_time_optional`

Expected result:

- All migrations apply cleanly to the empty MySQL/MariaDB database.
- Prisma creates the migration history table.
- No migration prompts appear.

## 7. Seed Foundation Data

Run the production-safe foundation seed after migrations:

```powershell
.\node_modules\.bin\prisma.cmd db seed
```

Linux shell:

```bash
npx prisma db seed
```

The seed upserts:

- Common allergens.
- Default business settings, including delivery fee, `$10.00` late fee, global customer scheduling disabled, Wednesday weekly opening, Friday 5:00 PM weekly late-fee start, Friday 10:00 PM weekly close, Sunday fixed fulfillment without a public time, no-weekend ordering for customer-scheduled orders, catering deposit percent, and delivery area.

`npm run db:seed-demo` is for local, demo, staging, or a disposable rehearsal database. Do not run it against real production customer data unless the owner intentionally wants the demo catalog and understands that it recreates demo weekly records.

```powershell
npm run db:seed-demo
```

For a disposable rehearsal, the demo seed can create cleanup-safe showcase data. It includes a published period with resolved scheduling fields, three packages, and exactly three Breakfast-only weekly offerings. Otherwise, create a small set of temporary QA menu data through the admin UI after the first owner is promoted:

- One available regular menu item.
- One published weekly menu period with an active Wednesday-Friday ordering window and Sunday fulfillment.
- At least one weekly package with configured meal slot labels.
- General weekly offerings for non-Breakfast slots.
- Breakfast-only weekly offerings for Breakfast-labeled slots.
- At least one weekly option with a positive upcharge.

After either seed path, verify `/admin/settings` before checkout QA:

- Global and weekly customer scheduling are disabled.
- The global and weekly fixed fulfillment days are Sunday.
- Both public fixed fulfillment times are blank.
- The weekly message is "Weekly meal plan orders are delivered on Sunday. You will be notified when delivery is scheduled."
- Weekly ordering opens Wednesday, enters the late window Friday at 5:00 PM, and closes Friday at 10:00 PM in the business timezone.
- The late fee amount is `$10.00` unless the rehearsal intentionally tests another approved value.

Clean up rehearsal data after verification if the database will be reused for another rehearsal.

## 8. Build And Start The App

Build:

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npx tsc --noEmit --pretty false
```

This rehearses the fixed Hostinger build command after the explicit migration and seed steps above. The `prebuild` hook repeats Prisma generation and `prisma migrate deploy`; migration deployment is idempotent and should report that no pending migrations remain before `next build` starts. `DATABASE_URL` must remain available throughout the build and point to the intended MySQL/MariaDB database.

The build lifecycle does not run the foundation seed, demo seed, or owner bootstrap. Do not add `npm run db:seed-demo` to a production build; it is only for intentionally disposable demo/staging/local data.

Start:

```powershell
npm run start
```

Expected result:

- The build log shows Prisma Client generation, `prisma migrate deploy`, and then `next build` in that order.
- The app starts without migration or Prisma adapter errors.
- Public routes load at the configured app origin.
- `/dev/email-preview` remains development-only and must not be reachable in `NODE_ENV=production`.
- `tsconfig.json` retains `strict: true` and `noImplicitAny: true`; no `ignoreBuildErrors` override is present.

## 9. Owner Registration And Admin Promotion

The promotion script does not create the user. Register first through the running app.

1. Open `/register`.
2. Register the first owner account.
3. Set the same email in `OWNER_EMAIL`.
4. Run:

```powershell
$env:OWNER_EMAIL = "owner@example.com"
npm run owner:promote
```

Expected result:

- The registered user is promoted.
- After signing out and back in, `/admin` and `/admin/role-manager` load for the owner.
- Additional registered users can be promoted to `ADMIN` in Role Manager; admins cannot open Role Manager or its API.
- Account pages remain inaccessible to anonymous users.

## 10. Two-Phase Email QA

Launch must not be approved based only on dry-run email tests. Dry-run checks prove that app-side email generation paths execute; they do not prove that Resend can deliver messages to an inbox.

### Phase 1: Dry-Run Smoke Testing

Set dry-run email values before app-side smoke tests:

```powershell
$env:EMAIL_DRY_RUN = "true"
$env:EMAIL_PREVIEW_FILES = "true"
```

Expected result:

- Order confirmation, approval, payment received, and service-request email generation paths execute without sending real customer email.
- Preview files or dry-run logs show the expected recipient and subject.
- Guest emails use `order.customerEmail`.
- Guest emails do not include protected account order links.
- App-side email rendering and triggering are validated.

Important limitation:

- With `EMAIL_DRY_RUN=true` and `EMAIL_PREVIEW_FILES=false`, `sendAppEmail` logs and returns without calling Resend.
- Phase 1 validates only app-side rendering, recipient selection, subject selection, and trigger paths.
- Phase 1 does not validate Resend authentication, sender DNS, provider delivery, inbox receipt, spam placement, or production email deliverability.

### Phase 2: Live Internal Resend Delivery Test

Run this phase only after Resend sender domain and DNS are verified.

Use an internal/test recipient only. Do not send live customer test emails before internal delivery has passed.

Set live-delivery values temporarily for the controlled test:

```powershell
$env:EMAIL_DRY_RUN = "false"
$env:EMAIL_PREVIEW_FILES = "false"
```

Required live internal tests:

- Submit at least one internal guest order confirmation test.
- Trigger an approval email if the test order requires approval, or use a request-only weekly option to force approval.
- Trigger a payment received email if the order is eligible for a mark-paid action.
- Confirm each expected message is received in the internal/test inbox.
- If a message is not received, check spam, junk, promotions, and Resend delivery logs before approving launch.

After the controlled live test:

- Set `EMAIL_DRY_RUN=true` again if more non-live QA remains.
- Keep `EMAIL_DRY_RUN=false` for launch only after live internal email delivery passes and the team is ready for customer-facing emails.
- Keep `EMAIL_DRY_RUN=true` for launch only if the owner intentionally wants customer emails disabled at launch.

## 11. Checkout Smoke-Test Checklist

Guest pickup order:

- Submit as an anonymous customer.
- Provide name, email, phone, and pickup details without a customer-selected `requestedDateTime`.
- Confirm Requested Date and Requested Time are hidden and the configured fixed fulfillment message is visible.
- Confirm the order succeeds and lands on `/checkout/thank-you`.
- Confirm admin can see the order with a Guest badge.
- Confirm dry-run confirmation email targets `order.customerEmail`.

Guest delivery order:

- Submit as an anonymous customer.
- Provide name, email, phone, delivery address, and delivery notes if needed, without a customer-selected `requestedDateTime`.
- Confirm Requested Date and Requested Time remain hidden.
- Confirm delivery fee is applied according to business settings.
- Confirm the order succeeds and lands on `/checkout/thank-you`.
- Confirm admin can see full delivery details.

Guest weekly meal plan order:

- Use a published weekly period whose resolved Wednesday-Friday ordering window is currently open.
- Confirm checkout does not request or submit a customer-selected `requestedDateTime`.
- Confirm the Sunday delivery message is visible and does not promise an exact time.
- Complete every required package meal slot.
- Confirm Breakfast-only offerings appear only in Breakfast-labeled slots.
- Select at least one weekly option with an upcharge.
- Confirm checkout total includes package price plus weekly option upcharge, delivery fee if applicable, late fee if applicable, and tip if applicable.
- Confirm the server stores the trusted Sunday fulfillment datetime while customer-facing views omit the internal fallback time.
- Confirm admin detail and kitchen views show slot labels, selected offerings, selected options, and upcharges.
- Confirm dry-run confirmation email shows weekly slot selections and options.

Logged-in order:

- Register or sign in as a non-admin customer.
- Submit a regular menu order.
- Confirm the order links to the authenticated user.
- Confirm `/account/orders` shows the order.
- Confirm protected `/orders/[id]` is reachable only by the owning authenticated user.
- Confirm fixed fulfillment displays as the configured message, with no customer-visible `12:00 PM` fallback.

## 12. Validation Smoke-Test Checklist

Customer scheduling disabled:

- Confirm Requested Date and Requested Time are hidden for regular and weekly checkout.
- Submit guest regular and weekly orders without `requestedDateTime`.
- Expected: both paths resolve trusted fulfillment server-side and show the configured message rather than an internal fallback time.

Customer scheduling enabled regression check:

- Temporarily enable global customer scheduling in the rehearsal database.
- Confirm regular checkout date/time controls return.
- Attempt a past requested date/time and a weekend requested date/time.
- Expected: the existing past-date and no-weekend validation still rejects invalid customer-selected schedules.
- Restore global customer scheduling to disabled for launch.

Weekly ordering window and late fee:

- Wednesday through Friday before 5:00 PM: ordering is allowed with no weekly late fee.
- Friday from 5:00 PM through 10:00 PM: ordering is allowed and the configured `$10.00` late fee applies.
- After Friday 10:00 PM: the weekly order is rejected for that period.
- Expected: the server uses the resolved weekly ordering window and current business-local submission time, not customer-supplied fulfillment input.

Breakfast-only filtering:

- Confirm Breakfast-only offerings are visible only in Breakfast-labeled package slots.
- Attempt a tampered submission of a Breakfast-only offering into a non-Breakfast slot.
- Expected: API rejects the order.

Weekly option upcharges:

- Select one +$2 option and confirm the total increases by $2.
- Select one +$4.50 option and confirm the total increases by $4.50.
- Select multiple upcharged slot options and confirm all upcharges are summed.
- Confirm selected options persist in admin, kitchen, and email displays.

Admin order visibility:

- Confirm guest and registered orders both appear in `/admin/orders`.
- Confirm guest orders show as Guest and registered orders remain linked to their customer account.
- Confirm admin can approve, deny, update status, and mark paid only when appropriate for manual/offline payment handling.

## 13. Production Env Guard Rehearsal

Run the production env guard once with final launch-shaped values before live deployment:

```powershell
npm run env:check
```

Expected production result:

- MySQL/MariaDB `DATABASE_URL` is accepted.
- PostgreSQL, SQLite, and file-based URLs are rejected.
- HTTPS app/auth URLs are required.
- `EMAIL_DRY_RUN=false` is required before live production email delivery.
- `ALLOW_LOCAL_UPLOADS_IN_PRODUCTION=false` or unset keeps local uploads disabled.

During dry-run rehearsal, use `npm run env:check -- --report` only as an informational report if `EMAIL_DRY_RUN=true` is intentionally still set.

## 14. Rehearsal Pass Criteria

The fresh database rehearsal is technically complete when:

- Migrations deploy cleanly to an empty MySQL/MariaDB database.
- Foundation seed completes.
- BusinessSettings match the final global and weekly scheduling model.
- Build succeeds.
- App starts against the migrated database.
- First owner/admin registration and promotion succeed.
- Guest pickup, guest delivery, guest weekly meal plan, and logged-in order smoke tests pass.
- Requested Date and Requested Time are hidden while scheduling is disabled.
- Fixed fulfillment messages are visible and no `12:00 PM` internal fallback is customer-visible.
- Admin can see guest and registered orders.
- Phase 1 dry-run email smoke tests pass.
- Dry-run emails target the expected recipients and subjects and do not expose protected guest order links.
- Guest regular and weekly orders succeed without a customer-supplied `requestedDateTime`.
- Past-date and weekend validation still block invalid schedules when customer scheduling is enabled.
- Weekly Friday 5:00 PM-10:00 PM late-fee behavior and Friday 10:00 PM close are enforced.
- Breakfast-only filtering and server validation work.
- Weekly option upcharges are included, persisted, and displayed.

The fresh database rehearsal is not enough by itself to approve launch. Launch approval also requires the live internal Resend delivery gate in the next section.

## 15. Final Launch Approval Checklist

Before approving production launch:

- Fresh MySQL/MariaDB migration rehearsal passed from an empty database.
- Foundation seed completed.
- BusinessSettings were reviewed after migration/seed and match the launch scheduling values.
- Owner registration and `npm run owner:promote` completed successfully.
- Checkout/admin smoke tests passed.
- Dry-run email smoke tests passed.
- Live internal Resend delivery test passed with `EMAIL_DRY_RUN=false`.
- Internal order confirmation email was received.
- Internal approval email was received, if the approval path applies to the test order.
- Internal payment received email was received, if the mark-paid path applies to the test order.
- Spam, junk, promotions, and Resend logs were checked for any missing internal test message.
- `EMAIL_DRY_RUN` final value is intentionally set for launch.
- If customer-facing emails should send at launch, `EMAIL_DRY_RUN=false` is set only after live internal delivery has passed.
- If `EMAIL_DRY_RUN=true` remains set at launch, the owner has intentionally accepted that customer emails are disabled.
- `EMAIL_PREVIEW_FILES=false` is set for production unless preview files are intentionally being collected during a controlled debugging window.

## 16. Remaining Risks

- This rehearsal still needs an actual disposable MySQL/MariaDB database to prove host connectivity, database privileges, and migration execution in the target environment.
- Hostinger deployment logs must confirm that the fixed `npm run build` command invokes Prisma generation and `prisma migrate deploy` through `prebuild` before `next build`.
- Resend live delivery remains a launch blocker until the sender domain DNS is verified and the Phase 2 internal delivery test passes with `EMAIL_DRY_RUN=false`.
- Final client menu data, payment wording, and image hosting choices remain operational launch inputs.
- Direct production uploads remain intentionally disabled unless durable storage is selected later.
