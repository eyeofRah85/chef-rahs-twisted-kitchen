"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { galleryCategoryOptions } from "@/data/gallery";

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return data?.error ?? fallback;
}

export function GalleryImageForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
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

    const response = await fetch("/api/admin/gallery", {
      method: "POST",
      body: formData,
    });

    setSaving(false);

    if (!response.ok) {
      alert(await readError(response, "Failed to create gallery image."));
      return;
    }

    formRef.current?.reset();
    setPreview(null);
    setFileName("");
    router.refresh();
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="h-fit rounded-2xl border bg-white p-6 shadow-sm"
    >
      <h2 className="text-2xl font-semibold">Add Gallery Image</h2>

      <div className="mt-5 space-y-4">
        <div className="space-y-3">
          <label className="block text-sm font-medium">Image</label>

          <input
            id="galleryImageUpload"
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="hidden"
            required
          />

          <label
            htmlFor="galleryImageUpload"
            className="inline-flex cursor-pointer rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Select Image
          </label>

          {fileName && (
            <p className="text-sm text-neutral-600">Selected: {fileName}</p>
          )}

          {preview && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border">
              <Image
                src={preview}
                alt="Gallery upload preview"
                fill
                sizes="(max-width: 768px) 100vw, 384px"
                className="object-cover"
                unoptimized
              />
            </div>
          )}
        </div>

        <input
          name="title"
          placeholder="Display title"
          className="w-full rounded-xl border px-4 py-3"
          required
        />

        <textarea
          name="alt"
          placeholder="Alt text"
          rows={3}
          className="w-full rounded-xl border px-4 py-3"
          required
        />

        <div>
          <label className="block text-sm font-medium">Category</label>

          <select
            name="category"
            className="mt-2 w-full rounded-xl border px-4 py-3"
            defaultValue="Meal Prep"
            required
          >
            {galleryCategoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Sort Order</label>

          <input
            name="sortOrder"
            type="number"
            min="0"
            step="1"
            defaultValue="0"
            className="mt-2 w-full rounded-xl border px-4 py-3"
            required
          />
        </div>

        <p className="text-xs text-neutral-500">
          Upload JPG, PNG, or WebP images up to 5 MB. WebP is preferred for the
          public gallery.
        </p>

        <button
          disabled={saving}
          className="w-full rounded-xl bg-black px-5 py-3 font-medium text-white disabled:bg-neutral-400"
        >
          {saving ? "Saving..." : "Add Image"}
        </button>
      </div>
    </form>
  );
}
