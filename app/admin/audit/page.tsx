import Link from "next/link";
import { requireAdminPage } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

function formatMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return "—";
  }

  return JSON.stringify(metadata);
}

export default async function AdminAuditLogPage() {
  await requireAdminPage();

  const logs = await prisma.adminAuditLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return (
    <main className="admin-page">
      <div className="admin-container max-w-6xl">
        <Link className="admin-back-link" href="/admin">
          &larr; Back to Dashboard
        </Link>

        <div className="mb-8">
          <p className="admin-eyebrow mt-5">Admin</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Audit Log
          </h1>
          <p className="mt-3 max-w-2xl text-[#6b5a50]">
            Recent important admin actions. Sensitive request bodies, secrets,
            tokens, and passwords are not stored here.
          </p>
        </div>

        <div className="admin-table-shell">
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.createdAt.toLocaleString()}</td>
                  <td>{log.actorEmail ?? log.actorUserId ?? "Unknown"}</td>
                  <td>{log.action}</td>
                  <td>
                    <span className="font-semibold">{log.entityType}</span>
                    {log.entityId ? (
                      <span className="block text-xs text-[#6b5a50]">
                        {log.entityId}
                      </span>
                    ) : null}
                  </td>
                  <td className="max-w-xs break-words text-xs">
                    {formatMetadata(log.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
