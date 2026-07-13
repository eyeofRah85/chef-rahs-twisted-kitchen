ALTER TABLE `BusinessSettings`
  MODIFY COLUMN `weeklyFixedFulfillmentHour` INTEGER NULL,
  MODIFY COLUMN `weeklyFixedFulfillmentMinute` INTEGER NULL,
  MODIFY COLUMN `weeklyFixedFulfillmentMessage` VARCHAR(191) NULL DEFAULT 'Weekly meal plan orders are delivered on Sunday. You will be notified when delivery is scheduled.';

UPDATE `BusinessSettings`
SET
  `weeklyFixedFulfillmentHour` = NULL,
  `weeklyFixedFulfillmentMinute` = NULL,
  `weeklyFixedFulfillmentMessage` = CASE
    WHEN `weeklyFixedFulfillmentMessage` IS NULL
      OR `weeklyFixedFulfillmentMessage` = ''
      OR `weeklyFixedFulfillmentMessage` = 'Weekly meal plan orders are delivered on Sunday.'
      THEN 'Weekly meal plan orders are delivered on Sunday. You will be notified when delivery is scheduled.'
    ELSE `weeklyFixedFulfillmentMessage`
  END
WHERE `weeklyFixedFulfillmentHour` = 12
  AND `weeklyFixedFulfillmentMinute` = 0;

UPDATE `WeeklyMenuPeriod`
SET `deliveryWindowLabel` = 'Weekly meal plan orders are delivered on Sunday. You will be notified when delivery is scheduled.'
WHERE `deliveryWindowLabel` LIKE 'Weekly meal plan orders are delivered on Sunday.%(%';
