import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function PersonalChefPage() {
  const session = await auth();

  const user = session?.user?.email
  ? await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        name: true,
        email: true,
        phone: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        deliveryNotes: true,
      },
    })
  : null;

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
          Personal Chef
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Personal Chef Request
        </h1>

        <p className="mt-4 text-neutral-700">
          Request personal chef services for private meals, events, meal prep,
          or custom dining experiences. Chef Rah&apos;s Twisted Kitchen will
          review your request and follow up with availability, pricing, and next
          steps.
        </p>

        <form
          action="/api/personal-chef"
          method="POST"
          className="mt-8 space-y-5"
        >
          <input
            name="name"
            defaultValue={user?.name ?? session?.user?.name ?? ""}
            placeholder="Name"
            className="w-full rounded-xl border px-4 py-3"
            required
          />

          <input
            name="email"
            type="email"
            defaultValue={user?.email ?? session?.user?.email ?? ""}
            placeholder="Email"
            className="w-full rounded-xl border px-4 py-3"
            required
          />

          <input
            name="phone"
            placeholder="Phone"
            defaultValue={user?.phone ?? ""}
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            name="eventDate"
            type="datetime-local"
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            name="guestCount"
            type="number"
            min="1"
            placeholder="Number of guests / people served"
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            name="location"
            placeholder="Service location"
            defaultValue={
              user?.addressLine1
                ? `${user.addressLine1}${user.addressLine2 ? `, ${user.addressLine2}` : ""}, ${[
                    user.city,
                    user.state,
                    user.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}`
                : ""
            }
            className="w-full rounded-xl border px-4 py-3"
          />

          <textarea
            name="requestedMenu"
            rows={4}
            placeholder="What type of meal, menu, or service are you looking for?"
            className="w-full rounded-xl border px-4 py-3"
          />

          <textarea
            name="allergyNotes"
            rows={3}
            placeholder="Allergies or dietary restrictions"
            className="w-full rounded-xl border px-4 py-3"
          />

          <textarea
            name="specialRequests"
            rows={4}
            placeholder="Special requests, timing, setup needs, kitchen access, preferences, etc."
            className="w-full rounded-xl border px-4 py-3"
          />

          <button className="w-full rounded-xl bg-black px-5 py-3 font-medium text-white">
            Submit Personal Chef Request
          </button>
        </form>
      </div>
    </main>
  );
}