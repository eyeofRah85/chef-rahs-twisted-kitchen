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
    weeklyCustomerSchedulingEnabled: boolean;
    weeklyOrderingOpenDay: number;
    weeklyOrderingOpenHour: number;
    weeklyOrderingOpenMinute: number;
    weeklyLateFeeStartDay: number;
    weeklyLateFeeStartHour: number;
    weeklyLateFeeStartMinute: number;
    weeklyOrderingCloseDay: number;
    weeklyOrderingCloseHour: number;
    weeklyOrderingCloseMinute: number;
    weeklyFixedFulfillmentDay: number;
    weeklyFixedFulfillmentHour: number;
    weeklyFixedFulfillmentMinute: number;
    weeklyFixedFulfillmentMessage: string | null;
  };
};

const dayOptions = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function formatTimeInput(hour: number, minute: number) {
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

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
    <form action={handleSubmit} className="admin-card p-6">
      <h2 className="text-2xl font-black">Ordering Rules</h2>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label className="block text-sm font-bold">Delivery Fee</label>
          <input
            name="deliveryFee"
            type="number"
            min="0"
            step="0.01"
            defaultValue={settings.deliveryFee}
            className="admin-input mt-2"
          />
        </div>

        <div>
          <label className="block text-sm font-bold">Late Fee</label>
          <input
            name="lateFee"
            type="number"
            min="0"
            step="0.01"
            defaultValue={settings.lateFee}
            className="admin-input mt-2"
          />
        </div>

        <div>
          <label className="block text-sm font-bold">
            Service Request Deposit Percent
          </label>
          <input
            name="cateringDepositPercent"
            type="number"
            min="0"
            max="100"
            defaultValue={settings.cateringDepositPercent}
            className="admin-input mt-2"
          />
        </div>

        <div>
          <label className="block text-sm font-bold">Cutoff Day</label>
          <select
            name="orderCutoffDay"
            defaultValue={settings.orderCutoffDay}
            className="admin-input mt-2"
          >
            {dayOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold">Cutoff Hour</label>
          <input
            name="orderCutoffHour"
            type="number"
            min="0"
            max="23"
            defaultValue={settings.orderCutoffHour}
            className="admin-input mt-2"
          />
        </div>

        <div>
          <label className="block text-sm font-bold">Cutoff Minute</label>
          <input
            name="orderCutoffMinute"
            type="number"
            min="0"
            max="59"
            defaultValue={settings.orderCutoffMinute}
            className="admin-input mt-2"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold">Delivery Area</label>
          <input
            name="deliveryArea"
            defaultValue={settings.deliveryArea ?? ""}
            className="admin-input mt-2"
          />
        </div>

        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            name="noWeekendOrdering"
            type="checkbox"
            defaultChecked={settings.noWeekendOrdering}
          />
          Disable weekend ordering
        </label>
      </div>

      <div className="mt-8 border-t border-[#ead8c1] pt-8">
        <div>
          <h3 className="text-xl font-black">
            Weekly Meal Plan Ordering Window
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#6b5a50]">
            These defaults are used when creating weekly menu periods. Keep
            customer scheduling off for launch to use the fixed Sunday
            fulfillment workflow.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm font-bold md:col-span-2">
            <input
              name="weeklyCustomerSchedulingEnabled"
              type="checkbox"
              defaultChecked={settings.weeklyCustomerSchedulingEnabled}
            />
            Allow customers to choose weekly meal plan fulfillment date/time
          </label>

          <div>
            <label className="block text-sm font-bold">
              Weekly Ordering Opens
            </label>
            <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_140px]">
              <select
                name="weeklyOrderingOpenDay"
                defaultValue={settings.weeklyOrderingOpenDay}
                className="admin-input"
              >
                {dayOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                name="weeklyOrderingOpenTime"
                type="time"
                defaultValue={formatTimeInput(
                  settings.weeklyOrderingOpenHour,
                  settings.weeklyOrderingOpenMinute,
                )}
                className="admin-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold">
              Weekly Late Fee Starts
            </label>
            <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_140px]">
              <select
                name="weeklyLateFeeStartDay"
                defaultValue={settings.weeklyLateFeeStartDay}
                className="admin-input"
              >
                {dayOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                name="weeklyLateFeeStartTime"
                type="time"
                defaultValue={formatTimeInput(
                  settings.weeklyLateFeeStartHour,
                  settings.weeklyLateFeeStartMinute,
                )}
                className="admin-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold">
              Weekly Ordering Closes
            </label>
            <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_140px]">
              <select
                name="weeklyOrderingCloseDay"
                defaultValue={settings.weeklyOrderingCloseDay}
                className="admin-input"
              >
                {dayOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                name="weeklyOrderingCloseTime"
                type="time"
                defaultValue={formatTimeInput(
                  settings.weeklyOrderingCloseHour,
                  settings.weeklyOrderingCloseMinute,
                )}
                className="admin-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold">
              Fixed Weekly Fulfillment
            </label>
            <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_140px]">
              <select
                name="weeklyFixedFulfillmentDay"
                defaultValue={settings.weeklyFixedFulfillmentDay}
                className="admin-input"
              >
                {dayOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                name="weeklyFixedFulfillmentTime"
                type="time"
                defaultValue={formatTimeInput(
                  settings.weeklyFixedFulfillmentHour,
                  settings.weeklyFixedFulfillmentMinute,
                )}
                className="admin-input"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold">
              Customer-Facing Weekly Fulfillment Message
            </label>
            <input
              name="weeklyFixedFulfillmentMessage"
              defaultValue={settings.weeklyFixedFulfillmentMessage ?? ""}
              className="admin-input mt-2"
              placeholder="Weekly meal plan orders are delivered on Sunday."
            />
          </div>
        </div>
      </div>

      <button disabled={saving} className="admin-button-primary mt-8">
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
