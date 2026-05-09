import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Create Account</h1>

        <form action="/api/register" method="POST" className="mt-8 space-y-5">
          <input
            name="name"
            placeholder="Name"
            className="w-full rounded-xl border px-4 py-3"
            required
          />

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

          <button className="w-full rounded-xl bg-black px-5 py-3 font-medium text-white">
            Create Account
          </button>
        </form>

        <p className="mt-5 text-sm text-neutral-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-black">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}