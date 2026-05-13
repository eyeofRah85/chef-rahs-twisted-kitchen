export type OrderType = "delivery" | "pickup" | "catering";

export type TipType =
  | "none"
  | "10"
  | "15"
  | "20"
  | "custom";

export type PaymentMethod = "manual" | "cash" | "stripe";

export type CheckoutDetails = {
  orderType: OrderType;
  requestedDateTime: string;
  allergyNotes: string;
  substitutionPreference: string;
  tipType: TipType;
  customTipAmount?: number;

  paymentMethod: PaymentMethod;
  payByDate: string;
};