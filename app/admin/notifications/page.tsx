import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { getEmailDeliveryMode } from "@/lib/email";
import Link from "next/link";

export default async function AdminNotificationsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const emailDeliveryMode = getEmailDeliveryMode();
  const emailStatus =
    emailDeliveryMode === "live"
      ? "Live Sending"
      : emailDeliveryMode === "preview"
        ? "Preview Files"
        : emailDeliveryMode === "dry-run"
          ? "Dry Run"
          : "Disabled";
  const emailDescription =
    emailDeliveryMode === "live"
      ? "Customer notification emails are sent through the configured email provider."
      : emailDeliveryMode === "preview"
        ? "Customer notification emails are not sent; preview files are saved locally for QA."
        : emailDeliveryMode === "dry-run"
          ? "Customer notification emails are logged only because EMAIL_DRY_RUN is enabled."
          : "Customer notification emails are skipped because RESEND_API_KEY is not configured.";

  const [pendingOrders, unpaidOrders, serviceRequests] = await Promise.all([
    prisma.order.count({
      where: { status: "PENDING" },
    }),

    prisma.order.count({
      where: {
        paymentStatus: {
          in: ["PAY_BY_DATE", "OFFLINE_PAYMENT_DUE"],
        },
      },
    }),

    prisma.cateringRequest.count({
      where: {
        status: {
          in: ["NEW", "REVIEWING", "QUOTED", "DEPOSIT_DUE"],
        },
      },
    }),
  ]);

  const notificationGroups = [
    {
      title: "Order Confirmations",
      status: "Active",
      description:
        "Customers receive an email after an order is submitted.",
    },
    {
      title: "Order Approval Updates",
      status: "Active",
      description:
        "Customers receive an email when an approval-required order is approved or denied.",
    },
    {
      title: "Payment Received Notices",
      status: "Active",
      description:
        "Customers receive an email when manual/offline payment is marked as paid.",
    },
    {
      title: "Service Request Confirmations",
      status: "Active",
      description:
        "Customers receive an email after submitting a catering or personal chef request.",
    },
    {
      title: "Service Request Approval / Quote Updates",
      status: "Active",
      description:
        "Customers receive an email when service request approval or quote details are updated.",
    },
    {
      title: "Service Request Deposit Received",
      status: "Active",
      description:
        "Customers receive an email when a service request deposit is marked as paid.",
    },
    {
      title: "Kitchen Status Updates",
      status: "Planned",
      description:
        "Notify customers when an order is preparing, ready, or completed.",
    },
    {
      title: "Payment Reminders",
      status: "Planned",
      description:
        "Send reminders for manual invoices, offline payments, and pay-by-date orders.",
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link className="text-sm font-medium underline" href="/admin">
            &larr;  Back to Dashboard
          </Link>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Admin
          </p>

          <h1 className="mt-3 text-4xl font-bold">Notifications</h1>

          <p className="mt-3 text-neutral-700">
            Track notification needs for customer orders, payment reminders,
            kitchen status updates, and service request follow-ups.
          </p>
        </div>

        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-500">Pending Order Notices</p>
            <p className="mt-3 text-4xl font-bold">{pendingOrders}</p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-500">Payment Reminders</p>
            <p className="mt-3 text-4xl font-bold">{unpaidOrders}</p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-500">Service Request Follow-ups</p>
            <p className="mt-3 text-4xl font-bold">{serviceRequests}</p>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Notification Roadmap</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {notificationGroups.map((group) => (
              <div key={group.title} className="rounded-xl border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{group.title}</h3>
                    <p className="mt-2 text-sm text-neutral-600">
                      {group.description}
                    </p>
                  </div>

                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                    {group.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Email System</h2>

          <div className="mt-5 rounded-xl bg-neutral-100 p-5">
            <p className="text-sm text-neutral-500">Resend Configuration</p>

            <p className="mt-2 text-lg font-semibold">
              {emailStatus}
            </p>

            <p className="mt-2 text-sm text-neutral-600">
              {emailDescription}
            </p>
          </div>
        </section>
        
        <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Recommended Providers</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-neutral-100 p-5">
              <p className="font-semibold">Email</p>
              <p className="mt-2 text-sm text-neutral-600">
                Use Resend, SendGrid, or Postmark for order confirmations and
                payment reminders.
              </p>
            </div>

            <div className="rounded-xl bg-neutral-100 p-5">
              <p className="font-semibold">SMS</p>
              <p className="mt-2 text-sm text-neutral-600">
                Use Twilio later for delivery alerts, pickup reminders, and
                kitchen status updates.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
