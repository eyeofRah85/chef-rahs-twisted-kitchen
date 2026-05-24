import { NextResponse } from "next/server";
import { getBusinessSettings } from "@/lib/business-settings";

export async function GET() {
  const settings = await getBusinessSettings();

  return NextResponse.json(settings);
}