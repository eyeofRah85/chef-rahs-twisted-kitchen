import { Button, Section, Text } from "react-email";
import { BrandedEmailLayout } from "@/emails/BrandedEmailLayout";
import { emailStyles } from "@/emails/styles";

type Props = {
  customerName: string;
  orderId: string;
  approved: boolean;
  approvalNote?: string | null;
  orderUrl: string;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Text style={emailStyles.row}>
      <span style={emailStyles.label}>{label}:</span> {value}
    </Text>
  );
}

export function OrderApprovalEmail({
  customerName,
  orderId,
  approved,
  approvalNote,
  orderUrl,
}: Props) {
  const statusLabel = approved ? "Approved" : "Not Approved";

  return (
    <BrandedEmailLayout
      preview={`Your order has been ${approved ? "approved" : "not approved"}.`}
      eyebrow="Order update"
      title={`Order ${statusLabel}`}
    >
      <Text style={emailStyles.text}>Hello {customerName},</Text>

      <Section style={approved ? emailStyles.accentCard : emailStyles.alertBox}>
        <Text style={emailStyles.cardTitle}>Status</Text>
        <Text style={emailStyles.text}>
          Your order has been {approved ? "approved" : "not approved"}.
        </Text>
        <DetailRow label="Order ID" value={orderId} />
        <Text style={emailStyles.statusPill}>{statusLabel}</Text>
      </Section>

      {approvalNote && (
        <Section style={emailStyles.card}>
          <Text style={emailStyles.cardTitle}>Note from Chef Rah</Text>
          <Text style={emailStyles.text}>{approvalNote}</Text>
        </Section>
      )}

      <Button href={orderUrl} style={emailStyles.button}>
        View Order Details
      </Button>

      <Text style={{ ...emailStyles.mutedText, marginTop: "18px" }}>
        You can log into your account to view order details and updates.
      </Text>
    </BrandedEmailLayout>
  );
}
