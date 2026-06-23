import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/auth-guards";
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
  await requireAdminPage();

  const params = await searchParams;
  const filter = params.filter;
  const query = params.q?.trim().toLowerCase() ?? "";
  const noActiveFilter = !filter;

  function filterIsActive(href: string) {
    const [, queryString = ""] = href.split("?");
    const filterParams = new URLSearchParams(queryString);

    if (!queryString) return noActiveFilter;

    return filterParams.get("filter") === filter;
  }

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
      .filter(
        (order) => order.status !== "CANCELLED" && order.status !== "REFUNDED",
      )
      .reduce((sum, order) => sum + Number(order.total), 0);

    const paymentDueCount = customer.orders.filter((order) =>
      ["PAY_BY_DATE", "OFFLINE_PAYMENT_DUE"].includes(
        order.paymentStatus ?? "",
      ),
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
    <main className="admin-page">
      <div className="admin-container">
        <div className="mb-8">
          <Link className="admin-back-link" href="/admin">
            &larr; Back to Dashboard
          </Link>
          <p className="admin-eyebrow mt-5">Admin</p>

          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Customers
          </h1>

          <p className="mt-3 max-w-2xl text-[#6b5a50]">
            Review customer accounts, order activity, and payment status.
          </p>
        </div>

        <form
          className="admin-card mb-4 flex flex-col gap-3 p-5 sm:flex-row"
          action="/admin/customers"
        >
          {filter && <input type="hidden" name="filter" value={filter} />}

          <input
            name="q"
            defaultValue={query}
            placeholder="Search by name or email"
            className="admin-input"
          />

          <button className="admin-button-primary shrink-0">Search</button>
        </form>

        <div className="admin-card mb-6 p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-black">Filters</p>
              <p className="mt-1 text-sm text-[#6b5a50]">
                Focus on customers with activity or payment follow-up needs.
              </p>
            </div>

            <span className="text-sm font-bold text-[#6b5a50]">
              {filteredCustomerRows.length} result
              {filteredCustomerRows.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { label: "All", href: "/admin/customers" },
              {
                label: "Has Orders",
                href: "/admin/customers?filter=HAS_ORDERS",
              },
              {
                label: "Payment Due",
                href: "/admin/customers?filter=PAYMENT_DUE",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-filter-chip ${
                  filterIsActive(item.href) ? "admin-filter-chip-active" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-table-shell">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Orders</th>
                <th>Weekly Plans</th>
                <th>Total Spent</th>
                <th>Payments Due</th>
                <th>Last Order</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomerRows.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="font-black">{customer.name}</div>
                    <div className="mt-1 text-xs text-[#6b5a50]">
                      {customer.email}
                    </div>
                  </td>

                  <td>{customer.orderCount}</td>

                  <td>
                    {customer.weeklyMealPlanItemCount > 0 ? (
                      <span className="admin-badge admin-badge-success">
                        {customer.weeklyMealPlanItemCount}
                      </span>
                    ) : (
                      <span className="text-[#6b5a50]">None</span>
                    )}
                  </td>

                  <td className="font-bold">
                    ${customer.totalSpent.toFixed(2)}
                  </td>

                  <td>
                    {customer.paymentDueCount > 0 ? (
                      <span className="admin-badge admin-badge-warning">
                        {customer.paymentDueCount} due
                      </span>
                    ) : (
                      <span className="text-[#6b5a50]">None</span>
                    )}
                  </td>

                  <td className="text-[#6b5a50]">
                    {customer.lastOrderDate
                      ? customer.lastOrderDate.toLocaleDateString()
                      : "No orders"}
                  </td>

                  <td>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="admin-action-link"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}

              {filteredCustomerRows.length === 0 && (
                <tr>
                  <td className="text-center text-[#6b5a50]" colSpan={7}>
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
