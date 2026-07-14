ALTER TABLE `BusinessSettings`
  MODIFY COLUMN `checkoutFixedFulfillmentHour` INTEGER NULL,
  MODIFY COLUMN `checkoutFixedFulfillmentMinute` INTEGER NULL,
  MODIFY COLUMN `checkoutFixedFulfillmentMessage` VARCHAR(191) NULL DEFAULT 'Orders are fulfilled on Sunday. You will be notified when your order is scheduled.';

UPDATE `BusinessSettings`
SET
  `checkoutFixedFulfillmentHour` = NULL,
  `checkoutFixedFulfillmentMinute` = NULL,
  `checkoutFixedFulfillmentMessage` = CASE
    WHEN `checkoutFixedFulfillmentMessage` IS NULL
      OR `checkoutFixedFulfillmentMessage` = ''
      OR `checkoutFixedFulfillmentMessage` = 'Orders are fulfilled on Sunday.'
      THEN 'Orders are fulfilled on Sunday. You will be notified when your order is scheduled.'
    ELSE `checkoutFixedFulfillmentMessage`
  END
WHERE `checkoutFixedFulfillmentHour` = 12
  AND `checkoutFixedFulfillmentMinute` = 0;
