# Rate limiting recommendation for sensitive public endpoints

## Decision

Do not add an in-process memory rate limiter for production. This app is intended for a public production deployment, but the repository does not identify a durable shared rate-limit backend such as Upstash Redis, Redis, a hosting-provider KV store, or an edge/WAF product. An in-memory limiter would be inconsistent across serverless instances and can reset on cold starts or deploys, so it would provide unreliable protection while risking confusing checkout/request behavior.

## Smallest safe production approach

Use a shared, low-latency counter store selected for the hosting provider:

1. Prefer the hosting provider's managed KV/Redis option if available.
2. Otherwise use Upstash Redis or another managed Redis-compatible service.
3. Add a tiny `lib/rate-limit.ts` helper that keys limits by route, normalized client IP, and where useful email address.
4. Fail closed only after the counter store is reachable and tested; if the store is unavailable, return a clear `503` rather than silently allowing brute-force traffic.
5. Return `429 Too Many Requests` with a short JSON error and `Retry-After` header for API callers.

Suggested initial limits that should not block normal customers:

| Endpoint | Purpose | Suggested limit |
| --- | --- | --- |
| `POST /api/auth/*` / credentials authorize | Login brute-force protection | 5 attempts per 10 minutes per IP+email, plus a wider IP bucket |
| `POST /api/register` | Account creation spam protection | 5 attempts per hour per IP |
| `POST /api/orders` | Checkout/order spam protection | 10 attempts per 10 minutes per authenticated user/IP |
| `POST /api/catering` | Catering request spam protection | 5 attempts per hour per IP/email |
| `POST /api/personal-chef` | Personal chef request spam protection | 5 attempts per hour per IP/email |
| Future contact/request form endpoint | Contact spam protection | 5 attempts per hour per IP/email |

## Endpoints reviewed for protection

- `app/api/auth/[...nextauth]/route.ts` delegates Auth.js `GET` and `POST` handlers; credentials authorization lives in `auth.ts`.
- `app/api/register/route.ts` handles public account registration.
- `app/api/orders/route.ts` handles authenticated order submission.
- `app/api/catering/route.ts` handles public/authenticated catering request submission.
- `app/api/personal-chef/route.ts` handles public/authenticated personal chef request submission.
- No separate contact form API route is present in the current app tree.

## Follow-up implementation notes

Once the provider is selected, wire the limiter only at the beginning of each sensitive `POST` handler or credentials authorization path. Keep the limiter independent of Prisma schema and do not change checkout, order, catering, personal chef, or admin business logic beyond returning `429` before processing an over-limit request.
