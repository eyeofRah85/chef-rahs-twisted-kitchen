"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  category: {
    id: string;
    name: string;
    sortOrder: number;
  };
};

export function MenuCategoryEditForm({ category }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);

    const response = await fetch(`/api/admin/menu/categories/${category.id}`, {
      method: "PATCH",
      body: formData,
    });

    setSaving(false);

    if (!response.ok) {
      alert("Failed to update category.");
      return;
    }

    router.refresh();
  }

  return (
    <form
      action={handleSubmit}
      className="grid gap-3 md:grid-cols-[1fr_140px_auto]"
    >
      <input
        name="name"
        defaultValue={category.name}
        className="admin-input"
        required
      />

      <input
        name="sortOrder"
        type="number"
        defaultValue={category.sortOrder}
        className="admin-input"
      />

      <button disabled={saving} className="admin-button-primary">
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
