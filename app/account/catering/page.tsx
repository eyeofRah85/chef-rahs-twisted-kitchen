import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  formatServiceRequestType,
  formatServiceRequestStatus,
  formatApprovalStatus,
} from "@/lib/format-labels";
import type { DecimalLike } from "@/types/display";

type AccountCateringRequest = {
  id: string;
  eventType: string | null;
  requestType: string;
  createdAt: Date;
  eventDate: Date | null;
  guestCount: number | null;
  approvalStatus: string;
  status: string;
  estimatedTotal: DecimalLike | null;
  depositAmount: DecimalLike | null;
  depositPaidAt: Date | null;
};

export default async function AccountCateringPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      cateringRequests: {
        orderBy: {
          createdAt: "desc",
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

          <h1 className="mt-3 text-4xl font-bold">
            Service Requests
          </h1>

          <p className="mt-3 text-neutral-700">
            Track catering and personal chef requests, quotes, approvals, and deposit status.
          </p>
        </div>

        <div className="space-y-5">
          {user.cateringRequests.map((request: AccountCateringRequest) => (
            <div
              key={request.id}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>

                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
                      {request.eventType ?? "Service Request"}
                    </p>

                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                      {formatServiceRequestType(request.requestType) === "PERSONAL_CHEF"
                        ? "Personal Chef"
                        : "Catering"}
                    </span>
                  </div>

                  <h2 className="mt-2 text-2xl font-bold">
                    Submitted {request.createdAt.toLocaleDateString()}
                  </h2>

                  <p className="mt-2 text-sm text-neutral-600">
                    Event Date:{" "}
                    {request.eventDate
                      ? request.eventDate.toLocaleString()
                      : "Not provided"}
                  </p>

                  <p className="mt-1 text-sm text-neutral-600">
                    Guests: {request.guestCount ?? "Not provided"}
                  </p>

                  <p className="mt-1 text-sm text-neutral-600">
                    Approval: {formatApprovalStatus(request.approvalStatus)}
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                    {formatServiceRequestStatus(request.status)}
                  </span>

                  {request.estimatedTotal != null && (
                    <p className="mt-3 text-2xl font-bold">
                      ${Number(request.estimatedTotal).toFixed(2)}
                    </p>
                  )}

                  {request.depositAmount != null && (
                    <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                      <p className="font-medium">
                        Deposit: ${Number(request.depositAmount).toFixed(2)}
                      </p>

                      <p className="mt-1 text-xs">
                        {request.depositPaidAt
                          ? "Deposit paid"
                          : "Deposit pending"}
                      </p>
                    </div>
                  )}
                  <Link
                    href={`/account/catering/${request.id}`}
                    className="mt-4 inline-flex rounded-xl bg-black px-5 py-2 text-sm font-medium text-white"
                    >
                    View Details
                </Link>
                </div>
              </div>
            </div>
          ))}

          {user.cateringRequests.length === 0 && (
            <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-semibold">
                No service requests yet
              </h2>

              <p className="mt-2 text-neutral-600">
                Catering and personal chef requests will appear here after submission.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/catering"
                  className="inline-flex rounded-xl bg-black px-5 py-3 font-medium text-white"
                >
                  Start Catering Request
                </Link>

                <Link
                  href="/personal-chef"
                  className="inline-flex rounded-xl border px-5 py-3 font-medium"
                >
                  Request Personal Chef
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
