export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
          Checkout
        </p>

        <h1 className="mt-3 text-4xl font-bold">Checkout Details</h1>

        <form className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium">Order Type</label>
            <select className="mt-2 w-full rounded-xl border px-4 py-3">
              <option>Delivery</option>
              <option>Pickup</option>
              <option>Catering</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Requested Date / Time
            </label>
            <input
              type="datetime-local"
              className="mt-2 w-full rounded-xl border px-4 py-3"
            />
            <p className="mt-2 text-xs text-neutral-500">
              Sunday delivery orders are due by Thursday at 5:00 PM. Weekend
              ordering rules will be enforced in the order logic.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">Allergy Notes</label>
            <textarea
              rows={4}
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
              className="mt-2 w-full rounded-xl border px-4 py-3"
              placeholder="If something is unavailable, what would you prefer?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Tip</label>
            <select className="mt-2 w-full rounded-xl border px-4 py-3">
              <option>No tip</option>
              <option>10%</option>
              <option>15%</option>
              <option>20%</option>
              <option>Custom amount</option>
            </select>
          </div>

          <button
            type="button"
            className="w-full rounded-xl bg-black px-5 py-3 font-medium text-white"
          >
            Continue to Payment
          </button>
        </form>
      </div>
    </main>
  );
}