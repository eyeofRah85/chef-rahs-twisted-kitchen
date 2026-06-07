import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { formatServiceRequestType, formatServiceRequestStatus, formatApprovalStatus, } from "@/lib/format-labels";
import { parseEnumValue } from "@/lib/enum-values";
import {
  approvalStatuses,
  cateringStatuses,
  serviceRequestTypes,
} from "@/lib/prisma-enums";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    approval?: string;
    type?:string;
  }>;
};

type AdminServiceRequestRow = {
  id: string;
  name: string;
  email: string;
  requestType: string;
  eventType: string | null;
  eventDate: Date | null;
  guestCount: number | null;
  status: string;
  approvalStatus: string;
  createdAt: Date;
};

export default async function AdminCateringPage({ searchParams }: PageProps) {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const params = await searchParams;
  const statusFilter = params.status;
  const approvalFilter = params.approval;
  const typeFilter = params.type;
  const status = parseEnumValue(cateringStatuses, statusFilter);
  const approvalStatus = parseEnumValue(
    approvalStatuses,
    approvalFilter,
  );
  const requestType = parseEnumValue(
    serviceRequestTypes,
    typeFilter,
  );

  const where = {
    ...(status ? { status } : {}),
    ...(approvalStatus ? { approvalStatus } : {}),
    ...(requestType ? { requestType } : {}),
  };

  const requests = (await prisma.cateringRequest.findMany({
    where,

    orderBy: { createdAt: "desc" },
  })) as AdminServiceRequestRow[];

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

          <h1 className="mt-3 text-4xl font-bold">Service Requests</h1>

          <p className="mt-3 text-neutral-700">
            Review catering inquiries, personal chef requests, quotes, deposits, and event details.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
          <p className="mb-4 font-semibold">Request Type</p>

          <div className="flex flex-wrap gap-3">
            {[
              { label: "All", href: "/admin/catering" },
              { label: "Catering", href: "/admin/catering?type=CATERING" },
              { label: "Personal Chef", href: "/admin/catering?type=PERSONAL_CHEF" },
            ].map((filter) => (
              <Link
                key={filter.href}
                href={filter.href}
                className="rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
          <p className="mb-4 font-semibold">Filters</p>

          <div className="flex flex-wrap gap-3">
            {[
              { label: "All", href: "/admin/catering" },
              { label: "New", href: "/admin/catering?status=NEW" },
              { label: "Reviewing", href: "/admin/catering?status=REVIEWING" },
              { label: "Quoted", href: "/admin/catering?status=QUOTED" },
              { label: "Approved", href: "/admin/catering?status=APPROVED" },
              { label: "Deposit Due", href: "/admin/catering?status=DEPOSIT_DUE" },
              { label: "Deposit Paid", href: "/admin/catering?status=DEPOSIT_PAID" },
              { label: "Completed", href: "/admin/catering?status=COMPLETED" },
              { label: "Cancelled", href: "/admin/catering?status=CANCELLED" },
              { label: "Approval Pending", href: "/admin/catering?approval=PENDING" },
              { label: "Approved", href: "/admin/catering?approval=APPROVED" },
              { label: "Denied", href: "/admin/catering?approval=DENIED" },
            ].map((filter) => (
              <Link
                key={filter.href}
                href={filter.href}
                className="rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </div>
        
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Type</th>
                <th className="p-4">Event</th>
                <th className="p-4">Guests</th>
                <th className="p-4">Status</th>
                <th className="p-4">Approval</th>
                <th className="p-4">Submitted</th>
                <th className="p-4"></th>
              </tr>
            </thead>

            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-t">
                  <td className="p-4">
                    <div className="font-medium">{request.name}</div>
                    <div className="text-xs text-neutral-500">{request.email}</div>
                  </td>

                  <td className="p-4">
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                      {formatServiceRequestType(request.requestType)}
                    </span>
                  </td>

                  <td className="p-4">
                    <div>{request.eventType ?? "Event"}</div>
                    <div className="text-xs text-neutral-500">
                      {request.eventDate
                        ? request.eventDate.toLocaleString()
                        : "Date not provided"}
                    </div>
                  </td>

                  <td className="p-4">{request.guestCount ?? "-"}</td>

                  <td className="p-4">
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                      {formatServiceRequestStatus(request.status)}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                      {formatApprovalStatus(request.approvalStatus)}
                    </span>
                  </td>

                  <td className="p-4 text-neutral-600">
                    {request.createdAt.toLocaleDateString()}
                  </td>

                  <td className="p-4">
                    <Link
                      href={`/admin/catering/${request.id}`}
                      className="font-medium underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}

              {requests.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-neutral-500" colSpan={8}>
                    No service requests yet.
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
