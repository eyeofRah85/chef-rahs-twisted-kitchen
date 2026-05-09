export default function AdminPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Admin Dashboard
          </p>
          <h1 className="mt-3 text-4xl font-bold">Kitchen Control Center</h1>
          <p className="mt-3 max-w-2xl text-neutral-700">
            This dashboard will allow the chef to manage menu items, seasonal
            availability, order statuses, catering requests, reports, payment
            settings, and business rules.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            "Orders",
            "Menu Manager",
            "Seasonal Items",
            "Catering Requests",
            "Customers",
            "Reports",
            "Business Settings",
            "Payment Settings",
            "Notifications",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold">{item}</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Coming soon.
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}