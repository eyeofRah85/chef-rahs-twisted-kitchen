import { notFound } from "next/navigation";

export function assertEmailPreviewAvailable() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
}
