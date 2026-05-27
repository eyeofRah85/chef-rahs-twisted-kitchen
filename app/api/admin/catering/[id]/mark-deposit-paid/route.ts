import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { resend } from "@/lib/email";
import { CateringDepositPaidEmail } from "@/emails/CateringDepositPaidEmail";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    const updated = await prisma.cateringRequest.update({
      where: { id },
      data: {
        status: "DEPOSIT_PAID",
        depositPaidAt: new Date(),
      },
    });
      try {
        await resend.emails.send({
          from: "Chef Rah's Twisted Kitchen <orders@yourdomain.com>",
          to: updated.email,
          subject: "Catering Deposit Received",
          react: CateringDepositPaidEmail({
            customerName: updated.name,
            eventType: updated.eventType ?? "Catering Request",
            depositAmount: updated.depositAmount
              ? Number(updated.depositAmount)
              : 0,
            paidAt: updated.depositPaidAt
              ? updated.depositPaidAt.toLocaleString()
              : new Date().toLocaleString(),
          }),
        });
      } catch (emailError) {
        console.error("Failed to send catering deposit email", emailError);
      }
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to mark deposit as paid." },
      { status: 500 },
    );
  }
}