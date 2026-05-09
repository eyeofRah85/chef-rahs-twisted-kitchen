"use client";

import { create } from "zustand";
import type { CheckoutDetails } from "@/types/order";

type CheckoutState = {
  details: CheckoutDetails;

  updateField: <K extends keyof CheckoutDetails>(
    field: K,
    value: CheckoutDetails[K],
  ) => void;

  resetCheckout: () => void;
};

const defaultCheckout: CheckoutDetails = {
  orderType: "delivery",
  requestedDateTime: "",
  allergyNotes: "",
  substitutionPreference: "",
  tipType: "none",
  customTipAmount: 0,
};

export const useCheckoutStore = create<CheckoutState>((set) => ({
  details: defaultCheckout,

  updateField: (field, value) =>
    set((state) => ({
      details: {
        ...state.details,
        [field]: value,
      },
    })),

  resetCheckout: () =>
    set({
      details: defaultCheckout,
    }),
}));