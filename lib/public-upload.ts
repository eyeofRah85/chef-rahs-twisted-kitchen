import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const maxImageSize = 5 * 1024 * 1024;

const imageExtensionsByType = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function validatePublicImageUpload(file: File) {
  if (!imageExtensionsByType.has(file.type)) {
    throw new Error("Upload a JPG, PNG, or WebP image.");
  }

  if (file.size > maxImageSize) {
    throw new Error("Image uploads must be 5 MB or smaller.");
  }
}

export async function savePublicImageUpload(file: File, folder: string) {
  validatePublicImageUpload(file);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

  await mkdir(uploadDir, { recursive: true });

  const extension = imageExtensionsByType.get(file.type) ?? "jpg";
  const baseName =
    path
      .basename(file.name, path.extname(file.name))
      .replaceAll(" ", "-")
      .replace(/[^a-zA-Z0-9.-]/g, "")
      .slice(0, 80) || "gallery-image";
  const safeFileName = `${Date.now()}-${baseName}.${extension}`;
  const filePath = path.join(uploadDir, safeFileName);

  await writeFile(filePath, buffer);

  return `/uploads/${folder}/${safeFileName}`;
}

export async function removePublicUpload(
  publicPath: string | null | undefined,
  folder: string,
) {
  if (!publicPath?.startsWith(`/uploads/${folder}/`)) {
    return;
  }

  const relativePath = publicPath.replace(/^\/+/, "").split("/").join(path.sep);
  const publicRoot = path.resolve(process.cwd(), "public");
  const folderRoot = path.resolve(publicRoot, "uploads", folder);
  const filePath = path.resolve(publicRoot, relativePath);

  if (!filePath.startsWith(`${folderRoot}${path.sep}`)) {
    return;
  }

  try {
    await unlink(filePath);
  } catch {
    // A missing uploaded file should not block deleting its database record.
  }
}
