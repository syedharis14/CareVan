/*
  Warnings:

  - Added the required column `type` to the `AlertLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('BOARDED', 'DROPPED', 'REACHED_SCHOOL', 'REACHED_HOME', 'OVERSPEED', 'SOS');

-- AlterTable
ALTER TABLE "AlertLog" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "errorDetail" TEXT,
ADD COLUMN     "pushTicketId" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "type" "AlertType" NOT NULL;
