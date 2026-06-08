import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServiceRequestErrorMessage } from "@/lib/service-request-form-errors";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function CateringPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;
  const errorMessage = getServiceRequestErrorMessage(params.error);

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
          Catering
        </p>

        <h1 className="mt-3 text-4xl font-bold">Catering Request</h1>

        <p className="mt-4 text-neutral-700">
          Submit event details and Chef Rah&apos;s Twisted Kitchen will review
          your request. Catering may require a 50% deposit after quote approval.
        </p>

        {errorMessage ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
          >
            {errorMessage}
          </div>
        ) : null}

        <form action="/api/catering" method="POST" className="mt-8 space-y-5">
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

          <div className="space-y-2">
            <input
              name="eventDate"
              type="datetime-local"
              aria-describedby="catering-event-date-help"
              className="w-full rounded-xl border px-4 py-3"
            />
            <p
              id="catering-event-date-help"
              className="text-sm text-neutral-600"
            >
              Choose the event date and time if you already know it.
            </p>
          </div>

          <input
            name="eventType"
            placeholder="Event type, e.g. wedding, party, corporate lunch"
            className="w-full rounded-xl border px-4 py-3"
          />

          <div className="space-y-2">
            <input
              name="guestCount"
              type="number"
              min="1"
              aria-describedby="catering-guest-count-help"
              placeholder="Guest count"
              className="w-full rounded-xl border px-4 py-3"
            />
            <p
              id="catering-guest-count-help"
              className="text-sm text-neutral-600"
            >
              Enter a whole number. Estimates are okay for the first request.
            </p>
          </div>

          <div className="space-y-2">
            <input
              name="location"
              aria-describedby="catering-location-help"
              placeholder="Event location"
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
            <p
              id="catering-location-help"
              className="text-sm text-neutral-600"
            >
              Add the event address, venue, or delivery/service location.
            </p>
          </div>

          <div className="space-y-2">
            <textarea
              name="requestedMenu"
              rows={4}
              aria-describedby="catering-requested-menu-help"
              placeholder="Requested menu or meal ideas"
              className="w-full rounded-xl border px-4 py-3"
            />
            <p
              id="catering-requested-menu-help"
              className="text-sm text-neutral-600"
            >
              Share dishes, service style, or menu ideas you have in mind.
            </p>
          </div>

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
