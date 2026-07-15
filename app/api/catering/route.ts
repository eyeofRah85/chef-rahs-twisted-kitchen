import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendAppEmail, appUrl } from "@/lib/email";
import { CateringRequestEmail } from "@/emails/CateringRequestEmail";
import {
  serviceRequestErrorMessages,
  type ServiceRequestErrorCode,
} from "@/lib/service-request-form-errors";
import { rateLimitRequest, rateLimits } from "@/lib/rate-limit";
import {
  readServiceRequestEventDate,
  serviceRequestRedirect,
} from "@/lib/service-request-route";

function serviceRequestValidationError(
  request: Request,
  formPath: string,
  errorCode: ServiceRequestErrorCode,
) {
  const message = serviceRequestErrorMessages[errorCode];

  if (request.headers.get("accept")?.includes("text/html")) {
    return serviceRequestRedirect(formPath, { error: errorCode });
  }

  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimitRequest(
    request,
    rateLimits.serviceRequestCreate,
  );

  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  const session = await auth();
  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const eventDate = readServiceRequestEventDate(formData);
  const eventType = String(formData.get("eventType") ?? "").trim();
  const guestCountValue = String(formData.get("guestCount") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const requestedMenu = String(formData.get("requestedMenu") ?? "").trim();
  const allergyNotes = String(formData.get("allergyNotes") ?? "").trim();
  const specialRequests = String(formData.get("specialRequests") ?? "").trim();

  if (!name || !email) {
    return serviceRequestValidationError(
      request,
      "/catering",
      "missing-contact",
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return serviceRequestValidationError(request, "/catering", "invalid-email");
  }

  const parsedEventDate = eventDate ? new Date(eventDate) : null;

  if (parsedEventDate && Number.isNaN(parsedEventDate.getTime())) {
    return serviceRequestValidationError(
      request,
      "/catering",
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
      "/catering",
      "invalid-guest-count",
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
      eventDate: parsedEventDate,
      eventType: eventType || null,
      guestCount,
      location: location || null,
      requestedMenu: requestedMenu || null,
      allergyNotes: allergyNotes || null,
      specialRequests: specialRequests || null,
      requestType: "CATERING",
    },
  });
    await sendAppEmail({      
      to: email,
      subject: "Catering Request Received",
      react: CateringRequestEmail({
        customerName: requestRecord.name,
        requestId: requestRecord.id,
        requestType: requestRecord.requestType,
        eventType: requestRecord.eventType ?? "Catering Request",
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

  return serviceRequestRedirect("/catering/thank-you", {
    id: requestRecord.id,
  });
}
