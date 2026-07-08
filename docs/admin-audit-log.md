# Admin audit log

## Smallest useful model

`AdminAuditLog` records who performed an important admin action, what entity was affected, and a small JSON metadata snapshot. It intentionally does not store passwords, secrets, tokens, full request bodies, or unnecessary customer personal data.

Fields:

- `action`: stable action name such as `ORDER_APPROVED` or `MENU_ITEM_ARCHIVED`.
- `entityType` / `entityId`: the affected record type and id.
- `actorUserId` / `actorEmail`: the signed-in admin when available, or a script actor marker for the admin promotion script.
- `metadata`: minimal non-sensitive context, such as new status, menu type, category id, or request type.
- `createdAt`: timestamp for review.

## Write locations

Audit entries are written after the selected admin mutation succeeds:

- Order approval/denial, order status updates, and manual paid marking.
- Catering/private chef approval/denial, status updates, quote updates, and deposit paid marking.
- Menu item create/update/archive/restore/delete and availability changes.
- Weekly meal plan period create/update/clone plus package, offering, and option create/update/delete actions where routes exist.
- Gallery image create/update/delete.
- `npm run admin:promote` role promotion script.

## Admin review

A small read-only `/admin/audit` page shows the 100 most recent audit entries. It uses the existing `requireAdminPage()` guard and does not add mutation controls.
