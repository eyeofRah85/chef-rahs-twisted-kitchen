import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }
  
  const metrics = {
    pendingOrders: prisma.order.count({
      where: { status: "PENDING" },
    }),

    activeOrders: prisma.order.count({
      where: {
        status: {
          in: ["PENDING", "ACCEPTED", "PREPARING", "READY"],
        },
      },
    }),

    completedOrders: prisma.order.count({
      where: { status: "COMPLETED" },
    }),

    unpaidOrders: prisma.order.count({
      where: {
        status: {
          notIn: ["CANCELLED", "REFUNDED"],
        },
        paymentStatus: {
          in: ["PAY_BY_DATE", "OFFLINE_PAYMENT_DUE"],
        },
      },
    }),

    approvalOrders: prisma.order.count({
      where: {
        status: {
          notIn: ["CANCELLED", "REFUNDED"],
        },
        approvalStatus: "PENDING",
      },
    }),

    pendingCateringApprovals: prisma.cateringRequest.count({
      where: {
        approvalStatus: "PENDING",
      },
    }),

    recentOrders: prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    }),
  };

  const [
    pendingOrders,
    activeOrders,
    completedOrders,
    unpaidOrders,
    approvalOrders,
    pendingCateringApprovals,
    recentOrders,
  ] = await Promise.all([
    metrics.pendingOrders,
    metrics.activeOrders,
    metrics.completedOrders,
    metrics.unpaidOrders,
    metrics.approvalOrders,
    metrics.pendingCateringApprovals,
    metrics.recentOrders,
  ]);

  const totalRevenueResult = await prisma.order.aggregate({
    where: {
      status: {
        notIn: ["CANCELLED", "REFUNDED"],
      },
    },
    _sum: {
      total: true,
    },
  });

  const totalRevenue = Number(totalRevenueResult._sum.total ?? 0);

  const cards = [
    {
      label: "Pending Orders",
      value: pendingOrders,
      href: "/admin/orders",
    },
    {
      label: "Catering Approvals",
      value: pendingCateringApprovals,
      href: "/admin/catering?approval=PENDING",
    },
    {
      label: "Active Orders",
      value: activeOrders,
      href: "/admin/kitchen",
    },
    {
      label: "Completed Orders",
      value: completedOrders,
      href: "/admin/orders",
    },
    {
      label: "Payment Due",
      value: unpaidOrders,
      href: "/admin/orders",
    },
    {
      label: "Needs Approval",
      value: approvalOrders,
      href: "/admin/orders",
    },
    {
      label: "Revenue Snapshot",
      value: `$${totalRevenue.toFixed(2)}`,
      href: "/admin/reports",
    },
  ];

  const sections = [
    { label: "Orders", href: "/admin/orders" },
    { label: "Kitchen View", href: "/admin/kitchen" },
    { label: "Menu Manager", href: "/admin/menu" },
    { label: "Catering Requests", href: "/admin/catering" },
    { label: "Customers", href: "/admin/customers" },
    { label: "Reports", href: "/admin/reports" },
    { label: "Business Settings", href: "/admin/settings" },
    { label: "Payment Settings", href: "/admin/payments" },
    { label: "Notifications", href: "/admin/notifications" },
  ];

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Admin Dashboard
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Kitchen Control Center
          </h1>

          <p className="mt-3 max-w-2xl text-neutral-700">
            Monitor orders, payments, menu items, meal plans, and kitchen
            workflow from one place.
          </p>
        </div>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-sm font-medium text-neutral-500">
                {card.label}
              </p>

              <p className="mt-3 text-4xl font-bold">{card.value}</p>
            </Link>
          ))}
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Recent Orders</h2>

              <Link
                href="/admin/orders"
                className="text-sm font-medium underline"
              >
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="block rounded-xl border p-4 transition hover:bg-neutral-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{order.customerName}</p>

                      <p className="mt-1 text-sm text-neutral-600">
                        {order.orderType} · {order.items.length} item
                        {order.items.length === 1 ? "" : "s"}
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {order.createdAt.toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                        {order.status}
                      </span>

                      <p className="mt-2 font-bold">
                        ${Number(order.total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}

              {recentOrders.length === 0 && (
                <p className="text-neutral-500">No recent orders yet.</p>
              )}
            </div>
          </section>

          <aside className="space-y-8">
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Operational Alerts</h2>

              <div className="mt-5 space-y-3 text-sm">
                {unpaidOrders > 0 && (
                  <Link
                    href="/admin/orders"
                    className="block rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900"
                  >
                    {unpaidOrders} order{unpaidOrders === 1 ? "" : "s"} with
                    payment still due.
                  </Link>
                )}

                {approvalOrders > 0 && (
                  <Link
                    href="/admin/orders"
                    className="block rounded-xl border border-blue-300 bg-blue-50 p-4 text-blue-900"
                  >
                    {approvalOrders} order{approvalOrders === 1 ? "" : "s"} may
                    require chef approval.
                  </Link>
                )}

                {pendingOrders > 0 && (
                  <Link
                    href="/admin/orders"
                    className="block rounded-xl border bg-neutral-50 p-4"
                  >
                    {pendingOrders} pending order
                    {pendingOrders === 1 ? "" : "s"} waiting for review.
                  </Link>
                )}

                {pendingCateringApprovals > 0 && (
                  <Link
                    href="/admin/catering?approval=PENDING"
                    className="block rounded-xl border border-blue-300 bg-blue-50 p-4 text-blue-900"
                  >
                    {pendingCateringApprovals} catering request
                    {pendingCateringApprovals === 1 ? "" : "s"} waiting for approval.
                  </Link>
                )}

                {unpaidOrders === 0 &&
                  approvalOrders === 0 &&
                  pendingCateringApprovals === 0 &&
                  pendingOrders === 0 && (
                    <p className="rounded-xl bg-neutral-100 p-4 text-neutral-600">
                      No urgent alerts.
                    </p>
                  )}
              </div>
            </section>

            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Quick Links</h2>

              <div className="mt-5 grid gap-3">
                {sections.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-xl border px-4 py-3 text-sm font-medium transition hover:bg-neutral-50"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}