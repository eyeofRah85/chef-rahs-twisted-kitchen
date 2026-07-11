# Guest Checkout Review

Date: July 11, 2026
Status: Planning only. No application behavior is changed by this document.

## Goal

Support true guest checkout for pickup and delivery orders without creating fake users, passwordless users, or attaching guest orders to registered accounts by email alone.

Guest customers should be able to provide contact and fulfillment details, submit an order, appear in admin workflows, and receive transactional emails. Guest customers should not gain account-page access unless they register or log in normally.

## Current Checkout/Auth Architecture Summary

The public menu and cart can be used without an account, but order submission is currently authenticated.

- `app/checkout/page.tsx` is a client page and does not redirect anonymous visitors by itself.
- Checkout calls `/api/account/profile` to prefill contact fields. That endpoint returns `401` for anonymous visitors, and the checkout page silently falls back to blank contact fields.
- Checkout calls `useCustomerAllergens`, which fetches `/api/account/allergens`. Anonymous visitors also receive `401`; the hook treats that as no saved allergen preferences.
- `app/api/orders/route.ts` calls `auth()` and returns `401 Unauthorized` when there is no logged-in user email.
- The order API sets `customerEmail` from `session.user.email`; checkout does not currently collect an email address.
- The order API always creates the order with `user.connect({ email: customerEmail })`.
- If `checkout.saveContactInfo` is true, the order API updates the logged-in user's profile after order creation.
- After a successful checkout, the client redirects to `/orders/[id]`, which currently requires login and filters by the authenticated user's order relationship.

## Current Order/User Data Model Findings

The existing schema is already close to guest-ready for basic order persistence.

- `Order.userId` is nullable: `String?`.
- `Order.user` is optional: `User?`.
- `Order` already stores customer contact fields independent of `User`:
  - `customerName`
  - `customerEmail`
  - `customerPhone`
  - delivery name, phone, address, city, state, postal code, and notes
- `Order` already stores payment, approval, scheduling, allergen acknowledgement, totals, order items, status history, and weekly meal plan snapshots without requiring a user.
- Admin order pages query `Order` directly and display customer name/email from the order, so guest orders can appear in admin without being tied to a `User`.
- Account pages query orders through `User.orders`, so guest orders with `userId = null` would not appear in account history.

## Is A Prisma Migration Required?

No migration is required for the minimum safe implementation of true guest orders.

The current `Order.userId` is already nullable, and the order table already contains the customer/contact fields needed for guest pickup and delivery orders.

A Prisma migration would only be recommended if the product wants secure guest order detail links, claimable guest orders, or tokenized guest tracking. In that case, add a dedicated guest access token model or hashed token fields rather than exposing order IDs publicly.

## Recommended Guest Order Data Model

For the first implementation, keep the existing data model:

- Logged-in orders: keep `Order.userId` connected to the authenticated `User`.
- Guest orders: create `Order` with no `user` relation and store `customerName`, `customerEmail`, `customerPhone`, and delivery fields on the order.
- Do not auto-attach a guest order to a registered account just because the guest typed an email that matches an existing user.
- Do not create fake users or passwordless users.

Optional future model for guest detail links:

- Add a `GuestOrderAccessToken` table or token hash fields tied to `Order`.
- Store only a hash of the token.
- Expire or rotate tokens when appropriate.
- Never use raw order IDs as sufficient authorization for guest detail pages.

## Recommended Checkout UI Behavior

Checkout should support two modes based on session state:

- Logged-in customer:
  - Keep current profile prefill.
  - Use the authenticated account email for the order.
  - Keep "save contact info" behavior.
  - Keep account allergen preference behavior.
- Guest customer:
  - Show an email input alongside name and phone.
  - Require name, email, and phone for pickup.
  - Require name, email, phone, address line 1, city, state, and postal code for delivery.
  - Hide or disable "save contact info" because there is no account profile.
  - Avoid text implying account prefill when no session exists.
  - After submission, route to a guest-safe confirmation screen instead of `/orders/[id]`.

Recommended guest confirmation behavior for the first implementation:

- Show a generic checkout success page with the order ID and "check your email" messaging.
- Do not expose full order details publicly.
- Keep full order details in email and admin, or add tokenized detail links in a later implementation.

## Recommended Order API Behavior

`POST /api/orders` should accept optional authentication.

Recommended flow:

1. Call `auth()`, but do not reject when no session exists.
2. Parse and validate `checkout.email` for guest orders.
3. Determine the trusted customer email:
   - logged-in: `session.user.email`
   - guest: normalized `checkout.email`
4. Determine user ownership:
   - logged-in: connect the order to the authenticated user.
   - guest: omit the `user` relation entirely.
5. Keep all current server-side price, fee, weekly period, weekly slot, breakfast-only, no-weekend, and requested date/time validation.
6. Keep client-submitted totals non-authoritative.
7. For account allergen preferences:
   - logged-in: keep current saved allergen preference lookup.
   - guest: skip account allergen lookup; rely on explicit allergy notes and visible allergen data.
8. Only update profile/contact info for logged-in users.
9. Send confirmation email to the trusted customer email.
10. Return enough information for the checkout UI to show a guest-safe confirmation.

Important security note: do not use `checkout.email` to look up a `User` and connect the order unless the customer is authenticated as that user.

## Account Page And Ownership Implications

Current account ownership checks should remain strong.

- `/account` redirects anonymous visitors to `/login`.
- `/account/orders` redirects anonymous visitors to `/login` and only shows `user.orders`.
- `/orders/[id]` redirects anonymous visitors to `/login` and uses `where: { id, user: { email: session.user.email } }`.

Recommended first implementation:

- Do not expose guest orders through account pages.
- Keep `/orders/[id]` account-owned only.
- Do not let a registered user see a previous guest order just because the email matches.
- Use a guest thank-you page and email content for guest visibility.

If guest order detail links are required later, implement tokenized guest access instead of weakening `/orders/[id]`.

## Admin Display Implications

Admin order pages already work mostly from order snapshot fields, not user profile fields.

Recommended admin changes:

- Include `userId` in admin order list/detail queries.
- Display a small `Guest` badge when `userId` is null.
- Display `Registered customer` or no badge when `userId` is present.
- Keep customer name/email/phone from the `Order` fields as the source of truth for both guest and logged-in orders.
- Do not add guest customers to the admin customer list unless a separate guest/customer CRM feature is intentionally designed.

Admin kitchen, payments, reports, and weekly fulfillment views should continue to work because they query `Order` and `OrderItem` data directly.

## Email Implications

Transactional emails already send to `Order.customerEmail`, which is compatible with guest orders.

Required changes:

- Order creation email should send to guest `checkout.email`.
- Approval, denial, and payment received emails should continue to send to `order.customerEmail`.
- Guest emails should not include a login-only `View Order Details` CTA unless a tokenized guest detail link exists.
- For the first implementation, make order detail URLs/buttons optional in `OrderConfirmationEmail`, `OrderApprovalEmail`, and `PaymentReceivedEmail`, or replace them with support/contact text for guest orders.
- Logged-in customer emails can continue linking to `/orders/[id]`.

## Files Likely To Change During Implementation

Likely application files:

- `types/order.ts`: add `email` to checkout details.
- `store/checkout-store.ts`: persist/reset guest email appropriately.
- `app/checkout/page.tsx`: detect session or profile state, render guest email field, adjust profile copy/save behavior, and route guests to a safe confirmation page.
- `app/api/orders/route.ts`: make auth optional, validate guest email, conditionally connect `user`, skip profile/allergen account logic for guests, and return guest-aware response data.
- `emails/OrderConfirmationEmail.tsx`: make account-only detail CTA optional or conditional.
- `emails/OrderApprovalEmail.tsx`: make account-only detail CTA optional or conditional.
- `emails/PaymentReceivedEmail.tsx`: make account-only detail CTA optional or conditional.
- `app/admin/orders/page.tsx`: optionally show Guest badge.
- `app/admin/orders/[id]/page.tsx`: optionally show Guest badge.
- `app/checkout/thank-you/page.tsx` or similar: guest-safe success page.

Files that should not be weakened:

- `app/account/page.tsx`
- `app/account/orders/page.tsx`
- `app/orders/[id]/page.tsx`
- auth/session ownership checks

## Implementation Phases

1. Add checkout email support.
   - Extend checkout types/store.
   - Add guest email field.
   - Hide account-save behavior when unauthenticated.

2. Make order creation guest-aware.
   - Allow anonymous requests.
   - Validate guest contact/email fields.
   - Create `Order` without `user` for guests.
   - Preserve logged-in order creation behavior.

3. Adjust post-submit and emails.
   - Add guest thank-you page.
   - Make email detail links conditional.
   - Keep logged-in detail links unchanged.

4. Improve admin visibility.
   - Add Guest badge where useful.
   - Ensure order filters, kitchen, payments, and reports still include guest orders.

5. Optional later phase: secure guest order detail links.
   - Add tokenized guest access model.
   - Do not expose orders by raw ID.

## Risks And Edge Cases

- Email ownership: a guest may enter an email that belongs to a registered account. Do not attach the order to that account without login.
- Order detail access: current `/orders/[id]` is login-only; guest emails must not send a broken account-only link.
- Profile save: guests cannot save contact info. Keep profile updates logged-in only.
- Account allergen preferences: guests have no saved allergen preferences. Do not look up another user's allergen preferences by guest-entered email.
- Reorder: guest orders should not be reorderable from account history unless the user later places an authenticated reorder from their own account history.
- Admin customer list: guest orders will not appear under a `User` profile. Admin order search/filtering may need future guest/customer CRM treatment.
- Rate limiting: anonymous order creation should rely on existing order-create rate limits and may need additional anti-spam tuning after launch.
- Email deliverability: guests can mistype email addresses; consider confirmation copy and admin contact correction workflows.
- Duplicate submissions: preserve current submission lock and server-side validation; consider idempotency later if double-submit becomes a problem.

## Manual QA Checklist

Guest checkout:

1. Anonymous pickup order requires name, email, phone, date/time, and payment choice.
2. Anonymous delivery order requires name, email, phone, address line 1, city, state, postal code, date/time, and payment choice.
3. Anonymous order creates `Order.userId = null`.
4. Anonymous order does not create a `User`.
5. Anonymous order sends confirmation email to the entered email.
6. Anonymous order appears in admin orders, kitchen, payment, and reports.
7. Anonymous order does not appear in `/account/orders`.
8. Anonymous `/orders/[id]` still redirects to login or denies access.
9. Guest success page does not leak sensitive order details.

Logged-in checkout:

1. Logged-in order still connects to the authenticated `User`.
2. Logged-in order still uses the authenticated account email.
3. Profile prefill still works.
4. Save contact info still updates the authenticated user's profile.
5. Account allergen warnings still work.
6. `/account/orders` and `/orders/[id]` still show only that user's orders.

Shared behavior:

1. Weekly meal plan slot selections still work.
2. Breakfast-only offering filtering and API validation still work.
3. Weekly option upcharges still price and persist server-side.
4. No-weekend and past requested date/time validation still work.
5. Late fee still uses order submission time.
6. Payment behavior remains unchanged.
7. Catering and personal chef behavior remain unchanged.

## Recommendation For Next Implementation Branch

Recommended branch name:

`feature/true-guest-checkout`

Recommended scope:

Implement minimum true guest orders without public guest detail links. Keep `/orders/[id]` account-owned, add a guest-safe thank-you screen, and make transactional email CTAs conditional. This delivers the core business requirement without adding schema or order-access-token complexity.
