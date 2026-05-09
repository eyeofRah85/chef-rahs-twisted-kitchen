import { requireAdmin } from "@/lib/auth-guards";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Admin Dashboard
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Kitchen Control Center
          </h1>

          <p className="mt-3 max-w-2xl text-neutral-700">
            Manage orders, menu items, reports,
            catering requests, notifications,
            and seasonal offerings.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Orders", href: "/admin/orders" },
            { label: "Menu Manager", href: "/admin/menu" },
            { label: "Seasonal Items", href: "/admin/menu" },
            { label: "Catering Requests", href: "/admin/catering" },
            { label: "Customers", href: "/admin/customers" },
            { label: "Reports", href: "/admin/reports" },
            { label: "Business Settings", href: "/admin/settings" },
            { label: "Payment Settings", href: "/admin/payments" },
            { label: "Notifications", href: "/admin/notifications" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold">{item.label}</h2>
              <p className="mt-2 text-sm text-neutral-600">Open section.</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}