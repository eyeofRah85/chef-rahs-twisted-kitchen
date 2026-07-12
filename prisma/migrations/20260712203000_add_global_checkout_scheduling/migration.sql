ALTER TABLE `BusinessSettings`
  ADD COLUMN `checkoutCustomerSchedulingEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `checkoutFixedFulfillmentDay` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `checkoutFixedFulfillmentHour` INTEGER NOT NULL DEFAULT 12,
  ADD COLUMN `checkoutFixedFulfillmentMinute` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `checkoutFixedFulfillmentMessage` VARCHAR(191) NULL DEFAULT 'Orders are fulfilled on Sunday.';
