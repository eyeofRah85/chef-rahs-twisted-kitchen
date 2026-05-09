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
    setMounted(true);
  }, []);

  const count = mounted
    ? items.reduce((total, item) => total + item.quantity, 0)
    : 0;

  const role = (session?.user as any)?.role;

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-bold tracking-tight">
          Chef Rah&apos;s Twisted Kitchen
        </Link>

        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/menu">Menu</Link>
          <Link href="/catering">Catering</Link>

          <Link href="/cart" className="relative">
            Cart
            {count > 0 && (
              <span className="absolute -right-4 -top-3 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white">
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
            <Link href="/admin" className="rounded-full border px-4 py-2 text-sm">
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}