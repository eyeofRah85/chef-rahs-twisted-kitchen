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
          
          <div className="border-t pt-5">
            <h2 className="font-semibold">Optional delivery information</h2>
            <p className="mt-1 text-sm text-neutral-600">
              You can add this now or update it later from your account page.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
          <input
            name="phone"
            placeholder="Phone number optional"
            className="rounded-xl border px-4 py-3"
          />

          <input
            name="postalCode"
            placeholder="ZIP / Postal code optional"
            className="rounded-xl border px-4 py-3"
          />
        </div>

        <input
          name="addressLine1"
          placeholder="Delivery address optional"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          name="addressLine2"
          placeholder="Apartment, suite, unit optional"
          className="w-full rounded-xl border px-4 py-3"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="city"
            placeholder="City optional"
            className="rounded-xl border px-4 py-3"
          />

          <input
            name="state"
            placeholder="State optional"
            className="rounded-xl border px-4 py-3"
          />
        </div>

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