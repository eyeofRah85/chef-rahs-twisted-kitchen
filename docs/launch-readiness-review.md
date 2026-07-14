# Launch Readiness Review

Last updated: July 14, 2026

Branch: `launch/readiness-review`

Scope: full order-flow launch review after weekly meal plan slot selections, breakfast-only weekly offerings, weekly option upcharges, true guest checkout, and the final fixed checkout/weekly scheduling model.

This is a documentation/review pass. No application behavior, Prisma schema, payment provider behavior, catering flow, or personal-chef flow was changed.

## 1. Executive Summary

The customer order flow is close to launch-ready from code review and recent local QA. Guest checkout, logged-in checkout, weekly meal plan slot persistence, weekly slot option upcharges, breakfast-only validation, account ownership checks, and transactional email link behavior are all implemented in the expected direction.

The main launch readiness concern found in this review was production documentation/tooling alignment. That follow-up has since been resolved by the MySQL/MariaDB production readiness cleanup:

- `docs/production-runbook.md` correctly describes MySQL/MariaDB, Hostinger, Resend, manual Square/PayPal payment posture, disabled local production uploads, and `prisma migrate deploy`.
- `.env.example`, `scripts/check-production-env.mjs`, `docs/launch-readiness-checklist.md`, and `docs/client-launch-information-needed.md` now align with the MySQL/MariaDB production path.
- Launch checkout scheduling is now fixed: customers are not asked for Requested Date or Requested Time, weekly ordering follows the Wednesday-Friday window, and Sunday fulfillment is communicated without promising a public time.

Recommended next action: run the final release-candidate validation and a production-like smoke test with `EMAIL_DRY_RUN=true` before enabling live Resend delivery.

## 2. What Is Launch-Ready

Guest checkout:

- Anonymous checkout no longer requires a session.
- Guest orders are created without a `User` relation, so `Order.userId` remains `null`.
- Guest name, email, phone, and delivery fields are stored on the order snapshot.
- Guest orders are not auto-attached to existing users by matching email.
- Guest reorder attempts are blocked because previous order recovery remains account-owned.
- Guest confirmation routes to `/checkout/thank-you`, not protected `/orders/[id]`.

Logged-in checkout:

- Authenticated orders still connect to the authenticated user.
- Account email remains the trusted customer email for logged-in checkout.
- Profile prefill and save-contact-info behavior remain account-only.
- Account allergen preferences remain account-only.

Weekly meal plans:

- Build Your Weekly Plan requires the configured number of slots.
- Slot labels are package-configured and snapshotted into order data.
- Slot selected offerings persist as order data.
- Slot selected options persist as order data.
- Server-side pricing uses trusted package and option data, not client totals.
- Weekly option upcharges are included in `OrderWeeklyMealPlanSelection.priceDelta` and order totals.
- Stale, unpublished, expired, wrong-period, wrong-slot, and invalid option submissions are rejected server-side.

Validation and fees:

- Global customer-selected scheduling is disabled for launch; regular and weekly checkout resolve trusted fulfillment server-side without requiring client `requestedDateTime`.
- Weekly ordering is open Wednesday through Friday, enters the late-fee window Friday at 5:00 PM, and closes Friday at 10:00 PM in the business timezone.
- Weekly fixed fulfillment is Sunday. The app may store an internal fallback datetime, but customer-facing views use the configured message and do not promise the fallback time.
- Past-date and no-weekend validation remain available and server-enforced when customer-selected scheduling is enabled.

Emails:

- Order confirmation emails send to `order.customerEmail`.
- Guest order confirmation emails omit account-only order detail links.
- Approval and payment-received emails include account-only links only when `order.userId` is present.
- Guest-facing email copy does not require the customer to have an account.

Admin and kitchen:

- Admin order list/detail query orders directly and can show guest orders.
- Admin order list/detail display a `Guest` badge when `userId` is null.
- Kitchen view includes weekly meal plan snapshots, slot labels, and slot options through shared weekly display data.

Account ownership:

- `/account/orders` remains login-only.
- `/orders/[id]` remains login-only and filters by the authenticated user's relationship, not by email alone.
- Guest orders are not exposed through account pages.

## 3. What Still Needs Manual QA

Run these in a production-like environment after migrations and seed/setup:

1. Anonymous pickup order with name, email, phone, manual payment, no customer-supplied `requestedDateTime`, and the fixed fulfillment message visible.
2. Anonymous delivery order with required delivery address fields.
3. Anonymous weekly meal plan order during its resolved Wednesday-Friday ordering window, without a customer-supplied `requestedDateTime`.
4. Logged-in pickup or delivery order and account order history visibility.
5. Weekly plan with at least one option upcharge and one request-only option.
6. Breakfast-only offering visible in Breakfast slots and hidden from Lunch/Dinner/Snack/Meal slots.
7. Tampered API request using breakfast-only offering in non-Breakfast slot returns `400`.
8. Requested Date and Requested Time remain hidden while global scheduling is disabled.
9. No `12:00 PM` internal fallback appears in checkout, customer order detail, or email.
10. Weekly orders before Friday 5:00 PM have no late fee; Friday 5:00 PM-10:00 PM orders have the late fee; orders after Friday 10:00 PM are rejected.
11. Guest confirmation lands on `/checkout/thank-you`.
12. Logged-in confirmation lands on `/orders/[id]`.
13. Guest confirmation, approval, and payment emails do not include account-only detail links.
14. Admin order list/detail and kitchen view show guest weekly selections clearly.
15. Catering and personal-chef request flows still submit and email normally.

## 4. Launch Blockers Found

No unresolved launch blockers remain from this review.

### Resolved: Production Env Guard Assumed PostgreSQL

At review time, `scripts/check-production-env.mjs` described `DATABASE_URL` as a production PostgreSQL URL and rejected non-PostgreSQL connection strings. The app uses Prisma `provider = "mysql"` with the MariaDB adapter, and the production runbook targets MySQL/MariaDB for Hostinger compatibility.

Resolution:

- `scripts/check-production-env.mjs` now accepts MySQL/MariaDB-compatible `mysql://` URLs.
- The script rejects PostgreSQL, SQLite, and file-based production database URLs with MySQL/MariaDB-specific guidance.

### Resolved: Stale PostgreSQL References Outside Production Runbook

At review time, `.env.example`, `docs/launch-readiness-checklist.md`, and `docs/client-launch-information-needed.md` still mentioned PostgreSQL connection strings. That conflicted with the current MySQL/MariaDB deployment posture.

Resolution:

- The production env example and launch docs now document MySQL/MariaDB `DATABASE_URL` values.
- Production migration guidance remains `npx prisma migrate deploy` or the Windows equivalent.

## 5. Non-Blocking Polish Items

- Customer-facing manual payment copy is launch-safe but generic. Business-approved exact Square/PayPal invoice/link wording can be added later.
- Guest checkout intentionally has no public tracking link. This is correct for launch, but a future tokenized guest-order access design may improve support.
- Legacy Stripe dependency/env parsing remains present while online card checkout is disabled. This is acceptable for launch, but should be cleaned up when Square/PayPal integration work begins.
- `npm run build` on Node 26 continues to print dependency/toolchain `DEP0205` warnings. The production runbook already recommends Node.js 24 LTS.

## 6. Production Deployment Checklist

1. Use Node.js 24 LTS.
2. Configure production environment variables.
3. Provision a fresh MySQL/MariaDB database.
4. Run `npm ci`.
5. Run `npm run prisma:generate`.
6. Run `npx prisma migrate deploy` or `.\node_modules\.bin\prisma.cmd migrate deploy`.
7. Run the foundation seed only after migrations.
8. Run `npm run db:seed-demo` only for local, demo, staging, or disposable rehearsal data, not real production customer data unless intentionally desired.
9. Verify BusinessSettings after migration/seed, including disabled global scheduling, Sunday fulfillment without a public time, Wednesday open, Friday 5:00 PM late start, and Friday 10:00 PM close.
10. Remove `.next` before final clean validation if generated Next.js types may be stale; keep `strict: true`, `noImplicitAny: true`, and no `ignoreBuildErrors` override.
11. Build and deploy the app.
12. Register the first owner/admin account through the deployed production site.
13. Run `npm run admin:promote`.
14. Configure Resend sender domain and DNS.
15. Keep `EMAIL_DRY_RUN=true` until final internal test orders are ready.
16. Smoke test public pages, checkout, emails, admin, kitchen, and account pages.
17. Set `EMAIL_DRY_RUN=false` only after final internal email and order tests pass.

## 7. Environment Variable Checklist

Required production values:

- `DATABASE_URL`: MySQL/MariaDB production connection string.
- `AUTH_SECRET`: generated production-only secret, at least 32 characters.
- `AUTH_URL`: `https://rahstwistedkitchen.com`.
- `NEXTAUTH_URL`: `https://rahstwistedkitchen.com`.
- `NEXT_PUBLIC_APP_URL`: `https://rahstwistedkitchen.com`.
- `BUSINESS_TIME_ZONE`: likely `America/New_York`.
- `RESEND_API_KEY`: production Resend key.
- `EMAIL_FROM_ADDRESS`: verified sender on the production domain.
- `EMAIL_DRY_RUN`: `false` only when ready for live email.
- `EMAIL_PREVIEW_FILES`: `false` in production.
- `ALLOW_LOCAL_UPLOADS_IN_PRODUCTION`: `false` or unset for launch.

Workflow values:

- `ADMIN_EMAIL`: set to the registered owner/admin email before promotion.
- `ADMIN_ROLE`: `OWNER` for the primary owner account or `ADMIN` for staff.

Legacy/future payment values:

- Legacy Stripe values may remain blank.
- Square/PayPal API credentials are not required for launch because automated online checkout is intentionally disabled.

## 8. Prisma Migration Checklist

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

Production deployment posture:

- Use a fresh MySQL/MariaDB database.
- Run `npx prisma migrate deploy` in production.
- Do not use `prisma migrate dev` in production.
- Take a backup before launch migrations.
- Confirm the deployed app build includes the Prisma client generated from the current schema.

## 9. Email / Resend Checklist

1. Verify the sender domain in Resend.
2. Add required DNS records through Hostinger or the active DNS host.
3. Set `RESEND_API_KEY`.
4. Set `EMAIL_FROM_ADDRESS` to a verified production sender.
5. Keep `EMAIL_PREVIEW_FILES=false` in production.
6. Start launch smoke testing with `EMAIL_DRY_RUN=true`.
7. Submit internal guest and logged-in test orders.
8. Confirm confirmation, approval/denial, and payment-received emails.
9. Confirm guest emails do not include `/orders/[id]` links.
10. Set `EMAIL_DRY_RUN=false` only after internal tests are approved.

## 10. Admin Checklist

- Promote the first owner/admin account.
- Confirm `/admin` is restricted to admin/owner roles.
- Confirm `/admin/orders` displays guest badges for guest orders.
- Confirm `/admin/orders/[id]` displays guest contact and weekly slot details.
- Confirm `/admin/kitchen` displays weekly slot labels and options.
- Confirm approval/denial updates send customer emails.
- Confirm mark-paid sends payment received email.
- Confirm manual payment status is updated only after external payment confirmation.
- Confirm weekly menu packages, offerings, breakfast flags, slot labels, and option pricing are accurate.
- Confirm `/admin/settings` has global and weekly customer scheduling disabled, Sunday fulfillment, no public fulfillment time, the approved messages, and the Wednesday-Friday weekly window.

## 11. Customer Checkout Checklist

Guest checkout:

- Pickup requires name, email, phone, and payment method; launch checkout does not require a customer-supplied `requestedDateTime`.
- Delivery requires name, email, phone, address line 1, city, state, postal code, and payment method; launch checkout does not require a customer-supplied `requestedDateTime`.
- Requested Date and Requested Time are hidden and the configured fixed fulfillment message is visible.
- Guest orders land on `/checkout/thank-you`.
- Guest orders do not create users and do not appear in account pages.

Logged-in checkout:

- Profile prefill works.
- Save-contact-info updates only the authenticated user's profile.
- Orders connect to the authenticated user.
- Account order history shows only the authenticated user's orders.

Weekly meal plans:

- Package slot count equals `days * mealsPerDay`.
- Slot labels use package-configured labels.
- The 5-Day / 3 Meals package uses Breakfast/Lunch/Dinner and displays "By request" to customers because it requires chef approval.
- Breakfast offerings appear only for Breakfast slots.
- The demo seed contains exactly three Breakfast-only offerings when used in a demo/staging database.
- Server rejects breakfast-only offerings in non-Breakfast slots.
- Slot options and upcharges persist and display in cart, checkout, emails, order detail, admin, and kitchen.
- Weekly checkout shows Sunday delivery with the configured message and no promised time.

Validation:

- No customer-facing view shows an internal `12:00 PM` fallback time.
- Weekly ordering is allowed Wednesday through Friday 10:00 PM.
- Weekly late fee applies from Friday 5:00 PM through Friday 10:00 PM.
- Weekly orders after Friday 10:00 PM are rejected for that period.
- Past-date and weekend validation remain enforced if customer scheduling is enabled later.

## 12. Rollback Notes

- Record the deployed commit SHA before launch.
- Back up the database before migrations.
- If deployment fails before migrations, redeploy the previous build.
- If migrations succeed but the app fails, either deploy a schema-compatible previous build or restore the pre-migration database backup.
- If email sends incorrectly, set `EMAIL_DRY_RUN=true`, pause customer workflows, and review Resend logs before resuming.
- If checkout begins accepting bad orders, disable public ordering at the routing/hosting layer if available and keep admin access for triage.

## 13. Recommended Next Branch Or Action

Recommended next action:

- Complete release-candidate validation.
- Run the full production-like smoke test from this review with dry-run email enabled.
- Enable live Resend delivery only after internal order/email smoke tests pass.
