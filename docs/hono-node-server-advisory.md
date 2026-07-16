# @hono/node-server Advisory Resolution

Date reviewed: July 15, 2026

## Advisory

- Package: `@hono/node-server`
- Issue: middleware bypass through repeated slashes in `serveStatic`
- Affected versions: earlier than `1.19.13`
- Patched version: `1.19.13`

## Dependency Path

The package is not a direct application dependency. It is introduced through Prisma's development toolchain:

```text
prisma@7.8.0
  -> @prisma/dev@0.24.3
    -> @hono/node-server@1.19.11
```

Prisma's transitive declaration remains `1.19.11`, but the root npm override resolves the installed and locked package to `1.19.13`:

```json
"overrides": {
  "@hono/node-server": "1.19.13"
}
```

`package-lock.json` records `node_modules/@hono/node-server` at `1.19.13`. `npm ls @hono/node-server` and `npm explain @hono/node-server` both confirm the override.

## Production Reachability

Searches of `app`, `components`, `lib`, `emails`, `prisma`, and `scripts` found no direct import or use of Hono, `@hono/node-server`, or `serveStatic`. The affected package is used by Prisma's development tooling and is not believed to be on the Next.js production request path.

This reachability assessment does not replace the version fix. The override remains required so local, CI, and production-build dependency trees use the patched package.

## Verification

- `npm install`: completed and confirmed the overridden Hono resolution. Unrelated transitive Babel refreshes produced by the local install were intentionally excluded from this focused change.
- `npm ls @hono/node-server`: resolved `1.19.13 overridden`.
- `npm explain @hono/node-server`: confirmed Prisma's `1.19.11` request is overridden to `1.19.13`.
- `npm audit`: reported no Hono advisory. It reported one separate low-severity `@babel/core` development-tooling advisory already present in the base lockfile.
- `npm audit --omit=dev`: reported zero production dependency vulnerabilities.
