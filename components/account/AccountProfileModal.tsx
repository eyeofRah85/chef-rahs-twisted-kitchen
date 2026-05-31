"use client";

import { useState } from "react";
import { AccountProfileForm } from "@/components/account/AccountProfileForm";

type Props = {
  label?: string;
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    deliveryNotes: string | null;
  };
};

export function AccountProfileModal({
  user,
  label = "Update Account Information",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border bg-white px-5 py-3 text-sm font-medium shadow-sm transition hover:bg-neutral-100"
      >
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
                  Account
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  {label}
                </h2>

                <p className="mt-2 text-sm text-neutral-600">
                  Keep your contact and delivery information current for orders,
                  catering, and personal chef requests.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>

            <AccountProfileForm user={user} onSaved={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}