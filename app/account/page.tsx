import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
          Account
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Welcome, {session.user.name}
        </h1>

        <div className="mt-8 rounded-xl bg-neutral-100 p-5">
          <pre className="overflow-auto text-xs">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  );
}