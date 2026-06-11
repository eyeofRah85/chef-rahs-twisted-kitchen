import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import {
  formatOrderStatus,
  formatOrderType,
  formatPaymentStatus,
  formatApprovalStatus,
} from "@/lib/format-labels";
import type { DecimalLike } from "@/types/display";

type OrderPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type OrderDetail = {
  id: string;
  customerName: string;
  customerEmail: string;
  orderType: string;
  status: string;
  approvalStatus: string;
  approvalNote: string | null;
  paymentStatus: string | null;
  paymentProvider: string | null;
  payByDate: Date | null;
  paidAt: Date | null;
  requestedDateTime: Date | null;
  deliveryName: string | null;
  deliveryPhone: string | null;
  deliveryAddressLine1: string | null;
  deliveryAddressLine2: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryPostalCode: string | null;
  deliveryNotes: string | null;
  allergyNotes: string | null;
  allergenAcknowledged: boolean;
  allergenAcknowledgedAt: Date | null;
  substitutionPreference: string | null;
  subtotal: DecimalLike;
  deliveryFee: DecimalLike;
  lateFee: DecimalLike;
  tipAmount: DecimalLike;
  total: DecimalLike;
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: DecimalLike;
    lineTotal: DecimalLike;
    notes: string | null;
  }[];
};

export default async function OrderPage({ params }: OrderPageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { id } = await params;

  const order = (await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: true,      
    },
  })) as OrderDetail | null;

  if (!order) {
    notFound();
  }

  const userRole = session.user.role;
  const isOwner = order.customerEmail === session.user.email;
  const isAdmin = userRole === "ADMIN" || userRole === "OWNER";

  if (!isOwner && !isAdmin) {
    notFound();
  }

  const paymentDue =
    order.paymentStatus === "PAY_BY_DATE" ||
    order.paymentStatus === "OFFLINE_PAYMENT_DUE";

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/account/orders" className="text-sm font-medium underline">
          &larr; Back to Order History
        </Link>

        <div className="mt-8 rounded-2xl border bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Order Details
          </p>

          <h1 className="mt-3 text-4xl font-bold">Order Details</h1>

          <p className="mt-3 text-sm text-neutral-600">{order.id}</p>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-neutral-100 p-4">
              <p className="text-sm text-neutral-500">Status</p>
              <p className="mt-2 font-semibold">
                {formatOrderStatus(order.status)}
              </p>
            </div>

            <div className="rounded-xl bg-neutral-100 p-4">
              <p className="text-sm text-neutral-500">Approval</p>
              <p className="mt-2 font-semibold">{formatApprovalStatus(order.approvalStatus)}</p>
            </div>

            <div className="rounded-xl bg-neutral-100 p-4">
              <p className="text-sm text-neutral-500">Payment</p>
              <p className="mt-2 font-semibold">
                {formatPaymentStatus(order.paymentStatus) ?? "Not set"}
              </p>
            </div>
          </section>

          {order.approvalStatus === "PENDING" && (
            <section className="mt-6 rounded-2xl border border-blue-300 bg-blue-50 p-5 text-blue-950">
              <h2 className="text-xl font-semibold">Waiting for Chef Approval</h2>

              <p className="mt-2 text-sm leading-6">
                Your order has been received and is waiting for chef review.
                You will receive an update once the order is approved or if
                changes are needed.
              </p>
            </section>
          )}

          {order.approvalStatus === "DENIED" && (
            <section className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-950">
              <h2 className="text-xl font-semibold">Order Not Approved</h2>

              <p className="mt-2 text-sm leading-6">
                This order was not approved. Please review any notes from the
                business or contact Chef Rah&apos;s Twisted Kitchen for next
                steps.
              </p>

              {order.approvalNote && (
                <p className="mt-3 text-sm">
                  <strong>Note:</strong> {order.approvalNote}
                </p>
              )}
            </section>
          )}

          {order.approvalStatus === "APPROVED" && (
            <section className="mt-6 rounded-2xl border border-green-300 bg-green-50 p-5 text-green-950">
              <h2 className="text-xl font-semibold">Order Approved</h2>

              <p className="mt-2 text-sm leading-6">
                This order has been approved and can continue through
                preparation, pickup, or delivery.
              </p>

              {order.approvalNote && (
                <p className="mt-3 text-sm">
                  <strong>Note:</strong> {order.approvalNote}
                </p>
              )}
            </section>
          )}

          {paymentDue && (
            <section className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
              <h2 className="text-xl font-semibold">Payment Due</h2>

              <p className="mt-2 text-sm">
                This order still needs payment.
                {order.payByDate
                  ? ` Please pay by ${order.payByDate.toLocaleDateString()}.`
                  : ""}
              </p>

              <p className="mt-3 text-sm">
                Online payment is coming soon. For now, please follow the
                business&apos;s manual payment instructions.
              </p>
            </section>
          )}

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold">Customer</h2>

              <div className="mt-4 space-y-2 text-sm text-neutral-700">
                <p>
                  <strong>Name:</strong> {order.customerName}
                </p>

                <p>
                  <strong>Email:</strong> {order.customerEmail}
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

            <div>
              <h2 className="text-2xl font-semibold">Payment</h2>

              <div className="mt-4 space-y-2 text-sm text-neutral-700">
                <p>
                  <strong>Provider:</strong>{" "}
                  {order.paymentProvider ?? "Not set"}
                </p>

                <p>
                  <strong>Status:</strong> {formatPaymentStatus(order.paymentStatus)}
                </p>

                <p>
                  <strong>Pay By:</strong>{" "}
                  {order.payByDate
                    ? order.payByDate.toLocaleDateString()
                    : "Not set"}
                </p>

                <p>
                  <strong>Paid At:</strong>{" "}
                  {order.paidAt ? order.paidAt.toLocaleString() : "Not paid"}
                </p>
              </div>
            </div>
          </section>
<section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
  <h2 className="text-2xl font-semibold">Contact / Delivery Information</h2>

  <div className="mt-5 space-y-2 text-sm text-neutral-700">
    <p>
      <strong>Name:</strong>{" "}
      {order.deliveryName ?? order.customerName ?? "Not provided"}
    </p>

    <p>
      <strong>Phone:</strong>{" "}
      {order.deliveryPhone ?? "Not provided"}
    </p>

    {order.orderType === "DELIVERY" && (
      <>
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
      </>
    )}
  </div>
</section>
          <section className="mt-8">
            <h2 className="text-2xl font-semibold">Items</h2>

            <div className="mt-5 space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="rounded-xl border p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">
                        {item.quantity} x {item.name}
                      </h3>

                      <p className="mt-1 text-sm text-neutral-600">
                        ${Number(item.unitPrice).toFixed(2)} each
                      </p>

                      {item.notes && (
                        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 whitespace-pre-wrap">
                          <p className="mb-1 font-semibold">
                            Selections / Add-ons
                          </p>
                          {item.notes}
                        </div>
                      )}
                    </div>

                    <p className="font-semibold">
                      ${Number(item.lineTotal).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 space-y-5">
            <div>
              <h2 className="text-xl font-semibold">Allergy Notes</h2>

              {order.allergyNotes ? (
                <div className="mt-2 rounded-xl border-2 border-red-500 bg-red-50 p-4 text-sm text-red-900">
                  {order.allergyNotes}
                </div>
              ) : (
                <p className="mt-2 text-sm text-neutral-700">None provided.</p>
              )}
            </div>

            {order.allergenAcknowledged && (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-900">
                <h2 className="text-xl font-semibold">Allergen Warning Acknowledged</h2>

                <p className="mt-2 leading-6">
                  You acknowledged that this order may contain allergen tags matching your
                  account preferences before submitting.
                </p>

                {order.allergenAcknowledgedAt && (
                  <p className="mt-2 text-xs">
                    Acknowledged on{" "}
                    {order.allergenAcknowledgedAt.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold">
                Substitution Preference
              </h2>

              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">
                {order.substitutionPreference ?? "None provided."}
              </p>
            </div>
          </section>

          <section className="mt-8 border-t pt-6">
            <div className="space-y-3 text-sm">
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

              <div className="border-t pt-3 text-lg font-bold">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span>${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
