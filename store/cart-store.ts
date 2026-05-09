"use client";

import { create } from "zustand";
import type { MenuItem } from "@/types/menu";

export type CartItem = {
  cartId: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  selectedOptions?: string[];
  allergyNotes?: string;
  substitutionPreference?: string;
};

type CartState = {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (cartId: string) => void;
  increaseQuantity: (cartId: string) => void;
  decreaseQuantity: (cartId: string) => void;
  clearCart: () => void;
  subtotal: () => number;
  itemCount: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) => {
    const cartItem: CartItem = {
      cartId: crypto.randomUUID(),
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      category: item.category,
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
    get().items.reduce((total, item) => total + item.price * item.quantity, 0),

  itemCount: () =>
    get().items.reduce((total, item) => total + item.quantity, 0),
}));