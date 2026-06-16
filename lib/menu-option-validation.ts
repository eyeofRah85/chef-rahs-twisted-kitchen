import { parsePublicImageUrl } from "@/lib/image-urls";

export class MenuOptionValidationError extends Error {
  name = "MenuOptionValidationError";
}

export type MenuOptionChoiceInput = {
  name?: unknown;
  description?: unknown;
  dietaryInfo?: unknown;
  imageUrl?: unknown;
  requestOnly?: unknown;
  priceDelta?: unknown;
};

export type NormalizedMenuOptionChoice = {
  name: string;
  description: string | null;
  dietaryInfo: string | null;
  imageUrl: string | null;
  requestOnly: boolean;
  priceDelta: number;
};

function parseOptionalText(value: unknown, fieldName: string) {
  if (value == null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new MenuOptionValidationError(`${fieldName} must be text.`);
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function parsePriceDelta(value: unknown) {
  if (value == null || value === "") {
    return 0;
  }

  const priceDelta =
    typeof value === "number" || typeof value === "string"
      ? Number(value)
      : Number.NaN;

  if (!Number.isFinite(priceDelta) || priceDelta < 0) {
    throw new MenuOptionValidationError(
      "Option price deltas must be zero or more.",
    );
  }

  return priceDelta;
}

function parseChoiceImageUrl(value: unknown) {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new MenuOptionValidationError("Enter a valid public image URL.");
  }

  try {
    return parsePublicImageUrl(value);
  } catch {
    throw new MenuOptionValidationError("Enter a valid public image URL.");
  }
}

export function normalizeMenuOptionGroupName(value: unknown) {
  const groupName = parseOptionalText(value, "Option group name");

  if (!groupName) {
    throw new MenuOptionValidationError("Option group name is required.");
  }

  return groupName;
}

export function normalizeMenuOptionChoice(
  choice: MenuOptionChoiceInput,
): NormalizedMenuOptionChoice {
  const name = parseOptionalText(choice.name, "Option choice name");

  if (!name) {
    throw new MenuOptionValidationError(
      "Each option choice requires a name.",
    );
  }

  return {
    name,
    description: parseOptionalText(choice.description, "Description"),
    dietaryInfo: parseOptionalText(choice.dietaryInfo, "Dietary info"),
    imageUrl: parseChoiceImageUrl(choice.imageUrl),
    requestOnly: choice.requestOnly === true || choice.requestOnly === "on",
    priceDelta: parsePriceDelta(choice.priceDelta),
  };
}

export function isMenuOptionValidationError(error: unknown) {
  return error instanceof MenuOptionValidationError;
}
