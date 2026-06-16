# Weekly Meal Plan Manual QA Checklist

Use this checklist for local browser testing of the weekly meal plan workflow.

## Preconditions

- Run the app locally with the development database configured.
- Sign in with one admin account and one customer account.
- Create or confirm a published weekly menu period that includes:
  - At least one 1-meal package.
  - At least one 2-meal package.
  - At least one fixed offering.
  - At least one spice level option.
  - At least one protein substitution option marked request-only and approval-required.
  - At least one allergen tag that can match the customer account allergen preferences.
- If `RESEND_API_KEY` is configured locally, set `EMAIL_DRY_RUN=true` and `EMAIL_PREVIEW_FILES=true` before checkout QA so order emails are written to `.email-previews/*.eml` instead of sending real email.

## Customer Ordering

1. Open `/menu` as the customer.
2. Confirm the current published weekly menu appears with the date range, order cutoff, and weekly order capacity remaining.
3. Add a weekly plan with a package, offering, spice level, and no protein substitution.
4. Add a second weekly plan from the same weekly period with a request-only protein substitution.
5. Confirm both weekly plans appear in the cart with package, offering, spice, protein, approval, and allergen details.
6. If the customer has a matching allergen preference, confirm checkout blocks submission until the allergen warning is acknowledged.
7. Submit the order and confirm the order detail page preserves weekly package, offering, spice, protein, price delta, request-only, and approval-required snapshots.
8. Confirm historical weekly items in account order history are visible but are not re-added by the generic reorder button.

## Capacity

1. In `/admin/menu/weekly`, set a test weekly period capacity to a low number.
2. Submit a customer order containing one or more weekly plans from that period.
3. Confirm the weekly period capacity used count increments once for the customer order, even if the cart contains multiple weekly plan items or quantities.
4. Try submitting another weekly order after capacity is full.
5. Confirm checkout rejects the order and the public menu shows the weekly plan as unavailable or at capacity.

## Admin Fulfillment

1. Open `/admin/menu/weekly`.
2. Expand the weekly period.
3. Confirm Weekly Fulfillment Prep shows:
   - Active weekly order count.
   - Weekly order capacity used and remaining.
   - Counts by offering.
   - Counts by package.
   - Counts by spice level.
   - Counts by protein substitution.
   - Request-only, approval-required, and allergen flag counts.
4. Open `/admin/kitchen` and confirm approved weekly orders show their saved weekly snapshots.
5. Open `/admin/orders/[id]` for the order and confirm the printable kitchen ticket includes the same weekly snapshots.

## Email

1. With email preview enabled, submit a weekly order.
2. Confirm the server log includes `[EMAIL DRY RUN]` and `[EMAIL PREVIEW SAVED]`.
3. Confirm the saved `.eml` preview includes contact/delivery info and weekly meal plan snapshots.
4. If email is not configured locally, confirm the server logs skip email gracefully.
