import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPage  } from "@/lib/auth-guards";
import { KitchenOrderCard } from "@/components/admin/KitchenOrderCard";
import Link from "next/link";
import type { DecimalLike } from "@/types/display";
import type { WeeklyOrderSelectionDisplay } from "@/lib/weekly-order-display";

type KitchenOrderRow = {
  id: string;
  orderType: string;
  status: string;
  customerName: string;
  requestedDateTime: Date | null;
  allergyNotes: string | null;
  items: {
    id: string;
    name: string;
    quantity: number;
    lineTotal: DecimalLike;
    notes: string | null;
    weeklyMealPlanSelection: WeeklyOrderSelectionDisplay | null;
  }[];
};

export default async function KitchenPage() {
  try {
    await requireAdminPage ();
  } catch {
    redirect("/");
  }

  const activeOrders = (await prisma.order.findMany({
    where: {
      approvalStatus: "APPROVED",

      status: {
        in: ["ACCEPTED", "PREPARING", "READY"],
      },
    },

    orderBy: {
      createdAt: "asc",
    },

    select: {
      id: true,
      orderType: true,
      status: true,
      customerName: true,
      requestedDateTime: true,
      allergyNotes: true,
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          lineTotal: true,
          notes: true,
          weeklyMealPlanSelection: true,
        },
      },
    },
  })) as KitchenOrderRow[];

  return (
    <main className="admin-page">
      <div className="admin-container">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link className="admin-back-link" href="/admin">
              &larr; Back to Dashboard
            </Link>
            <p className="admin-eyebrow mt-5">Kitchen View</p>

            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              Approved Kitchen Orders
            </h1>
            <p className="mt-3 max-w-2xl text-[#6b5a50]">
              Prep-ready orders that have been approved and are moving through
              the kitchen workflow.
            </p>
          </div>

          <span className="admin-badge admin-badge-info">
            {activeOrders.length} active
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {activeOrders.map((order) => (
            <KitchenOrderCard
              key={order.id}
              order={{
                id: order.id,
                orderType: order.orderType,
                status: order.status,
                customerName: order.customerName,
                requestedDateTime:
                  order.requestedDateTime?.toISOString() ?? null,
                allergyNotes: order.allergyNotes,
                items: order.items.map((item) => ({
                  id: item.id,
                  name: item.name,
                  quantity: item.quantity,
                  lineTotal: Number(item.lineTotal),
                  notes: item.notes,
                  weeklyMealPlanSelection: item.weeklyMealPlanSelection
                    ? {
                        periodLabel: item.weeklyMealPlanSelection.periodLabel,
                        packageName: item.weeklyMealPlanSelection.packageName,
                        packageDays: item.weeklyMealPlanSelection.packageDays,
                        packageMealsPerDay:
                          item.weeklyMealPlanSelection.packageMealsPerDay,
                        packagePrice: Number(
                          item.weeklyMealPlanSelection.packagePrice,
                        ),
                        offeringName: item.weeklyMealPlanSelection.offeringName,
                        spiceLevel: item.weeklyMealPlanSelection.spiceLevel,
                        proteinSubstitution:
                          item.weeklyMealPlanSelection.proteinSubstitution,
                        requestOnly: item.weeklyMealPlanSelection.requestOnly,
                        requiresApproval:
                          item.weeklyMealPlanSelection.requiresApproval,
                        priceDelta: Number(
                          item.weeklyMealPlanSelection.priceDelta,
                        ),
                      }
                    : null,
                })),
              }}
            />
          ))}

          {activeOrders.length === 0 && (
            <div className="admin-card p-10">
              <p className="text-lg font-black">No active orders.</p>
              <p className="mt-2 text-sm text-[#6b5a50]">
                Approved orders will appear here once they move into accepted,
                preparing, or ready status.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
