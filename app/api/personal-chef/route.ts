import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
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

function isValidEmail(value: string) {
  const email = value.trim();

  if (!email || email.length > 254) return false;

  for (const character of email) {
    if (character.trim() === "") return false;
  }

  const atIndex = email.indexOf("@");

  if (atIndex <= 0 || atIndex !== email.lastIndexOf("@")) return false;

  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);

  if (!domain || localPart.length > 64 || domain.length > 253) return false;

  return (
    domain.includes(".") &&
    !domain.startsWith(".") &&
    !domain.endsWith(".") &&
    !domain.includes("..")
  );
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

  if (!isValidEmail(email)) {
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

  return serviceRequestRedirect("/personal-chef/thank-you", {
    id: requestRecord.id,
  });
}
