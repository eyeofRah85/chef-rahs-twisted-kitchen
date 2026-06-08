import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendAppEmail, appUrl } from "@/lib/email";
import { CateringRequestEmail } from "@/emails/CateringRequestEmail";
import {
  serviceRequestErrorMessages,
  type ServiceRequestErrorCode,
} from "@/lib/service-request-form-errors";

function serviceRequestValidationError(
  request: Request,
  formPath: string,
  errorCode: ServiceRequestErrorCode,
) {
  const message = serviceRequestErrorMessages[errorCode];

  if (request.headers.get("accept")?.includes("text/html")) {
    const formUrl = new URL(formPath, request.url);
    formUrl.searchParams.set("error", errorCode);

    return NextResponse.redirect(formUrl, { status: 303 });
  }

  return NextResponse.json({ error: message }, { status: 400 });
}

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
    return serviceRequestValidationError(
      request,
      "/personal-chef",
      "missing-contact",
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return serviceRequestValidationError(
      request,
      "/personal-chef",
      "invalid-email",
    );
  }

  const parsedEventDate = eventDate ? new Date(eventDate) : null;

  if (parsedEventDate && Number.isNaN(parsedEventDate.getTime())) {
    return serviceRequestValidationError(
      request,
      "/personal-chef",
      "invalid-event-date",
    );
  }

  const guestCount = guestCountValue ? Number(guestCountValue) : null;

  if (
    guestCount !== null &&
    (!Number.isInteger(guestCount) || guestCount < 1)
  ) {
    return serviceRequestValidationError(
      request,
      "/personal-chef",
      "invalid-guest-count",
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
