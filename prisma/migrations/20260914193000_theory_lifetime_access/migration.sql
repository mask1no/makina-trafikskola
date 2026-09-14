-- Digital theory becomes a one-time purchase. NULL expiresAt = lifetime access.
-- Products that previously set theoryDays now grant theory via includesTheory.

ALTER TABLE "Product" ADD COLUMN "includesTheory" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Product" SET "includesTheory" = true WHERE "theoryDays" IS NOT NULL;

ALTER TABLE "Product" DROP COLUMN "theoryDays";

ALTER TABLE "TheoryAccess" ALTER COLUMN "expiresAt" DROP NOT NULL;

UPDATE "TheoryAccess" SET "expiresAt" = NULL;
