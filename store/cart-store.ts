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

export type CartItem = {
  cartId: string;
  menuItemId: string;
  recoveredOrderItemId?: string;
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
              allergens: item.allergens ?? [],
            })) ?? [],
        };
      },
    },
  ),
);
