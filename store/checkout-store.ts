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

  updateContactDetails: (details: Partial<CheckoutContactDetails>) => void;
  resetContactDetails: () => void;
  resetCheckout: () => void;
};

type CheckoutContactDetails = Pick<
  CheckoutDetails,
  | "name"
  | "email"
  | "phone"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "state"
  | "postalCode"
  | "deliveryNotes"
  | "saveContactInfo"
>;

const emptyContactDetails: CheckoutContactDetails = {
  name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  deliveryNotes: "",
  saveContactInfo: false,
};

const transientCheckoutDetails: Pick<
  CheckoutDetails,
  keyof CheckoutContactDetails | "allergenAcknowledged"
> = {
  ...emptyContactDetails,
  allergenAcknowledged: false,
};

const defaultCheckout: CheckoutDetails = {
  orderType: "delivery",
  requestedDateTime: "",
  allergyNotes: "",
  allergenAcknowledged: false,
  substitutionPreference: "",
  tipType: "none",
  customTipAmount: 0,
  paymentMethod: "manual",
  payByDate: "",

  ...emptyContactDetails,
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

      updateContactDetails: (contactDetails) =>
        set((state) => ({
          details: {
            ...state.details,
            ...contactDetails,
          },
        })),

      resetContactDetails: () =>
        set((state) => ({
          details: {
            ...state.details,
            ...emptyContactDetails,
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
      partialize: (state) => ({
        ...state,
        details: {
          ...state.details,
          ...transientCheckoutDetails,
        },
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<CheckoutState>;

        return {
          ...current,
          ...persistedState,
          details: {
            ...defaultCheckout,
            ...persistedState.details,
            ...transientCheckoutDetails,
          },
        };
      },
    },
  ),
);
