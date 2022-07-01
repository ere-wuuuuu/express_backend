/*
  Warnings:

  - Made the column `profile_picture` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "profile_picture" SET NOT NULL,
ALTER COLUMN "profile_picture" SET DEFAULT E'default.png';
