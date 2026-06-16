-- CreateEnum
CREATE TYPE "WeeklyMenuStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WeeklyMealPlanOptionType" AS ENUM ('SPICE_LEVEL', 'PROTEIN_SUBSTITUTION');

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "allergenAcknowledged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allergenAcknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "allergenConflictSnapshot" JSONB;

-- CreateTable
CREATE TABLE "WeeklyMenuPeriod" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "orderCutoffAt" TIMESTAMP(3),
    "fulfillmentNotes" TEXT,
    "status" "WeeklyMenuStatus" NOT NULL DEFAULT 'DRAFT',
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "ordersPlaced" INTEGER NOT NULL DEFAULT 0,
    "cloneSourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyMenuPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyMealPlanPackage" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "mealsPerDay" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyMealPlanPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyMealPlanOffering" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "dietaryInfo" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyMealPlanOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllergenWeeklyMealPlanOffering" (
    "id" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "allergenId" TEXT NOT NULL,

    CONSTRAINT "AllergenWeeklyMealPlanOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyMealPlanAllowedOption" (
    "id" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "optionType" "WeeklyMealPlanOptionType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dietaryInfo" TEXT,
    "priceDelta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "requestOnly" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyMealPlanAllowedOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderWeeklyMealPlanSelection" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "weeklyMenuPeriodId" TEXT,
    "weeklyMealPlanPackageId" TEXT,
    "weeklyMealPlanOfferingId" TEXT,
    "periodLabel" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "packageDays" INTEGER NOT NULL,
    "packageMealsPerDay" INTEGER NOT NULL,
    "packagePrice" DECIMAL(10,2) NOT NULL,
    "offeringName" TEXT NOT NULL,
    "spiceLevel" TEXT,
    "proteinSubstitution" TEXT,
    "requestOnly" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "priceDelta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderWeeklyMealPlanSelection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklyMenuPeriod_status_startDate_endDate_idx" ON "WeeklyMenuPeriod"("status", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "WeeklyMealPlanPackage_periodId_available_displayOrder_idx" ON "WeeklyMealPlanPackage"("periodId", "available", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyMealPlanPackage_periodId_days_mealsPerDay_key" ON "WeeklyMealPlanPackage"("periodId", "days", "mealsPerDay");

-- CreateIndex
CREATE INDEX "WeeklyMealPlanOffering_periodId_available_displayOrder_idx" ON "WeeklyMealPlanOffering"("periodId", "available", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyMealPlanOffering_periodId_name_key" ON "WeeklyMealPlanOffering"("periodId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AllergenWeeklyMealPlanOffering_offeringId_allergenId_key" ON "AllergenWeeklyMealPlanOffering"("offeringId", "allergenId");

-- CreateIndex
CREATE INDEX "WeeklyMealPlanAllowedOption_offeringId_optionType_displayOr_idx" ON "WeeklyMealPlanAllowedOption"("offeringId", "optionType", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyMealPlanAllowedOption_offeringId_optionType_name_key" ON "WeeklyMealPlanAllowedOption"("offeringId", "optionType", "name");

-- CreateIndex
CREATE UNIQUE INDEX "OrderWeeklyMealPlanSelection_orderItemId_key" ON "OrderWeeklyMealPlanSelection"("orderItemId");

-- AddForeignKey
ALTER TABLE "WeeklyMenuPeriod" ADD CONSTRAINT "WeeklyMenuPeriod_cloneSourceId_fkey" FOREIGN KEY ("cloneSourceId") REFERENCES "WeeklyMenuPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyMealPlanPackage" ADD CONSTRAINT "WeeklyMealPlanPackage_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "WeeklyMenuPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyMealPlanOffering" ADD CONSTRAINT "WeeklyMealPlanOffering_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "WeeklyMenuPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllergenWeeklyMealPlanOffering" ADD CONSTRAINT "AllergenWeeklyMealPlanOffering_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "WeeklyMealPlanOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllergenWeeklyMealPlanOffering" ADD CONSTRAINT "AllergenWeeklyMealPlanOffering_allergenId_fkey" FOREIGN KEY ("allergenId") REFERENCES "Allergen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyMealPlanAllowedOption" ADD CONSTRAINT "WeeklyMealPlanAllowedOption_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "WeeklyMealPlanOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderWeeklyMealPlanSelection" ADD CONSTRAINT "OrderWeeklyMealPlanSelection_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderWeeklyMealPlanSelection" ADD CONSTRAINT "OrderWeeklyMealPlanSelection_weeklyMenuPeriodId_fkey" FOREIGN KEY ("weeklyMenuPeriodId") REFERENCES "WeeklyMenuPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderWeeklyMealPlanSelection" ADD CONSTRAINT "OrderWeeklyMealPlanSelection_weeklyMealPlanPackageId_fkey" FOREIGN KEY ("weeklyMealPlanPackageId") REFERENCES "WeeklyMealPlanPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderWeeklyMealPlanSelection" ADD CONSTRAINT "OrderWeeklyMealPlanSelection_weeklyMealPlanOfferingId_fkey" FOREIGN KEY ("weeklyMealPlanOfferingId") REFERENCES "WeeklyMealPlanOffering"("id") ON DELETE SET NULL ON UPDATE CASCADE;
