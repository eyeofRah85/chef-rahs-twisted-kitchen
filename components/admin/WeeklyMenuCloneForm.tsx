"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type WeeklyMenuCloneSource = {
  id: string;
  label: string;
  suggestedLabel: string;
  suggestedStartDate: string;
  suggestedEndDate: string;
  suggestedOrderCutoffAt: string | null;
  suggestedOrderingOpenAt: string | null;
  suggestedLateFeeStartsAt: string | null;
  suggestedOrderingClosesAt: string | null;
  suggestedFixedFulfillmentAt: string | null;
  customerSchedulingEnabled: boolean | null;
  deliveryWindowLabel: string | null;
  fulfillmentNotes: string | null;
  capacity: number;
  packageCount: number;
  offeringCount: number;
};

type Props = {
  source: WeeklyMenuCloneSource;
};

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return data?.error ?? fallback;
}

export function WeeklyMenuCloneForm({ source }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    const confirmed = confirm(
      `Clone "${source.label}" into a new draft weekly menu?`,
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      const response = await fetch(
        `/api/admin/menu/weekly-periods/${source.id}/clone`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        alert(await readError(response, "Failed to clone weekly menu."));
        return;
      }

      router.refresh();
    } catch {
      alert("Failed to clone weekly menu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form action={handleSubmit} className="admin-card p-5">
      <div className="mb-5">
        <h2 className="text-xl font-black">Clone Weekly Menu</h2>

        <p className="mt-1 text-sm text-[#6b5a50]">
          Copies {source.packageCount} package
          {source.packageCount === 1 ? "" : "s"} and {source.offeringCount}{" "}
          offering{source.offeringCount === 1 ? "" : "s"} into a new draft.
        </p>
      </div>

      <div className="grid gap-4">
        <label className="admin-label">
          Week Label
          <input
            name="label"
            defaultValue={source.suggestedLabel}
            className="admin-input"
            required
          />
        </label>

        <div className="grid gap-4">
          <label className="admin-label">
            Start Date
            <input
              name="startDate"
              type="date"
              defaultValue={source.suggestedStartDate}
              className="admin-input"
              required
            />
          </label>

          <label className="admin-label">
            End Date
            <input
              name="endDate"
              type="date"
              defaultValue={source.suggestedEndDate}
              className="admin-input"
              required
            />
          </label>
        </div>

        <div className="grid gap-4">
          <label className="admin-label">
            Order Capacity
            <input
              name="capacity"
              type="number"
              min="1"
              step="1"
              defaultValue={source.capacity}
              className="admin-input"
              required
            />
            <span className="text-xs font-normal leading-5 text-[#6b5a50]">
              Counts submitted customer orders for this weekly menu, not meal
              plan item quantity.
            </span>
          </label>
        </div>

        <section className="rounded-lg border border-[#ead8c1] bg-[#fff8ee] p-4">
          <h3 className="text-sm font-black uppercase text-[#9f2f18]">
            Weekly Ordering Window
          </h3>

          <div className="mt-4 grid gap-4">
            <label className="admin-label">
              Weekly Customer Scheduling
              <select
                name="customerSchedulingEnabled"
                defaultValue={
                  source.customerSchedulingEnabled === true
                    ? "enabled"
                    : source.customerSchedulingEnabled === false
                      ? "disabled"
                      : "inherit"
                }
                className="admin-input"
              >
                <option value="inherit">Use business setting</option>
                <option value="disabled">Fixed weekly fulfillment</option>
                <option value="enabled">Customer selects date/time</option>
              </select>
            </label>

            <label className="admin-label">
              Ordering Opens
              <input
                name="orderingOpenAt"
                type="datetime-local"
                defaultValue={source.suggestedOrderingOpenAt ?? ""}
                className="admin-input"
              />
            </label>

            <label className="admin-label">
              Late Fee Starts
              <input
                name="lateFeeStartsAt"
                type="datetime-local"
                defaultValue={source.suggestedLateFeeStartsAt ?? ""}
                className="admin-input"
              />
            </label>

            <label className="admin-label">
              Ordering Closes
              <input
                name="orderingClosesAt"
                type="datetime-local"
                defaultValue={source.suggestedOrderingClosesAt ?? ""}
                className="admin-input"
              />
            </label>

            <label className="admin-label">
              Customer Delivery Message
              <input
                name="deliveryWindowLabel"
                defaultValue={source.deliveryWindowLabel ?? ""}
                className="admin-input"
              />
            </label>
          </div>

          <details className="mt-4 rounded-lg border border-[#ead8c1] bg-white p-4 text-sm text-[#6b5a50]">
            <summary className="cursor-pointer font-bold text-[#3b241b]">
              Advanced / system schedule fields
            </summary>

            <div className="mt-3 space-y-2">
              <p>
                Legacy ordering cutoff is maintained automatically from the
                cloned menu&apos;s Ordering Closes value.
              </p>
              <p>
                Suggested compatibility cutoff:{" "}
                <span className="font-semibold">
                  {source.suggestedOrderCutoffAt ?? "Will use Ordering Closes"}
                </span>
              </p>
              <p>
                Internal fixed fulfillment datetime:{" "}
                <span className="font-semibold">
                  {source.suggestedFixedFulfillmentAt ??
                    "Resolved server-side from the Sunday fulfillment settings"}
                </span>
              </p>
            </div>
          </details>
        </section>

        <label className="admin-label">
          Fulfillment Notes
          <textarea
            name="fulfillmentNotes"
            rows={3}
            defaultValue={source.fulfillmentNotes ?? ""}
            className="admin-input"
          />
        </label>

        <button disabled={saving} className="admin-button-primary">
          {saving ? "Cloning..." : "Clone as Draft"}
        </button>
      </div>
    </form>
  );
}
