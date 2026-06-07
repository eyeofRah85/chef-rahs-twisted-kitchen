You are helping continue development on a Next.js/Prisma food service web app for Chef Rah's Twisted Kitchen.

Current business model:
- Meal Plans / Meal Prep and A La Carte items are purchased through cart checkout.
- Catering and Personal Chef are service request / quote workflows, not direct checkout purchases.
- Meal plans support rich customizations such as plan length, meals per day, protein, vegetable, starch, substitutions, request-only options, descriptions, dietary info, image URLs, and price deltas.
- Pork and beef are request-only for meal plans. Pricing may vary and chef approval may be required.
- Customer accounts now include phone, delivery address fields, and delivery notes.
- Checkout preloads account profile data and can save edited checkout contact info back to the customer profile.
- Orders store a delivery/contact snapshot so historical orders keep the delivery info used at order time.
- Admin order approvals and service request approvals should prevent duplicate final decisions.

Important architecture notes:
- Menu item `type` controls behavior, such as MEAL_PLAN, A_LA_CARTE, CATERING, PLATE, DESSERT, SIDE, OTHER.
- Menu category controls display grouping, such as "Meal Plans", "A La Carte", "Desserts", "Sides".
- Do not confuse category names with enum values.
- Catering and Personal Chef share the CateringRequest/service request workflow using requestType.
- Checkout orderType should only be delivery or pickup.
- Keep routes stable for now:
  - /menu displays Meal Plans / A La Carte
  - /admin/catering displays Service Requests
  - /account/catering displays Service Requests

Please inspect the codebase before making changes. Do not rename routes or database models unless explicitly asked. Avoid large rewrites. Prefer small safe changes with clear commits.

Current next priorities:
1. Verify checkout contact/profile flow:
   - account profile updates correctly
   - checkout preloads current user profile
   - checkout does not leak prior user persisted data
   - saveContactInfo updates the profile after order submission
   - delivery/pickup validations match frontend and backend
2. Remove or avoid debug UI.
3. Polish checkout sections:
   - Order Method
   - Order Items
   - Contact / Delivery Info
   - Schedule
   - Preferences
   - Payment
   - Review
4. Ensure order detail pages show delivery/contact snapshot.
5. Ensure order confirmation emails include delivery/contact details.
6. Make sure duplicate approval decisions are blocked on both frontend and backend.
7. Run typecheck/build and report any issues before making unrelated changes.

Start by auditing the checkout/profile/order flow and tell me what you find. Then propose the smallest safe patch.

Progress update - June 6, 2026:
- Checkout/profile/order flow has been audited and patched:
  - Checkout contact details are reset before account profile preload.
  - Persisted checkout state no longer carries stale contact/delivery details across users.
  - Account profile data preloads into checkout for signed-in users.
  - `saveContactInfo` updates the customer profile after order submission.
  - Delivery and pickup validations are enforced on both checkout UI and order creation API.
- Debug UI cleanup:
  - Removed the known admin menu form debug log.
  - No remaining `console.log`, `Debug`, or `debug` matches were found in `app`, `components`, `store`, `emails`, or `lib`.
- Checkout page polish:
  - Checkout is organized around Order Method, Order Items, Contact / Delivery Info, Schedule, Preferences, Payment, and Review.
  - The checkout route remains `/checkout`.
- Order history snapshots:
  - Customer and admin order detail pages show the delivery/contact snapshot saved with the order.
- Order confirmation email:
  - Confirmation emails include contact and delivery details from the order snapshot.
  - Duplicate divider/total markup and non-ASCII item separators were cleaned up.
- Approval duplicate-decision protection:
  - Admin order and service request approval forms show final approved/denied states instead of repeat decision buttons.
  - Admin order and service request approval APIs guard final decisions with pending-only transactional updates.
  - Duplicate final decisions return an error and do not resend approval/denial emails.
- Validation:
  - `npm run lint` passes without warnings.
  - `npm run build` passes with the current Next.js/Prisma setup.
- Service request and order detail polish:
  - Personal Chef requests now use the raw `requestType` value for branching, so they are labeled as Personal Chef instead of falling back to Catering.
  - Admin service request status updates now receive the raw status enum instead of a formatted label.
  - Admin service request approval and status controls are split into separate cards.
  - Customer order detail pages now show one approval notice instead of duplicated pending/denied/approved messaging.
- Purchase vs. service request boundary:
  - Public `/menu` hides menu items with type `CATERING` so quote-based services do not enter cart checkout.
  - Order creation rejects submitted cart items whose menu item type is `CATERING`, protecting against stale persisted carts.
  - Admin order filters now only expose delivery and pickup order types.
  - Admin orders table columns were realigned so approval status no longer appears under the item count column.
- Order label polish:
  - Added a shared order status formatter for customer and admin order summaries.
  - Account, admin, customer detail, order list, and kitchen views now show friendly order type/status/payment labels instead of raw enum values.
  - Cleaned corrupted item quantity and separator text in summary cards.
  - Kitchen view now passes only plain serialized order data to the client card, avoiding Prisma `Decimal` objects in client component props.
- Admin menu customization polish:
  - Restored manual option group name entry in the customization editor.
  - Removed duplicate "Add Option Group" heading in the customization editor.
- Email label polish:
  - Order confirmation emails now format order type, payment status, and approval status with customer-friendly labels.
  - Catering/service request status emails now format request status and approval status with customer-friendly labels.
- Service request email terminology:
  - Shared service request emails now use `requestType` so Personal Chef messages are not labeled as Catering.
  - Approval, quote, deposit, catering, and personal chef request email senders pass the request type into their email templates.
- Service request UI terminology:
  - Shared account and admin service request views now use Service Requests or `requestType`-aware labels where Catering and Personal Chef records can both appear.
  - Admin dashboard, reports, customer detail, request detail, and notification pages avoid Catering-only copy for shared service request counts and approvals.
- Lint warning cleanup:
  - Replaced remaining plain image elements with `next/image` on the home page, menu cards, menu customization modal choice images, and admin menu item preview.
  - `npm run lint` now completes without the prior `@next/next/no-img-element` warnings.
- Admin status label polish:
  - Admin order and service request status dropdowns now show friendly status labels instead of raw enum values.
  - Service request status formatting explicitly covers new, deposit due, and deposit paid states.
- Account service request navigation:
  - The account dashboard Service Requests card now links to the account service request history instead of the public catering request form.
  - Account profile copy now describes contact, delivery, and service-location information for orders and service requests.
- Service request deposit guard:
  - Marking a service request deposit as paid now requires an unpaid request with a deposit amount.
  - Duplicate deposit-paid calls are rejected before sending another receipt email.
- Order payment guard:
  - Marking an order as paid now only succeeds for unpaid orders with payment due.
  - Duplicate order payment calls are rejected before sending another payment received email.
- Order detail label polish:
  - Customer and admin order detail pages now show friendly order and payment status labels.
  - Cleaned remaining corrupted quantity separators and aligned the admin payments table columns.
