-- AlterTable
ALTER TABLE `ApiLog` ADD COLUMN `companyId` INTEGER NULL,
    ADD COLUMN `ipAddress` VARCHAR(191) NULL,
    ADD COLUMN `responseBody` TEXT NULL,
    ADD COLUMN `responseTime` INTEGER NULL,
    ADD COLUMN `userAgent` TEXT NULL;
