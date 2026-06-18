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
    <main className="brand-page px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="brand-eyebrow">Account</p>

          <h1 className="mt-3 text-5xl font-black">Service Requests</h1>

          <p className="mt-3 max-w-2xl leading-7 text-[#6b5a50]">
            Track catering and personal chef requests, quotes, approvals, and
            deposit status.
          </p>
        </div>

        <div className="space-y-5">
          {user.cateringRequests.map((request: AccountCateringRequest) => (
            <div key={request.id} className="brand-card p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold uppercase text-[#9f2f18]">
                      {request.eventType ?? "Service Request"}
                    </p>

                    <span className="rounded-full bg-[#f4eadb] px-3 py-1 text-xs font-bold text-[#6f1f12]">
                      {formatServiceRequestType(request.requestType)}
                    </span>
                  </div>

                  <h2 className="mt-2 text-2xl font-black">
                    Submitted {request.createdAt.toLocaleDateString()}
                  </h2>

                  <p className="mt-2 text-sm text-[#6b5a50]">
                    Event Date:{" "}
                    {request.eventDate
                      ? request.eventDate.toLocaleString()
                      : "Not provided"}
                  </p>

                  <p className="mt-1 text-sm text-[#6b5a50]">
                    Guests: {request.guestCount ?? "Not provided"}
                  </p>

                  <p className="mt-1 text-sm text-[#6b5a50]">
                    Approval: {formatApprovalStatus(request.approvalStatus)}
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <span className="rounded-full bg-[#f4eadb] px-3 py-1 text-xs font-bold text-[#6f1f12]">
                    {formatServiceRequestStatus(request.status)}
                  </span>

                  {request.estimatedTotal != null && (
                    <p className="mt-3 text-2xl font-black">
                      ${Number(request.estimatedTotal).toFixed(2)}
                    </p>
                  )}

                  {request.depositAmount != null && (
                    <div className="mt-2 rounded-lg border border-[#d99426] bg-[#fff3cf] p-3 text-sm text-[#6f1f12]">
                      <p className="font-bold">
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
                    className="brand-button-primary mt-4 px-5 py-2 text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {user.cateringRequests.length === 0 && (
            <div className="brand-card p-8 text-center">
              <h2 className="text-2xl font-black">No service requests yet</h2>

              <p className="mt-2 text-[#6b5a50]">
                Catering and personal chef requests will appear here after
                submission.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/catering"
                  className="brand-button-primary px-5 py-3"
                >
                  Start Catering Request
                </Link>

                <Link
                  href="/personal-chef"
                  className="brand-button-secondary px-5 py-3"
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
