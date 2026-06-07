import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
  Button
} from "react-email";
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
    <Html>
      <Head />

      <Preview>Your {requestLabelLower} deposit has been received.</Preview>

      <Body
        style={emailStyles.body}
      >
        <Container
          style={emailStyles.container}
        >
          <Heading>{requestLabel} Deposit Received</Heading>

          <Text>Hello {customerName},</Text>

          <Text>Your {requestLabelLower} deposit has been marked as received.</Text>

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
            Thank you. Your {requestLabelLower} request can now continue through the
            planning process.
          </Text>
            <Button
              href={requestUrl}
              style={emailStyles.button}
            >
              View {requestLabel} Request
            </Button>
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
