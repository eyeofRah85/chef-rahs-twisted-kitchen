-- CreateEnum
CREATE TYPE "CateringStatus" AS ENUM ('NEW', 'REVIEWING', 'QUOTED', 'APPROVED', 'DEPOSIT_DUE', 'DEPOSIT_PAID', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "CateringRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "eventDate" TIMESTAMP(3),
    "eventType" TEXT,
    "guestCount" INTEGER,
    "location" TEXT,
    "requestedMenu" TEXT,
    "allergyNotes" TEXT,
    "specialRequests" TEXT,
    "status" "CateringStatus" NOT NULL DEFAULT 'NEW',
    "estimatedTotal" DECIMAL(10,2),
    "depositAmount" DECIMAL(10,2),
    "depositPaidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CateringRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CateringRequest" ADD CONSTRAINT "CateringRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
