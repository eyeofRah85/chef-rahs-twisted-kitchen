import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guards";

export default async function AdminNotificationsPage() {
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

          <h1 className="mt-3 text-4xl font-bold">Notifications</h1>

          <p className="mt-3 text-neutral-700">
            Manage customer notifications, kitchen alerts, catering follow-ups,
            and future automated messaging.
          </p>
        </div>

        <div className="grid gap-6">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Current Notification Flow</h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl border bg-neutral-50 p-5">
                <p className="font-semibold">Order Workflow Notifications</p>

                <p className="mt-2 text-sm text-neutral-600">
                  Order statuses are tracked internally through the admin and
                  kitchen dashboards.
                </p>
              </div>

              <div className="rounded-xl border bg-neutral-50 p-5">
                <p className="font-semibold">Payment Tracking</p>

                <p className="mt-2 text-sm text-neutral-600">
                  Manual invoice and offline payment states are visible through
                  account dashboards and admin tools.
                </p>
              </div>

              <div className="rounded-xl border bg-neutral-50 p-5">
                <p className="font-semibold">Catering Requests</p>

                <p className="mt-2 text-sm text-neutral-600">
                  Catering requests are routed into the admin review workflow.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Planned Notification Features</h2>

            <ul className="mt-5 list-inside list-disc space-y-2 text-neutral-700">
              <li>Email order confirmations</li>
              <li>Kitchen status notifications</li>
              <li>Payment reminders</li>
              <li>Catering quote notifications</li>
              <li>SMS delivery alerts</li>
              <li>Admin operational alerts</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}