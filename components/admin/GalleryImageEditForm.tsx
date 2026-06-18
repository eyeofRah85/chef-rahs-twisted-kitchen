"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";
import {
  galleryCategoryOptions,
  type GalleryImageCategory,
} from "@/data/gallery";
import { isRemoteImageUrl } from "@/lib/image-urls";

type Props = {
  image: {
    id: string;
    src: string;
    alt: string;
    title: string;
    category: GalleryImageCategory;
    sortOrder: number;
  };
};

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return data?.error ?? fallback;
}

export function GalleryImageEditForm({ image }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setPreview(null);
      setFileName("");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);

    const response = await fetch(`/api/admin/gallery/${image.id}`, {
      method: "PATCH",
      body: formData,
    });

    setSaving(false);

    if (!response.ok) {
      alert(await readError(response, "Failed to update gallery image."));
      return;
    }

    setOpen(false);
    setPreview(null);
    setFileName("");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="admin-button-secondary px-4 py-2 text-xs"
      >
        Edit
      </button>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-3 rounded-lg border border-[#ead8c1] p-4"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border">
        <Image
          src={preview ?? image.src}
          alt={preview ? "Updated gallery image preview" : image.alt}
          fill
          sizes="(max-width: 768px) 100vw, 360px"
          className="object-cover"
          unoptimized={Boolean(preview) || isRemoteImageUrl(image.src)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold">Replace Image</label>

        <input
          id={`galleryImageUpload-${image.id}`}
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          className="hidden"
        />

        <label
          htmlFor={`galleryImageUpload-${image.id}`}
          className="admin-button-secondary cursor-pointer px-4 py-2 text-xs"
        >
          Select New Image
        </label>

        {fileName && (
          <p className="text-xs text-[#6b5a50]">Selected: {fileName}</p>
        )}
      </div>

      <input
        name="imageUrl"
        type="text"
        defaultValue={image.src}
        placeholder="Public image URL"
        className="admin-input"
      />

      <input
        name="title"
        defaultValue={image.title}
        className="admin-input"
        required
      />

      <textarea
        name="alt"
        defaultValue={image.alt}
        rows={3}
        className="admin-input"
        required
      />

      <select
        name="category"
        defaultValue={image.category}
        className="admin-input"
        required
      >
        {galleryCategoryOptions.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <input
        name="sortOrder"
        type="number"
        min="0"
        step="1"
        defaultValue={image.sortOrder}
        className="admin-input"
        required
      />

      <div className="flex flex-wrap gap-3">
        <button disabled={saving} className="admin-button-primary px-4 py-2">
          {saving ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setPreview(null);
            setFileName("");
          }}
          className="admin-button-secondary px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
