export type Allergen = {
  id: string;
  name: string;
};

export type MenuItemOptionChoice = {
  id: string;
  name: string;
  priceDelta: number;
};

export type MenuItemOptionGroup = {
  id: string;
  name: string;
  required: boolean;
  multiple: boolean;
  choices: MenuItemOptionChoice[];
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  available: boolean;
  seasonal?: boolean;
  allergens?: Allergen[];
  optionGroups?: MenuItemOptionGroup[];
};