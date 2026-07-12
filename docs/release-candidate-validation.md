# Release Candidate Validation

Date: July 12, 2026

This document records the final release-candidate validation pass after the weekly meal plan slot-selection work, true guest checkout work, launch readiness documentation, and MySQL/MariaDB production readiness cleanup.

## Executive Summary

The release candidate is ready for production deployment preparation, pending final production environment values, Resend sender verification, and the documented live smoke tests.

No application behavior, payment flow, Prisma schema, checkout logic, catering flow, or personal-chef flow was changed during this pass. The only cleanup outside this file was documentation-only: the historical root `Notes.md` stack note was updated so it no longer recommends PostgreSQL/Supabase/Neon as the production database path.

## Branches And Features Included

This validation branch was created from `main` and includes the current release-candidate state:

- Weekly meal plan package slot selections are required before add-to-cart.
- Weekly meal slot selections are persisted as order data.
- Weekly slot labels are package-configurable and snapshotted on order creation.
- Weekly breakfast-only offerings are filtered in the customer slot picker and enforced by the order API.
- Weekly option selections and upcharges are validated, priced, persisted, and displayed.
- True guest checkout creates guest orders with `userId = null`.
- Guest orders do not create fake/passwordless accounts and are not auto-attached by matching email.
- Guest checkout uses `/checkout/thank-you`; protected `/orders/[id]` links are only sent for authenticated customer orders.
- MySQL/MariaDB is the documented production database path for Hostinger compatibility.

## Validation Commands Run

Code and build validation:

```powershell
npm run prisma:generate
npm run check
npm run build
git diff --check
```

Release-candidate searches:

```powershell
git grep -n "postgres\|postgresql\|Supabase" -- . docs scripts prisma app lib
git grep -n "migrate dev" -- docs scripts .env.example
git grep -n "Stripe\|STRIPE" -- docs .env.example app lib components
git grep -n "guestCheckout\|userId: null\|orderUrl" -- app lib emails components
git grep -n "breakfastOnly\|mealSlotLabels\|mealLabel" -- app components lib prisma types
```

Production environment guard probes:

- Run `scripts/check-production-env.mjs` with a dummy MySQL/MariaDB `DATABASE_URL`.
- Run `scripts/check-production-env.mjs` with a dummy PostgreSQL `DATABASE_URL` and confirm it fails.

## Search Results Summary

Database guidance:

- `.env.example`, `docs/production-runbook.md`, `docs/launch-readiness-checklist.md`, and `docs/client-launch-information-needed.md` agree that production uses a MySQL/MariaDB-compatible `mysql://` Prisma URL.
- `docs/production-runbook.md` explicitly says not to reuse old PostgreSQL assumptions.
- The only remaining PostgreSQL-related code references are intentional rejection paths in `scripts/check-production-env.mjs` and package metadata for installed dependencies.
- `Notes.md` had stale historical stack guidance for PostgreSQL/Supabase/Neon and was corrected in this branch.
- `docs/launch-readiness-review.md` had historical blocker wording from before the MySQL/MariaDB cleanup and was updated to mark those findings as resolved.
- Supabase remains mentioned only as a possible object-storage provider, not as the production database path.

Migration guidance:

- Production docs use `npx prisma migrate deploy` or the Windows equivalent `.\node_modules\.bin\prisma.cmd migrate deploy`.
- Search results for `migrate dev` are limited to warnings that it must not be used in production.

Payment guidance:

- Stripe references are documented as legacy/optional while current env parsing exists.
- Square and PayPal remain future automated checkout providers.
- Manual Square/PayPal links or invoices remain the launch posture.
- No payment provider code was changed.

Guest checkout and account ownership:

- `app/api/orders/route.ts` makes the session optional for order creation.
- Authenticated orders connect to the authenticated user.
- Guest orders rely on submitted customer contact fields and do not connect by email.
- `app/checkout/page.tsx` routes guests to `/checkout/thank-you`.
- `OrderConfirmationEmail`, `OrderApprovalEmail`, and `PaymentReceivedEmail` only render protected order links when `orderUrl` is present.
- Admin order list/detail show a Guest badge for `userId = null`.
- Account order pages require auth and query orders through the authenticated user.

Weekly meal plan validation:

- Package slot labels are normalized and validated through `lib/weekly-package-labels.ts` and `lib/weekly-menu-validation.ts`.
- Breakfast-only weekly offerings are represented by `breakfastOnly`.
- Customer slot selection filters breakfast-only offerings to Breakfast-labeled slots.
- The order API rejects breakfast-only offerings submitted into non-Breakfast slots.
- Weekly slot options are validated per selected offering, priced server-side, persisted under order slot selections, and included in display/email data.

Scheduling and fee validation:

- `validateServerRequestedDateTime` enforces past-date and no-weekend validation using business-timezone helpers.
- Late fee calculation uses current server/business time through `calculateServerLateFee`, not `requestedDateTime`.
- Weekly period/deadline validation still uses the submitted `requestedDateTime` for schedule/window checks.

## Launch Blockers

No confirmed launch-blocking application bugs were found during this review.

Remaining launch gates are operational, not code blockers:

- Configure production environment variables.
- Provision production MySQL/MariaDB.
- Run production migrations with `npx prisma migrate deploy`.
- Verify Resend sender domain and DNS.
- Register and promote the first owner/admin account after deployment.
- Run final internal production smoke tests before setting `EMAIL_DRY_RUN=false`.

## Non-Blocking Polish Items

- Add Hostinger-specific deployment screenshots once the exact Hostinger deployment mechanism is confirmed.
- Confirm final client-approved manual payment wording for order emails and customer-facing copy.
- Choose durable production object storage if direct admin uploads are needed after launch.
- Remove legacy Stripe dependency/env parsing in a future Square/PayPal integration cleanup.

## Final Pre-Deployment Checklist

1. Confirm Node.js 24 LTS on the build/deploy environment.
2. Configure production env vars from `.env.example` and `docs/production-runbook.md`.
3. Provision a fresh production MySQL/MariaDB database.
4. Set `DATABASE_URL` to the production MySQL/MariaDB URL.
5. Run `npm ci`.
6. Run `npm run prisma:generate`.
7. Run `npx prisma migrate deploy`.
8. Seed foundation data only if required by the runbook.
9. Build and deploy the app.
10. Register the first owner/admin account through the deployed production site.
11. Set `ADMIN_EMAIL` and run `npm run admin:promote`.
12. Configure Resend sender domain and DNS.
13. Keep `EMAIL_DRY_RUN=true` until final internal order/email tests are ready.
14. Run production smoke tests.
15. Set `EMAIL_DRY_RUN=false` only after internal email/order tests pass.

## Final Production Smoke-Test Checklist

Customer flow:

- Public home/menu/gallery pages load over HTTPS.
- Anonymous pickup order submits and lands on `/checkout/thank-you`.
- Anonymous delivery order submits and lands on `/checkout/thank-you`.
- Anonymous weekly meal plan order submits with all required slots/options.
- Logged-in order submits and appears in account order history.
- Past requested date/time is rejected.
- Weekend requested date/time is rejected.
- Late fee reflects current order submission time after cutoff.

Weekly meal plan flow:

- Slot labels display clearly in menu, cart, checkout, emails, admin, and kitchen views.
- Breakfast-only offerings appear only in Breakfast-labeled slots.
- Weekly option upcharges are included in totals and visible in admin/kitchen/email.
- Expired, unpublished, stale, or wrong-period weekly selections are rejected.

Admin and email flow:

- Admin can see both guest and registered customer orders.
- Guest orders show the Guest badge.
- Guest emails do not include protected account order links.
- Authenticated customer emails include order links where appropriate.
- Order approval, denial, payment-received, catering, and personal-chef emails send through Resend when live email is enabled.

Production posture:

- `/dev/email-preview` routes remain blocked in production.
- Local production uploads remain disabled.
- Automated Square/PayPal checkout remains disabled until a future integration phase.
- Admin routes remain protected.

## Recommendation

Ready for production deployment preparation. No code launch blockers were found in this pass. Production should proceed only after the operational checklist is complete and final production smoke tests pass with live production environment values.
