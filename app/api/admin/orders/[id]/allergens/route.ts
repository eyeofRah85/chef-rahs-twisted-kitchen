import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-guards";

export async function POST() {
  try {
    const { response } = await requireAdminApi();
    if (response) return response;

    return NextResponse.json(
      {
        error:
          "Order allergens are historical snapshots. Update allergens from the menu manager instead.",
      },
      { status: 410 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to process order allergen request.",
      },
      { status: 500 },
    );
  }
}
