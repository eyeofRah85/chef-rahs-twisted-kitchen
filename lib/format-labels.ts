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