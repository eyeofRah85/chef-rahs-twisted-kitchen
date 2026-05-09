"use client";

import { useCheckoutStore } from "@/store/checkout-store";

export default function CheckoutPage() {
  const details = useCheckoutStore((state) => state.details);
  const updateField = useCheckoutStore((state) => state.updateField);

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

          <button
            type="button"
            className="w-full rounded-xl bg-black px-5 py-3 font-medium text-white"
          >
            Continue to Payment
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