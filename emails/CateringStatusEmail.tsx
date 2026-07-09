import { Button, Section, Text } from "react-email";
import { BrandedEmailLayout } from "@/emails/BrandedEmailLayout";
import { emailStyles } from "@/emails/styles";
import {
  formatApprovalStatus,
  formatServiceRequestType,
  formatServiceRequestStatus,
} from "@/lib/format-labels";

type Props = {
  customerName: string;
  requestType?: string | null;
  eventType: string;
  status: string;
  approvalStatus: string;
  approvalNote?: string | null;
  estimatedTotal?: number | null;
  depositAmount?: number | null;
  requestUrl: string;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Text style={emailStyles.row}>
      <span style={emailStyles.label}>{label}:</span> {value}
    </Text>
  );
}

export function CateringStatusEmail({
  customerName,
  requestType,
  eventType,
  status,
  approvalStatus,
  approvalNote,
  estimatedTotal,
  depositAmount,
  requestUrl,
}: Props) {
  const requestLabel = formatServiceRequestType(requestType);
  const requestLabelLower = requestLabel.toLowerCase();

  return (
    <BrandedEmailLayout
      preview={`Your ${requestLabelLower} request has been updated.`}
      eyebrow="Request update"
      title={`${requestLabel} Request Update`}
    >
      <Text style={emailStyles.text}>Hello {customerName},</Text>

      <Text style={emailStyles.text}>
        Your {requestLabelLower} request has been updated.
      </Text>

      <Section style={emailStyles.accentCard}>
        <Text style={emailStyles.cardTitle}>Current Status</Text>
        <DetailRow label="Event" value={eventType} />
        <DetailRow
          label="Status"
          value={formatServiceRequestStatus(status)}
        />
        <DetailRow
          label="Approval"
          value={formatApprovalStatus(approvalStatus)}
        />
      </Section>

      {approvalNote && (
        <Section style={emailStyles.card}>
          <Text style={emailStyles.cardTitle}>Note from Chef Rah</Text>
          <Text style={emailStyles.text}>{approvalNote}</Text>
        </Section>
      )}

      {(estimatedTotal !== null && estimatedTotal !== undefined) ||
      (depositAmount !== null && depositAmount !== undefined) ? (
        <Section style={emailStyles.card}>
          <Text style={emailStyles.cardTitle}>Quote Details</Text>

          {estimatedTotal !== null && estimatedTotal !== undefined && (
            <DetailRow
              label="Estimated Total"
              value={`$${estimatedTotal.toFixed(2)}`}
            />
          )}

          {depositAmount !== null && depositAmount !== undefined && (
            <DetailRow
              label="Deposit"
              value={`$${depositAmount.toFixed(2)}`}
            />
          )}
        </Section>
      ) : null}

      <Button href={requestUrl} style={emailStyles.button}>
        View {requestLabel} Request
      </Button>

      <Text style={{ ...emailStyles.mutedText, marginTop: "18px" }}>
        You can log into your account to review request details, quote
        information, and deposit status.
      </Text>
    </BrandedEmailLayout>
  );
}
