"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { userRoles, type UserRoleValue } from "@/lib/prisma-enums";

export type RoleManagerUser = {
  id: string;
  name: string | null;
  email: string;
  role: UserRoleValue;
  createdAt: string;
  updatedAt: string;
};

type UserRoleManagerProps = {
  currentUserId: string;
  users: RoleManagerUser[];
};

const roleLabels: Record<UserRoleValue, string> = {
  CUSTOMER: "Customer",
  ADMIN: "Admin",
  OWNER: "Owner",
};

function getErrorMessage(value: unknown) {
  if (typeof value === "object" && value !== null && "error" in value) {
    const apiError = value.error;

    if (typeof apiError === "string") {
      return apiError;
    }
  }

  return "The role could not be updated.";
}

export function UserRoleManager({
  currentUserId,
  users: initialUsers,
}: UserRoleManagerProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [selectedRoles, setSelectedRoles] = useState<
    Record<string, UserRoleValue>
  >(() => Object.fromEntries(initialUsers.map((user) => [user.id, user.role])));
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ownerCount = users.filter((user) => user.role === "OWNER").length;

  async function updateRole(user: RoleManagerUser) {
    const role = selectedRoles[user.id];

    if (!role || role === user.role) {
      return;
    }

    setSavingUserId(user.id);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setError(getErrorMessage(data));
        return;
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                role,
                updatedAt: new Date().toISOString(),
              }
            : currentUser,
        ),
      );
      setMessage(`${user.email} is now ${roleLabels[role]}.`);
      router.refresh();

      if (user.id === currentUserId && role !== "OWNER") {
        router.push(role === "ADMIN" ? "/admin" : "/");
      }
    } catch {
      setError("The role could not be updated. Check the connection and retry.");
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <section className="admin-card overflow-hidden">
      <div className="border-b border-[#ead8c1] bg-[#fff8ee] p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8a2b18]" />
          <div>
            <p className="font-bold text-[#24130f]">
              Owners can manage user roles and admin access.
            </p>
            <p className="mt-1 text-sm text-[#6b5a50]">
              Keep at least one owner account. Role changes take effect on
              protected server pages immediately.
            </p>
          </div>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`border-b px-5 py-3 text-sm font-semibold ${
            error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
          role="status"
        >
          {error ?? message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="admin-table min-w-[860px]">
          <thead>
            <tr>
              <th>User</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Role</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const selectedRole = selectedRoles[user.id] ?? user.role;
              const isLastOwner = user.role === "OWNER" && ownerCount === 1;
              const isSaving = savingUserId === user.id;

              return (
                <tr key={user.id}>
                  <td>
                    <p className="font-bold text-[#24130f]">
                      {user.name?.trim() || "No name provided"}
                      {user.id === currentUserId ? " (you)" : ""}
                    </p>
                    <p className="mt-1 text-sm text-[#6b5a50]">{user.email}</p>
                  </td>
                  <td className="text-sm">
                    {new Date(user.createdAt).toLocaleString()}
                  </td>
                  <td className="text-sm">
                    {new Date(user.updatedAt).toLocaleString()}
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`role-${user.id}`}>
                      Role for {user.email}
                    </label>
                    <select
                      id={`role-${user.id}`}
                      className="admin-input min-w-36"
                      value={selectedRole}
                      disabled={isSaving || isLastOwner}
                      onChange={(event) =>
                        setSelectedRoles((currentRoles) => ({
                          ...currentRoles,
                          [user.id]: event.target.value as UserRoleValue,
                        }))
                      }
                    >
                      {userRoles.map((role) => (
                        <option key={role} value={role}>
                          {roleLabels[role]}
                        </option>
                      ))}
                    </select>
                    {isLastOwner && (
                      <p className="mt-1 max-w-48 text-xs text-[#8a2b18]">
                        Promote another owner before changing this role.
                      </p>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      aria-label={`Update role for ${user.email}`}
                      className="brand-button-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={
                        isSaving || isLastOwner || selectedRole === user.role
                      }
                      onClick={() => updateRole(user)}
                    >
                      {isSaving ? "Updating..." : "Update role"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
