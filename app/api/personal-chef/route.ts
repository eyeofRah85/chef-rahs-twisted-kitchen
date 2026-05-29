import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendAppEmail, appUrl } from "@/lib/email";
import { CateringRequestEmail } from "@/emails/CateringRequestEmail";

export async function POST(request: Request) {
  const session = await auth();
  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const eventDate = String(formData.get("eventDate") ?? "");
  const guestCount = Number(formData.get("guestCount") ?? 0);
  const location = String(formData.get("location") ?? "").trim();
  const requestedMenu = String(formData.get("requestedMenu") ?? "").trim();
  const allergyNotes = String(formData.get("allergyNotes") ?? "").trim();
  const specialRequests = String(formData.get("specialRequests") ?? "").trim();

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required." },
      { status: 400 },
    );
  }

  const requestRecord = await prisma.cateringRequest.create({
    data: {
      requestType: "PERSONAL_CHEF",

      user: session?.user?.email
        ? {
            connect: {
              email: session.user.email,
            },
          }
        : undefined,

      name,
      email,
      phone: phone || null,
      eventDate: eventDate ? new Date(eventDate) : null,
      eventType: "Personal Chef",
      guestCount: guestCount > 0 ? guestCount : null,
      location: location || null,
      requestedMenu: requestedMenu || null,
      allergyNotes: allergyNotes || null,
      specialRequests: specialRequests || null,
    },
  });

  await sendAppEmail({
    to: email,
    subject: "Personal Chef Request Received",
    react: CateringRequestEmail({
      customerName: requestRecord.name,
      requestId: requestRecord.id,
      eventType: "Personal Chef",
      guestCount: requestRecord.guestCount,
      eventDate: requestRecord.eventDate
        ? requestRecord.eventDate.toLocaleString()
        : null,
      location: requestRecord.location,
      requestedMenu: requestRecord.requestedMenu,
      specialRequests: requestRecord.specialRequests,
      requestUrl: `${appUrl}/account/catering/${requestRecord.id}`,
    }),
  });

  return NextResponse.redirect(
    new URL(`/personal-chef/thank-you?id=${requestRecord.id}`, request.url),
  );
}