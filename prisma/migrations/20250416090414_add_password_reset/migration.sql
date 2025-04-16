/*
  Warnings:

  - A unique constraint covering the columns `[passwordResetToken]` on the table `UserMysql` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `UserMysql` ADD COLUMN `passwordResetExpires` DATETIME(3) NULL,
    ADD COLUMN `passwordResetToken` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `UserMysql_passwordResetToken_key` ON `UserMysql`(`passwordResetToken`);
