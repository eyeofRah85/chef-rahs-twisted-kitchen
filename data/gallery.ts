export type GalleryImage = {
  src: string;
  alt: string;
  title: string;
  category:
  | "Meal Prep"
  | "Meal Plans"
  | "Catering"
  | "Personal Chef"
  | "Behind the Scenes";
};

export const galleryImages: GalleryImage[] = [
  {
    src: "/gallery/meal-prep-1.jpg",
    alt: "Prepared meal prep containers",
    title: "Meal Prep",
    category: "Meal Prep",
  },
  {
    src: "/gallery/meal-plan-1.jpg",
    alt: "Chef-prepared meal plan option",
    title: "Meal Plan Option",
    category: "Meal Plans",
  },
  {
    src: "/gallery/catering-1.jpg",
    alt: "Catering food setup",
    title: "Catering Setup",
    category: "Catering",
  },
  {
    src: "/gallery/personal-chef-1.jpg",
    alt: "Private chef prepared meal",
    title: "Personal Chef Service",
    category: "Personal Chef",
  },
];

