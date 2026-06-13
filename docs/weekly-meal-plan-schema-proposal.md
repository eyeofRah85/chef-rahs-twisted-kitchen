# Weekly Meal Plan Schema Proposal

Date: June 13, 2026
Status: First additive schema migration applied on June 13, 2026.

This proposal translates the resolved weekly meal plan business decisions into the smallest additive Prisma schema direction. The first migration, `20260613014948_add_weekly_meal_plan_models`, now adds these models and snapshot fields while keeping the existing `MenuItem`, cart, checkout, and order flow stable.

## Goals

- Publish one current weekly meal plan period for customer ordering.
- Support draft, published, closed, and archived weekly periods.
- Limit each weekly menu period to 10 orders.
- Let admins clone prior weekly menus, with room for rotating menus later.
- Support fixed package prices for 5-day or 7-day packages with 1 or 2 meals per day.
- Let customers add multiple weekly meal plans to one cart.
- Keep customer-facing choices limited to spice level and protein substitutions.
- Mark additional proteins such as beef, pork, lamb, and similar premium proteins as request-only and approval-required.
- Apply allergen alerts to every food item, not only meal plans.
- Preserve allergen acknowledgement at both order and item level.
- Preserve weekly period, package, offering, spice, protein, request-only, and approval snapshots on historical orders.

## Non-Goals

- Do not remove or rename `MenuItem`, `MenuItemOptionGroup`, or `MenuItemOptionChoice`.
- Do not rename `/menu`, `/admin/catering`, `/account/catering`, or `CateringRequest`.
- Do not remove `OrderType.CATERING` or `MenuItemType.PLATE`.
- Do not build direct object-storage uploads as part of this work.
- Do not make meal plans fully customizable.

## Recommended Additive Models

The first migration should add weekly menu tables without requiring existing data to move immediately.

```prisma
enum WeeklyMenuStatus {
  DRAFT
  PUBLISHED
  CLOSED
  ARCHIVED
}

enum WeeklyMealPlanOptionType {
  SPICE_LEVEL
  PROTEIN_SUBSTITUTION
}

model WeeklyMenuPeriod {
  id               String           @id @default(cuid())
  label            String
  startDate        DateTime
  endDate          DateTime
  orderCutoffAt    DateTime?
  fulfillmentNotes String?
  status           WeeklyMenuStatus @default(DRAFT)

  capacity     Int @default(10)
  ordersPlaced Int @default(0)

  cloneSourceId String?
  cloneSource   WeeklyMenuPeriod?  @relation("WeeklyMenuPeriodClones", fields: [cloneSourceId], references: [id], onDelete: SetNull)
  clones        WeeklyMenuPeriod[] @relation("WeeklyMenuPeriodClones")

  packages WeeklyMealPlanPackage[]
  offerings WeeklyMealPlanOffering[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status, startDate, endDate])
}

model WeeklyMealPlanPackage {
  id          String @id @default(cuid())
  periodId    String
  period      WeeklyMenuPeriod @relation(fields: [periodId], references: [id], onDelete: Cascade)

  name        String
  days        Int
  mealsPerDay Int
  price       Decimal @db.Decimal(10, 2)
  available   Boolean @default(true)
  displayOrder Int @default(0)
  notes       String?

  orderSelections OrderWeeklyMealPlanSelection[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([periodId, days, mealsPerDay])
  @@index([periodId, available, displayOrder])
}

model WeeklyMealPlanOffering {
  id          String @id @default(cuid())
  periodId    String
  period      WeeklyMenuPeriod @relation(fields: [periodId], references: [id], onDelete: Cascade)

  name        String
  description String
  imageUrl    String?
  dietaryInfo String?
  available   Boolean @default(true)
  displayOrder Int @default(0)

  allergens AllergenWeeklyMealPlanOffering[]
  options   WeeklyMealPlanAllowedOption[]
  orderSelections OrderWeeklyMealPlanSelection[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([periodId, available, displayOrder])
}

model AllergenWeeklyMealPlanOffering {
  id         String @id @default(cuid())
  offeringId String
  allergenId String

  offering WeeklyMealPlanOffering @relation(fields: [offeringId], references: [id], onDelete: Cascade)
  allergen Allergen @relation(fields: [allergenId], references: [id], onDelete: Cascade)

  @@unique([offeringId, allergenId])
}

model WeeklyMealPlanAllowedOption {
  id          String @id @default(cuid())
  offeringId  String
  offering    WeeklyMealPlanOffering @relation(fields: [offeringId], references: [id], onDelete: Cascade)

  optionType  WeeklyMealPlanOptionType
  name        String
  description String?
  dietaryInfo String?
  priceDelta  Decimal @db.Decimal(10, 2) @default(0)
  requestOnly Boolean @default(false)
  requiresApproval Boolean @default(false)
  available Boolean @default(true)
  displayOrder Int @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([offeringId, optionType, displayOrder])
}
```

The `Allergen` model should gain a relation back to weekly offerings:

```prisma
weeklyMealPlanOfferings AllergenWeeklyMealPlanOffering[]
```

## Order Snapshot Additions

The current `Order` already stores order-level allergen acknowledgement. The weekly model needs item-level acknowledgement plus weekly selection snapshots.

Add item-level allergen acknowledgement fields to `OrderItem`:

```prisma
allergenAcknowledged Boolean @default(false)
allergenAcknowledgedAt DateTime?
allergenConflictSnapshot Json?

weeklyMealPlanSelection OrderWeeklyMealPlanSelection?
```

Add a one-to-one weekly selection snapshot model:

```prisma
model OrderWeeklyMealPlanSelection {
  id          String @id @default(cuid())
  orderItemId String @unique
  orderItem   OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)

  weeklyMenuPeriodId String?
  packageId          String?
  offeringId         String?

  weeklyMenuPeriod WeeklyMenuPeriod? @relation(fields: [weeklyMenuPeriodId], references: [id], onDelete: SetNull)
  package          WeeklyMealPlanPackage? @relation(fields: [packageId], references: [id], onDelete: SetNull)
  offering         WeeklyMealPlanOffering? @relation(fields: [offeringId], references: [id], onDelete: SetNull)

  periodLabel String
  packageName String
  packageDays Int
  packageMealsPerDay Int
  packagePrice Decimal @db.Decimal(10, 2)
  offeringName String
  spiceLevel String?
  proteinSubstitution String?
  requestOnly Boolean @default(false)
  requiresApproval Boolean @default(false)
  priceDelta Decimal @db.Decimal(10, 2) @default(0)

  createdAt DateTime @default(now())
}
```

The snapshot strings are intentional. Historical orders should remain readable even if weekly records are later edited, archived, or deleted.

## Capacity Enforcement

Capacity should count orders, not item quantity, because customers may add multiple meal plans to one cart.

Recommended checkout transaction behavior:

1. Detect whether the order contains one or more weekly meal plan items.
2. If so, require all weekly items to belong to the current published weekly period.
3. Increment `WeeklyMenuPeriod.ordersPlaced` once for the order with an atomic guarded update:
   - `id` matches the current period.
   - `status = PUBLISHED`.
   - `ordersPlaced < capacity`.
4. If no row is updated, reject checkout with a capacity or availability message.
5. Create the order and order item snapshots in the same transaction.

This avoids counting multiple weekly meal plans in the same cart as multiple capacity slots.

## Publishing Rules

Application logic should enforce:

- Only one current weekly menu period is customer-orderable at a time.
- Customers can order only from the current published week.
- Draft weeks never appear on `/menu`.
- Closed and archived weeks stay available to admin reporting and history, but cannot receive new orders.
- A period at capacity should stop accepting weekly meal plan checkout.

A database partial unique index for "one published current week" can be considered later, but the first implementation can enforce this in admin publish and checkout logic to keep the Prisma migration straightforward.

## Clone And Rotation Direction

Phase one should implement cloning a prior `WeeklyMenuPeriod` with its packages, offerings, allergens, and allowed options.

The `cloneSourceId` field gives basic traceability without adding a full rotation system yet. A later rotating-menu feature can add a `WeeklyMenuRotationTemplate` or similar model after the admin cloning workflow is proven.

## Rollout Plan

1. Add the new enums, weekly models, order item allergen fields, and weekly order selection snapshot model.
2. Run Prisma migration and regenerate the client.
3. Add admin CRUD for weekly periods, packages, offerings, allergens, allowed options, publish/close/archive, and clone.
4. Update `/menu` to show the current published weekly period alongside a la carte food items.
5. Extend the cart item shape to carry weekly package/offering selections while keeping existing `MenuItem` cart items working.
6. Update order creation to validate current week, fixed package pricing, request-only approval flags, allergen acknowledgement, and weekly capacity.
7. Update order details, admin order views, kitchen prep, and confirmation emails to show weekly snapshots.
8. Add tests or focused validation for capacity, current-week restrictions, allergen acknowledgement, request-only approval, and fixed pricing.

## First Migration Scope

The first migration only adds new schema and optional fields. It does not rewrite existing menu items, historical orders, routes, or checkout behavior.

Recommended first migration contents:

- Add `WeeklyMenuStatus`.
- Add `WeeklyMealPlanOptionType`.
- Add `WeeklyMenuPeriod`.
- Add `WeeklyMealPlanPackage`.
- Add `WeeklyMealPlanOffering`.
- Add `AllergenWeeklyMealPlanOffering`.
- Add `WeeklyMealPlanAllowedOption`.
- Add `OrderWeeklyMealPlanSelection`.
- Add item-level allergen acknowledgement fields to `OrderItem`.

Completed on June 13, 2026 in migration `20260613014948_add_weekly_meal_plan_models`.

The next implementation patch can focus on admin weekly period/package/offering CRUD without touching checkout yet.
