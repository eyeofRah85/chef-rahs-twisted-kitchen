import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guards";
import { BusinessSettingsForm } from "@/components/admin/BusinessSettingsForm";
import Link from "next/link";
import { getBusinessSettings } from "@/lib/business-settings";

export default async function AdminSettingsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const settings = await getBusinessSettings();

  return (
    <main className="admin-page">
      <div className="admin-container max-w-5xl">
        <Link className="admin-back-link" href="/admin">
          &larr; Back to Dashboard
        </Link>
        <div className="mb-8">
          <p className="admin-eyebrow mt-5">Admin</p>

          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Business Settings
          </h1>

          <p className="mt-3 max-w-2xl text-[#6b5a50]">
            Manage order rules, delivery fees, late fees, service request
            deposits, and operating preferences.
          </p>
        </div>

        <BusinessSettingsForm settings={settings} />
      </div>
    </main>
  );
}
