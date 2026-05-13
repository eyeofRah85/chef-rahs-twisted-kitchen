import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guards";

export default async function AdminPaymentsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Admin
          </p>

          <h1 className="mt-3 text-4xl font-bold">Payment Management</h1>

          <p className="mt-3 text-neutral-700">
            Monitor manual invoices, offline payments, deposits, and future
            online payment integrations.
          </p>
        </div>

        <div className="grid gap-6">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Current Payment Methods</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-neutral-50 p-5">
                <p className="text-sm text-neutral-500">Manual Invoice</p>

                <p className="mt-3 text-lg font-semibold">Enabled</p>

                <p className="mt-2 text-sm text-neutral-600">
                  Customers can submit orders and pay by a specified date.
                </p>
              </div>

              <div className="rounded-xl border bg-neutral-50 p-5">
                <p className="text-sm text-neutral-500">Offline / Cash Payment</p>

                <p className="mt-3 text-lg font-semibold">Enabled</p>

                <p className="mt-2 text-sm text-neutral-600">
                  Offline payments can be tracked manually through the order
                  workflow.
                </p>
              </div>

              <div className="rounded-xl border bg-neutral-50 p-5 opacity-70">
                <p className="text-sm text-neutral-500">Stripe Integration</p>

                <p className="mt-3 text-lg font-semibold">Coming Soon</p>

                <p className="mt-2 text-sm text-neutral-600">
                  Online card payments and automated payment capture.
                </p>
              </div>

              <div className="rounded-xl border bg-neutral-50 p-5 opacity-70">
                <p className="text-sm text-neutral-500">Deposit Automation</p>

                <p className="mt-3 text-lg font-semibold">Coming Soon</p>

                <p className="mt-2 text-sm text-neutral-600">
                  Catering deposit invoices and automated reminders.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Planned Features</h2>

            <ul className="mt-5 list-inside list-disc space-y-2 text-neutral-700">
              <li>Stripe Checkout Sessions</li>
              <li>Deposit invoice generation</li>
              <li>Payment reminder emails</li>
              <li>Partial payments</li>
              <li>Refund tracking</li>
              <li>Automatic payment reconciliation</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}