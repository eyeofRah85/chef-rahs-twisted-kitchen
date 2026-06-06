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
  - `npm run lint` passes with existing `@next/next/no-img-element` warnings.
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
