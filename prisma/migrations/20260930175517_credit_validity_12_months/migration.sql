-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "creditValidDays" SET DEFAULT 365;

UPDATE "Product" SET "creditValidDays" = 365;
