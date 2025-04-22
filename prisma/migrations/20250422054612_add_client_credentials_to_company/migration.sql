/*
  Warnings:

  - A unique constraint covering the columns `[clientId]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Company` ADD COLUMN `clientId` VARCHAR(191) NULL,
    ADD COLUMN `clientSecret` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Company_clientId_key` ON `Company`(`clientId`);
