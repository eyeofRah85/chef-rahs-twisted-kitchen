"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setError("");

    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
      callbackUrl: "/account",
    });

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Sign In</h1>

        <form action={handleSubmit} className="mt-8 space-y-5">
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border px-4 py-3"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border px-4 py-3"
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button className="w-full rounded-xl bg-black px-5 py-3 font-medium text-white">
            Sign In
          </button>
        </form>

        <p className="mt-5 text-sm text-neutral-600">
          Need an account?{" "}
          <Link href="/register" className="font-medium text-black">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}