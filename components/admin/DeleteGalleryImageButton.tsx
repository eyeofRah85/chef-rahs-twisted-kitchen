"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  imageId: string;
  title: string;
};

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return data?.error ?? fallback;
}

export function DeleteGalleryImageButton({ imageId, title }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function deleteImage() {
    const confirmed = confirm(
      `Remove "${title}" from the public gallery? This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeleting(true);

    const response = await fetch(`/api/admin/gallery/${imageId}`, {
      method: "DELETE",
    });

    setDeleting(false);

    if (!response.ok) {
      alert(await readError(response, "Failed to delete gallery image."));
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={deleteImage}
      disabled={deleting}
      className="admin-button-danger text-xs"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}
