import { Button, Section, Text } from "react-email";
import { BrandedEmailLayout } from "@/emails/BrandedEmailLayout";
import { emailStyles } from "@/emails/styles";

type Props = {
  customerName: string;
  orderId: string;
  total: number;
  paidAt: string;
  orderUrl?: string | null;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Text style={emailStyles.row}>
      <span style={emailStyles.label}>{label}:</span> {value}
    </Text>
  );
}

export function PaymentReceivedEmail({
  customerName,
  orderId,
  total,
  paidAt,
  orderUrl,
}: Props) {
  return (
    <BrandedEmailLayout
      preview="Your payment has been marked as received."
      eyebrow="Payment update"
      title="Payment Received"
    >
      <Text style={emailStyles.text}>Hello {customerName},</Text>

      <Text style={emailStyles.text}>
        Your payment has been marked as received. Thank you for your order with
        Chef Rah&apos;s Twisted Kitchen.
      </Text>

      <Section style={emailStyles.accentCard}>
        <Text style={emailStyles.cardTitle}>Receipt Summary</Text>
        <DetailRow label="Order ID" value={orderId} />
        <DetailRow label="Paid At" value={paidAt} />
        <Text style={emailStyles.totalText}>${total.toFixed(2)}</Text>
      </Section>

      {orderUrl && (
        <Button href={orderUrl} style={emailStyles.button}>
          View Order Details
        </Button>
      )}

      {!orderUrl && (
        <Text style={{ ...emailStyles.mutedText, marginTop: "18px" }}>
          Keep this email for your records. Chef Rah&apos;s Twisted Kitchen will
          contact you if anything else is needed.
        </Text>
      )}
    </BrandedEmailLayout>
  );
}
