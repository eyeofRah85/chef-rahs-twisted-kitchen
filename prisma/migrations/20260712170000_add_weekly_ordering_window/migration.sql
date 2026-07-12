ALTER TABLE `WeeklyMenuPeriod`
  ADD COLUMN `orderingOpenAt` DATETIME(3) NULL,
  ADD COLUMN `lateFeeStartsAt` DATETIME(3) NULL,
  ADD COLUMN `orderingClosesAt` DATETIME(3) NULL,
  ADD COLUMN `fixedFulfillmentAt` DATETIME(3) NULL,
  ADD COLUMN `customerSchedulingEnabled` BOOLEAN NULL,
  ADD COLUMN `deliveryWindowLabel` VARCHAR(191) NULL;

ALTER TABLE `BusinessSettings`
  ADD COLUMN `weeklyCustomerSchedulingEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `weeklyOrderingOpenDay` INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN `weeklyOrderingOpenHour` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `weeklyOrderingOpenMinute` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `weeklyLateFeeStartDay` INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN `weeklyLateFeeStartHour` INTEGER NOT NULL DEFAULT 17,
  ADD COLUMN `weeklyLateFeeStartMinute` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `weeklyOrderingCloseDay` INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN `weeklyOrderingCloseHour` INTEGER NOT NULL DEFAULT 22,
  ADD COLUMN `weeklyOrderingCloseMinute` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `weeklyFixedFulfillmentDay` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `weeklyFixedFulfillmentHour` INTEGER NOT NULL DEFAULT 12,
  ADD COLUMN `weeklyFixedFulfillmentMinute` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `weeklyFixedFulfillmentMessage` VARCHAR(191) NULL DEFAULT 'Weekly meal plan orders are delivered on Sunday.';

UPDATE `WeeklyMenuPeriod`
SET `orderingClosesAt` = `orderCutoffAt`
WHERE `orderingClosesAt` IS NULL
  AND `orderCutoffAt` IS NOT NULL;
