import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ReorderButton } from "@/components/account/ReorderButton";

function isPaymentDue(paymentStatus: string | null | undefined) {
    return paymentStatus === "PAY_BY_DATE" || paymentStatus === "OFFLINE_PAYMENT_DUE";
}

export default async function AccountOrdersPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      orders: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          items: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Account
          </p>

          <h1 className="mt-3 text-4xl font-bold">Order History</h1>

          <p className="mt-3 text-neutral-700">
            Review your previous orders, payment status, and requested delivery
            or pickup times.
          </p>
        </div>

        <div className="space-y-5">
          {user.orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
                    {order.orderType}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    Order from {order.createdAt.toLocaleDateString()}
                  </h2>

                  <p className="mt-2 text-sm text-neutral-600">
                    Requested:{" "}
                    {order.requestedDateTime
                      ? order.requestedDateTime.toLocaleString()
                      : "Not provided"}
                  </p>

                  <p className="mt-1 text-sm text-neutral-600">
                    Payment: {order.paymentStatus ?? "Not set"}
                  </p>
                </div>
                {order.payByDate && (
                    <p className="mt-1 text-sm text-amber-700">
                        Pay by: {order.payByDate.toLocaleDateString()}
                    </p>
                    )}

                <div className="text-left md:text-right">
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                    {order.status}
                  </span>
                  <p className="mt-2 text-xs text-neutral-500">
                    Approval: {order.approvalStatus}
                  </p>
                  <p className="mt-3 text-2xl font-bold">
                    ${Number(order.total).toFixed(2)}
                  </p>

                <div className="mt-3 flex flex-wrap gap-2 md:justify-end">
                    <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex rounded-xl bg-black px-5 py-2 text-sm font-medium text-white"
                    >
                        View Details
                    </Link>
                    {order.approvalStatus === "PENDING" && (
                      <div className="mt-4 rounded-xl border border-blue-300 bg-blue-50 p-4 text-sm text-blue-900">
                        Waiting for chef approval before this order is confirmed.
                      </div>
                    )}

                    {order.approvalStatus === "DENIED" && (
                      <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
                        This order was not approved.
                        {order.approvalNote ? ` Note: ${order.approvalNote}` : ""}
                      </div>
                    )}
                    {isPaymentDue(order.paymentStatus) && (
                        <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex rounded-xl border border-amber-400 bg-amber-50 px-5 py-2 text-sm font-medium text-amber-900"
                        >
                        Payment Instructions
                        </Link>
                    )}
                </div>
                  <ReorderButton
                    items={order.items.map((item) => ({
                        menuItemId: item.menuItemId,
                        name: item.name,
                        quantity: item.quantity,
                        unitPrice: Number(item.unitPrice),
                        notes: item.notes,
                    }))}
                    />
                </div>
              </div>

              <div className="mt-5 border-t pt-5">
                <h3 className="font-semibold">Items</h3>

                <div className="mt-3 space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between rounded-xl bg-neutral-50 p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {item.quantity}× {item.name}
                        </p>

                        {item.notes && (
                          <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-600">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      <p className="font-medium">
                        ${Number(item.lineTotal).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {user.orders.length === 0 && (
            <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-semibold">No orders yet</h2>

              <p className="mt-2 text-neutral-600">
                Your order history will appear here after you submit an order.
              </p>

              <Link
                href="/menu"
                className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 font-medium text-white"
              >
                View Menu
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}