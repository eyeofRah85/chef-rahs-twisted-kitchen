"use client";

import { useCheckoutStore } from "@/store/checkout-store";
import { useCartStore } from "@/store/cart-store";
import { calculateTip } from "@/lib/order-calculations";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  calculateLateFeeFromSettings,
  validateRequestedDate,
} from "@/lib/business-rules";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import type { CheckoutDetails } from "@/types/order";

const sectionClass =
  "rounded-lg border border-neutral-200 bg-white p-6 shadow-sm";
const inputClass =
  "w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
const labelClass = "block text-sm font-medium text-neutral-900";

const orderTypeOptions: {
  value: CheckoutDetails["orderType"];
  label: string;
}[] = [
  { value: "delivery", label: "Delivery" },
  { value: "pickup", label: "Pickup" },
];

export default function CheckoutPage() {
  const settings = useBusinessSettings();
  const details = useCheckoutStore((state) => state.details);
  const updateField = useCheckoutStore((state) => state.updateField);
  const updateContactDetails = useCheckoutStore(
    (state) => state.updateContactDetails,
  );
  const resetContactDetails = useCheckoutStore(
    (state) => state.resetContactDetails,
  );
  const resetCheckout = useCheckoutStore((state) => state.resetCheckout);

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      resetContactDetails();

      const response = await fetch("/api/account/profile", {
        cache: "no-store",
      });

      if (!response.ok || cancelled) return;

      const profile = await response.json();

      updateContactDetails({
        name: profile.name ?? "",
        phone: profile.phone ?? "",
        addressLine1: profile.addressLine1 ?? "",
        addressLine2: profile.addressLine2 ?? "",
        city: profile.city ?? "",
        state: profile.state ?? "",
        postalCode: profile.postalCode ?? "",
        deliveryNotes: profile.deliveryNotes ?? "",
        saveContactInfo: false,
      });
    }

    loadProfile().catch(() => {
      if (!cancelled) {
        resetContactDetails();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [resetContactDetails, updateContactDetails]);

  if (!mounted) {
    return null;
  }

  const hasCartItems = items.length > 0;

  if (!hasCartItems) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-10 text-neutral-950 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className={sectionClass}>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
              Checkout
            </p>

            <h1 className="mt-3 text-4xl font-bold">Your Cart Is Empty</h1>

            <p className="mt-4 text-neutral-700">
              Add meal plans or a la carte items before starting checkout.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/menu"
                className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white"
              >
                Browse Menu
              </Link>

              <Link
                href="/cart"
                className="rounded-lg border border-neutral-300 px-5 py-3 text-sm font-medium"
              >
                View Cart
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const deliveryFee =
    details.orderType === "delivery" ? settings.deliveryFee : 0;

  const lateFee = calculateLateFeeFromSettings({
    lateFee: settings.lateFee,
    cutoffDay: settings.orderCutoffDay,
    cutoffHour: settings.orderCutoffHour,
    cutoffMinute: settings.orderCutoffMinute,
  });

  const tipAmount = calculateTip(
    subtotal,
    details.tipType,
    details.customTipAmount,
  );

  const total = subtotal + deliveryFee + lateFee + tipAmount;
  const requiresApproval = items.some((item) => item.requiresApproval);

  const cutoffDayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const cutoffHour12 =
    settings.orderCutoffHour === 0
      ? 12
      : settings.orderCutoffHour > 12
        ? settings.orderCutoffHour - 12
        : settings.orderCutoffHour;

  const cutoffAmPm = settings.orderCutoffHour >= 12 ? "PM" : "AM";
  const cutoffMinute = settings.orderCutoffMinute
    .toString()
    .padStart(2, "0");
  const cutoffText = `${cutoffDayNames[settings.orderCutoffDay]} at ${cutoffHour12}:${cutoffMinute} ${cutoffAmPm}`;

  async function submitOrder() {
    if (submitting) return;

    setSubmitting(true);

    try {
      if (items.length === 0) {
        alert("Your cart is empty.");
        return;
      }

      if (!details.requestedDateTime) {
        alert("Please choose a requested date and time.");
        return;
      }

      const requestedDate = new Date(details.requestedDateTime);

      if (Number.isNaN(requestedDate.getTime())) {
        alert("Please choose a valid requested date and time.");
        return;
      }

      const validation = validateRequestedDate(requestedDate, {
        noWeekendOrdering: settings.noWeekendOrdering,
      });

      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      if (details.orderType === "delivery") {
        if (
          !details.name ||
          !details.phone ||
          !details.addressLine1 ||
          !details.city ||
          !details.state ||
          !details.postalCode
        ) {
          alert(
            "Delivery orders require name, phone number, address, city, state, and ZIP/postal code.",
          );
          return;
        }
      }

      if (details.orderType === "pickup") {
        if (!details.name || !details.phone) {
          alert("Pickup orders require your name and phone number.");
          return;
        }
      }

      if (details.paymentMethod === "manual" && !details.payByDate) {
        alert("Please choose a pay-by date.");
        return;
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          checkout: details,
          subtotal,
          deliveryFee,
          lateFee,
          tipAmount,
          total,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        alert(errorData?.error ?? "Failed to submit order.");
        return;
      }

      const order = await response.json();

      clearCart();
      resetCheckout();

      router.push(`/orders/${order.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10 text-neutral-950 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Checkout
          </p>

          <h1 className="mt-3 text-4xl font-bold">Checkout Details</h1>
        </div>

        <form
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
          onSubmit={(event) => {
            event.preventDefault();
            void submitOrder();
          }}
        >
          <div className="space-y-5">
            <section className={sectionClass}>
              <h2 className="text-xl font-semibold">Order Method</h2>

              <div className="mt-5 grid grid-cols-2 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
                {orderTypeOptions.map((option) => {
                  const selected = details.orderType === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => updateField("orderType", option.value)}
                      className={
                        selected
                          ? "rounded-md bg-black px-4 py-3 text-sm font-medium text-white"
                          : "rounded-md px-4 py-3 text-sm font-medium text-neutral-700"
                      }
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className={sectionClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Order Items</h2>

                <button
                  type="button"
                  onClick={() => router.push("/cart")}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium"
                >
                  Edit Cart
                </button>
              </div>

              <div className="mt-5 divide-y divide-neutral-200">
                {items.map((item) => (
                  <div key={item.cartId} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{item.name}</p>

                        <p className="mt-1 text-sm text-neutral-600">
                          Quantity: {item.quantity}
                        </p>

                        {item.selectedOptions &&
                          item.selectedOptions.length > 0 && (
                            <ul className="mt-3 space-y-1 text-sm text-neutral-600">
                              {item.selectedOptions.map((option, index) => (
                                <li
                                  key={`${option.groupName}-${option.choiceName}-${index}`}
                                  className="flex flex-wrap items-center gap-2"
                                >
                                  <span>
                                    <span className="font-medium">
                                      {option.groupName}:
                                    </span>{" "}
                                    {option.choiceName}
                                    {option.priceDelta > 0
                                      ? ` (+$${option.priceDelta.toFixed(2)})`
                                      : ""}
                                  </span>

                                  {option.requestOnly && (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                      Request Only
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}

                        {item.requiresApproval && (
                          <p className="mt-3 rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900">
                            This item requires chef approval before the order is
                            confirmed.
                          </p>
                        )}

                        {item.customerInstructions && (
                          <p className="mt-3 text-sm text-neutral-600">
                            <span className="font-medium">Instructions:</span>{" "}
                            {item.customerInstructions}
                          </p>
                        )}
                      </div>

                      <p className="font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <p className="text-sm text-neutral-600">
                    Your cart is empty.
                  </p>
                )}
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="text-xl font-semibold">
                {details.orderType === "delivery"
                  ? "Contact / Delivery Info"
                  : "Contact Info"}
              </h2>

              <p className="mt-3 text-sm text-neutral-600">
                Prefilled from your account profile when available. Check the
                box below to save changes back to your profile after ordering.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className={labelClass}>
                  Name
                  <input
                    value={details.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className={`${inputClass} mt-2`}
                  />
                </label>

                <label className={labelClass}>
                  Phone
                  <input
                    value={details.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    className={`${inputClass} mt-2`}
                  />
                </label>

                {details.orderType === "delivery" && (
                  <>
                    <label className={`${labelClass} md:col-span-2`}>
                      Address line 1
                      <input
                        value={details.addressLine1}
                        onChange={(event) =>
                          updateField("addressLine1", event.target.value)
                        }
                        className={`${inputClass} mt-2`}
                      />
                    </label>

                    <label className={`${labelClass} md:col-span-2`}>
                      Address line 2
                      <input
                        value={details.addressLine2}
                        onChange={(event) =>
                          updateField("addressLine2", event.target.value)
                        }
                        className={`${inputClass} mt-2`}
                      />
                    </label>

                    <label className={labelClass}>
                      City
                      <input
                        value={details.city}
                        onChange={(event) =>
                          updateField("city", event.target.value)
                        }
                        className={`${inputClass} mt-2`}
                      />
                    </label>

                    <label className={labelClass}>
                      State
                      <input
                        value={details.state}
                        onChange={(event) =>
                          updateField("state", event.target.value)
                        }
                        className={`${inputClass} mt-2`}
                      />
                    </label>

                    <label className={labelClass}>
                      ZIP / Postal code
                      <input
                        value={details.postalCode}
                        onChange={(event) =>
                          updateField("postalCode", event.target.value)
                        }
                        className={`${inputClass} mt-2`}
                      />
                    </label>

                    <label className={`${labelClass} md:col-span-2`}>
                      Delivery notes
                      <textarea
                        value={details.deliveryNotes}
                        onChange={(event) =>
                          updateField("deliveryNotes", event.target.value)
                        }
                        rows={3}
                        className={`${inputClass} mt-2`}
                      />
                    </label>
                  </>
                )}

                <label className="flex items-center gap-3 text-sm md:col-span-2">
                  <input
                    type="checkbox"
                    checked={Boolean(details.saveContactInfo)}
                    onChange={(event) =>
                      updateField("saveContactInfo", event.target.checked)
                    }
                    className="h-4 w-4"
                  />
                  Save this contact and delivery information to my account
                </label>
              </div>

              {details.orderType === "delivery" && settings.deliveryArea && (
                <p className="mt-4 text-xs text-neutral-500">
                  Delivery area: {settings.deliveryArea}.
                </p>
              )}
            </section>

            <section className={sectionClass}>
              <h2 className="text-xl font-semibold">Schedule</h2>

              <label className={`${labelClass} mt-5`}>
                Requested Date / Time
                <input
                  type="datetime-local"
                  value={details.requestedDateTime}
                  onChange={(event) =>
                    updateField("requestedDateTime", event.target.value)
                  }
                  className={`${inputClass} mt-2`}
                />
              </label>

              <p className="mt-3 text-xs text-neutral-500">
                Orders placed after {cutoffText} may include a $
                {settings.lateFee.toFixed(2)} late-order fee.
                {settings.noWeekendOrdering
                  ? " Weekend ordering is currently unavailable."
                  : ""}
              </p>

              {lateFee > 0 && (
                <div className="mt-4 rounded-lg border border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
                  Orders placed after {cutoffText} include a $
                  {settings.lateFee.toFixed(2)} late-order fee.
                </div>
              )}
            </section>

            <section className={sectionClass}>
              <h2 className="text-xl font-semibold">Preferences</h2>

              <div className="mt-5 space-y-5">
                <label className={labelClass}>
                  Allergy Notes
                  <textarea
                    rows={4}
                    value={details.allergyNotes}
                    onChange={(event) =>
                      updateField("allergyNotes", event.target.value)
                    }
                    className={`${inputClass} mt-2`}
                  />
                </label>

                <label className={labelClass}>
                  Substitution Preference
                  <textarea
                    rows={3}
                    value={details.substitutionPreference}
                    onChange={(event) =>
                      updateField("substitutionPreference", event.target.value)
                    }
                    className={`${inputClass} mt-2`}
                  />
                </label>
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="text-xl font-semibold">Payment</h2>

              <div className="mt-5 space-y-5">
                <label className={labelClass}>
                  Tip
                  <select
                    value={details.tipType}
                    onChange={(event) =>
                      updateField(
                        "tipType",
                        event.target.value as CheckoutDetails["tipType"],
                      )
                    }
                    className={`${inputClass} mt-2`}
                  >
                    <option value="none">No tip</option>
                    <option value="10">10%</option>
                    <option value="15">15%</option>
                    <option value="20">20%</option>
                    <option value="custom">Custom amount</option>
                  </select>
                </label>

                {details.tipType === "custom" && (
                  <label className={labelClass}>
                    Custom Tip Amount
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={details.customTipAmount}
                      onChange={(event) =>
                        updateField("customTipAmount", Number(event.target.value))
                      }
                      className={`${inputClass} mt-2`}
                    />
                  </label>
                )}

                <label className={labelClass}>
                  Payment Method
                  <select
                    value={details.paymentMethod}
                    onChange={(event) =>
                      updateField(
                        "paymentMethod",
                        event.target.value as CheckoutDetails["paymentMethod"],
                      )
                    }
                    className={`${inputClass} mt-2`}
                  >
                    <option value="manual">Pay Later / Manual Invoice</option>
                    <option value="cash">Cash / Offline Payment</option>
                    <option value="stripe" disabled>
                      Online Card Payment - Coming Soon
                    </option>
                  </select>
                </label>

                <p className="text-xs text-neutral-500">
                  Online card payments will be added later. For now, orders can
                  be submitted with manual payment tracking.
                </p>

                {details.paymentMethod === "manual" && (
                  <label className={labelClass}>
                    Pay By Date
                    <input
                      type="date"
                      value={details.payByDate}
                      onChange={(event) =>
                        updateField("payByDate", event.target.value)
                      }
                      className={`${inputClass} mt-2`}
                    />
                  </label>
                )}

                {requiresApproval && (
                  <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 text-sm text-blue-900">
                    One or more items in this order require chef approval. You
                    will receive an update once the order has been reviewed.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <section className={sectionClass}>
              <h2 className="text-xl font-semibold">Review</h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span>Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span>Late Fee</span>
                  <span>${lateFee.toFixed(2)}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span>Tip</span>
                  <span>${tipAmount.toFixed(2)}</span>
                </div>

                <div className="border-t border-neutral-200 pt-3 text-base font-bold">
                  <div className="flex justify-between gap-4">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {requiresApproval && (
                <div className="mt-5 rounded-lg border border-blue-300 bg-blue-50 p-4 text-sm text-blue-900">
                  This order includes one or more items that require chef
                  approval before confirmation.
                </div>
              )}

              {details.orderType === "delivery" && (
                <div className="mt-5 border-t border-neutral-200 pt-5 text-sm text-neutral-700">
                  <p className="font-semibold">Delivery To</p>

                  <p className="mt-2">{details.name || "Name not provided"}</p>

                  <p>
                    {details.addressLine1 || "Address not provided"}
                    {details.addressLine2 ? `, ${details.addressLine2}` : ""}
                  </p>

                  <p>
                    {[details.city, details.state, details.postalCode]
                      .filter(Boolean)
                      .join(", ") || "City, state, and ZIP not provided"}
                  </p>

                  {details.deliveryNotes && (
                    <p className="mt-2 text-neutral-500">
                      Notes: {details.deliveryNotes}
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !hasCartItems}
                className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-medium text-white disabled:bg-neutral-400"
              >
                {submitting
                  ? "Submitting..."
                  : hasCartItems
                    ? "Submit Order"
                    : "Cart Is Empty"}
              </button>
            </section>
          </aside>
        </form>
      </div>
    </main>
  );
}
