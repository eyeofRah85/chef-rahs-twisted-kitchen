import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { UpdateCateringStatusForm } from "@/components/admin/UpdateCateringStatusForm";
import { CateringApprovalForm } from "@/components/admin/CateringApprovalForm";
import Link from "next/link";
import { CateringQuoteForm } from "@/components/admin/CateringQuoteForm";
import { MarkDepositPaidButton } from "@/components/admin/MarkDepositPaidButton";
import { formatServiceRequestType } from "@/lib/format-labels";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminCateringDetailsPage({ params }: PageProps) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const { id } = await params;

  const request = await prisma.cateringRequest.findUnique({
    where: { id },
  });

  if (!request) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link className="text-sm font-medium underline" href="/admin/catering">
            &larr;  Back to Catering Requests
          </Link>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Admin
          </p>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            {formatServiceRequestType(request.requestType) === "PERSONAL_CHEF"
              ? "Personal Chef Request"
              : "Catering Request"}
          </p>

          <h1 className="mt-3 text-4xl font-bold">{request.name}</h1>

          <p className="mt-3 text-sm text-neutral-600">{request.id}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Customer</h2>

              <div className="mt-4 space-y-2 text-sm">
                <p><strong>Name:</strong> {request.name}</p>
                <p><strong>Email:</strong> {request.email}</p>
                <p><strong>Phone:</strong> {request.phone ?? "Not provided"}</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Event Details</h2>

              <div className="mt-4 space-y-2 text-sm">
                <p><strong>Event Type:</strong> {request.eventType ?? "Not provided"}</p>
                <p>
                  <strong>Event Date:</strong>{" "}
                  {request.eventDate
                    ? request.eventDate.toLocaleString()
                    : "Not provided"}
                </p>
                <p><strong>Guest Count:</strong> {request.guestCount ?? "Not provided"}</p>
                <p><strong>Location:</strong> {request.location ?? "Not provided"}</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Request Notes</h2>

              <div className="mt-4 space-y-5 text-sm">
                <div>
                  <p className="font-medium">Requested Menu</p>
                  <p className="mt-1 whitespace-pre-wrap text-neutral-700">
                    {request.requestedMenu ?? "None provided."}
                  </p>
                </div>

                <div>
                  <p className="font-medium">Allergy Notes</p>
                  {request.allergyNotes ? (
                    <div className="mt-2 rounded-xl border-2 border-red-500 bg-red-50 p-4 text-red-900">
                      <p className="text-xs font-bold uppercase text-red-700">
                        Allergy Alert
                      </p>
                      <p className="mt-2 whitespace-pre-wrap">
                        {request.allergyNotes}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-neutral-700">None provided.</p>
                  )}
                </div>

                <div>
                  <p className="font-medium">Special Requests</p>
                  <p className="mt-1 whitespace-pre-wrap text-neutral-700">
                    {request.specialRequests ?? "None provided."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">Approval</h2>

                <div className="mt-6">
                  <CateringApprovalForm
                    requestId={request.id}
                    currentApprovalStatus={request.approvalStatus}
                  />
                </div>

                  {request.approvalNote && (
                    <p className="mt-4 text-sm text-neutral-600">
                      <strong>Note:</strong> {request.approvalNote}
                    </p>
                  )}
                </div>
              <h2 className="text-2xl font-semibold">Status</h2>

              <p className="mt-3 rounded-full bg-neutral-100 px-3 py-2 text-center text-sm font-medium">
                {request.status}
              </p>

              <div className="mt-6">
                <UpdateCateringStatusForm
                  requestId={request.id}
                  currentStatus={request.status}
                />
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">

              <h2 className="text-2xl font-semibold">Quote / Deposit</h2>
                <div className="mt-5 space-y-3 text-sm">
                  <p>
                    <strong>Estimated Total:</strong>{" "}
                    {request.estimatedTotal
                      ? `$${Number(request.estimatedTotal).toFixed(2)}`
                      : "Not set"}
                  </p>

                  <p>
                    <strong>Deposit Amount:</strong>{" "}
                    {request.depositAmount
                      ? `$${Number(request.depositAmount).toFixed(2)}`
                      : "Not set"}
                  </p>

                  <p>
                    <strong>Deposit Paid:</strong>{" "}
                    {request.depositPaidAt
                      ? request.depositPaidAt.toLocaleString()
                      : "Not paid"}
                  </p>

                  <div className="mt-6 border-t pt-5">
                    <CateringQuoteForm
                      requestId={request.id}
                      currentEstimatedTotal={
                        request.estimatedTotal ? Number(request.estimatedTotal) : null
                      }
                      currentDepositAmount={
                        request.depositAmount ? Number(request.depositAmount) : null
                      }
                    />
                    {request.depositAmount && !request.depositPaidAt && (
                      <div className="mt-5">
                        <MarkDepositPaidButton requestId={request.id} />
                      </div>
                    )}
                  </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}