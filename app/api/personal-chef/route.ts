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
  const eventDate = String(formData.get("eventDate") ?? "").trim();
  const guestCountValue = String(formData.get("guestCount") ?? "").trim();
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

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const parsedEventDate = eventDate ? new Date(eventDate) : null;

  if (parsedEventDate && Number.isNaN(parsedEventDate.getTime())) {
    return NextResponse.json(
      { error: "Please enter a valid event date." },
      { status: 400 },
    );
  }

  const guestCount = guestCountValue ? Number(guestCountValue) : null;

  if (
    guestCount !== null &&
    (!Number.isInteger(guestCount) || guestCount < 1)
  ) {
    return NextResponse.json(
      { error: "Guest count must be a whole number greater than zero." },
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
      eventDate: parsedEventDate,
      eventType: "Personal Chef",
      guestCount,
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
      requestType: requestRecord.requestType,
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
