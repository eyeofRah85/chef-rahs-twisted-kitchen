"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";
import {
  galleryCategoryOptions,
  type GalleryImageCategory,
} from "@/data/gallery";

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
        className="rounded-xl border px-4 py-2 text-xs font-medium"
      >
        Edit
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-3 rounded-xl border p-4">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border">
        <Image
          src={preview ?? image.src}
          alt={preview ? "Updated gallery image preview" : image.alt}
          fill
          sizes="(max-width: 768px) 100vw, 360px"
          className="object-cover"
          unoptimized={Boolean(preview)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Replace Image</label>

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
          className="inline-flex cursor-pointer rounded-xl border px-4 py-2 text-xs font-medium hover:bg-neutral-50"
        >
          Select New Image
        </label>

        {fileName && (
          <p className="text-xs text-neutral-500">Selected: {fileName}</p>
        )}
      </div>

      <input
        name="title"
        defaultValue={image.title}
        className="w-full rounded-xl border px-4 py-3 text-sm"
        required
      />

      <textarea
        name="alt"
        defaultValue={image.alt}
        rows={3}
        className="w-full rounded-xl border px-4 py-3 text-sm"
        required
      />

      <select
        name="category"
        defaultValue={image.category}
        className="w-full rounded-xl border px-4 py-3 text-sm"
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
        className="w-full rounded-xl border px-4 py-3 text-sm"
        required
      />

      <div className="flex flex-wrap gap-3">
        <button
          disabled={saving}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:bg-neutral-400"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setPreview(null);
            setFileName("");
          }}
          className="rounded-xl border px-4 py-2 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
