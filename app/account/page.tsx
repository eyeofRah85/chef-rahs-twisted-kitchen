import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getMissingProfileFields } from "@/lib/profile-completeness";
import { AccountProfileModal } from "@/components/account/AccountProfileModal";
import type { DecimalLike } from "@/types/display";

type DashboardOrderItem = {
  id: string;
  name: string;
};

type DashboardOrder = {
  id: string;
  orderType: string;
  status: string;
  paymentStatus: string | null;
  requestedDateTime: Date | null;
  createdAt: Date;
  total: DecimalLike;
  items: DashboardOrderItem[];
};

type DashboardServiceRequest = {
  id: string;
};

export default async function AccountPage() {
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
        take: 3,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          items: true,
        },
      },
      cateringRequests: {
        take: 3,
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const orders = user.orders as DashboardOrder[];
  const cateringRequests =
    user.cateringRequests as DashboardServiceRequest[];

  const activeOrders = orders.filter((order) =>
    ["PENDING", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(
      order.status,
    ),
  );

  const unpaidOrders = orders.filter((order) =>
    ["PAY_BY_DATE", "OFFLINE_PAYMENT_DUE"].includes(order.paymentStatus ?? ""),
  );

  const missingProfileFields = getMissingProfileFields(user);

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Account Dashboard
          </p>

          {missingProfileFields.length > 0 && (
            <div className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
              <h2 className="text-xl font-semibold">Complete Your Account Information</h2>

              <p className="mt-2 text-sm leading-6">
                Add your {missingProfileFields.join(", ")} to make checkout, delivery,
                catering, and personal chef requests easier.
              </p>

              <div className="mt-4">
                <AccountProfileModal
                  label="Complete Account Information"
                  user={{
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    addressLine1: user.addressLine1,
                    addressLine2: user.addressLine2,
                    city: user.city,
                    state: user.state,
                    postalCode: user.postalCode,
                    deliveryNotes: user.deliveryNotes,
                  }}
                />
              </div>
              
            </div>
          )}
          
          <h1 className="mt-3 text-4xl font-bold">
            Welcome, {user.name ?? "Customer"}
          </h1>

          <AccountProfileModal
              user={{
                name: user.name,
                email: user.email,
                phone: user.phone,
                addressLine1: user.addressLine1,
                addressLine2: user.addressLine2,
                city: user.city,
                state: user.state,
                postalCode: user.postalCode,
                deliveryNotes: user.deliveryNotes,
              }}
            />

          <p className="mt-3 text-neutral-700">
            Track active orders, review payment status, and access your full
            order history.
          </p>
          
        </div>

        <section className="grid gap-5 md:grid-cols-3">
          <Link
            href="/account/orders"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-sm text-neutral-500">Recent Orders Shown</p>
            <p className="mt-3 text-4xl font-bold">{orders.length}</p>
          </Link>

          <Link
            href="/account/orders"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-sm text-neutral-500">Active Orders</p>
            <p className="mt-3 text-4xl font-bold">{activeOrders.length}</p>
          </Link>

          <Link
            href="/account/orders"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-sm text-neutral-500">Payments Due</p>
            <p className="mt-3 text-4xl font-bold">{unpaidOrders.length}</p>
          </Link>
          
          <Link
            href="/account/catering"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-sm text-neutral-500">Service Requests</p>
            <p className="mt-3 text-4xl font-bold">
              {cateringRequests.length}
            </p>
          </Link>
        </section>

        {unpaidOrders.length > 0 && (
          <section className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950 shadow-sm">
            <h2 className="text-2xl font-semibold">Payment Reminder</h2>

            <p className="mt-2">
              You have {unpaidOrders.length} order
              {unpaidOrders.length === 1 ? "" : "s"} with payment still due.
            </p>

            <Link
              href="/account/orders"
              className="mt-5 inline-flex rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
            >
              View Payment Details
            </Link>
          </section>
        )}

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <Link
            href="/account/orders"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="text-xl font-semibold">Full Order History</h2>
            <p className="mt-2 text-sm text-neutral-600">
              View all previous orders, payment status, and reorder meals.
            </p>
          </Link>

          <Link
            href="/menu"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="text-xl font-semibold">Browse Meal Plans</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Start a new order from the seasonal meal plans.
            </p>
          </Link>

          <Link
            href="/catering"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="text-xl font-semibold">Service Requests</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Track catering and personal chef inquiries, quotes, approvals, and deposits.
            </p>
          </Link>
        </section>

        <section className="mt-10 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Recent Activity</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Showing your latest 3 orders.
              </p>
            </div>

            <Link
              href="/account/orders"
              className="text-sm font-medium underline"
            >
              View Full Order History
            </Link>
          </div>

          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border p-4 transition hover:bg-neutral-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{order.orderType} Order</p>

                    <p className="mt-1 text-sm text-neutral-600">
                      {order.items.length} item
                      {order.items.length === 1 ? "" : "s"} ·{" "}
                      {order.createdAt.toLocaleDateString()}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      Requested:{" "}
                      {order.requestedDateTime
                        ? order.requestedDateTime.toLocaleString()
                        : "Not provided"}
                    </p>

                    {order.paymentStatus && (
                      <p className="mt-2 text-xs font-medium text-amber-700">
                        Payment: {order.paymentStatus}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                      {order.status}
                    </span>

                    <p className="mt-2 font-bold">
                      ${Number(order.total).toFixed(2)}
                    </p>

                    <Link
                      href={`/orders/${order.id}`}
                      className="mt-3 inline-flex rounded-xl border px-4 py-2 text-xs font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="rounded-xl bg-neutral-100 p-6 text-center">
                <p className="font-medium">No recent activity yet.</p>

                <Link
                  href="/menu"
                  className="mt-4 inline-flex rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
                >
                  View Menu
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
