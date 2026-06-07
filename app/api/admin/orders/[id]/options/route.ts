import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";

export async function POST() {
  try {
    await requireAdmin();

    return NextResponse.json(
      {
        error:
          "Order options are historical snapshots. Update menu item options from the menu manager instead.",
      },
      { status: 410 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to process order option request.",
      },
      { status: 500 },
    );
  }
}
