# Weekly Meal Plan Modeling Discovery

Date: June 8, 2026
Updated: June 9, 2026

This document captures the desired workflow for weekly meal plans before any schema or route changes are made. It is intentionally a discovery artifact, not an implementation plan.

## Current State

Meal plans currently use the existing menu and cart model:

- Meal plans are `MenuItem` records with `type = MEAL_PLAN`.
- Public `/menu` displays meal plans and a la carte items together.
- Admin `/admin/menu` manages meal plan menu items, availability, pricing, images, allergens, and option groups.
- The meal plan template adds option groups for plan length, meals per day, protein, vegetable, starch, and substitutions.
- Pork and beef are represented as request-only protein choices.
- Request-only choices and meal-plan-level approval flags can make checkout orders require admin approval.
- Orders snapshot selected option text into `OrderItem.notes`, preserving what the customer chose at order time.

This works for package-style meal plans, but it does not model a weekly menu period, weekly publishing, customer allergen preferences, or allergen conflict alerts.

## Client Update - June 9, 2026

The client clarified the meal plan direction:

- Meal plans will not be truly customizable.
- Meal plan menu items should be set in stone by the business.
- Customer-facing choices should be limited to spice level and protein substitutions.
- Most option work should support admin item creation and meal plan setup, not broad customer customization.
- The 3-meal package should be removed.
- Packages should support 1-meal or 2-meal options only.
- Customer accounts should include a small allergen form.
- Customers should see an alert when a selected meal plan contains allergens from their account allergen list.
- The allergen alert should also appear before checkout is allowed to proceed.

## Desired Admin Workflow

The future admin workflow should center around weekly menu periods:

1. Create a weekly menu period
   - Week label, such as "June 17-23".
   - Start date and end date.
   - Ordering cutoff date/time.
   - Fulfillment/delivery window or pickup date.
   - Draft, published, closed, and archived states.

2. Configure package offerings for that week
   - 5-day or 7-day package.
   - 1 meal per day or 2 meals per day.
   - Base price for each package.
   - Optional package-specific notes.
   - Optional approval requirement if chef review is needed.

3. Add fixed weekly meal plan offerings
   - Each meal plan should have a fixed name, description, image URL, allergens, dietary notes, availability, and base price.
   - Admin should attach allergens carefully because they will drive customer safety alerts.
   - Admin may configure customer-facing spice level choices.
   - Admin may configure allowed protein substitutions.
   - Pork and beef should remain request-only/approval-sensitive when offered as substitutions.
   - Customers should not assemble arbitrary meals from components.
   - Admin should be able to reuse or clone fixed offerings from a prior week.

4. Publish the week
   - Draft weeks are hidden from customers.
   - Published weeks appear on `/menu`.
   - Closed weeks no longer accept new orders but remain visible to admins.
   - Archived weeks remain available for reporting and order history.

5. Prepare fulfillment
   - Admin should be able to see orders grouped by weekly period.
   - Kitchen prep should show counts by fixed meal plan, package, spice level, protein substitution, allergen flags, and request-only/approval flags.
   - Customer order snapshots must preserve the weekly period, fixed meal plan, package, spice level, protein substitution, and allergen warning acknowledgement used at order time.

## Desired Customer Workflow

The future customer flow should stay inside `/menu` and cart checkout:

1. Customer opens `/menu`.
2. Customer sees the currently published weekly meal plan period.
3. Customer selects a fixed meal plan.
4. Customer selects a package:
   - 5-day or 7-day.
   - 1 meal per day or 2 meals per day.
5. Customer chooses only supported customer-facing options:
   - Spice level.
   - Allowed protein substitutions.
6. Customer reviews request-only substitutions, such as pork or beef, with clear pricing/approval language.
7. If the meal plan contains allergens from the customer's account profile, the customer sees a clear warning before adding to cart or proceeding.
8. Customer adds the plan to cart.
9. Checkout remains the payment/order flow for meal plans.
10. Checkout blocks progression until any account-allergen conflict is acknowledged.
11. Order details and confirmation emails preserve the selected weekly period, fixed meal plan, package, spice level, protein substitution, request-only flags, and allergen warning acknowledgement.

## Recommended Selection Model

For the next implementation phase, the safest customer model is a fixed-offering model:

- Customer chooses a fixed meal plan offering.
- Customer chooses package length and 1- or 2-meal-per-day package.
- Customer may choose spice level.
- Customer may choose allowed protein substitutions.
- Request-only proteins remain clearly marked and continue to trigger approval.
- Customer sees allergen conflict alerts based on account allergen preferences.

This keeps the experience simple for customers and protects the business from unsupported custom meal assembly.

## Allergen Account And Alert Workflow

The client wants a small allergen form in the customer account area. The future workflow should be:

1. Customer adds allergens in account profile.
   - Prefer structured checkboxes from the existing `Allergen` records where practical.
   - Include a small free-text note only if the business wants to capture allergens not yet in the controlled list.
2. Public menu and item modal compare the customer's allergen list with the selected meal plan's allergens when the customer is signed in.
3. Cart and checkout repeat the warning for any selected item with matching allergens.
4. Checkout should require acknowledgement before the customer can place an order containing an allergen conflict.
5. Order creation should validate the acknowledgement server-side so bypassing the UI cannot skip the warning.
6. Historical orders should preserve the allergen conflict warning/acknowledgement in the order snapshot or order item notes.

## Open Business Decisions

These should be answered before schema work:

- Should account allergens be controlled checkbox selections only, or should customers also have an "Other allergen notes" field?
- Should allergen conflicts block checkout until acknowledged, or should some allergens fully block checkout?
- Should allergen alerts appear for all item types, or only meal plans?
- Should allergen acknowledgement be stored per order, per order item, or both?
- Should customers choose one fixed meal plan package only, or can they order multiple fixed meal plans in the same cart?
- Are weekly package prices fixed, or calculated from meal selections and price deltas?
- Can a customer order a future week, or only the current published week?
- Should weekly menu periods have inventory/capacity limits?
- Should admin be able to clone an entire prior week, including packages and meal choices?
- Should request-only pork/beef remain substitution choices, or become separate approval-only fixed plan variants?

## Future Schema Direction

No schema changes should be made until the open decisions are confirmed. A likely future shape is:

- `WeeklyMenuPeriod`
  - Week label, date range, cutoff, fulfillment window, status.
- `WeeklyMealPlanPackage`
  - Belongs to a weekly period.
  - Stores package length, 1- or 2-meal-per-day count, base price, availability, and display order.
- `WeeklyMealPlanOffering`
  - Belongs to a weekly period.
  - Stores fixed meal plan name, description, image URL, dietary info, allergens, base price, approval flags, and availability.
- `WeeklyMealPlanAllowedOption`
  - Stores limited customer-facing options for spice level and protein substitutions.
  - Tracks request-only substitutions and price deltas when needed.
- `UserAllergen`
  - Joins a customer account to existing `Allergen` records.
  - Optional free-text notes can be added only if needed.
- `WeeklyMealPlanSelection` or order item snapshot fields
  - Captures a customer's chosen package, fixed meal plan, spice level, protein substitution, and allergen warning acknowledgement before order creation.
  - May be embedded into order item snapshot fields or normalized into order-specific selection rows.

The existing `MenuItem`, `MenuItemOptionGroup`, and `MenuItemOptionChoice` models should remain stable until this design is reviewed. Current package-style meal plans can continue to use the existing menu item workflow while the weekly model is designed.

## Near-Term Recommendation

Do not implement weekly menu tables yet. First, review the open business decisions with the client. After those answers are known, create a small schema proposal and decide whether weekly meal plans should:

- extend the existing `MenuItem` model with weekly-period relations and allergen-aware checkout warnings, or
- use dedicated weekly menu models for fixed weekly meal plan offerings that feed cart/order snapshots.

Dedicated weekly menu models are still likely cleaner if the business wants weekly publishing, cloning, cutoff handling, allergen-aware fulfillment, and reporting by weekly period.
