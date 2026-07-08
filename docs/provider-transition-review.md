# Provider transition review

Date: July 8, 2026

## Confirmed launch/provider assumptions

- Production domain: `https://rahstwistedkitchen.com`.
- Hosting/domain provider: Hostinger.
- Email provider: Resend.
- Future online payment providers selected by the client: Square and PayPal.
- Stripe is no longer the planned payment provider.
- Automated online card checkout remains disabled for launch unless a separate Square/PayPal integration phase is approved and implemented.
- Manual Square/PayPal payment links or invoices are acceptable for launch, and the app should continue to support manual/admin payment tracking.

## Files reviewed

- Payment and checkout UI/API references in `app/checkout/page.tsx`, `app/admin/payments/page.tsx`, `app/api/orders/route.ts`, `types/order.ts`, `env.ts`, `scripts/check-production-env.mjs`, `package.json`, and `package-lock.json`.
- Launch and operator documentation in `docs/launch-readiness-checklist.md`, `docs/client-launch-information-needed.md`, `docs/current-development-status.md`, `docs/admin-dashboard-user-guide.md`, and `Notes.md`.
- Email provider references in `lib/email.ts`, `app/admin/notifications/page.tsx`, `docs/launch-readiness-checklist.md`, and `scripts/check-production-env.mjs`.
- Production URL references in `.env.example`, `docs/launch-readiness-checklist.md`, `docs/current-development-status.md`, and `lib/email.ts`.

## Stripe reference disposition

- `.env.example`: kept legacy optional Stripe variable names because current env parsing still accepts them, but added comments that Stripe is not the planned launch provider and Square/PayPal are future work.
- `app/checkout/page.tsx`: removed customer-facing copy that said online card payments are disabled until Stripe is connected; replaced it with Square/PayPal future-integration language. The disabled internal `stripe` option value remains as future cleanup because changing it could affect existing checkout state typing.
- `app/admin/payments/page.tsx`: replaced the admin-facing Stripe placeholder label with a generic online-checkout placeholder.
- Documentation files: replaced Stripe launch guidance with Square/PayPal future-integration guidance and manual payment-link/invoice launch assumptions.
- `env.ts`, `types/order.ts`, `package.json`, and `package-lock.json`: left unchanged as future cleanup because removing Stripe env parsing, the Stripe dependency, or the internal disabled payment method value could affect code paths outside this documentation-only transition pass.
- `scripts/check-production-env.mjs`: updated validation copy so it no longer suggests Stripe is the planned checkout provider.

## Behavior confirmation

No Square or PayPal API integration was attempted. Checkout, order creation, payment status calculations, admin mark-paid behavior, catering/private chef request behavior, Resend sending behavior, production upload behavior, security headers, and auth behavior were not changed in this pass.
