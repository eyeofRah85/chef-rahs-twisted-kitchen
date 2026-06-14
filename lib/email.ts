import { Resend } from "resend";
import type { ReactNode } from "react";
import { saveEmailPreview } from "@/lib/email-preview";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

  export function canSendEmail() {
  return Boolean(process.env.RESEND_API_KEY);
}

export const emailFromAddress =
  process.env.EMAIL_FROM_ADDRESS ??
  "Chef Rah's Twisted Kitchen <orders@example.com>";

export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const emailDryRun = process.env.EMAIL_DRY_RUN === "true";
const emailPreviewFiles = process.env.EMAIL_PREVIEW_FILES === "true";

type SendAppEmailInput = {
  to: string;
  subject: string;
  react: ReactNode;
  type?:string;
};

export async function sendAppEmail({
  to,
  subject,
  react,
  type,
}: SendAppEmailInput) {
  try {
    if (emailDryRun) {
      console.log("[EMAIL DRY RUN]", {
        type,
        to,
        subject,
        hasReactTemplate: Boolean(react),
      });

      if (emailPreviewFiles) {
        const filePath = await saveEmailPreview({
          from: emailFromAddress,
          to,
          subject,
          react,
          type,
        });

        console.log("[EMAIL PREVIEW SAVED]", filePath);
      }

      return;
    }

    if (!resend) {
      console.warn("Email skipped: RESEND_API_KEY is not configured.");
      return;
    }

    await resend.emails.send({
      from: emailFromAddress,
      to,
      subject,
      react,
    });
  } catch (emailError) {
    console.error(`Failed to send email: ${subject}`, emailError);
  }
}


