import type { MenuItem } from "@/types/menu";

export const menuItems: MenuItem[] = [
  {
    id: "twisted-chicken-plate",
    name: "Twisted Chicken Plate",
    description: "Seasoned chicken served with chef-selected sides.",
    price: 18,
    category: "Plates",
    available: true,
    seasonal: true,
    allergens: ["Dairy", "Wheat"],
    options: [
      {
        groupName: "Spice Level",
        required: true,
        choices: [
          { name: "Mild" },
          { name: "Medium" },
          { name: "Hot" },
        ],
      },
      {
        groupName: "Add-ons",
        choices: [
          { name: "Extra Sauce", priceDelta: 1 },
          { name: "Extra Side", priceDelta: 4 },
        ],
      },
    ],
  },
  {
    id: "a-la-carte-mac",
    name: "A La Carte Mac",
    description: "Single side portion of house mac.",
    price: 7,
    category: "A La Carte",
    available: true,
    allergens: ["Dairy", "Wheat"],
  },
  {
    id: "seasonal-dessert",
    name: "Seasonal Dessert",
    description: "Chef-selected seasonal dessert.",
    price: 6,
    category: "Desserts",
    available: false,
    seasonal: true,
    allergens: ["Dairy", "Egg", "Wheat"],
  },
];