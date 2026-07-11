-- CreateTable
CREATE TABLE `OrderWeeklyMealPlanSlotSelection` (
    `id` VARCHAR(191) NOT NULL,
    `orderWeeklyMealPlanSelectionId` VARCHAR(191) NOT NULL,
    `weeklyMealPlanOfferingId` VARCHAR(191) NULL,
    `dayNumber` INTEGER NOT NULL,
    `mealNumber` INTEGER NOT NULL,
    `offeringName` VARCHAR(191) NOT NULL,
    `offeringDescription` VARCHAR(191) NULL,
    `dietaryInfo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderWeeklyMealPlanSlotSelection_weeklyMealPlanOfferingId_idx`(`weeklyMealPlanOfferingId`),
    UNIQUE INDEX `OrderWeeklyMealPlanSlotSelection_orderWeeklyMealPlanSelectio_key`(`orderWeeklyMealPlanSelectionId`, `dayNumber`, `mealNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrderWeeklyMealPlanSlotSelection` ADD CONSTRAINT `OrderWeeklyMealPlanSlotSelection_orderWeeklyMealPlanSelecti_fkey` FOREIGN KEY (`orderWeeklyMealPlanSelectionId`) REFERENCES `OrderWeeklyMealPlanSelection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderWeeklyMealPlanSlotSelection` ADD CONSTRAINT `OrderWeeklyMealPlanSlotSelection_weeklyMealPlanOfferingId_fkey` FOREIGN KEY (`weeklyMealPlanOfferingId`) REFERENCES `WeeklyMealPlanOffering`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
