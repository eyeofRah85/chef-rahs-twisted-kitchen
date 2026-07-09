import { Button, Section, Text } from "react-email";
import { BrandedEmailLayout } from "@/emails/BrandedEmailLayout";
import { emailStyles } from "@/emails/styles";
import { formatServiceRequestType } from "@/lib/format-labels";

type Props = {
  customerName: string;
  requestType?: string | null;
  eventType: string;
  depositAmount: number;
  paidAt: string;
  requestUrl: string;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Text style={emailStyles.row}>
      <span style={emailStyles.label}>{label}:</span> {value}
    </Text>
  );
}

export function CateringDepositPaidEmail({
  customerName,
  requestType,
  eventType,
  depositAmount,
  paidAt,
  requestUrl,
}: Props) {
  const requestLabel = formatServiceRequestType(requestType);
  const requestLabelLower = requestLabel.toLowerCase();

  return (
    <BrandedEmailLayout
      preview={`Your ${requestLabelLower} deposit has been received.`}
      eyebrow="Deposit update"
      title={`${requestLabel} Deposit Received`}
    >
      <Text style={emailStyles.text}>Hello {customerName},</Text>

      <Text style={emailStyles.text}>
        Your {requestLabelLower} deposit has been marked as received. Thank you.
        Your request can now continue through the planning process.
      </Text>

      <Section style={emailStyles.accentCard}>
        <Text style={emailStyles.cardTitle}>Deposit Summary</Text>
        <DetailRow label="Event" value={eventType} />
        <DetailRow label="Paid At" value={paidAt} />
        <Text style={emailStyles.totalText}>${depositAmount.toFixed(2)}</Text>
      </Section>

      <Button href={requestUrl} style={emailStyles.button}>
        View {requestLabel} Request
      </Button>
    </BrandedEmailLayout>
  );
}
