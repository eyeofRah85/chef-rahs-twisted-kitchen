import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Button
} from "react-email";
import { emailStyles } from "@/emails/styles";
import {
  formatApprovalStatus,
  formatOrderType,
  formatPaymentStatus,
} from "@/lib/format-labels";

type OrderEmailItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string | null;
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
  orderUrl: string;
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

  return (
    <Html>
      <Head />

      <Preview>
        Your Chef Rah&apos;s Twisted Kitchen order has been received.
      </Preview>

      <Body
        style={emailStyles.body}
      >
        <Container
          style={emailStyles.container}
        >
          <Heading>Order Confirmation</Heading>

          <Text>Hello {customerName},</Text>

          <Text>
            Thank you for your order with Chef Rah&apos;s Twisted Kitchen.
          </Text>

          <Section>
            <Text>
              <strong>Order ID:</strong> {orderId}
            </Text>

            <Text>
              <strong>Order Type:</strong> {formatOrderType(orderType)}
            </Text>
            <Text>
              <strong>Payment:</strong> {formatPaymentStatus(paymentStatus)}
            </Text>

            <Text>
              <strong>Approval:</strong> {formatApprovalStatus(approvalStatus)}
            </Text>

            <Hr />

            <Heading as="h2">Contact / Delivery Information</Heading>

            <Text>
              <strong>Name:</strong> {deliveryName ?? customerName}
            </Text>

            <Text>
              <strong>Phone:</strong> {deliveryPhone ?? "Not provided"}
            </Text>

            {isDelivery && (
              <>
                <Text>
                  <strong>Address:</strong>{" "}
                  {deliveryAddressLine1
                    ? `${deliveryAddressLine1}${
                        deliveryAddressLine2 ? `, ${deliveryAddressLine2}` : ""
                      }`
                    : "Not provided"}
                </Text>

                <Text>
                  <strong>City/State/ZIP:</strong>{" "}
                  {[deliveryCity, deliveryState, deliveryPostalCode]
                    .filter(Boolean)
                    .join(", ") || "Not provided"}
                </Text>

                {deliveryNotes && (
                  <Text>
                    <strong>Delivery Notes:</strong> {deliveryNotes}
                  </Text>
                )}                
              </>
            )}
            <Heading as="h2">Order Summary</Heading>
              {allergenAcknowledged && (
                <>
                  <Hr />

                  <Heading as="h2">Allergen Warning Acknowledged</Heading>

                  <Text>
                    You acknowledged that this order may contain allergen tags matching your
                    account preferences before submitting.
                  </Text>

                  {allergenAcknowledgedAt && (
                    <Text>
                      <strong>Acknowledged:</strong>{" "}
                      {new Date(allergenAcknowledgedAt).toLocaleString()}
                    </Text>
                  )}
                </>
              )}
            {items.map((item, index) => (
              <Section key={`${item.name}-${index}`}>
                <Text>
                  <strong>
                    {item.quantity} x {item.name}
                  </strong>
                </Text>

                <Text>
                  ${item.unitPrice.toFixed(2)} each - ${item.lineTotal.toFixed(2)}
                </Text>

                {item.notes && (
                  <Text style={{ whiteSpace: "pre-wrap" }}>
                    {item.notes}
                  </Text>
                )}
              </Section>
            ))}

            <Hr />

            <Text>
              <strong>Subtotal:</strong> ${subtotal.toFixed(2)}
            </Text>

            <Text>
              <strong>Delivery Fee:</strong> ${deliveryFee.toFixed(2)}
            </Text>

            <Text>
              <strong>Late Fee:</strong> ${lateFee.toFixed(2)}
            </Text>

            <Text>
              <strong>Tip:</strong> ${tipAmount.toFixed(2)}
            </Text>

            <Text>
              <strong>Total:</strong> ${total.toFixed(2)}
            </Text>

            <Button
              href={orderUrl}
              style={emailStyles.button}
            >
              View Order Details
            </Button>
          </Section>

          <Hr />

          <Text>
            Your order has been received and is now being processed.
          </Text>

          <Text>
            You can log into your account to track status updates and payment
            information.
          </Text>

          <Hr />

          <Text
            style={emailStyles.footerText}
          >
            Chef Rah&apos;s Twisted Kitchen
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
