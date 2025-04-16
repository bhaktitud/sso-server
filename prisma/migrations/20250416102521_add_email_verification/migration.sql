/*
  Warnings:

  - A unique constraint covering the columns `[emailVerificationToken]` on the table `UserMysql` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `UserMysql` ADD COLUMN `emailVerificationToken` VARCHAR(191) NULL,
    ADD COLUMN `isEmailVerified` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `UserMysql_emailVerificationToken_key` ON `UserMysql`(`emailVerificationToken`);
