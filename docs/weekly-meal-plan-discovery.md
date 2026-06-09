# Weekly Meal Plan Modeling Discovery

Date: June 8, 2026

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

This works for package-style meal plans, but it does not model a weekly menu period, day-by-day meal slots, weekly publishing, or structured meal selections.

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
   - 2 meals per day or 3 meals per day.
   - Base price for each package.
   - Optional package-specific notes.
   - Optional approval requirement if chef review is needed.

3. Add weekly meal choices
   - Lunch and dinner should be first-class meal types.
   - Breakfast can be added later if the 3-meal-day option needs structured breakfast selection.
   - Each meal choice should support name, description, image URL, allergens, dietary notes, availability, and optional price delta.
   - Meal choices should be assigned to a weekly period and meal type.
   - Admin should be able to reuse or clone choices from a prior week.

4. Decide the customer selection model before coding
   - Choice model: customers choose specific meals for each package slot.
   - Preference model: customers choose components/preferences, and Chef Rah assigns meals.
   - Hybrid model: customers choose preferred meals where available and provide substitutions/preferences for the rest.

5. Publish the week
   - Draft weeks are hidden from customers.
   - Published weeks appear on `/menu`.
   - Closed weeks no longer accept new orders but remain visible to admins.
   - Archived weeks remain available for reporting and order history.

6. Prepare fulfillment
   - Admin should be able to see orders grouped by weekly period.
   - Kitchen prep should show counts by meal choice, package, and request-only/approval flags.
   - Customer order snapshots must preserve the weekly period and meal selections used at order time.

## Desired Customer Workflow

The future customer flow should stay inside `/menu` and cart checkout:

1. Customer opens `/menu`.
2. Customer sees the currently published weekly meal plan period.
3. Customer selects a package:
   - 5-day or 7-day.
   - 2 meals per day or 3 meals per day.
4. Customer chooses meals or preferences depending on the confirmed selection model.
5. Customer reviews request-only choices, such as pork or beef, with clear pricing/approval language.
6. Customer adds the plan to cart.
7. Checkout remains the payment/order flow for meal plans.
8. Order details and confirmation emails preserve the selected weekly period, package, meal choices, substitutions, and request-only flags.

## Recommended Selection Model

For the next implementation phase, the safest customer model is the hybrid model:

- Customer chooses package length and meals per day.
- Customer can select from published lunch/dinner meal choices.
- Customer can repeat a meal choice if allowed by the business.
- Customer can leave some selections flexible and provide preferences.
- Request-only proteins remain clearly marked and continue to trigger approval.

This keeps the experience useful for customers while preserving operational flexibility for the chef.

## Open Business Decisions

These should be answered before schema work:

- Should customers choose every meal slot, or only choose preferred meals/components?
- Can customers repeat the same meal choice multiple times in a package?
- Does a 3-meal-day package require breakfast choices, or is breakfast handled as a preference/add-on?
- Are weekly package prices fixed, or calculated from meal selections and price deltas?
- Can a customer order a future week, or only the current published week?
- Should weekly menu periods have inventory/capacity limits?
- Should admin be able to clone an entire prior week, including packages and meal choices?
- Should request-only pork/beef remain option choices, or become separate approval-only meal choices?

## Future Schema Direction

No schema changes should be made until the open decisions are confirmed. A likely future shape is:

- `WeeklyMenuPeriod`
  - Week label, date range, cutoff, fulfillment window, status.
- `WeeklyMealPlanPackage`
  - Belongs to a weekly period.
  - Stores package length, meals per day, base price, availability, and display order.
- `WeeklyMealChoice`
  - Belongs to a weekly period.
  - Stores meal type, name, description, image URL, dietary info, allergens, price delta, request-only flag, and availability.
- `WeeklyMealPlanSelection`
  - Captures a customer's chosen package and selected meal choices before order creation.
  - May be embedded into order item snapshot fields or normalized into order-specific selection rows.

The existing `MenuItem`, `MenuItemOptionGroup`, and `MenuItemOptionChoice` models should remain stable until this design is reviewed. Current package-style meal plans can continue to use the existing menu item workflow while the weekly model is designed.

## Near-Term Recommendation

Do not implement weekly menu tables yet. First, review the open business decisions with the client. After those answers are known, create a small schema proposal and decide whether weekly meal plans should:

- extend the existing `MenuItem` model with weekly-period relations, or
- use dedicated weekly menu models that feed cart/order snapshots.

Dedicated weekly menu models are likely cleaner if customers need day-by-day or slot-by-slot selections.
