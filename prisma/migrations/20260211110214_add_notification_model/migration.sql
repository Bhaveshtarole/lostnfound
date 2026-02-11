/*
  Warnings:

  - You are about to drop the column `brand` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Item` table. All the data in the column will be lost.
  - Made the column `proofDescription` on table `Claim` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `Item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `Report` required. This step will fail if there are existing NULL values in that column.
  - Made the column `date` on table `Report` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Claim" ALTER COLUMN "proofDescription" SET NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "brand",
DROP COLUMN "color",
ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "Report" ALTER COLUMN "location" SET NOT NULL,
ALTER COLUMN "date" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AppNotification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppNotification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AppNotification" ADD CONSTRAINT "AppNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
