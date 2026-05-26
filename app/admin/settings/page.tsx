import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { BusinessSettingsForm } from "@/components/admin/BusinessSettingsForm";
import Link from "next/link";

export default async function AdminSettingsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  let settings = await prisma.businessSettings.findFirst();

  if (!settings) {
    settings = await prisma.businessSettings.create({
      data: {},
    });
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
         <Link className="text-sm font-medium underline" href="/admin">
            &larr;  Back to Dashboard
          </Link>
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Admin
          </p>

          <h1 className="mt-3 text-4xl font-bold">Business Settings</h1>

          <p className="mt-3 text-neutral-700">
            Manage order rules, delivery fees, late fees, catering deposits,
            and operating preferences.
          </p>
        </div>

        <BusinessSettingsForm
          settings={{
            id: settings.id,
            deliveryFee: Number(settings.deliveryFee),
            lateFee: Number(settings.lateFee),
            cateringDepositPercent: settings.cateringDepositPercent,
            orderCutoffDay: settings.orderCutoffDay,
            orderCutoffHour: settings.orderCutoffHour,
            orderCutoffMinute: settings.orderCutoffMinute,
            noWeekendOrdering: settings.noWeekendOrdering,
            deliveryArea: settings.deliveryArea ?? "",
          }}
        />
      </div>
    </main>
  );
}