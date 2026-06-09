-- CreateTable
CREATE TABLE "GalleryImage" (
    "id" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GalleryImage_category_sortOrder_idx" ON "GalleryImage"("category", "sortOrder");

-- CreateIndex
CREATE INDEX "GalleryImage_sortOrder_idx" ON "GalleryImage"("sortOrder");

-- Seed current static gallery entries so the admin manager starts with the public gallery.
INSERT INTO "GalleryImage" ("id", "src", "alt", "title", "category", "sortOrder", "updatedAt")
VALUES
  ('gallery_img_1416', '/gallery/webp/IMG_1416.webp', 'Chicken and broccoli meal prep with scallions', 'Chicken and Broccoli Meal Prep', 'Meal Prep', 10, CURRENT_TIMESTAMP),
  ('gallery_img_1417', '/gallery/webp/IMG_1417.webp', 'Tomato braised meal prep with herbs and cheese', 'Tomato Braised Meal Prep', 'Meal Prep', 20, CURRENT_TIMESTAMP),
  ('gallery_img_1469', '/gallery/webp/IMG_1469.webp', 'Salmon meal prep over rice and vegetables', 'Salmon Rice Bowl', 'Meal Prep', 30, CURRENT_TIMESTAMP),
  ('gallery_img_1471', '/gallery/webp/IMG_1471.webp', 'Savory meal prep with rice, jalapenos, and sauce', 'Savory Rice Meal', 'Meal Prep', 40, CURRENT_TIMESTAMP),
  ('gallery_img_1490', '/gallery/webp/IMG_1490.webp', 'Barbecue chicken meal prep with vegetables', 'Barbecue Chicken Meal Prep', 'Meal Prep', 50, CURRENT_TIMESTAMP),
  ('gallery_img_1546', '/gallery/webp/IMG_1546.webp', 'Rice bowl with chicken, chickpeas, and herbs', 'Chicken Rice Bowl', 'Meal Prep', 60, CURRENT_TIMESTAMP),
  ('gallery_img_1550', '/gallery/webp/IMG_1550.webp', 'Meal prep plate with beans, rice, and lime', 'Rice and Bean Meal Prep', 'Meal Prep', 70, CURRENT_TIMESTAMP),
  ('gallery_img_1420', '/gallery/webp/IMG_1420.webp', 'Stuffed peppers topped with tomato and cheese', 'Stuffed Pepper Meal', 'Meal Plans', 80, CURRENT_TIMESTAMP),
  ('gallery_img_1487', '/gallery/webp/IMG_1487.webp', 'Salmon meal with broccoli and rice', 'Salmon and Broccoli Plate', 'Meal Plans', 90, CURRENT_TIMESTAMP),
  ('gallery_img_1491', '/gallery/webp/IMG_1491.webp', 'Meal prep plate with rice and a pastry', 'Seasonal Meal Prep Plate', 'Meal Plans', 100, CURRENT_TIMESTAMP),
  ('gallery_img_1535', '/gallery/webp/IMG_1535.webp', 'Grilled chicken plate with greens', 'Grilled Chicken Plate', 'Meal Plans', 110, CURRENT_TIMESTAMP),
  ('gallery_img_1428', '/gallery/webp/IMG_1428.webp', 'Stuffed peppers prepared on a catering tray', 'Stuffed Pepper Tray', 'Catering', 120, CURRENT_TIMESTAMP),
  ('gallery_img_1429', '/gallery/webp/IMG_1429.webp', 'Close-up of stuffed peppers with savory filling', 'Savory Stuffed Peppers', 'Catering', 130, CURRENT_TIMESTAMP),
  ('gallery_img_1432', '/gallery/webp/IMG_1432.webp', 'Crab cake meal with lemon garnish', 'Crab Cake Plate', 'Personal Chef', 140, CURRENT_TIMESTAMP),
  ('gallery_img_1478', '/gallery/webp/IMG_1478.webp', 'Shrimp saute with vegetables in a bowl', 'Shrimp Saute', 'Personal Chef', 150, CURRENT_TIMESTAMP),
  ('gallery_img_1481', '/gallery/webp/IMG_1481.webp', 'Shrimp pasta with grated cheese', 'Shrimp Pasta', 'Personal Chef', 160, CURRENT_TIMESTAMP),
  ('gallery_img_1544', '/gallery/webp/IMG_1544.webp', 'Composed plate with greens, mash, and braised meat', 'Composed Dinner Plate', 'Personal Chef', 170, CURRENT_TIMESTAMP);
