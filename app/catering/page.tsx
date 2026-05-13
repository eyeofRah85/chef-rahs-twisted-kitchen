import { auth } from "@/auth";

export default async function CateringPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
          Catering
        </p>

        <h1 className="mt-3 text-4xl font-bold">Catering Request</h1>

        <p className="mt-4 text-neutral-700">
          Submit event details and Chef Rah&apos;s Twisted Kitchen will review
          your request. Catering may require a 50% deposit after quote approval.
        </p>

        <form action="/api/catering" method="POST" className="mt-8 space-y-5">
          <input
            name="name"
            defaultValue={session?.user?.name ?? ""}
            placeholder="Name"
            className="w-full rounded-xl border px-4 py-3"
            required
          />

          <input
            name="email"
            type="email"
            defaultValue={session?.user?.email ?? ""}
            placeholder="Email"
            className="w-full rounded-xl border px-4 py-3"
            required
          />

          <input
            name="phone"
            placeholder="Phone"
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            name="eventDate"
            type="datetime-local"
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            name="eventType"
            placeholder="Event type, e.g. wedding, party, corporate lunch"
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            name="guestCount"
            type="number"
            min="1"
            placeholder="Guest count"
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            name="location"
            placeholder="Event location"
            className="w-full rounded-xl border px-4 py-3"
          />

          <textarea
            name="requestedMenu"
            rows={4}
            placeholder="Requested menu or meal ideas"
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
            placeholder="Special requests, setup needs, timing, delivery notes, etc."
            className="w-full rounded-xl border px-4 py-3"
          />

          <button className="w-full rounded-xl bg-black px-5 py-3 font-medium text-white">
            Submit Catering Request
          </button>
        </form>
      </div>
    </main>
  );
}