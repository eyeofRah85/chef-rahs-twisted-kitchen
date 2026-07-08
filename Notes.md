Chef Rah’s Twisted Kitchen
Custom ordering website + customer accounts + admin dashboard
Core MVP features

For launch, I would recommend:

Homepage
Menu page
A la carte ordering
Customer accounts
Cart
Scheduled ordering
Pickup / delivery / catering options
Allergy notes
Substitution preference
Online payment module
Pay-by-date setting
Admin dashboard
Menu manager
Order status manager
Email notifications
Basic reporting
Social media links
Modular parts

These should be built so they can be changed later:

Payment provider
Calendar/scheduling integration
Text/SMS provider
Email provider
Delivery fee rules
Late fee rules
Catering deposit rules

That way, the selected payment providers can change without rewriting the whole app. Current client-selected future providers are Square and PayPal.

Important business rules

These need to become actual app logic:

No weekends
Sunday delivery
Order deadline: Thursday at 5 PM
Late order fee: $10
Delivery fee: $10
Catering deposit: 50%
Tips accepted
Greater Atlanta delivery area
Seasonal menu changes every 3–4 weeks
Items can be marked unavailable
Customer can choose substitute option
Suggested tech stack

I would still use:

Next.js
TypeScript
Tailwind CSS
PostgreSQL
Prisma
NextAuth/Auth.js or Clerk
Square and PayPal in a future payment phase
Resend for email
Twilio later for SMS
Hostinger for domain/hosting
Supabase or Neon for database
GitHub for version control/project tracking

For accounts, you have two routes:

Fast/easier: Clerk
More custom/control: Auth.js / NextAuth

For this client, I’d lean Clerk if budget allows because it saves development time.

Database models you will likely need

At minimum:

User
CustomerProfile
MenuCategory
MenuItem
MenuItemOption
Allergen
Order
OrderItem
OrderStatusHistory
Payment
DeliveryAddress
CateringRequest
AdminSetting
Tip
Notification
Order statuses

Use something like:

Pending
Accepted
Preparing
Ready
Out for Delivery
Completed
Cancelled
Refunded

For catering:

Inquiry
Quoted
Deposit Due
Deposit Paid
Confirmed
Completed
Cancelled
Admin dashboard sections
Dashboard Home
Orders
Menu Manager
Seasonal Menu
A la Carte Items
Catering Requests
Customers
Reports
Business Settings
Payment Settings
Notification Settings
Social Links

Recommended launch phases
Phase 1 — MVP launch
Public site
Menu
Customer accounts
Cart
Order scheduling
Pickup/delivery/catering choice
Manual payment tracking at launch; Square/PayPal online payment later
Admin order dashboard
Menu editing
Email notifications
Basic reports

Phase 2 — Better automation
SMS notifications
Calendar integration
Advanced reports
Testimonials/reviews
Customer order history
Coupon codes
Delivery zone validation

Phase 3 — Advanced operations
Real-time kitchen dashboard
Limited order capacity
Inventory limits
Automated unavailable items
Recurring meal plans
Advanced catering quote workflow
Biggest scope warnings

These are the items that increase cost/time the most:

Customer accounts
Online payments
SMS notifications
Calendar integration
Catering deposits
Admin dashboard
Reports
Delivery rules
Late fee rules