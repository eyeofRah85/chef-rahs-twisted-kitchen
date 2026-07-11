# Build Your Weekly Plan Meal Selection Plan

Date: July 10, 2026
Status: Planning only. No application behavior is changed by this document.

## Goal

Update the weekly meal plan experience so a customer who selects a package must choose every required meal slot from that same published weekly menu period.

Example: a 5-day / 2-meal package requires 10 meal selections. Each selection must be a `WeeklyMealPlanOffering` from the selected weekly period.

The implementation must not allow slots to be filled from regular menu items, plates, desserts, a la carte items, archived menu records, unpublished weekly periods, unavailable weekly offerings, or offerings from another weekly period.

## Current Architecture Summary

The app already has first-class weekly menu period models, public weekly menu display, cart persistence, checkout submission, order snapshotting, and downstream weekly meal plan display.

- `WeeklyMenuPeriod` defines a weekly menu window, cutoff, status, capacity, and order count.
- `WeeklyMealPlanPackage` belongs to a weekly period and defines package name, `days`, `mealsPerDay`, price, availability, and display order.
- `WeeklyMealPlanOffering` belongs to a weekly period and defines one weekly meal offering with name, description, image, dietary info, availability, allergens, and allowed options.
- `/menu` loads the current public weekly period and maps packages and offerings into `PublicWeeklyMenu`.
- `components/menu/WeeklyMenuSection.tsx` lists packages and all weekly offerings for the published period.
- `components/menu/WeeklyMenuOrderForm.tsx` currently lets the customer pick one package and one offering, plus option controls tied to that one offering.
- `store/cart-store.ts` persists a weekly cart item as one `WeeklyMealPlanCartSelection`.
- `app/checkout/page.tsx` sends the cart `items` array to `POST /api/orders`.
- `app/api/orders/route.ts` validates weekly package and offering IDs server-side, recalculates price from the database, creates an `OrderItem`, and creates a one-to-one `OrderWeeklyMealPlanSelection` snapshot.
- Customer order detail, admin order detail, kitchen cards, account order history, and `OrderConfirmationEmail` all render weekly details through `getWeeklyMealPlanSelectionDetails`.

## Data Model Findings

Current weekly packages are represented by `WeeklyMealPlanPackage`:

- `periodId`
- `name`
- `days`
- `mealsPerDay`
- `price`
- `available`
- `displayOrder`
- `notes`

Current weekly offerings are represented by `WeeklyMealPlanOffering`:

- `periodId`
- `name`
- `description`
- `imageUrl`
- `dietaryInfo`
- `available`
- `displayOrder`
- related allergens
- related allowed options

Current ordered weekly selections are represented by `OrderWeeklyMealPlanSelection`, which stores one package and one offering per order item:

- `weeklyMenuPeriodId`
- `weeklyMealPlanPackageId`
- `weeklyMealPlanOfferingId`
- package snapshot fields
- one `offeringName`
- one `spiceLevel`
- one `proteinSubstitution`
- approval/request-only flags
- price delta

That model is sufficient for the current "one package plus one offering" flow. It is not sufficient for 10 individual meal-slot choices because it can store only one `weeklyMealPlanOfferingId`.

## Is A Prisma Migration Required?

Yes. A migration is required to preserve individual meal-slot selections on historical orders.

Recommended additive model:

```prisma
model OrderWeeklyMealPlanSlotSelection {
  id                String @id @default(cuid())
  weeklySelectionId String
  weeklySelection   OrderWeeklyMealPlanSelection @relation(fields: [weeklySelectionId], references: [id], onDelete: Cascade)

  dayNumber  Int
  mealNumber Int

  weeklyMealPlanOfferingId String?
  weeklyMealPlanOffering   WeeklyMealPlanOffering? @relation(fields: [weeklyMealPlanOfferingId], references: [id], onDelete: SetNull)

  offeringName        String
  offeringDescription String?
  dietaryInfo         String?

  createdAt DateTime @default(now())

  @@unique([weeklySelectionId, dayNumber, mealNumber])
  @@index([weeklyMealPlanOfferingId])
}
```

Recommended relation additions:

```prisma
model OrderWeeklyMealPlanSelection {
  // existing fields...
  mealSlots OrderWeeklyMealPlanSlotSelection[]
}

model WeeklyMealPlanOffering {
  // existing fields...
  orderSlotSelections OrderWeeklyMealPlanSlotSelection[]
}
```

Keep the existing `OrderWeeklyMealPlanSelection.weeklyMealPlanOfferingId` and `offeringName` fields for backwards compatibility with existing orders. New build-your-plan orders can either set the parent offering to the first selected offering, or store a neutral summary such as "Build Your Weekly Plan". The slot rows become the authoritative ordered meal list for new orders.

## Proposed Cart Payload Shape

Extend `WeeklyMealPlanCartSelection` with a required slot array for build-your-plan orders:

```ts
type WeeklyMealPlanSlotCartSelection = {
  dayNumber: number;
  mealNumber: number;
  weeklyMealPlanOfferingId: string;
  offeringName: string;
  imageUrl?: string | null;
  dietaryInfo?: string | null;
  allergens?: { id: string; name: string }[];
  optionSelections?: {
    spiceOptionId?: string | null;
    proteinSubstitutionOptionId?: string | null;
  };
};

type WeeklyMealPlanCartSelection = {
  weeklyMenuPeriodId: string;
  weeklyMealPlanPackageId: string;
  periodLabel: string;
  packageName: string;
  packageDays: number;
  packageMealsPerDay: number;
  packagePrice: number;
  mealSlots: WeeklyMealPlanSlotCartSelection[];

  // Legacy/current one-offering fields can remain during migration.
  weeklyMealPlanOfferingId?: string | null;
  offeringName?: string | null;
};
```

Cart snapshots may include names and allergens for display, but checkout must treat IDs as the source of truth and rehydrate authoritative offering data server-side.

The cart storage version should be bumped when this shape changes. The migration function should clear incompatible older weekly cart items or convert one-offering items into a filled slot list only if the product decision wants backwards compatibility.

## Required Slot Count

The required slot count is:

```ts
requiredSlotCount = selectedPackage.days * selectedPackage.mealsPerDay;
```

Slot coordinates should be generated from the selected package:

- Day 1, Meal 1
- Day 1, Meal 2
- Day 2, Meal 1
- Day 2, Meal 2
- continuing through `packageDays` and `packageMealsPerDay`

Use one-based `dayNumber` and `mealNumber` values in payloads and stored snapshots because those labels map directly to customer, admin, and kitchen display.

## Proposed UI Flow

Host the meal-slot picker in `components/menu/WeeklyMenuOrderForm.tsx`, inside the current "Build Your Weekly Plan" panel on `/menu`.

Recommended flow:

1. Customer selects a package.
2. The form calculates `days * mealsPerDay`.
3. The form renders a slot grid grouped by day.
4. Each slot uses a select, segmented picker, or compact offering card chooser populated only from `weeklyMenu.offerings`.
5. Offerings shown in each slot come only from the current `PublicWeeklyMenu.offerings` list, which is already scoped to the published weekly period.
6. The add-to-cart button stays disabled until every slot has a selected offering.
7. If any selected slot offering conflicts with account allergens, show the existing allergen warning pattern before adding or at least before checkout.
8. Cart and checkout summaries should show the slot list, not just one offering name.

If spice and protein substitution options remain part of the weekly meal plan business rule, avoid keeping a single global option tied to one offering. Either:

- make options per slot and validate option IDs against that slot's selected offering, or
- defer options for build-your-plan orders until the business confirms how options should apply across mixed offerings.

Per-slot options are safer because the existing option records belong to a specific `WeeklyMealPlanOffering`.

## Proposed Order API Validation Rules

`app/api/orders/route.ts` should remain the final authority.

For each weekly cart item:

1. Require `weeklyMenuPeriodId` and `weeklyMealPlanPackageId`.
2. Load the weekly period by ID with the selected available package and all available offerings needed by submitted slots.
3. Reject missing, unpublished, stale, expired, or closed weekly periods using the existing weekly period rules.
4. Reject if the selected package is unavailable or not part of the submitted weekly period.
5. Calculate `requiredSlotCount = package.days * package.mealsPerDay`.
6. Require exactly `requiredSlotCount` submitted slots.
7. Require each day number to be between `1` and `package.days`.
8. Require each meal number to be between `1` and `package.mealsPerDay`.
9. Reject duplicate `(dayNumber, mealNumber)` pairs.
10. Reject blank offering IDs.
11. Reject any offering ID that is not an available `WeeklyMealPlanOffering` for the same weekly period.
12. If per-slot options are included, reject option IDs that do not belong to that slot's offering or are unavailable.
13. Recompute price from the selected package and validated option deltas.
14. Recompute allergen conflicts as the union of all selected slot offering allergens.
15. Create the order and slot snapshot rows in the same transaction as the existing weekly capacity update.

This validation rejects regular menu items, plates, desserts, a la carte items, archived menu items, and wrong-period offerings by never looking them up from the generic menu tables and by requiring every slot offering to match the selected weekly period.

## Proposed Admin, Kitchen, Email, And Customer Display Changes

Update `WeeklyOrderSelectionDisplay` and `getWeeklyMealPlanSelectionDetails` to include a slot list:

```ts
type WeeklyOrderMealSlotDisplay = {
  dayNumber: number;
  mealNumber: number;
  offeringName: string;
  dietaryInfo?: string | null;
};
```

Then use the shared helper everywhere the app already renders weekly snapshots:

- Cart item summary in `store/cart-store.ts` and cart UI.
- Checkout order item summary in `app/checkout/page.tsx`.
- Order confirmation email in `emails/OrderConfirmationEmail.tsx`.
- Customer order detail in `app/orders/[id]/page.tsx`.
- Account order history in `app/account/orders/page.tsx`.
- Admin order detail in `app/admin/orders/[id]/page.tsx`.
- Admin kitchen cards in `components/admin/KitchenOrderCard.tsx`.
- Kitchen data loader in `app/admin/kitchen/page.tsx`.

Kitchen/admin views should also consider a compact prep summary grouped by offering name, for example:

- Island Chicken Meal Prep: 4
- Salmon Wellness Meal Prep: 3
- Turkey Power Bowl Prep: 3

That aggregation can be derived from stored slot rows and will be useful for fulfillment.

## Implementation Phases

1. Schema and generated client
   - Add `OrderWeeklyMealPlanSlotSelection`.
   - Add relations on `OrderWeeklyMealPlanSelection` and `WeeklyMealPlanOffering`.
   - Create a Prisma migration.
   - Keep existing parent offering fields for old orders.

2. Public menu and cart
   - Replace the single offering picker in `WeeklyMenuOrderForm` with a day/meal slot picker.
   - Extend `WeeklyMealPlanCartSelection` with `mealSlots`.
   - Bump cart storage version.
   - Update cart display to show required slot selections.

3. Checkout and order API
   - Submit slot selections through the existing cart payload.
   - Validate required slot count, period membership, availability, duplicates, and option ownership server-side.
   - Recompute package price and option deltas.
   - Create slot snapshot rows inside the existing order transaction.
   - Preserve the existing weekly capacity guard.

4. Display surfaces
   - Extend `WeeklyOrderSelectionDisplay`.
   - Update order detail, account history, admin detail, kitchen view, and email summary.
   - Update dev email preview data.

5. QA and polish
   - Run full validation.
   - Manually test package sizes, missing slots, wrong-period stale cart items, allergen warnings, and kitchen/admin display.

## Risks And Edge Cases

- Existing cart items: persisted carts with the old one-offering shape should not silently submit invalid orders.
- Quantity handling: a weekly plan cart item with quantity greater than 1 would duplicate the same slot list. The implementation should either lock weekly meal plan quantity at 1 and let customers add another configured plan, or explicitly document that quantity duplicates the same selections.
- Per-slot options: current allowed options belong to one offering. A global spice/protein option is unsafe when the customer chooses multiple offerings.
- Historical display: old orders with only one parent offering must still render correctly.
- Capacity: capacity should continue counting one weekly order slot per order, not per selected meal slot.
- Allergen acknowledgement: conflicts should be calculated from the union of all selected slot offerings.
- Stale cart: if an offering is made unavailable or the period changes after add-to-cart, checkout should reject with a clear stale-selection message.
- Order cutoff: the selected requested date/time should continue to drive weekly order deadline validation as currently implemented.
- Late fee: late fee should remain based on order submission time, not selected fulfillment time.

## Manual QA Checklist

- A 5-day / 2-meal package renders 10 required slots.
- A 7-day / 2-meal package renders 14 required slots.
- Add-to-cart is blocked while any required slot is blank.
- Every slot picker is populated only from the selected weekly period's available offerings.
- A completed slot list appears in cart.
- A completed slot list appears in checkout.
- Checkout rejects a missing slot if the client is bypassed.
- Checkout rejects duplicate slot coordinates if the client is bypassed.
- Checkout rejects a wrong-period offering ID if the client is bypassed.
- Checkout rejects unavailable weekly offerings.
- Checkout rejects unpublished/stale/expired weekly periods.
- Checkout rejects regular menu item IDs submitted as slot offering IDs.
- Weekend requested fulfillment remains blocked when no-weekend ordering is enabled.
- Weekly meal plan order deadline validation still uses the selected requested date/time.
- Late fee still uses order submission time.
- Order confirmation email shows the slot list.
- Customer order detail shows the slot list.
- Admin order detail shows the slot list.
- Kitchen view shows the slot list and a useful prep summary.
- Existing legacy weekly meal plan orders still render.

## Files Likely To Change During Implementation

- `prisma/schema.prisma`
- new Prisma migration under `prisma/migrations`
- `types/weekly-menu.ts`
- `components/menu/WeeklyMenuOrderForm.tsx`
- cart UI components, if separate from `store/cart-store.ts`
- `store/cart-store.ts`
- `app/checkout/page.tsx`
- `app/api/orders/route.ts`
- `lib/weekly-order-display.ts`
- `emails/OrderConfirmationEmail.tsx`
- `lib/dev-email-preview-data.ts`
- `app/orders/[id]/page.tsx`
- `app/account/orders/page.tsx`
- `app/admin/orders/[id]/page.tsx`
- `app/admin/kitchen/page.tsx`
- `components/admin/KitchenOrderCard.tsx`

## Recommendation For Next Implementation Branch

Use a new branch named:

```text
feature/build-your-weekly-plan-selections
```

Start with the additive Prisma migration and display type changes, then implement the public slot picker and server validation in the same branch so the cart payload and order persistence evolve together.
