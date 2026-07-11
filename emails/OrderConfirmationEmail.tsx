import { Button, Hr, Section, Text } from "react-email";
import { BrandedEmailLayout } from "@/emails/BrandedEmailLayout";
import { emailStyles } from "@/emails/styles";
import {
  formatApprovalStatus,
  formatOrderType,
  formatPaymentStatus,
} from "@/lib/format-labels";
import {
  getWeeklyMealPlanSelectionDetails,
  type WeeklyOrderSelectionDisplay,
} from "@/lib/weekly-order-display";

type OrderEmailItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string | null;
  weeklyMealPlanSelection?: WeeklyOrderSelectionDisplay | null;
};

type Props = {
  customerName: string;
  orderId: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  lateFee: number;
  tipAmount: number;
  orderType: string;
  paymentStatus?: string | null;
  approvalStatus?: string | null;
  orderUrl?: string | null;
  items: OrderEmailItem[];
  allergenAcknowledged?: boolean;
  allergenAcknowledgedAt?: Date | string | null;

  deliveryName?: string | null;
  deliveryPhone?: string | null;
  deliveryAddressLine1?: string | null;
  deliveryAddressLine2?: string | null;
  deliveryCity?: string | null;
  deliveryState?: string | null;
  deliveryPostalCode?: string | null;
  deliveryNotes?: string | null;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Text style={emailStyles.row}>
      <span style={emailStyles.label}>{label}:</span> {value}
    </Text>
  );
}

export function OrderConfirmationEmail({
  customerName,
  orderId,
  total,
  orderType,
  paymentStatus,
  approvalStatus,
  subtotal,
  deliveryFee,
  lateFee,
  tipAmount,
  orderUrl,
  items,
  deliveryName,
  deliveryPhone,
  deliveryAddressLine1,
  deliveryAddressLine2,
  deliveryCity,
  deliveryState,
  deliveryPostalCode,
  deliveryNotes,
  allergenAcknowledged,
  allergenAcknowledgedAt,
}: Props) {
  const isDelivery = orderType === "DELIVERY";
  const address = deliveryAddressLine1
    ? `${deliveryAddressLine1}${deliveryAddressLine2 ? `, ${deliveryAddressLine2}` : ""}`
    : "Not provided";
  const cityStateZip =
    [deliveryCity, deliveryState, deliveryPostalCode].filter(Boolean).join(", ") ||
    "Not provided";

  return (
    <BrandedEmailLayout
      preview="Your Chef Rah's Twisted Kitchen order has been received."
      eyebrow="Order received"
      title="Order Confirmation"
    >
      <Text style={emailStyles.text}>Hello {customerName},</Text>

      <Text style={emailStyles.text}>
        Thank you for your order with Chef Rah&apos;s Twisted Kitchen. Your
        order has been received and is now being processed.
      </Text>

      <Section style={emailStyles.accentCard}>
        <Text style={emailStyles.cardTitle}>Order Snapshot</Text>
        <DetailRow label="Order ID" value={orderId} />
        <DetailRow label="Order Type" value={formatOrderType(orderType)} />
        <DetailRow label="Payment" value={formatPaymentStatus(paymentStatus)} />
        <DetailRow
          label="Approval"
          value={formatApprovalStatus(approvalStatus)}
        />
        <Text style={emailStyles.totalText}>${total.toFixed(2)}</Text>
      </Section>

      <Section style={emailStyles.card}>
        <Text style={emailStyles.cardTitle}>Contact / Delivery Information</Text>
        <DetailRow label="Name" value={deliveryName ?? customerName} />
        <DetailRow label="Phone" value={deliveryPhone ?? "Not provided"} />

        {isDelivery && (
          <>
            <DetailRow label="Address" value={address} />
            <DetailRow label="City/State/ZIP" value={cityStateZip} />
            {deliveryNotes && (
              <DetailRow label="Delivery Notes" value={deliveryNotes} />
            )}
          </>
        )}
      </Section>

      {allergenAcknowledged && (
        <Section style={emailStyles.alertBox}>
          <Text style={emailStyles.cardTitle}>Allergen Warning Acknowledged</Text>
          <Text style={emailStyles.mutedText}>
            You acknowledged that this order may contain allergen tags matching
            your account preferences before submitting.
          </Text>

          {allergenAcknowledgedAt && (
            <DetailRow
              label="Acknowledged"
              value={new Date(allergenAcknowledgedAt).toLocaleString()}
            />
          )}
        </Section>
      )}

      <Section style={emailStyles.section}>
        <Text style={emailStyles.heading}>Order Summary</Text>

        {items.map((item, index) => {
          const weeklyDetails = item.weeklyMealPlanSelection
            ? getWeeklyMealPlanSelectionDetails(item.weeklyMealPlanSelection)
            : [];

          return (
            <Section key={`${item.name}-${index}`} style={emailStyles.card}>
              <Text style={emailStyles.cardTitle}>
                {item.quantity} x {item.name}
              </Text>

              <DetailRow
                label="Item total"
                value={`$${item.unitPrice.toFixed(2)} each - $${item.lineTotal.toFixed(2)}`}
              />

              {weeklyDetails.length > 0 && (
                <Section style={emailStyles.alertBox}>
                  <Text style={emailStyles.cardTitle}>
                    Weekly Meal Plan Snapshot
                  </Text>

                  {weeklyDetails.map((detail) => (
                    <DetailRow
                      key={detail.label}
                      label={detail.label}
                      value={detail.value}
                    />
                  ))}
                </Section>
              )}

              {item.notes && (
                <Text style={{ ...emailStyles.mutedText, whiteSpace: "pre-wrap" }}>
                  {item.notes}
                </Text>
              )}
            </Section>
          );
        })}
      </Section>

      <Section style={emailStyles.card}>
        <Text style={emailStyles.cardTitle}>Payment Summary</Text>
        <DetailRow label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
        <DetailRow label="Delivery Fee" value={`$${deliveryFee.toFixed(2)}`} />
        <DetailRow label="Late Fee" value={`$${lateFee.toFixed(2)}`} />
        <DetailRow label="Tip" value={`$${tipAmount.toFixed(2)}`} />
        <Hr style={emailStyles.divider} />
        <Text style={emailStyles.totalText}>${total.toFixed(2)}</Text>
      </Section>

      {orderUrl && (
        <Button href={orderUrl} style={emailStyles.button}>
          View Order Details
        </Button>
      )}

      <Text style={{ ...emailStyles.mutedText, marginTop: "18px" }}>
        {orderUrl
          ? "You can log into your account to track status updates and payment information."
          : "Keep this email for your records. Chef Rah's Twisted Kitchen will contact you with status and payment updates."}
      </Text>
    </BrandedEmailLayout>
  );
}
