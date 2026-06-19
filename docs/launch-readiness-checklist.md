# Launch Readiness Checklist

Date: June 15, 2026

Use this checklist before deploying Chef Rah's Twisted Kitchen to a public production environment.

## Current Review Status

Last reviewed: June 18, 2026

Completed locally:

- `npm run check` passes without lint warnings.
- Prisma reports 16 migrations and the configured local development database schema is up to date.
- `npm run env:check -- --report` runs without printing secret values.
- The local `.env` now includes `BUSINESS_TIME_ZONE`.

Current production blockers reported by the environment guard:

- `NEXT_PUBLIC_APP_URL`, `AUTH_URL`, and `NEXTAUTH_URL` still point at localhost and must be production `https://` URLs.
- `EMAIL_DRY_RUN` is not `false`; live customer emails will not send until production explicitly disables dry-run mode.

Current warnings to resolve or accept before launch:

- `ALLOW_LOCAL_UPLOADS_IN_PRODUCTION` is not set. This is acceptable only if production uploads stay blocked and admins use public image URLs.
- `EMAIL_PREVIEW_FILES` is enabled. Disable preview file output in production unless intentionally debugging email rendering.
- Stripe is not configured. This is acceptable while online card checkout remains disabled.
- `ADMIN_EMAIL` is not set. Set it before running `npm run admin:promote`.

## Required Validation

Run these before launch:

```powershell
npm run check
npm run env:check
```

For a local dry run of the environment report without failing the command:

```powershell
npm run env:check -- --report
```

## Production Environment Variables

Required before launch:

- `DATABASE_URL`: production PostgreSQL connection string.
- `AUTH_SECRET`: generated production Auth.js secret, at least 32 characters.
- `AUTH_URL`: public production site URL.
- `NEXTAUTH_URL`: public production site URL.
- `NEXT_PUBLIC_APP_URL`: public production site URL used in email links.
- `BUSINESS_TIME_ZONE`: business timezone for weekly menu and cutoff checks.
- `RESEND_API_KEY`: production email provider key.
- `EMAIL_FROM_ADDRESS`: verified production sender address.
- `EMAIL_DRY_RUN=false`: required for live email delivery.
- `EMAIL_PREVIEW_FILES=false`: recommended for production.
- `ALLOW_LOCAL_UPLOADS_IN_PRODUCTION=false`: recommended unless the host has durable shared storage.

Optional or workflow-specific:

- `ADMIN_EMAIL`: used by `npm run admin:promote`.
- `ADMIN_ROLE`: defaults to `ADMIN`; set to `OWNER` only when appropriate.
- `CONTACT_TO_EMAIL`: reserved for future internal contact notifications.
- Stripe variables can remain blank while online card checkout is disabled.

## Durable Upload Storage

Current safe launch posture:

- Keep `ALLOW_LOCAL_UPLOADS_IN_PRODUCTION=false`.
- Use the public image URL fields for production gallery and menu images.
- Store production images in a durable external location until direct app uploads are wired to the selected provider.

Open decision:

- Choose the durable upload provider if admins need direct in-app production uploads.
- Good candidates include the hosting provider's blob storage, S3-compatible storage, Cloudflare R2, Supabase Storage, or UploadThing.
- After the provider is selected, add the smallest provider-specific upload adapter and keep the existing URL fields as the saved database values.

## Email Delivery Test

Before sending customer email from production:

1. Configure the production sender domain in the email provider.
2. Set `RESEND_API_KEY` and `EMAIL_FROM_ADDRESS`.
3. Set `EMAIL_DRY_RUN=false`.
4. Submit a test order using an internal/test customer address.
5. Confirm the provider shows a delivered order confirmation.
6. Approve or deny the test order and confirm the approval update email.
7. Submit one test service request and confirm the service request confirmation email.

Do not use real customer data for the first live-send test.

## Manual Payment Launch Notes

Online card checkout remains disabled. Customer-facing copy currently tells customers that:

- manual invoice orders can be submitted now,
- cash/offline payment is confirmed after review,
- deposit instructions are provided after quote review.

Before launch, confirm Chef Rah's preferred manual payment wording and add any exact payment instructions if they should be shown on order detail or email templates.

## Browser Smoke Test

Run a final browser pass after production environment values are set:

- Public home page.
- `/menu` current weekly menu display.
- Add weekly meal plan to cart.
- Cart allergen warning and acknowledgement.
- Checkout delivery and pickup validation.
- Checkout order submission with email delivery enabled.
- Customer account order detail.
- Admin order approval and duplicate-decision blocking.
- `/admin/menu/weekly` fulfillment prep.
- `/admin/gallery` image URL edit path.
- `/admin/notifications` email mode display.

## Database Launch Steps

Before production traffic:

```powershell
npm run prisma:generate
.\node_modules\.bin\prisma.cmd migrate deploy
npm run admin:promote
```

Run `npm run admin:promote` only after the first admin user has registered and `ADMIN_EMAIL` is set.
