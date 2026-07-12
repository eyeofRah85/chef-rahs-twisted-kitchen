# Weekly Ordering Window Rules Review

Date: July 12, 2026

Branch: `review/weekly-ordering-window-rules`

Scope: planning review for the launch weekly meal plan ordering window. This pass does not change application behavior, Prisma schema, checkout behavior, order API behavior, payment behavior, or packages.

## 1. Current Architecture Summary

Weekly meal plans currently share the normal checkout scheduling flow:

- `app/checkout/page.tsx` always shows the requested date and requested time controls.
- Checkout requires `checkout.requestedDateTime` before submission.
- `app/api/orders/route.ts` also requires `checkout.requestedDateTime` before weekly-specific validation runs.
- `validateServerRequestedDateTime` applies past-date and no-weekend checks to that submitted requested date/time.
- `calculateServerLateFee` calculates the current generic late fee from `BusinessSettings.orderCutoffDay`, `orderCutoffHour`, and `orderCutoffMinute`.
- Weekly period validation uses `WeeklyMenuPeriod.orderCutoffAt`, but the API currently compares that cutoff to the submitted requested fulfillment date.

The weekly menu data model already supports:

- published weekly periods through `WeeklyMenuPeriod.status`,
- one optional `WeeklyMenuPeriod.orderCutoffAt`,
- weekly package flags and configurable meal slot labels,
- breakfast-only offerings,
- slot-level selected offerings,
- slot-level selected options and upcharges.

The current business settings model is still generic. `BusinessSettings` has delivery fee, late fee, one order cutoff day/time, no-weekend ordering, and delivery area. It does not have weekly-specific opening, late-fee start, closing, fixed delivery, or customer scheduling settings.

`Order.requestedDateTime` is nullable in Prisma, but the current order API treats it as required for checkout. Admin, kitchen, account, and order detail views already tolerate `null` in several places, but most display paths assume the order has one requested/scheduled datetime when available.

## 2. New Business Rule Summary

The launch weekly meal plan workflow is different from regular checkout scheduling:

- Weekly menus are posted on Wednesday.
- Customers can place weekly meal plan orders from Wednesday through Friday.
- Friday is the last day to order.
- Weekly meal plan orders placed after Friday 5:00 PM receive the late fee.
- Weekly meal plan orders may still be placed until Friday 10:00 PM.
- Weekly meal plan ordering closes after Friday 10:00 PM.
- All weekly meal plan deliveries are on Sunday.
- Customers should not pick a delivery date/time for weekly meal plan orders during launch.
- Catering and personal chef flows should not change.
- Guest and logged-in checkout should remain supported.

Recommendation: apply these rules only to weekly meal plan checkout, not all checkout orders. Regular menu orders should keep the existing customer-selected requested date/time flow unless the business explicitly changes those rules too.

## 3. Recommended Data Model And Settings

A Prisma migration is likely required. The current schema only has one generic cutoff and cannot represent all launch rules cleanly or make the workflow admin-configurable.

Recommended model approach:

1. Add weekly scheduling defaults to `BusinessSettings`.
2. Add resolved per-period scheduling fields to `WeeklyMenuPeriod`.
3. Optionally add order-time schedule snapshot fields if the team wants immutable customer-facing wording on historical weekly orders.

Recommended `BusinessSettings` defaults:

- `weeklyCustomerSchedulingEnabled Boolean @default(false)`
- `weeklyOrderingOpenDay Int @default(3)`
- `weeklyOrderingOpenHour Int @default(0)`
- `weeklyOrderingOpenMinute Int @default(0)`
- `weeklyLateFeeStartDay Int @default(5)`
- `weeklyLateFeeStartHour Int @default(17)`
- `weeklyLateFeeStartMinute Int @default(0)`
- `weeklyOrderingCloseDay Int @default(5)`
- `weeklyOrderingCloseHour Int @default(22)`
- `weeklyOrderingCloseMinute Int @default(0)`
- `weeklyFixedDeliveryDay Int @default(0)`
- `weeklyFixedDeliveryHour Int @default(12)`
- `weeklyFixedDeliveryMinute Int @default(0)`
- `weeklyDeliveryLabel String?`

Recommended `WeeklyMenuPeriod` fields:

- `orderingOpenAt DateTime?`
- `lateFeeStartsAt DateTime?`
- `orderingClosesAt DateTime?`
- `fixedFulfillmentAt DateTime?`
- `customerSchedulingEnabled Boolean?`
- `deliveryWindowLabel String?`

Reasoning:

- Global business settings give the owner a default weekly workflow.
- Per-period timestamps make each published weekly period explicit and avoid ambiguity around holidays, skipped weeks, or special delivery days.
- The existing `orderCutoffAt` can remain for backward compatibility during migration, but the implementation should prefer `orderingClosesAt` for weekly meal plan order acceptance.
- Store and parse these timestamps as business-local admin inputs, then persist DateTime values consistently for MySQL/MariaDB through Prisma.

If the implementation must be smaller for launch, the minimum safe schema change is adding the weekly defaults to `BusinessSettings` and computing the active period's open/late/close/fixed-delivery datetimes from the period dates. The per-period fields are still recommended because the client already manages weekly menus as discrete periods.

## 4. Recommended Checkout Behavior

When the cart contains weekly meal plan items and weekly customer scheduling is disabled:

- Hide the requested date/time picker for weekly checkout.
- Show a clear fixed delivery message, such as `Weekly meal plans deliver Sunday, July 19`.
- Show the ordering window status:
  - open, no late fee before Friday 5:00 PM,
  - late fee applies from Friday 5:00 PM through Friday 10:00 PM,
  - closed after Friday 10:00 PM.
- Show the late fee preview when current business-local time is in the late window.
- Do not let the browser-submitted late fee be authoritative.
- Keep guest checkout and logged-in checkout contact behavior unchanged.

Mixed cart recommendation:

- For launch, block carts that mix weekly meal plan items with regular a la carte items when weekly customer scheduling is disabled.
- Show a simple message asking the customer to place weekly meal plans and regular menu items as separate orders.
- This avoids one order needing both fixed Sunday delivery and customer-selected scheduling.

If the business wants mixed carts in one order later, the implementation should define whether regular items follow the fixed Sunday delivery schedule or keep their own fulfillment date.

## 5. Recommended API And Server Validation Behavior

Server-side order creation must be the source of truth.

Recommended order API flow:

1. Parse cart items and detect whether any item has `weeklyMealPlanSelection`.
2. Reject mixed weekly and non-weekly carts while weekly fixed scheduling is enabled, unless a later business rule explicitly allows them.
3. For non-weekly orders, keep the current requested date/time, past-date validation, no-weekend validation, and generic late-fee behavior.
4. For weekly-only orders with customer scheduling disabled:
   - do not require client-submitted `requestedDateTime`,
   - load the trusted weekly period,
   - confirm the period is published and not expired,
   - confirm all weekly packages, offerings, slots, labels, breakfast-only rules, and options are valid,
   - evaluate the current order submission time in `BUSINESS_TIME_ZONE`,
   - reject if current time is before `orderingOpenAt`,
   - reject if current time is after `orderingClosesAt`,
   - calculate the late fee if current time is at or after `lateFeeStartsAt`,
   - set the order's scheduled datetime to the trusted fixed Sunday fulfillment datetime.

The existing stale, unpublished, expired, capacity, wrong-period, wrong-slot, invalid option, and breakfast-only validations should remain intact.

## 6. Recommended Late-Fee Behavior

Weekly meal plan late fee should be evaluated from the weekly ordering window, not from arbitrary fulfillment date selection.

Recommended helper:

```ts
getWeeklyOrderingWindowState({
  now,
  timeZone,
  orderingOpenAt,
  lateFeeStartsAt,
  orderingClosesAt,
  lateFee,
})
```

Return a structured result:

- `state: "not_open" | "open" | "late" | "closed"`
- `lateFeeAmount`
- `customerMessage`

Expected launch behavior:

- Wednesday through Friday 4:59 PM: accepted, no late fee.
- Friday 5:00 PM through Friday 10:00 PM: accepted, late fee applies.
- After Friday 10:00 PM: rejected as closed.

Keep the existing generic late-fee helper for non-weekly orders unless the business later decides that all order types should use the weekly window.

## 7. Recommended Fixed Sunday Delivery Handling

For weekly orders with customer scheduling disabled, store a server-resolved fulfillment datetime on the order:

- Use the weekly period's `fixedFulfillmentAt` when present.
- Otherwise compute Sunday delivery from the weekly settings and active period.
- Save that value into `Order.requestedDateTime` for compatibility with existing admin, kitchen, account, and report displays.

Also consider storing a snapshot label for customer-facing text, such as:

- `Weekly meal plan delivery: Sunday, July 19`
- `Sunday delivery`
- `Pickup/delivery details will be confirmed by Chef Rah's Twisted Kitchen`

The snapshot can live on `Order` or `OrderWeeklyMealPlanSelection`. If no snapshot field is added in the first implementation, the display helper should derive copy from the persisted fixed fulfillment datetime and period label.

Past-date and no-weekend validation should not reject the fixed Sunday weekly delivery. Those validators should continue to apply to customer-selected requested dates for non-weekly orders. Weekly orders should instead use the ordering window and trusted fixed fulfillment date.

## 8. Email, Admin, And Kitchen Display Implications

Display surfaces that should be reviewed during implementation:

- cart weekly meal plan summary,
- checkout schedule card,
- `OrderConfirmationEmail`,
- `OrderApprovalEmail`,
- `PaymentReceivedEmail`,
- customer order detail,
- account order list,
- admin order list and detail,
- kitchen view,
- admin weekly fulfillment view.

Recommended copy changes:

- Use `Weekly meal plan delivery` or `Scheduled weekly delivery` for fixed weekly fulfillment.
- Avoid asking the customer to review a requested date/time they did not choose.
- For non-weekly orders, keep existing requested date/time wording.
- Include the fixed Sunday delivery label in confirmation emails because the current order confirmation email does not show a schedule section.
- Keep account-only order links hidden for guest orders.

Admin and kitchen views should continue to show weekly package slots, labels, options, option upcharges, and request-only/approval details.

## 9. Implementation Phases

Recommended implementation branch: `feature/weekly-ordering-window-rules`

Phase 1: Schema and defaults

- Add weekly scheduling defaults to `BusinessSettings`.
- Add per-period resolved scheduling fields to `WeeklyMenuPeriod`.
- Generate an additive MySQL/MariaDB Prisma migration.
- Update foundation seed defaults.

Phase 2: Admin configuration

- Add a weekly ordering window section to the admin business settings page.
- Add per-period scheduling fields to the weekly menu period form.
- When creating or cloning a weekly period, prefill ordering open, late start, close, fixed fulfillment, and delivery label from defaults.

Phase 3: Shared helpers

- Add weekly ordering window helpers in `lib/business-rules.ts` or a weekly-specific helper module.
- Add server wrappers in `lib/server-business-rules.ts`.
- Update or replace `scripts/qa-late-fee-rules.ts` with weekly-window cases.

Phase 4: Checkout UI

- Detect weekly-only carts.
- Hide requested date/time for weekly-only fixed-schedule carts.
- Show fixed Sunday delivery and weekly order-window messages.
- Preview late fee from current business-local time and trusted settings.
- Block mixed carts for launch or require separate orders.

Phase 5: Order API

- Move weekly cart detection before the unconditional requested date/time requirement.
- For weekly-only fixed-schedule carts, validate the weekly ordering window from server time.
- Persist the trusted fixed fulfillment datetime.
- Recompute delivery fee, late fee, options, subtotal, tip, and total server-side.
- Preserve all existing weekly slot, option, breakfast-only, capacity, guest checkout, and logged-in checkout validation.

Phase 6: Display and emails

- Add schedule display helpers that distinguish regular requested schedules from weekly fixed fulfillment.
- Update cart, checkout, email, customer, admin, kitchen, and weekly fulfillment views.
- Keep guest email/account-link behavior unchanged.

Phase 7: QA and launch rehearsal

- Run automated validation.
- Run weekly order-window QA with controlled business-local timestamps.
- Rehearse guest and logged-in weekly orders before and during the late window.

## 10. Risks And Edge Cases

- Mixed weekly and regular carts need an explicit launch rule. Blocking mixed carts is safest until the business defines combined fulfillment.
- Timezone handling must use `BUSINESS_TIME_ZONE`, not server local time.
- Admin-entered dates should be clear about business-local timezone.
- Friday 5:00 PM and Friday 10:00 PM boundary behavior must be exact and tested.
- Existing `orderCutoffAt` may conflict with new `orderingClosesAt`; implementation should define precedence and migrate or label old fields clearly.
- A published weekly period without resolved scheduling fields should fail safe or derive from business defaults, not silently accept outside the window.
- Sunday fixed delivery intentionally conflicts with the generic no-weekend validator, so weekly fixed-schedule orders need their own validation path.
- Confirmation emails currently do not show a schedule section, so fixed Sunday delivery could be missed unless email copy is updated.
- Capacity increments should still happen only after all validation passes.

## 11. Manual QA Checklist

Configuration:

- Admin can configure weekly customer scheduling enabled/disabled.
- Admin can configure ordering open day/time, late-fee start day/time, close day/time, fixed delivery day/time, and customer delivery label.
- Admin can create or clone a weekly period with resolved schedule fields.

Customer checkout:

- Weekly-only cart before Friday 5:00 PM shows fixed Sunday delivery and no late fee.
- Weekly-only cart Friday 5:00 PM through Friday 10:00 PM shows fixed Sunday delivery and late fee.
- Weekly-only cart after Friday 10:00 PM is blocked.
- Weekly-only cart before Wednesday open is blocked.
- Weekly checkout does not show a requested date/time picker when scheduling is disabled.
- Guest weekly checkout works.
- Logged-in weekly checkout works.
- Mixed weekly and regular cart is blocked with clear copy, if the launch implementation follows the recommended split-order rule.

Server validation:

- API accepts a valid weekly order during the open window.
- API applies late fee from Friday 5:00 PM through Friday 10:00 PM.
- API rejects weekly orders after Friday 10:00 PM.
- API rejects weekly orders before Wednesday open.
- API does not trust client-submitted late fee or total.
- API persists a trusted fixed Sunday fulfillment datetime.
- API still rejects stale, unpublished, expired, wrong-period, invalid slot, invalid option, and breakfast-only-in-non-Breakfast submissions.

Regression:

- Non-weekly checkout still requires requested date/time.
- Non-weekly past-date validation still works.
- Non-weekly no-weekend validation still works.
- Weekly slot labels still display.
- Weekly option upcharges still persist and display.
- Breakfast-only offerings remain filtered and server-enforced.
- Guest orders still use `userId = null`.
- Logged-in orders still link to the authenticated user.
- Catering and personal chef flows are unchanged.

## 12. Recommendation

Proceed with an implementation branch named `feature/weekly-ordering-window-rules`.

The safest implementation is a weekly-only scheduling path:

- admin-configurable defaults in `BusinessSettings`,
- resolved per-period window and fixed fulfillment fields on `WeeklyMenuPeriod`,
- server-side weekly ordering-window validation before order creation,
- no customer date/time picker for fixed weekly launch scheduling,
- fixed Sunday fulfillment stored as trusted order data,
- generic requested date/time and no-weekend validators left in place for non-weekly orders.

This requires a Prisma migration, but it keeps the rule durable, auditable, and flexible for future delivery schedule changes.
