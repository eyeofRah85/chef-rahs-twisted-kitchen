"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  settings: {
    id: string;
    deliveryFee: number;
    lateFee: number;
    cateringDepositPercent: number;
    orderCutoffDay: number;
    orderCutoffHour: number;
    orderCutoffMinute: number;
    noWeekendOrdering: boolean;
    deliveryArea: string | null;
  };
};

export function BusinessSettingsForm({ settings }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);

    const response = await fetch("/api/admin/settings/business", {
      method: "PATCH",
      body: formData,
    });

    setSaving(false);

    if (!response.ok) {
      alert("Failed to update business settings.");
      return;
    }

    router.refresh();
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-2xl border bg-white p-6 shadow-sm"
    >
      <h2 className="text-2xl font-semibold">Ordering Rules</h2>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Delivery Fee</label>
          <input
            name="deliveryFee"
            type="number"
            min="0"
            step="0.01"
            defaultValue={settings.deliveryFee}
            className="mt-2 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Late Fee</label>
          <input
            name="lateFee"
            type="number"
            min="0"
            step="0.01"
            defaultValue={settings.lateFee}
            className="mt-2 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Service Request Deposit Percent
          </label>
          <input
            name="cateringDepositPercent"
            type="number"
            min="0"
            max="100"
            defaultValue={settings.cateringDepositPercent}
            className="mt-2 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Cutoff Day</label>
          <select
            name="orderCutoffDay"
            defaultValue={settings.orderCutoffDay}
            className="mt-2 w-full rounded-xl border px-4 py-3"
          >
            <option value="0">Sunday</option>
            <option value="1">Monday</option>
            <option value="2">Tuesday</option>
            <option value="3">Wednesday</option>
            <option value="4">Thursday</option>
            <option value="5">Friday</option>
            <option value="6">Saturday</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Cutoff Hour</label>
          <input
            name="orderCutoffHour"
            type="number"
            min="0"
            max="23"
            defaultValue={settings.orderCutoffHour}
            className="mt-2 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Cutoff Minute</label>
          <input
            name="orderCutoffMinute"
            type="number"
            min="0"
            max="59"
            defaultValue={settings.orderCutoffMinute}
            className="mt-2 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Delivery Area</label>
          <input
            name="deliveryArea"
            defaultValue={settings.deliveryArea ?? ""}
            className="mt-2 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            name="noWeekendOrdering"
            type="checkbox"
            defaultChecked={settings.noWeekendOrdering}
          />
          Disable weekend ordering
        </label>
      </div>

      <button
        disabled={saving}
        className="mt-8 rounded-xl bg-black px-5 py-3 font-medium text-white disabled:bg-neutral-400"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
