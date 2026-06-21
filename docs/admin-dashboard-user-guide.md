# Chef Rah's Twisted Kitchen Admin Dashboard User Guide

Last updated: June 18, 2026

This guide explains how to use the admin dashboard for daily operations, menu management, service requests, weekly meal plans, gallery updates, customer lookup, payments, reports, notifications, and business settings.

The guide is written for business admins, kitchen staff, and trusted operators. It avoids developer-only details unless they affect how the dashboard should be used.

## Quick Start

### Admin Access

Only accounts with the `ADMIN` or `OWNER` role can access the admin dashboard.

1. Register or sign in with the admin account.
2. Go to `/admin`.
3. If the account does not have admin access, the app redirects away from the dashboard.

Before launch, the first admin account should be promoted using the documented launch command:

```powershell
npm run admin:promote
```

That command requires `ADMIN_EMAIL` to be set in the environment.

### Main Admin Routes

| Area | Route | Purpose |
| --- | --- | --- |
| Dashboard | `/admin` | Main control center with metrics, alerts, recent orders, and quick links. |
| Orders | `/admin/orders` | Review, filter, and open customer orders. |
| Order detail | `/admin/orders/[id]` | Approve or deny orders, update status, mark paid, review snapshots, and print kitchen tickets. |
| Kitchen view | `/admin/kitchen` | Prep-ready approved orders in active kitchen statuses. |
| Service Requests | `/admin/catering` | Shared queue for catering and personal chef requests. |
| Service request detail | `/admin/catering/[id]` | Approve or deny requests, quote, manage deposits, and update request status. |
| Menu manager | `/admin/menu` | Manage standard menu items, categories, type, availability, allergens, and option groups. |
| Weekly menu manager | `/admin/menu/weekly` | Manage weekly meal plan periods, packages, fixed offerings, allergens, allowed spice/protein choices, and fulfillment prep. |
| Menu categories | `/admin/menu/categories` | Rename display categories and control sort order. |
| Archived menu items | `/admin/menu/archived` | Restore or permanently delete archived menu items. |
| Gallery manager | `/admin/gallery` | Add, edit, sort, categorize, replace, or remove public gallery images. |
| Customers | `/admin/customers` | Search customers and review order/payment activity. |
| Customer detail | `/admin/customers/[id]` | Review a customer account, order history, service requests, and payment alerts. |
| Payments | `/admin/payments` | Track outstanding manual/offline payments and mark orders paid. |
| Reports | `/admin/reports` | Review revenue, order, payment, approval, and service request metrics. |
| Notifications | `/admin/notifications` | Review active/planned notification types and current email delivery mode. |
| Business settings | `/admin/settings` | Manage delivery fee, late fee, deposit percent, cutoff rules, weekend ordering, and delivery area. |

## Daily Operating Workflow

Use this sequence during regular order operations.

1. Open `/admin`.
2. Review the metric cards and Operational Alerts.
3. Open pending orders from `/admin/orders`.
4. Approve or deny any orders requiring chef review.
5. Confirm payment due orders from `/admin/payments` or the order detail page.
6. Move approved orders through kitchen status from `/admin/kitchen` or the order detail page.
7. Review service requests from `/admin/catering`.
8. Quote and approve service requests as needed.
9. Review `/admin/menu/weekly` before each ordering window to confirm the published weekly menu, package options, allergen tags, and capacity.

For a busy prep day, keep `/admin/kitchen` open and use order detail pages for printable tickets.

## Dashboard Overview

Route: `/admin`

The dashboard is the control center. It shows high-level operating metrics and links to the areas that need attention.

### Metric Cards

The dashboard includes cards for:

- Pending Orders
- Service Request Approvals
- Active Orders
- Completed Orders
- Payment Due
- Needs Approval
- Revenue Snapshot
- Service Requests
- Catering Requests
- Personal Chef Requests

Clicking a card opens the related admin area.

### Operational Alerts

Operational alerts highlight work that needs attention:

- Orders with payment still due.
- Orders that may require chef approval.
- Pending orders waiting for review.
- Service requests waiting for approval.

If no alerts appear, there are no urgent admin items based on the current dashboard checks.

### Active Business Rules

The dashboard also summarizes current business settings:

- Delivery fee
- Late fee
- Service request deposit percent
- Weekend ordering rule

Use `/admin/settings` to change these values.

## Orders

Routes:

- `/admin/orders`
- `/admin/orders/[id]`

Orders are direct checkout purchases. Meal plan and a la carte orders live here. Catering and personal chef requests do not become direct checkout orders; they use the service request workflow.

### Order List

The orders page shows:

- Customer name and email.
- Order type: Delivery or Pickup.
- Order status.
- Approval status.
- Item count, including weekly meal plan indicators.
- Order total.
- Payment status.
- Pay-by date.
- Created date.

### Order Filters

Use filters to focus the queue:

- All
- Pending
- Accepted
- Preparing
- Ready
- Completed
- Payments Due
- Offline Due
- Delivery
- Pickup
- Approval Pending
- Approved
- Denied
- Cancelled

Tip: Use `Approval Pending` when checking orders with request-only proteins or other approval-required choices.

### Order Statuses

| Status | Meaning |
| --- | --- |
| Pending | Submitted and awaiting review. |
| Accepted | Accepted into the workflow. |
| Preparing | Kitchen is preparing the order. |
| Ready | Ready for pickup, delivery, or final handoff. |
| Out for Delivery | Delivery workflow has started. |
| Completed | Fulfilled and closed. |
| Cancelled | Cancelled and no longer active. |
| Refunded | Refunded and no longer active. |

### Approval Statuses

| Status | Meaning |
| --- | --- |
| Pending | Requires review. |
| Approved | Approved to continue. |
| Denied | Denied and should not move forward unless the customer submits a revised order. |

The app blocks duplicate final approval decisions. After an order is approved or denied, the decision buttons are replaced by final-state messaging.

### Order Detail

The order detail page shows:

- Customer information.
- Delivery/contact snapshot saved at checkout.
- Requested date/time.
- Order items and option notes.
- Weekly meal plan snapshots when present.
- Allergen acknowledgement status.
- Allergy notes.
- Substitution preference.
- Totals.
- Payment status.
- Status history.

The delivery/contact snapshot is historical. It shows the information used for that order, even if the customer later changes their account profile.

### Approving or Denying an Order

Use the Approval Decision card.

1. Review the order items, weekly meal plan selections, allergen notes, and request-only items.
2. Add an optional approval note if needed.
3. Choose Approve Order or Deny Order.
4. Confirm the browser prompt.

Approving an order notifies the customer and moves the order forward. Denying an order notifies the customer and cancels the order.

### Updating Order Status

Use the Status card.

1. Select a new status.
2. Optionally add a status note.
3. Click Update Status.

Status history appears on the order detail page.

### Marking an Order Paid

The Mark Paid button appears when payment is still due.

Use it only after payment has actually been received or confirmed outside the app. The app blocks duplicate paid actions once the order is already paid.

### Printing a Kitchen Ticket

On the order detail page, use Print Kitchen Ticket.

The print view is designed to include core kitchen information such as:

- Customer/order details.
- Requested time.
- Items and quantities.
- Weekly meal plan snapshots.
- Allergy alerts.
- Notes and selections.

## Kitchen View

Route: `/admin/kitchen`

The kitchen view shows prep-ready orders only. An order appears here when it is:

- Approved, and
- In one of these active statuses: Accepted, Preparing, or Ready.

Each kitchen card shows:

- Customer name.
- Order type.
- Current status.
- Requested date/time.
- Items and quantities.
- Weekly meal plan snapshots.
- Item notes and selections.
- Allergy alerts.

Use View / Print Ticket to open the full order detail page. Use the status button to advance the order through the next kitchen state.

## Service Requests

Routes:

- `/admin/catering`
- `/admin/catering/[id]`

Important: The route is named `/admin/catering` for stability, but the page handles both Catering and Personal Chef requests. In the UI, these are called Service Requests.

### Service Request List

The service request queue shows:

- Customer name and email.
- Request type: Catering or Personal Chef.
- Event type and event date.
- Guest count.
- Workflow status.
- Approval status.
- Submitted date.

### Request Type Filters

Use these to separate request categories:

- All
- Catering
- Personal Chef

### Workflow Filters

Use these to narrow the request queue:

- New
- Reviewing
- Quoted
- Approved
- Deposit Due
- Deposit Paid
- Completed
- Cancelled
- Approval Pending
- Approval Approved
- Approval Denied

### Service Request Statuses

| Status | Meaning |
| --- | --- |
| New | Submitted and not yet reviewed. |
| Reviewing | Admin is reviewing details. |
| Quoted | Quote information has been provided. |
| Approved | Request approved to continue. |
| Deposit Due | Deposit is required before moving forward. |
| Deposit Paid | Deposit has been marked paid. |
| Completed | Event/request is complete. |
| Cancelled | Request is closed without fulfillment. |

### Service Request Detail

The detail page shows:

- Customer contact information.
- Event type, date, guest count, and location.
- Requested menu.
- Allergy notes.
- Special requests.
- Approval controls.
- Status controls.
- Quote and deposit controls.

### Approving or Denying a Service Request

Use the Approval card.

1. Review customer notes, event details, guest count, location, and allergies.
2. Add an optional note if needed.
3. Approve or deny the request.
4. Confirm the browser prompt.

The app blocks duplicate final approval decisions. Once approved or denied, the decision buttons are replaced by a final-state message.

### Quote and Deposit Workflow

Use the Quote / Deposit card.

Fields:

- Estimated Total
- Deposit Amount

Notes:

- Leave Deposit Amount blank to allow the app to calculate the deposit from business settings.
- Use `0.00` only when there is intentionally no deposit due.
- Quote editing locks after final states, denied approvals, or a paid deposit.

Use Mark Deposit Paid only after the deposit is actually received. Duplicate deposit-paid actions are blocked.

## Menu Manager

Routes:

- `/admin/menu`
- `/admin/menu/categories`
- `/admin/menu/archived`

The Menu Manager controls standard menu records. Weekly meal plan periods and weekly fixed offerings are managed separately at `/admin/menu/weekly`.

### Critical Menu Concepts

Menu item `type` controls behavior. Examples:

- Meal Plan
- A La Carte
- Catering Related
- Plate / Legacy
- Dessert
- Side
- Other

Menu category controls display grouping. Examples:

- Meal Plans
- A La Carte
- Desserts
- Sides

Do not confuse category names with type values. A category is where an item is displayed. A type is how the app treats the item.

Personal chef services are not menu items. They use the service request workflow.

### Creating a Menu Item

Use Add Meal Plan / Menu Item.

Fields:

- Menu Item Image: upload JPG, PNG, or WebP, or enter a public image URL.
- Item name.
- Description.
- Price.
- Available.
- Seasonal.
- Category.
- Item Type.
- Requires chef approval.
- Allow customer instructions.

Image uploads must be JPG, PNG, or WebP and 5 MB or smaller.

Production note: local file uploads are blocked in production unless durable upload storage is explicitly allowed. Until durable storage is chosen, use public image URLs for production menu images.

### Availability

Use Mark Available or Mark Unavailable inside an item detail panel.

Unavailable items should not be purchasable by customers. Historical orders keep their saved item snapshots.

### Editing a Menu Item

Open an item detail panel and choose Edit Item.

You can edit:

- Name.
- Description.
- Image URL.
- Price.
- Category.
- Item Type.
- Seasonal flag.
- Approval requirement.
- Customer instructions setting.

### Archiving and Deleting Menu Items

Use Archive Item when the item may return later.

Use Delete Item only when the item should be permanently removed from active/archived menu management. Historical order snapshots remain intact.

Archived items are managed from `/admin/menu/archived`, where they can be restored or deleted.

### Allergens

Each menu item can be tagged with allergens.

Customer accounts can store allergen preferences. Cart and checkout warn customers when selected items contain matching allergens, and checkout requires acknowledgement before order submission.

Keep allergen tags current on any item that may contain an allergen.

### Option Groups

Option groups define customer-facing choices.

Each option group has:

- Group name.
- Required or optional setting.
- Single or multiple choice setting.
- One or more choices.

Each choice can include:

- Name.
- Price delta.
- Description.
- Dietary info.
- Image URL.
- Request-only flag.

Request-only choices can require chef review before fulfillment.

### Meal Plan Template

For fixed meal plan items, the template adds only:

- Spice Level.
- Protein Substitution.

Older broad customizations such as vegetable/starch choice or 3-meal packages are intentionally not part of the current meal plan model.

Pork and beef should be treated as request-only proteins. Pricing may vary and chef approval may be required.

### Menu Categories

Route: `/admin/menu/categories`

Use this page to rename categories and change sort order. This controls display grouping and order, not business behavior.

### Archived Items

Route: `/admin/menu/archived`

Use this page to restore archived items or permanently delete them.

## Weekly Menu Manager

Route: `/admin/menu/weekly`

Weekly meal plans are fixed offerings created by the business. Customers can select package, offering, spice level, and protein substitution, but meals are not otherwise customizable.

### Weekly Menu Periods

A weekly menu period includes:

- Week label.
- Start date.
- End date.
- Ordering cutoff.
- Order capacity.
- Status.
- Fulfillment notes.

Weekly menu statuses:

| Status | Meaning |
| --- | --- |
| Draft | Internal setup; not ready for customers. |
| Published | Visible to customers for the current eligible week. |
| Closed | No longer accepting orders. |
| Archived | Retained historically but not active. |

Capacity counts submitted customer orders for the weekly menu, not meal plan item quantity.

Example: If one customer orders two weekly meal plan items in one checkout, capacity increases by one customer order.

### Creating or Editing a Weekly Menu

Use Create Weekly Menu to start a new period, or open an existing period and use Edit Weekly Menu.

Recommended setup order:

1. Create the weekly menu period in Draft status.
2. Add 1-meal and/or 2-meal packages.
3. Add fixed weekly offerings.
4. Add allergens to each offering.
5. Add allowed spice/protein options.
6. Review capacity and fulfillment notes.
7. Publish when ready.

### Cloning a Weekly Menu

Use Clone Weekly Menu to copy an existing period into a new draft.

The clone copies:

- Packages.
- Offerings.
- Allergen tags.
- Allowed spice/protein options.
- Fulfillment notes.
- Capacity value.

After cloning, update the week label, dates, cutoff, and any meal-specific details before publishing.

### Weekly Packages

Packages define customer-facing package choices.

Fields:

- Package name.
- Package price.
- Days: 5 days or 7 days.
- Meals per day: 1 meal or 2 meals.
- Display order.
- Notes.
- Availability.

The 3-meal package is not part of the current business model.

### Weekly Offerings

Offerings are fixed meals customers can choose from for that weekly menu.

Fields:

- Offering name.
- Display order.
- Description.
- Dietary info.
- Image URL.
- Availability.

Offerings should be written as fixed meals, not open-ended custom meal builders.

### Weekly Offering Allergens

Each weekly offering can be tagged with allergens.

These tags power customer warning and checkout acknowledgement flows when the customer's saved allergens match the selected weekly meal.

### Weekly Spice and Protein Options

Allowed weekly options are limited to:

- Spice Level.
- Protein Substitution.

Each option can include:

- Option type.
- Option name.
- Price delta.
- Display order.
- Description.
- Dietary info.
- Availability.
- Request with chef approval, for protein substitutions.

The approval checkbox is only available for protein substitutions.

### Weekly Fulfillment Prep

Each weekly period includes a fulfillment prep summary.

It shows:

- Order capacity used and remaining.
- Active order count.
- Request-only quantity.
- Approval-required quantity.
- Allergen flag quantity.
- Counts by offering.
- Counts by package.
- Counts by spice level.
- Counts by protein.
- Active weekly orders for the period.

Denied, cancelled, and refunded orders are excluded from prep counts.

Use Open Kitchen Board to move from weekly prep into active kitchen order management.

## Gallery Manager

Route: `/admin/gallery`

Use the gallery manager to control public gallery images.

### Adding a Gallery Image

Fields:

- Image upload or public image URL.
- Display title.
- Alt text.
- Category.
- Sort order.

Gallery categories:

- Meal Prep
- Meal Plans
- Catering
- Personal Chef
- Behind the Scenes

Images must be JPG, PNG, or WebP and 5 MB or smaller. WebP is preferred for public performance.

Production note: until durable upload storage is configured, use public image URLs for production images.

### Editing a Gallery Image

Use Edit on an image card to update:

- Image file or public image URL.
- Title.
- Alt text.
- Category.
- Sort order.

### Deleting a Gallery Image

Use Delete only when the image should be removed from the public gallery. The action asks for confirmation and cannot be undone through the dashboard.

## Customers

Routes:

- `/admin/customers`
- `/admin/customers/[id]`

### Customer List

The customer list includes:

- Customer name and email.
- Order count.
- Weekly meal plan item count.
- Total spent.
- Payment due count.
- Last order date.

Search by customer name or email.

Filters:

- All.
- Has Orders.
- Payment Due.

### Customer Detail

The customer detail page shows:

- Total orders.
- Active orders.
- Payments due.
- Total spent.
- Order history.
- Service request history.
- Customer info.
- Payment alert when applicable.

Use customer detail pages to answer support questions, follow up on payments, or jump into a specific order/request.

## Payments

Route: `/admin/payments`

Payment Management focuses on manual/offline payment tracking. Online card checkout is not currently enabled.

The page shows:

- Count of payments due.
- Outstanding total.
- Stripe placeholder status.
- Table of outstanding payments.

Use Mark Paid only after payment has been confirmed. The app rejects duplicate payment marking once an order is already paid.

## Reports

Route: `/admin/reports`

Reports provide operational snapshots, including:

- Total revenue.
- Orders this week.
- Orders this month.
- Average order value.
- Pending payments.
- Service request count.
- Catering request count.
- Personal chef request count.
- Pending order approvals.
- Pending service request approvals.
- Completed and cancelled order counts.
- Most ordered items.
- Revenue snapshot.

Use these reports for quick checks and operational awareness. They are not yet a full accounting export.

## Notifications

Route: `/admin/notifications`

The notifications page shows active and planned notification workflows.

Active workflows include:

- Order confirmations.
- Order approval updates.
- Payment received notices.
- Service request confirmations.
- Service request approval/quote updates.
- Service request deposit received notices.

Planned workflows include:

- Kitchen status updates.
- Payment reminders.

### Email Delivery Mode

The Email System card shows the current email mode:

- Live Sending: customer emails are sent through the configured provider.
- Preview Files: emails are saved locally for QA and not sent.
- Dry Run: emails are logged only.
- Disabled: emails are skipped because the email provider key is not configured.

For local testing, preview/dry-run modes protect real customers from receiving test emails.

## Business Settings

Route: `/admin/settings`

Business settings control operational rules used by checkout and service requests.

Fields:

- Delivery Fee.
- Late Fee.
- Service Request Deposit Percent.
- Cutoff Day.
- Cutoff Hour.
- Cutoff Minute.
- Delivery Area.
- Disable weekend ordering.

Be careful when changing settings during an active order window. Existing historical orders keep their saved snapshots, but new checkout calculations and service request quotes may use current settings.

## Image and Upload Guidelines

Use WebP images where possible.

Accepted upload types:

- JPG
- PNG
- WebP

Maximum upload size: 5 MB.

Image URL fields accept:

- Root-relative public URLs, such as `/uploads/gallery/example.webp`.
- Full `http://` or `https://` image URLs.

Production warning:

- Local uploads write to `public/uploads`.
- Local uploads are safe for local demos.
- Local production uploads are blocked unless `ALLOW_LOCAL_UPLOADS_IN_PRODUCTION="true"`.
- For production, use durable external image URLs until a durable upload provider is selected.

## Allergen Workflow

Allergens can appear on:

- Standard menu items.
- Weekly meal plan offerings.

Customers can save allergen preferences in their account.

When a customer adds items that match their saved allergens:

1. Cart and checkout show warnings.
2. Checkout requires allergen acknowledgement.
3. The order stores acknowledgement fields.
4. Admin order detail and kitchen/prep surfaces show allergy/allergen information.

Admin best practice:

- Tag allergens during menu setup.
- Review allergy notes before approving or preparing orders.
- Treat allergy notes and allergen flags as high-priority operational information.

## Approval and Duplicate Decision Guardrails

The dashboard has safeguards for final approval decisions.

For orders:

- Pending approval orders can be approved or denied.
- Approved orders cannot be approved again.
- Denied orders cannot be denied again.
- Duplicate API calls are rejected.

For service requests:

- Pending service requests can be approved or denied.
- Approved or denied requests lock final decision controls.
- Duplicate API calls are rejected.

For payments and deposits:

- Mark Paid appears only when payment is due.
- Mark Deposit Paid appears only when a valid unpaid deposit is due.
- Duplicate paid actions are rejected.

These guardrails help prevent duplicate customer emails and inconsistent final states.

## Recommended Operating Cadence

### Daily

- Check `/admin` for alerts.
- Review new orders.
- Review service requests.
- Confirm outstanding payments.
- Use `/admin/kitchen` for active prep.

### Before Each Weekly Menu Window

- Create or clone the weekly menu period.
- Confirm dates, cutoff, and capacity.
- Add 1-meal and 2-meal packages.
- Add fixed offerings.
- Tag allergens.
- Add spice and protein options.
- Mark request-only proteins appropriately.
- Publish only after the weekly menu is complete.

### During Prep

- Use Weekly Fulfillment Prep for counts.
- Use Kitchen View for active tickets.
- Print order details when needed.
- Watch allergy notes and allergen flags.

### After Fulfillment

- Mark orders completed.
- Mark payments paid when confirmed.
- Complete service requests after events are fulfilled.
- Review reports for follow-up needs.

## Common Mistakes to Avoid

- Do not create Personal Chef as a menu item. Use the service request workflow.
- Do not send Catering through cart checkout. Use service requests and quotes.
- Do not confuse menu category with menu item type.
- Do not publish a weekly menu until packages, offerings, allergens, and options are complete.
- Do not use 3-meal packages; only 1-meal and 2-meal packages are currently supported.
- Do not treat weekly meals as fully customizable. They are fixed offerings.
- Do not mark payments or deposits paid until money is actually received.
- Do not ignore request-only proteins; they may need chef approval.
- Do not rely on local uploads for production unless durable storage is confirmed.

## Launch Notes for Admins

Before production launch:

- Production URLs must use `https://`.
- Email dry-run must be disabled only when ready for live customer email.
- `ADMIN_EMAIL` must be set before promoting the first admin.
- Durable image storage must be decided if admins need direct production uploads.
- Stripe can remain unset while card checkout is disabled.

See `docs/launch-readiness-checklist.md` for the technical launch checklist.

## Troubleshooting

### I cannot access `/admin`

Confirm the account role is `ADMIN` or `OWNER`.

### I approved or denied something and the buttons disappeared

That is expected. Final approval decisions are locked to prevent duplicate customer emails and duplicate final states.

### A weekly menu is not visible to customers

Check:

- The weekly period status is Published.
- The current business date falls within the weekly period.
- The ordering cutoff has not passed.
- Packages and offerings are available.
- Capacity has not been reached.

### A customer cannot submit checkout because of allergens

The customer likely selected an item that matches saved account allergens. They must acknowledge the allergen warning before submitting.

### An image upload fails in production

Local production uploads may be blocked until durable upload storage is configured. Use a public image URL instead.

### A service request quote cannot be edited

Quote editing locks after certain final states, denied approvals, or paid deposits.

### A deposit paid button is missing

The request may not have a deposit due, the deposit may already be paid, the request may not be approved, or the request may be in a locked/final state.

