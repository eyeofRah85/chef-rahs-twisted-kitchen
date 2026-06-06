"use client";

import { useCheckoutStore } from "@/store/checkout-store";
import { useCartStore } from "@/store/cart-store";
import { calculateTip } from "@/lib/order-calculations";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  calculateLateFeeFromSettings,
  validateRequestedDate,
} from "@/lib/business-rules";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import type { CheckoutDetails } from "@/types/order";

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
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const resetCheckout = useCheckoutStore(
    (state) => state.resetCheckout,
  );

  const [mounted, setMounted] = useState(false);

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

  const total =
    subtotal +
    deliveryFee +
    lateFee +
    tipAmount;
    
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

  const cutoffAmPm =
    settings.orderCutoffHour >= 12 ? "PM" : "AM";

  const cutoffMinute = settings.orderCutoffMinute
    .toString()
    .padStart(2, "0");

  const cutoffText = `${cutoffDayNames[settings.orderCutoffDay]} at ${cutoffHour12}:${cutoffMinute} ${cutoffAmPm}`;



  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
          Checkout
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Checkout Details
        </h1>

        <form className="mt-8 space-y-6">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            
            <h2 className="text-2xl font-semibold">Order Method</h2>

            <p className="mt-2 text-sm text-neutral-600">
              Choose how you would like to receive this order.
            </p>

            <label className="mt-5 block text-sm font-medium">
              Order Type
            </label>

            <select
              value={details.orderType}
              onChange={(e) =>
                updateField(
                  "orderType",
                  e.target.value as CheckoutDetails["orderType"],
                )
              }
              className="mt-2 w-full rounded-xl border px-4 py-3"
            >
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
            </select>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Order Items</h2>

            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <div
                  key={item.cartId}
                  className="rounded-xl border bg-neutral-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.name}</p>

                      <p className="mt-1 text-sm text-neutral-600">
                        Quantity: {item.quantity}
                      </p>

                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <ul className="mt-3 space-y-1 text-sm text-neutral-600">
                          {item.selectedOptions.map((option, index) => (
                            <li
                              key={`${option.groupName}-${option.choiceName}-${index}`}
                              className="flex flex-wrap items-center gap-2"
                            >
                              <span>
                                <span className="font-medium">{option.groupName}:</span>{" "}
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
                          {item.requiresApproval && (
                            <li className="mt-3 rounded-xl border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900">
                              This item requires chef approval before the order is confirmed.
                            </li>
                          )}
                        </ul>
                        
                      )}

                      {item.customerInstructions && (
                        <p className="mt-3 text-sm text-neutral-600">
                          <span className="font-medium">Instructions:</span>{" "}
                          {item.customerInstructions}
                        </p>
                      )}
                    </div>
                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={() => router.push("/cart")}
                        className="rounded-xl border px-4 py-2 text-sm font-medium"
                      >
                        Edit Cart
                      </button>
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

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">
            {details.orderType === "delivery"
              ? "Contact & Delivery Information"
              : "Contact Information"}
          </h2>

          <p className="mt-2 text-sm text-neutral-600">
            {details.orderType === "delivery"
              ? "Delivery orders require contact and address information."
              : "Pickup orders only require enough information for order follow-up."}
          </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                value={details.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Name"
                className="rounded-xl border px-4 py-3"
              />

              <input
                value={details.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="Phone"
                className="rounded-xl border px-4 py-3"
              />
              {details.orderType === "delivery" && (
                <>
                <input
                  value={details.addressLine1}
                  onChange={(e) => updateField("addressLine1", e.target.value)}
                  placeholder="Address line 1"
                  className="rounded-xl border px-4 py-3 md:col-span-2"
                />

                <input
                  value={details.addressLine2}
                  onChange={(e) => updateField("addressLine2", e.target.value)}
                  placeholder="Address line 2"
                  className="rounded-xl border px-4 py-3 md:col-span-2"
                />

                <input
                  value={details.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="City"
                  className="rounded-xl border px-4 py-3"
                />

                <input
                  value={details.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  placeholder="State"
                  className="rounded-xl border px-4 py-3"
                />

                <input
                  value={details.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                  placeholder="ZIP / Postal code"
                  className="rounded-xl border px-4 py-3"
                />

                <textarea
                  value={details.deliveryNotes}
                  onChange={(e) => updateField("deliveryNotes", e.target.value)}
                  placeholder="Delivery notes, gate code, parking, drop-off instructions, etc."
                  rows={3}
                  className="rounded-xl border px-4 py-3 md:col-span-2"
                />
              </>
            )}

            <label className="flex items-center gap-2 text-sm md:col-span-2">              
            <input
              type="checkbox"
              checked={Boolean(details.saveContactInfo)}
              onChange={(e) =>
                updateField("saveContactInfo", e.target.checked)
              }
            />
            Save this contact and delivery information to my account
          </label>
          </div>
          </section>
        
          {details.orderType === "delivery" && settings.deliveryArea && (
            <p className="mt-2 text-xs text-neutral-500">
              Delivery area: {settings.deliveryArea}.
            </p>
          )}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Schedule</h2>

            <label className="mt-5 block text-sm font-medium">
              Requested Date / Time
            </label>

            <input
              type="datetime-local"
              value={details.requestedDateTime}
              onChange={(e) =>
                updateField("requestedDateTime", e.target.value)
              }
              className="mt-2 w-full rounded-xl border px-4 py-3"
            />

            <p className="mt-2 text-xs text-neutral-500">
              Orders placed after {cutoffText} may include a $
              {settings.lateFee.toFixed(2)} late-order fee.
              {settings.noWeekendOrdering
                ? " Weekend ordering is currently unavailable."
                : ""}
            </p>

            {lateFee > 0 && (
              <div className="mt-4 rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
                Orders placed after {cutoffText} include a $
                {settings.lateFee.toFixed(2)} late-order fee.
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Preferences</h2>
              <div className="mt-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium">
                    Allergy Notes
                  </label>

                  <textarea
                    rows={4}
                    value={details.allergyNotes}
                    onChange={(e) =>
                      updateField("allergyNotes", e.target.value)
                    }
                    className="mt-2 w-full rounded-xl border px-4 py-3"
                    placeholder="List allergies or dietary restrictions."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Substitution Preference
                  </label>

                  <textarea
                    rows={3}
                    value={details.substitutionPreference}
                    onChange={(e) =>
                      updateField(
                        "substitutionPreference",
                        e.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border px-4 py-3"
                    placeholder="If something is unavailable, what would you prefer?"
                  />
                </div>
              </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Payment</h2>
            <div className="mt-5 space-y-5">
              <div>
                <label className="block text-sm font-medium">
                  Tip
                </label>

                <select
                  value={details.tipType}
                  onChange={(e) =>
                    updateField(
                      "tipType",
                      e.target.value as CheckoutDetails["tipType"],
                    )
                  }
                  className="mt-2 w-full rounded-xl border px-4 py-3"
                >
                  <option value="none">No tip</option>
                  <option value="10">10%</option>
                  <option value="15">15%</option>
                  <option value="20">20%</option>
                  <option value="custom">Custom amount</option>
                </select>
              </div>

              {details.tipType === "custom" && (
                <div>
                  <label className="block text-sm font-medium">
                    Custom Tip Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={details.customTipAmount}
                    onChange={(e) =>
                      updateField(
                        "customTipAmount",
                        Number(e.target.value),
                      )
                    }
                    className="mt-2 w-full rounded-xl border px-4 py-3"
                  />
                </div>
              )}
                <div>
                <label className="block text-sm font-medium">Payment Method</label>
                <select
                  value={details.paymentMethod}
                  onChange={(e) =>
                    updateField(
                      "paymentMethod",
                      e.target.value as CheckoutDetails["paymentMethod"],
                    )
                  }
                  className="mt-2 w-full rounded-xl border px-4 py-3"
                >
                  <option value="manual">Pay Later / Manual Invoice</option>
                  <option value="cash">Cash / Offline Payment</option>
                  <option value="stripe" disabled>
                    Online Card Payment - Coming Soon
                  </option>
                </select>

                <p className="mt-2 text-xs text-neutral-500">
                  Online card payments will be added later. For now, orders can be submitted
                  with manual payment tracking.
                </p>
              </div>

              {details.paymentMethod === "manual" && (
                <div>
                  <label className="block text-sm font-medium">Pay By Date</label>

                  <input
                    type="date"
                    value={details.payByDate}
                    onChange={(e) => updateField("payByDate", e.target.value)}
                    className="mt-2 w-full rounded-xl border px-4 py-3"
                  />
                </div>
                )}
                {requiresApproval && (
                  <div className="rounded-xl border border-blue-300 bg-blue-50 p-4 text-sm text-blue-900">
                    One or more items in this order require chef approval. You will receive an
                    update once the order has been reviewed.
                  </div>
                )}
                </div>
          </section>
              
          <button
              type="button"
              disabled={submitting}
              onClick={async () => {
                if (submitting) return;

                setSubmitting(true);
                  try{

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
              }}
              className="w-full rounded-xl bg-black px-5 py-3 font-medium text-white"
            >
            {submitting ? "Submitting..." : "Submit Order"}
          </button>
        </form>

        <section className="mt-10 rounded-2xl border bg-neutral-50 p-6">
          <h2 className="text-2xl font-semibold">Order Review</h2>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Late Fee</span>
              <span>${lateFee.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Tip</span>
              <span>${tipAmount.toFixed(2)}</span>
            </div>

            <div className="border-t pt-3 text-lg font-bold">
              <div className="flex justify-between">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {requiresApproval && (
            <div className="mt-5 rounded-xl border border-blue-300 bg-blue-50 p-4 text-sm text-blue-900">
              This order includes one or more items that require chef approval before
              confirmation.
            </div>
          )}

          {details.orderType === "delivery" && (
            <div className="mt-5 rounded-xl border bg-white p-4 text-sm text-neutral-700">
              <p className="font-semibold">Delivery To</p>

              <p className="mt-2">
                {details.name || "Name not provided"}
              </p>

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
        </section>
      </div>
    </main>
  );
}
