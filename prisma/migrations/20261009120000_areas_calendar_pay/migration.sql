CREATE TYPE "AreaStatus" AS ENUM ('ACTIVE', 'COMING_SOON');

ALTER TABLE "Location"
  ADD COLUMN "status" "AreaStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "officeAddress" TEXT,
  ADD COLUMN "boundary" JSONB;

ALTER TABLE "TeacherProfile"
  ADD COLUMN "googleCalendarEmail" TEXT,
  ADD COLUMN "payRateOre" INTEGER;

ALTER TABLE "Product"
  ADD COLUMN "bestSeller" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Booking"
  ADD COLUMN "googleEventId" TEXT,
  ADD COLUMN "googleSyncedAt" TIMESTAMP(3);
