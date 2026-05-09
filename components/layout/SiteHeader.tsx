"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart-store";

export function SiteHeader() {
  const itemCount = useCartStore((state) => state.itemCount);

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
            {itemCount() > 0 && (
              <span className="absolute -right-4 -top-3 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white">
                {itemCount()}
              </span>
            )}
          </Link>
          <Link
            href="/admin"
            className="rounded-full border px-4 py-2 text-sm"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}