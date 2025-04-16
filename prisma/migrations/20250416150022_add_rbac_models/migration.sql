/*
  Warnings:

  - You are about to drop the column `role` on the `UserMysql` table. All the data in the column will be lost.
  - Added the required column `roleId` to the `UserMysql` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE `Company` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Company_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `Role_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `Permission_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_RolePermissions` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_RolePermissions_AB_unique`(`A`, `B`),
    INDEX `_RolePermissions_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

/* --- EDIT START --- */
-- Insert default roles FIRST
-- (Ensure these match the roles you intend to use)
INSERT INTO `Role` (`name`, `description`) VALUES ('CUSTOMER', 'Default role for application users');
INSERT INTO `Role` (`name`, `description`) VALUES ('COMPANY_ADMIN', 'Administrator for a specific company');
INSERT INTO `Role` (`name`, `description`) VALUES ('MARKETING_STAFF', 'Marketing staff for a specific company');
-- Tambahkan peran default lain jika ada

-- AlterTable UserMysql: Add roleId as NULLABLE first
ALTER TABLE `UserMysql` DROP COLUMN `role`,
    ADD COLUMN `companyId` INTEGER NULL,
    ADD COLUMN `roleId` INTEGER NULL; -- Initially NULLABLE

-- Update existing users to have the default CUSTOMER role ID
-- Make sure 'CUSTOMER' role exists from the INSERT above and the subquery returns a valid ID
UPDATE `UserMysql` SET `roleId` = (SELECT `id` FROM `Role` WHERE `name` = 'CUSTOMER' LIMIT 1) WHERE `roleId` IS NULL;

-- Now make roleId NOT NULL
ALTER TABLE `UserMysql` MODIFY COLUMN `roleId` INTEGER NOT NULL;
/* --- EDIT END --- */

-- AddForeignKey constraints (These should now work as roleId is populated with valid IDs)
ALTER TABLE `UserMysql` ADD CONSTRAINT `UserMysql_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `UserMysql` ADD CONSTRAINT `UserMysql_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey for _RolePermissions (unchanged)
ALTER TABLE `_RolePermissions` ADD CONSTRAINT `_RolePermissions_A_fkey` FOREIGN KEY (`A`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `_RolePermissions` ADD CONSTRAINT `_RolePermissions_B_fkey` FOREIGN KEY (`B`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
