-- CreateEnum
CREATE TYPE "ServiceRequestType" AS ENUM ('CATERING', 'PERSONAL_CHEF');

-- AlterTable
ALTER TABLE "CateringRequest" ADD COLUMN     "requestType" "ServiceRequestType" NOT NULL DEFAULT 'CATERING';
