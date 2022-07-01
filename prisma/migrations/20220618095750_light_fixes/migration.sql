/*
  Warnings:

  - Added the required column `key` to the `confirmation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "confirmation" ADD COLUMN     "key" TEXT NOT NULL;
