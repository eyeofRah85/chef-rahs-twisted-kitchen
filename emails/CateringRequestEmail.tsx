import { Button, Section, Text } from "react-email";
import { BrandedEmailLayout } from "@/emails/BrandedEmailLayout";
import { emailStyles } from "@/emails/styles";
import { formatServiceRequestType } from "@/lib/format-labels";

type Props = {
  customerName: string;
  requestId: string;
  requestType?: string | null;
  eventType: string;
  guestCount: number | null;
  eventDate: string | null;
  location?: string | null;
  requestedMenu?: string | null;
  specialRequests?: string | null;
  requestUrl: string;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Text style={emailStyles.row}>
      <span style={emailStyles.label}>{label}:</span> {value}
    </Text>
  );
}

export function CateringRequestEmail({
  customerName,
  requestType,
  eventType,
  guestCount,
  eventDate,
  requestedMenu,
  location,
  specialRequests,
  requestUrl,
}: Props) {
  const requestLabel = formatServiceRequestType(requestType);
  const requestLabelLower = requestLabel.toLowerCase();

  return (
    <BrandedEmailLayout
      preview={`Your ${requestLabelLower} request has been received.`}
      eyebrow="Request received"
      title={`${requestLabel} Request Received`}
    >
      <Text style={emailStyles.text}>Hello {customerName},</Text>

      <Text style={emailStyles.text}>
        Thank you for contacting Chef Rah&apos;s Twisted Kitchen for your{" "}
        {requestLabelLower} request. Your request has been received and will be
        reviewed shortly.
      </Text>

      <Section style={emailStyles.accentCard}>
        <Text style={emailStyles.cardTitle}>Request Details</Text>
        <DetailRow label="Event Type" value={eventType} />
        <DetailRow
          label="Guest Count"
          value={guestCount?.toString() ?? "Not provided"}
        />
        <DetailRow label="Event Date" value={eventDate ?? "Not provided"} />
        <DetailRow label="Location" value={location ?? "Not provided"} />
      </Section>

      {(requestedMenu || specialRequests) && (
        <Section style={emailStyles.card}>
          <Text style={emailStyles.cardTitle}>Menu & Notes</Text>

          {requestedMenu && (
            <DetailRow label="Requested Menu" value={requestedMenu} />
          )}

          {specialRequests && (
            <DetailRow label="Special Requests" value={specialRequests} />
          )}
        </Section>
      )}

      <Button href={requestUrl} style={emailStyles.button}>
        View {requestLabel} Request
      </Button>

      <Text style={{ ...emailStyles.mutedText, marginTop: "18px" }}>
        You can log into your account to track approval status, quotes, and
        deposit information.
      </Text>
    </BrandedEmailLayout>
  );
}
