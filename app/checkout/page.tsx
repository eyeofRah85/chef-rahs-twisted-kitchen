"use client";

import { useCheckoutStore } from "@/store/checkout-store";
import { useCartStore } from "@/store/cart-store";
import { calculateTip } from "@/lib/order-calculations";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  calculateDeliveryFee,
  calculateLateFee,
} from "@/lib/business-rules";
import {
  validateRequestedDate,
} from "@/lib/business-rules";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

export default function CheckoutPage() {

  const settings = useBusinessSettings();
  const details = useCheckoutStore((state) => state.details);
  const updateField = useCheckoutStore((state) => state.updateField);

  const router = useRouter();

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const resetCheckout = useCheckoutStore(
    (state) => state.resetCheckout,
  );

  const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) {
      return null;
    }

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const deliveryFee =
  details.orderType === "delivery" ? settings.deliveryFee : 0;

  const lateFee = calculateLateFee();

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
          <div>
            <label className="block text-sm font-medium">
              Order Type
            </label>

            <select
              value={details.orderType}
              onChange={(e) =>
                updateField("orderType", e.target.value as any)
              }
              className="mt-2 w-full rounded-xl border px-4 py-3"
            >
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
              <option value="catering">Catering</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">
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
              Sunday delivery orders are due by Thursday at 5:00 PM.
              Weekend ordering rules will be enforced later.
            </p>
          </div>

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

          <div>
            <label className="block text-sm font-medium">
              Tip
            </label>

            <select
              value={details.tipType}
              onChange={(e) =>
                updateField("tipType", e.target.value as any)
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
            {lateFee > 0 && (
              <div className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
                Orders placed after Thursday 5PM include a $10 late fee.
              </div>
            )}
            <div>
            <label className="block text-sm font-medium">Payment Method</label>
            <select
              value={details.paymentMethod}
              onChange={(e) =>
                updateField("paymentMethod", e.target.value as any)
              }
              className="mt-2 w-full rounded-xl border px-4 py-3"
            >
              <option value="manual">Pay Later / Manual Invoice</option>
              <option value="cash">Cash / Offline Payment</option>
              <option value="stripe" disabled>
                Online Card Payment — Coming Soon
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
              One or more items in this order require chef approval. Your order may need
              review before final confirmation.
            </div>
          )}
          <button
            type="button"
            onClick={async () => {
              if (!details.requestedDateTime) {
                alert("Please choose a requested date and time.");
                return;
              }

              const requestedDate = new Date(details.requestedDateTime);

              if (Number.isNaN(requestedDate.getTime())) {
                alert("Please choose a valid requested date and time.");
                return;
              }

              const validation = validateRequestedDate(requestedDate);

              if (!validation.valid) {
                alert(validation.error);
                return;
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
                alert("Failed to submit order.");
                return;
              }

              const order = await response.json();

              clearCart();
              resetCheckout();

              router.push(`/orders/${order.id}`);
            }}
            className="w-full rounded-xl bg-black px-5 py-3 font-medium text-white"
          >
            Submit Order
          </button>
        </form>

        <div className="mt-10 rounded-2xl bg-neutral-100 p-5">
          <h2 className="font-semibold">
            Debug Checkout State
          </h2>

          <pre className="mt-3 overflow-auto text-xs">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  );
}