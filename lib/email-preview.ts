import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { render } from "react-email";
import type { ReactNode } from "react";

type SaveEmailPreviewInput = {
  from: string;
  to: string;
  subject: string;
  react: ReactNode;
  type?: string;
};

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function escapeHeader(value: string) {
  return value.replace(/\r?\n/g, " ");
}

function htmlToText(html: string) {
  let sanitized = html;
  let previous: string;

  do {
    previous = sanitized;
    sanitized = sanitized
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "");
  } while (sanitized !== previous);

  return sanitized
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function saveEmailPreview({
  from,
  to,
  subject,
  react,
  type,
}: SaveEmailPreviewInput) {
  const html = await render(react);
  const text = htmlToText(html);

  const now = new Date();
  const boundary = `email-preview-${now.getTime()}`;

  const fileName = `${now
    .toISOString()
    .replace(/[:.]/g, "-")}-${sanitizeFileName(type ?? subject)}.eml`;

  const previewDir = path.join(process.cwd(), ".email-previews");

  await mkdir(previewDir, { recursive: true });

  const filePath = path.join(previewDir, fileName);

  const eml = [
    `From: ${escapeHeader(from)}`,
    `To: ${escapeHeader(to)}`,
    `Subject: ${escapeHeader(subject)}`,
    `Date: ${now.toUTCString()}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    text || "Email preview generated.",
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    html,
    ``,
    `--${boundary}--`,
    ``,
  ].join("\r\n");

  await writeFile(filePath, eml, "utf8");

  return filePath;
}