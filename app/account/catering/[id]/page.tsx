import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import {
  formatServiceRequestType,
  formatServiceRequestStatus,
  formatApprovalStatus,
} from "@/lib/format-labels";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AccountCateringDetailsPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { id } = await params;

  const request = await prisma.cateringRequest.findFirst({
    where: {
      id,
      user: {
        email: session.user.email,
      },
    },
  });

  if (!request) {
    notFound();
  }

  const requestTypeLabel = formatServiceRequestType(request.requestType);

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/account/catering" className="text-sm font-medium underline">
          &larr; Back to Service Requests
        </Link>

        <div className="mt-8 rounded-2xl border bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            {requestTypeLabel} Request
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            {request.eventType ?? `${requestTypeLabel} Request`}
          </h1>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-neutral-100 p-4">
              <p className="text-sm text-neutral-500">Status</p>
              <p className="mt-2 font-semibold">{formatServiceRequestStatus(request.status)}</p>
            </div>

            <div className="rounded-xl bg-neutral-100 p-4">
              <p className="text-sm text-neutral-500">Approval</p>
              <p className="mt-2 font-semibold">{formatApprovalStatus(request.approvalStatus)}</p>
            </div>

            <div className="rounded-xl bg-neutral-100 p-4">
              <p className="text-sm text-neutral-500">Guests</p>
              <p className="mt-2 font-semibold">
                {request.guestCount ?? "Not provided"}
              </p>
            </div>
          </div>

          {request.approvalNote && (
            <div className="mt-6 rounded-xl border bg-neutral-50 p-4 text-sm">
              <p className="font-semibold">Approval Note</p>
              <p className="mt-2 whitespace-pre-wrap text-neutral-700">
                {request.approvalNote}
              </p>
            </div>
          )}

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold">Event Details</h2>

              <div className="mt-4 space-y-2 text-sm text-neutral-700">
                <p>
                  <strong>Date:</strong>{" "}
                  {request.eventDate
                    ? request.eventDate.toLocaleString()
                    : "Not provided"}
                </p>

                <p>
                  <strong>Location:</strong> {request.location ?? "Not provided"}
                </p>

                <p>
                  <strong>Submitted:</strong>{" "}
                  {request.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold">Quote / Deposit</h2>

              <div className="mt-4 space-y-2 text-sm text-neutral-700">
                <p>
                  <strong>Estimated Total:</strong>{" "}
                  {request.estimatedTotal
                    ? `$${Number(request.estimatedTotal).toFixed(2)}`
                    : "Not set"}
                </p>

                <p>
                  <strong>Deposit:</strong>{" "}
                  {request.depositAmount
                    ? `$${Number(request.depositAmount).toFixed(2)}`
                    : "Not set"}
                </p>

                {request.depositAmount && !request.depositPaidAt && (
                  <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-semibold">Deposit Pending</p>

                    <p className="mt-2">
                      A deposit of ${Number(request.depositAmount).toFixed(2)} is due before
                      this {requestTypeLabel.toLowerCase()} request can be finalized.
                    </p>

                    <p className="mt-2 text-xs">
                      Online deposit payments are coming soon. For now, the business will
                      provide manual payment instructions.
                    </p>
                  </div>
                )}

                {request.depositPaidAt && (
                  <div className="mt-4 rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-900">
                    <p className="font-semibold">Deposit Paid</p>

                    <p className="mt-2">
                      Deposit received on {request.depositPaidAt.toLocaleString()}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mt-8 space-y-5">
            <div>
              <h2 className="text-xl font-semibold">Requested Menu</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">
                {request.requestedMenu ?? "None provided."}
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold">Allergy Notes</h2>
              {request.allergyNotes ? (
                <div className="mt-2 rounded-xl border-2 border-red-500 bg-red-50 p-4 text-sm text-red-900">
                  {request.allergyNotes}
                </div>
              ) : (
                <p className="mt-2 text-sm text-neutral-700">None provided.</p>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold">Special Requests</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">
                {request.specialRequests ?? "None provided."}
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
