import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import type { DecimalLike } from "@/types/display";

type PageProps = {
  searchParams: Promise<{
    filter?: string;
    q?: string;
  }>;
};

type CustomerListOrder = {
  id: string;
  status: string;
  paymentStatus: string | null;
  total: DecimalLike;
  createdAt: Date;
  items: {
    id: string;
    weeklyMealPlanSelection: {
      id: string;
    } | null;
  }[];
};

type CustomerListRow = {
  id: string;
  name: string | null;
  email: string;
  orders: CustomerListOrder[];
};

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const params = await searchParams;
  const filter = params.filter;
  const query = params.q?.trim().toLowerCase() ?? ""; 
  const customers = (await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      orders: {
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
    },
  })) as CustomerListRow[];

  const customerRows = customers.map((customer) => {
    const totalSpent = customer.orders
      .filter((order) => order.status !== "CANCELLED" && order.status !== "REFUNDED")
      .reduce((sum, order) => sum + Number(order.total), 0);

      
    const paymentDueCount = customer.orders.filter((order) =>
      ["PAY_BY_DATE", "OFFLINE_PAYMENT_DUE"].includes(order.paymentStatus ?? ""),
    ).length;

    const weeklyMealPlanItemCount = customer.orders.reduce(
      (count, order) =>
        count +
        order.items.filter((item) => item.weeklyMealPlanSelection).length,
      0,
    );

    const lastOrder = customer.orders.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];

    return {
      id: customer.id,
      name: customer.name ?? "Customer",
      email: customer.email,
      orderCount: customer.orders.length,
      totalSpent,
      paymentDueCount,
      weeklyMealPlanItemCount,
      lastOrderDate: lastOrder?.createdAt ?? null,
    };
  });
  const filteredCustomerRows = customerRows.filter((customer) => {
    const matchesFilter =
      filter === "HAS_ORDERS"
        ? customer.orderCount > 0
        : filter === "PAYMENT_DUE"
          ? customer.paymentDueCount > 0
          : true;

    const matchesSearch =
      !query ||
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

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

          <h1 className="mt-3 text-4xl font-bold">Customers</h1>

          <p className="mt-3 text-neutral-700">
            Review customer accounts, order activity, and payment status.
          </p>
        </div>

        <form className="mb-4 flex gap-3" action="/admin/customers">
          {filter && <input type="hidden" name="filter" value={filter} />}

          <input
            name="q"
            defaultValue={query}
            placeholder="Search by name or email"
            className="w-full rounded-xl border px-4 py-3 text-sm"
          />

          <button className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white">
            Search
          </button>
        </form>

        <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
          <p className="mb-4 font-semibold">Filters</p>

          <div className="flex flex-wrap gap-3">
            {[
              { label: "All", href: "/admin/customers" },
              { label: "Has Orders", href: "/admin/customers?filter=HAS_ORDERS" },
              { label: "Payment Due", href: "/admin/customers?filter=PAYMENT_DUE" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Weekly Plans</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4">Payments Due</th>
                <th className="p-4">Last Order</th>
                <th className="p-4"></th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomerRows.map((customer) => (
                <tr key={customer.id} className="border-t">
                  <td className="p-4">
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-neutral-500">{customer.email}</div>
                  </td>

                  <td className="p-4">{customer.orderCount}</td>

                  <td className="p-4">
                    {customer.weeklyMealPlanItemCount > 0 ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                        {customer.weeklyMealPlanItemCount}
                      </span>
                    ) : (
                      <span className="text-neutral-500">None</span>
                    )}
                  </td>

                  <td className="p-4 font-medium">
                    ${customer.totalSpent.toFixed(2)}
                  </td>

                  <td className="p-4">
                    {customer.paymentDueCount > 0 ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                        {customer.paymentDueCount} due
                      </span>
                    ) : (
                      <span className="text-neutral-500">None</span>
                    )}
                  </td>

                  <td className="p-4 text-neutral-600">
                    {customer.lastOrderDate
                      ? customer.lastOrderDate.toLocaleDateString()
                      : "No orders"}
                  </td>

                  <td className="p-4">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-medium underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}

              {filteredCustomerRows.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-neutral-500" colSpan={7}>
                    No customers match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
