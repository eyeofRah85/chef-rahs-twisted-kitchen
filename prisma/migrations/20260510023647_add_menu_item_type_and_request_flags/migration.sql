-- CreateEnum
CREATE TYPE "MenuItemType" AS ENUM ('PLATE', 'A_LA_CARTE', 'MEAL_PLAN', 'CATERING', 'DESSERT', 'SIDE', 'OTHER');

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "customerInstructionsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" "MenuItemType" NOT NULL DEFAULT 'PLATE';
