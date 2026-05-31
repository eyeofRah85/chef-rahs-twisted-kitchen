"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  paymentMethod: "manual",
  payByDate: "",

  name: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  deliveryNotes: "",

  saveContactInfo: false,
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: "chef-rahs-checkout",
      version: 2,
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<CheckoutState>;

        return {
          ...current,
          ...persistedState,
          details: {
            ...defaultCheckout,
            ...persistedState.details,
            saveContactInfo:
              persistedState.details?.saveContactInfo ?? false,
          },
        };
      },
    },
  ),
);