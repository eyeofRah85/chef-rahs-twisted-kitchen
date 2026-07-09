"use client";

import { useCheckoutStore } from "@/store/checkout-store";
import { useCartStore } from "@/store/cart-store";
import { calculateTip } from "@/lib/order-calculations";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  calculateLateFeeFromSettings,
  validateRequestedDateTime,
} from "@/lib/business-rules";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import type { CheckoutDetails } from "@/types/order";
import { useCustomerAllergens } from "@/hooks/useCustomerAllergens";
import { AllergenConflictWarning } from "@/components/allergens/AllergenConflictWarning";

const sectionClass =
  "rounded-lg border border-[#ead8c1] bg-white/95 p-5 shadow-[0_18px_45px_rgba(76,36,18,0.08)] sm:p-6";
const inputClass =
  "w-full rounded-lg border border-[#d7bea1] bg-white px-4 py-3 text-sm text-[#24130f] outline-none transition placeholder:text-[#9c897d] focus:border-[#9f2f18] focus:ring-2 focus:ring-[#f4c46f]/40";
const labelClass = "block text-sm font-bold text-[#24130f]";

const orderTypeOptions: {
  value: CheckoutDetails["orderType"];
  label: string;
}[] = [
  { value: "delivery", label: "Delivery" },
  { value: "pickup", label: "Pickup" },
];

const orderTimeOptions = Array.from({ length: 25 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const value = `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const period = hour >= 12 ? "PM" : "AM";

  return {
    value,
    label: `${hour12}:${minute.toString().padStart(2, "0")} ${period}`,
  };
});

function splitRequestedDateTime(value: string) {
  const [date = "", time = ""] = value.split("T");

  return {
    date,
    time: time.slice(0, 5),
  };
}

function combineRequestedDateTime(date: string, time: string) {
  if (date && time) return `${date}T${time}`;
  if (date) return `${date}T`;
  if (time) return `T${time}`;

  return "";
}

function hasRequestedDateAndTime(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
}

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
  const { selectedAllergenIdSet } = useCustomerAllergens();

  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const checkoutAllergenConflicts = items.flatMap((item) =>
    (item.allergens ?? []).filter((allergen) =>
      selectedAllergenIdSet.has(allergen.id),
    ),
  );

  const uniqueCheckoutAllergenConflicts = Array.from(
    new Map(
      checkoutAllergenConflicts.map((allergen) => [allergen.id, allergen]),
    ).values(),
  );

  const requiresAllergenAcknowledgement =
    uniqueCheckoutAllergenConflicts.length > 0 && !details.allergenAcknowledged;

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

  useEffect(() => {
    if (
      uniqueCheckoutAllergenConflicts.length === 0 &&
      details.allergenAcknowledged
    ) {
      updateField("allergenAcknowledged", false);
    }
  }, [
    details.allergenAcknowledged,
    uniqueCheckoutAllergenConflicts.length,
    updateField,
  ]);

  if (!mounted) {
    return null;
  }
  const hasCartItems = items.length > 0;
  if (!hasCartItems) {
    return (
      <main className="brand-page px-4 py-10 text-[#24130f] sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className={sectionClass}>
            <p className="brand-eyebrow">Checkout</p>

            <h1 className="mt-3 text-4xl font-black">Your Cart Is Empty</h1>

            <p className="mt-4 text-[#6b5a50]">
              Add meal plans or a la carte items before starting checkout.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/menu"
                className="brand-button-primary px-5 py-3 text-sm"
              >
                View Meal Plans
              </Link>

              <Link
                href="/cart"
                className="brand-button-secondary px-5 py-3 text-sm"
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

  const requestedDateTimeValidation = validateRequestedDateTime(
    details.requestedDateTime,
    {
      noWeekendOrdering: settings.noWeekendOrdering,
    },
  );

  const lateFee = requestedDateTimeValidation.valid
    ? calculateLateFeeFromSettings({
        lateFee: settings.lateFee,
        cutoffDay: settings.orderCutoffDay,
        cutoffHour: settings.orderCutoffHour,
        cutoffMinute: settings.orderCutoffMinute,
        requestedDateTime: details.requestedDateTime,
      })
    : 0;

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
  const cutoffMinute = settings.orderCutoffMinute.toString().padStart(2, "0");
  const cutoffText = `${cutoffDayNames[settings.orderCutoffDay]} at ${cutoffHour12}:${cutoffMinute} ${cutoffAmPm}`;
  const requestedSchedule = splitRequestedDateTime(details.requestedDateTime);

  async function submitOrder() {
    if (submitting) return;

    setSubmitting(true);

    try {
      if (items.length === 0) {
        alert("Your cart is empty.");
        return;
      }

      if (
        uniqueCheckoutAllergenConflicts.length > 0 &&
        !details.allergenAcknowledged
      ) {
        alert(
          "Please acknowledge the allergen warning before submitting your order.",
        );
        return;
      }

      if (!hasRequestedDateAndTime(details.requestedDateTime)) {
        alert("Please choose a requested date and time.");
        return;
      }

      const requestedDate = new Date(details.requestedDateTime);

      if (Number.isNaN(requestedDate.getTime())) {
        alert("Please choose a valid requested date and time.");
        return;
      }

      if (!requestedDateTimeValidation.valid) {
        alert(requestedDateTimeValidation.error);
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
    <main className="brand-page px-4 py-10 text-[#24130f] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="brand-eyebrow">Checkout</p>

            <h1 className="mt-3 text-5xl font-black">Checkout Details</h1>
            <p className="mt-3 max-w-2xl leading-7 text-[#6b5a50]">
              Confirm your method, contact details, schedule, preferences, and
              payment instructions before submitting.
            </p>
          </div>
        </div>

        <form
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
          onSubmit={(event) => {
            event.preventDefault();
            void submitOrder();
          }}
        >
          <div className="space-y-5">
            <section className={sectionClass}>
              <h2 className="text-2xl font-black">Order Method</h2>

              <div className="mt-5 grid grid-cols-2 rounded-lg border border-[#ead8c1] bg-[#fff8ee] p-1">
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
                          ? "rounded-md bg-[#24130f] px-4 py-3 text-sm font-bold text-white shadow-sm"
                          : "rounded-md px-4 py-3 text-sm font-bold text-[#6b5a50] transition hover:bg-white"
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
                <h2 className="text-2xl font-black">Order Items</h2>

                <button
                  type="button"
                  onClick={() => router.push("/cart")}
                  className="brand-button-secondary px-4 py-2 text-sm"
                >
                  Edit Cart
                </button>
              </div>

              <div className="mt-5 divide-y divide-[#ead8c1]">
                {uniqueCheckoutAllergenConflicts.length > 0 && (
                  <div className="mb-5">
                    <AllergenConflictWarning
                      conflicts={uniqueCheckoutAllergenConflicts}
                    />
                  </div>
                )}

                {items.map((item) => (
                  <div key={item.cartId} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-black">{item.name}</p>

                        <p className="mt-1 text-sm text-[#6b5a50]">
                          Quantity: {item.quantity}
                        </p>

                        {(item.allergens ?? []).filter((allergen) =>
                          selectedAllergenIdSet.has(allergen.id),
                        ).length > 0 && (
                          <div className="mt-3">
                            <AllergenConflictWarning
                              conflicts={(item.allergens ?? []).filter(
                                (allergen) =>
                                  selectedAllergenIdSet.has(allergen.id),
                              )}
                              compact
                            />
                          </div>
                        )}

                        {item.selectedOptions &&
                          item.selectedOptions.length > 0 && (
                            <ul className="mt-3 space-y-1 text-sm text-[#6b5a50]">
                              {item.selectedOptions.map((option, index) => (
                                <li
                                  key={`${option.groupName}-${option.choiceName}-${index}`}
                                  className="flex flex-wrap items-center gap-2"
                                >
                                  <span>
                                    <span className="font-bold">
                                      {option.groupName}:
                                    </span>{" "}
                                    {option.choiceName}
                                    {option.priceDelta > 0
                                      ? ` (+$${option.priceDelta.toFixed(2)})`
                                      : ""}
                                  </span>

                                  {option.requestOnly && (
                                    <span className="rounded-full bg-[#fff0bd] px-2 py-0.5 text-xs font-bold text-[#8a5a00]">
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
                          <p className="mt-3 text-sm text-[#6b5a50]">
                            <span className="font-bold">Instructions:</span>{" "}
                            {item.customerInstructions}
                          </p>
                        )}
                      </div>

                      <p className="font-black">
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
              <h2 className="text-2xl font-black">
                {details.orderType === "delivery"
                  ? "Contact / Delivery Info"
                  : "Contact Info"}
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#6b5a50]">
                Prefilled from your account profile when available. Check the
                box below to save changes back to your profile after ordering.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className={labelClass}>
                  Name
                  <input
                    value={details.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
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

                <label className="flex items-center gap-3 text-sm font-medium text-[#3b241b] md:col-span-2">
                  <input
                    type="checkbox"
                    checked={Boolean(details.saveContactInfo)}
                    onChange={(event) =>
                      updateField("saveContactInfo", event.target.checked)
                    }
                    className="h-4 w-4 accent-[#9f2f18]"
                  />
                  Save this contact and delivery information to my account
                </label>
              </div>

              {details.orderType === "delivery" && settings.deliveryArea && (
                <p className="mt-4 text-xs font-medium text-[#6b5a50]">
                  Delivery area: {settings.deliveryArea}.
                </p>
              )}
            </section>

            <section className={sectionClass}>
              <h2 className="text-2xl font-black">Schedule</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className={labelClass}>
                  Requested Date
                  <input
                    type="date"
                    value={requestedSchedule.date}
                    onChange={(event) =>
                      updateField(
                        "requestedDateTime",
                        combineRequestedDateTime(
                          event.target.value,
                          requestedSchedule.time,
                        ),
                      )
                    }
                    className={`${inputClass} mt-2`}
                  />
                </label>

                <label className={labelClass}>
                  Requested Time
                  <select
                    value={requestedSchedule.time}
                    onChange={(event) =>
                      updateField(
                        "requestedDateTime",
                        combineRequestedDateTime(
                          requestedSchedule.date,
                          event.target.value,
                        ),
                      )
                    }
                    className={`${inputClass} mt-2`}
                  >
                    <option value="">Select a time</option>
                    {orderTimeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="mt-3 text-xs leading-5 text-[#6b5a50]">
                Orders placed after {cutoffText} may include a $
                {settings.lateFee.toFixed(2)} late-order fee.
                {settings.noWeekendOrdering
                  ? " Weekend ordering is currently unavailable."
                  : ""}
              </p>

              {lateFee > 0 && (
                <div className="mt-4 rounded-lg border border-[#d99426] bg-[#fff3cf] p-4 text-sm font-medium text-[#6f1f12]">
                  Orders placed after {cutoffText} include a $
                  {settings.lateFee.toFixed(2)} late-order fee.
                </div>
              )}
            </section>

            <section className={sectionClass}>
              <h2 className="text-2xl font-black">Preferences</h2>

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
              <h2 className="text-2xl font-black">Payment</h2>

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
                        updateField(
                          "customTipAmount",
                          Number(event.target.value),
                        )
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

                <p className="rounded-lg bg-[#fff8ee] p-3 text-xs leading-5 text-[#6b5a50]">
                  {details.paymentMethod === "cash"
                    ? "Cash or offline payment will be confirmed after review. Online card payments remain disabled until a future Square/PayPal checkout integration is available."
                    : "Manual invoice orders can be submitted now. The business will confirm payment instructions after review."}
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

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <section className={sectionClass}>
              <p className="brand-eyebrow">Final Step</p>
              <h2 className="mt-2 text-3xl font-black">Review</h2>

              <div className="mt-5 space-y-3 text-sm text-[#6b5a50]">
                <div className="flex justify-between gap-4">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#24130f]">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-[#24130f]">
                    ${deliveryFee.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span>Late Fee</span>
                  <span className="font-bold text-[#24130f]">
                    ${lateFee.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span>Tip</span>
                  <span className="font-bold text-[#24130f]">
                    ${tipAmount.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-[#ead8c1] pt-3 text-lg font-black text-[#24130f]">
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
                <div className="mt-5 border-t border-[#ead8c1] pt-5 text-sm text-[#6b5a50]">
                  <p className="font-black text-[#24130f]">Delivery To</p>

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
                    <p className="mt-2 text-[#6b5a50]">
                      Notes: {details.deliveryNotes}
                    </p>
                  )}
                </div>
              )}

              {uniqueCheckoutAllergenConflicts.length > 0 && (
                <div className="mt-5 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-950">
                  <p className="font-black">
                    Allergen acknowledgement required
                  </p>

                  <p className="mt-2 leading-6">
                    This order contains allergen tags that match your account
                    preferences. Please review the warning before submitting.
                  </p>

                  <label className="mt-4 flex items-start gap-3 text-sm font-bold">
                    <input
                      type="checkbox"
                      checked={Boolean(details.allergenAcknowledged)}
                      onChange={(event) =>
                        updateField(
                          "allergenAcknowledged",
                          event.target.checked,
                        )
                      }
                      className="mt-1 h-4 w-4 accent-red-700"
                    />

                    <span>
                      I understand this order contains allergen tags that match
                      my account preferences, and I have reviewed the warning
                      before submitting.
                    </span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  submitting || !hasCartItems || requiresAllergenAcknowledgement
                }
                className="brand-button-primary mt-6 w-full px-5 py-3 disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:text-neutral-700 disabled:shadow-none"
              >
                {submitting
                  ? "Submitting..."
                  : !hasCartItems
                    ? "Cart Is Empty"
                    : requiresAllergenAcknowledgement
                      ? "Acknowledge Allergen Warning"
                      : "Submit Order"}
              </button>
            </section>
          </aside>
        </form>
      </div>
    </main>
  );
}
