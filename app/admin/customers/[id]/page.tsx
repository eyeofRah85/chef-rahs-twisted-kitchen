import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import {
  formatOrderStatus,
  formatOrderType,
  formatPaymentStatus,
  formatServiceRequestType,
  formatServiceRequestStatus,
} from "@/lib/format-labels";
import type { DecimalLike } from "@/types/display";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type CustomerOrderItem = {
  id: string;
  weeklyMealPlanSelection: {
    id: string;
  } | null;
};

type CustomerOrder = {
  id: string;
  orderType: string;
  status: string;
  paymentStatus: string | null;
  requestedDateTime: Date | null;
  createdAt: Date;
  total: DecimalLike;
  items: CustomerOrderItem[];
};

type CustomerServiceRequest = {
  id: string;
  requestType: string;
  eventType: string | null;
  guestCount: number | null;
  eventDate: Date | null;
  status: string;
};

export default async function AdminCustomerDetailsPage({ params }: PageProps) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          items: {
            select: {
              id: true,
              weeklyMealPlanSelection: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
      cateringRequests: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const orders = customer.orders as CustomerOrder[];
  const cateringRequests =
    customer.cateringRequests as CustomerServiceRequest[];

  const totalSpent = orders
    .filter((order) => order.status !== "CANCELLED" && order.status !== "REFUNDED")
    .reduce((sum, order) => sum + Number(order.total), 0);

  const activeOrders = orders.filter((order) =>
    ["PENDING", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(
      order.status,
    ),
  );

  const unpaidOrders = orders.filter((order) =>
    ["PAY_BY_DATE", "OFFLINE_PAYMENT_DUE"].includes(order.paymentStatus ?? ""),
  );

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            href="/admin/customers"
            className="text-sm font-medium underline"
          >
            &larr; Back to Customers
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Customer Profile
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            {customer.name ?? "Customer"}
          </h1>

          <p className="mt-3 text-neutral-700">{customer.email}</p>
        </div>

        <section className="grid gap-5 md:grid-cols-4">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-500">Total Orders</p>
            <p className="mt-3 text-4xl font-bold">{orders.length}</p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-500">Active Orders</p>
            <p className="mt-3 text-4xl font-bold">{activeOrders.length}</p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-500">Payments Due</p>
            <p className="mt-3 text-4xl font-bold">{unpaidOrders.length}</p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-500">Total Spent</p>
            <p className="mt-3 text-4xl font-bold">${totalSpent.toFixed(2)}</p>
          </div>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="space-y-8">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Orders</h2>

              <div className="mt-5 space-y-4">
                {orders.map((order) => {
                  const weeklyItemCount = order.items.filter(
                    (item) => item.weeklyMealPlanSelection,
                  ).length;

                  return (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="block rounded-xl border p-4 transition hover:bg-neutral-50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">
                            {formatOrderType(order.orderType)} Order
                          </p>

                          <p className="mt-1 text-sm text-neutral-600">
                            {order.items.length} item
                            {order.items.length === 1 ? "" : "s"} -{" "}
                            {order.createdAt.toLocaleDateString()}
                          </p>

                          {weeklyItemCount > 0 && (
                            <p className="mt-1 text-xs font-medium text-emerald-700">
                              {weeklyItemCount} weekly meal plan
                              {weeklyItemCount === 1 ? "" : "s"}
                            </p>
                          )}

                          <p className="mt-1 text-xs text-neutral-500">
                            Requested:{" "}
                            {order.requestedDateTime
                              ? order.requestedDateTime.toLocaleString()
                              : "Not provided"}
                          </p>

                          {order.paymentStatus && (
                            <p className="mt-2 text-xs font-medium text-amber-700">
                              Payment: {formatPaymentStatus(order.paymentStatus)}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                            {formatOrderStatus(order.status)}
                          </span>

                          <p className="mt-2 font-bold">
                            ${Number(order.total).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {orders.length === 0 && (
                  <p className="text-neutral-500">No orders yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Service Requests</h2>

              <div className="mt-5 space-y-4">
                {cateringRequests.map((request) => {
                  const requestTypeLabel = formatServiceRequestType(
                    request.requestType,
                  );

                  return (
                    <Link
                      key={request.id}
                      href={`/admin/catering/${request.id}`}
                      className="block rounded-xl border p-4 transition hover:bg-neutral-50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">
                            {request.eventType ?? `${requestTypeLabel} Request`}
                          </p>

                          <p className="mt-1 text-sm text-neutral-600">
                            Type: {requestTypeLabel}
                          </p>

                          <p className="mt-1 text-sm text-neutral-600">
                            Guests: {request.guestCount ?? "Not provided"}
                          </p>

                          <p className="mt-1 text-xs text-neutral-500">
                            Event:{" "}
                            {request.eventDate
                              ? request.eventDate.toLocaleString()
                              : "Date not provided"}
                          </p>
                        </div>

                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                          {formatServiceRequestStatus(request.status)}
                        </span>
                      </div>
                    </Link>
                  );
                })}

                {cateringRequests.length === 0 && (
                  <p className="text-neutral-500">No service requests yet.</p>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Customer Info</h2>

              <div className="mt-5 space-y-3 text-sm">
                <p>
                  <strong>Name:</strong> {customer.name ?? "Not provided"}
                </p>

                <p>
                  <strong>Email:</strong> {customer.email}
                </p>

                <p>
                  <strong>Role:</strong> {customer.role}
                </p>

                <p>
                  <strong>Joined:</strong>{" "}
                  {customer.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>

            {unpaidOrders.length > 0 && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950 shadow-sm">
                <h2 className="text-2xl font-semibold">Payment Alert</h2>

                <p className="mt-3 text-sm">
                  This customer has {unpaidOrders.length} order
                  {unpaidOrders.length === 1 ? "" : "s"} with payment still due.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
