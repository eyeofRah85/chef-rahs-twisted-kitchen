"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() =>
        signOut({
          callbackUrl: "/",
        })
      }
      className="rounded-lg px-3 py-2 text-sm font-semibold text-[#3b241b] transition hover:bg-white hover:text-[#9f2f18]"
    >
      Logout
    </button>
  );
}
