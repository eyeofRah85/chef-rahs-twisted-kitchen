-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "allergenAcknowledged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allergenAcknowledgedAt" TIMESTAMP(3);
