-- CreateTable
CREATE TABLE `CateringRequest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `eventDate` DATETIME(3) NULL,
    `eventType` VARCHAR(191) NULL,
    `guestCount` INTEGER NULL,
    `location` VARCHAR(191) NULL,
    `requestedMenu` VARCHAR(191) NULL,
    `allergyNotes` VARCHAR(191) NULL,
    `specialRequests` VARCHAR(191) NULL,
    `status` ENUM('NEW', 'REVIEWING', 'QUOTED', 'APPROVED', 'DEPOSIT_DUE', 'DEPOSIT_PAID', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'NEW',
    `estimatedTotal` DECIMAL(10, 2) NULL,
    `depositAmount` DECIMAL(10, 2) NULL,
    `depositPaidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `approvalStatus` ENUM('PENDING', 'APPROVED', 'DENIED') NOT NULL DEFAULT 'PENDING',
    `approvalNote` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `deniedAt` DATETIME(3) NULL,
    `requestType` ENUM('CATERING', 'PERSONAL_CHEF') NOT NULL DEFAULT 'CATERING',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerified` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NULL,
    `role` ENUM('CUSTOMER', 'ADMIN', 'OWNER') NOT NULL DEFAULT 'CUSTOMER',
    `phone` VARCHAR(191) NULL,
    `addressLine1` VARCHAR(191) NULL,
    `addressLine2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NULL,
    `deliveryNotes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` VARCHAR(191) NULL,
    `access_token` VARCHAR(191) NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` VARCHAR(191) NULL,
    `session_state` VARCHAR(191) NULL,

    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VerificationToken_token_key`(`token`),
    UNIQUE INDEX `VerificationToken_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MenuCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MenuCategory_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MenuItem` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `available` BOOLEAN NOT NULL DEFAULT true,
    `seasonal` BOOLEAN NOT NULL DEFAULT false,
    `imageUrl` VARCHAR(191) NULL,
    `type` ENUM('PLATE', 'A_LA_CARTE', 'MEAL_PLAN', 'CATERING', 'DESSERT', 'SIDE', 'OTHER') NOT NULL DEFAULT 'PLATE',
    `requiresApproval` BOOLEAN NOT NULL DEFAULT false,
    `customerInstructionsEnabled` BOOLEAN NOT NULL DEFAULT false,
    `categoryId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `archived` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GalleryImage` (
    `id` VARCHAR(191) NOT NULL,
    `src` VARCHAR(191) NOT NULL,
    `alt` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GalleryImage_category_sortOrder_idx`(`category`, `sortOrder`),
    INDEX `GalleryImage_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Allergen` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Allergen_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MenuItemAllergen` (
    `id` VARCHAR(191) NOT NULL,
    `menuItemId` VARCHAR(191) NOT NULL,
    `allergenId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `MenuItemAllergen_menuItemId_allergenId_key`(`menuItemId`, `allergenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MenuItemOptionGroup` (
    `id` VARCHAR(191) NOT NULL,
    `menuItemId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `required` BOOLEAN NOT NULL DEFAULT false,
    `multiple` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MenuItemOptionChoice` (
    `id` VARCHAR(191) NOT NULL,
    `optionGroupId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `dietaryInfo` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `requestOnly` BOOLEAN NOT NULL DEFAULT false,
    `priceDelta` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WeeklyMenuPeriod` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `orderCutoffAt` DATETIME(3) NULL,
    `fulfillmentNotes` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `capacity` INTEGER NOT NULL DEFAULT 10,
    `ordersPlaced` INTEGER NOT NULL DEFAULT 0,
    `cloneSourceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WeeklyMenuPeriod_status_startDate_endDate_idx`(`status`, `startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WeeklyMealPlanPackage` (
    `id` VARCHAR(191) NOT NULL,
    `periodId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `days` INTEGER NOT NULL,
    `mealsPerDay` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `available` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WeeklyMealPlanPackage_periodId_available_displayOrder_idx`(`periodId`, `available`, `displayOrder`),
    UNIQUE INDEX `WeeklyMealPlanPackage_periodId_days_mealsPerDay_key`(`periodId`, `days`, `mealsPerDay`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WeeklyMealPlanOffering` (
    `id` VARCHAR(191) NOT NULL,
    `periodId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `dietaryInfo` VARCHAR(191) NULL,
    `available` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WeeklyMealPlanOffering_periodId_available_displayOrder_idx`(`periodId`, `available`, `displayOrder`),
    UNIQUE INDEX `WeeklyMealPlanOffering_periodId_name_key`(`periodId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AllergenWeeklyMealPlanOffering` (
    `id` VARCHAR(191) NOT NULL,
    `offeringId` VARCHAR(191) NOT NULL,
    `allergenId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `AllergenWeeklyMealPlanOffering_offeringId_allergenId_key`(`offeringId`, `allergenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WeeklyMealPlanAllowedOption` (
    `id` VARCHAR(191) NOT NULL,
    `offeringId` VARCHAR(191) NOT NULL,
    `optionType` ENUM('SPICE_LEVEL', 'PROTEIN_SUBSTITUTION') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `dietaryInfo` VARCHAR(191) NULL,
    `priceDelta` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `requestOnly` BOOLEAN NOT NULL DEFAULT false,
    `requiresApproval` BOOLEAN NOT NULL DEFAULT false,
    `available` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WeeklyMealPlanAllowedOption_offeringId_optionType_displayOrd_idx`(`offeringId`, `optionType`, `displayOrder`),
    UNIQUE INDEX `WeeklyMealPlanAllowedOption_offeringId_optionType_name_key`(`offeringId`, `optionType`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `deliveryName` VARCHAR(191) NULL,
    `deliveryPhone` VARCHAR(191) NULL,
    `deliveryAddressLine1` VARCHAR(191) NULL,
    `deliveryAddressLine2` VARCHAR(191) NULL,
    `deliveryCity` VARCHAR(191) NULL,
    `deliveryState` VARCHAR(191) NULL,
    `deliveryPostalCode` VARCHAR(191) NULL,
    `deliveryNotes` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NULL,
    `orderType` ENUM('DELIVERY', 'PICKUP', 'CATERING') NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `requestedDateTime` DATETIME(3) NULL,
    `allergyNotes` VARCHAR(191) NULL,
    `substitutionPreference` VARCHAR(191) NULL,
    `allergenAcknowledged` BOOLEAN NOT NULL DEFAULT false,
    `allergenAcknowledgedAt` DATETIME(3) NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `deliveryFee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `lateFee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `tipAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL,
    `payByDate` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `paymentProvider` VARCHAR(191) NULL,
    `paymentStatus` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `approvalStatus` ENUM('PENDING', 'APPROVED', 'DENIED') NOT NULL DEFAULT 'PENDING',
    `approvalNote` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `deniedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `menuItemId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `lineTotal` DECIMAL(10, 2) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `allergenAcknowledged` BOOLEAN NOT NULL DEFAULT false,
    `allergenAcknowledgedAt` DATETIME(3) NULL,
    `allergenConflictSnapshot` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderWeeklyMealPlanSelection` (
    `id` VARCHAR(191) NOT NULL,
    `orderItemId` VARCHAR(191) NOT NULL,
    `weeklyMenuPeriodId` VARCHAR(191) NULL,
    `weeklyMealPlanPackageId` VARCHAR(191) NULL,
    `weeklyMealPlanOfferingId` VARCHAR(191) NULL,
    `periodLabel` VARCHAR(191) NOT NULL,
    `packageName` VARCHAR(191) NOT NULL,
    `packageDays` INTEGER NOT NULL,
    `packageMealsPerDay` INTEGER NOT NULL,
    `packagePrice` DECIMAL(10, 2) NOT NULL,
    `offeringName` VARCHAR(191) NOT NULL,
    `spiceLevel` VARCHAR(191) NULL,
    `proteinSubstitution` VARCHAR(191) NULL,
    `requestOnly` BOOLEAN NOT NULL DEFAULT false,
    `requiresApproval` BOOLEAN NOT NULL DEFAULT false,
    `priceDelta` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `OrderWeeklyMealPlanSelection_orderItemId_key`(`orderItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderStatusHistory` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED', 'REFUNDED') NOT NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BusinessSettings` (
    `id` VARCHAR(191) NOT NULL,
    `deliveryFee` DECIMAL(10, 2) NOT NULL DEFAULT 10,
    `lateFee` DECIMAL(10, 2) NOT NULL DEFAULT 10,
    `cateringDepositPercent` INTEGER NOT NULL DEFAULT 50,
    `orderCutoffDay` INTEGER NOT NULL DEFAULT 4,
    `orderCutoffHour` INTEGER NOT NULL DEFAULT 17,
    `orderCutoffMinute` INTEGER NOT NULL DEFAULT 0,
    `noWeekendOrdering` BOOLEAN NOT NULL DEFAULT true,
    `deliveryArea` VARCHAR(191) NULL DEFAULT 'Greater Atlanta area',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserAllergen` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `allergenId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UserAllergen_userId_allergenId_key`(`userId`, `allergenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `actorUserId` VARCHAR(191) NULL,
    `actorEmail` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AdminAuditLog_action_createdAt_idx`(`action`, `createdAt`),
    INDEX `AdminAuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `AdminAuditLog_actorUserId_createdAt_idx`(`actorUserId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CateringRequest` ADD CONSTRAINT `CateringRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MenuItem` ADD CONSTRAINT `MenuItem_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `MenuCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MenuItemAllergen` ADD CONSTRAINT `MenuItemAllergen_menuItemId_fkey` FOREIGN KEY (`menuItemId`) REFERENCES `MenuItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MenuItemAllergen` ADD CONSTRAINT `MenuItemAllergen_allergenId_fkey` FOREIGN KEY (`allergenId`) REFERENCES `Allergen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MenuItemOptionGroup` ADD CONSTRAINT `MenuItemOptionGroup_menuItemId_fkey` FOREIGN KEY (`menuItemId`) REFERENCES `MenuItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MenuItemOptionChoice` ADD CONSTRAINT `MenuItemOptionChoice_optionGroupId_fkey` FOREIGN KEY (`optionGroupId`) REFERENCES `MenuItemOptionGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeeklyMenuPeriod` ADD CONSTRAINT `WeeklyMenuPeriod_cloneSourceId_fkey` FOREIGN KEY (`cloneSourceId`) REFERENCES `WeeklyMenuPeriod`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeeklyMealPlanPackage` ADD CONSTRAINT `WeeklyMealPlanPackage_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `WeeklyMenuPeriod`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeeklyMealPlanOffering` ADD CONSTRAINT `WeeklyMealPlanOffering_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `WeeklyMenuPeriod`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AllergenWeeklyMealPlanOffering` ADD CONSTRAINT `AllergenWeeklyMealPlanOffering_offeringId_fkey` FOREIGN KEY (`offeringId`) REFERENCES `WeeklyMealPlanOffering`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AllergenWeeklyMealPlanOffering` ADD CONSTRAINT `AllergenWeeklyMealPlanOffering_allergenId_fkey` FOREIGN KEY (`allergenId`) REFERENCES `Allergen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeeklyMealPlanAllowedOption` ADD CONSTRAINT `WeeklyMealPlanAllowedOption_offeringId_fkey` FOREIGN KEY (`offeringId`) REFERENCES `WeeklyMealPlanOffering`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_menuItemId_fkey` FOREIGN KEY (`menuItemId`) REFERENCES `MenuItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderWeeklyMealPlanSelection` ADD CONSTRAINT `OrderWeeklyMealPlanSelection_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderWeeklyMealPlanSelection` ADD CONSTRAINT `OrderWeeklyMealPlanSelection_weeklyMenuPeriodId_fkey` FOREIGN KEY (`weeklyMenuPeriodId`) REFERENCES `WeeklyMenuPeriod`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderWeeklyMealPlanSelection` ADD CONSTRAINT `OrderWeeklyMealPlanSelection_weeklyMealPlanPackageId_fkey` FOREIGN KEY (`weeklyMealPlanPackageId`) REFERENCES `WeeklyMealPlanPackage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderWeeklyMealPlanSelection` ADD CONSTRAINT `OrderWeeklyMealPlanSelection_weeklyMealPlanOfferingId_fkey` FOREIGN KEY (`weeklyMealPlanOfferingId`) REFERENCES `WeeklyMealPlanOffering`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderStatusHistory` ADD CONSTRAINT `OrderStatusHistory_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAllergen` ADD CONSTRAINT `UserAllergen_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAllergen` ADD CONSTRAINT `UserAllergen_allergenId_fkey` FOREIGN KEY (`allergenId`) REFERENCES `Allergen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
