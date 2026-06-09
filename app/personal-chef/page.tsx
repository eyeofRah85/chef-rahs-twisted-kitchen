import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServiceRequestErrorMessage } from "@/lib/service-request-form-errors";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function PersonalChefPage({ searchParams }: PageProps) {
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

        {errorMessage ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
          >
            {errorMessage}
          </div>
        ) : null}

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

          <div className="space-y-2">
            <input
              name="eventDate"
              type="datetime-local"
              aria-describedby="personal-chef-event-date-help"
              className="w-full rounded-xl border px-4 py-3"
            />
            <p
              id="personal-chef-event-date-help"
              className="text-sm text-neutral-600"
            >
              Choose the preferred service date and time if you already know
              it.
            </p>
          </div>

          <div className="space-y-2">
            <input
              name="guestCount"
              type="number"
              min="1"
              aria-describedby="personal-chef-guest-count-help"
              placeholder="Number of guests / people served"
              className="w-full rounded-xl border px-4 py-3"
            />
            <p
              id="personal-chef-guest-count-help"
              className="text-sm text-neutral-600"
            >
              Enter a whole number. Estimates are fine for planning the quote.
            </p>
          </div>

          <div className="space-y-2">
            <input
              name="location"
              aria-describedby="personal-chef-location-help"
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
            <p
              id="personal-chef-location-help"
              className="text-sm text-neutral-600"
            >
              Add the home, venue, kitchen, or service address.
            </p>
          </div>

          <div className="space-y-2">
            <textarea
              name="requestedMenu"
              rows={4}
              aria-describedby="personal-chef-requested-menu-help"
              placeholder="What type of meal, menu, or service are you looking for?"
              className="w-full rounded-xl border px-4 py-3"
            />
            <p
              id="personal-chef-requested-menu-help"
              className="text-sm text-neutral-600"
            >
              Share the meal, service style, kitchen access, or dining
              experience you want.
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
