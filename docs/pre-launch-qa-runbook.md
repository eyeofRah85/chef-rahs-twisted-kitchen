# Pre-Launch QA Runbook

Last updated: June 19, 2026

Use this runbook for the final local dry run and the production smoke test before Chef Rah's Twisted Kitchen goes live.

This document is intentionally operational. It is meant to be checked off by the developer, site owner, or launch support person while the app is running.

## Scope

This runbook covers:

- Public customer pages.
- Customer account/profile/allergen flows.
- Menu, weekly meal plan, cart, checkout, and order flows.
- Catering and Personal Chef service request flows.
- Admin dashboard, orders, kitchen, service requests, menu, weekly menu, gallery, reports, payments, notifications, and settings.
- Email preview/live-send checks.
- Launch environment and database checks.

This runbook does not replace `docs/launch-readiness-checklist.md`. Use that document for production environment requirements and launch commands.

## Required Accounts

Prepare these accounts before QA:

- Admin account with role `ADMIN` or `OWNER`.
- Customer account with saved phone and delivery address.
- Customer account with at least one saved allergen preference.
- Optional second customer account for checking that checkout profile/contact data does not leak between users.

Production admin promotion should happen only after the admin has registered:

```powershell
npm run owner:promote
```

## Required Local Settings

For local QA, keep real email disabled:

```env
EMAIL_DRY_RUN=true
EMAIL_PREVIEW_FILES=true
```

If `RESEND_API_KEY` is present locally, do not submit test orders unless dry-run or preview mode is enabled.

For production launch QA, set live email intentionally:

```env
EMAIL_DRY_RUN=false
EMAIL_PREVIEW_FILES=false
```

## Validation Commands

Run before manual QA:

```powershell
npm run check
npm run env:check -- --report
.\node_modules\.bin\prisma.cmd migrate status
```

For production deployment after final environment values are set:

```powershell
npm run prisma:generate
.\node_modules\.bin\prisma.cmd migrate deploy
npm run owner:promote
```

## Test Data Setup

Before the end-to-end pass, confirm the app has:

- At least one active A La Carte item.
- At least one active dessert or side item if those categories are expected at launch.
- A published weekly menu for the current week.
- One 1-meal weekly package.
- One 2-meal weekly package.
- At least two weekly offerings.
- At least one spice level option.
- At least one normal protein substitution.
- At least one request-only approval-required protein substitution, such as lamb, beef, or pork.
- Allergen tags on food items and weekly offerings.
- Weekly capacity set to the launch value, currently expected to be 10 customer orders.
- Gallery records using production-ready image URLs or confirmed durable upload paths.

## Public Page Smoke Test

Check these pages on desktop and mobile:

- `/`
- `/about`
- `/menu`
- `/cart`
- `/checkout`
- `/catering`
- `/personal-chef`
- `/gallery`
- `/login`
- `/register`

Pass criteria:

- Page loads without console errors.
- No page-level horizontal scrolling on mobile.
- Header and footer navigation work.
- Calls to action lead to the intended route.
- Images load and do not look stretched, broken, or overly dark.
- Text is readable on mobile.
- Buttons and links have visible focus states.

## Account And Profile QA

As a customer:

1. Register a new account.
2. Log out and log back in.
3. Open `/account`.
4. Save name, phone, delivery address, and delivery notes.
5. Save allergen preferences.
6. Refresh the page and confirm saved data remains.
7. Open checkout and confirm profile data preloads.
8. Edit checkout contact/delivery data.
9. Submit an order with "save contact info" enabled.
10. Return to account profile and confirm the edited checkout contact data was saved.

Pass criteria:

- Profile saves do not drop existing fields.
- Checkout preloads the current user's profile only.
- A second signed-in user does not see the first user's persisted checkout contact data.
- Allergen preferences persist and drive cart/checkout warnings.

## Menu And Cart QA

As a customer:

1. Open `/menu`.
2. Confirm quote-based Catering and Personal Chef services do not appear as checkout products.
3. Add an A La Carte item to cart.
4. Add a weekly meal plan using a 1-meal package.
5. Add a weekly meal plan using a 2-meal package.
6. Choose spice level and protein substitution where available.
7. Add one request-only approval-required protein substitution.
8. Open `/cart`.
9. Increase and decrease item quantities.
10. Remove an item.
11. Confirm item totals, weekly snapshots, allergen notices, and approval-required notices remain clear.

Pass criteria:

- Weekly meal plan choices are limited to spice level and protein substitution.
- No 3-meal package is visible.
- Request-only proteins clearly explain chef approval may be required.
- Cart totals update correctly.
- Allergen warnings appear when cart items conflict with saved customer allergens.

## Checkout QA

Run both delivery and pickup paths.

Delivery:

1. Select Delivery.
2. Confirm delivery name, phone, address line 1, city, state, and postal code are required.
3. Leave required delivery fields blank and confirm the UI blocks submission.
4. Fill all required delivery fields.
5. Add delivery notes.
6. Choose requested date/time.
7. Add allergy or preference notes if needed.
8. Acknowledge allergen warnings if present.
9. Submit the order.

Pickup:

1. Select Pickup.
2. Confirm delivery address fields are not required.
3. Confirm customer name/email and any required pickup contact fields are required.
4. Choose requested date/time.
5. Submit the order.

Pass criteria:

- Frontend validation and backend validation agree.
- Empty cart checkout is blocked.
- Disabled payment methods cannot be submitted.
- Manual payment wording is clear.
- Allergen acknowledgement cannot carry over from an earlier checkout.
- Order total matches cart total.
- Submitted order redirects to an order detail page.

## Order Detail And Email QA

After submitting a test order:

1. Open the customer order detail page.
2. Confirm delivery/contact snapshot is shown.
3. Confirm weekly meal plan snapshots are shown.
4. Confirm allergen acknowledgement is shown when applicable.
5. Confirm approval-required substitutions are shown when applicable.
6. Open the generated `.email-previews/*.eml` file during local QA.
7. Confirm the email includes contact details, delivery/pickup method, item snapshots, totals, allergen acknowledgement, and approval language.

Pass criteria:

- Historical order details show the exact contact/delivery information used at checkout.
- Email does not use raw enum labels.
- Email does not label Personal Chef as Catering.
- Email does not omit weekly plan details.

## Admin Order QA

As an admin:

1. Open `/admin/orders`.
2. Test status, payment, order type, and approval filters.
3. Open a pending order detail page.
4. Approve the order.
5. Confirm approval buttons disappear or lock after the final decision.
6. Attempt a duplicate approval/denial through the UI if possible.
7. Confirm duplicate final decisions are blocked.
8. Mark an eligible manual payment order as paid.
9. Attempt duplicate mark-paid if possible.
10. Confirm duplicate payment actions are blocked.
11. Print or preview the order ticket.

Pass criteria:

- Order approval status transitions once.
- Duplicate approval or denial does not resend email.
- Mark-paid is only available when the order has payment due.
- Order detail shows delivery/contact snapshot and weekly snapshots.

## Kitchen QA

As an admin:

1. Open `/admin/kitchen`.
2. Confirm only approved active kitchen orders are shown.
3. Move an order through accepted, preparing, ready, and completed states.
4. Confirm the UI refreshes to the new status.
5. Confirm weekly plan snapshots and allergen flags remain visible.

Pass criteria:

- Denied, cancelled, refunded, and unapproved orders are not shown as active kitchen work.
- Status changes do not require a manual hard refresh to see the new value.

## Service Request QA

Run both request types:

- `/catering`
- `/personal-chef`

As a customer:

1. Submit a Catering request with valid event date and guest count.
2. Submit a Personal Chef request with valid event date and guest count.
3. Try invalid email, invalid date, and invalid guest count values.
4. Confirm friendly validation appears.
5. Open `/account/catering` and confirm both request types appear as service requests.

As an admin:

1. Open `/admin/catering`.
2. Filter by Catering.
3. Filter by Personal Chef.
4. Open a request detail page.
5. Add a quote and deposit amount.
6. Approve or deny the request.
7. Confirm duplicate final decisions are blocked.
8. Mark deposit paid only when valid.
9. Confirm duplicate deposit-paid actions are blocked.

Pass criteria:

- Catering and Personal Chef share the Service Requests workflow without route changes.
- Personal Chef records are not labeled as Catering.
- Quote and deposit validation rejects invalid negative or non-finite values.
- Final approval/denial decisions cannot be repeated.

## Weekly Menu Admin QA

Use `docs/weekly-meal-plan-manual-qa.md` for detailed weekly meal plan checks.

Minimum pass:

1. Open `/admin/menu/weekly`.
2. Create or edit a draft weekly menu.
3. Add 1-meal and 2-meal packages.
4. Add at least two fixed offerings.
5. Add allergen tags to offerings.
6. Add spice and protein options.
7. Mark one protein option request-only and approval-required.
8. Publish the weekly menu for the current week.
9. Clone the menu into a future draft.
10. Confirm capacity counts customer orders, not item quantity.

Pass criteria:

- Admin forms remain readable and responsive.
- Weekly package choices are limited to 1 or 2 meals.
- Fixed offerings do not create broad customer meal customization.
- Clone preserves packages, offerings, allergens, and allowed options.

## Menu And Gallery Admin QA

Menu:

1. Open `/admin/menu`.
2. Create an A La Carte item.
3. Create or edit a Meal Plan item and apply the meal plan template.
4. Confirm only spice level and protein substitution option groups are added by the template.
5. Archive an item.
6. Restore an item from `/admin/menu/archived`.
7. Delete a test item that has no required production use.
8. Confirm historical order snapshots remain intact if deleting a menu item with old order references.

Gallery:

1. Open `/admin/gallery`.
2. Add a gallery image using a public image URL.
3. Edit title, category, alt text, and display order.
4. Replace an image URL.
5. Delete a test gallery image.

Pass criteria:

- Menu `type` controls behavior and category controls display grouping.
- Production images use durable URLs unless production local uploads are explicitly approved.
- Gallery images have useful alt text.

## Reports, Payments, Notifications, And Settings QA

Reports:

1. Open `/admin/reports`.
2. Confirm existing report summary cards still render.
3. Confirm Business Insights KPI cards render.
4. Test 30-day, 90-day, and 12-month period filters.
5. Confirm charts show empty states when there is not enough data.

Payments:

1. Open `/admin/payments`.
2. Confirm unpaid/manual payment counts align with orders.
3. Confirm paid and unpaid orders are readable on mobile.

Notifications:

1. Open `/admin/notifications`.
2. Confirm email mode shows preview, dry-run, live, or disabled accurately.
3. Confirm production does not launch in dry-run mode unless intentionally paused.

Settings:

1. Open `/admin/settings`.
2. Confirm delivery fee, late fee, ordering lead time, and service request deposit settings.
3. Save a harmless test edit only in local/staging.

Pass criteria:

- Reports do not crash with empty data.
- Notification page accurately reports email mode.
- Business settings forms preserve values and use service request terminology.

## Accessibility And Mobile QA

Check public and admin pages at a compact viewport.

Pass criteria:

- No page-level horizontal overflow.
- Form labels are associated with inputs.
- Validation errors are visible and readable.
- Keyboard tab order is usable.
- Focus state is visible on buttons, links, inputs, and filters.
- Text inside buttons/cards does not overlap or clip.
- Tables either fit or scroll within their own container.

## Production Smoke Test

After production environment values are set and migrations are deployed:

1. Run `npm run env:check`.
2. Register the owner account if it does not exist and set `OWNER_EMAIL` to that exact email.
3. Run `npm run owner:promote`.
4. Log in as owner and use Role Manager for additional registered admin accounts.
5. Confirm `/admin/notifications` reports live email only when intended.
6. Submit one customer order using a test customer email.
7. Confirm live order confirmation email is delivered.
8. Approve the test order.
9. Confirm live approval email is delivered.
10. Submit one Catering request.
11. Submit one Personal Chef request.
12. Confirm service request emails are delivered.
13. Confirm `/admin/reports` includes the test activity.
14. Delete or clearly mark test data if the client does not want it retained.

## Launch Signoff

Record final signoff:

- Date:
- Environment URL:
- Developer:
- Client approver:
- Admin approver:
- `npm run check` result:
- `npm run env:check` result:
- Migration status:
- Email live-send result:
- Known accepted warnings:
- Launch decision: Go / No-Go
