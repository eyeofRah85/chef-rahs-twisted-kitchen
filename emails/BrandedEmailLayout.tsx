import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "react-email";
import { appUrl } from "@/lib/email";
import { brandEmail, emailStyles } from "@/emails/styles";

type Props = {
  preview: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
};

const logoUrl = new URL(brandEmail.logoPath, appUrl).toString();

export function BrandedEmailLayout({
  preview,
  eyebrow,
  title,
  children,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>

      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <Section style={emailStyles.header}>
            <Section style={emailStyles.headerLogoRow}>
              <Section style={emailStyles.logoCell}>
                <Img
                  src={logoUrl}
                  width="64"
                  height="64"
                  alt="Chef Rah's Twisted Kitchen"
                  style={emailStyles.logo}
                />
              </Section>

              <Section style={emailStyles.brandCell}>
                <Text style={emailStyles.brandName}>
                  {brandEmail.name}
                </Text>
                <Text style={emailStyles.brandTagline}>
                  Fresh meals, bold flavor
                </Text>
              </Section>
            </Section>

            <Text style={emailStyles.headerEyebrow}>{eyebrow}</Text>
            <Text style={emailStyles.headerTitle}>{title}</Text>
          </Section>

          <Section style={emailStyles.content}>{children}</Section>

          <Section style={emailStyles.footer}>
            <Text style={emailStyles.footerBrand}>{brandEmail.name}</Text>
            <Text style={emailStyles.footerText}>
              {brandEmail.supportText}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
