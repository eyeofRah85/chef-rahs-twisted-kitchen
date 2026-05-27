import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "react-email";

type Props = {
  customerName: string;
  eventType: string;
  depositAmount: number;
  paidAt: string;
};

export function CateringDepositPaidEmail({
  customerName,
  eventType,
  depositAmount,
  paidAt,
}: Props) {
  return (
    <Html>
      <Head />

      <Preview>Your catering deposit has been received.</Preview>

      <Body
        style={{
          backgroundColor: "#f5f5f5",
          fontFamily: "Arial, sans-serif",
          padding: "40px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "40px",
            maxWidth: "600px",
          }}
        >
          <Heading>Catering Deposit Received</Heading>

          <Text>Hello {customerName},</Text>

          <Text>Your catering deposit has been marked as received.</Text>

          <Text>
            <strong>Event:</strong> {eventType}
          </Text>

          <Text>
            <strong>Deposit:</strong> ${depositAmount.toFixed(2)}
          </Text>

          <Text>
            <strong>Paid At:</strong> {paidAt}
          </Text>

          <Hr />

          <Text>
            Thank you. Your catering request can now continue through the
            planning process.
          </Text>

          <Text
            style={{
              fontSize: "12px",
              color: "#666666",
            }}
          >
            Chef Rah&apos;s Twisted Kitchen
          </Text>
        </Container>
      </Body>
    </Html>
  );
}