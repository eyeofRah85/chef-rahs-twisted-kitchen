export type PublicWeeklyPackage = {
  id: string;
  name: string;
  days: number;
  mealsPerDay: number;
  price: number;
  requiresChefApproval: boolean;
  isSeasonal: boolean;
  mealSlotLabels: string[];
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
  breakfastOnly: boolean;
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
  orderingOpenAt: string | null;
  lateFeeStartsAt: string | null;
  orderingClosesAt: string | null;
  orderingOpenLabel: string | null;
  lateFeeStartsLabel: string | null;
  orderingClosesLabel: string | null;
  fixedFulfillmentAt: string | null;
  fixedFulfillmentLabel: string | null;
  deliveryWindowLabel: string | null;
  customerSchedulingEnabled: boolean;
  orderingStatus: "not_open" | "open" | "late" | "closed";
  orderingClosed: boolean;
  capacity: number;
  ordersPlaced: number;
  packages: PublicWeeklyPackage[];
  offerings: PublicWeeklyOffering[];
};
