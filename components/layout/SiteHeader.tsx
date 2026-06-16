"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { useSession } from "next-auth/react";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function SiteHeader() {
  const items = useCartStore((state) => state.items);

  const { data: session } = useSession();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const count = mounted
    ? items.reduce((total, item) => total + item.quantity, 0)
    : 0;

  const role = session?.user?.role;

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <Link
          href="/"
          className="text-center font-bold tracking-tight md:text-left"
        >
          Chef Rah&apos;s Twisted Kitchen
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium md:justify-end md:gap-5">
          <Link href="/menu">Meal Plans</Link>
          <Link href="/catering">Catering</Link>
          <Link href="/personal-chef">Personal Chef</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/cart" className="inline-flex items-center gap-1">
            Cart
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-xs text-white">
                {count}
              </span>
            )}
          </Link>

          {session?.user ? (
            <>
              <Link href="/account">Account</Link>

              <LogoutButton />
            </>
          ) : (
            <Link href="/login">Sign In</Link>
          )}

          {(role === "ADMIN" || role === "OWNER") && (
            <Link
              href="/admin"
              className="rounded-full border px-4 py-2 text-sm"
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
