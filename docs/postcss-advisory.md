# PostCSS Advisory Resolution

Date reviewed: July 15, 2026

## Advisory

- Package: `postcss`
- Issue: XSS through an unescaped `</style>` sequence in CSS stringify output
- Affected versions: earlier than `8.5.10`
- Patched version: `8.5.10`

## Dependency Paths

PostCSS is not imported directly by application runtime code. It is introduced by the Next.js and Tailwind build toolchains:

```text
next@16.2.10
  -> postcss@8.4.31

@tailwindcss/postcss@4.2.4
  -> postcss@^8.5.6
```

The root npm override resolves both paths to the patched version:

```json
"overrides": {
  "@hono/node-server": "1.19.13",
  "postcss": "8.5.10"
}
```

`package-lock.json` records both nested PostCSS installations at `8.5.10`. `npm ls postcss` and `npm explain postcss` confirm that Next's `8.4.31` request and Tailwind's compatible range are overridden to `8.5.10`.

## Production Reachability

The repository uses `@tailwindcss/postcss` in `postcss.config.mjs` to process the application-owned Tailwind stylesheet during the build. Searches of `app`, `components`, `lib`, `emails`, `prisma`, and `scripts` found:

- no direct PostCSS import or API call in application code,
- no feature that accepts user-provided or custom CSS,
- no PostCSS `toResult` or CSS stringify call over user input,
- no `dangerouslySetInnerHTML` use, and
- no path that embeds PostCSS-stringified user CSS into an HTML `<style>` tag.

`lib/email-preview.ts` removes `<style>` elements while deriving plain text from React Email output. It does not accept or stringify user CSS and is unrelated to the vulnerable PostCSS behavior.

The vulnerable behavior is therefore not believed to be reachable through the production application request path. This reachability assessment does not replace the package fix; the override remains required so local, CI, and production builds use `8.5.10`.

## Verification

- `npm install`: completed without changing `package.json` or `package-lock.json`, confirming the override and lockfile were already synchronized.
- `npm ls postcss`: resolved both dependency paths to `postcss@8.5.10 overridden`.
- `npm explain postcss`: confirmed Next's `8.4.31` request is overridden to `8.5.10`.
- `npm audit`: reported no PostCSS advisory. It reported one separate low-severity `@babel/core` development-tooling advisory already present in the base lockfile.
