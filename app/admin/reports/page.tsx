import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import Link from "next/link";

export default async function AdminReportsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const now = new Date();

  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);

  const monthAgo = new Date();
  monthAgo.setMonth(now.getMonth() - 1);

  const metricQueries = {
    totalRevenueResult: prisma.order.aggregate({
      where: {
        status: {
          notIn: ["CANCELLED", "REFUNDED"],
        },
      },
      _sum: {
        total: true,
      },
    }),

    weeklyOrders: prisma.order.count({
      where: {
        createdAt: {
          gte: weekAgo,
        },
      },
    }),

    monthlyOrders: prisma.order.count({
      where: {
        createdAt: {
          gte: monthAgo,
        },
      },
    }),

    pendingPayments: prisma.order.count({
      where: {
        paymentStatus: {
          in: ["PAY_BY_DATE", "OFFLINE_PAYMENT_DUE"],
        },
      },
    }),

    cateringRequests: prisma.cateringRequest.count(),

    completedOrders: prisma.order.count({
      where: {
        status: "COMPLETED",
      },
    }),

    cancelledOrders: prisma.order.count({
      where: {
        status: "CANCELLED",
      },
    }),

    topItems: prisma.orderItem.groupBy({
      by: ["name"],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    }),

    pendingOrderApprovals: prisma.order.count({
      where: {
        approvalStatus: "PENDING",
      },
    }),

    pendingCateringApprovals: prisma.cateringRequest.count({
      where: {
        approvalStatus: "PENDING",
      },
    }),
  };

  const [
  totalRevenueResult,
  weeklyOrders,
  monthlyOrders,
  pendingPayments,
  cateringRequests,
  completedOrders,
  cancelledOrders,
  topItems,
  pendingOrderApprovals,
  pendingCateringApprovals,
] = await Promise.all([
  metricQueries.totalRevenueResult,
  metricQueries.weeklyOrders,
  metricQueries.monthlyOrders,
  metricQueries.pendingPayments,
  metricQueries.cateringRequests,
  metricQueries.completedOrders,
  metricQueries.cancelledOrders,
  metricQueries.topItems,
  metricQueries.pendingOrderApprovals,
  metricQueries.pendingCateringApprovals,
]);

  const totalRevenue = Number(totalRevenueResult._sum.total ?? 0);

  const averageOrderValue =
    monthlyOrders > 0
      ? totalRevenue / monthlyOrders
      : 0;

  const cards = [
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
    },
    {
      label: "Orders This Week",
      value: weeklyOrders,
    },
    {
      label: "Orders This Month",
      value: monthlyOrders,
    },
    {
      label: "Average Order Value",
      value: `$${averageOrderValue.toFixed(2)}`,
    },
    {
      label: "Pending Payments",
      value: pendingPayments,
    },
    {
      label: "Catering Requests",
      value: cateringRequests,
    },
    {
      label: "Order Approvals",
      value: pendingOrderApprovals,
    },
    {
      label: "Catering Approvals",
      value: pendingCateringApprovals,
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link className="text-sm font-medium underline" href="/admin">
            &larr;  Back to Dashboard
          </Link>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Reporting & Analytics
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Business Insights
          </h1>

          <p className="mt-3 max-w-2xl text-neutral-700">
            Monitor revenue, customer activity, kitchen operations,
            catering requests, and payment tracking.
          </p>
        </div>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-neutral-500">
                {card.label}
              </p>

              <p className="mt-3 text-4xl font-bold">
                {card.value}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px]">
          <section className="space-y-8">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">
                Order Status Breakdown
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-neutral-100 p-5">
                  <p className="text-sm text-neutral-500">
                    Completed Orders
                  </p>

                  <p className="mt-3 text-3xl font-bold">
                    {completedOrders}
                  </p>
                </div>

                <div className="rounded-xl bg-neutral-100 p-5">
                  <p className="text-sm text-neutral-500">
                    Cancelled Orders
                  </p>

                  <p className="mt-3 text-3xl font-bold">
                    {cancelledOrders}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">
                Most Ordered Items
              </h2>

              <div className="mt-6 space-y-3">
                {topItems.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-xl border p-4"
                  >
                    <div>
                      <p className="font-semibold">
                        #{index + 1} {item.name}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {item._sum.quantity ?? 0}
                      </p>

                      <p className="text-xs text-neutral-500">
                        ordered
                      </p>
                    </div>
                  </div>
                ))}

                {topItems.length === 0 && (
                  <p className="text-neutral-500">
                    No order data yet.
                  </p>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-8">
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">
                Operational Alerts
              </h2>

              <div className="mt-5 space-y-3 text-sm">
                {pendingPayments > 0 ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
                    {pendingPayments} payment
                    {pendingPayments === 1 ? "" : "s"} still pending.
                  </div>
                ) : (
                  <div className="rounded-xl bg-neutral-100 p-4 text-neutral-600">
                    No pending payments.
                  </div>
                )}

                {cateringRequests > 0 && (
                  <div className="rounded-xl border border-blue-300 bg-blue-50 p-4 text-blue-900">
                    {cateringRequests} catering request
                    {cateringRequests === 1 ? "" : "s"} submitted.
                  </div>
                )}

                {pendingOrderApprovals > 0 && (
                  <div className="rounded-xl border border-blue-300 bg-blue-50 p-4 text-blue-900">
                    {pendingOrderApprovals} order
                    {pendingOrderApprovals === 1 ? "" : "s"} waiting for approval.
                  </div>
                )}

                {pendingCateringApprovals > 0 && (
                  <div className="rounded-xl border border-blue-300 bg-blue-50 p-4 text-blue-900">
                    {pendingCateringApprovals} catering request
                    {pendingCateringApprovals === 1 ? "" : "s"} waiting for approval.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">
                Revenue Snapshot
              </h2>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-neutral-100 p-5">
                  <p className="text-sm text-neutral-500">
                    Gross Revenue
                  </p>

                  <p className="mt-3 text-3xl font-bold">
                    ${totalRevenue.toFixed(2)}
                  </p>
                </div>

                <div className="rounded-xl bg-neutral-100 p-5">
                  <p className="text-sm text-neutral-500">
                    Average Order
                  </p>

                  <p className="mt-3 text-3xl font-bold">
                    ${averageOrderValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}