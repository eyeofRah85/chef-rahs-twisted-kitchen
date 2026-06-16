"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MenuItem } from "@/types/menu";

export type SelectedCartOption = {
  groupName: string;
  choiceName: string;
  priceDelta: number;
  requestOnly?: boolean;
};

export type CartItemAllergen = {
  id: string;
  name: string;
};

export type WeeklyMealPlanCartSelection = {
  weeklyMenuPeriodId: string;
  weeklyMealPlanPackageId: string;
  weeklyMealPlanOfferingId: string;
  spiceOptionId?: string | null;
  proteinSubstitutionOptionId?: string | null;
  periodLabel: string;
  packageName: string;
  packageDays: number;
  packageMealsPerDay: number;
  packagePrice: number;
  offeringName: string;
  spiceLevel?: string | null;
  spicePriceDelta?: number;
  proteinSubstitution?: string | null;
  proteinSubstitutionPriceDelta?: number;
  requestOnly?: boolean;
  requiresApproval?: boolean;
  priceDelta: number;
};

export type CartItem = {
  cartId: string;
  menuItemId?: string;
  recoveredOrderItemId?: string;
  weeklyMealPlanSelection?: WeeklyMealPlanCartSelection;
  name: string;
  price: number;
  quantity: number;
  category: string;
  allergens?: CartItemAllergen[];
  selectedOptions?: SelectedCartOption[];
  allergyNotes?: string;
  substitutionPreference?: string;
  customerInstructions?: string;
  requiresApproval?: boolean;
};

export type RecoveredOrderItem = {
  id: string;
  menuItemId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
};

type CartState = {
  items: CartItem[];
  addItem: (
    item: MenuItem,
    selectedOptions?: SelectedCartOption[],
    customerInstructions?: string,
  ) => void;
  addWeeklyMealPlan: (
    selection: WeeklyMealPlanCartSelection,
    allergens?: CartItemAllergen[],
  ) => void;
  removeItem: (cartId: string) => void;
  increaseQuantity: (cartId: string) => void;
  decreaseQuantity: (cartId: string) => void;
  clearCart: () => void;
  subtotal: () => number;
  itemCount: () => number;
  addRecoveredItem: (item: RecoveredOrderItem) => void;
};

type PersistedCartState = Pick<CartState, "items">;

const cartStorageVersion = 3;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addRecoveredItem: (item) => {
        set((state) => ({
          items: [
            ...state.items,
            {
              cartId: crypto.randomUUID(),
              recoveredOrderItemId: item.id,
              menuItemId: item.menuItemId ?? "",
              name: item.name,
              price: item.unitPrice,
              quantity: item.quantity,
              category: "Reorder",
              allergens: [],
              selectedOptions: item.notes
                ? [
                    {
                      groupName: "Previous Selections",
                      choiceName: item.notes,
                      priceDelta: 0,
                    },
                  ]
                : [],
            },
          ],
        }));
      },

      addItem: (item, selectedOptions = [], customerInstructions = "") => {
        const optionsTotal = selectedOptions.reduce(
          (total, option) => total + option.priceDelta,
          0,
        );

        const hasRequestOnlyOption = selectedOptions.some(
          (option) => option.requestOnly,
        );

        const cartItem: CartItem = {
          cartId: crypto.randomUUID(),
          menuItemId: item.id,
          name: item.name,
          price: item.price + optionsTotal,
          quantity: 1,
          category: item.category,
          allergens: item.allergens ?? [],
          selectedOptions,
          customerInstructions,
          requiresApproval: item.requiresApproval || hasRequestOnlyOption,
        };

        set((state) => ({
          items: [...state.items, cartItem],
        }));
      },

      addWeeklyMealPlan: (selection, allergens = []) => {
        const selectedOptions: SelectedCartOption[] = [
          {
            groupName: "Weekly Menu",
            choiceName: selection.periodLabel,
            priceDelta: 0,
          },
          {
            groupName: "Package",
            choiceName: selection.packageName,
            priceDelta: 0,
          },
          {
            groupName: "Offering",
            choiceName: selection.offeringName,
            priceDelta: 0,
          },
        ];

        if (selection.spiceLevel) {
          selectedOptions.push({
            groupName: "Spice Level",
            choiceName: selection.spiceLevel,
            priceDelta: selection.spicePriceDelta ?? 0,
          });
        }

        if (selection.proteinSubstitution) {
          selectedOptions.push({
            groupName: "Protein Substitution",
            choiceName: selection.requestOnly
              ? `${selection.proteinSubstitution} (Request Only)`
              : selection.proteinSubstitution,
            priceDelta: selection.proteinSubstitutionPriceDelta ?? 0,
            requestOnly: selection.requestOnly,
          });
        }

        const cartItem: CartItem = {
          cartId: crypto.randomUUID(),
          menuItemId: "",
          weeklyMealPlanSelection: selection,
          name: `${selection.packageName} - ${selection.offeringName}`,
          price: selection.packagePrice + selection.priceDelta,
          quantity: 1,
          category: "Weekly Meal Plan",
          allergens,
          selectedOptions,
          requiresApproval: Boolean(
            selection.requiresApproval || selection.requestOnly,
          ),
        };

        set((state) => ({
          items: [...state.items, cartItem],
        }));
      },

      removeItem: (cartId) => {
        set((state) => ({
          items: state.items.filter((item) => item.cartId !== cartId),
        }));
      },

      increaseQuantity: (cartId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.cartId === cartId
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        }));
      },

      decreaseQuantity: (cartId) => {
        set((state) => ({
          items: state.items
            .map((item) =>
              item.cartId === cartId
                ? { ...item, quantity: Math.max(0, item.quantity - 1) }
                : item,
            )
            .filter((item) => item.quantity > 0),
        }));
      },

      clearCart: () => set({ items: [] }),

      subtotal: () =>
        get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        ),

      itemCount: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),
    }),
    {
      name: "chef-rahs-cart",
      version: cartStorageVersion,
      partialize: (state): PersistedCartState => ({ items: state.items }),
      migrate: (): PersistedCartState => ({ items: [] }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<PersistedCartState>;

        return {
          ...current,
          ...persistedState,
          items:
            persistedState.items?.map((item) => ({
              ...item,
              menuItemId: item.menuItemId ?? "",
              allergens: item.allergens ?? [],
            })) ?? [],
        };
      },
    },
  ),
);
