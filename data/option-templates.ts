export const optionGroupTemplates = [
  {
    name: "Substitution Options",
    required: false,
    multiple: true,
    choices: [
      { name: "3oz Protein", priceDelta: "2.00" },
      { name: "3oz Seafood", priceDelta: "3.50" },
      { name: "5oz Protein", priceDelta: "3.00" },
      { name: "5oz Seafood", priceDelta: "4.50" },
    ],
  },
  {
    name: "Spice Level",
    required: true,
    multiple: false,
    choices: [
      { name: "Mild", priceDelta: "0" },
      { name: "Medium", priceDelta: "0" },
      { name: "Hot", priceDelta: "0" },
    ],
  },
  {
    name: "Add-ons",
    required: false,
    multiple: true,
    choices: [
      { name: "Extra Sauce", priceDelta: "1.00" },
      { name: "Extra Side", priceDelta: "4.00" },
    ],
  },
  {
    name: "Sauce Choice",
    required: false,
    multiple: true,
    choices: [
      { name: "House Sauce", priceDelta: "0" },
      { name: "Garlic Butter", priceDelta: "1.00" },
      { name: "Spicy Sauce", priceDelta: "1.00" },
    ],
  },
  {
    name: "Side Choice",
    required: false,
    multiple: true,
    choices: [
      { name: "Mac", priceDelta: "0" },
      { name: "Rice", priceDelta: "0" },
      { name: "Vegetables", priceDelta: "0" },
    ],
  },
];