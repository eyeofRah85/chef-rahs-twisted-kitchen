-- AlterTable
ALTER TABLE `OrderWeeklyMealPlanSelection` ADD COLUMN `packageIsSeasonal` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `packageRequiresChefApproval` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `OrderWeeklyMealPlanSlotSelection` ADD COLUMN `mealLabel` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `WeeklyMealPlanPackage` ADD COLUMN `isSeasonal` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `mealSlotLabels` JSON NULL,
    ADD COLUMN `requiresChefApproval` BOOLEAN NOT NULL DEFAULT false;
