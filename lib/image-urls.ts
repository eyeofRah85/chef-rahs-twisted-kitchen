const rootRelativeImageUrlPattern = /^\/(?!\/)/;
const controlCharacterPattern = /[\u0000-\u001f]/;

export function isRemoteImageUrl(src: string | null | undefined) {
  return typeof src === "string" && /^https?:\/\//i.test(src);
}

export function parsePublicImageUrl(
  value: FormDataEntryValue | null | undefined,
) {
  if (typeof value !== "string") {
    return null;
  }

  const imageUrl = value.trim();

  if (!imageUrl) {
    return null;
  }

  if (rootRelativeImageUrlPattern.test(imageUrl)) {
    if (imageUrl.includes("\\") || controlCharacterPattern.test(imageUrl)) {
      throw new Error("Enter a valid public image URL.");
    }

    return imageUrl;
  }

  try {
    const parsedUrl = new URL(imageUrl);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Enter a valid public image URL.");
    }

    return parsedUrl.toString();
  } catch {
    throw new Error("Enter a valid public image URL.");
  }
}
