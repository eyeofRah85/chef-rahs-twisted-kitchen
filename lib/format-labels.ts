export function formatOrderType(type: string | null | undefined) {
  switch (type) {
    case "DELIVERY":
    case "delivery":
      return "Delivery";

    case "PICKUP":
    case "pickup":
      return "Pickup";

    default:
      return type
        ? type
            .toLowerCase()
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
        : "Not set";
  }
}

export function formatOrderStatus(status: string | null | undefined) {
  switch (status) {
    case "PENDING":
      return "Pending";

    case "ACCEPTED":
      return "Accepted";

    case "PREPARING":
      return "Preparing";

    case "READY":
      return "Ready";

    case "OUT_FOR_DELIVERY":
      return "Out for Delivery";

    case "COMPLETED":
      return "Completed";

    case "CANCELLED":
      return "Cancelled";

    case "REFUNDED":
      return "Refunded";

    default:
      return status
        ? status
            .toLowerCase()
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
        : "Not set";
  }
}

export function formatApprovalStatus(status: string | null | undefined) {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "APPROVED":
      return "Approved";
    case "DENIED":
      return "Denied";
    default:
      return status ?? "Not set";
  }
}

export function formatPaymentStatus(status: string | null | undefined) {
  switch (status) {
    case "PAY_BY_DATE":
      return "Pay By Date";
    case "OFFLINE_PAYMENT_DUE":
      return "Offline Payment Due";
    case "PAID":
      return "Paid";
    case "CANCELLED":
      return "Cancelled";
    case "REFUNDED":
      return "Refunded";
    default:
      return status
        ? status
            .toLowerCase()
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
        : "Not set";
  }
}

export function formatMenuItemType(type: string | null | undefined) {
  switch (type) {
    case "MEAL_PLAN":
      return "Meal Plan";

    case "A_LA_CARTE":
      return "A La Carte";

    case "CATERING":
      return "Catering Related";

    case "PLATE":
      return "Plate / Legacy";

    case "DESSERT":
      return "Dessert";

    case "SIDE":
      return "Side";

    case "OTHER":
      return "Other";

    default:
      return type
        ? type
            .toLowerCase()
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
        : "Not set";
  }
}

export function formatServiceRequestType(type: string | null | undefined) {
  switch (type) {
    case "CATERING":
      return "Catering";

    case "PERSONAL_CHEF":
      return "Personal Chef";

    default:
      return type
        ? type
            .toLowerCase()
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
        : "Service Request";
  }
}

export function formatServiceRequestStatus(
  status: string | null | undefined,
) {
  switch (status) {
    case "NEW":
      return "New";

    case "PENDING":
      return "Pending";

    case "REVIEWING":
      return "Reviewing";

    case "QUOTED":
      return "Quoted";

    case "APPROVED":
      return "Approved";

    case "DEPOSIT_DUE":
      return "Deposit Due";

    case "DEPOSIT_PAID":
      return "Deposit Paid";

    case "DENIED":
      return "Denied";

    case "CANCELLED":
      return "Cancelled";

    case "COMPLETED":
      return "Completed";

    default:
      return status
        ? status
            .toLowerCase()
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
        : "Not set";
  }
}

export function formatWeeklyMenuStatus(status: string | null | undefined) {
  switch (status) {
    case "DRAFT":
      return "Draft";

    case "PUBLISHED":
      return "Published";

    case "CLOSED":
      return "Closed";

    case "ARCHIVED":
      return "Archived";

    default:
      return status
        ? status
            .toLowerCase()
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
        : "Not set";
  }
}

export function formatWeeklyMealPlanOptionType(
  optionType: string | null | undefined,
) {
  switch (optionType) {
    case "SPICE_LEVEL":
      return "Spice Level";

    case "PROTEIN_SUBSTITUTION":
      return "Protein Substitution";

    default:
      return optionType
        ? optionType
            .toLowerCase()
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
        : "Not set";
  }
}

