"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return data?.error ?? fallback;
}

export function MenuItemForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      setPreview(null);
      setFileName("");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
  };

  async function handleSubmit(formData: FormData) {
    setSaving(true);

    const response = await fetch("/api/admin/menu", {
      method: "POST",
      body: formData,
    });

    setSaving(false);

    if (!response.ok) {
      alert(await readError(response, "Failed to create menu item."));
      return;
    }

    formRef.current?.reset();
    setPreview(null);
    setFileName("");

    router.refresh();
  }

  return (
    <form action={handleSubmit} className="h-fit rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold">Add Meal Plan / Menu Item</h2>

      <div className="mt-5 space-y-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Menu Item Image
            </label>

            <input
              id="imageUpload"
              type="file"
              name="imageUpload"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />

            <label
              htmlFor="imageUpload"
              className="inline-flex cursor-pointer items-center rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Select Image
            </label>

            {fileName && (
              <p className="text-sm text-neutral-600">
                Selected: {fileName}
              </p>
            )}

            {preview && (
              <div className="relative h-48 w-full overflow-hidden rounded-xl border">
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 384px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            <input
              name="imageUrl"
              type="text"
              placeholder="Public image URL"
              className="w-full rounded-xl border px-4 py-3"
            />
        </div>

        <input
          name="name"
          placeholder="Item name"
          className="w-full rounded-xl border px-4 py-3"
          required
        />


        <textarea
          name="description"
          placeholder="Description"
          rows={4}
          className="w-full rounded-xl border px-4 py-3"
          required
        />

        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          placeholder="Price"
          className="w-full rounded-xl border px-4 py-3"
          required
        />

        <label className="flex items-center gap-2 text-sm">
          <input name="available" type="checkbox" defaultChecked />
          Available
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input name="seasonal" type="checkbox" />
          Seasonal
        </label>

       <div>
  <label className="block text-sm font-medium">Category</label>

  <select
    name="categoryName"
    className="mt-2 w-full rounded-xl border px-4 py-3"
    defaultValue="Meal Plans"
    required
  >
    <option value="Meal Plans">Meal Plans</option>
    <option value="A La Carte">A La Carte</option>
    <option value="Catering">Catering</option>
    <option value="Desserts">Desserts</option>
    <option value="Sides">Sides</option>
    <option value="Other">Other</option>
  </select>
</div>

<div>
  <label className="block text-sm font-medium">Item Type</label>

  <select
    name="type"
    className="mt-2 w-full rounded-xl border px-4 py-3"
    defaultValue="MEAL_PLAN"
    required
  >
    <option value="MEAL_PLAN">Meal Plan</option>
    <option value="A_LA_CARTE">A La Carte</option>
    <option value="CATERING">Catering Related</option>
    <option value="PLATE">Plate / Legacy</option>
    <option value="DESSERT">Dessert</option>
    <option value="SIDE">Side</option>
    <option value="OTHER">Other</option>
  </select>
</div>

        <p className="mt-2 text-xs text-neutral-500">
          Meal plans are package-based and can use meal plan templates. Personal chef
          requests should use the Personal Chef inquiry workflow instead of menu items.
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input name="requiresApproval" type="checkbox" />
          Requires chef approval
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input name="customerInstructionsEnabled" type="checkbox" />
          Allow customer instructions
        </label>

        <button
          disabled={saving}
          className="w-full rounded-xl bg-black px-5 py-3 font-medium text-white disabled:bg-neutral-400"
        >
          {saving ? "Saving..." : "Create Offering"}
        </button>
      </div>
    </form>
  );
}
