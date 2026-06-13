export type PublicWeeklyPackage = {
  id: string;
  name: string;
  days: number;
  mealsPerDay: number;
  price: number;
  notes: string | null;
};

export type PublicWeeklyOption = {
  id: string;
  optionType: string;
  name: string;
  description: string | null;
  dietaryInfo: string | null;
  priceDelta: number;
  requestOnly: boolean;
  requiresApproval: boolean;
};

export type PublicWeeklyOffering = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  dietaryInfo: string | null;
  allergens: {
    id: string;
    name: string;
  }[];
  options: PublicWeeklyOption[];
};

export type PublicWeeklyMenu = {
  id: string;
  label: string;
  dateRange: string;
  orderCutoffLabel: string | null;
  orderingClosed: boolean;
  capacity: number;
  ordersPlaced: number;
  packages: PublicWeeklyPackage[];
  offerings: PublicWeeklyOffering[];
};
