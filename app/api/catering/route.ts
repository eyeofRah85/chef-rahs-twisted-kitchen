import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const eventDate = String(formData.get("eventDate") ?? "");
  const eventType = String(formData.get("eventType") ?? "").trim();
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
      eventType: eventType || null,
      guestCount: guestCount > 0 ? guestCount : null,
      location: location || null,
      requestedMenu: requestedMenu || null,
      allergyNotes: allergyNotes || null,
      specialRequests: specialRequests || null,
    },
  });

  return NextResponse.redirect(
    new URL(`/catering/thank-you?id=${requestRecord.id}`, request.url),
  );
}