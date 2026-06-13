import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { UpdateOrderStatusForm } from "@/components/admin/UpdateOrderStatusForm";
import { MarkOrderPaidButton } from "@/components/admin/MarkOrderPaidButton";
import { OrderApprovalForm } from "@/components/admin/OrderApprovalForm";
import Link from "next/link";
import { PrintButton } from "@/components/admin/PrintButton";
import {
  formatOrderStatus,
  formatOrderType,
  formatPaymentStatus,
} from "@/lib/format-labels";
import {
  getWeeklyMealPlanSelectionDetails,
  type WeeklyOrderSelectionDisplay,
} from "@/lib/weekly-order-display";
import type { DecimalLike } from "@/types/display";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type AdminOrderDetail = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  orderType: string;
  requestedDateTime: Date | null;
  deliveryName: string | null;
  deliveryPhone: string | null;
  deliveryAddressLine1: string | null;
  deliveryAddressLine2: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryPostalCode: string | null;
  deliveryNotes: string | null;
  approvalStatus: string;
  approvalNote: string | null;
  status: string;
  allergyNotes: string | null;
  allergenAcknowledged: boolean;
  allergenAcknowledgedAt: Date | null;
  substitutionPreference: string | null;
  subtotal: DecimalLike;
  deliveryFee: DecimalLike;
  lateFee: DecimalLike;
  tipAmount: DecimalLike;
  total: DecimalLike;
  paymentProvider: string | null;
  paymentStatus: string | null;
  payByDate: Date | null;
  paidAt: Date | null;
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: DecimalLike;
    lineTotal: DecimalLike;
    notes: string | null;
    weeklyMealPlanSelection: WeeklyOrderSelectionDisplay | null;
  }[];
  statusHistory: {
    id: string;
    status: string;
    note: string | null;
    createdAt: Date;
  }[];
};

export default async function AdminOrderDetailsPage({ params }: PageProps) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const { id } = await params;

  const order = (await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          weeklyMealPlanSelection: true,
        },
      },
      statusHistory: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })) as AdminOrderDetail | null;

  if (!order) {
    notFound();
  }

  const paymentDue = ["PAY_BY_DATE", "OFFLINE_PAYMENT_DUE"].includes(
    order.paymentStatus ?? "",
  );

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-5xl">
         <Link className="text-sm font-medium underline" href="/admin/kitchen">
              &uarr;  Back to Kitchen tickets
            </Link>
        <div className="mb-8">
           <Link className="text-sm font-medium underline" href="/admin/orders">
              &larr;  Back to Orders
            </Link>           
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Admin Order
          </p>
          <h1 className="mt-3 text-4xl font-bold">Order Details</h1>
          <p className="mt-3 text-sm text-neutral-600">{order.id}</p>
        </div>
        <div className="mt-4 print:hidden">
          <PrintButton label="Print Kitchen Ticket" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Customer</h2>
              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <strong>Name:</strong> {order.customerName}
                </p>
                <p>
                  <strong>Email:</strong> {order.customerEmail}
                </p>
                <p>
                  <strong>Phone:</strong> {order.customerPhone ?? "Not provided"}
                </p>
                <p>
                  <strong>Order Type:</strong> {formatOrderType(order.orderType)}
                </p>
                <p>
                  <strong>Requested:</strong>{" "}
                  {order.requestedDateTime
                    ? order.requestedDateTime.toLocaleString()
                    : "Not provided"}
                </p>
              </div>
            </div>
              <section className="rounded-2xl border bg-white p-6 shadow-sm">

                <h2 className="text-2xl font-semibold">Delivery / Contact Info</h2>

                <div className="mt-5 space-y-2 text-sm text-neutral-700">
                  <p>
                    <strong>Name:</strong>{" "}
                    {order.deliveryName ?? order.customerName ?? "Not provided"}
                  </p>

                  <p>
                    <strong>Phone:</strong>{" "}
                    {order.deliveryPhone ?? "Not provided"}
                  </p>

                  <p>
                    <strong>Address:</strong>{" "}
                    {order.deliveryAddressLine1
                      ? `${order.deliveryAddressLine1}${
                          order.deliveryAddressLine2
                            ? `, ${order.deliveryAddressLine2}`
                            : ""
                        }`
                      : "Not provided"}
                  </p>

                  <p>
                    <strong>City/State/ZIP:</strong>{" "}
                    {[
                      order.deliveryCity,
                      order.deliveryState,
                      order.deliveryPostalCode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Not provided"}
                  </p>

                  <p>
                    <strong>Delivery Notes:</strong>{" "}
                    {order.deliveryNotes ?? "None"}
                  </p>

                 
                </div>
                 {order.approvalStatus === "PENDING" && (
                    <div className="mt-6 rounded-2xl border border-blue-300 bg-blue-50 p-5 text-blue-950">
                      <h2 className="text-xl font-semibold">Approval Needed</h2>

                      <p className="mt-2 text-sm leading-6">
                        This order includes one or more items or selections that require review
                        before it can move into preparation.
                      </p>
                    </div>
                  )}

                  {order.approvalStatus === "APPROVED" && (
                    <div className="mt-6 rounded-2xl border border-green-300 bg-green-50 p-5 text-green-950">
                      <h2 className="text-xl font-semibold">Approved</h2>

                      <p className="mt-2 text-sm leading-6">
                        This order has been approved and can continue through the kitchen workflow.
                      </p>
                    </div>
                  )}

                  {order.approvalStatus === "DENIED" && (
                    <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-950">
                      <h2 className="text-xl font-semibold">Denied</h2>

                      <p className="mt-2 text-sm leading-6">
                        This order was denied and should not move forward unless the customer
                        submits a revised order.
                      </p>

                      {order.approvalNote && (
                        <p className="mt-3 text-sm">
                          <span className="font-semibold">Note:</span> {order.approvalNote}
                        </p>
                      )}
                    </div>
                  )}
              </section>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Items</h2>

              <div className="mt-5 space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="rounded-xl border p-4">
                    {item.weeklyMealPlanSelection ? (
                      <div className="mb-3 border-l-4 border-emerald-500 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
                        <p className="font-semibold">
                          Weekly Meal Plan Snapshot
                        </p>

                        <dl className="mt-2 space-y-1">
                          {getWeeklyMealPlanSelectionDetails(
                            item.weeklyMealPlanSelection,
                          ).map((detail) => (
                            <div key={detail.label}>
                              <dt className="inline font-semibold">
                                {detail.label}:{" "}
                              </dt>
                              <dd className="inline">{detail.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ) : null}

                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-neutral-600">
                          Qty: {item.quantity} x $
                          {Number(item.unitPrice).toFixed(2)}
                        </p>
                        {item.notes && (
                          <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 whitespace-pre-wrap">
                            <p className="mb-1 font-semibold">Selections / Add-ons</p>
                            {item.notes}
                          </div>
                        )}
                      </div>

                      <p className="font-medium">
                        ${Number(item.lineTotal).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {order.allergenAcknowledged && (
              <section className="rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-900">
                <h2 className="text-xl font-semibold">Allergen Warning Acknowledged</h2>

                <p className="mt-2 leading-6">
                  The customer acknowledged that this order may contain allergen tags
                  matching their account preferences before submitting.
                </p>

                {order.allergenAcknowledgedAt && (
                  <p className="mt-2 text-xs">
                    Acknowledged on{" "}
                    {order.allergenAcknowledgedAt.toLocaleString()}
                  </p>
                )}
              </section>
            )}
                        <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Notes</h2>

              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="font-medium">Allergy Notes</p>

                  {order.allergyNotes ? (
                    <div className="mt-2 rounded-xl border-2 border-red-500 bg-red-50 p-4 text-red-900">
                      <p className="text-xs font-bold uppercase text-red-700">
                        Allergy Alert
                      </p>
                      <p className="mt-2">{order.allergyNotes}</p>
                    </div>
                  ) : (
                    <p className="mt-1 text-neutral-700">None provided.</p>
                  )}
                </div>

                <div>
                  <p className="font-medium">Substitution Preference</p>
                  <p className="mt-1 text-neutral-700">
                    {order.substitutionPreference || "None provided."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6 print:hidden">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">         
              <div className="mt-6">
                  <OrderApprovalForm
                    orderId={order.id}
                    currentApprovalStatus={order.approvalStatus}
                  />
                </div>

                {order.approvalNote && (
                  <p className="mt-4 text-sm text-neutral-600">
                    <strong>Note:</strong> {order.approvalNote}
                  </p>
                  )}
              </div>
              
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Status</h2>
              <p className="mt-3 rounded-full bg-neutral-100 px-3 py-2 text-center text-sm font-medium">
                {formatOrderStatus(order.status)}
              </p>

              <div className="mt-6">
                <UpdateOrderStatusForm
                  orderId={order.id}
                  currentStatus={order.status}
                />
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Totals</h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${Number(order.subtotal).toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>${Number(order.deliveryFee).toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Late Fee</span>
                  <span>${Number(order.lateFee).toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Tip</span>
                  <span>${Number(order.tipAmount).toFixed(2)}</span>
                </div>

                <div className="border-t pt-3 text-base font-bold">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span>${Number(order.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Payment</h2>

              <div className="mt-5 space-y-3 text-sm">
                <p>
                  <strong>Provider:</strong>{" "}
                  {order.paymentProvider ?? "Not set"}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {formatPaymentStatus(order.paymentStatus)}
                </p>

                <p>
                  <strong>Pay By:</strong>{" "}
                  {order.payByDate
                    ? order.payByDate.toLocaleDateString()
                    : "Not set"}
                </p>

                <p>
                  <strong>Paid At:</strong>{" "}
                  {order.paidAt
                    ? order.paidAt.toLocaleString()
                    : "Not paid"}
                </p>
                {paymentDue && (
                  <div className="mt-5">
                    <MarkOrderPaidButton orderId={order.id} />
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">History</h2>

              <div className="mt-5 space-y-3">
                {order.statusHistory.map((history) => (
                  <div key={history.id} className="border-l-2 pl-3 text-sm">
                    <p className="font-medium">
                      {formatOrderStatus(history.status)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {history.createdAt.toLocaleString()}
                    </p>
                    {history.note && (
                      <p className="mt-1 text-neutral-700">{history.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
