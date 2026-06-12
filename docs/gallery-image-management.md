# Gallery And Image Management

Date: June 9, 2026

This note captures the current image setup and the safest next direction. It is intentionally separate from weekly meal plan modeling.

## Current State

- Public `/gallery` reads `GalleryImage` database records when available and falls back to `data/gallery.ts`.
- Gallery images are served from files under `public/`.
- `public/gallery` contains original HEIC source files.
- `public/gallery/webp` contains optimized 1200x1600 WebP gallery images derived from the source files.
- `data/gallery.ts` remains the static fallback and category source.
- Admin `/admin/gallery` supports uploading, editing, reordering, categorizing, and deleting gallery images.
- The gallery upload API stores new files under `public/uploads/gallery`.
- Admin menu item creation supports uploading an image file to `public/uploads/menu`.
- Local public uploads are blocked in production unless `ALLOW_LOCAL_UPLOADS_IN_PRODUCTION="true"` is set after durable storage is confirmed.
- Admin menu item editing does not currently replace an item image.
- Option choice images are URL-based text fields.
- Existing `MenuItem.imageUrl` and `MenuItemOptionChoice.imageUrl` fields are URL strings, which can support local paths or hosted image URLs.

## Recommendation

Keep the current database-backed gallery approach for demo readiness:

- Use `/admin/gallery` for public gallery curation.
- Keep `data/gallery.ts` as a fallback only.
- Use optimized WebP copies for selected public gallery images.
- Keep original HEIC files as source material only.
- Do not tie gallery management to weekly meal plan modeling.

For menu item and option choice images:

- Keep URL string fields in the database.
- Keep menu item upload as a local/demo convenience only.
- Keep option choice images URL-based until production image storage is decided.
- Add image replacement/editing later only after the deployment target is confirmed.

## Production Upload Concern

Writing uploads to `public/uploads` is acceptable for a local demo or a single persistent server, but it is usually unsafe for serverless or immutable deployments. On many platforms, files written at runtime can disappear on redeploy or may not be shared across instances.

The app now refuses local public upload writes in production by default. Set `ALLOW_LOCAL_UPLOADS_IN_PRODUCTION="true"` only when the production host provides durable, shared local storage for `public/uploads`.

Before building a full admin upload workflow, confirm the production hosting target supports one of these:

- persistent local disk storage, or
- external object storage such as S3, Cloudflare R2, Supabase Storage, UploadThing, or the hosting provider's blob storage.

The production-safe pattern is:

1. Admin uploads an image.
2. The app stores the file in durable object storage.
3. The app saves the returned public URL in `imageUrl`.
4. Menu cards, option choices, and gallery entries render that URL.

## Next Safe Patch Later

After deployment assumptions are confirmed, the next image patch should be small:

- Add menu item image replacement to the edit form.
- Decide whether option choice image upload is needed or whether URL entry is enough.
- Expand validation if larger image files or other image formats are needed.
- Revisit gallery curation once the client selects final photos and captions.
