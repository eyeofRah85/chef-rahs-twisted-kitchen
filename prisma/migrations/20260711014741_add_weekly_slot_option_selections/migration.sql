-- CreateTable
CREATE TABLE `OrderWeeklyMealPlanSlotOptionSelection` (
    `id` VARCHAR(191) NOT NULL,
    `orderWeeklyMealPlanSlotSelectionId` VARCHAR(191) NOT NULL,
    `weeklyMealPlanAllowedOptionId` VARCHAR(191) NULL,
    `optionType` ENUM('SPICE_LEVEL', 'PROTEIN_SUBSTITUTION') NOT NULL,
    `optionName` VARCHAR(191) NOT NULL,
    `optionDescription` VARCHAR(191) NULL,
    `dietaryInfo` VARCHAR(191) NULL,
    `priceDelta` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `requestOnly` BOOLEAN NOT NULL DEFAULT false,
    `requiresApproval` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderWeeklyMealPlanSlotOptionSelection_weeklyMealPlanAllowed_idx`(`weeklyMealPlanAllowedOptionId`),
    UNIQUE INDEX `OrderWeeklyMealPlanSlotOptionSelection_orderWeeklyMealPlanSl_key`(`orderWeeklyMealPlanSlotSelectionId`, `optionType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrderWeeklyMealPlanSlotOptionSelection` ADD CONSTRAINT `OrderWeeklyMealPlanSlotOptionSelection_orderWeeklyMealPlanS_fkey` FOREIGN KEY (`orderWeeklyMealPlanSlotSelectionId`) REFERENCES `OrderWeeklyMealPlanSlotSelection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderWeeklyMealPlanSlotOptionSelection` ADD CONSTRAINT `OrderWeeklyMealPlanSlotOptionSelection_weeklyMealPlanAllowe_fkey` FOREIGN KEY (`weeklyMealPlanAllowedOptionId`) REFERENCES `WeeklyMealPlanAllowedOption`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
