"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    deliveryNotes: string | null;
  };
  onSaved?: () => void;
};

export function AccountProfileForm({ user, onSaved }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
  setSaving(true);

  const response = await fetch("/api/account/profile", {
    method: "PATCH",
    body: formData,
  });

  setSaving(false);

  if (!response.ok) {
    alert("Failed to update account information.");
    return;
  }

  router.refresh();
  onSaved?.();
}

  return (
    <form
      action={handleSubmit}
      className="rounded-2xl border bg-neutral-50 p-5"
    >
      <h2 className="text-2xl font-semibold">Account Information</h2>

      <p className="mt-2 text-sm text-neutral-600">
        Update your contact, delivery, and service-location information for orders
        and service requests.
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            name="name"
            defaultValue={user.name ?? ""}
            className="mt-2 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            value={user.email ?? ""}
            disabled
            className="mt-2 w-full rounded-xl border bg-neutral-100 px-4 py-3 text-neutral-500"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Email changes are not available here yet.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input
            name="phone"
            defaultValue={user.phone ?? ""}
            className="mt-2 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">ZIP / Postal Code</label>
          <input
            name="postalCode"
            defaultValue={user.postalCode ?? ""}
            className="mt-2 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Address Line 1</label>
          <input
            name="addressLine1"
            defaultValue={user.addressLine1 ?? ""}
            className="mt-2 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Address Line 2</label>
          <input
            name="addressLine2"
            defaultValue={user.addressLine2 ?? ""}
            placeholder="Apartment, suite, unit, building, etc."
            className="mt-2 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">City</label>
          <input
            name="city"
            defaultValue={user.city ?? ""}
            className="mt-2 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">State</label>
          <input
            name="state"
            defaultValue={user.state ?? ""}
            className="mt-2 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Delivery Notes</label>
          <textarea
            name="deliveryNotes"
            defaultValue={user.deliveryNotes ?? ""}
            rows={4}
            placeholder="Gate code, apartment instructions, preferred drop-off notes, parking details, etc."
            className="mt-2 w-full rounded-xl border px-4 py-3"
          />
        </div>
      </div>

      <button
        disabled={saving}
        className="mt-8 rounded-xl bg-black px-5 py-3 font-medium text-white disabled:bg-neutral-400"
      >
        {saving ? "Saving..." : "Save Account Information"}
      </button>
    </form>
  );
}
