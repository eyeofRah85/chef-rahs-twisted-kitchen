# Weekly Meal Plan Modeling Discovery

Date: June 8, 2026
Updated: June 9, 2026
Decisions updated: June 13, 2026

This document captures the desired workflow for weekly meal plans before any schema or route changes are made. It is intentionally a discovery artifact, not an implementation plan.

## Current State

Meal plans currently use the existing menu and cart model:

- Meal plans are `MenuItem` records with `type = MEAL_PLAN`.
- Public `/menu` displays meal plans and a la carte items together.
- Admin `/admin/menu` manages meal plan menu items, availability, pricing, images, allergens, and option groups.
- The meal plan template now adds only customer-facing spice level and protein substitution groups.
- Public meal plan items and order creation only expose and validate those customer-facing groups.
- Pork and beef are represented as request-only protein choices.
- Request-only choices and meal-plan-level approval flags can make checkout orders require admin approval.
- Orders snapshot selected option text into `OrderItem.notes`, preserving what the customer chose at order time.

This works for the current fixed-offering flow, but it does not model a weekly menu period, weekly publishing, package records, or reporting by weekly period.

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

## Client Decisions - June 13, 2026

The open business decisions have been answered:

- Account allergens can use controlled checkbox selections as long as the controlled list includes all true allergens.
- "Other" food notes are more likely preferences than allergens, so do not add an allergen free-text field yet.
- Allergen conflicts should block checkout until the customer acknowledges the warning.
- Allergen alerts should appear for any food item, not only meal plans.
- Allergen acknowledgement should be stored both at the order level and item level.
- Customers may order multiple fixed meal plans in the same cart.
- Weekly meal packages use fixed pricing. A la carte items remain separately priced.
- Customers can only order from the current published week.
- Weekly menus should have a total capacity of 10 orders.
- Admins should be able to clone weekly menus, with a longer-term goal of supporting rotating menus.
- Additional proteins such as beef, pork, and lamb should be request-only and require approval.
- Other allowed substitutions do not need approval.

## Desired Admin Workflow

The future admin workflow should center around weekly menu periods:

1. Create a weekly menu period
   - Week label, such as "June 17-23".
   - Start date and end date.
   - Ordering cutoff date/time.
   - Fulfillment/delivery window or pickup date.
   - Capacity, initially 10 orders per weekly menu period.
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
   - Lamb and other premium/additional proteins should follow the same request-only approval path.
   - Other allowed substitutions can be offered without approval.
   - Customers should not assemble arbitrary meals from components.
   - Admin should be able to reuse or clone fixed offerings from a prior week.
   - Longer-term, admin should be able to build a rotating menu pattern from cloned or reusable weekly menus.

4. Publish the week
   - Draft weeks are hidden from customers.
   - Only the current published week appears for customer ordering on `/menu`.
   - Closed weeks no longer accept new orders but remain visible to admins.
   - Archived weeks remain available for reporting and order history.
   - Once the weekly period reaches 10 orders, checkout should stop accepting additional weekly meal plan orders for that week.

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
   - Package price is fixed for the selected weekly package.
5. Customer chooses only supported customer-facing options:
   - Spice level.
   - Allowed protein substitutions.
6. Customer reviews request-only substitutions, such as pork or beef, with clear pricing/approval language.
7. If any selected food item contains allergens from the customer's account profile, the customer sees a clear warning before adding to cart or proceeding.
8. Customer adds the plan to cart.
9. Checkout remains the payment/order flow for meal plans.
10. Checkout blocks progression until any account-allergen conflict is acknowledged.
11. Customer may add multiple fixed meal plans to the same cart.
12. Order details and confirmation emails preserve the selected weekly period, fixed meal plan, package, spice level, protein substitution, request-only flags, and allergen warning acknowledgement.

## Recommended Selection Model

For the next implementation phase, the safest customer model is a fixed-offering model:

- Customer chooses a fixed meal plan offering.
- Customer chooses package length and 1- or 2-meal-per-day package.
- Weekly package price is fixed.
- Customer may choose spice level.
- Customer may choose allowed protein substitutions.
- Additional proteins such as beef, pork, and lamb remain clearly marked as request-only and continue to trigger approval.
- Other allowed substitutions do not need approval.
- Customer sees allergen conflict alerts based on account allergen preferences for any food item.

This keeps the experience simple for customers and protects the business from unsupported custom meal assembly.

## Allergen Account And Alert Workflow

The client wants a small allergen form in the customer account area. The future workflow should be:

1. Customer adds allergens in account profile.
   - Prefer structured checkboxes from the existing `Allergen` records where practical.
   - Do not add an "Other allergen notes" field yet; non-listed notes are likely preferences rather than allergens.
2. Public menu and item modal compare the customer's allergen list with selected food item allergens when the customer is signed in.
3. Cart and checkout repeat the warning for any selected item with matching allergens.
4. Checkout should require acknowledgement before the customer can place an order containing an allergen conflict.
5. Order creation should validate the acknowledgement server-side so bypassing the UI cannot skip the warning.
6. Historical orders should preserve the allergen conflict warning/acknowledgement at both the order level and order item level.

## Resolved Business Decisions

These were answered on June 13, 2026:

- Account allergens: controlled checkbox selections only for now.
- Allergen checkout behavior: block until acknowledged.
- Allergen alert scope: all food items.
- Allergen acknowledgement snapshot: both order level and item level.
- Cart behavior: multiple meal plans can be ordered in the same cart.
- Weekly package pricing: fixed price.
- Ordering window: current published week only.
- Capacity: 10 orders per weekly menu period.
- Admin reuse: clone weekly menus; support rotating menus later.
- Request-only proteins: beef, pork, lamb, and similar additional proteins require approval; other substitutions do not.

## Future Schema Direction

The client decisions now support moving into a small schema proposal. A likely future shape is:

- `WeeklyMenuPeriod`
  - Week label, date range, cutoff, fulfillment window, status, order capacity, and optional rotation metadata.
- `WeeklyMealPlanPackage`
  - Belongs to a weekly period.
  - Stores package length, 1- or 2-meal-per-day count, fixed price, availability, and display order.
- `WeeklyMealPlanOffering`
  - Belongs to a weekly period.
  - Stores fixed meal plan name, description, image URL, dietary info, allergens, base price, approval flags, and availability.
- `WeeklyMealPlanAllowedOption`
  - Stores limited customer-facing options for spice level and protein substitutions.
  - Tracks request-only substitutions, approval requirements, and price deltas when needed.
- `UserAllergen`
  - Joins a customer account to existing `Allergen` records.
- `WeeklyMealPlanSelection` or order item snapshot fields
  - Captures a customer's chosen weekly period, package, fixed meal plan, spice level, protein substitution, request-only approval flags, and allergen warning acknowledgement before order creation.
  - Should preserve allergen acknowledgement both on the order and on each affected order item.

The existing `MenuItem`, `MenuItemOptionGroup`, and `MenuItemOptionChoice` models should remain stable until this design is reviewed. Current package-style meal plans can continue to use the existing menu item workflow while the weekly model is designed.

## Near-Term Recommendation

The next safe step is a small schema proposal for dedicated weekly menu models. Based on the confirmed requirements, dedicated weekly menu models are preferred because the business wants current-week publishing, fixed package prices, capacity limits, cloning, rotating menus, allergen-aware fulfillment, and reporting by weekly period.

Do not remove the existing `MenuItem`, `MenuItemOptionGroup`, or `MenuItemOptionChoice` flow yet. Build the weekly model alongside the current menu model first, then decide how weekly offerings feed `/menu`, cart, checkout, kitchen prep, order snapshots, and confirmation emails.
