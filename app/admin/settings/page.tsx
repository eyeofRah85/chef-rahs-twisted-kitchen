import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guards";

export default async function AdminSettingsPage() {
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

          <h1 className="mt-3 text-4xl font-bold">Business Settings</h1>

          <p className="mt-3 text-neutral-700">
            Manage order rules, delivery fees, late fees, catering deposits,
            and operating preferences.
          </p>
        </div>

        <div className="grid gap-6">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Ordering Rules</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-neutral-100 p-4">
                <p className="text-sm text-neutral-500">Order Cutoff</p>
                <p className="mt-2 font-semibold">Thursday at 5:00 PM</p>
              </div>

              <div className="rounded-xl bg-neutral-100 p-4">
                <p className="text-sm text-neutral-500">Late Fee</p>
                <p className="mt-2 font-semibold">$10.00</p>
              </div>

              <div className="rounded-xl bg-neutral-100 p-4">
                <p className="text-sm text-neutral-500">Delivery Fee</p>
                <p className="mt-2 font-semibold">$10.00</p>
              </div>

              <div className="rounded-xl bg-neutral-100 p-4">
                <p className="text-sm text-neutral-500">Catering Deposit</p>
                <p className="mt-2 font-semibold">50%</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Coming Soon</h2>

            <ul className="mt-5 list-inside list-disc space-y-2 text-neutral-700">
              <li>Edit delivery fee</li>
              <li>Edit late fee</li>
              <li>Set order cutoff day/time</li>
              <li>Set disabled ordering days</li>
              <li>Set delivery area notes</li>
              <li>Set catering deposit percentage</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}